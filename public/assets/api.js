// api.js — gọi Worker + giữ phiên đăng nhập
// Cùng domain: để "" . Khác domain: điền URL Worker.
export const GOC_API = "";

export const token = () => sessionStorage.getItem("gp_token") || "";
export const toi = () => JSON.parse(sessionStorage.getItem("gp_toi") || "null");

export async function api(duong, opt = {}) {
  const r = await fetch(GOC_API + duong, {
    ...opt,
    headers: { "X-Token": token(), ...(opt.body && !opt.raw ? { "Content-Type": "application/json" } : {}), ...(opt.headers || {}) },
    body: opt.raw ? opt.body : opt.body ? JSON.stringify(opt.body) : undefined,
  }).catch(() => { throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); });
  const d = await r.json().catch(() => ({ ok: false, error: "Phản hồi không hợp lệ" }));
  if (r.status === 401) { thoat(); location.href = "/"; }
  if (!r.ok) throw Object.assign(new Error(d.error || "Lỗi " + r.status), { data: d, status: r.status });
  return d;
}

export async function dangNhap(ma) {
  const r = await fetch(GOC_API + "/api/dang-nhap", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: ma }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Đăng nhập thất bại");
  sessionStorage.setItem("gp_token", ma);
  sessionStorage.setItem("gp_toi", JSON.stringify(
    { ten: d.ten, quyen: d.quyen, chi: d.chi, sua: d.sua, tao_pha: d.tao_pha, pham_vi: d.pham_vi }));
  return d;
}

export function thoat() {
  sessionStorage.removeItem("gp_token");
  sessionStorage.removeItem("gp_toi");
}

export const anhURL = (id) => `${GOC_API}/api/media/${id}?token=${encodeURIComponent(token())}`;
export const ngayVN = (s) => (s ? s.split("-").reverse().join("/") : "—");

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ── Ngày tháng mờ ────────────────────────────────────────────────────────────
// Gia phả cũ hiếm khi có ngày đầy đủ. Chấp nhận '1890', '1890-03', '1890-03-12'
// và mức chắc chắn đi kèm, thay vì ép người nhập bịa ra ngày cho đủ định dạng.
const dinhDangNgay = (s) => {
  if (!s) return "";
  const p = String(s).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : p.length === 2 ? `${p[1]}/${p[0]}` : p[0];
};

// Chỉ ngày đủ ba vế mới dùng để tính tuổi hay quy ra âm lịch được
export const ngayDayDu = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

export function moTaNgay(ngay, kieu = "chinh_xac", den = null, goc = null) {
  let t = "";
  if (kieu === "khong_ro") t = "không rõ";
  else if (kieu === "giua" && ngay && den) t = `giữa ${dinhDangNgay(ngay)} và ${dinhDangNgay(den)}`;
  else if (ngay && kieu === "khoang") t = `khoảng ${dinhDangNgay(ngay)}`;
  else if (ngay && kieu === "truoc") t = `trước ${dinhDangNgay(ngay)}`;
  else if (ngay && kieu === "sau") t = `sau ${dinhDangNgay(ngay)}`;
  else if (ngay) t = dinhDangNgay(ngay);
  if (goc) t = t ? `${t} — phả chép “${goc}”` : `phả chép “${goc}”`;
  return t;
}

export const NHAN_KIEU_NGUON = {
  bia_mo: "Bia mộ", loi_ke: "Lời kể", giay_to: "Giấy tờ",
  pha_cu: "Phả cũ", anh: "Ảnh", suy_doan: "Suy đoán", khac: "Khác",
};
export const NHAN_TIN_CAY = { cao: "Tin cậy cao", vua: "Tin cậy vừa", thap: "Cần kiểm chứng" };
