-- Gia Phả — D1 schema (idempotent)
-- Giờ Việt Nam: datetime('now','+7 hours')

-- Mỗi dòng họ là một "phả". Người thuộc một phả gốc, nhưng hôn nhân và
-- quan hệ cha/mẹ được phép xuyên phả (con gái họ ngoại làm dâu họ nội).
CREATE TABLE IF NOT EXISTS pha (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ma      TEXT NOT NULL UNIQUE,                      -- slug ngắn: noi, ngoai-me, ngoai-vo
  ten     TEXT NOT NULL,                             -- Gia phả dòng họ Nguyễn
  phu_de  TEXT,
  thu_tu  INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO pha (id, ma, ten, thu_tu) VALUES (1, 'chinh', 'Gia phả dòng họ', 1);

CREATE TABLE IF NOT EXISTS nguoi (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ho_ten      TEXT    NOT NULL,
  ten_khac    TEXT,                                  -- tên húy / tự / hiệu / thường gọi
  gioi_tinh   TEXT    NOT NULL DEFAULT 'nam' CHECK(gioi_tinh IN ('nam','nu','khac')),
  doi         INTEGER,                               -- đời thứ mấy
  pha_id      INTEGER NOT NULL DEFAULT 1 REFERENCES pha(id),
  chi         TEXT,                                  -- chi/nhánh trong phả, dùng để phân quyền sửa
  cha_id      INTEGER REFERENCES nguoi(id) ON DELETE SET NULL,
  me_id       INTEGER REFERENCES nguoi(id) ON DELETE SET NULL,
  -- Ngày dương: chấp nhận thiếu vế — '1890', '1890-03', '1890-03-12'.
  -- Đừng bịa ngày cho đủ định dạng; thiếu thì để thiếu, *_kieu nói rõ mức chắc chắn.
  ngay_sinh   TEXT,
  sinh_kieu   TEXT NOT NULL DEFAULT 'chinh_xac'
              CHECK(sinh_kieu IN ('chinh_xac','khoang','truoc','sau','giua','khong_ro')),
  sinh_den    TEXT,                                  -- vế sau, chỉ dùng khi sinh_kieu='giua'
  sinh_goc    TEXT,                                  -- nguyên văn như bản phả chép: 'Giáp Tý niên'
  ngay_mat    TEXT,
  mat_kieu    TEXT NOT NULL DEFAULT 'chinh_xac'
              CHECK(mat_kieu IN ('chinh_xac','khoang','truoc','sau','giua','khong_ro')),
  mat_den     TEXT,
  mat_goc     TEXT,
  gio_ngay    INTEGER CHECK(gio_ngay BETWEEN 1 AND 30),   -- ngày giỗ âm
  gio_thang   INTEGER CHECK(gio_thang BETWEEN 1 AND 12),  -- tháng giỗ âm
  gio_nhuan   INTEGER NOT NULL DEFAULT 0 CHECK(gio_nhuan IN (0,1)),
  noi_an_tang TEXT,
  mo_lat      REAL,
  mo_lng      REAL,
  ghi_chu     TEXT,
  sua_luc     TEXT    NOT NULL DEFAULT (datetime('now','+7 hours')),
  sua_boi     TEXT
);

CREATE INDEX IF NOT EXISTS idx_nguoi_cha ON nguoi(cha_id);
CREATE INDEX IF NOT EXISTS idx_nguoi_me  ON nguoi(me_id);
CREATE INDEX IF NOT EXISTS idx_nguoi_gio ON nguoi(gio_thang, gio_ngay);
CREATE INDEX IF NOT EXISTS idx_nguoi_chi ON nguoi(pha_id, chi);

CREATE TABLE IF NOT EXISTS hon_nhan (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  chong_id INTEGER NOT NULL REFERENCES nguoi(id) ON DELETE CASCADE,
  vo_id    INTEGER NOT NULL REFERENCES nguoi(id) ON DELETE CASCADE,
  thu_tu   INTEGER NOT NULL DEFAULT 1,               -- 1 = chính thất
  trang_thai TEXT NOT NULL DEFAULT 'dang'
             CHECK(trang_thai IN ('dang','ly_di')),
  ghi_chu  TEXT,
  UNIQUE(chong_id, vo_id)
);

CREATE TABLE IF NOT EXISTS media (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nguoi_id INTEGER NOT NULL REFERENCES nguoi(id) ON DELETE CASCADE,
  loai     TEXT    NOT NULL CHECK(loai IN ('anh','tai_lieu','mo')),
  r2_key   TEXT    NOT NULL UNIQUE,
  ten_file TEXT    NOT NULL,
  mo_ta    TEXT,
  dai_dien INTEGER NOT NULL DEFAULT 0,        -- 1 = ảnh đại diện hiện trên card
  chu_tren_bia TEXT,                          -- chép lại chữ trên bia mộ / giấy tờ trong ảnh
  tao_luc  TEXT    NOT NULL DEFAULT (datetime('now','+7 hours'))
);

CREATE INDEX IF NOT EXISTS idx_media_nguoi ON media(nguoi_id);
-- Mỗi người nhiều nhất một ảnh đại diện
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_dai_dien ON media(nguoi_id) WHERE dai_dien = 1;

-- ── Nguồn dẫn ─────────────────────────────────────────────────────────────────
-- Mỗi dữ kiện trong phả phải truy được về nơi nó đến từ đâu. Ghi lúc nhập thì rẻ;
-- một năm sau, khi ba mươi người đã nhập, thì không phục dựng lại được nữa.
CREATE TABLE IF NOT EXISTS nguon (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  loai           TEXT NOT NULL
                 CHECK(loai IN ('bia_mo','loi_ke','giay_to','pha_cu','anh','suy_doan','khac')),
  mo_ta          TEXT NOT NULL,                      -- 'Bia mộ cụ Thạch, nghĩa trang làng Đông'
  nguoi_cung_cap TEXT,                               -- ai kể / ai đưa
  ngay_thu_thap  TEXT,                               -- thu thập khi nào
  media_id       INTEGER REFERENCES media(id) ON DELETE SET NULL,  -- ảnh bia, ảnh giấy tờ
  do_tin_cay     TEXT NOT NULL DEFAULT 'vua'
                 CHECK(do_tin_cay IN ('cao','vua','thap')),
  ghi_chu        TEXT,
  tao_luc        TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);

-- Gắn một nguồn vào đúng một trường của một người. Hai nguồn mâu thuẫn thì giữ cả hai:
-- đừng chọn một rồi xoá cái kia, về sau ảnh bia mộ sẽ phân xử.
CREATE TABLE IF NOT EXISTS dan_nguon (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nguon_id INTEGER NOT NULL REFERENCES nguon(id) ON DELETE CASCADE,
  nguoi_id INTEGER NOT NULL REFERENCES nguoi(id) ON DELETE CASCADE,
  truong   TEXT NOT NULL,                            -- 'ngay_mat', 'ho_ten', 'cha_id'…
  trich    TEXT,                                     -- trích nguyên văn từ nguồn
  tao_luc  TEXT NOT NULL DEFAULT (datetime('now','+7 hours')),
  UNIQUE(nguon_id, nguoi_id, truong)
);

CREATE INDEX IF NOT EXISTS idx_dan_nguon_nguoi ON dan_nguon(nguoi_id);
CREATE INDEX IF NOT EXISTS idx_nguon_media ON nguon(media_id);

CREATE TABLE IF NOT EXISTS nguoi_dung (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ten        TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,                   -- SHA-256 hex của mã đăng nhập
  quyen      TEXT NOT NULL DEFAULT 'sua' CHECK(quyen IN ('admin','sua')),
  pha_id     INTEGER,                                -- NULL = mọi phả; có giá trị = chỉ phả đó
  chi        TEXT,                                   -- NULL = cả phả; có giá trị = chỉ chi đó
  chi_sua    INTEGER NOT NULL DEFAULT 1,             -- 0 = chỉ xem, không sửa gì
  tao_pha    INTEGER NOT NULL DEFAULT 0,             -- 1 = được tự mở phả riêng cho nhà mình
  tao_luc    TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);

-- Một người nhập liệu có thể được sửa nhiều phả (dâu/rể mở phả nhà mình
-- vẫn giữ quyền ở phả nhà chồng/vợ).
CREATE TABLE IF NOT EXISTS quyen_pha (
  nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  pha_id        INTEGER NOT NULL REFERENCES pha(id) ON DELETE CASCADE,
  PRIMARY KEY (nguoi_dung_id, pha_id)
);

CREATE TABLE IF NOT EXISTS nhat_ky (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  bang     TEXT NOT NULL,
  ban_ghi  INTEGER,
  hanh_dong TEXT NOT NULL CHECK(hanh_dong IN ('them','sua','xoa')),
  boi      TEXT NOT NULL,
  chi_tiet TEXT,
  luc      TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);

CREATE INDEX IF NOT EXISTS idx_nhatky_luc ON nhat_ky(luc);

CREATE TABLE IF NOT EXISTS cau_hinh (
  khoa    TEXT PRIMARY KEY,
  gia_tri TEXT NOT NULL,
  sua_luc TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);

INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri) VALUES
  ('tieu_de', 'Gia phả dòng họ'),
  ('phu_de',  'Phả hệ nội tộc');
