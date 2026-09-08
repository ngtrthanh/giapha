// dothi.js — tầng đồ thị quan hệ dùng chung cho giao diện và Worker.
// Đỉnh = người. Cạnh: cha_id / me_id (có hướng, phụ hệ + mẫu hệ) và hon_nhan (vô hướng).
// Mọi phép duyệt (tổ tiên, con cháu, nội tộc, họ hàng) đều đi qua đây, không viết lại rải rác.

export function dungDoThi(nguoi, honNhan = []) {
  const byId = new Map(nguoi.map((n) => [n.id, n]));
  const con = new Map();        // id -> [con]
  const banDoi = new Map();     // id -> [{id, thu_tu, trang_thai}]

  for (const n of nguoi)
    for (const p of [n.cha_id, n.me_id])
      if (p != null && byId.has(p)) (con.get(p) || con.set(p, []).get(p)).push(n.id);

  for (const h of honNhan) {
    if (!byId.has(h.chong_id) || !byId.has(h.vo_id)) continue;
    const t = h.thu_tu || 1, tt = h.trang_thai || "dang";
    (banDoi.get(h.chong_id) || banDoi.set(h.chong_id, []).get(h.chong_id))
      .push({ id: h.vo_id, thu_tu: t, trang_thai: tt, hn: h.id });
    (banDoi.get(h.vo_id) || banDoi.set(h.vo_id, []).get(h.vo_id))
      .push({ id: h.chong_id, thu_tu: t, trang_thai: tt, hn: h.id });
  }
  for (const v of banDoi.values()) v.sort((a, b) => a.thu_tu - b.thu_tu);

  const g = { nguoi, byId, con, banDoi };
  g.lay = (id) => byId.get(id) || null;
  g.cha = (id) => byId.get(byId.get(id)?.cha_id) || null;
  g.me = (id) => byId.get(byId.get(id)?.me_id) || null;
  g.chaMe = (id) => [g.cha(id), g.me(id)].filter(Boolean);
  g.conCua = (id) => (con.get(id) || []).map((i) => byId.get(i))
    .sort((a, b) => (a.ngay_sinh || "9999") < (b.ngay_sinh || "9999") ? -1
                  : (a.ngay_sinh || "9999") > (b.ngay_sinh || "9999") ? 1 : a.id - b.id);
  g.banDoiCua = (id) => (banDoi.get(id) || []).map((x) => byId.get(x.id)).filter(Boolean);
  return g;
}

// ── Duyệt ─────────────────────────────────────────────────────────────────────
export function toTien(g, id, ra = new Set()) {
  for (const p of g.chaMe(id))
    if (!ra.has(p.id)) { ra.add(p.id); toTien(g, p.id, ra); }
  return ra;
}

export function conChau(g, id, ra = new Set()) {
  for (const c of g.conCua(id))
    if (!ra.has(c.id)) { ra.add(c.id); conChau(g, c.id, ra); }
  return ra;
}

// Con cháu theo dòng cha — dùng khi tách phả: con của con gái không đi theo
export function conChauPhuHe(g, id, ra = new Set()) {
  for (const c of g.conCua(id))
    if (c.cha_id === id && !ra.has(c.id)) { ra.add(c.id); conChauPhuHe(g, c.id, ra); }
  return ra;
}

export function anhChiEm(g, id) {
  const n = g.lay(id);
  if (!n) return [];
  return g.nguoi.filter((x) => x.id !== id &&
    ((n.cha_id != null && x.cha_id === n.cha_id) || (n.me_id != null && x.me_id === n.me_id)));
}

// Mọi con cháu của mọi tổ tiên — anh chị em, cô dì chú bác, anh em họ đều nằm trong đây
export function cungHuyetThong(g, id) {
  const ra = new Set([id]);
  for (const t of toTien(g, id)) { ra.add(t); for (const c of conChau(g, t)) ra.add(c); }
  for (const c of conChau(g, id)) ra.add(c);
  return ra;
}

// Cả nhánh liên thông: huyết thống rồi lan tiếp qua hôn nhân và con cháu.
// Cần lan vì gia phả cũ hay thiếu me_id, lần theo cha_id/me_id thôi là đứt mạch.
export function noiToc(g, id) {
  const ra = cungHuyetThong(g, id);
  for (let v = 0; v < 30; v++) {
    let them = false;
    for (const x of [...ra])
      for (const y of [...g.banDoiCua(x), ...g.conCua(x)])
        if (!ra.has(y.id)) { ra.add(y.id); them = true; }
    if (!them) break;
  }
  return ra;
}

// ── Xưng hô ───────────────────────────────────────────────────────────────────
const truoc = (a, b) => {           // a sinh trước b?
  if (a?.ngay_sinh && b?.ngay_sinh) return a.ngay_sinh < b.ngay_sinh;
  if (a?.doi != null && b?.doi != null && a.doi !== b.doi) return a.doi < b.doi;
  return null;                       // không đủ dữ liệu để biết vai trên/dưới
};

export function nhanQuanHe(g, tam, id) {
  if (id === tam) return "trung tâm";
  const t = g.lay(tam), n = g.lay(id);
  if (!t || !n) return "";
  const nam = n.gioi_tinh === "nam", nu = n.gioi_tinh === "nu";

  for (const bd of g.banDoiCua(tam))
    if (bd.id === id) return nam ? "chồng" : nu ? "vợ" : "bạn đời";

  if (t.cha_id === id) return "cha";
  if (t.me_id === id) return "mẹ";

  const cha = g.cha(tam), me = g.me(tam);
  if (cha && (cha.cha_id === id || cha.me_id === id)) return nu ? "bà nội" : "ông nội";
  if (me && (me.cha_id === id || me.me_id === id)) return nu ? "bà ngoại" : "ông ngoại";

  if (n.cha_id === tam || n.me_id === tam) return nam ? "con trai" : nu ? "con gái" : "con";
  for (const c of g.conCua(tam))
    if (n.cha_id === c.id || n.me_id === c.id)
      return c.gioi_tinh === "nu" ? "cháu ngoại" : "cháu nội";

  const ae = anhChiEm(g, tam).map((x) => x.id);
  if (ae.includes(id)) {
    const tr = truoc(n, t);
    if (tr === null) return nam ? "anh/em trai" : nu ? "chị/em gái" : "anh chị em";
    if (tr) return nam ? "anh trai" : "chị gái";
    return nam ? "em trai" : "em gái";
  }

  // Cô dì chú bác: anh chị em của cha (nội) hoặc của mẹ (ngoại)
  for (const [p, ben] of [[cha, "noi"], [me, "ngoai"]]) {
    if (!p) continue;
    const ruot = anhChiEm(g, p.id).map((x) => x.id);
    if (ruot.includes(id)) {
      const tr = truoc(n, p);
      if (ben === "noi") {
        if (nu) return "cô";
        if (tr === null) return "bác/chú";
        return tr ? "bác" : "chú";
      }
      if (nu) return "dì";
      if (tr === null) return "bác/cậu";
      return tr ? "bác" : "cậu";
    }
    // vợ/chồng của cô dì chú bác
    for (const r of ruot) {
      if (!g.banDoiCua(r).some((x) => x.id === id)) continue;
      const rn = g.lay(r);
      if (ben === "noi")
        return rn.gioi_tinh === "nu" ? "dượng" : (truoc(rn, p) ? "bác gái" : "thím");
      return rn.gioi_tinh === "nu" ? "dượng" : "mợ";
    }
  }

  // Anh em họ: con của cô dì chú bác
  const bacChu = [cha, me].filter(Boolean).flatMap((p) => anhChiEm(g, p.id).map((x) => x.id));
  if (bacChu.some((r) => n.cha_id === r || n.me_id === r)) {
    const tr = truoc(n, t);
    if (tr === null) return nam ? "anh/em họ" : "chị/em họ";
    if (tr) return nam ? "anh họ" : "chị họ";
    return nam ? "em họ" : "em họ";
  }
  return "";
}

// Vùng lân cận quanh một người: ông bà, cha mẹ, cô dì chú bác, anh chị em,
// bạn đời, con, cháu — kèm dâu/rể của họ để cây đọc được.
export function langGieng(g, tam) {
  const ra = new Set([tam]);
  const them = (id) => { if (id != null && g.lay(id)) ra.add(id); };

  const cha = g.cha(tam), me = g.me(tam);
  for (const p of [cha, me]) {
    if (!p) continue;
    them(p.id);
    them(p.cha_id); them(p.me_id);                       // ông bà
    for (const b of g.banDoiCua(p.cha_id ?? -1)) them(b.id);
    for (const b of g.banDoiCua(p.me_id ?? -1)) them(b.id);
    for (const r of anhChiEm(g, p.id)) {                 // cô dì chú bác
      them(r.id);
      for (const b of g.banDoiCua(r.id)) them(b.id);
    }
  }
  for (const s of anhChiEm(g, tam)) them(s.id);
  for (const b of g.banDoiCua(tam)) them(b.id);
  for (const c of g.conCua(tam)) {
    them(c.id);
    for (const b of g.banDoiCua(c.id)) them(b.id);
    for (const gc of g.conCua(c.id)) them(gc.id);        // cháu
  }
  return ra;
}
