/* ==========================================================================
   Apps: dados mestres, encargos, análises, customizing, sistema, treinamento
   ========================================================================== */
const MD = {
  bp: { one: 'parceiro de negócios', coll: 'bps', title: 'Parceiros de negócios', sub: 'Business partners · cap. 3.1.2', key: 'id',
    fields: [{ k: 'id', l: 'Número BP', t: 'text', req: 1 }, { k: 'name', l: 'Nome', t: 'text', req: 1 }, { k: 'roles', l: 'Funções', t: 'multi', opts: () => ['Cliente', 'Expedidor', 'Destinatário', 'Transportadora'] }, { k: 'city', l: 'Cidade/UF', t: 'text' }, { k: 'loc', l: 'Local padrão', t: 'sel', opts: () => [['', '—'], ...S.md.locs.map(l => [l.id, l.id])] }, { k: 'scac', l: 'SCAC (transportadora)', t: 'text' }, { k: 'modes', l: 'Modais (transportadora)', t: 'multi', opts: () => [['RD', 'Rodoviário'], ['SEA', 'Marítimo'], ['AIR', 'Aéreo']] }, { k: 'sanctioned', l: 'Em lista de sanções (SPL)', t: 'chk' }],
    cols: [{ l: 'BP', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Nome', k: 'name' }, { l: 'Funções', f: r => r.roles.map(x => `<span class="chip">${esc(x)}</span>`).join(' ') }, { l: 'Cidade', k: 'city' }, { l: 'SCAC', f: r => esc(r.scac || '—') }, { l: 'Conformidade', f: r => r.sanctioned ? st('Bloqueio SPL') : st('Liberado') }] },
  loc: { one: 'local', coll: 'locs', title: 'Locais', sub: 'Locations · cap. 3.2.1', key: 'id',
    fields: [{ k: 'id', l: 'Local', t: 'text', req: 1 }, { k: 'name', l: 'Descrição', t: 'text', req: 1 }, { k: 'type', l: 'Tipo de local', t: 'sel', opts: () => ['Cliente', 'Centro de distribuição', 'Planta', 'Armazém', 'Hub de transbordo', 'Porto', 'Aeroporto'] }, { k: 'city', l: 'Cidade', t: 'text', req: 1 }, { k: 'uf', l: 'UF', t: 'text' }, { k: 'country', l: 'País', t: 'text' }, { k: 'lat', l: 'Latitude', t: 'num', req: 1 }, { k: 'lon', l: 'Longitude', t: 'num', req: 1 }, { k: 'bp', l: 'Parceiro', t: 'sel', opts: () => [['', '—'], ...S.md.bps.map(b => [b.id, b.id + ' ' + b.name])] }],
    cols: [{ l: 'Local', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'name' }, { l: 'Tipo', k: 'type' }, { l: 'Cidade', f: r => esc(r.city + (r.uf ? '/' + r.uf : '')) }, { l: 'País', k: 'country' }, { l: 'Geo', num: 1, f: r => nf(r.lat, 3) + ', ' + nf(r.lon, 3) }, { l: 'Zonas', f: r => T.zonesOf(r.id).map(z => `<span class="chip">${z}</span>`).join(' ') || st('Sem zona') }] },
  zone: { one: 'zona de transporte', coll: 'zones', title: 'Zonas de transporte', sub: 'Transportation zones · cap. 3.2.2', key: 'id',
    fields: [{ k: 'id', l: 'Zona', t: 'text', req: 1 }, { k: 'name', l: 'Descrição', t: 'text', req: 1 }, { k: 'locs', l: 'Locais da zona', t: 'multi', opts: () => S.md.locs.map(l => [l.id, l.id + ' (' + l.city + ')']) }],
    cols: [{ l: 'Zona', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'name' }, { l: 'Locais', f: r => r.locs.map(x => `<span class="chip">${esc(x)}</span>`).join(' ') }] },
  lane: { one: 'rota de transporte', coll: 'lanes', title: 'Rotas de transporte', sub: 'Transportation lanes e transportadoras · cap. 3.2.3', key: 'id',
    fields: [{ k: 'id', l: 'ID da rota', t: 'text', req: 1 }, { k: 'from', l: 'De (zona ou local)', t: 'sel', opts: () => [...S.md.zones.map(z => [z.id, 'Zona ' + z.id]), ...S.md.locs.map(l => [l.id, 'Local ' + l.id])] }, { k: 'to', l: 'Para (zona ou local)', t: 'sel', opts: () => [...S.md.zones.map(z => [z.id, 'Zona ' + z.id]), ...S.md.locs.map(l => [l.id, 'Local ' + l.id])] }, { k: 'mode', l: 'Modal', t: 'sel', opts: () => [['RD', 'Rodoviário'], ['SEA', 'Marítimo'], ['AIR', 'Aéreo']] }, { k: 'carriers', l: 'Transportadoras', t: 'carriers' }],
    cols: [{ l: 'Rota', f: r => `<span class="mono">${r.id}</span>` }, { l: 'De', k: 'from' }, { l: 'Para', k: 'to' }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Transportadoras (prioridade · custo/km)', f: r => r.carriers.map(c => `<span class="chip">${esc(T.bpName(c.bp))} · ${c.prio}${c.costKm ? ' · ' + nf(c.costKm, 2) : ''}</span>`).join(' ') }] },
  prod: { one: 'produto', coll: 'products', title: 'Produtos', sub: 'Materiais e produtos perigosos · cap. 3.1.3/3.1.4', key: 'id',
    fields: [{ k: 'id', l: 'Material', t: 'text', req: 1 }, { k: 'desc', l: 'Descrição', t: 'text', req: 1 }, { k: 'uom', l: 'Unidade', t: 'text' }, { k: 'kg', l: 'Peso bruto/un (kg)', t: 'num', req: 1 }, { k: 'm3', l: 'Volume/un (m³)', t: 'num', req: 1 }, { k: 'perPal', l: 'Unidades por palete', t: 'num', req: 1 }, { k: 'value', l: 'Valor/un (R$)', t: 'num' }, { k: 'group', l: 'Grupo', t: 'sel', opts: () => ['Alimentos', 'Higiene', 'Químicos', 'Construção', 'Farma', 'Geral'] }, { k: 'dg_un', l: 'Nº ONU (perigoso)', t: 'text' }, { k: 'dg_cls', l: 'Classe de risco', t: 'sel', opts: () => ['', '1.4G', '2.1', '3', '4.1', '5.1', '6.1', '8', '9'] }],
    cols: [{ l: 'Material', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'desc' }, { l: 'Grupo', k: 'group' }, { l: 'kg/un', num: 1, f: r => nf(r.kg, 2) }, { l: 'm³/un', num: 1, f: r => nf(r.m3, 3) }, { l: 'Un/pal', num: 1, k: 'perPal' }, { l: 'R$/un', num: 1, f: r => nf(r.value, 2) }, { l: 'Perigoso', f: r => r.dg ? `<span class="chip dg">${r.dg.un} · classe ${r.dg.cls}</span>` : '—' }] },
  res: { one: 'recurso de veículo', coll: 'resources', title: 'Recursos de veículo', sub: 'Vehicle resources · cap. 3.3.3', key: 'id',
    fields: [{ k: 'id', l: 'Recurso', t: 'text', req: 1 }, { k: 'desc', l: 'Descrição', t: 'text' }, { k: 'mtr', l: 'Meio de transporte', t: 'sel', opts: () => S.md.mtrs.filter(m => m.mode === 'RD').map(m => [m.id, m.id + ' – ' + m.desc]) }, { k: 'home', l: 'Local base', t: 'sel', opts: () => S.md.locs.map(l => [l.id, l.id]) }, { k: 'qty', l: 'Quantidade (multi-recurso)', t: 'num', req: 1 }],
    cols: [{ l: 'Recurso', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'desc' }, { l: 'Meio de transporte', k: 'mtr' }, { l: 'Base', f: r => esc(T.locName(r.home)) }, { l: 'Qtd.', num: 1, k: 'qty' }] },
  sched: { one: 'programação', coll: 'schedules', title: 'Programações', sub: 'Schedules · cap. 3.2.4', key: 'id', ro: true,
    cols: [{ l: 'Programação', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'De', f: r => esc(T.locName(r.from)) }, { l: 'Para', f: r => esc(T.locName(r.to)) }, { l: 'Trânsito', f: r => r.transitH + ' h' }, { l: 'Cut-off', f: r => r.cutoffH + ' h antes' }, { l: 'Capacidade', num: 1, f: r => kg(r.capKg) }] }
};
function vMD(app) {
  const M = MD[app];
  const extra = app === 'res' ? `<div class="sec"><h3>Meios de transporte (Customizing)</h3>${table([{ l: 'MTr', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'desc' }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Velocidade', num: 1, f: r => r.speed + ' km/h' }, { l: 'Capacidade', f: r => r.capKg ? `${kg(r.capKg)} · ${r.capM3} m³ · ${r.capPal} pal` : 'por programação' }, { l: 'Custo fixo', num: 1, f: r => money(r.costFix) }, { l: 'Custo/km', num: 1, f: r => money(r.costKm) }], S.md.mtrs)}</div>` : '';
  return listReport({ title: M.title, sub: M.sub, rows: S.md[M.coll], open: M.ro ? null : 'md-' + app, rowId: r => r[M.key], actions: M.ro ? '' : btn('Criar', 'mdNew', { app }, 'pri'), cols: M.cols,
    filters: [{ k: 'q', l: 'Pesquisa', test: (r, v) => JSON.stringify(r).toLowerCase().includes(v.toLowerCase()) }] }) + extra;
}
function mdForm(app, rec) {
  const M = MD[app]; const r = rec || {};
  const inner = M.fields.map(f => {
    const id = 'md_' + f.k; let v = r[f.k];
    if (f.k === 'dg_un') v = r.dg ? r.dg.un : ''; if (f.k === 'dg_cls') v = r.dg ? r.dg.cls : '';
    if (f.t === 'text' || f.t === 'num') return fld(f.l, `<input id="${id}" type="${f.t === 'num' ? 'number' : 'text'}" step="any" value="${esc(v ?? '')}" ${rec && f.k === M.key ? 'disabled' : ''}>`, f.req);
    if (f.t === 'sel') return fld(f.l, sel(id, f.opts(), v ?? ''), f.req);
    if (f.t === 'chk') return fld(f.l, `<label style="display:flex;gap:6px;align-items:center;height:34px"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> Sim</label>`);
    if (f.t === 'multi') return `<div class="fld" style="grid-column:1/-1"><label>${esc(f.l)}</label><div class="chips">${f.opts().map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<label class="chip" style="cursor:pointer"><input type="checkbox" data-multi="${id}" value="${esc(ov)}" ${(v || []).includes(ov) ? 'checked' : ''}> ${esc(ol)}</label>`; }).join('')}</div></div>`;
    if (f.t === 'carriers') { const cs = [...(v || []), {}, {}, {}].slice(0, Math.max(3, (v || []).length + 1)); const carr = [['', '—'], ...S.md.bps.filter(b => b.roles.includes('Transportadora')).map(b => [b.id, b.id + ' ' + b.name])]; return `<div class="fld" style="grid-column:1/-1"><label>${esc(f.l)}</label>${cs.map((c, i) => `<div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap">${sel('md_c_bp_' + i, carr, c.bp || '', 'class="inp" style="width:260px"')}<input class="inp sm" id="md_c_pr_${i}" type="number" placeholder="Prioridade" value="${c.prio ?? ''}"><input class="inp sm" id="md_c_ck_${i}" type="number" step="any" placeholder="Custo/km" value="${c.costKm ?? ''}"></div>`).join('')}<input type="hidden" id="md_c_n" value="${cs.length}"></div>`; }
    return '';
  }).join('');
  return `<div class="form">${inner}</div>`;
}
function readMD(app, rec) {
  const M = MD[app]; const out = rec ? { ...rec } : {}; const errs = [];
  M.fields.forEach(f => {
    const id = 'md_' + f.k;
    if (f.t === 'text' || f.t === 'sel') { const v = val(id); if (!(rec && f.k === M.key)) out[f.k] = v.trim ? v.trim() : v; }
    if (f.t === 'num') out[f.k] = val(id) === '' ? null : +val(id);
    if (f.t === 'chk') out[f.k] = document.getElementById(id).checked;
    if (f.t === 'multi') out[f.k] = [...document.querySelectorAll(`[data-multi="${id}"]:checked`)].map(e => e.value);
    if (f.t === 'carriers') { const n = +val('md_c_n'); const cs = []; for (let i = 0; i < n; i++) { const bp = val('md_c_bp_' + i); if (bp) cs.push({ bp, prio: +val('md_c_pr_' + i) || i + 1, costKm: val('md_c_ck_' + i) ? +val('md_c_ck_' + i) : undefined }); } out.carriers = cs; }
    if (f.req && (out[f.k] === '' || out[f.k] == null)) errs.push(f.l);
  });
  if (app === 'prod') { out.dg = out.dg_un ? { un: out.dg_un, cls: out.dg_cls || '9', pg: 'II', name: out.desc } : null; delete out.dg_un; delete out.dg_cls; }
  if (app === 'bp') { out.roles = out.roles || []; }
  return { out, errs };
}

/* ---------------- Acordos e folhas de cálculo ---------------- */
function vAgrList() {
  return listReport({ title: 'Acordos de frete e de expedição', sub: 'Freight agreements (compra) e forwarding agreements (venda) · cap. 9.1.1 / 11.1.1', rows: S.md.agreements, open: 'agr', rowId: r => r.id,
    cols: [{ l: 'Acordo', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Tipo', f: r => r.kind === 'FA' ? 'Acordo de frete' : 'Acordo de expedição' }, { l: 'Descrição', k: 'desc' }, { l: 'Parceiro', f: r => r.party === '*' ? 'Todos' : esc(T.bpName(r.party)) }, { l: 'Modal', f: r => r.mode === '*' ? 'Todos' : T.modeName(r.mode) }, { l: 'Moeda', k: 'curr' }, { l: 'Validade', f: r => d10(r.validFrom) + ' – ' + d10(r.validTo) }, { l: 'Linhas', num: 1, f: r => r.sheet.length }] });
}
function vAgr(id) {
  const a = T.agr(id); if (!a) return '';
  const kinds = { TAB: 'Tabela de taxas', PCT: '% sobre linhas', PCTVAL: '% do valor', PERKM: 'Por km', PERSTOP: 'Por parada adicional', PERKGCHG: 'Por kg taxável', FIX: 'Valor fixo' };
  return header({ title: `${a.kind === 'FA' ? 'Acordo de frete' : 'Acordo de expedição'} <span class="mono">${a.id}</span>`, sub: esc(a.desc), actions: btn('Gravar alterações', 'agrSave', { id }, 'pri') + btn('Copiar acordo…', 'agrCopy', { id }),
    attrsList: [['Parceiro', a.party === '*' ? 'Todos' : esc(a.party + ' ' + T.bpName(a.party))], ['Modal', a.mode === '*' ? 'Todos' : T.modeName(a.mode)], ['Moeda', a.curr], ['Área de/para', esc(a.from + ' → ' + a.to)], ['Validade', d10(a.validFrom) + ' – ' + d10(a.validTo)]] }) +
    `<div class="sec"><h3>Folha de cálculo <span class="muted small">cada linha é calculada em ordem; linhas % referenciam outras linhas (cap. 9.1.2)</span></h3>
    ${table([{ l: 'Linha', k: 'n' }, { l: 'Tipo de encargo', f: r => `<span class="mono">${r.ct}</span> ${esc((S.md.chargeTypes.find(c => c.id === r.ct) || {}).desc || '')}` }, { l: 'Regra', f: r => kinds[r.kind] + (r.refFrom ? ` (linhas ${r.refFrom}–${r.refTo})` : '') + (r.modes ? ' · só ' + r.modes.map(T.modeName).join('/') : '') }, { l: 'Tabela', f: r => r.table ? `<button class="lnk" data-a="go" data-app="rt" data-id="${r.table}">${r.table}</button>` : '—' }, { l: 'Taxa / fator', f: r => `<input class="inp sm" type="number" step="any" id="ag_${r.n}" value="${r.kind === 'TAB' ? (r.factor || 1) : r.rate}">` + `<span class="small muted"> ${r.kind === 'TAB' ? 'fator' : r.kind.startsWith('PCT') ? '%' : a.curr}</span>` }], a.sheet)}</div>
    <div class="note">Para testar: aumente a sobretaxa de combustível (FUEL) e recalcule os encargos de uma ordem. O log “Análise do cálculo” mostra a escala usada em cada linha.</div>`;
}
function vRTList() {
  return listReport({ title: 'Tabelas de taxas', sub: 'Rate tables e escalas · cap. 9.1.4 / 9.1.5', rows: S.md.rateTables, open: 'rt', rowId: r => r.id,
    cols: [{ l: 'Tabela', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'desc' }, { l: 'Dimensões', f: r => r.base1 + (r.base2 ? ' × ' + r.base2 : '') }, { l: 'Unidade', k: 'unit' }, { l: 'Moeda', k: 'curr' }, { l: 'Mínimo', num: 1, f: r => nf(r.min, 2) }] });
}
function vRT(id) {
  const t = T.table(id); if (!t) return '';
  const bn = { km: 'Distância (km)', t: 'Peso (t)', wm: 'W/M', kgchg: 'kg taxável' };
  let grid;
  if (t.base2) grid = `<div class="tw"><table class="t"><thead><tr><th>${bn[t.base1]} ↓ / ${bn[t.base2]} →</th>${t.scale2.map(s => `<th class="num">até ${nf(s)}</th>`).join('')}</tr></thead><tbody>${t.scale1.map((s, i) => `<tr><td class="num">até ${nf(s)}</td>${t.scale2.map((x, j) => `<td class="num"><input class="inp sm" type="number" step="any" id="rt_${i}_${j}" value="${t.values[i][j]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  else grid = `<div class="tw"><table class="t"><thead><tr><th>${bn[t.base1]}</th><th class="num">Taxa (${t.curr}/${t.unit})</th></tr></thead><tbody>${t.scale1.map((s, i) => `<tr><td class="num">até ${nf(s)}</td><td class="num"><input class="inp sm" type="number" step="any" id="rt_${i}" value="${t.values[i]}"></td></tr>`).join('')}</tbody></table></div>`;
  return header({ title: `Tabela de taxas <span class="mono">${t.id}</span>`, sub: esc(t.desc), actions: btn('Gravar alterações', 'rtSave', { id }, 'pri'), attrsList: [['Moeda', t.curr], ['Unidade de cálculo', t.unit], ['Escala 1', bn[t.base1]], ['Escala 2', t.base2 ? bn[t.base2] : '—']] }) +
    `<div class="sec"><h3>Taxas por escala <span class="muted small">a escala usa o primeiro degrau “até” que comporta o valor</span></h3>${grid}<div class="form" style="margin-top:12px">${fld('Valor mínimo (' + t.curr + ')', `<input id="rt_min" type="number" step="any" value="${t.min}">`)}</div></div>`;
}

/* ---------------- Análises ---------------- */
function vAnalytics() {
  const fos = S.fo.filter(f => f.life !== 'Cancelado' && f.stages.length);
  const cost = fos.reduce((a, f) => a + (f.charges ? f.charges.total : 0), 0);
  const rev = S.fwo.reduce((a, f) => a + (f.charges ? f.charges.total : 0), 0);
  const arr = S.fo.flatMap(f => f.events.filter(e => e.code === 'ARRIV' || e.code === 'POD'));
  const ontime = arr.length ? arr.filter(e => e.delayMin <= 30).length / arr.length * 100 : null;
  const roadFos = fos.filter(f => f.cat === 'FO');
  const util = roadFos.length ? roadFos.reduce((a, f) => a + f.kg / T.mtr(f.mtr).capKg, 0) / roadFos.length * 100 : 0;
  const byCarrier = {}; fos.forEach(f => { if (f.carrier && f.charges) byCarrier[f.carrier] = (byCarrier[f.carrier] || 0) + f.charges.total; });
  const cr = Object.entries(byCarrier).sort((a, b) => b[1] - a[1]); const maxC = Math.max(1, ...cr.map(x => x[1]));
  const byCust = {}; S.fwo.forEach(f => { const p = T.profitability(f); const k = f.orderingParty; byCust[k] = byCust[k] || { rev: 0, cost: 0 }; byCust[k].rev += p.revenue; byCust[k].cost += p.cost; });
  const cu = Object.entries(byCust).filter(([, v]) => v.rev || v.cost); const maxR = Math.max(1, ...cu.map(([, v]) => Math.max(v.rev, v.cost)));
  const pl = ['UFs não criadas', 'Não planejado', 'Parcialmente planejado', 'Planejado'].map(s => [s, S.fwo.filter(f => T.reqPlanStatus(f) === s).length]);
  const maxP = Math.max(1, ...pl.map(x => x[1]));
  return header({ title: 'Visão geral de transporte', sub: 'Análises embarcadas · cap. 12.1' }) +
    `<div class="kpis">${[['Ordens de expedição', S.fwo.length], ['Unidades de frete', S.fu.length], ['Ordens/bookings ativos', fos.length], ['Receita (OE)', money(rev)], ['Custo de frete (OF/BF)', money(cost)], ['Margem bruta', money(rev - cost)], ['Pontualidade', ontime == null ? '—' : nf(ontime) + '%'], ['Ocupação média rodoviária', nf(util) + '%']].map(k => `<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('')}</div>
    <div class="grid2"><div class="sec"><h3>Custo de frete por transportadora</h3>${cr.length ? `<div class="hbar">${cr.map(([k, v]) => `<span>${esc(T.bpName(k))}</span><div class="b" style="width:${v / maxC * 100}%"></div><span class="num">${money(v)}</span>`).join('')}</div>` : '<div class="empty">Sem encargos calculados.</div>'}</div>
    <div class="sec"><h3>Ordens de expedição por status de planejamento</h3><div class="hbar">${pl.map(([k, v]) => `<span>${esc(k)}</span><div class="b" style="width:${v / maxP * 100}%"></div><span class="num">${v}</span>`).join('')}</div></div>
    <div class="sec"><h3>Receita × custo por cliente <span class="legend"><span><i></i>Receita</span><span><i style="background:var(--pos)"></i>Custo</span></span></h3>${cu.length ? `<div class="hbar">${cu.map(([k, v]) => `<span>${esc(T.bpName(k))}</span><div><div class="b" style="width:${v.rev / maxR * 100}%;margin-bottom:3px"></div><div class="b alt" style="width:${v.cost / maxR * 100}%"></div></div><span class="num small">${money(v.rev - v.cost)}<br><span class="muted">margem</span></span>`).join('')}</div>` : '<div class="empty">Sem dados.</div>'}</div>
    <div class="sec"><h3>Documentos de liquidação</h3>${table([{ l: 'Documento', f: r => L(r.id) }, { l: 'Tipo', f: r => r.fo ? 'DLF (compra)' : 'DLE (venda)' }, { l: 'Valor', num: 1, f: r => money(r.amount) }, { l: 'Status', f: r => st(r.status) }], [...S.fsd, ...S.fwsd])}</div></div>`;
}
function vLog() {
  return header({ title: 'Log de aplicação', sub: 'Mensagens de todas as ações · cap. 13.3.5', actions: btn('Limpar log', 'logClear') }) +
    `<div class="sec">${table([{ l: '', f: r => `<span class="mi ${r.type}">${{ S: '✓', W: '!', E: '✕', I: 'i' }[r.type]}</span>` }, { l: 'Data do sistema', f: r => dt(r.at) }, { l: 'Mensagem', f: r => esc(r.text) }, { l: 'Documento', f: r => r.ref && docApp(r.ref) ? L(r.ref) : '' }], S.log.slice(0, 300))}</div>`;
}

/* ---------------- Customizing ---------------- */
function vCfg() {
  const s = S.md.settings;
  return header({ title: 'Customizing', sub: 'Perfis e regras usados pelo simulador · cap. 2.3, 5.2, 5.6, 6.5, 6.6', actions: btn('Gravar', 'cfgSave', {}, 'pri') }) +
    `<div class="grid2"><div class="sec"><h3>Regra de criação de UF · ${esc(s.fubr.id)}</h3><div class="form">
      ${fld('Estratégia', sel('cf_strategy', [['REQ', 'Consolidar por requisito (itens compatíveis)'], ['ITEM', 'Uma UF por item'], ['MAX', 'Consolidar o máximo possível']], s.fubr.strategy))}
      ${fld('Quantidade de divisão – peso (kg)', `<input id="cf_splitKg" type="number" value="${s.fubr.splitKg}">`)}${fld('Divisão – volume (m³)', `<input id="cf_splitM3" type="number" value="${s.fubr.splitM3}">`)}${fld('Divisão – paletes', `<input id="cf_splitPal" type="number" value="${s.fubr.splitPal}">`)}
      ${fld('Quantidade crítica', sel('cf_critical', [['kg', 'Peso bruto'], ['m3', 'Volume'], ['pal', 'Paletes']], s.fubr.critical))}${fld('Criar UFs automaticamente ao gravar OE', sel('cf_autoBuild', [['0', 'Não'], ['1', 'Sim']], s.fubr.autoBuild ? '1' : '0'))}</div></div>
    <div class="sec"><h3>Perfil de planejamento · ${esc(s.planning.id)}</h3><div class="form">
      ${fld('Peso custo fixo', `<input id="cf_wFix" type="number" step="any" value="${s.planning.wFix}">`)}${fld('Peso custo por km', `<input id="cf_wKm" type="number" step="any" value="${s.planning.wKm}">`)}${fld('Penalidade de atraso (por hora)', `<input id="cf_wLate" type="number" value="${s.planning.wLate}">`)}
      ${fld('Máximo de paradas de entrega por tour', `<input id="cf_maxStops" type="number" value="${s.planning.maxStops}">`)}${fld('Hora de início das coletas', `<input id="cf_startHour" type="number" value="${s.planning.startHour}">`)}${fld('Tempo de manuseio por parada (h)', `<input id="cf_handlingH" type="number" step="any" value="${s.planning.handlingH}">`)}</div></div>
    <div class="sec"><h3>Seleção de transportadora e tendering</h3><div class="form">
      ${fld('Estratégia de seleção', sel('cf_cs', [['COST', 'Custo total (acordos de frete)'], ['PRIO', 'Prioridade da rota']], s.carrierSel.strategy))}
      ${fld('Etapa 1 do tendering', sel('cf_t1', [['P2P', 'Ponto a ponto'], ['BROADCAST', 'Broadcast']], s.tendering.steps[0].type))}${fld('Prazo etapa 1 (h)', `<input id="cf_t1h" type="number" value="${s.tendering.steps[0].hours}">`)}
      ${fld('Prazo etapa 2 – broadcast (h)', `<input id="cf_t2h" type="number" value="${(s.tendering.steps[1] || {}).hours || 8}">`)}${fld('Preço-limite (% da estimativa)', `<input id="cf_pl" type="number" value="${s.tendering.priceLimitPct}">`)}</div></div>
    <div class="sec"><h3>Liquidação e moedas</h3><div class="form">${fld('Tolerância na verificação de fatura (%)', `<input id="cf_tol" type="number" step="any" value="${s.invoiceTolerancePct}">`)}${fld('Câmbio EUR → BRL', `<input id="cf_eur" type="number" step="any" value="${s.fx.EUR}">`)}${fld('Câmbio USD → BRL', `<input id="cf_usd" type="number" step="any" value="${s.fx.USD}">`)}</div></div></div>
    <div class="grid2"><div class="sec"><h3>Incompatibilidades (cap. 2.3.2)</h3>${table([{ l: 'Característica A', k: 'a' }, { l: 'Característica B', k: 'b' }, { l: 'Descrição', k: 'desc' }, { l: '', f: r => `<button class="btn ghost" data-a="incDel" data-i="${s.incompat.indexOf(r)}">Remover</button>` }], s.incompat)}
      <div class="form" style="margin-top:10px">${fld('A', sel('inc_a', incTraits(), ''))}${fld('B', sel('inc_b', incTraits(), ''))}<div class="fld"><label>&nbsp;</label>${btn('Adicionar incompatibilidade', 'incAdd')}</div></div></div>
    <div class="sec"><h3>Tipos de documento</h3>${table([{ l: 'Objeto', k: 'o' }, { l: 'Tipo', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Descrição', k: 'desc' }], Object.entries(s.docTypes).flatMap(([o, l]) => l.map(t => ({ o, ...t }))))}</div></div>`;
}
function incTraits() { const g = [...new Set(S.md.products.map(p => p.group))].map(x => ['grp:' + x, 'Grupo ' + x]); const d = [...new Set(S.md.products.filter(p => p.dg).map(p => p.dg.cls))].map(x => ['dg:' + x, 'Perigoso classe ' + x]); return [...g, ...d]; }

/* ---------------- Sistema ---------------- */
function vSys() {
  return header({ title: 'Sistema', sub: 'Data do sistema, backup e reinicialização' }) +
    `<div class="grid2"><div class="sec"><h3>Data do sistema</h3><p class="muted">O tempo do simulador só avança quando você manda. Use para expirar RFQs, chegar a datas de coleta e reportar eventos.</p>
      <div class="kpi" style="margin-bottom:12px"><div class="l">Agora</div><div class="v">${dt(S.clock)}</div></div>
      <div class="toolbar">${btn('+1 h', 'clock', { h: 1 })}${btn('+4 h', 'clock', { h: 4 })}${btn('+1 dia', 'clock', { h: 24 })}${btn('+1 semana', 'clock', { h: 168 })}</div>
      <div class="form" style="margin-top:12px">${fld('Definir data/hora', `<input type="datetime-local" id="sys_clock" value="${S.clock}">`)}<div class="fld"><label>&nbsp;</label>${btn('Aplicar', 'clockSet')}</div></div></div>
    <div class="sec"><h3>Armazenamento</h3>${kvs([['Navegador', 'Estado salvo localmente a cada ação'], ['Nuvem (sua conta)', U.cloud ? st('Sincronizado') : st('Indisponível nesta visualização')], ['Última gravação', S.savedAt ? new Date(S.savedAt).toLocaleString('pt-BR') : '—']])}
      <div class="toolbar" style="margin-top:12px">${btn('Exportar estado (JSON)', 'exportJ')}${btn('Importar estado…', 'importJ')}</div></div>
    <div class="sec"><h3>Reinicializar</h3><p class="muted">Recria os dados mestres e o cenário de demonstração (6 ordens em estágios diferentes). Seu progresso nos exercícios é zerado.</p><div class="toolbar">${btn('Restaurar cenário de demonstração', 'resetAsk', { demo: 1 }, 'neg')}${btn('Começar só com dados mestres', 'resetAsk', { demo: 0 }, 'neg')}</div></div></div>`;
}

/* ---------------- Treinamento ---------------- */
function vEx() {
  const done = EXERCISES.filter(exDone).length;
  return header({ title: 'Exercícios guiados', sub: 'Cada exercício é verificado automaticamente a partir do estado do sistema' }) +
    `<div class="sec"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><b>${done} de ${EXERCISES.length} concluídos</b><span class="muted small">Sugestão: siga a ordem; os exercícios seguem os capítulos do livro.</span></div><div class="prog"><i style="width:${done / EXERCISES.length * 100}%"></i></div></div>` +
    EXERCISES.map((e, i) => { const ok = exDone(e); const open = U.exOpen[e.id] ?? (!ok && EXERCISES.findIndex(x => !exDone(x)) === i);
      return `<div class="ex ${ok ? 'done' : ''}"><div class="hd"><div style="min-width:0;flex:1"><div class="no">Exercício ${i + 1}</div><h3>${esc(e.title)}</h3><div class="ref">${esc(e.ref)}</div></div><div class="toolbar">${ok ? st('Concluído') : st('Pendente')}<button class="btn ghost" data-a="exToggle" data-id="${e.id}" aria-expanded="${open}">${open ? 'Ocultar' : 'Ver passos'}</button></div></div>
      ${open ? `<p>${esc(e.goal)}</p><ol>${e.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${e.hint ? `<div class="note">${esc(e.hint)}</div>` : ''}<div class="toolbar" style="margin-top:10px">${btn('Ir para o app', 'exGo', { id: e.id }, 'pri')}</div>` : ''}</div>`; }).join('');
}
function vGloss() {
  const q = (U.f.gloss || {}).q || '';
  const rows = GLOSSARY.filter(g => !q || g.join(' ').toLowerCase().includes(q.toLowerCase()));
  return header({ title: 'Glossário SAP TM', sub: 'Objetos de negócio e termos do livro (tabela 1.4 e capítulos seguintes)' }) +
    `<div class="sec"><div class="fbar">${fld('Pesquisar', `<input id="f_q" value="${esc(q)}" data-c="filter" data-k="q" placeholder="Ex.: booking, FUBR">`)}</div>${table([{ l: 'Sigla', f: r => `<b>${esc(r[0])}</b>` }, { l: 'Termo (PT)', f: r => esc(r[1]) }, { l: 'Termo SAP (EN)', f: r => `<i>${esc(r[2])}</i>` }, { l: 'Definição', f: r => esc(r[3]) }, { l: 'Cap.', f: r => esc(r[4]) }], rows)}</div>`;
}
