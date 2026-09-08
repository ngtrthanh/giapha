// workers/api/index.js — Gia Phả API
import { dungDoThi, conChauPhuHe } from "../../public/assets/dothi.js";
// Bindings: env.DB (D1), env.MEDIA (R2), env.ADMIN_KEY (secret)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Token, X-Ten-File",
};

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const err = (m, s = 400) => json({ ok: false, error: m }, s);

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function auth(request, env) {
  const url = new URL(request.url);
  const token = request.headers.get("X-Token") || url.searchParams.get("token");
  if (!token) return null;
  if (env.ADMIN_KEY && token === env.ADMIN_KEY)
    return { id: 0, ten: "admin", quyen: "admin", pha_id: null, chi: null,
             chi_sua: 1, tao_pha: 1, pha_them: [] };
  const row = await env.DB.prepare(
    `SELECT id, ten, quyen, pha_id, chi, chi_sua, tao_pha FROM nguoi_dung WHERE token_hash = ?`)
    .bind(await sha256(token)).first();
  if (!row) return null;
  const th = await env.DB.prepare(`SELECT pha_id FROM quyen_pha WHERE nguoi_dung_id = ?`)
    .bind(row.id).all();
  row.pha_them = th.results.map((x) => x.pha_id);
  return row;
}

const log = (env, bang, ban_ghi, hanh_dong, boi, chi_tiet) =>
  env.DB.prepare(`INSERT INTO nhat_ky (bang, ban_ghi, hanh_dong, boi, chi_tiet) VALUES (?,?,?,?,?)`)
    .bind(bang, ban_ghi, hanh_dong, boi, chi_tiet || null).run();

// ── Validate ──────────────────────────────────────────────────────────────────
const FIELDS = ["ho_ten","ten_khac","gioi_tinh","doi","pha_id","chi","cha_id","me_id","ngay_sinh","ngay_mat",
                "gio_ngay","gio_thang","gio_nhuan","noi_an_tang","mo_lat","mo_lng","ghi_chu"];

// ── Phạm vi sửa ───────────────────────────────────────────────────────────────
// admin: toàn quyền. chi_sua = 0: chỉ xem. chi = NULL: sửa toàn cây.
// chi = 'X': chỉ sửa được người thuộc chi X.
const duocSua = (me) => me.quyen === "admin" || (me.quyen === "sua" && me.chi_sua !== 0);
// Phạm vi ghi: { pha, chi }. null nghĩa là không giới hạn ở cấp đó.
function phamVi(me) {
  if (me.quyen === "admin") return { pha: null, chi: null };
  const ds = [...(me.pha_id != null ? [me.pha_id] : []), ...(me.pha_them || [])];
  return { pha: ds.length ? new Set(ds) : null, chi: me.chi || null };
}
const duocTaoPha = (me) => me.quyen === "admin" || me.tao_pha === 1;
// Set không lên được JSON — đổi sang mảng khi trả cho giao diện
const goiPhamVi = (me) => {
  const pv = phamVi(me);
  return { pha: pv.pha ? [...pv.pha] : null, chi: pv.chi };
};

function hopLe(row, pv) {
  if (pv.pha && !pv.pha.has(row.pha_id)) return false;
  if (pv.chi != null && row.chi !== pv.chi) return false;
  return true;
}

async function trongPhamVi(id, env, me) {
  const pv = phamVi(me);
  if (!pv.pha && pv.chi == null) return true;
  const r = await env.DB.prepare(`SELECT pha_id, chi FROM nguoi WHERE id = ?`).bind(id).first();
  return !!r && hopLe(r, pv);
}
const NGOAI = "Người này ngoài phạm vi bạn được giao";

function clean(body) {
  const o = {};
  for (const f of FIELDS) if (f in body) o[f] = body[f] === "" ? null : body[f];
  if ("ho_ten" in o && !String(o.ho_ten || "").trim()) return { error: "Thiếu họ tên" };
  if ("gioi_tinh" in o && o.gioi_tinh && !["nam","nu","khac"].includes(o.gioi_tinh))
    return { error: "Giới tính không hợp lệ" };
  for (const d of ["ngay_sinh","ngay_mat"])
    if (o[d] && !/^\d{4}-\d{2}-\d{2}$/.test(o[d])) return { error: `${d} phải dạng YYYY-MM-DD` };
  if (o.gio_ngay != null && (o.gio_ngay < 1 || o.gio_ngay > 30)) return { error: "Ngày giỗ âm 1–30" };
  if (o.gio_thang != null && (o.gio_thang < 1 || o.gio_thang > 12)) return { error: "Tháng giỗ âm 1–12" };
  return { data: o };
}

async function kiemTraChaMe(data, id, env) {
  if (!('cha_id' in data) && !('me_id' in data)) return null;
  const rows = (await env.DB.prepare('SELECT id, cha_id, me_id FROM nguoi').all()).results;
  const byId = new Map(rows.map(n => [n.id, n]));
  const current = byId.get(id) || {};
  const merged = { ...current, ...data };
  if (merged.cha_id != null && merged.cha_id === merged.me_id) return 'Cha và mẹ phải là hai người khác nhau';
  for (const field of ['cha_id', 'me_id']) {
    const parent = merged[field];
    if (parent == null) continue;
    if (!Number.isInteger(parent) || !byId.has(parent)) return 'Cha/mẹ không tồn tại';
    const pending = [parent], seen = new Set();
    while (pending.length) {
      const p = pending.pop();
      if (p === id) return 'Không thể chọn bản thân hoặc con cháu làm cha/mẹ';
      if (seen.has(p)) continue;
      seen.add(p);
      const row = byId.get(p);
      if (row) pending.push(...[row.cha_id, row.me_id].filter(x => x != null));
    }
  }
  return null;
}

// ── Handlers ──────────────────────────────────────────────────────────────────
async function getCay(env) {
  const [ng, hn, md, ch] = await Promise.all([
    env.DB.prepare(`SELECT * FROM nguoi ORDER BY doi, id`).all(),
    env.DB.prepare(`SELECT * FROM hon_nhan ORDER BY chong_id, thu_tu`).all(),
    env.DB.prepare(`SELECT id, nguoi_id, loai, ten_file, mo_ta, dai_dien, tao_luc FROM media ORDER BY id`).all(),
    env.DB.prepare(`SELECT khoa, gia_tri FROM cau_hinh`).all(),
  ]);
  const ph = await env.DB.prepare(`SELECT * FROM pha ORDER BY thu_tu, id`).all();
  return json({ ok: true, nguoi: ng.results, hon_nhan: hn.results, media: md.results,
                pha: ph.results,
                cau_hinh: Object.fromEntries(ch.results.map((r) => [r.khoa, r.gia_tri])) });
}

async function docCauHinh(env) {
  const r = await env.DB.prepare(`SELECT khoa, gia_tri FROM cau_hinh`).all();
  return json({ ok: true, cau_hinh: Object.fromEntries(r.results.map((x) => [x.khoa, x.gia_tri])) });
}

const KHOA_HOP_LE = ["tieu_de", "phu_de"];

async function ghiCauHinh(request, env, me) {
  const b = await request.json().catch(() => null);
  if (!b) return err("JSON không hợp lệ");
  const ops = [];
  for (const k of KHOA_HOP_LE) {
    if (!(k in b)) continue;
    const v = String(b[k] ?? "").trim().slice(0, 120);
    ops.push(env.DB.prepare(
      `INSERT INTO cau_hinh (khoa, gia_tri) VALUES (?,?)
       ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri,
         sua_luc = datetime('now','+7 hours')`).bind(k, v));
  }
  if (!ops.length) return err("Không có khoá hợp lệ");
  await env.DB.batch(ops);
  await log(env, "cau_hinh", null, "sua", me.ten, Object.keys(b).join(","));
  return docCauHinh(env);
}

// Đẩy toàn bộ số đời lên/xuống — dùng khi chèn thêm đời trên cụ tổ hiện có
async function dayDoi(request, env, me) {
  const b = await request.json().catch(() => ({}));
  const delta = parseInt(b.delta);
  if (![1, -1].includes(delta)) return err("delta chỉ nhận 1 hoặc -1");
  if (delta === -1) {
    const { m } = await env.DB.prepare(`SELECT MIN(doi) m FROM nguoi WHERE doi IS NOT NULL`).first();
    if (m != null && m - 1 < 1) return err("Không thể lùi: đã có người ở đời 1");
  }
  const r = await env.DB.prepare(
    `UPDATE nguoi SET doi = doi + ?, sua_luc = datetime('now','+7 hours'), sua_boi = ?
     WHERE doi IS NOT NULL`).bind(delta, me.ten).run();
  await log(env, "nguoi", null, "sua", me.ten, `đẩy đời ${delta > 0 ? "+1" : "-1"} (${r.meta.changes} người)`);
  return json({ ok: true, so_nguoi: r.meta.changes });
}

async function themNguoi(request, env, me) {
  const body = await request.json().catch(() => null);
  if (!body) return err("JSON không hợp lệ");
  if (!String(body.ho_ten || "").trim()) return err("Thiếu họ tên");
  const { data, error } = clean(body);
  if (error) return err(error);
  const pv = phamVi(me);
  if (pv.pha && !pv.pha.has(data.pha_id))    // người mới phải nằm trong phả được giao
    data.pha_id = [...pv.pha][0];
  if (pv.chi != null) data.chi = pv.chi;
  if (data.pha_id == null) data.pha_id = 1;

  const loiChaMe = await kiemTraChaMe(data, null, env);
  if (loiChaMe) return err(loiChaMe);
  const cols = Object.keys(data);
  const r = await env.DB.prepare(
    `INSERT INTO nguoi (${cols.join(",")}, sua_boi) VALUES (${cols.map(() => "?").join(",")}, ?)`
  ).bind(...cols.map((c) => data[c]), me.ten).run();

  await log(env, "nguoi", r.meta.last_row_id, "them", me.ten, data.ho_ten);
  await tinhLaiDoi(env, me);
  const row = await env.DB.prepare(`SELECT * FROM nguoi WHERE id = ?`).bind(r.meta.last_row_id).first();
  return json({ ok: true, nguoi: row }, 201);
}

async function suaNguoi(id, request, env, me) {
  const body = await request.json().catch(() => null);
  if (!body) return err("JSON không hợp lệ");
  const { data, error } = clean(body);
  if (error) return err(error);
  const cols = Object.keys(data);
  if (!cols.length) return err("Không có gì để sửa");

  const cur = await env.DB.prepare(
    `SELECT sua_luc, ho_ten, pha_id, chi FROM nguoi WHERE id = ?`).bind(id).first();
  if (!cur) return err("Không tìm thấy", 404);
  const pv = phamVi(me);
  if (!hopLe(cur, pv)) return err(NGOAI, 403);
  if (pv.pha && "pha_id" in data && !pv.pha.has(data.pha_id))
    return err("Không được chuyển người sang phả khác", 403);
  if (pv.chi != null && "chi" in data && data.chi !== pv.chi)
    return err("Không được chuyển người sang chi khác", 403);
  const loiChaMe = await kiemTraChaMe(data, id, env);
  if (loiChaMe) return err(loiChaMe);
  // Khoá lạc quan: chặn ghi đè khi 2 người sửa cùng lúc
  if (!body.sua_luc || body.sua_luc !== cur.sua_luc)
    return json({ ok: false, error: "Bản ghi vừa được người khác sửa — tải lại rồi thử lại", conflict: true }, 409);

  const updated = await env.DB.prepare(
    `UPDATE nguoi SET ${cols.map((c) => c + " = ?").join(", ")},
       sua_luc = ?, sua_boi = ? WHERE id = ? AND sua_luc = ?`
  ).bind(...cols.map((c) => data[c]), new Date(Math.max(Date.now() + 7 * 3600000, (Date.parse(cur.sua_luc.replace(' ', 'T') + 'Z') || 0) + 1)).toISOString().replace('T', ' ').replace('Z', ''), me.ten, id, body.sua_luc).run();
  if (!updated.meta.changes) return json({ ok: false, error: 'Bản ghi vừa được người khác sửa — tải lại rồi thử lại', conflict: true }, 409);

  await log(env, "nguoi", id, "sua", me.ten, cols.join(","));
  // đời là trường dẫn xuất: đổi đời của cụ tổ hay đổi cha/mẹ thì cả cây tính lại
  if (cols.some((c) => ["doi", "cha_id", "me_id", "pha_id"].includes(c))) await tinhLaiDoi(env, me);
  const row = await env.DB.prepare(`SELECT * FROM nguoi WHERE id = ?`).bind(id).first();
  return json({ ok: true, nguoi: row });
}

async function xoaNguoi(id, env, me) {
  const { c } = await env.DB.prepare(
    `SELECT COUNT(*) c FROM nguoi WHERE cha_id = ? OR me_id = ?`).bind(id, id).first();
  if (c > 0) return err("Người này còn con trong cây — gỡ liên kết con trước", 409);

  const keys = await env.DB.prepare(`SELECT r2_key FROM media WHERE nguoi_id = ?`).bind(id).all();
  for (const k of keys.results) await env.MEDIA.delete(k.r2_key);

  const r = await env.DB.prepare(`DELETE FROM nguoi WHERE id = ?`).bind(id).run();
  if (r.meta.changes === 0) return err("Không tìm thấy", 404);
  await log(env, "nguoi", id, "xoa", me.ten, null);
  return json({ ok: true });
}

async function themHonNhan(request, env, me) {
  const b = await request.json().catch(() => null);
  if (!b?.chong_id || !b?.vo_id) return err("Thiếu chong_id hoặc vo_id");
  if (b.chong_id === b.vo_id) return err("Không thể tự kết hôn với chính mình");
  // Hôn nhân được phép xuyên phả (dâu/rể), nên chỉ cần một đầu nằm trong phạm vi
  const trong = await Promise.all([b.chong_id, b.vo_id].map((id) => trongPhamVi(id, env, me)));
  if (!trong.some(Boolean)) return err(NGOAI, 403);
  try {
    const r = await env.DB.prepare(
      `INSERT INTO hon_nhan (chong_id, vo_id, thu_tu, trang_thai, ghi_chu) VALUES (?,?,?,?,?)`
    ).bind(b.chong_id, b.vo_id, b.thu_tu || 1,
           b.trang_thai === "ly_di" ? "ly_di" : "dang", b.ghi_chu || null).run();
    await log(env, "hon_nhan", r.meta.last_row_id, "them", me.ten, `${b.chong_id}-${b.vo_id}`);
    await tinhLaiDoi(env, me);
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch {
    return err("Cặp này đã tồn tại hoặc id không hợp lệ", 409);
  }
}

async function honNhanTrongPhamVi(id, env, me) {
  const pv = phamVi(me);
  if (!pv.pha && pv.chi == null) return true;
  const h = await env.DB.prepare(`SELECT chong_id, vo_id FROM hon_nhan WHERE id = ?`).bind(id).first();
  if (!h) return true;
  return (await trongPhamVi(h.chong_id, env, me)) || (await trongPhamVi(h.vo_id, env, me));
}

async function suaHonNhan(id, request, env, me) {
  const b = await request.json().catch(() => ({}));
  if (!["dang", "ly_di"].includes(b.trang_thai)) return err("Trạng thái không hợp lệ");
  const r = await env.DB.prepare(
    `UPDATE hon_nhan SET trang_thai = ?, ghi_chu = COALESCE(?, ghi_chu) WHERE id = ?`
  ).bind(b.trang_thai, b.ghi_chu ?? null, id).run();
  if (r.meta.changes === 0) return err("Không tìm thấy", 404);
  await log(env, "hon_nhan", id, "sua", me.ten, b.trang_thai);
  return json({ ok: true });
}

async function xoaHonNhan(id, env, me) {
  const r = await env.DB.prepare(`DELETE FROM hon_nhan WHERE id = ?`).bind(id).run();
  if (r.meta.changes === 0) return err("Không tìm thấy", 404);
  await log(env, "hon_nhan", id, "xoa", me.ten, null);
  return json({ ok: true });
}

// Upload: POST /api/media?nguoi_id=1&loai=anh  — body = raw bytes, header X-Ten-File
async function themMedia(request, env, me) {
  const u = new URL(request.url);
  const nguoi_id = parseInt(u.searchParams.get("nguoi_id") || "0");
  const loai = u.searchParams.get("loai") || "anh";
  const ten_file = decodeURIComponent(request.headers.get("X-Ten-File") || "file");
  const mo_ta = u.searchParams.get("mo_ta") || null;
  if (!nguoi_id) return err("Thiếu nguoi_id");
  if (!["anh", "tai_lieu", "mo"].includes(loai)) return err("Loại không hợp lệ");
  if (!(await trongPhamVi(nguoi_id, env, me))) return err(NGOAI, 403);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return err("File rỗng");
  if (buf.byteLength > 10 * 1024 * 1024) return err("File quá 10 MB");

  const r2_key = `${nguoi_id}/${Date.now()}-${ten_file.replace(/[^\w.\-]/g, "_")}`;
  await env.MEDIA.put(r2_key, buf, {
    httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
  });
  const r = await env.DB.prepare(
    `INSERT INTO media (nguoi_id, loai, r2_key, ten_file, mo_ta) VALUES (?,?,?,?,?)`
  ).bind(nguoi_id, loai, r2_key, ten_file, mo_ta).run();
  await log(env, "media", r.meta.last_row_id, "them", me.ten, ten_file);
  return json({ ok: true, id: r.meta.last_row_id, r2_key }, 201);
}

async function taiMedia(id, env) {
  const row = await env.DB.prepare(`SELECT r2_key, ten_file FROM media WHERE id = ?`).bind(id).first();
  if (!row) return err("Không tìm thấy", 404);
  const obj = await env.MEDIA.get(row.r2_key);
  if (!obj) return err("File không còn trong kho", 404);
  const h = new Headers(CORS);
  obj.writeHttpMetadata(h);
  h.set("Cache-Control", "private, max-age=3600");
  return new Response(obj.body, { headers: h });
}

// Đổi ảnh đại diện: PATCH /api/media/:id  { dai_dien: 1 | 0 }
async function suaMedia(id, request, env, me) {
  const row = await env.DB.prepare(`SELECT nguoi_id, loai FROM media WHERE id = ?`).bind(id).first();
  if (!row) return err("Không tìm thấy", 404);
  if (!(await trongPhamVi(row.nguoi_id, env, me))) return err(NGOAI, 403);
  const b = await request.json().catch(() => ({}));
  const dd = b.dai_dien;
  if (dd !== 0 && dd !== 1) return err("dai_dien chỉ nhận 0 hoặc 1");
  if (dd === 1 && row.loai !== "anh") return err("Chỉ ảnh mới đặt làm đại diện được");
  // Gỡ cờ cũ trước rồi mới đặt cờ mới: chỉ mục duy nhất không cho hai ảnh đại diện cùng một người
  await env.DB.batch([
    env.DB.prepare(`UPDATE media SET dai_dien = 0 WHERE nguoi_id = ? AND dai_dien = 1`).bind(row.nguoi_id),
    env.DB.prepare(`UPDATE media SET dai_dien = ? WHERE id = ?`).bind(dd, id),
  ]);
  await log(env, "media", id, "sua", me.ten, dd ? "đặt ảnh đại diện" : "bỏ ảnh đại diện");
  return json({ ok: true, dai_dien: dd });
}

async function xoaMedia(id, env, me) {
  const row = await env.DB.prepare(`SELECT r2_key, nguoi_id FROM media WHERE id = ?`).bind(id).first();
  if (!row) return err("Không tìm thấy", 404);
  if (!(await trongPhamVi(row.nguoi_id, env, me))) return err(NGOAI, 403);
  await env.MEDIA.delete(row.r2_key);
  await env.DB.prepare(`DELETE FROM media WHERE id = ?`).bind(id).run();
  await log(env, "media", id, "xoa", me.ten, null);
  return json({ ok: true });
}

// ── Phả ───────────────────────────────────────────────────────────────────────
const slug = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

async function themPha(request, env, me) {
  const b = await request.json().catch(() => ({}));
  const ten = String(b.ten || "").trim();
  if (!ten) return err("Thiếu tên phả");
  const ma = slug(b.ma || ten) || "pha";
  try {
    const r = await env.DB.prepare(
      `INSERT INTO pha (ma, ten, phu_de, thu_tu) VALUES (?,?,?,?)`
    ).bind(ma, ten, b.phu_de?.trim() || null, parseInt(b.thu_tu) || 99).run();
    // người tự mở phả thì được quyền sửa chính phả đó, vẫn giữ quyền ở phả cũ
    if (me.quyen !== "admin" && me.id)
      await env.DB.prepare(`INSERT OR IGNORE INTO quyen_pha (nguoi_dung_id, pha_id) VALUES (?,?)`)
        .bind(me.id, r.meta.last_row_id).run();
    await log(env, "pha", r.meta.last_row_id, "them", me.ten, ten);
    return json({ ok: true, id: r.meta.last_row_id, ma }, 201);
  } catch { return err("Mã phả đã tồn tại", 409); }
}

async function suaPha(id, request, env, me) {
  const b = await request.json().catch(() => ({}));
  if ("ten" in b && !String(b.ten ?? "").trim()) return err("Tên phả không được để trống");
  const co = ["ten", "phu_de", "thu_tu"].filter((k) => k in b);
  if (!co.length) return err("Không có gì để sửa");
  await env.DB.prepare(
    `UPDATE pha SET ${co.map((k) => k + " = ?").join(", ")} WHERE id = ?`
  ).bind(...co.map((k) => (k === "thu_tu" ? parseInt(b[k]) || 1 : String(b[k] ?? "").trim() || null)), id).run();
  await log(env, "pha", id, "sua", me.ten, co.join(","));
  return json({ ok: true });
}

async function xoaPha(id, env, me) {
  const { c: soPha } = await env.DB.prepare(`SELECT COUNT(*) c FROM pha`).first();
  if (soPha <= 1) return err("Phải còn ít nhất một phả", 409);
  const { c } = await env.DB.prepare(`SELECT COUNT(*) c FROM nguoi WHERE pha_id = ?`).bind(id).first();
  if (c > 0) return err(`Phả còn ${c} người — chuyển hoặc xoá họ trước`, 409);
  const r = await env.DB.prepare(`DELETE FROM pha WHERE id = ?`).bind(id).run();
  if (!r.meta.changes) return err("Không tìm thấy", 404);
  await log(env, "pha", id, "xoa", me.ten, null);
  return json({ ok: true });
}


// ── Di trú: chuyển một nhánh sang phả khác ────────────────────────────────────
// Nhánh tính theo dòng cha (phụ hệ): gốc + mọi người có cha_id nằm trong nhánh.
// Con của con gái KHÔNG thuộc nhánh — cháu ngoại theo phả bên nội của chúng.
async function chuyenPha(request, env, me) {
  const b = await request.json().catch(() => ({}));
  const goc = parseInt(b.goc_id), phaMoi = parseInt(b.pha_id);
  if (!goc || !phaMoi) return err("Thiếu goc_id hoặc pha_id");

  const co = await env.DB.prepare(`SELECT id FROM pha WHERE id = ?`).bind(phaMoi).first();
  if (!co) return err("Phả không tồn tại", 404);
  const pv = phamVi(me);
  if (pv.pha && !pv.pha.has(phaMoi)) return err("Bạn không có quyền ở phả đích", 403);

  const [ng, hn] = await Promise.all([
    env.DB.prepare(`SELECT id, ho_ten, doi, gioi_tinh, cha_id, pha_id, chi FROM nguoi`).all(),
    env.DB.prepare(`SELECT chong_id, vo_id FROM hon_nhan`).all(),
  ]);
  const byId = new Map(ng.results.map((n) => [n.id, n]));
  if (!byId.has(goc)) return err("Không tìm thấy người gốc", 404);

  const g = dungDoThi(ng.results, hn.results);
  const tap = new Set([goc]);
  if (b.pham_vi !== "mot") for (const id of conChauPhuHe(g, goc)) tap.add(id);
  if (b.gom_dau) {                       // vợ của nam giới trong nhánh
    for (const h of hn.results) {
      if (tap.has(h.chong_id) && byId.get(h.chong_id)?.gioi_tinh === "nam") tap.add(h.vo_id);
      if (tap.has(h.vo_id) && byId.get(h.vo_id)?.gioi_tinh === "nam") tap.add(h.chong_id);
    }
  }

  const ds = [...tap].map((id) => byId.get(id)).filter(Boolean)
    .sort((a, b2) => (a.doi ?? 99) - (b2.doi ?? 99) || a.id - b2.id);
  const canChuyen = ds.filter((n) => n.pha_id !== phaMoi);

  // người không phải admin chỉ chuyển được nhánh nằm trọn trong phạm vi của mình
  if (pv.pha || pv.chi != null) {
    const ngoai = ds.find((n) => !hopLe(n, pv));
    if (ngoai) return err(`Nhánh có người ngoài phạm vi: ${ngoai.ho_ten}`, 403);
  }

  if (b.xem_truoc) return json({ ok: true, xem_truoc: true, so_nguoi: canChuyen.length,
    danh_sach: ds.map((n) => ({ id: n.id, ho_ten: n.ho_ten, doi: n.doi, pha_id: n.pha_id })) });

  if (!canChuyen.length) return json({ ok: true, so_nguoi: 0 });
  const ids = canChuyen.map((n) => n.id);
  await env.DB.prepare(
    `UPDATE nguoi SET pha_id = ?, sua_luc = datetime('now','+7 hours'), sua_boi = ?
      WHERE id IN (${ids.map(() => "?").join(",")})`
  ).bind(phaMoi, me.ten, ...ids).run();
  await log(env, "nguoi", goc, "sua", me.ten,
            `chuyển ${ids.length} người sang phả ${phaMoi}`);
  await tinhLaiDoi(env, me);
  return json({ ok: true, so_nguoi: ids.length });
}


// ── Tính lại số đời cho toàn bộ cây ───────────────────────────────────────────
// Gốc (không có cha lẫn mẹ) giữ số đời đang có, mặc định 1.
// Người có cha/mẹ: đời = đời của cha + 1 (ưu tiên cha cùng phả, rồi mẹ).
// Dâu/rể không có cha mẹ trong dữ liệu: lấy theo đời của bạn đời.
async function tinhLaiDoi(env, me, ghiNhatKy = false) {
  const [ng, hn] = await Promise.all([
    env.DB.prepare(`SELECT id, doi, pha_id, cha_id, me_id FROM nguoi`).all(),
    env.DB.prepare(`SELECT chong_id, vo_id FROM hon_nhan`).all(),
  ]);
  const ds = ng.results;
  if (!ds.length) return 0;
  const byId = new Map(ds.map((n) => [n.id, n]));
  const doi = new Map();

  for (const n of ds) if (n.cha_id == null && n.me_id == null) doi.set(n.id, n.doi ?? 1);

  for (let v = 0; v < 60; v++) {
    let doiThay = false;
    for (const n of ds) {
      if (n.cha_id == null && n.me_id == null) continue;
      const ung = [n.cha_id, n.me_id].map((i) => byId.get(i)).filter((x) => x && doi.has(x.id));
      if (!ung.length) continue;
      const cha = byId.get(n.cha_id);
      const goc = (cha && doi.has(cha.id) && cha.pha_id === n.pha_id) ? cha
                : ung.find((x) => x.pha_id === n.pha_id) || ung[0];
      const d = doi.get(goc.id) + 1;
      if (doi.get(n.id) !== d) { doi.set(n.id, d); doiThay = true; }
    }
    for (const h of hn.results) {              // dâu/rể ăn theo đời bạn đời
      for (const [a, b] of [[h.chong_id, h.vo_id], [h.vo_id, h.chong_id]]) {
        const x = byId.get(a), y = byId.get(b);
        if (!x || !y) continue;
        if (y.cha_id != null || y.me_id != null) continue;
        if (doi.has(x.id) && doi.get(y.id) !== doi.get(x.id)) {
          doi.set(y.id, doi.get(x.id)); doiThay = true;
        }
      }
    }
    if (!doiThay) break;
  }

  const sua = ds.filter((n) => doi.has(n.id) && doi.get(n.id) !== n.doi);
  if (!sua.length) return 0;
  await env.DB.batch(sua.map((n) =>
    env.DB.prepare(`UPDATE nguoi SET doi = ? WHERE id = ?`).bind(doi.get(n.id), n.id)));
  if (ghiNhatKy) await log(env, "nguoi", null, "sua", me.ten, `tính lại đời cho ${sua.length} người`);
  return sua.length;
}

// ── Router ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);
    const p = url.pathname;
    const m = request.method;

    try {
      if (p === "/api/health") return json({ ok: true, luc: new Date().toISOString() });

      if (p === "/api/dang-nhap" && m === "POST") {
        const b = await request.json().catch(() => ({}));
        const me = await auth(new Request(url, { headers: { "X-Token": b.token || "" } }), env);
        return me
          ? json({ ok: true, ten: me.ten, quyen: me.quyen, sua: duocSua(me),
                   tao_pha: duocTaoPha(me), pham_vi: goiPhamVi(me) })
          : err("Mã không đúng", 401);
      }

      const me = await auth(request, env);
      if (!me) return err("Cần đăng nhập", 401);
      const canEdit = duocSua(me);
      const isAdmin = me.quyen === "admin";

      if (p === "/api/cay" && m === "GET") return getCay(env);
      if (p === "/api/toi" && m === "GET")
        return json({ ok: true, ten: me.ten, quyen: me.quyen, sua: duocSua(me),
                      tao_pha: duocTaoPha(me), pham_vi: goiPhamVi(me) });

      if (p === "/api/cau-hinh") {
        if (m === "GET") return docCauHinh(env);
        if (m === "PUT") return isAdmin ? ghiCauHinh(request, env, me) : err("Chỉ admin", 403);
      }

      if (p === "/api/pha") {
        if (m === "GET") {
          const r = await env.DB.prepare(`SELECT * FROM pha ORDER BY thu_tu, id`).all();
          return json({ ok: true, data: r.results });
        }
        if (m === "POST")
          return duocTaoPha(me) ? themPha(request, env, me)
                                : err("Bạn chưa được mở phả riêng — nhờ admin bật quyền", 403);
      }
      const mPha = p.match(/^\/api\/pha\/(\d+)$/);
      if (mPha) {
        const pvP = phamVi(me);
        const cuaMinh = isAdmin || (duocSua(me) && pvP.pha && pvP.pha.has(parseInt(mPha[1])));
        if (!cuaMinh) return err("Không có quyền với phả này", 403);
        if (m === "PATCH") return suaPha(parseInt(mPha[1]), request, env, me);
        if (m === "DELETE") return xoaPha(parseInt(mPha[1]), env, me);
      }

      if (p === "/api/tinh-doi" && m === "POST") {
        if (!canEdit) return err("Không có quyền sửa", 403);
        return json({ ok: true, so_nguoi: await tinhLaiDoi(env, me, true) });
      }

      if (p === "/api/chuyen-pha" && m === "POST")
        return canEdit ? chuyenPha(request, env, me) : err("Không có quyền sửa", 403);

      if (p === "/api/day-doi" && m === "POST")
        return isAdmin ? dayDoi(request, env, me) : err("Chỉ admin được đẩy đời", 403);

      if (p === "/api/nguoi" && m === "POST")
        return canEdit ? themNguoi(request, env, me) : err("Không có quyền sửa", 403);

      let mm = p.match(/^\/api\/nguoi\/(\d+)$/);
      if (mm) {
        const id = parseInt(mm[1]);
        if (m === "PATCH") return canEdit ? suaNguoi(id, request, env, me) : err("Không có quyền sửa", 403);
        if (m === "DELETE") return isAdmin ? xoaNguoi(id, env, me) : err("Chỉ admin được xoá", 403);
      }

      if (p === "/api/hon-nhan" && m === "POST")
        return canEdit ? themHonNhan(request, env, me) : err("Không có quyền sửa", 403);
      mm = p.match(/^\/api\/hon-nhan\/(\d+)$/);
      if (mm) {
        if (!canEdit) return err("Không có quyền sửa", 403);
        const hid = parseInt(mm[1]);
        if (m === "PATCH" || m === "DELETE") {
          if (!(await honNhanTrongPhamVi(hid, env, me))) return err(NGOAI, 403);
          return m === "PATCH" ? suaHonNhan(hid, request, env, me) : xoaHonNhan(hid, env, me);
        }
      }

      if (p === "/api/media" && m === "POST")
        return canEdit ? themMedia(request, env, me) : err("Không có quyền sửa", 403);
      mm = p.match(/^\/api\/media\/(\d+)$/);
      if (mm) {
        const id = parseInt(mm[1]);
        if (m === "GET") return taiMedia(id, env);
        if (m === "PATCH") return canEdit ? suaMedia(id, request, env, me) : err("Không có quyền sửa", 403);
        if (m === "DELETE") return canEdit ? xoaMedia(id, env, me) : err("Không có quyền sửa", 403);
      }

      if (p === "/api/nhat-ky" && m === "GET") {
        if (!isAdmin) return err("Chỉ admin", 403);
        const r = await env.DB.prepare(`SELECT * FROM nhat_ky ORDER BY id DESC LIMIT 200`).all();
        return json({ ok: true, data: r.results });
      }

      if (p === "/api/nguoi-dung") {
        if (!isAdmin) return err("Chỉ admin", 403);
        if (m === "GET") {
          const r = await env.DB.prepare(
            `SELECT id, ten, quyen, pha_id, chi, chi_sua, tao_pha, tao_luc
               FROM nguoi_dung ORDER BY id`).all();
          const th = await env.DB.prepare(`SELECT nguoi_dung_id, pha_id FROM quyen_pha`).all();
          for (const u of r.results)
            u.pha_them = th.results.filter((x) => x.nguoi_dung_id === u.id).map((x) => x.pha_id);
          return json({ ok: true, data: r.results });
        }
        if (m === "POST") {
          const b = await request.json().catch(() => ({}));
          if (!b.ten?.trim() || !b.token?.trim()) return err("Thiếu tên hoặc mã");
          if (b.token.length < 8) return err("Mã phải từ 8 ký tự");
          try {
            const r = await env.DB.prepare(
              `INSERT INTO nguoi_dung (ten, token_hash, quyen, pha_id, chi, chi_sua, tao_pha)
               VALUES (?,?,?,?,?,?,?)`
            ).bind(b.ten.trim(), await sha256(b.token),
                   b.quyen === "admin" ? "admin" : "sua",
                   b.quyen === "admin" ? null : (parseInt(b.pha_id) || null),
                   b.quyen === "admin" ? null : (b.chi?.trim() || null),
                   b.chi_sua === 0 ? 0 : 1,
                   b.tao_pha ? 1 : 0).run();
            return json({ ok: true, id: r.meta.last_row_id }, 201);
          } catch { return err("Mã đã được dùng", 409); }
        }
      }
      mm = p.match(/^\/api\/nguoi-dung\/(\d+)$/);
      if (mm && m === "DELETE") {
        if (!isAdmin) return err("Chỉ admin", 403);
        const r = await env.DB.prepare(`DELETE FROM nguoi_dung WHERE id = ?`).bind(parseInt(mm[1])).run();
        return r.meta.changes ? json({ ok: true }) : err("Không tìm thấy", 404);
      }

      return err("Not found", 404);
    } catch (e) {
      console.error(e);
      return err("Lỗi máy chủ", 500);
    }
  },
};
