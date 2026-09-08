# Gia Phả — ứng dụng phả hệ dòng họ

Cloudflare Pages (giao diện) + Worker (API) + D1 (dữ liệu) + R2 (ảnh, tài liệu).
Không framework, không build step.

## Tính năng

| Mục | Mô tả |
|---|---|
| Cây phả hệ | SVG tự bố cục theo đời, vợ/chồng nằm cạnh nhau, kéo–thả và phóng to |
| Nhập liệu nhiều người | Mỗi người một mã truy cập riêng; khoá lạc quan chặn ghi đè khi 2 người sửa cùng lúc; nhật ký ghi ai sửa gì |
| Ảnh / tài liệu / mộ phần | Tải file lên R2, toạ độ mộ mở thẳng Google Maps |
| Ngày giỗ âm lịch | Quy đổi âm ↔ dương, đếm ngược ngày giỗ, xuất file `.ics` cho Google/Apple Calendar |
| Nhiều dòng họ | Nội, ngoại bên mẹ, ngoại bên vợ… trong cùng một site, liên kết qua hôn nhân |
| Tiêu đề riêng | Mỗi phả một tên + phụ đề, đặt trong `/admin.html` |
| Mở rộng lên đời trên | Nút **+ Cha/Mẹ**; nếu người đó đang là đời 1 thì cả cây tự tụt xuống 1 bậc |

## Chạy cục bộ trên Windows 11 (không cần tài khoản Cloudflare)

```
chay-local.bat
```

Lần đầu script tự cài wrangler, tạo `.dev.vars`, nạp `schema.sql` vào SQLite cục bộ rồi mở
`http://localhost:8788`. Giao diện và API chạy chung một cổng nên không cần sửa `GOC_API`.

| File | Việc |
|---|---|
| `chay-local.bat` | Chạy app. Đổi cổng: `chay-local.bat 9000` |
| `nap-mau.bat` | Xoá sạch rồi nạp 10 người mẫu (3 đời) để xem thử |
| `sao-luu.bat` | Xuất dữ liệu cục bộ ra `backup\giapha-<ngày>.sql` |
| `dua-len-mang.bat` | Đẩy dữ liệu cục bộ lên D1 trên Cloudflare (ghi đè) |

- Yêu cầu duy nhất: **Node.js LTS** (nodejs.org). Không cần Docker, không cần Python.
- Mã đăng nhập cục bộ nằm trong `.dev.vars` (mặc định `local-admin-key`) — đổi tuỳ ý rồi khởi động lại.
- Dữ liệu và ảnh nằm trong thư mục `.wrangler\state`. Copy cả thư mục này là sao lưu đầy đủ.
- Dừng server: `Ctrl+C`. Máy khác trong cùng mạng LAN muốn xem thì thêm `--ip 0.0.0.0` vào dòng `wrangler dev` trong `chay-local.bat` (và mở cổng trong Windows Firewall).
- `wrangler.local.toml` chỉ dùng cho bản cục bộ; bản trên mạng vẫn do `wrangler.toml.tpl` + `deploy.bat` lo.

## Cài đặt lên Cloudflare

```bash
cp .env.example .env      # điền CF_API_TOKEN, CF_ACCOUNT_ID, ADMIN_KEY
chmod +x deploy.sh
./deploy.sh               # Windows: deploy.bat
```

Token Cloudflare cần quyền: **D1:Edit, Workers:Edit, Pages:Edit, R2:Edit** (thêm **Zone:Edit** nếu dùng domain riêng).

Nếu **không** dùng domain riêng, Pages và Worker nằm ở hai tên miền khác nhau — mở
`public/assets/api.js`, đặt `GOC_API` thành URL Worker mà script in ra, rồi chạy lại `./deploy.sh`.
Có domain riêng thì để `GOC_API = ""` (route `/api/*` đã được nối sẵn).

## Nhiều dòng họ trong một site

Mỗi dòng họ là một **phả** (bảng `pha`). Người thuộc một phả gốc (`nguoi.pha_id`), nhưng
hôn nhân và quan hệ cha/mẹ được phép xuyên phả — mẹ bạn là *con gái* trong phả họ ngoại
và là *vợ* trong phả họ nội, chỉ một bản ghi duy nhất, sửa một nơi là đúng cả hai cây.

Tạo, **đổi tên** và xoá phả trong `/admin.html` — tên và phụ đề sửa tại chỗ rồi bấm *Lưu tên*.
Phả rỗng thì xoá được (kể cả phả đầu tiên), miễn còn lại ít nhất một phả. Trang đó liệt kê từng phả kèm số người, số đời, các chi,
và **danh sách cây** trong phả (mỗi gốc là một cây, kèm số con cháu) — một phả có thể chứa
nhiều cây rời nhau khi chưa nối được với nhau. Chuyển phả đang xem ở ô chọn trên đầu trang cây.

Cây của phả X gồm: người thuộc phả X, cộng vợ/chồng của họ dù ở phả khác (hiện nhãn tên phả).
Ô tích **Con cháu ngoại phả** kéo thêm con cháu đã sang phả khác — dùng khi muốn cây họ ngoại
hiển thị cả cháu ngoại.

### Tách phả ngoại ra từ dữ liệu đã khai

Đã lỡ khai ông bà ngoại, mẹ, cậu dì chung vào phả nội thì không phải sửa từng người:
tạo phả mới trong `/admin.html`, mở **ông ngoại** trên cây, bấm **Chuyển phả…**.

Nhánh tính theo **dòng cha**: gốc + mọi người có `cha_id` nằm trong nhánh. Con của con gái
không đi theo, nên mẹ bạn sang phả ngoại còn bạn ở lại phả nội — sau đó hai phả nối với nhau
qua bản ghi hôn nhân bố–mẹ và qua `me_id` của bạn.

Tuỳ chọn *Kèm dâu* kéo theo vợ của nam giới trong nhánh (mợ, thím). Hộp thoại xem trước
danh sách trước khi chuyển. Thao tác này chỉ admin làm được, có ghi nhật ký, và chạy lại
lần hai không hỏng gì (0 người cần chuyển).

### Dâu/rể tự mở phả nhà mình

Admin bật ô **Được mở phả riêng** khi cấp mã. Người đó mở một thẻ bất kỳ trong phạm vi của mình
rồi bấm **Mở phả riêng…**: đặt tên phả, xem trước danh sách, hệ thống tạo phả và chuyển nhánh
theo dòng cha sang đó.

Người tự mở phả được cộng thêm quyền sửa ở phả mới (bảng `quyen_pha`) mà **vẫn giữ** quyền ở phả cũ —
con dâu sửa được cả phả nhà chồng lẫn phả họ mình. Không đụng được vào phả của người khác.

Không xoá được phả đang còn người.

## Đồ thị quan hệ

Dữ liệu vốn là đồ thị: đỉnh là người, cạnh là `cha_id` / `me_id` (có hướng) và `hon_nhan` (vô hướng).
Toàn bộ phép duyệt gom vào `public/assets/dothi.js` — Worker cũng import chính file đó, không chép lại:

| Hàm | Dùng cho |
|---|---|
| `toTien`, `conChau` | huyết thống hai chiều |
| `conChauPhuHe` | tách phả — con của con gái không đi theo |
| `anhChiEm`, `cungHuyetThong`, `noiToc` | lọc gợi ý bạn đời |
| `nhanQuanHe` | xưng hô: ông bà nội/ngoại, cô dì chú bác, thím, mợ, dượng, anh em họ |
| `langGieng` | vùng quan hệ quanh một người |

### Chế độ trung tâm

Mở một người rồi bấm **Đặt làm trung tâm**: cây thu về vùng quanh người đó — ông bà nội và ngoại,
cha mẹ, cô dì chú bác kèm dâu rể, anh chị em, vợ/chồng, con, cháu. Mỗi thẻ hiện nhãn xưng hô
so với người trung tâm. Bấm **← Cây đầy đủ** để quay lại.

Vai trên/dưới (bác hay chú, anh hay em) suy từ ngày sinh; thiếu ngày sinh thì ghi *bác/chú*
thay vì đoán bừa.

## Số đời

Đời là **trường dẫn xuất**, không nhập tay trừ ở người gốc:

- Gốc (không có cha lẫn mẹ trong dữ liệu) — bạn tự đặt, mặc định 1.
- Có cha/mẹ — đời = đời của cha + 1 (ưu tiên cha cùng phả, rồi mẹ).
- Dâu/rể chưa khai cha mẹ — lấy theo đời của bạn đời.

Máy chủ tính lại toàn bộ cây sau mỗi lần thêm/sửa người có đụng tới đời, cha, mẹ hoặc phả,
và sau khi khai hôn nhân. Đổi đời cụ tổ từ 1 sang 5 thì cả cây dịch theo. Chèn cụ kỵ lên
trên cụ tổ thì cụ tổ tự thành đời 2 — không phải "đẩy đời" thủ công nữa.

Ô *Đời thứ* trong form tự khoá khi người đó đã có cha hoặc mẹ. Nút **Tính lại số đời toàn bộ**
trong `/admin.html` dùng khi dữ liệu cũ có số đời lệch.

## Phân quyền

Mỗi người nhập liệu có một mã truy cập riêng, tạo trong `/admin.html`. Bốn mức:

| Mức | Đọc | Sửa |
|---|---|---|
| Admin | toàn cây | toàn cây + xoá người, đẩy đời, sửa tiêu đề, cấp mã |
| Sửa toàn cây | toàn cây | toàn cây |
| Sửa trong phả/chi | toàn cây | chỉ người thuộc phả (và chi, nếu có) được giao; có thể được giao nhiều phả |
| Chỉ xem | toàn cây | không |

Mọi người đăng nhập đều đọc được toàn bộ cây; giới hạn chỉ áp cho thao tác ghi.

Phạm vi dựa trên `nguoi.pha_id` và `nguoi.chi`, điền ở form thêm/sửa người. Người được giao phạm vi thì:
người mới họ tạo tự mang phả/chi đó, không chuyển ai sang phả hoặc chi khác được.
Khai hôn nhân chỉ cần **một** đầu nằm trong phạm vi — vì dâu/rể thường thuộc phả khác.

Kiểm tra nằm ở Worker, không phải ở giao diện — giấu nút thôi thì gọi thẳng API vẫn qua được.

## Dùng lần đầu

1. Mở site → đăng nhập bằng `ADMIN_KEY`.
2. `/admin.html` → tạo mã cho từng người trong họ (quyền *Sửa*; chỉ *Admin* mới xoá được).
3. `/admin.html` → đặt **Tiêu đề** (vd *Gia phả dòng họ Nguyễn*) và **Phụ đề**.
4. Trang chính → **+ Thêm người** cho cụ tổ → **+ Vợ/chồng** → **+ Con** cho các đời sau.

Tìm ra đời trên sau này thì bấm **+ Cha/Mẹ** ở người đang đứng đầu cây. Nếu người đó là đời 1,
app hỏi xác nhận rồi tự đẩy toàn bộ cây xuống một bậc (đời 1 → 2, 2 → 3…) trước khi chèn cụ mới vào đời 1.
Thao tác này cần quyền admin và được ghi vào nhật ký.

Nhập ngày mất dương lịch thì ngày/tháng giỗ âm được điền tự động — vẫn sửa tay được nếu gia phả cũ ghi khác.

## Cấu trúc

```
public/            Pages: index.html (cây), gio.html (ngày giỗ), admin.html
  assets/          style.css, api.js, cay.js (bố cục cây), dothi.js (đồ thị quan hệ), amlich.js (âm lịch)
workers/api/       index.js — toàn bộ API
schema.sql         5 bảng: nguoi, hon_nhan, media, nguoi_dung, nhat_ky
```

## API

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/health` | công khai |
| POST | `/api/dang-nhap` | công khai |
| GET | `/api/cay` | đã đăng nhập |
| POST / PATCH / DELETE | `/api/nguoi[/:id]` | sửa / sửa / admin |
| POST / DELETE | `/api/hon-nhan[/:id]` | sửa |
| POST / GET / DELETE | `/api/media[/:id]` | sửa / đăng nhập / sửa |
| GET / POST / DELETE | `/api/nguoi-dung[/:id]` | admin |
| GET / POST / PATCH / DELETE | `/api/pha[/:id]` | đăng nhập / admin |
| GET / PUT | `/api/cau-hinh` | đăng nhập / admin |
| POST | `/api/tinh-doi` | sửa |
| POST | `/api/chuyen-pha` | admin |
| POST | `/api/day-doi` | admin |
| GET | `/api/nhat-ky` | admin |

PATCH gửi kèm `sua_luc` lấy từ lần đọc gần nhất; sai thì trả `409` kèm `conflict: true`.

## Ghi chú

- Âm lịch dùng bảng tra dựng sẵn cho **1800–2099** (dữ liệu lịch Việt Nam của Hồ Ngọc Đức), không tính lại vị trí mặt trăng lúc chạy. Bảng đã phản ánh các lần Việt Nam đổi múi giờ nên khớp lịch in trong nước, kể cả giai đoạn trước 1968. Ngày ngoài dải này không quy đổi được — giao diện để trống phần âm lịch và cho nhập ngày giỗ bằng tay.
- Ngày giỗ ghi mùng 30 mà tháng âm đó chỉ có 29 ngày thì lịch lùi về ngày 29.
- Xác thực dùng mã chia sẻ, không phải tài khoản/mật khẩu riêng từng người. Đủ cho phạm vi nội bộ dòng họ; **[Inference]** nếu về sau muốn công khai một phần cây cho người ngoài, nên bổ sung lớp đăng nhập thật.
- Ảnh không được nén phía máy chủ, giới hạn 10 MB/file.
- `wrangler.toml` và `.env` không commit — script tự sinh `wrangler.toml` mỗi lần deploy.

## Cập nhật UI (07/09/2026)

- **Danh sách gia phả** trên trang cây: xem các phả và số người, chọn để mở; URL giữ phả đang xem khi tải lại. **Quản trị → Các phả → Lưu tên** đổi tên và phụ đề.
- Mở card → **Đặt làm trung tâm** để xem vùng họ hàng và nhãn xưng hô. **← Cây đầy đủ** để quay lại.
- **Sửa** ngay trên card mở form chỉnh thông tin. Chỉ người có quyền sửa mới thấy nút.
- Tích **Card dọc** để giảm chiều ngang; lựa chọn được nhớ trên trình duyệt. Tên vẫn nằm ngang và tự xuống dòng.
- **+ Cha/Mẹ** tạo người mới trong cùng phả/chi của người đang mở. Thêm cha/mẹ phía trên đời 1 thì nhánh con cháu tự tăng số đời; không đẩy các cây rời khác.
- Đường nối con được dựng theo cha/mẹ thực tế sau khi bố cục xong, kể cả cặp vợ chồng chỉ có một con.
- Lỗi tải cây có thông báo và nút **Thử lại**. Nút lưu tạm khóa trong khi gửi để tránh nhấp lặp.

Kiểm tra bố cục: `npm test`. Ảnh kiểm tra UI nằm trong `output/playwright/`.
