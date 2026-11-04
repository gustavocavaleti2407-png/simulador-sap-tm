/* ==========================================================================
   Núcleo da interface: persistência, navegação, componentes Fiori
   ========================================================================== */
/* Modo de uso: 'ex' (exercícios guiados) ou 'free' (simulação livre). Cada modo tem seu próprio estado. */
let MODE = null;
const LS_KEYS = { ex: 'sap-tm-simulador-v3', free: 'sap-tm-simulador-livre-v3' };
const CLOUD_DOC = { ex: 'tm_state', free: 'tm_state_livre' };
const lsKey = () => LS_KEYS[MODE || 'ex'];
const U = { app: 'home', id: null, tab: null, stack: [], f: {}, sel: new Set(), dlg: null, pop: false, toast: null, form: null, ck: { sel: new Set(), doc: null, res: null, mode: 'RD', zone: '', showPlanned: false }, exOpen: {}, lastMsgs: [] };
let DB = null, DBREF = null, saveTimer = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (n, d = 0) => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const kg = n => nf(n) + ' kg';
const money = v => T.fmtMoney(v);
const dt = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) + (iso.length > 10 ? ' ' + iso.slice(11, 16) : '') : '—';
const d10 = iso => iso ? dt(iso.slice(0, 10)) : '—';

/* ---------- persistência ---------- */
function save() {
  if (!MODE || !S) return;
  S.savedAt = new Date().toISOString();
  try { localStorage.setItem(lsKey(), JSON.stringify(S)); } catch (e) { }
  if (DBREF) { clearTimeout(saveTimer); saveTimer = setTimeout(() => { DBREF.set({ json: JSON.stringify(S), savedAt: S.savedAt }).catch(() => { }); }, 1200); }
}
function flushSave() { if (DBREF && S) { clearTimeout(saveTimer); DBREF.set({ json: JSON.stringify(S), savedAt: S.savedAt || new Date().toISOString() }).catch(() => { }); } }
function readState(m) { try { const raw = localStorage.getItem(LS_KEYS[m]); if (raw) { const x = JSON.parse(raw); if (x && x.v === 3) return x; } } catch (e) { } return null; }
function load() { const x = readState(MODE); if (x) { S = x; return true; } return false; }
async function connectDB() {
  try {
    if (!window.claude || !window.claude.use || !MODE) return;
    const m = MODE;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    if (MODE !== m) return;
    const ref = db.collection('data/users/' + uid).doc(CLOUD_DOC[m]);
    const snap = await ref.get();
    if (MODE !== m) return;
    DBREF = ref;
    const data = snap && (snap.data ? (typeof snap.data === 'function' ? snap.data() : snap.data) : null);
    if (data && data.json && (!S.savedAt || data.savedAt > S.savedAt)) { const x = JSON.parse(data.json); if (x.v === 3) { S = x; try { localStorage.setItem(lsKey(), data.json); } catch (e) { } render(); toast('Estado restaurado do armazenamento na nuvem.'); } }
    else save();
    U.cloud = true; render();
  } catch (e) { }
}

/* ---------- ações / mensagens ---------- */
function act(fn) {
  OUT.length = 0;
  let r;
  try { r = fn(); } catch (e) { console.error(e); T.err('Erro interno: ' + e.message); }
  U.lastMsgs = [...OUT];
  save(); render();
  const worst = OUT.find(m => m.type === 'E') || OUT.find(m => m.type === 'W') || OUT[OUT.length - 1];
  if (worst) toast(worst.text, worst.type);
  return r;
}
function toast(text, type) { U.toast = { text, type }; const el = document.getElementById('toast'); if (el) { el.textContent = text; el.hidden = false; } clearTimeout(U.tt); U.tt = setTimeout(() => { const e = document.getElementById('toast'); if (e) e.hidden = true; U.toast = null; }, 4200); }

/* ---------- navegação ---------- */
function go(app, id = null, tab = null, push = true) {
  if (push && (U.app !== app || U.id !== id)) U.stack.push({ app: U.app, id: U.id, tab: U.tab });
  if (U.stack.length > 40) U.stack.shift();
  U.app = app; U.id = id; U.tab = tab; U.sel = new Set(); U.menu = null; U.dlg = null; U.pop = false;
  if (app === 'fwo-new' || app === 'fwq-new' || app === 'so-new') U.form = null;
  render(); window.scrollTo(0, 0);
}
function back() { const p = U.stack.pop(); if (!p) return go('home', null, null, false); U.app = p.app; U.id = p.id; U.tab = p.tab; U.sel = new Set(); render(); window.scrollTo(0, 0); }
function docApp(id) {
  id = String(id);
  if (/^11/.test(id)) return 'fwo'; if (/^12/.test(id)) return 'fwq'; if (/^31/.test(id)) return 'otr'; if (/^41/.test(id)) return 'fu';
  if (/^6[12]/.test(id)) return 'fo'; if (/^71/.test(id)) return 'fsd'; if (/^81/.test(id)) return 'fwsd'; if (/^46/.test(id)) return 'rfq';
  return null;
}
function openDoc(id) {
  const a = docApp(id); if (!a) return;
  if (a === 'rfq') { const r = T.rfq(id); if (r) go('fo', r.fo, 'sub'); return; }
  go(a, String(id));
}
const L = (id, label) => id ? `<button class="lnk" data-a="open" data-id="${esc(id)}">${esc(label || id)}</button>` : '—';

/* ---------- status ---------- */
function stClass(s) {
  s = String(s || '');
  if (/bloque|rejeit|sem sucesso|cancel|expirad|recusad|disputa|não premiada/i.test(s)) return /não premiada/i.test(s) ? 'neu' : 'neg';
  if (/^(Concluído|Executado|Planejado|Confirmado|Fatura verificada|Faturado|Aceita|Premiad|Transportadora aceitou|Pronto p\/ execução|Descarregado|Convertida|Entrega criada|Premiado)/i.test(s)) return 'pos';
  if (/parcial|em tendering|enviad|em execução|aguard|não descarregado|transferido|liquidação criada|em andamento|carregado/i.test(s)) return 'crit';
  if (/novo|em processamento|atribuída|aberta|não iniciado/i.test(s)) return 'info';
  return 'neu';
}
const st = s => `<span class="st ${stClass(s)}">${esc(s)}</span>`;

/* ---------- componentes ---------- */
function btn(label, a, data = {}, cls = '', dis = false) {
  const d = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="btn ${cls}" data-a="${a}" ${d} ${dis ? 'disabled' : ''}>${esc(label)}</button>`;
}
function table(cols, rows, opts = {}) {
  if (!rows.length) return `<div class="tw"><div class="empty">${esc(opts.empty || 'Nenhum registro encontrado.')}</div></div>`;
  const sa = opts.selAct || 'sel', isSel = opts.isSel || (id => U.sel.has(id));
  const head = (opts.select ? `<th class="ck"><input type="checkbox" data-a="${sa}all" data-ids="${esc(rows.map(r => opts.rowId(r)).join(','))}" aria-label="Selecionar todos"></th>` : '') + cols.map(c => `<th class="${c.num ? 'num' : ''}">${esc(c.l)}</th>`).join('');
  const body = rows.map(r => {
    const id = opts.rowId ? opts.rowId(r) : null;
    const sel = opts.select && isSel(id);
    return `<tr class="${opts.open ? 'click' : ''} ${sel ? 'sel' : ''} ${opts.rowCls ? opts.rowCls(r) : ''}" ${opts.open ? `data-a="row" data-app="${opts.open}" data-id="${esc(id)}"` : ''}>` +
      (opts.select ? `<td class="ck"><input type="checkbox" data-a="${sa}" data-id="${esc(id)}" ${sel ? 'checked' : ''} aria-label="Selecionar"></td>` : '') +
      cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.f ? c.f(r) : esc(r[c.k])}</td>`).join('') + '</tr>';
  }).join('');
  return `<div class="tw"><table class="t"><thead><tr>${head}</tr></thead><tbody>${body}${opts.sum || ''}</tbody></table></div>`;
}
function kvs(pairs) { return `<div class="kv">${pairs.map(([k, v]) => `<div class="k">${esc(k)}</div><div class="v">${v ?? '—'}</div>`).join('')}</div>`; }
function attrs(list) { return `<div class="ph-attrs">${list.map(a => `<div class="attr"><div class="l">${esc(a[0])}</div><div class="v ${a[2] || ''}">${a[1]}</div></div>`).join('')}</div>`; }
function header({ title, sub, attrsList, actions = '', tabs = [], tab }) {
  return `<div class="ph"><div class="ph-top"><div style="min-width:0"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="toolbar">${actions}</div></div>
    ${attrsList ? attrs(attrsList) : '<div style="height:12px"></div>'}
    ${tabs.length ? `<div class="tabs" role="tablist">${tabs.map(t => `<button class="tab ${t.id === tab ? 'on' : ''}" role="tab" data-a="tab" data-tab="${t.id}">${esc(t.l)}${t.c != null ? `<span class="cnt">(${t.c})</span>` : ''}</button>`).join('')}</div>` : ''}</div>`;
}
function menu(id, label, items) {
  const open = U.menu === id;
  return `<span class="menu"><button class="btn" data-a="menu" data-id="${id}" aria-expanded="${open}">${esc(label)} ▾</button>${open ? `<div class="dd">${items.map(i => `<button data-a="${i[1]}" ${Object.entries(i[2] || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${esc(i[0])}</button>`).join('')}</div>` : ''}</span>`;
}
function sel(id, options, value, extra = '') {
  return `<select id="${id}" ${extra}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
}
const fld = (label, inner, req) => `<div class="fld"><label>${esc(label)}${req ? ' <span class="req">*</span>' : ''}</label>${inner}</div>`;
const val = id => { const e = document.getElementById(id); return e ? e.value : ''; };
function capBar(used, cap) { const p = cap ? used / cap * 100 : 0; return `<div style="display:flex;gap:8px;align-items:center"><div class="bar" style="flex:1"><i class="${p > 100 ? 'over' : p > 85 ? 'hi' : ''}" style="width:${Math.min(100, p).toFixed(0)}%"></i></div><span class="small num">${nf(p)}%</span></div>`; }
function dgChips(traits) { return (traits || []).filter(t => t.startsWith('dg:')).map(t => `<span class="chip dg">Classe ${esc(t.slice(3))}</span>`).join(' '); }

/* ---------- diálogo ---------- */
function dialog(title, body, buttons, wide) { U.dlg = { title, body, buttons, wide }; render(); }
function closeDlg() { U.dlg = null; render(); }
function renderDlg() {
  if (!U.dlg) return '';
  const d = U.dlg;
  return `<div class="ov" data-a="ovclick"><div class="dlg ${d.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(d.title)}"><header>${esc(d.title)}</header><div class="body">${d.body}</div><footer>${(d.buttons || []).map(b => `<button class="btn ${b.cls || ''}" data-a="dlgbtn" data-i="${d.buttons.indexOf(b)}">${esc(b.l)}</button>`).join('')}<button class="btn ghost" data-a="dlgclose">Fechar</button></footer></div></div>`;
}

/* ---------- mapa esquemático ---------- */
function mapSVG(locIds, routes, opts = {}) {
  const ids = [...new Set(locIds.filter(Boolean))]; const pts = ids.map(T.loc).filter(Boolean);
  if (!pts.length) return '<div class="empty">Sem locais para exibir.</div>';
  const W = 640, H = opts.h || 340, pad = 40;
  let minLat = Math.min(...pts.map(p => p.lat)), maxLat = Math.max(...pts.map(p => p.lat)), minLon = Math.min(...pts.map(p => p.lon)), maxLon = Math.max(...pts.map(p => p.lon));
  if (maxLat - minLat < 2) { minLat -= 1; maxLat += 1; } if (maxLon - minLon < 2) { minLon -= 1; maxLon += 1; }
  const k = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
  const sx = (W - 2 * pad) / ((maxLon - minLon) * k), sy = (H - 2 * pad) / (maxLat - minLat); const s = Math.min(sx, sy);
  const ox = (W - (maxLon - minLon) * k * s) / 2, oy = (H - (maxLat - minLat) * s) / 2;
  const P = id => { const l = T.loc(id); return [ox + (l.lon - minLon) * k * s, oy + (maxLat - l.lat) * s]; };
  let g = '';
  const step = Math.max(1, Math.round((maxLon - minLon) / 8));
  for (let lo = Math.ceil(minLon); lo <= maxLon; lo += step) { const x = ox + (lo - minLon) * k * s; g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="var(--map-grid)"/>`; }
  for (let la = Math.ceil(minLat); la <= maxLat; la += step) { const y = oy + (maxLat - la) * s; g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="var(--map-grid)"/>`; }
  const rt = (routes || []).map(r => { const pts2 = r.path.map(P); const color = r.color || 'var(--accent)'; return `<polyline points="${pts2.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${r.w || 2.5}" ${r.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round" marker-end="url(#ah)"/>`; }).join('');
  const dots = ids.map(id => { const [x, y] = P(id); const l = T.loc(id); const t = /Porto|Aeroporto/.test(l.type) ? 'rect' : 'circle'; return `<g>${t === 'rect' ? `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.5"/>` : `<circle cx="${x}" cy="${y}" r="5" fill="var(--surface)" stroke="var(--fg)" stroke-width="1.5"/>`}<text x="${x + 8}" y="${y - 7}" font-size="11">${esc(l.city)}</text></g>`; }).join('');
  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa esquemático da rota"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)"/></marker></defs>${g}${rt}${dots}</svg>`;
}

/* ---------- Gantt ---------- */
function ganttSVG(docs) {
  if (!docs.length) return '<div class="empty">Nenhum documento no horizonte.</div>';
  const t0 = new Date(S.clock.slice(0, 10) + 'T00:00').getTime() - 86400000; const days = 7; const t1 = t0 + days * 86400000;
  const W = 900, lw = 230, rowH = 30, H = 30 + docs.length * rowH;
  const X = iso => lw + Math.max(0, Math.min(1, (new Date(iso).getTime() - t0) / (t1 - t0))) * (W - lw - 10);
  let g = '';
  for (let d = 0; d <= days; d++) { const x = lw + d / days * (W - lw - 10); const day = new Date(t0 + d * 86400000); g += `<line x1="${x}" y1="18" x2="${x}" y2="${H}" stroke="var(--line)"/>` + (d < days ? `<text x="${x + 4}" y="13" font-size="13" fill="var(--fg-2)">${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}</text>` : ''); }
  const nx = X(S.clock); g += `<line x1="${nx}" y1="18" x2="${nx}" y2="${H}" stroke="var(--neg)" stroke-width="1.5"/>`;
  docs.forEach((f, i) => {
    const y = 24 + i * rowH; const a = f.stops[0].planArr, b = f.stops[f.stops.length - 1].planDep;
    const x1 = X(a), x2 = Math.max(X(b), x1 + 3);
    const color = f.exec === 'Executado' ? 'var(--pos)' : f.exec === 'Em execução' ? 'var(--crit)' : 'var(--accent)';
    g += `<text x="4" y="${y + 13}" font-size="14">${esc(f.id)} · ${esc(f.resource || f.voyage || f.mtr)}</text><rect x="${x1}" y="${y + 3}" width="${x2 - x1}" height="18" rx="3" fill="${color}" opacity=".85" data-a="open" data-id="${f.id}" style="cursor:pointer"/>`;
  });
  return `<div class="tw" style="border:0"><svg class="gantt" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de Gantt">${g}</svg></div>`;
}
