# Gia Phả — ứng dụng phả hệ dòng họ

Cloudflare Pages (giao diện) + Worker (API) + D1 (dữ liệu) + R2 (ảnh, tài liệu).
Không framework, không build step.

## Tính năng

| Mục | Mô tả |
|---|---|
| Cây phả hệ | SVG tự bố cục theo đời, vợ/chồng nằm cạnh nhau, kéo–thả và phóng to |
| Nhập liệu nhiều người | Mỗi người một mã truy cập riêng; khoá lạc quan chặn ghi đè khi 2 người sửa cùng lúc; nhật ký ghi ai sửa gì |
| **Hàng đợi duyệt** | Người nhà **gửi đề xuất** thay vì ghi thẳng; người phụ trách duyệt rồi mới lên cây |
| **Ngày tháng mờ** | Ghi được *khoảng 1890*, *trước 1945*, *chỉ biết năm*, và nguyên văn bản phả chép |
| **Nguồn dẫn** | Mỗi dữ kiện truy được về bia mộ / lời kể / phả cũ / giấy tờ, kèm độ tin cậy |
| Ảnh / tài liệu / mộ phần | Tải file lên R2, chọn ảnh đại diện, **ảnh bia mộ** chép được chữ trên bia |
| Ngày giỗ âm lịch | Quy đổi âm ↔ dương, đếm ngược ngày giỗ, xuất file `.ics` cho Google/Apple Calendar |
| **Lịch vạn niên** | Lịch tháng âm–dương, can chi, hoàng đạo, tiết khí, đánh dấu ngày giỗ trong họ |
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

---

## Đưa lên mạng

Ví dụ dưới dùng domain `giapha.hpradar.com`. Làm theo đúng thứ tự — bước 1 phải xong
**trước** khi có người ngoài chạm vào site.

### Bước 0 — Điền `.env`

`.env.example` chỉ là mẫu; chép sang `.env` rồi điền giá trị thật. Chưa điền thì
`deploy.sh` không chạy được.

```bash
cp .env.example .env
```

```
CF_API_TOKEN=<token có quyền D1:Edit, Workers:Edit, Pages:Edit, R2:Edit, Zone:Edit>
CF_ACCOUNT_ID=<Dashboard → góc phải>
CF_ZONE_ID=<Dashboard → hpradar.com → Overview → góc phải>
DOMAIN=giapha.hpradar.com
ADMIN_KEY=<chuỗi ngẫu nhiên 32+ ký tự>
```

Sinh `ADMIN_KEY` bằng `openssl rand -base64 32` — **đừng tự nghĩ chuỗi**.
`hpradar.com` phải đã là zone trong tài khoản Cloudflare, nếu không bước gắn domain sẽ trượt.

### Bước 1 — Siết bảo mật trước khi mở

Bốn việc. Ba việc đầu là sửa mã, việc cuối làm trên Dashboard.

1. **Mã ngẫu nhiên thay vì tự gõ.** `/admin.html` hiện chỉ đòi ≥ 8 ký tự. Đổi thành nút sinh
   mã ngẫu nhiên 20 ký tự, không cho gõ tay. Mã kiểu `giapha2024` bị dò ra trong vài giờ.
2. **Bỏ token khỏi URL ảnh.** `anhURL()` trong `public/assets/api.js` đang gắn `?token=`,
   nên mã lọt vào lịch sử trình duyệt, log Cloudflare, và cả HTML của bảng chi tiết.
   Gửi ảnh cho nhau là gửi luôn quyền vào cả gia phả.
3. **Tắt `workers.dev`.** Thêm `workers_dev = false` vào `wrangler.toml.tpl`, nếu không API
   vẫn gọi thẳng được qua `giapha-api.<account>.workers.dev`, đi vòng mọi luật WAF.
4. **Chặn thử-sai đăng nhập.** Dashboard → Security → **Rate Limiting Rules**:
   `giapha.hpradar.com/api/dang-nhap`, 5 lần / 1 phút / IP. Hiện `/api/dang-nhap`
   **không đếm lần sai**, nên không có cái này thì mã bị dò thoải mái.

### Bước 2 — Deploy

```bash
./deploy.sh          # Windows: deploy.bat
```

Script tự làm: nạp `schema.sql`, chạy `migrations.sql`, đặt secret `ADMIN_KEY`,
deploy Worker, deploy Pages, gắn domain và route `giapha.hpradar.com/api/*` về Worker.

Không dùng domain riêng thì Pages và Worker nằm ở hai tên miền khác nhau — mở
`public/assets/api.js`, đặt `GOC_API` thành URL Worker mà script in ra, rồi chạy lại.
Có domain riêng thì để `GOC_API = ""`.

### Bước 3 — Kiểm CSDL remote đã lên cột mới chưa

**Đây là chỗ dễ trượt nhất.** `schema.sql` chỉ tạo bảng khi *chưa tồn tại*, nên với CSDL đã có
dữ liệu thì cột mới phải vào bằng `migrations.sql`.

```bash
npx wrangler d1 execute giapha-db --remote --command \
  "SELECT name FROM pragma_table_info('nguoi') WHERE name LIKE 'sinh_%' OR name LIKE 'mat_%';"
npx wrangler d1 execute giapha-db --remote --command \
  "SELECT name FROM sqlite_master WHERE name IN ('nguon','dan_nguon','de_xuat');"
```

Phải thấy đủ **6 cột** (`sinh_kieu, sinh_den, sinh_goc, mat_kieu, mat_den, mat_goc`) và
**3 bảng**. Thiếu thì chạy tay từng lệnh `ALTER TABLE` trong `migrations.sql` với `--remote`.

> Chạy `migrations.sql` bằng `--file` sẽ **dừng ở lỗi đầu tiên** (`duplicate column`) và bỏ qua
> toàn bộ phần sau. `deploy.sh` và `deploy.bat` nạp **từng dòng** nên không dính lỗi này —
> nhưng cũng vì thế mà **mọi lệnh trong `migrations.sql` phải nằm gọn một dòng**.

### Bước 4 — Thử trước khi mời ai

```bash
curl -s https://giapha.hpradar.com/api/health
curl -s https://giapha.hpradar.com/api/cay -H "X-Token: <ADMIN_KEY>" | head -c 200
```

Rồi mở trang, đăng nhập, thêm thử một người có ngày *khoảng 1890*, một nguồn dẫn, một ảnh bia.
Xong **xoá dữ liệu thử đi**.

### Bước 5 — Cổng email (Cloudflare Access)

Cửa ngoài: ai không có trong danh sách email thì không chạm được tới site, kể cả `/api/*`.
Mã truy cập vẫn là cửa trong, nên người nhà qua **hai cửa**.

1. Dashboard → **Zero Trust** (lần đầu sẽ bắt đặt tên team).
2. **Access → Applications → Add an application → Self-hosted.**
   Subdomain `giapha`, domain `hpradar.com`. Session duration đặt **1 tháng** để người già
   không phải đăng nhập lại suốt.
3. **Add policy:** Action `Allow` → Include → `Emails`, dán danh sách email người nhà
   (hoặc `Emails ending in` nếu cả họ dùng chung một đuôi).
4. **Login methods:** bật **One-time PIN** — người nhà gõ email, nhận mã 6 số qua mail.

Gói Zero Trust miễn phí tới khoảng 50 người *(kiểm lại trên trang giá, Cloudflare hay đổi)*.

Muốn bỏ cửa trong thì sửa Worker đọc header `Cf-Access-Authenticated-User-Email` rồi tra vai
trò trong `nguoi_dung` — bỏ hẳn mã truy cập, khoảng nửa ngày.

### Bước 6 — Phát quyền cho người nhà

Trong `/admin.html` tạo tài khoản cho **từng người một mã riêng**. Đừng phát chung `ADMIN_KEY`:
nhật ký sẽ chỉ ghi "admin" và không truy được ai sửa gì.

**Khuyến nghị khi mở cho cả họ: cấp `Chỉ xem` cho tất cả.** Họ vẫn đóng góp được đầy đủ qua
hàng đợi duyệt mà không ai sửa hỏng cây. Ai gửi đề xuất tốt đều đặn thì nâng lên *Sửa*.

---

## Hàng đợi duyệt

Người nhà **không ghi thẳng vào cây**. Ai không có quyền sửa sẽ thấy nút **Đề xuất sửa**
(và **+ Đề xuất thêm người**) thay cho dòng báo chỉ-xem. Form vẫn là form cũ, thêm một ô
bắt buộc: *Bạn lấy tin này ở đâu?*

Giao diện chỉ gửi **phần thực sự đổi**, nên người duyệt nhìn ra ngay cái gì mới.

`/duyet.html` hiện bảng ba cột — trường / đang là / đề xuất — với giá trị dịch sang tiếng người
(`cha_id` thành tên cha, `sinh_kieu` thành *khoảng*). Đề xuất không khai nguồn tin bị đánh dấu đỏ.
Nav có chuông đếm số đang chờ.

Duyệt thì đẩy lại qua đúng đường thêm/sửa thường ngày, nên tái dùng nguyên vẹn kiểm tra phạm vi
chi/phả, chặn vòng cha/mẹ, tính lại đời và ghi nhật ký — không có đường tắt nào lách qua được.
Người duyệt chỉ thấy đề xuất trong phạm vi mình được giao.

**Duyệt xong tự sinh nguồn dẫn** ghi tên người gửi và lý do họ khai, dẫn cho từng trường đã đổi.
Người gửi chính là xuất xứ của dữ kiện, ghi tự động, khỏi phải đi hỏi lại sau.

## Ngày tháng mờ

Gia phả cũ hiếm khi có ngày đầy đủ. `ngay_sinh` / `ngay_mat` nhận `1890`, `1890-03`,
`1890-03-12`, kèm mức chắc chắn: *chính xác · khoảng · trước · sau · trong khoảng · không rõ*,
một mốc thứ hai cho khoảng, và ô **nguyên văn** giữ đúng chữ bản phả chép (`Giáp Tý niên`).

Điều này quan trọng hơn vẻ ngoài của nó: người nhà biết *"cụ mất khoảng 1950"* mà ô nhập đòi
`YYYY-MM-DD` thì họ sẽ gõ `1950-01-01`, và bạn **mất vĩnh viễn** ranh giới giữa *mất mùng 1
tháng Giêng* và *mất đâu đó quanh 1950*. Nhân lên vài trăm lần thì cây trông chính xác mà
thực ra là bịa.

Hai hệ quả:

- Ngày mất **không chắc chắn** thì **không tự suy ngày giỗ âm** nữa — suy giỗ từ *khoảng 1950*
  là bịa ra một ngày cúng. Nhập tay theo gia phả hoặc bia mộ.
- **Tuổi** chỉ hiện khi cả hai ngày đủ ba vế và chắc chắn. Trên card, năm không chắc chắn có dấu `~`.

## Nguồn dẫn

Ranh giới giữa một album gia đình và một công trình gia phả là ở chỗ mỗi khẳng định có dẫn được
bằng chứng hay không. Hai bảng:

- **`nguon`** — loại (bia mộ / lời kể / phả cũ / giấy tờ / ảnh / suy đoán), mô tả, ai cung cấp,
  ngày thu thập, ảnh kèm, độ tin cậy.
- **`dan_nguon`** — gắn một nguồn vào **đúng một trường** của một người, kèm trích nguyên văn.

Hai nguồn mâu thuẫn thì **giữ cả hai**, đừng chọn một rồi xoá cái kia — về sau ảnh bia mộ sẽ
phân xử. Bảng chi tiết nói thẳng khi một người chưa có nguồn nào.

**Ảnh bia mộ** tải bằng nút riêng, có nhãn `BIA`, chép được chữ trên bia (giữ nguyên chữ Hán),
và một nút biến ảnh đó thành nguồn dẫn cho ngày mất — điền sẵn loại, độ tin cậy cao, và trích
chữ đã chép.

## Lịch vạn niên

`/lich.html` — lịch tháng âm–dương, can chi ngày/tháng/năm, nạp âm, ngày hoàng đạo/hắc đạo,
giờ hoàng đạo, tiết khí, ngày lễ Việt Nam, và **đánh dấu ngày giỗ trong họ** ngay trên ô lịch
(giỗ hiện trước ngày lễ — đây là lịch của dòng họ). Hộp **Đổi ngày âm ↔ dương** đổi được cả hai
chiều, kể cả tháng nhuận.

Toàn bộ phần âm lịch nằm trong `public/assets/amlich.js` — một bộ bảng tra duy nhất cho cả
trang giỗ lẫn trang lịch, không có bản chép thứ hai.

## Nhiều dòng họ trong một site

Mỗi dòng họ là một **phả** (bảng `pha`). Người thuộc một phả gốc (`nguoi.pha_id`), nhưng
hôn nhân và quan hệ cha/mẹ được phép xuyên phả — mẹ bạn là *con gái* trong phả họ ngoại
và là *vợ* trong phả họ nội, chỉ một bản ghi duy nhất, sửa một nơi là đúng cả hai cây.

Tạo, **đổi tên** và xoá phả trong `/admin.html` — tên và phụ đề sửa tại chỗ rồi bấm *Lưu tên*.
Phả rỗng thì xoá được (kể cả phả đầu tiên), miễn còn lại ít nhất một phả. Trang đó liệt kê từng phả kèm số người, số đời, các chi,
và **danh sách cây** trong phả (mỗi gốc là một cây, kèm số con cháu) — một phả có thể chứa
nhiều cây rời nhau khi chưa nối được với nhau. Chuyển phả đang xem ở ô chọn trên đầu trang cây,
hoặc mở **Danh sách gia phả** để xem tên, phụ đề, số người và số cây của từng phả.

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
so với người trung tâm. Bấm lại nút đó (**Bỏ trung tâm**) hoặc **← Cây đầy đủ** để quay lại.

Vai trên/dưới (bác hay chú, anh hay em) suy từ ngày sinh; thiếu ngày sinh thì ghi *bác/chú*
thay vì đoán bừa.

## Card trên cây

Mỗi thẻ hiện ký hiệu giới tính ♂ / ♀ / ⚲ ở góc phải, dấu **†** cho người đã khuất, vạch màu
giới tính ở mép trái, và **khung ảnh oval** kiểu ảnh thờ. Ảnh đại diện chọn được: mở bảng chi
tiết, bấm *Đặt đại diện* dưới ảnh muốn dùng; chưa chọn thì lấy ảnh đầu tiên.

Tích **Card dọc** để giảm chiều ngang; lựa chọn được nhớ trên trình duyệt.

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

| Mức | Đọc | Sửa | Đề xuất | Duyệt |
|---|---|---|---|---|
| Admin | toàn cây | toàn cây + xoá người, đẩy đời, sửa tiêu đề, cấp mã | ✓ | mọi phả |
| Sửa toàn cây | toàn cây | toàn cây | ✓ | mọi phả |
| Sửa trong phả/chi | toàn cây | chỉ người thuộc phả (và chi, nếu có) được giao | ✓ | trong phạm vi |
| Chỉ xem | toàn cây | không | ✓ | không |

Mọi người đăng nhập đều đọc được toàn bộ cây; giới hạn chỉ áp cho thao tác ghi.
**Ai cũng gửi đề xuất được, kể cả tài khoản chỉ-xem** — đó chính là điểm của hàng đợi.

Phạm vi dựa trên `nguoi.pha_id` và `nguoi.chi`, điền ở form thêm/sửa người. Người được giao phạm vi thì:
người mới họ tạo tự mang phả/chi đó, không chuyển ai sang phả hoặc chi khác được.
Khai hôn nhân chỉ cần **một** đầu nằm trong phạm vi — vì dâu/rể thường thuộc phả khác.

Kiểm tra nằm ở Worker, không phải ở giao diện — giấu nút thôi thì gọi thẳng API vẫn qua được.

## Dùng lần đầu

1. Mở site → đăng nhập bằng `ADMIN_KEY`.
2. `/admin.html` → tạo mã cho từng người trong họ (xem khuyến nghị ở **Bước 6**).
3. `/admin.html` → đặt **Tiêu đề** (vd *Gia phả dòng họ Nguyễn*) và **Phụ đề**.
4. Trang chính → **+ Thêm người** cho cụ tổ → **+ Vợ/chồng** → **+ Con** cho các đời sau.

Tìm ra đời trên sau này thì bấm **+ Cha/Mẹ** ở người đang đứng đầu cây. Nếu người đó là đời 1,
app hỏi xác nhận rồi tự đẩy toàn bộ cây xuống một bậc trước khi chèn cụ mới vào đời 1.

Nhập ngày mất dương lịch **chính xác** thì ngày/tháng giỗ âm được điền tự động — vẫn sửa tay
được nếu gia phả cũ ghi khác. Ngày mất mờ thì phải nhập giỗ bằng tay (xem **Ngày tháng mờ**).

### Thu thập dữ liệu — vài điều nên biết trước

- **Ưu tiên các cụ cao tuổi nhất, ngay bây giờ.** Đây là nguồn duy nhất có hạn sử dụng.
  Ghi âm lại, đừng chỉ chép.
- **Chụp bia mộ cả nghĩa trang trong một buổi.** Chữ trên bia mòn dần, và **cải táng thì bia cũ
  thường bỏ đi** — mất là mất hẳn.
- **Hỏi cụ thể.** *"Ông mất năm nào, giỗ ngày mấy âm, chôn ở đâu, có cải táng không"* thu được
  nhiều hơn *"cụ kể về ông đi"*.
- **Ghi cả cái mâu thuẫn.** Hai người nói khác nhau thì giữ cả hai kèm tên người nói.

## Cấu trúc

```
public/            index.html (cây), gio.html (ngày giỗ), lich.html (lịch vạn niên),
                   duyet.html (hàng đợi duyệt), admin.html (quản trị)
  assets/          style.css, api.js, cay.js (bố cục cây),
                   dothi.js (đồ thị quan hệ), amlich.js (âm lịch + lịch vạn niên)
workers/api/       index.js — toàn bộ API
schema.sql         11 bảng: pha, nguoi, hon_nhan, media, nguon, dan_nguon,
                   de_xuat, nguoi_dung, quyen_pha, nhat_ky, cau_hinh
migrations.sql     nâng cấp CSDL đã có — mỗi lệnh phải nằm gọn MỘT DÒNG
tests/             npm test — kiểm bố cục cây
```

## API

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/health` | công khai |
| POST | `/api/dang-nhap` | công khai |
| GET | `/api/cay`, `/api/toi` | đã đăng nhập |
| POST / PATCH / DELETE | `/api/nguoi[/:id]` | sửa / sửa / admin |
| POST / DELETE | `/api/hon-nhan[/:id]` | sửa |
| POST / GET / PATCH / DELETE | `/api/media[/:id]` | sửa / đăng nhập / sửa / sửa |
| POST | `/api/de-xuat` | **đã đăng nhập** (kể cả chỉ-xem) |
| GET | `/api/de-xuat?trang_thai=` | sửa |
| POST | `/api/de-xuat/:id` | sửa — body `{}` là duyệt, `{tu_choi:true}` là từ chối |
| GET / POST / DELETE | `/api/nguon[/:id]` | đăng nhập / sửa / sửa |
| POST / DELETE | `/api/dan-nguon[/:id]` | sửa |
| GET / POST / DELETE | `/api/nguoi-dung[/:id]` | admin |
| GET / POST / PATCH / DELETE | `/api/pha[/:id]` | đăng nhập / admin |
| GET / PUT | `/api/cau-hinh` | đăng nhập / admin |
| POST | `/api/tinh-doi` | sửa |
| POST | `/api/chuyen-pha`, `/api/day-doi` | admin |
| GET | `/api/nhat-ky` | admin |

PATCH `/api/nguoi/:id` gửi kèm `sua_luc` lấy từ lần đọc gần nhất; sai thì trả `409` kèm `conflict: true`.
`PATCH /api/media/:id` nhận `{dai_dien:1|0}` để đổi ảnh đại diện, hoặc `{chu_tren_bia}` để chép chữ bia.

## Ghi chú

- Âm lịch dùng bảng tra dựng sẵn cho **1800–2099** (dữ liệu lịch Việt Nam của Hồ Ngọc Đức), không tính lại vị trí mặt trăng lúc chạy. Bảng đã phản ánh các lần Việt Nam đổi múi giờ nên khớp lịch in trong nước, kể cả giai đoạn trước 1968. Ngày ngoài dải này không quy đổi được — giao diện để trống phần âm lịch và cho nhập ngày giỗ bằng tay.
- Ngày giỗ ghi mùng 30 mà tháng âm đó chỉ có 29 ngày thì lịch lùi về ngày 29.
- **Nạp âm, hoàng đạo và giờ hoàng đạo** tính theo quy tắc chuẩn (chỉ số lục thập hoa giáp `(jd+49)%60`; sao Thanh Long ở chi `2*(tháng-1)`, sáu sao lệch `[0,1,4,5,7,10]`). **Tuổi xung** thì cách chọn thiên can tuỳ sách — chưa đối chiếu được nguồn chuẩn.
- Ảnh không được nén phía máy chủ, giới hạn 10 MB/file.
- `wrangler.toml` và `.env` không commit — script tự sinh `wrangler.toml` mỗi lần deploy.

## Việc còn nợ

| Việc | Vì sao chưa làm |
|---|---|
| **Responsive cho điện thoại/tablet** | Chỉ có một ngưỡng `max-width:700px`, không có nhánh tablet. Kéo cây **chỉ nghe chuột** nên **không pinch-zoom được** trên máy chạm. Kế hoạch 4 giai đoạn ~10h đã lập. |
| Bốn việc bảo mật ở **Bước 1** | Chưa làm — phải xong trước khi mở public |
| Che thông tin người còn sống | Hiện ai đăng nhập cũng thấy ngày sinh, nơi an táng, toạ độ mộ của mọi người. Là quyết định đã cân nhắc, không phải sót. |
| Mô hình sự kiện, GEDCOM, in sách | Thêm sau được mà không mất dữ liệu, vì nền ngày-mờ và nguồn-dẫn đã có |

## Nhật ký thay đổi

**09/09/2026** — Hàng đợi duyệt (`de_xuat`, `/duyet.html`); duyệt xong tự sinh nguồn dẫn ghi tên người gửi.

**08/09/2026** — Ngày tháng mờ (`*_kieu`, `*_den`, `*_goc`); nguồn dẫn (`nguon`, `dan_nguon`); ảnh bia mộ chép được chữ Hán. Lịch vạn niên `/lich.html`, gộp từ thư mục `lich/` cũ, dùng chung một bộ bảng tra âm lịch. Card có ký hiệu giới tính, dấu người đã khuất, khung ảnh oval. Chọn được ảnh đại diện.

**07/09/2026** — Danh sách gia phả trên trang cây; chế độ trung tâm và nhãn xưng hô; sửa ngay trên card; card dọc; **+ Cha/Mẹ** tự dịch đời; đường nối con dựng theo cha/mẹ thực tế; lỗi tải cây có nút **Thử lại**.

Kiểm tra bố cục: `npm test`.
