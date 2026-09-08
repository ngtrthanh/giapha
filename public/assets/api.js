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
