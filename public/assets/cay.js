// cay.js — bố cục & vẽ cây phả hệ bằng SVG thuần
export const kichThuoc = (doc = false) => doc
  ? { W: 132, H: 184, GX: 24, GY: 258, doc: true }
  : { W: 212, H: 104, GX: 28, GY: 184, doc: false };

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Màu giới tính — dùng chung cho vạch mép trái và ký hiệu ♂/♀ trên card
const mauGT = (n) => n.gioi_tinh === "nu" ? "#a9748c" : n.gioi_tinh === "nam" ? "#6f8fa8" : "#a89c85";


// Tuổi (tính theo dương lịch, đủ năm). null nếu thiếu ngày sinh.
export function tinhTuoi(n) {
  if (!n.ngay_sinh) return null;
  const [ys, ms, ds] = n.ngay_sinh.split("-").map(Number);
  const den = n.ngay_mat ? n.ngay_mat.split("-").map(Number) : null;
  const h = new Date();
  const [y2, m2, d2] = den || [h.getFullYear(), h.getMonth() + 1, h.getDate()];
  let t = y2 - ys;
  if (m2 < ms || (m2 === ms && d2 < ds)) t--;
  return t >= 0 && t < 130 ? t : null;
}

// "Hưởng dương / thọ / đại thọ" theo lệ thường; người sống thì ghi tuổi hiện nay.
export function nhanTuoi(n) {
  const daMat = !!n.ngay_mat || n.gio_ngay != null;
  const t = tinhTuoi(n);
  if (t == null) return "";
  if (!daMat) return `Nay ${t} tuổi`;
  if (!n.ngay_mat) return "";
  return `${t < 60 ? "Hưởng dương" : t < 90 ? "Hưởng thọ" : "Hưởng đại thọ"} ${t} tuổi`;
}

export function boCuc(nguoi, honNhan, doc = false) {
  const size = kichThuoc(doc);
  const { W, H, GX, GY } = size;
  const byId = new Map(nguoi.map((n) => [n.id, n]));

  // Cặp đôi = bản ghi hôn nhân + cặp suy ra từ con chung (cha_id & me_id của cùng một người con)
  const cap = [];
  const daCo = new Set();
  const khoa = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  for (const h of honNhan) {
    if (!byId.has(h.chong_id) || !byId.has(h.vo_id)) continue;
    cap.push({ a: h.chong_id, b: h.vo_id, ngam: false, lyDi: h.trang_thai === "ly_di" });
    daCo.add(khoa(h.chong_id, h.vo_id));
  }
  for (const n of nguoi) {
    if (n.cha_id == null || n.me_id == null) continue;
    if (!byId.has(n.cha_id) || !byId.has(n.me_id)) continue;
    const k = khoa(n.cha_id, n.me_id);
    if (daCo.has(k)) continue;
    daCo.add(k);
    cap.push({ a: n.cha_id, b: n.me_id, ngam: true, lyDi: false });
  }

  const vo = new Map();          // id -> [id bạn đời]
  const kieuCap = new Map();     // "a-b" -> 'ngam' | 'ly_di' | 'dang'
  for (const c of cap) {
    (vo.get(c.a) || vo.set(c.a, []).get(c.a)).push(c.b);
    (vo.get(c.b) || vo.set(c.b, []).get(c.b)).push(c.a);
    kieuCap.set(khoa(c.a, c.b), c.ngam ? "ngam" : c.lyDi ? "ly_di" : "dang");
  }
  const coChaMe = (n) => n.cha_id != null || n.me_id != null;

  // Ai là "dâu/rể" (gắn vào cây qua hôn nhân) — không làm gốc riêng
  const gaVao = new Set();
  for (const c of cap) {
    const a = byId.get(c.a), b = byId.get(c.b);
    if (!a || !b) continue;
    if (coChaMe(a) && !coChaMe(b)) gaVao.add(b.id);
    else if (coChaMe(b) && !coChaMe(a)) gaVao.add(a.id);
    else if (!coChaMe(a) && !coChaMe(b)) gaVao.add(Math.max(a.id, b.id));
  }

  const sxp = (a, b) => (a.ngay_sinh || "9999") < (b.ngay_sinh || "9999") ? -1
    : (a.ngay_sinh || "9999") > (b.ngay_sinh || "9999") ? 1 : a.id - b.id;
  const conCua = (id) => nguoi.filter((n) => n.cha_id === id || n.me_id === id).sort(sxp);

  const nodes = [], canhHN = [], canhCon = [];
  const daVe = new Set();
  let con_tro = 0;

  function di(p, sau) {
    if (daVe.has(p.id)) return null;
    daVe.add(p.id);

    const bd = (vo.get(p.id) || []).map((i) => byId.get(i))
      .filter((s) => s && !daVe.has(s.id));
    bd.forEach((s) => daVe.add(s.id));

    const rongKhoi = (1 + bd.length) * W + bd.length * GX;
    const dau = nodes.length;
    const batDau = con_tro;

    // con của bản thân và của các bạn đời
    const conIds = new Set();
    const con = [];
    for (const c of [p, ...bd].flatMap((x) => conCua(x.id)))
      if (!conIds.has(c.id)) { conIds.add(c.id); con.push(c); }
    con.sort(sxp);

    let neo;
    const moc = [];
    if (con.length) {
      for (const c of con) { const r = di(c, sau + 1); if (r) moc.push(r); }
    }
    if (moc.length) {
      neo = (moc[0].tam + moc[moc.length - 1].tam) / 2;
      con_tro = Math.max(con_tro, neo + rongKhoi / 2 + GX);
    } else {
      neo = con_tro + rongKhoi / 2;
      con_tro += rongKhoi + GX;
    }

    let x0 = neo - rongKhoi / 2;
    const y = sau * GY;

    // đẩy sang phải nếu khối vợ chồng thò ra trái, chồng lên nhánh trước
    const lech = batDau - x0;
    if (lech > 0) {
      for (let i = dau; i < nodes.length; i++) nodes[i].x += lech;
      for (const e of canhHN.slice()) if (e._i >= dau) { e.x1 += lech; e.x2 += lech; }
      for (const e of canhCon.slice()) if (e._i >= dau) {
        e.x1 += lech; e.x2 += lech; e.xc += lech;
        e.con = e.con.map((c) => c + lech);
      }
      // Toạ độ neo của các con đã trả về từ đệ quy cũng phải dịch theo,
      // nếu không đường nối từ cha mẹ xuống con sẽ trỏ vào chỗ trống.
      for (const m of moc) { m.tam += lech; m.neo += lech; }
      x0 += lech; neo += lech;
      con_tro = Math.max(con_tro, neo + rongKhoi / 2 + GX);
    }

    nodes.push({ n: p, x: x0, y, i: dau });
    bd.forEach((s, k) => {
      const sx = x0 + (k + 1) * (W + GX);
      nodes.push({ n: s, x: sx, y, ga: true, i: dau });
      canhHN.push({ _i: dau, x1: x0 + W, x2: sx, y: y + H / 2,
                    kieu: kieuCap.get(khoa(p.id, s.id)) || "dang" });
    });

    if (moc.length)
      canhCon.push({ _i: dau, xc: neo, y: y + H, x1: moc[0].tam, x2: moc[moc.length - 1].tam,
                     y2: (sau + 1) * GY, con: moc.map((m) => m.tam) });

    return { tam: x0 + W / 2, neo };
  }

  const goc = nguoi.filter((n) => !coChaMe(n) && !gaVao.has(n.id)).sort(sxp);
  for (const g of goc) { di(g, 0); con_tro += 60; }
  for (const n of nguoi) if (!daVe.has(n.id)) { di(n, 0); con_tro += 60; }

  // Build edges only after every subtree has its final coordinates.
  // Each child connects to its actual parent(s), including children of different marriages.
  const pos = new Map(nodes.map(nd => [nd.n.id, nd]));
  const marriages = cap.map(c => {
    const a = pos.get(c.a), b = pos.get(c.b);
    const left = a.x <= b.x ? a : b, right = left === a ? b : a;
    return { x1: left.x + W, x2: right.x, y: left.y + H / 2,
      y2: right.y + H / 2, kieu: c.ngam ? 'ngam' : c.lyDi ? 'ly_di' : 'dang' };
  });
  const children = [];
  for (const child of nodes) {
    const parents = [...new Set([child.n.cha_id, child.n.me_id])].map(id => pos.get(id)).filter(Boolean);
    if (!parents.length) continue;
    let x, y;
    if (parents.length === 2 && parents[0].y === parents[1].y) {
      const [a, b] = parents.sort((a,b) => a.x - b.x);
      x = (a.x + W + b.x) / 2; y = a.y + H / 2;
    } else {
      const parent = parents[0]; x = parent.x + W / 2; y = parent.y + H;
    }
    children.push({ xc: x, y, x1: child.x + W / 2, x2: child.x + W / 2,
      y2: child.y, con: [child.x + W / 2], childId: child.n.id,
      parents: parents.map(p => p.n.id) });
    // If parents occupy different generations, retain the second biological link.
    if (parents.length === 2 && parents[0].y !== parents[1].y) {
      const p = parents[1];
      children.push({ xc: p.x + W / 2, y: p.y + H, y2: child.y,
        x1: child.x + W / 2, x2: child.x + W / 2, con: [child.x + W / 2], childId: child.n.id, parents: [p.n.id] });
    }
  }
  return { nodes, canhHN: marriages, canhCon: children, size };
}

export function ve(data, chon, anhCua, nhanCua) {
  const { nodes, canhHN, canhCon, size = kichThuoc() } = data;
  const { W, H, doc } = size;
  if (!nodes.length) return '<svg width="10" height="10"></svg>';
  const maxX = Math.max(...nodes.map(n => n.x)) + W + 80;
  const maxY = Math.max(...nodes.map(n => n.y)) + H + 80;
  let s = `<svg width="${maxX}" height="${maxY}" xmlns="http://www.w3.org/2000/svg" aria-label="Cây phả hệ">`;
  for (const e of canhCon) {
    const yb = e.y + (e.y2 - e.y) * .65;
    // Always include the horizontal segment, even for an only child.
    for (const cx of e.con)
      s += `<path class="canh-con" data-con="${e.childId}" d="M${e.xc} ${e.y} V${yb} H${cx} V${e.y2}" stroke="rgba(201,162,39,.65)" fill="none"/>`;
  }
  for (const e of canhHN) {
    const mid = (e.x1 + e.x2) / 2;
    const dash = e.kieu === 'ngam' ? 'stroke-dasharray="5 4"' : '';
    s += `<path class="canh-hon-nhan" d="M${e.x1} ${e.y} H${mid} V${e.y2} H${e.x2}" stroke="#6f9d84" ${dash} fill="none"/>`;
    if (e.kieu === 'ly_di') s += `<path d="M${mid-5} ${e.y+7} l10 -14" stroke="#a89c85"/>`;
  }
  for (const nd of nodes) {
    const n = nd.n, anh = anhCua?.(n.id), nhan = nhanCua?.(n.id);
    const years = [n.ngay_sinh?.slice(0,4), n.ngay_mat?.slice(0,4)].filter(Boolean).join(' – ');
    const mat = !!n.ngay_mat || n.gio_ngay != null;
    const tx = doc ? nd.x + W / 2 : nd.x + (anh ? 78 : 14);
    const anchor = doc ? 'middle' : 'start';
    // card ngang: tên cùng hàng với ký hiệu góc phải nên phải rút bớt để không đè lên nhau
    const lines = dongTen(n.ho_ten, doc ? 14 : anh ? 13 : 22, 2);
    const nameY = nd.y + (doc ? 91 : 26);
    const nhanGT = n.gioi_tinh === 'nu' ? 'Nữ' : n.gioi_tinh === 'nam' ? 'Nam' : 'Khác';
    const moTa = `${n.ho_ten}, ${nhanGT}${mat ? ', đã khuất' : ''}`;
    s += `<g class="nut-nguoi" data-id="${n.id}" role="button" tabindex="0" aria-label="${esc(moTa)}">
      <title>${esc(moTa)}</title>
      <rect x="${nd.x}" y="${nd.y}" width="${W}" height="${H}" rx="5" fill="#211c17" stroke="${chon === n.id ? '#e6c354' : '#76602d'}" stroke-width="${chon === n.id ? 2.5 : 1}"/>
      <rect x="${nd.x}" y="${nd.y}" width="3" height="${H}" fill="${mauGT(n)}"/>`;
    // Ký hiệu giới tính, và dấu † cho người đã khuất, ở góc trên bên phải
    const kyY = nd.y + (doc ? 19 : 22), kyX = nd.x + W - 11;
    s += `<text x="${kyX}" y="${kyY}" text-anchor="end" fill="${mauGT(n)}" font-size="14">${
      n.gioi_tinh === 'nu' ? '♀' : n.gioi_tinh === 'nam' ? '♂' : '⚲'}</text>`;
    if (mat) s += `<text x="${kyX - 15}" y="${kyY}" text-anchor="end" fill="#bda152" font-size="13">†</text>`;
    // Khung ảnh oval kiểu ảnh thờ: ảnh cắt theo elip, viền vàng mảnh bao ngoài
    const rx = doc ? 24 : 22, ry = doc ? 29 : 27;
    const cx = doc ? nd.x + W / 2 : nd.x + 14 + rx, cy = nd.y + 14 + ry;
    if (anh) {
      const ma = `av${doc ? 'd' : 'n'}${n.id}`;
      s += `<defs><clipPath id="${ma}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>
        <image href="${esc(anh)}" x="${cx-rx}" y="${cy-ry}" width="${rx*2}" height="${ry*2}"
               preserveAspectRatio="xMidYMid slice" clip-path="url(#${ma})"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#c9a227" stroke-width="1.4" opacity=".8"/>`;
    } else if (doc) {
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#393026" stroke="#76602d"/>
        <text x="${cx}" y="${cy+7}" text-anchor="middle" fill="#c9a227" font-size="20">${esc((n.ho_ten||'?').trim().split(/\s+/).at(-1)?.[0])}</text>`;
    }
    if (nhan) s += `<text x="${nd.x+W/2}" y="${nd.y-9}" text-anchor="middle" font-size="12" fill="#9ac4a9">${esc(nhan)}</text>`;
    for (let i=0; i<lines.length; i++) s += `<text x="${tx}" y="${nameY+i*17}" text-anchor="${anchor}" fill="#ece2cf" font-size="13">${esc(lines[i])}</text>`;
    s += `<text x="${tx}" y="${nd.y+(doc?130:65)}" text-anchor="${anchor}" fill="#bdb19c" font-size="11">${esc([n.doi ? 'Đời '+n.doi : '', years].filter(Boolean).join(' · '))}</text>
      <text x="${tx}" y="${nd.y+(doc?146:81)}" text-anchor="${anchor}" fill="${mat?'#bda152':'#9ac4a9'}" font-size="10">${esc(nhanTuoi(n))}</text>`;
    s += '</g>';
  }
  return s + '</svg>';
}
function dongTen(name, limit, maxLines) {
  const words = String(name || '').trim().split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > limit) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) return [...lines.slice(0,maxLines-1), lines.slice(maxLines-1).join(' ').slice(0,limit-1)+'…'];
  return lines;
}
