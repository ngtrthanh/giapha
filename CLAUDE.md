## Stack
- Frontend: HTML/CSS/JS thuần trong `public/` (không framework, không build step)
- Backend: Cloudflare Worker tại `workers/api/index.js`
- DB: Cloudflare D1 (`schema.sql`); R2 binding `MEDIA` cho ảnh/tài liệu

## Deploy
`./deploy.sh` (Linux/Mac/WSL) hoặc `deploy.bat` (Windows). Idempotent.
`wrangler.toml` do script sinh từ `wrangler.toml.tpl` — không sửa tay, không commit.

## Quy ước
- Không thêm npm package vào Worker
- Tên bảng/cột tiếng Việt không dấu: ho_ten, ngay_mat, gio_ngay, hon_nhan
- Sửa file HTML thì xuất nguyên file, không diff từng phần
- Giờ Việt Nam: `datetime('now','+7 hours')` trong D1
- `PATCH /api/nguoi/:id` luôn gửi kèm `sua_luc` để giữ khoá lạc quan
- Quy đổi âm lịch chỉ nằm ở `public/assets/amlich.js` (client-side); Worker không tính âm lịch

## Lệnh hay dùng
```bash
npx wrangler d1 execute giapha-db --command "SELECT id, ho_ten, doi FROM nguoi" --remote
npx wrangler tail giapha-api
npx wrangler dev --local --port 8788 --var ADMIN_KEY:test-admin-key
```

## Chạy cục bộ (Windows 11)
`chay-local.bat` → wrangler dev với `wrangler.local.toml` (assets = ./public, D1 + R2 cục bộ).
Secret cục bộ đọc từ `.dev.vars`. Dữ liệu trong `.wrangler/state`.
`nap-mau.bat` nạp `mau.sql`; `sao-luu.bat` xuất D1; `dua-len-mang.bat` đẩy lên D1 remote.
