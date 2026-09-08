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
