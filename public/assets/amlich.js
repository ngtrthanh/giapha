// amlich.js — chuyển đổi Âm ↔ Dương lịch Việt Nam, 1800–2099.
// Dùng bảng tra dựng sẵn theo dữ liệu lịch Việt Nam (Hồ Ngọc Đức), không tính lại
// vị trí mặt trăng lúc chạy. Bảng đã tính sẵn các lần đổi múi giờ của Việt Nam
// (+8 / +7 / +7:06 tuỳ giai đoạn) nên khớp lịch in trong nước, kể cả trước 1968.
const TK19=[0x30baa3,0x56ab50,0x422ba0,0x2cab61,0x52a370,0x3c51e8,0x60d160,0x4ae4b0,0x376926,0x58daa0,0x445b50,0x3116d2,0x562ae0,0x3ea2e0,0x28e2d2,0x4ec950,0x38d556,0x5cb520,0x46b690,0x325da4,0x5855d0,0x4225d0,0x2ca5b3,0x52a2b0,0x3da8b7,0x60a950,0x4ab4a0,0x35b2a5,0x5aad50,0x4455b0,0x302b74,0x562570,0x4052f9,0x6452b0,0x4e6950,0x386d56,0x5e5aa0,0x46ab50,0x3256d4,0x584ae0,0x42a570,0x2d4553,0x50d2a0,0x3be8a7,0x60d550,0x4a5aa0,0x34ada5,0x5a95d0,0x464ae0,0x2eaab4,0x54a4d0,0x3ed2b8,0x64b290,0x4cb550,0x385757,0x5e2da0,0x4895d0,0x324d75,0x5849b0,0x42a4b0,0x2da4b3,0x506a90,0x3aad98,0x606b50,0x4c2b60,0x359365,0x5a9370,0x464970,0x306964,0x52e4a0,0x3cea6a,0x62da90,0x4e5ad0,0x392ad6,0x5e2ae0,0x4892e0,0x32cad5,0x56c950,0x40d4a0,0x2bd4a3,0x50b690,0x3a57a7,0x6055b0,0x4c25d0,0x3695b5,0x5a92b0,0x44a950,0x2ed954,0x54b4a0,0x3cb550,0x286b52,0x4e55b0,0x3a2776,0x5e2570,0x4852b0,0x32aaa5,0x56e950,0x406aa0,0x2abaa3,0x50ab50];
const TK20=[0x3c4bd8,0x624ae0,0x4ca570,0x3854d5,0x5cd260,0x44d950,0x315554,0x5656a0,0x409ad0,0x2a55d2,0x504ae0,0x3aa5b6,0x60a4d0,0x48d250,0x33d255,0x58b540,0x42d6a0,0x2cada2,0x5295b0,0x3f4977,0x644970,0x4ca4b0,0x36b4b5,0x5c6a50,0x466d50,0x312b54,0x562b60,0x409570,0x2c52f2,0x504970,0x3a6566,0x5ed4a0,0x48ea50,0x336a95,0x585ad0,0x442b60,0x2f86e3,0x5292e0,0x3dc8d7,0x62c950,0x4cd4a0,0x35d8a6,0x5ab550,0x4656a0,0x31a5b4,0x5625d0,0x4092d0,0x2ad2b2,0x50a950,0x38b557,0x5e6ca0,0x48b550,0x355355,0x584da0,0x42a5b0,0x2f4573,0x5452b0,0x3ca9a8,0x60e950,0x4c6aa0,0x36aea6,0x5aab50,0x464b60,0x30aae4,0x56a570,0x405260,0x28f263,0x4ed940,0x38db47,0x5cd6a0,0x4896d0,0x344dd5,0x5a4ad0,0x42a4d0,0x2cd4b4,0x52b250,0x3cd558,0x60b540,0x4ab5a0,0x3755a6,0x5c95b0,0x4649b0,0x30a974,0x56a4b0,0x40aa50,0x29aa52,0x4e6d20,0x39ad47,0x5eab60,0x489370,0x344af5,0x5a4970,0x4464b0,0x2c74a3,0x50ea50,0x3d6a58,0x6256a0,0x4aaad0,0x3696d5,0x5c92e0];
const TK21=[0x46c960,0x2ed954,0x54d4a0,0x3eda50,0x2a7552,0x4e56a0,0x38a7a7,0x5ea5d0,0x4a92b0,0x32aab5,0x58a950,0x42b4a0,0x2cbaa4,0x50ad50,0x3c55d9,0x624ba0,0x4ca5b0,0x375176,0x5c5270,0x466930,0x307934,0x546aa0,0x3ead50,0x2a5b52,0x504b60,0x38a6e6,0x5ea4e0,0x48d260,0x32ea65,0x56d520,0x40daa0,0x2d56a3,0x5256d0,0x3c4afb,0x6249d0,0x4ca4d0,0x37d0b6,0x5ab250,0x44b520,0x2edd25,0x54b5a0,0x3e55d0,0x2a55b2,0x5049b0,0x3aa577,0x5ea4b0,0x48aa50,0x33b255,0x586d20,0x40ad60,0x2d4b63,0x525370,0x3e49e8,0x60c970,0x4c54b0,0x3768a6,0x5ada50,0x445aa0,0x2fa6a4,0x54aad0,0x4052e0,0x28d2e3,0x4ec950,0x38d557,0x5ed4a0,0x46d950,0x325d55,0x5856a0,0x42a6d0,0x2c55d4,0x5252b0,0x3ca9b8,0x62a930,0x4ab490,0x34b6a6,0x5aad50,0x4655a0,0x2eab64,0x54a570,0x4052b0,0x2ab173,0x4e6930,0x386b37,0x5e6aa0,0x48ad50,0x332ad5,0x582b60,0x42a570,0x2e52e4,0x50d160,0x3ae958,0x60d520,0x4ada90,0x355aa6,0x5a56d0,0x462ae0,0x30a9d4,0x54a2d0,0x3ed150,0x28e952];
export const NAM_MIN = 1800, NAM_MAX = 2099;

const INT = (d) => Math.floor(d);
export const jdn = (dd, mm, yy) => {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  return dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
};

export function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
  return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}

// Giải mã một năm âm lịch từ số nguyên đóng gói -> danh sách mùng 1 của 12 (hoặc 13) tháng
function giaiMaNam(yy, k) {
  const doDai = [29, 30], rm = new Array(12);
  const buDau = k >> 17, thangNhuan = k & 0xf, doDaiNhuan = doDai[(k >> 16) & 0x1];
  let jd = jdn(1, 1, yy) + buDau, j = k >> 4;
  for (let i = 0; i < 12; i++) { rm[11 - i] = doDai[j & 0x1]; j >>= 1; }
  const ra = [];
  const them = (m, nhuan, dai) => { ra.push({ month: m, leap: nhuan, jd }); jd += dai; };
  if (thangNhuan === 0) { for (let m = 1; m <= 12; m++) them(m, 0, rm[m - 1]); }
  else {
    for (let m = 1; m <= thangNhuan; m++) them(m, 0, rm[m - 1]);
    them(thangNhuan, 1, doDaiNhuan);
    for (let m = thangNhuan + 1; m <= 12; m++) them(m, 0, rm[m - 1]);
  }
  return ra;
}

const boNho = new Map();
export function thongTinNam(yy) {
  if (boNho.has(yy)) return boNho.get(yy);
  let k;
  if (yy < 1800 || yy > 2099) return [];
  if (yy < 1900) k = TK19[yy - 1800]; else if (yy < 2000) k = TK20[yy - 1900]; else k = TK21[yy - 2000];
  const r = giaiMaNam(yy, k);
  boNho.set(yy, r);
  return r;
}

// Dương -> Âm. Trả [ngày, tháng, năm, nhuận]; [0,0,0,0] nếu ngoài dải 1800–2099.
export function duongSangAm(dd, mm, yy) {
  if (yy < NAM_MIN || yy > NAM_MAX) return [0, 0, 0, 0];
  const jd = jdn(dd, mm, yy);
  let ly = thongTinNam(yy);
  if (!ly.length || jd < ly[0].jd) ly = thongTinNam(yy - 1);
  if (!ly.length || jd < ly[0].jd) return [0, 0, 0, 0];
  let i = ly.length - 1;
  while (jd < ly[i].jd) i--;
  const namAm = yy === NAM_MIN && jd < ly[0].jd ? yy - 1 : (ly === thongTinNam(yy) ? yy : yy - 1);
  return [jd - ly[i].jd + 1, ly[i].month, namAm, ly[i].leap];
}

// Âm -> Dương. Ngày vượt quá số ngày của tháng đó thì lùi về ngày cuối tháng
// (giỗ ghi 30 mà tháng chỉ có 29 ngày thì cúng 29 — theo lệ thường).
export function amSangDuong(ngay, thang, nam, nhuan = 0) {
  const ly = thongTinNam(nam);
  if (!ly.length) return [0, 0, 0];
  const i = ly.findIndex((x) => x.month === thang && x.leap === (nhuan ? 1 : 0));
  if (i < 0) return [0, 0, 0];
  const sau = i + 1 < ly.length ? ly[i + 1].jd : (thongTinNam(nam + 1)[0]?.jd ?? ly[i].jd + 30);
  const soNgay = sau - ly[i].jd;
  return jdToDate(ly[i].jd + Math.min(Math.max(ngay, 1), soNgay) - 1);
}

const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
export const canChiNam = (y) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`;
export const canChiNgay = (dd, mm, yy) => {
  const jd = jdn(dd, mm, yy);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
};

// Ngày giỗ dương lịch gần nhất kể từ hôm nay
export function gioSapToi(gioNgay, gioThang, nhuan = 0, homNay = new Date()) {
  const y0 = homNay.getFullYear();
  const t0 = new Date(y0, homNay.getMonth(), homNay.getDate()).getTime();
  for (const y of [y0, y0 + 1, y0 + 2]) {
    if (y > NAM_MAX) break;
    const [d, m, yy] = amSangDuong(gioNgay, gioThang, y, nhuan);
    if (!d) continue;
    const dt = new Date(yy, m - 1, d);
    if (dt.getTime() >= t0) return { ngay: dt, namAm: y, conLai: Math.round((dt - t0) / 86400000) };
  }
  return null;
}

// ── Lịch vạn niên ─────────────────────────────────────────────────────────────
// Phần dưới gộp từ thư mục ./lich cũ. Không chép lại ba bảng tra TK19/20/21 —
// dùng chung jdn/duongSangAm/CAN/CHI ở trên, đúng lệ "quy đổi âm lịch chỉ một chỗ".

// Âm lịch đầy đủ của một ngày dương, kèm số ngày Julius để tính can chi
export function amLich(dd, mm, yy) {
  const [ngay, thang, nam, nhuan] = duongSangAm(dd, mm, yy);
  return { ngay, thang, nam, nhuan, jd: jdn(dd, mm, yy) };
}

export const canChiThang = (thang, nam, nhuan = 0) =>
  `${CAN[(nam * 12 + thang + 3) % 10]} ${CHI[(thang + 1) % 12]}${nhuan ? ' (nhuận)' : ''}`;

// Nạp âm — 30 cặp của vòng 60 giáp tý.
// Chỉ số giáp tý của ngày là (jd+49)%60: khớp cả can (jd+9)%10 lẫn chi (jd+1)%12.
const NAP_AM = [
  "Hải Trung Kim", "Lư Trung Hỏa", "Đại Lâm Mộc", "Lộ Bàng Thổ", "Kiếm Phong Kim",
  "Sơn Đầu Hỏa", "Giản Hạ Thủy", "Thành Đầu Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc",
  "Tuyền Trung Thủy", "Ốc Thượng Thổ", "Tích Lịch Hỏa", "Tùng Bách Mộc", "Trường Lưu Thủy",
  "Sa Trung Kim", "Sơn Hạ Hỏa", "Bình Địa Mộc", "Bích Thượng Thổ", "Kim Bạch Kim",
  "Phú Đăng Hỏa", "Thiên Hà Thủy", "Đại Dịch Thổ", "Thoa Xuyến Kim", "Tang Đố Mộc",
  "Đại Khê Thủy", "Sa Trung Thổ", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Đại Hải Thủy",
];
export const menhNgay = (jd) => NAP_AM[INT(((jd + 49) % 60) / 2)];

// Ngày hoàng đạo: tháng âm m có sao Thanh Long ở chi 2*(m-1), sáu sao hoàng đạo
// lệch [0,1,4,5,7,10] so với nó. Tháng Giêng ra Tý, Sửu, Thìn, Tỵ, Mùi, Tuất.
const LECH_NGAY_HD = [0, 1, 4, 5, 7, 10];
export function laHoangDao(jd, thangAm) {
  const chi = (jd + 1) % 12, goc = (2 * (thangAm - 1)) % 12;
  return LECH_NGAY_HD.some((o) => (goc + o) % 12 === chi);
}

// Giờ hoàng đạo: gốc ở chi 2*chiNgày, sáu giờ lệch [0,1,3,6,8,9].
const LECH_GIO_HD = [0, 1, 3, 6, 8, 9];
const KHUNG_GIO = ["23h–1h", "1h–3h", "3h–5h", "5h–7h", "7h–9h", "9h–11h",
                   "11h–13h", "13h–15h", "15h–17h", "17h–19h", "19h–21h", "21h–23h"];
export function gioHoangDao(jd) {
  const goc = (2 * ((jd + 1) % 12)) % 12;
  return LECH_GIO_HD.map((o) => (goc + o) % 12).sort((a, b) => a - b)
    .map((c) => `${CHI[c]} (${KHUNG_GIO[c]})`);
}

// Tuổi xung với ngày: địa chi đối (cách 6), ghép với bốn thiên can theo lệ thường
export const tuoiXung = (jd) => {
  const can = (jd + 9) % 10, chi = ((jd + 1) % 12 + 6) % 12;
  return [4, 6, 0, 2].map((o) => `${CAN[(can + o) % 10]} ${CHI[chi]}`).join(", ");
};

const TIET_KHI = ["Xuân phân", "Thanh minh", "Cốc vũ", "Lập hạ", "Tiểu mãn", "Mang chủng",
  "Hạ chí", "Tiểu thử", "Đại thử", "Lập thu", "Xử thử", "Bạch lộ", "Thu phân", "Hàn lộ",
  "Sương giáng", "Lập đông", "Tiểu tuyết", "Đại tuyết", "Đông chí", "Tiểu hàn", "Đại hàn",
  "Lập xuân", "Vũ thủy", "Kinh trập"];
function kinhDoMatTroi(j) {
  const T = (j - 2451545) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const omega = 125.04 - 1934.136 * T;
  let lam = (L0 + DL - 0.00569 - 0.00478 * Math.sin(omega * dr)) * dr;
  return lam - Math.PI * 2 * INT(lam / (Math.PI * 2));
}
export const tietKhi = (jd) => TIET_KHI[INT(kinhDoMatTroi(jd + 1 - 0.5 - 7 / 24) / Math.PI * 12)];

const LE_DUONG = { "1-1": "Tết Dương lịch", "14-2": "Lễ tình nhân", "27-2": "Ngày Thầy thuốc VN",
  "8-3": "Quốc tế Phụ nữ", "30-4": "Giải phóng miền Nam", "1-5": "Quốc tế Lao động",
  "2-9": "Quốc khánh", "20-10": "Ngày Phụ nữ VN", "20-11": "Ngày Nhà giáo VN", "25-12": "Giáng sinh" };
const LE_AM = { "1-1": "Tết Nguyên Đán", "2-1": "Tết Nguyên Đán", "3-1": "Tết Nguyên Đán",
  "15-1": "Tết Nguyên tiêu", "10-3": "Giỗ Tổ Hùng Vương", "15-4": "Phật Đản",
  "5-5": "Tết Đoan ngọ", "15-7": "Vu Lan", "15-8": "Tết Trung thu", "23-12": "Ông Táo chầu trời" };
export const ngayLe = (dd, mm, ngayAm, thangAm, nhuanAm) =>
  LE_DUONG[`${dd}-${mm}`] || (nhuanAm ? null : LE_AM[`${ngayAm}-${thangAm}`]) || null;
