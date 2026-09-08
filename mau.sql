-- Dữ liệu mẫu (3 đời) — chỉ để xem thử giao diện.
-- Xoá sạch bằng: nap-mau.bat xoa

DELETE FROM nhat_ky; DELETE FROM media; DELETE FROM hon_nhan; DELETE FROM nguoi;

INSERT INTO nguoi (id, ho_ten, ten_khac, gioi_tinh, doi, cha_id, me_id, ngay_sinh, ngay_mat, gio_ngay, gio_thang, noi_an_tang, ghi_chu) VALUES
 (1,'Nguyễn Văn Tổ','huý Đức','nam',1,NULL,NULL,'1902-03-11','1971-05-25',1,4,'Nghĩa trang họ Nguyễn, Thuỷ Nguyên','Cụ tổ chi trưởng'),
 (2,'Trần Thị Mão',NULL,'nu',1,NULL,NULL,'1906-08-02','1980-12-14',8,11,'Nghĩa trang họ Nguyễn, Thuỷ Nguyên',NULL),
 (3,'Nguyễn Văn An',NULL,'nam',2,1,2,'1935-03-02','2012-01-30',7,1,'Nghĩa trang họ Nguyễn, Thuỷ Nguyên',NULL),
 (4,'Nguyễn Thị Bình',NULL,'nu',2,1,2,'1938-06-19',NULL,NULL,NULL,NULL,'Lấy chồng họ Phạm, Kiến An'),
 (5,'Lê Thị Cúc',NULL,'nu',2,NULL,NULL,'1940-02-08',NULL,NULL,NULL,NULL,NULL),
 (6,'Phạm Văn Dũng',NULL,'nam',2,NULL,NULL,'1936-11-21',NULL,NULL,NULL,NULL,NULL),
 (7,'Nguyễn Văn Em',NULL,'nam',3,3,5,'1962-04-17',NULL,NULL,NULL,NULL,NULL),
 (8,'Nguyễn Thị Hoa',NULL,'nu',3,3,5,'1965-09-30',NULL,NULL,NULL,NULL,NULL),
 (9,'Phạm Thị Giang',NULL,'nu',3,6,4,'1963-07-05',NULL,NULL,NULL,NULL,NULL),
 (10,'Nguyễn Văn Hải',NULL,'nam',4,7,NULL,'1990-01-22',NULL,NULL,NULL,NULL,'Đời thứ tư');

INSERT INTO hon_nhan (chong_id, vo_id, thu_tu) VALUES (1,2,1),(3,5,1),(6,4,1);
