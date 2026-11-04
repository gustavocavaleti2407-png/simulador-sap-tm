/* ==========================================================================
   Apps: launchpad, gestão de pedidos, unidades de frete, cockpit
   ========================================================================== */
const ICON = {
  doc: '<path d="M6 2h9l5 5v15H6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 2v5h5M9 12h8M9 16h8" stroke="currentColor" stroke-width="1.6"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h5l3 3v3h-8z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  ship: '<path d="M3 15l2 5h14l2-5zM6 15V9h12v6M9 9V5h6v4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  people: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 20c1-4 4-6 7-6s6 2 7 6M16 4a3 3 0 010 6M18 14c2 1 3 3 4 6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  chart: '<path d="M3 21h18M6 17V9M11 17V5M16 17v-6M21 17v-9" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  gear: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="1.6"/>',
  cockpit: '<rect x="2" y="3" width="20" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8M12 17v4M5 13l4-4 3 3 6-6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  bell: '<path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  school: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6M20 4v14h-6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  plane: '<path d="M2 13l8-1 5-8h2l-2 8 6 1v2l-6 1 2 6h-2l-5-6-8-1z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  hand: '<path d="M4 12l5 5 11-11" fill="none" stroke="currentColor" stroke-width="2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ICON.doc}</svg>`;

const APPS = {
  bp: ['Parceiros de negócios', 'Clientes, transportadoras', 'people'], loc: ['Locais', 'Rede de transporte', 'pin'], zone: ['Zonas de transporte', 'Agrupamento de locais', 'map'],
  lane: ['Rotas de transporte', 'Lanes e transportadoras', 'map'], sched: ['Programações', 'Navios e voos', 'cal'], res: ['Recursos e meios de transporte', 'Veículos e capacidades', 'truck'], prod: ['Produtos', 'Materiais e perigosos', 'box'],
  agr: ['Acordos e folhas de cálculo', 'Acordos de frete e expedição', 'money'], rt: ['Tabelas de taxas', 'Escalas e taxas', 'money'],
  fwq: ['Cotações de expedição', 'Forwarding quotations', 'doc'], 'fwo-new': ['Criar ordem de expedição', 'Nova forwarding order', 'doc'], fwo: ['Ordens de expedição', 'Forwarding orders', 'doc'], otr: ['Pedidos de venda e OTR', 'Integração SD → TM', 'doc'],
  fu: ['Unidades de frete', 'Freight units', 'box'], cockpit: ['Cockpit de transporte', 'Planejamento manual e otimizador', 'cockpit'], cap: ['Gestão de capacidade', 'Bookings a partir de programações', 'ship'],
  fo: ['Ordens de frete', 'Freight orders rodoviárias', 'truck'], fb: ['Bookings de frete', 'Marítimo e aéreo', 'ship'], tender: ['Monitor de tendering', 'RFQs de frete e cotações', 'bell'], portal: ['Portal da transportadora', 'Colaboração (visão do carrier)', 'hand'],
  em: ['Monitor de eventos', 'Rastreamento da execução', 'bell'],
  fsd: ['Liquidação de frete', 'Freight settlement (compra)', 'money'], fwsd: ['Liquidação de expedição', 'Forwarding settlement (venda)', 'money'],
  analytics: ['Visão geral de transporte', 'KPIs e custos', 'chart'], log: ['Log de aplicação', 'Mensagens do sistema', 'doc'],
  ex: ['Exercícios guiados', 'Pratique os conceitos', 'school'], gloss: ['Glossário SAP TM', 'Objetos e siglas', 'book'], cfg: ['Customizing', 'Perfis e regras', 'gear'], sys: ['Sistema', 'Data, backup e reset', 'gear']
};
const GROUPS = [
  ['Treinamento', 'comece aqui', ['ex', 'gloss']],
  ['Gestão de pedidos', 'cap. 4', ['fwo-new', 'fwo', 'fwq', 'otr']],
  ['Planejamento de transporte', 'cap. 5', ['fu', 'cockpit', 'cap']],
  ['Gestão de ordens de frete e subcontratação', 'cap. 6', ['fo', 'fb', 'tender', 'portal']],
  ['Execução e monitoramento', 'cap. 7', ['em']],
  ['Gestão de encargos e liquidação', 'cap. 9–11', ['agr', 'rt', 'fsd', 'fwsd']],
  ['Dados mestres', 'cap. 3', ['bp', 'loc', 'zone', 'lane', 'sched', 'res', 'prod']],
  ['Análises e administração', 'cap. 12–13', ['analytics', 'log', 'cfg', 'sys']]
];
function tileKPI(a) {
  const c = arr => arr.length;
  switch (a) {
    case 'fwo': return [c(S.fwo.filter(f => f.life !== 'Concluído')), 'em aberto'];
    case 'fwq': return [c(S.fwq), 'cotações'];
    case 'otr': return [c(S.otr), 'OTRs'];
    case 'fu': return [c(S.fu.filter(f => T.fuPlanStatus(f) !== 'Planejado')), 'a planejar'];
    case 'cockpit': return [T.openStages().length, 'etapas abertas'];
    case 'cap': return [c(S.fo.filter(f => f.cat === 'FB' && f.life !== 'Cancelado')), 'bookings'];
    case 'fo': return [c(S.fo.filter(f => f.cat === 'FO' && f.exec !== 'Executado' && f.life !== 'Cancelado')), 'ativas'];
    case 'fb': return [c(S.fo.filter(f => f.cat === 'FB' && f.stages.length)), 'com carga'];
    case 'tender': return [c(S.rfq.filter(r => r.status === 'Aberta')), 'RFQs abertas'];
    case 'portal': return [c(S.rfq.filter(r => r.status === 'Aberta')) + c(S.fo.filter(f => f.sub.status === 'Enviado')), 'pendências'];
    case 'em': return [c(S.fo.filter(f => ['Em execução', 'Pronto p/ execução'].includes(f.exec))), 'em trânsito'];
    case 'fsd': return [c(S.fsd.filter(d => d.status !== 'Fatura verificada')), 'abertos'];
    case 'fwsd': return [c(S.fwsd.filter(d => d.status !== 'Faturado')), 'abertos'];
    case 'ex': { const d = EXERCISES.filter(e => exDone(e)).length; return [d + '/' + EXERCISES.length, 'concluídos']; }
    case 'bp': return [S.md.bps.length, 'parceiros']; case 'loc': return [S.md.locs.length, 'locais']; case 'lane': return [S.md.lanes.length, 'rotas'];
    case 'agr': return [S.md.agreements.length, 'acordos']; case 'log': return [S.log.filter(l => l.type === 'E').length, 'erros'];
    default: return null;
  }
}
function vLaunchpad() {
  const groups = GROUPS.map(([g, ref, apps]) => `<section class="lp-group"><h2>${esc(g)} <small>${esc(ref)}</small></h2><div class="tiles">${apps.map(a => {
    const [t, s, i] = APPS[a]; const k = tileKPI(a);
    return `<button class="tile" data-a="go" data-app="${a}"><span class="t">${esc(t)}</span><span class="s">${esc(s)}</span><span class="k">${ic(i)}${k ? `<span><span class="v">${esc(k[0])}</span><br><span class="u">${esc(k[1])}</span></span>` : ''}</span></button>`;
  }).join('')}</div></section>`).join('');
  return `<div class="lp-head"><div><h1>Simulador SAP TM · S/4HANA</h1><div class="muted">${esc(S.md.org.company)} · Org. vendas ${S.md.org.salesOrg} · Org. compras ${S.md.org.purchOrg} · Unid. planejamento ${S.md.org.planOrg}</div></div>
  <div class="toolbar">${btn('Exercícios guiados', 'go', { app: 'ex' }, 'pri')}${btn('Criar ordem de expedição', 'go', { app: 'fwo-new' })}</div></div>
  <div class="note" style="margin-bottom:18px">Ambiente de treinamento com dados fictícios. O fluxo segue o livro: pedido (OE) → unidades de frete → planejamento (cockpit/otimizador) → ordem de frete ou booking → seleção de transportadora/tendering → execução e eventos → liquidação e rentabilidade. A data do sistema só avança quando você manda (botão do relógio na barra superior).</div>${groups}<p class="muted" style="margin-top:24px;font-size:12px">Projeto educacional independente, sem vínculo com a SAP SE. SAP, S/4HANA e SAP TM são marcas da SAP SE, citadas apenas para fins de estudo. Os dados ficam salvos só no seu navegador.</p>`;
}

/* ---------------- List report genérico ---------------- */
function listReport({ title, sub, rows, cols, open, rowId, filters = [], actions = '', select, empty }) {
  const f = U.f[U.app] || {};
  let list = rows;
  filters.forEach(fl => { const v = f[fl.k]; if (v) list = list.filter(r => fl.test(r, v)); });
  const fb = filters.length ? `<div class="fbar">${filters.map(fl => fld(fl.l, fl.opts ? sel('f_' + fl.k, [['', 'Todos'], ...fl.opts], f[fl.k] || '', `data-c="filter" data-k="${fl.k}"`) : `<input id="f_${fl.k}" value="${esc(f[fl.k] || '')}" placeholder="Pesquisar" data-c="filter" data-k="${fl.k}">`)).join('')}</div>` : '';
  return header({ title: esc(title), sub }) + `<div class="sec">${fb}<div class="lr-head"><span class="cnt">${esc(title)} (${list.length})</span><div class="toolbar">${actions}</div></div>${table(cols, list, { open, rowId, select, empty })}</div>`;
}
const txt = (r, v, ...keys) => keys.some(k => String(typeof k === 'function' ? k(r) : r[k] || '').toLowerCase().includes(v.toLowerCase()));

/* ---------------- Ordens de expedição ---------------- */
function vFWOList() {
  const bpOpts = S.md.bps.filter(b => b.roles.includes('Cliente')).map(b => [b.id, b.name]);
  return listReport({
    title: 'Ordens de expedição', sub: 'Forwarding orders · cap. 4.2', rows: S.fwo, open: 'fwo', rowId: r => r.id, select: 'fwo',
    filters: [{ k: 'q', l: 'Pesquisa', test: (r, v) => txt(r, v, 'id', 'ref', r => T.bpName(r.orderingParty), r => T.locName(r.dst)) }, { k: 'mode', l: 'Modal', opts: [['RD', 'Rodoviário'], ['SEA', 'Marítimo'], ['AIR', 'Aéreo']], test: (r, v) => r.mode === v }, { k: 'bp', l: 'Parte solicitante', opts: bpOpts, test: (r, v) => r.orderingParty === v }, { k: 'pl', l: 'Status planejamento', opts: ['UFs não criadas', 'Não planejado', 'Parcialmente planejado', 'Planejado'], test: (r, v) => T.reqPlanStatus(r) === v }],
    actions: btn('Criar', 'go', { app: 'fwo-new' }, 'pri') + btn('Criar UFs (seleção)', 'fwoBuildSel'),
    cols: [{ l: 'Ordem de expedição', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Tipo', k: 'type' }, { l: 'Parte solicitante', f: r => esc(T.bpName(r.orderingParty)) }, { l: 'Origem → destino', f: r => esc(T.loc(r.src).city + ' → ' + T.loc(r.dst).city) }, { l: 'Coleta', f: r => d10(r.pickup) }, { l: 'Peso', num: 1, f: r => kg(T.sumMeasures(r.items).kg) }, { l: 'Ciclo de vida', f: r => st(r.block || r.life) }, { l: 'Planejamento', f: r => st(T.reqPlanStatus(r)) }, { l: 'Execução', f: r => st(T.reqExecStatus(r)) }, { l: 'Faturamento', f: r => st(r.inv) }]
  });
}

function reqForm(kind) {
  // kind: FWO | FWQ | SO
  if (!U.form) U.form = { mode: 'RD', movement: 'DD', orderingParty: kind === 'SO' ? '1001' : '1001', consignee: '1102', src: 'CD_CAMPINAS', dst: 'CLI_BH', pickup: T.addH(S.clock, 24).slice(0, 10), delivery: T.addH(S.clock, 48).slice(0, 10), incoterm: 'CIF', ref: '', items: [{ product: 'MAT-100', qty: 400 }] };
  const F = U.form;
  const cust = S.md.bps.filter(b => b.roles.includes('Cliente')).map(b => [b.id, b.id + ' ' + b.name]);
  const cons = S.md.bps.filter(b => b.roles.includes('Destinatário')).map(b => [b.id, b.id + ' ' + b.name]);
  const locs = S.md.locs.map(l => [l.id, l.id + ' – ' + l.city]);
  const prods = S.md.products.map(p => [p.id, p.id + ' ' + p.desc + (p.dg ? ' ⚠ ' + p.dg.un : '')]);
  const meas = T.sumMeasures(T.normalizeItems(F.items));
  const stg = T.buildStages({ ...F }, true) || [];
  const title = { FWO: 'Criar ordem de expedição', FWQ: 'Criar cotação de expedição', SO: 'Criar pedido de venda (SD)' }[kind];
  return header({ title, sub: kind === 'SO' ? 'Cenário embarcador: o pedido de venda gera automaticamente um OTR no TM (cap. 4.1.1)' : 'Tipo determinado pelo modal · cap. 4.2.1', actions: btn('Gravar', 'reqSave', { kind }, 'pri') + btn('Cancelar', 'back') }) +
    `<div class="sec"><h3>Dados gerais</h3><div class="form">
      ${kind !== 'SO' ? fld('Modal', sel('rf_mode', [['RD', 'Rodoviário (ZFWO)'], ['SEA', 'Marítimo (ZFWS)'], ['AIR', 'Aéreo (ZFWA)']], F.mode, 'data-c="rf"'), 1) : ''}
      ${kind !== 'SO' && F.mode !== 'RD' ? fld('Tipo de movimento', sel('rf_movement', [['DD', 'Porta a porta (DD)'], ['DP', 'Porta a porto (DP)'], ['PP', 'Porto a porto (PP)']], F.movement, 'data-c="rf"'), 1) : ''}
      ${fld(kind === 'SO' ? 'Emissor da ordem' : 'Parte solicitante', sel('rf_orderingParty', cust, F.orderingParty, 'data-c="rf"'), 1)}
      ${fld(kind === 'SO' ? 'Recebedor da mercadoria' : 'Destinatário', sel('rf_consignee', cons, F.consignee, 'data-c="rf"'), 1)}
      ${fld('Local de origem', sel('rf_src', locs, F.src, 'data-c="rf"'), 1)}
      ${fld('Local de destino', sel('rf_dst', locs, F.dst, 'data-c="rf"'), 1)}
      ${fld('Data de coleta', `<input type="date" id="rf_pickup" value="${F.pickup}" data-c="rf">`, 1)}
      ${fld('Data de entrega', `<input type="date" id="rf_delivery" value="${F.delivery}" data-c="rf">`, 1)}
      ${kind !== 'SO' ? fld('Incoterm', sel('rf_incoterm', ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'], F.incoterm, 'data-c="rf"')) : ''}
      ${kind === 'FWO' ? fld('Referência externa', `<input id="rf_ref" value="${esc(F.ref)}" data-c="rf" placeholder="Pedido do cliente">`) : ''}
    </div></div>
    <div class="sec"><h3>Itens <span class="toolbar">${btn('Adicionar item', 'rfAdd')}</span></h3>
      ${table([{ l: 'Item' , f: r => (F.items.indexOf(r) + 1) * 10 }, { l: 'Produto', f: r => sel('rf_p_' + F.items.indexOf(r), prods, r.product, 'data-c="rf" class="inp"') }, { l: 'Quantidade', f: r => `<input class="inp sm" type="number" min="1" id="rf_q_${F.items.indexOf(r)}" value="${r.qty}" data-c="rf">` }, { l: 'Peso bruto', num: 1, f: r => kg(T.itemMeasures(r.product, +r.qty).kg) }, { l: 'Volume', num: 1, f: r => nf(T.itemMeasures(r.product, +r.qty).m3, 2) + ' m³' }, { l: 'Paletes', num: 1, f: r => nf(Math.ceil(T.itemMeasures(r.product, +r.qty).pal)) }, { l: 'Valor', num: 1, f: r => money(T.itemMeasures(r.product, +r.qty).value) }, { l: '', f: r => `<button class="btn ghost" data-a="rfDel" data-i="${F.items.indexOf(r)}" aria-label="Remover">✕</button>` }], F.items)}
      <div class="ph-attrs">${attrs([['Peso total', kg(meas.kg)], ['Volume', nf(meas.m3, 2) + ' m³'], ['Paletes', nf(Math.ceil(meas.pal))], ['Valor da mercadoria', money(meas.value)]]).replace('<div class="ph-attrs">', '').replace(/<\/div>$/, '')}</div>
    </div>
    <div class="sec"><h3>Etapas previstas</h3><p class="muted small">Etapas derivadas do modal, do tipo de movimento e das rotas padrão (cap. 3.2.6). As etapas viram etapas de unidade de frete no planejamento.</p>
      ${table([{ l: 'Etapa', k: 'n' }, { l: 'Tipo', k: 'type' }, { l: 'De', f: r => esc(T.locName(r.from)) }, { l: 'Para', f: r => esc(T.locName(r.to)) }, { l: 'Modal', f: r => esc(T.modeName(r.mode)) }, { l: 'Distância', num: 1, f: r => nf(T.km(r.from, r.to, r.mode)) + ' km' }], stg, { empty: 'Sem rota padrão para este destino.' })}
      <div style="margin-top:12px">${mapSVG(stg.flatMap(s => [s.from, s.to]), stg.map(s => ({ path: [s.from, s.to], dash: s.mode !== 'RD', color: s.mode === 'RD' ? 'var(--accent)' : 'var(--crit)' })), { h: 260 })}</div></div>`;
}
function readReqForm() {
  const F = U.form; if (!F) return;
  ['mode', 'movement', 'orderingParty', 'consignee', 'src', 'dst', 'pickup', 'delivery', 'incoterm', 'ref'].forEach(k => { const e = document.getElementById('rf_' + k); if (e) F[k] = e.value; });
  F.items.forEach((it, i) => { const p = document.getElementById('rf_p_' + i), q = document.getElementById('rf_q_' + i); if (p) it.product = p.value; if (q) it.qty = +q.value; });
}

function vFWO(id) {
  const f = T.fwo(id); if (!f) return '<div class="empty">Documento não encontrado.</div>';
  const m = T.sumMeasures(f.items); const tab = U.tab || 'gen';
  const fus = f.fus.map(T.fu).filter(Boolean);
  const actions = btn('Verificar', 'fwoCheck', { id }) + (f.fus.length ? btn('Excluir UFs', 'fwoDelFU', { id }) : btn('Criar unidades de frete', 'fwoBuild', { id }, 'pri')) + btn('Calcular encargos', 'calcReq', { id, kind: 'FWO' }) +
    menu('fwo-more', 'Mais', [['Proposta de transporte (1ª UF aberta)', 'tpFwo', { id }], ['Planejar no cockpit', 'ckFromReq', { id }], ['Criar doc. de liquidação (DLE)', 'fwsdCreate', { id }]]);
  const tabs = [{ id: 'gen', l: 'Geral' }, { id: 'items', l: 'Itens', c: f.items.length }, { id: 'stages', l: 'Etapas', c: f.stages.length }, { id: 'fus', l: 'Unidades de frete', c: fus.length }, { id: 'ch', l: 'Encargos' }, { id: 'prof', l: 'Rentabilidade' }, { id: 'flow', l: 'Fluxo de documentos' }];
  let body = '';
  if (tab === 'gen') body = `<div class="grid2"><div class="sec"><h3>Partes e organização</h3>${kvs([['Tipo de documento', f.type + ' – ' + (S.md.settings.docTypes.FWO.find(t => t.id === f.type) || {}).desc], ['Org. de vendas', f.salesOrg], ['Parte solicitante', esc(f.orderingParty + ' ' + T.bpName(f.orderingParty))], ['Expedidor', esc(T.bpName(f.shipper))], ['Destinatário', esc(T.bpName(f.consignee))], ['Incoterm', f.incoterm], ['Referência externa', esc(f.ref || '—')], ['Cotação de origem', f.quote ? L(f.quote) : '—']])}</div>
    <div class="sec"><h3>Rota e datas</h3>${kvs([['Modal', T.modeName(f.mode)], ['Tipo de movimento', { DD: 'Porta a porta', DP: 'Porta a porto', PP: 'Porto a porto' }[f.movement] || '—'], ['Origem', esc(T.locName(f.src))], ['Destino', esc(T.locName(f.dst))], ['Coleta', d10(f.pickup)], ['Entrega', d10(f.delivery)], ['Criado em', dt(f.createdAt)], ['Bloqueio', f.block ? st(f.block) : 'Nenhum']])}</div></div>`;
  if (tab === 'items') body = `<div class="sec">${table([{ l: 'Item', k: 'n' }, { l: 'Produto', f: r => esc(r.product + ' ' + T.prod(r.product).desc) }, { l: 'Qtd.', num: 1, f: r => nf(r.qty) + ' ' + T.prod(r.product).uom }, { l: 'Peso bruto', num: 1, f: r => kg(r.kg) }, { l: 'Volume', num: 1, f: r => nf(r.m3, 2) + ' m³' }, { l: 'Paletes', num: 1, f: r => nf(r.pal, 1) }, { l: 'Valor', num: 1, f: r => money(r.value) }, { l: 'Perigoso', f: r => { const p = T.prod(r.product); return p.dg ? `<span class="chip dg">${p.dg.un} · cl. ${p.dg.cls}</span>` : '—'; } }], f.items)}</div>`;
  if (tab === 'stages') body = `<div class="sec">${table([{ l: 'Etapa', k: 'n' }, { l: 'Tipo', k: 'type' }, { l: 'De', f: r => esc(T.locName(r.from)) }, { l: 'Para', f: r => esc(T.locName(r.to)) }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Distância', num: 1, f: r => nf(T.km(r.from, r.to, r.mode)) + ' km' }, { l: 'Documentos de frete', f: r => [...new Set(fus.map(u => (u.stages.find(s => s.n === r.n) || {}).fo).filter(Boolean))].map(x => L(x)).join(' ') || '—' }], f.stages)}
    <div style="margin-top:12px">${mapSVG(f.stages.flatMap(s => [s.from, s.to]), f.stages.map(s => ({ path: [s.from, s.to], dash: s.mode !== 'RD', color: s.mode === 'RD' ? 'var(--accent)' : 'var(--crit)' })))}</div></div>`;
  if (tab === 'fus') body = `<div class="sec">${fus.length ? '' : `<div class="note" style="margin-bottom:12px">Nenhuma UF. Use “Criar unidades de frete”: a regra ${S.md.settings.fubr.id} divide os itens pelo limite de ${nf(S.md.settings.fubr.splitKg)} kg / ${S.md.settings.fubr.splitPal} paletes e separa itens incompatíveis.</div>`}${fuTable(fus)}</div>`;
  if (tab === 'ch') body = chargesView(f.charges, 'receita');
  if (tab === 'prof') { const p = T.profitability(f); body = `<div class="kpis">${[['Receita (encargos OE)', money(p.revenue)], ['Custo atribuído', money(p.cost)], ['Margem', money(p.margin)], ['Margem %', nf(p.pct, 1) + '%']].map(k => `<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('')}</div><div class="sec"><h3>Custos por etapa de UF <span class="muted small">distribuição de custos por peso bruto (cap. 10.2)</span></h3>${table([{ l: 'UF', f: r => L(r.fu) }, { l: 'Etapa', f: r => r.stage.n + ' ' + r.stage.type }, { l: 'Documento', f: r => L(r.doc) }, { l: 'Origem do custo', k: 'kind' }, { l: 'Valor', num: 1, f: r => money(r.amount) }], p.rows)}</div>`; }
  if (tab === 'flow') body = docFlowReq(f);
  return header({ title: `Ordem de expedição <span class="mono">${f.id}</span>`, sub: esc(T.bpName(f.orderingParty) + ' · ' + T.loc(f.src).city + ' → ' + T.loc(f.dst).city), actions, tabs, tab,
    attrsList: [['Peso bruto', kg(m.kg), 'big'], ['Volume', nf(m.m3, 1) + ' m³', 'big'], ['Receita', f.charges ? money(f.charges.total) : '—', 'big'], ['Ciclo de vida', st(f.block || f.life)], ['Planejamento', st(T.reqPlanStatus(f))], ['Execução', st(T.reqExecStatus(f))], ['Faturamento', st(f.inv)]] }) + body;
}
function fuTable(fus, opts = {}) {
  return table([{ l: 'Unidade de frete', f: r => L(r.id) }, { l: 'Origem → destino', f: r => esc(T.loc(r.src).city + ' → ' + T.loc(r.dst).city) }, { l: 'Itens', f: r => r.items.map(i => `${nf(i.qty)} × ${i.product}`).join(', ') }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Paletes', num: 1, f: r => nf(r.pal, 1) }, { l: 'Perigosos', f: r => dgChips(r.traits) || '—' }, { l: 'Planejamento', f: r => st(T.fuPlanStatus(r)) }, { l: 'Execução', f: r => st(r.exec) }], fus, opts);
}
function chargesView(ch, kindLabel) {
  if (!ch) return `<div class="sec"><div class="empty">Encargos ainda não calculados. Use “Calcular encargos”.</div></div>`;
  return `<div class="sec"><h3>Encargos (${esc(kindLabel)}) <span class="muted small">Acordo ${esc(ch.agreement)} · calculado em ${dt(ch.at)}</span></h3>
    ${table([{ l: 'Linha', k: 'n' }, { l: 'Tipo de encargo', f: r => `<span class="mono">${r.ct}</span> ${esc(r.desc)}` }, { l: 'Base de cálculo', k: 'base' }, { l: 'Qtd. base', num: 1, f: r => nf(r.qty, 2) + ' ' + esc(r.unit) }, { l: 'Taxa', num: 1, f: r => nf(r.rate, 2) + (r.unit === '%' ? '%' : '') }, { l: 'Moeda', k: 'curr' }, { l: 'Valor (moeda)', num: 1, f: r => nf(r.amountCurr, 2) }, { l: 'Valor BRL', num: 1, f: r => money(r.amount) }], ch.lines, { sum: `<tr class="sum"><td colspan="7">Total</td><td class="num">${money(ch.total)}</td></tr>` })}
    <h4>Análise do cálculo de encargos (cap. 9.3.4)</h4><ol class="small muted" style="margin:0;padding-left:18px">${ch.log.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>`;
}
function flowNode(kind, id, status) { return `<div class="node"><div class="k">${esc(kind)}</div>${L(id)}<div style="margin-top:4px">${status ? st(status) : ''}</div></div>`; }
function docFlowReq(f) {
  const fus = f.fus.map(T.fu).filter(Boolean);
  const fos = [...new Set(fus.flatMap(u => u.stages.map(s => s.fo)).filter(Boolean))].map(T.fo);
  const fsds = fos.map(o => o.fsd && T.fsd(o.fsd)).filter(Boolean);
  const col = (title, nodes) => `<div style="display:flex;flex-direction:column;gap:8px"><div class="small muted">${title}</div>${nodes.join('') || '<div class="small muted">—</div>'}</div>`;
  return `<div class="sec"><h3>Fluxo de documentos</h3><div class="flow" style="align-items:flex-start">
    ${f.quote ? col('Cotação', [flowNode('FWQ', f.quote, T.fwq(f.quote).status)]) + '<span class="arrow">→</span>' : ''}
    ${col('Requisito', [flowNode(f.so ? 'OTR · pedido ' + f.so : 'Ordem de expedição', f.id, f.life)])}<span class="arrow">→</span>
    ${col('Unidades de frete', fus.map(u => flowNode('UF', u.id, T.fuPlanStatus(u))))}<span class="arrow">→</span>
    ${col('Ordens/bookings', fos.map(o => flowNode(o.cat === 'FB' ? 'Booking ' + T.modeName(o.mode) : 'Ordem de frete', o.id, o.exec)))}<span class="arrow">→</span>
    ${col('Liquidação', [...fsds.map(d => flowNode('DLF', d.id, d.status)), ...(f.fwsd ? [flowNode('DLE', f.fwsd, T.fwsd(f.fwsd).status)] : [])])}
  </div></div>`;
}

/* ---------------- Cotações ---------------- */
function vFWQList() {
  return listReport({ title: 'Cotações de expedição', sub: 'Forwarding quotations · cap. 4.2.3', rows: S.fwq, open: 'fwq', rowId: r => r.id, actions: btn('Criar', 'go', { app: 'fwq-new' }, 'pri'),
    cols: [{ l: 'Cotação', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Parte solicitante', f: r => esc(T.bpName(r.orderingParty)) }, { l: 'Rota', f: r => esc(T.loc(r.src).city + ' → ' + T.loc(r.dst).city) }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Preço', num: 1, f: r => r.charges ? money(r.charges.total) : '—' }, { l: 'Válida até', f: r => d10(r.validTo) }, { l: 'Status', f: r => st(r.status) }],
    empty: 'Nenhuma cotação. Crie uma para praticar o fluxo cotação → ordem (exercício 12).' });
}
function vFWQ(id) {
  const q = T.fwq(id); if (!q) return '';
  const actions = btn('Calcular encargos', 'calcReq', { id, kind: 'FWQ' }) + btn('Enviar ao cliente', 'fwqSubmit', { id }, '', q.status !== 'Em processamento') + btn('Simular aceite do cliente', 'fwqResp', { id, ok: 1 }, 'pos', q.status !== 'Enviada ao cliente') + btn('Simular recusa', 'fwqResp', { id, ok: 0 }, 'neg', q.status !== 'Enviada ao cliente') + btn('Criar ordem de expedição', 'fwqToFwo', { id }, 'pri', q.status !== 'Aceita');
  const m = T.sumMeasures(q.items);
  return header({ title: `Cotação de expedição <span class="mono">${q.id}</span>`, sub: esc(T.bpName(q.orderingParty) + ' · ' + T.loc(q.src).city + ' → ' + T.loc(q.dst).city), actions, attrsList: [['Preço cotado', q.charges ? money(q.charges.total) : '—', 'big'], ['Peso', kg(m.kg), 'big'], ['Modal', T.modeName(q.mode)], ['Válida até', d10(q.validTo)], ['Status', st(q.status)], ['Ordem gerada', q.fwo ? L(q.fwo) : '—']] }) +
    `<div class="sec"><h3>Itens</h3>${table([{ l: 'Item', k: 'n' }, { l: 'Produto', f: r => esc(T.prod(r.product).desc) }, { l: 'Qtd.', num: 1, f: r => nf(r.qty) }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Volume', num: 1, f: r => nf(r.m3, 2) + ' m³' }], q.items)}</div>` + chargesView(q.charges, 'preço de venda');
}

/* ---------------- OTR ---------------- */
function vOTRList() {
  return listReport({ title: 'Pedidos de venda e requisitos de transporte (OTR)', sub: 'Cenário embarcador: integração SD → TM, cap. 4.1', rows: S.otr, open: 'otr', rowId: r => r.id, actions: btn('Criar pedido de venda', 'go', { app: 'so-new' }, 'pri'),
    cols: [{ l: 'OTR', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Pedido SD', f: r => `<span class="mono">${r.so}</span>` }, { l: 'Emissor', f: r => esc(T.bpName(r.soldTo)) }, { l: 'Recebedor', f: r => esc(T.bpName(r.consignee)) }, { l: 'Rota', f: r => esc(T.loc(r.src).city + ' → ' + T.loc(r.dst).city) }, { l: 'Planejamento', f: r => st(T.reqPlanStatus(r)) }, { l: 'Entrega (DTR)', f: r => r.delivDoc ? `<span class="mono">${r.delivDoc}</span>` : '—' }, { l: 'Status', f: r => st(r.block || r.life) }] });
}
function vOTR(id) {
  const o = T.otr(id); if (!o) return ''; const m = T.sumMeasures(o.items); const fus = o.fus.map(T.fu).filter(Boolean);
  const actions = (o.fus.length ? btn('Excluir UFs', 'otrDelFU', { id }) : btn('Criar unidades de frete', 'otrBuild', { id }, 'pri')) + btn('Planejar no cockpit', 'ckFromReq', { id }) + btn('Criar entrega (proposta de entrega)', 'otrDeliv', { id }, '', !!o.dtr);
  return header({ title: `Requisito de transporte baseado em ordem <span class="mono">${o.id}</span>`, sub: 'Pedido de venda ' + o.so + ' · ' + esc(T.bpName(o.soldTo)), actions,
    attrsList: [['Peso', kg(m.kg), 'big'], ['Valor', money(m.value), 'big'], ['Planejamento', st(T.reqPlanStatus(o))], ['Execução', st(T.reqExecStatus(o))], ['Entrega', o.delivDoc ? '<span class="mono">' + o.delivDoc + '</span> (' + o.dtr + ')' : '—'], ['Status', st(o.block || o.life)]] }) +
    `<div class="note" style="margin-bottom:14px">No SAP S/4HANA com TM embarcado, o pedido de venda cria o OTR. Após o planejamento, o TM propõe a entrega ao SD; a entrega liberada vira um DTR que consome o plano do OTR (cap. 4.1.4).</div>
    <div class="sec"><h3>Itens</h3>${table([{ l: 'Item', k: 'n' }, { l: 'Produto', f: r => esc(T.prod(r.product).desc) }, { l: 'Qtd.', num: 1, f: r => nf(r.qty) }, { l: 'Peso', num: 1, f: r => kg(r.kg) }], o.items)}</div><div class="sec"><h3>Unidades de frete</h3>${fuTable(fus)}</div>`;
}

/* ---------------- Unidades de frete ---------------- */
function vFUList() {
  return listReport({ title: 'Unidades de frete', sub: 'Freight units · cap. 5.2', rows: S.fu, open: 'fu', rowId: r => r.id,
    filters: [{ k: 'q', l: 'Pesquisa', test: (r, v) => txt(r, v, 'id', r => r.reqs.map(x => x.id).join(' '), r => T.loc(r.dst).city) }, { k: 'pl', l: 'Planejamento', opts: ['Não planejado', 'Parcialmente planejado', 'Planejado'], test: (r, v) => T.fuPlanStatus(r) === v }, { k: 'mode', l: 'Modal', opts: [['RD', 'Rodoviário'], ['SEA', 'Marítimo'], ['AIR', 'Aéreo']], test: (r, v) => r.mode === v }],
    actions: btn('Abrir cockpit', 'go', { app: 'cockpit' }, 'pri'),
    cols: [{ l: 'Unidade de frete', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Requisito', f: r => r.reqs.map(x => L(x.id)).join(' ') }, { l: 'Origem → destino', f: r => esc(T.loc(r.src).city + ' → ' + T.loc(r.dst).city) }, { l: 'Coleta', f: r => d10(r.pickup) }, { l: 'Entrega', f: r => d10(r.delivery) }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Pal.', num: 1, f: r => nf(r.pal, 1) }, { l: 'Perigosos', f: r => dgChips(r.traits) || '—' }, { l: 'Planejamento', f: r => st(T.fuPlanStatus(r)) }, { l: 'Execução', f: r => st(r.exec) }] });
}
function vFU(id) {
  const u = T.fu(id); if (!u) return '';
  const actions = btn('Proposta de transporte', 'tp', { id }, 'pri', T.fuPlanStatus(u) === 'Planejado') + btn('Planejar no cockpit', 'ckFromFu', { id });
  return header({ title: `Unidade de frete <span class="mono">${u.id}</span>`, sub: `Tipo ${u.type} · regra ${u.rule} · ` + u.reqs.map(r => r.type + ' ' + r.id).join(', '), actions,
    attrsList: [['Peso bruto', kg(u.kg), 'big'], ['Volume', nf(u.m3, 2) + ' m³', 'big'], ['Paletes', nf(u.pal, 1), 'big'], ['Planejamento', st(T.fuPlanStatus(u))], ['Execução', st(u.exec)], ['Características', (u.traits.map(t => t.startsWith('dg:') ? `<span class="chip dg">Classe ${t.slice(3)}</span>` : `<span class="chip">${esc(t.slice(4))}</span>`).join(' '))]] }) +
    `<div class="sec"><h3>Etapas da unidade de frete</h3>${table([{ l: 'Etapa', k: 'n' }, { l: 'Tipo', k: 'type' }, { l: 'De', f: r => esc(T.locName(r.from)) }, { l: 'Para', f: r => esc(T.locName(r.to)) }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Documento de frete', f: r => L(r.fo) }, { l: 'Status de manuseio', f: r => st(r.handling) }, { l: 'Execução', f: r => st(r.exec) }], u.stages)}</div>
    <div class="sec"><h3>Itens</h3>${table([{ l: 'Requisito', f: r => L(r.req.id) + ' / ' + r.item }, { l: 'Produto', f: r => esc(r.product + ' ' + T.prod(r.product).desc) }, { l: 'Qtd.', num: 1, f: r => nf(r.qty) }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Volume', num: 1, f: r => nf(r.m3, 2) + ' m³' }, { l: 'Paletes', num: 1, f: r => nf(r.pal, 2) }], u.items)}</div>
    ${u.discrepancies.length ? `<div class="sec"><h3>Discrepâncias</h3>${table([{ l: 'Documento', f: r => L(r.fo) }, { l: 'Tipo', k: 'type' }, { l: 'Qtd.', num: 1, k: 'qty' }, { l: 'Registrado', f: r => dt(r.at) }], u.discrepancies)}</div>` : ''}`;
}

/* ---------------- Cockpit de transporte ---------------- */
function vCockpit() {
  const C = U.ck;
  const zoneOpts = S.md.zones.map(z => [z.id, z.name]);
  let stages = S.fu.flatMap(fu => fu.stages.map(st => ({ key: fu.id + '#' + st.n, fu, st })));
  stages = stages.filter(e => (C.showPlanned || !e.st.fo) && (!C.mode || e.st.mode === C.mode) && (!C.zone || T.inArea(e.st.from, C.zone)));
  stages.sort((a, b) => a.fu.pickup < b.fu.pickup ? -1 : a.fu.pickup > b.fu.pickup ? 1 : 0);
  const selected = [...C.sel].map(T.stageOf).filter(Boolean);
  const load = T.loadOf(selected);
  const docs = S.fo.filter(f => f.life !== 'Cancelado' && f.exec !== 'Executado' && (!C.mode || f.mode === C.mode) && (f.cat === 'FO' || f.mode === C.mode));
  const doc = C.doc && T.fo(C.doc);
  const resList = S.md.resources.filter(r => !C.zone || T.inArea(r.home, C.zone) || true);
  const left = `<div class="sec"><h3>Etapas de unidades de frete <span class="muted small">${selected.length} selecionada(s) · ${kg(load.kg)} · ${nf(load.pal, 1)} pal · ${nf(load.m3, 1)} m³</span></h3>
    ${table([{ l: 'UF / etapa', f: r => L(r.fu.id) + ' <span class="muted">/' + r.st.n + '</span>' }, { l: 'Tipo', f: r => esc(r.st.type) }, { l: 'De → para', f: r => esc(T.loc(r.st.from).city + ' → ' + T.loc(r.st.to).city) }, { l: 'Pronta', f: r => dt(T.stageReady(r.fu, r.st)) }, { l: 'Entrega', f: r => d10(r.fu.delivery) }, { l: 'Peso', num: 1, f: r => kg(r.fu.kg) }, { l: 'Pal.', num: 1, f: r => nf(r.fu.pal, 1) }, { l: '', f: r => dgChips(r.fu.traits) }, { l: 'Doc.', f: r => L(r.st.fo) }], stages, { select: 'ck', selAct: 'cksel', isSel: id => C.sel.has(id), rowId: r => r.key, empty: 'Nenhuma etapa aberta com esses filtros. Crie UFs a partir de uma ordem de expedição.' })}
  </div>`;
  const resTab = `${table([{ l: '', f: r => `<input type="radio" name="ckres" data-a="ckres" data-id="${r.id}" ${C.res === r.id ? 'checked' : ''} aria-label="Selecionar recurso">` }, { l: 'Recurso', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Meio de transporte', f: r => esc(T.mtr(r.mtr).desc) }, { l: 'Base', f: r => esc(T.loc(r.home).city) }, { l: 'Capacidade', f: r => { const m = T.mtr(r.mtr); return `${nf(m.capKg / 1000)} t · ${m.capPal} pal`; } }, { l: 'Uso (sel.)', f: r => selected.length ? capBar(load.kg, T.mtr(r.mtr).capKg) : '—' }, { l: 'Qtd.', num: 1, f: r => r.qty }], resList)}`;
  const docTab = table([{ l: '', f: r => `<input type="radio" name="ckdoc" data-a="ckdoc" data-id="${r.id}" ${C.doc === r.id ? 'checked' : ''} aria-label="Selecionar documento">` }, { l: 'Documento', f: r => L(r.id) }, { l: 'Rota', f: r => esc(r.stops.map(s => T.loc(s.loc).city).join(' → ')) }, { l: 'Partida / veículo', f: r => r.cat === 'FB' ? 'Partida ' + dt(r.stops[0].planDep) : esc(r.mtr) }, { l: 'Ocupação', f: r => capBar(r.kg, r.cat === 'FB' ? r.capKg : T.mtr(r.mtr).capKg) }, { l: 'Status', f: r => r.fixed ? st('Fixado') : st(r.sub.status) }], docs.filter(d => d.cat === 'FO' ? C.mode === 'RD' || !C.mode : true), { empty: 'Nenhum documento aberto para este modal.' });
  const right = `<div class="sec"><h3>${C.mode === 'RD' ? 'Recursos de veículo e ordens de frete' : 'Bookings de frete'}</h3>
    <div class="toolbar" style="margin-bottom:10px">
      ${C.mode === 'RD' ? btn('Criar OF com recurso', 'ckCreate', {}, 'pri', !selected.length || !C.res) : ''}
      ${btn('Atribuir ao documento', 'ckAssign', {}, C.mode !== 'RD' ? 'pri' : '', !selected.length || !C.doc)}
      ${C.mode === 'RD' ? btn('Otimizar (VSR)', 'ckOpt', {}, '') : btn('Gestão de capacidade', 'go', { app: 'cap' })}
      ${btn('Proposta de transporte', 'ckTP', {}, '', selected.length !== 1)}
      ${btn('Desatribuir', 'ckUnassign', {}, 'neg', !C.doc)}
    </div>
    ${C.mode === 'RD' ? `<h4>Recursos de veículo</h4>${resTab}<h4>Ordens de frete abertas</h4>` : ''}${docTab}</div>`;
  // mapa: seleção (tracejado) + documento selecionado (sólido)
  const mlocs = [...selected.flatMap(e => [e.st.from, e.st.to]), ...(doc ? doc.stops.map(s => s.loc) : [])];
  const routes = [...selected.map(e => ({ path: [e.st.from, e.st.to], dash: true, color: 'var(--crit)', w: 2 })), ...(doc ? [{ path: doc.stops.map(s => s.loc), color: 'var(--accent)', w: 3 }] : [])];
  const bottom = `<div class="grid2" style="margin-top:14px"><div class="sec"><h3>Mapa <span class="legend"><span><i class="d"></i>Etapas selecionadas</span><span><i></i>Documento selecionado</span></span></h3>${mlocs.length ? mapSVG(mlocs, routes) : '<div class="empty">Selecione etapas ou um documento para ver no mapa.</div>'}
    ${doc ? `<h4>Paradas de ${doc.id}</h4>${table([{ l: '#', f: r => doc.stops.indexOf(r) + 1 }, { l: 'Local', f: r => esc(T.locName(r.loc)) }, { l: 'Chegada', f: r => dt(r.planArr) }, { l: 'Partida', f: r => dt(r.planDep) }, { l: 'Carrega', f: r => r.load.length }, { l: 'Descarrega', f: r => r.unload.length }], doc.stops)}` : ''}</div>
    <div class="sec"><h3>Gráfico de Gantt <span class="muted small">documentos do dia ${d10(T.addH(S.clock, -24))} em diante · linha vermelha = agora</span></h3>${ganttSVG(S.fo.filter(f => f.life !== 'Cancelado' && f.stages.length && f.stops[f.stops.length - 1].planDep >= T.addH(S.clock, -24)).sort((a, b) => a.stops[0].planArr < b.stops[0].planArr ? -1 : 1).slice(0, 14))}</div></div>`;
  return header({ title: 'Cockpit de transporte', sub: 'Perfil de seleção, perfil de planejamento ' + S.md.settings.planning.id + ' · cap. 5.7' }) +
    `<div class="sec"><div class="fbar" style="margin:0">${fld('Modal', sel('ck_mode', [['RD', 'Rodoviário'], ['SEA', 'Marítimo'], ['AIR', 'Aéreo']], C.mode, 'data-c="ck"'))}${fld('Zona de origem', sel('ck_zone', [['', 'Todas'], ...zoneOpts], C.zone, 'data-c="ck"'))}${fld('Exibir', sel('ck_planned', [['0', 'Somente não planejadas'], ['1', 'Incluir planejadas']], C.showPlanned ? '1' : '0', 'data-c="ck"'))}
    <div class="muted small" style="max-width:520px">Selecione etapas à esquerda e um recurso ou documento à direita. Etapas marítimas e aéreas são atribuídas a bookings; rodoviárias viram ordens de frete. Incompatibilidades e capacidade são verificadas a cada atribuição.</div></div></div>
    <div class="ck-grid">${left}${right}</div>${bottom}`;
}
