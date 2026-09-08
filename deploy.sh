#!/usr/bin/env bash
set -euo pipefail

GRN='\033[0;32m'; YLW='\033[1;33m'; RED='\033[0;31m'; CYN='\033[0;36m'; RST='\033[0m'; BLD='\033[1m'
ok()   { echo -e "${GRN}✓${RST} $*"; }
info() { echo -e "${CYN}→${RST} $*"; }
warn() { echo -e "${YLW}!${RST} $*"; }
die()  { echo -e "${RED}✗ FATAL:${RST} $*" >&2; exit 1; }
step() { echo -e "\n${BLD}${CYN}[$1/8]${RST} ${BLD}$2${RST}"; }

ENV_FILE="$(dirname "$0")/.env"
[[ -f "$ENV_FILE" ]] || die ".env chưa có. Copy .env.example → .env rồi điền."
set -o allexport; source "$ENV_FILE"; set +o allexport

[[ -n "${CF_API_TOKEN:-}" ]]  || die "Thiếu CF_API_TOKEN"
[[ -n "${CF_ACCOUNT_ID:-}" ]] || die "Thiếu CF_ACCOUNT_ID"
[[ -n "${ADMIN_KEY:-}" ]]     || die "Thiếu ADMIN_KEY"
[[ "${ADMIN_KEY}" != "change_me_strong_key_here" ]] || die "Đổi ADMIN_KEY trong .env trước đã"

WORKER_NAME="${WORKER_NAME:-giapha-api}"
PAGES_PROJECT="${PAGES_PROJECT:-giapha}"
D1_DB_NAME="${D1_DB_NAME:-giapha-db}"
R2_BUCKET="${R2_BUCKET:-giapha-media}"

export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$SCRIPT_DIR"

echo -e "\n${BLD}${CYN}══ Deploy: $PAGES_PROJECT ══${RST}"
echo -e "Worker: ${CYN}$WORKER_NAME${RST} | D1: ${CYN}$D1_DB_NAME${RST} | R2: ${CYN}$R2_BUCKET${RST}"
echo -e "Domain: ${CYN}${DOMAIN:-"$PAGES_PROJECT.pages.dev"}${RST}\n"

step 1 "Kiểm tra Node.js"
command -v node >/dev/null 2>&1 || die "Chưa cài Node.js"
WRANGLER="npx --yes wrangler@latest"
ok "Node $(node --version)"

step 2 "Khởi tạo D1 + R2"
D1_LIST=$($WRANGLER d1 list --json 2>/dev/null || echo "[]")
D1_ID=$(node -e "
  try { const l=JSON.parse(process.argv[1]); const db=l.find(d=>d.name===process.argv[2]);
        process.stdout.write(db?(db.uuid||db.id||''):''); } catch(e){process.stdout.write('');}
" "$D1_LIST" "$D1_DB_NAME")

if [[ -z "$D1_ID" ]]; then
  info "Tạo D1..."
  CREATE_OUT=$($WRANGLER d1 create "$D1_DB_NAME" --json 2>/dev/null || echo "{}")
  D1_ID=$(node -e "try{const r=JSON.parse(process.argv[1]);process.stdout.write(r.uuid||r.id||'');}catch(e){process.stdout.write('');}" "$CREATE_OUT")
  [[ -n "$D1_ID" ]] || die "Không lấy được D1 ID. Kiểm tra CF_API_TOKEN."
  ok "Đã tạo D1: $D1_ID"
else
  ok "D1 đã có: $D1_ID"
fi

if $WRANGLER r2 bucket create "$R2_BUCKET" >/dev/null 2>&1; then ok "Đã tạo R2: $R2_BUCKET"
else ok "R2 đã có (hoặc bỏ qua): $R2_BUCKET"; fi

step 3 "Sinh wrangler.toml"
[[ -f "wrangler.toml.tpl" ]] || die "Thiếu wrangler.toml.tpl"
sed -e "s|__WORKER_NAME__|${WORKER_NAME}|g" \
    -e "s|__D1_DB_NAME__|${D1_DB_NAME}|g" \
    -e "s|__D1_ID__|${D1_ID}|g" \
    -e "s|__R2_BUCKET__|${R2_BUCKET}|g" \
    wrangler.toml.tpl > wrangler.toml
ok "wrangler.toml đã sinh"

step 4 "Nạp schema vào D1"
$WRANGLER d1 execute "$D1_DB_NAME" --file=schema.sql --remote --yes 2>&1 | tail -5
# Nâng cấp cột cho CSDL cũ. Chạy TỪNG câu, bỏ qua lỗi:
# wrangler dừng ở câu lỗi đầu tiên, mà "duplicate column" là lỗi bình thường khi chạy lại.
while IFS= read -r sql; do
  [[ -z "${sql// }" || "$sql" == --* ]] && continue
  $WRANGLER d1 execute "$D1_DB_NAME" --remote --yes --command "$sql" >/dev/null 2>&1 || true
done < migrations.sql
ok "Schema đã nạp"

step 5 "Đặt secret"
echo "$ADMIN_KEY" | $WRANGLER secret put ADMIN_KEY --name "$WORKER_NAME" 2>&1 | tail -2
ok "Secret đã đặt"

step 6 "Deploy Worker"
$WRANGLER deploy --name "$WORKER_NAME" 2>&1 | grep -E "(Deployed|workers.dev|Error)" | head -3
WORKER_URL="https://${WORKER_NAME}.${CF_ACCOUNT_ID}.workers.dev"
ok "Worker: $WORKER_URL"

step 7 "Deploy Pages"
PAGES_OUT=$($WRANGLER pages deploy public/ --project-name "$PAGES_PROJECT" --branch main 2>&1)
echo "$PAGES_OUT" | grep -E "(Success|pages.dev|Error|Uploading)" | head -3
PAGES_URL=$(echo "$PAGES_OUT" | grep -oE 'https://[a-z0-9\-]+\.pages\.dev' | head -1 || true)
[[ -z "$PAGES_URL" ]] && PAGES_URL="https://${PAGES_PROJECT}.pages.dev"
ok "Pages: $PAGES_URL"

step 8 "Domain + route /api/*"
FINAL_URL="$PAGES_URL"
if [[ -n "${DOMAIN:-}" && -n "${CF_ZONE_ID:-}" ]]; then
  curl -sf -X POST \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" \
    -d "{\"name\":\"${DOMAIN}\"}" -o /dev/null || warn "Domain có thể đã tồn tại"
  curl -sf -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/workers/routes" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" \
    -d "{\"pattern\":\"${DOMAIN}/api/*\",\"script\":\"${WORKER_NAME}\"}" -o /dev/null || warn "Route có thể đã tồn tại"
  FINAL_URL="https://${DOMAIN}"
  ok "Đã cấu hình domain + route"
else
  warn "Chưa có DOMAIN/CF_ZONE_ID — dùng pages.dev."
  warn "Nhớ sửa GOC_API trong public/assets/api.js thành \"$WORKER_URL\" rồi deploy lại."
fi

if [[ -n "${GH_TOKEN:-}" && -n "${GH_USER:-}" && -n "${GH_REPO:-}" ]]; then
  echo -e "\n${BLD}${CYN}[+]${RST} ${BLD}Sao lưu GitHub${RST}"
  curl -sf -X POST "https://api.github.com/user/repos" \
    -H "Authorization: token ${GH_TOKEN}" \
    -d "{\"name\":\"${GH_REPO}\",\"private\":true,\"auto_init\":false}" -o /dev/null || true
  [[ ! -d .git ]] && git init -q
  git add -A
  git diff --cached --quiet || git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M')"
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GH_TOKEN}@github.com/${GH_USER}/${GH_REPO}.git"
  git branch -M main && git push -qf origin main 2>&1 | head -2 || true
  ok "GitHub: https://github.com/${GH_USER}/${GH_REPO}"
fi

echo -e "\n${BLD}${GRN}══ XONG ══${RST}"
echo -e "  🌐 Site   : ${BLD}${FINAL_URL}${RST}"
echo -e "  🔐 Quản trị: ${BLD}${FINAL_URL}/admin.html${RST}"
echo -e "  ⚙️  Worker : ${BLD}${WORKER_URL}${RST}"
echo -e "  🔑 Mã admin: ${YLW}${ADMIN_KEY}${RST}"
