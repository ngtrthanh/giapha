-- Nâng cấp CSDL đã có. Chạy sau schema.sql, LỖI ĐƯỢC BỎ QUA:
-- SQLite không có "ADD COLUMN IF NOT EXISTS" nên chạy lần hai sẽ báo trùng cột — vô hại.
ALTER TABLE hon_nhan   ADD COLUMN trang_thai TEXT NOT NULL DEFAULT 'dang';
ALTER TABLE nguoi      ADD COLUMN chi TEXT;
ALTER TABLE nguoi      ADD COLUMN pha_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nguoi_dung ADD COLUMN chi TEXT;
ALTER TABLE nguoi_dung ADD COLUMN chi_sua INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nguoi_dung ADD COLUMN pha_id INTEGER;
ALTER TABLE nguoi_dung ADD COLUMN tao_pha INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS quyen_pha (
  nguoi_dung_id INTEGER NOT NULL,
  pha_id        INTEGER NOT NULL,
  PRIMARY KEY (nguoi_dung_id, pha_id)
);
CREATE INDEX IF NOT EXISTS idx_nguoi_chi ON nguoi(pha_id, chi);
ALTER TABLE media ADD COLUMN dai_dien INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_dai_dien ON media(nguoi_id) WHERE dai_dien = 1;

-- Phả đầu tiên lấy tên từ tiêu đề đã đặt trước đó
UPDATE pha SET ten    = COALESCE((SELECT gia_tri FROM cau_hinh WHERE khoa = 'tieu_de'), ten),
               phu_de = COALESCE((SELECT gia_tri FROM cau_hinh WHERE khoa = 'phu_de'), phu_de)
 WHERE id = 1 AND ten = 'Gia phả dòng họ';
UPDATE nguoi SET pha_id = 1 WHERE pha_id IS NULL;

-- Ngày tháng mờ: cho phép ghi "khoảng", "trước", "sau", "chỉ biết năm", "không rõ"
ALTER TABLE nguoi ADD COLUMN sinh_kieu TEXT NOT NULL DEFAULT 'chinh_xac';
ALTER TABLE nguoi ADD COLUMN sinh_den  TEXT;
ALTER TABLE nguoi ADD COLUMN sinh_goc  TEXT;
ALTER TABLE nguoi ADD COLUMN mat_kieu  TEXT NOT NULL DEFAULT 'chinh_xac';
ALTER TABLE nguoi ADD COLUMN mat_den   TEXT;
ALTER TABLE nguoi ADD COLUMN mat_goc   TEXT;
ALTER TABLE media ADD COLUMN chu_tren_bia TEXT;
-- Hai lệnh dưới phải nằm gọn MỘT DÒNG: deploy.sh và deploy.bat nạp file này
-- theo từng dòng, lệnh trải nhiều dòng sẽ bị cắt vụn và chạy hỏng.
CREATE TABLE IF NOT EXISTS nguon (id INTEGER PRIMARY KEY AUTOINCREMENT, loai TEXT NOT NULL, mo_ta TEXT NOT NULL, nguoi_cung_cap TEXT, ngay_thu_thap TEXT, media_id INTEGER, do_tin_cay TEXT NOT NULL DEFAULT 'vua', ghi_chu TEXT, tao_luc TEXT NOT NULL DEFAULT (datetime('now','+7 hours')));
CREATE TABLE IF NOT EXISTS dan_nguon (id INTEGER PRIMARY KEY AUTOINCREMENT, nguon_id INTEGER NOT NULL, nguoi_id INTEGER NOT NULL, truong TEXT NOT NULL, trich TEXT, tao_luc TEXT NOT NULL DEFAULT (datetime('now','+7 hours')), UNIQUE(nguon_id, nguoi_id, truong));
CREATE INDEX IF NOT EXISTS idx_dan_nguon_nguoi ON dan_nguon(nguoi_id);
CREATE INDEX IF NOT EXISTS idx_nguon_media ON nguon(media_id);
CREATE TABLE IF NOT EXISTS de_xuat (id INTEGER PRIMARY KEY AUTOINCREMENT, loai TEXT NOT NULL, nguoi_id INTEGER, du_lieu TEXT NOT NULL, ly_do TEXT, nguoi_gui TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'cho', nguoi_duyet TEXT, ghi_chu_duyet TEXT, gui_luc TEXT NOT NULL DEFAULT (datetime('now','+7 hours')), duyet_luc TEXT);
CREATE INDEX IF NOT EXISTS idx_de_xuat_cho ON de_xuat(trang_thai, id);
