/* ==========================================================================
   Apps: ordens de frete, bookings, tendering, portal, eventos, liquidação
   ========================================================================== */
function foCols() {
  return [{ l: 'Documento', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Tipo', k: 'type' }, { l: 'Rota', f: r => esc(r.stops.map(s => T.loc(s.loc).city).join(' → ')) }, { l: 'Início', f: r => dt(r.stops[0] && r.stops[0].planArr) },
  { l: 'Transportadora', f: r => esc(r.carrier ? T.bpName(r.carrier) : r.subcontract ? '—' : 'Frota própria') }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Subcontratação', f: r => st(r.sub.status) }, { l: 'Execução', f: r => st(r.exec) }, { l: 'Liquidação', f: r => st(r.inv) }];
}
function vFOList(cat) {
  const rows = S.fo.filter(f => f.cat === cat);
  return listReport({ title: cat === 'FO' ? 'Ordens de frete' : 'Bookings de frete', sub: cat === 'FO' ? 'Freight orders · cap. 6.1' : 'Freight bookings · cap. 6.2', rows, open: 'fo', rowId: r => r.id,
    filters: [{ k: 'q', l: 'Pesquisa', test: (r, v) => txt(r, v, 'id', 'voyage', r => T.bpName(r.carrier), r => r.stops.map(s => T.loc(s.loc).city).join(' ')) }, { k: 'sub', l: 'Subcontratação', opts: [...new Set(rows.map(r => r.sub.status))], test: (r, v) => r.sub.status === v }, { k: 'ex', l: 'Execução', opts: [...new Set(rows.map(r => r.exec))], test: (r, v) => r.exec === v }, ...(cat === 'FB' ? [{ k: 'load', l: 'Carga', opts: [['1', 'Com UFs'], ['0', 'Vazios']], test: (r, v) => (r.stages.length > 0) === (v === '1') }] : [])],
    actions: cat === 'FO' ? btn('Cockpit de transporte', 'go', { app: 'cockpit' }, 'pri') : btn('Gestão de capacidade', 'go', { app: 'cap' }, 'pri'),
    cols: cat === 'FB' ? [{ l: 'Booking', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Viagem/voo', f: r => esc(r.voyage) }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Rota', f: r => esc(T.loc(r.stops[0].loc).city + ' → ' + T.loc(r.stops[1].loc).city) }, { l: 'Cut-off', f: r => dt(r.cutoff) }, { l: 'Partida', f: r => dt(r.stops[0].planDep) }, { l: 'Ocupação', f: r => capBar(r.kg, r.capKg) }, { l: 'Booking', f: r => st(r.sub.status) }, { l: 'Execução', f: r => st(r.life === 'Cancelado' ? 'Cancelado' : r.exec) }] : foCols() });
}

function vFO(id) {
  const f = T.fo(id); if (!f) return '<div class="empty">Documento não encontrado.</div>';
  const tab = U.tab || 'gen'; const FB = f.cat === 'FB';
  const ents = f.stages.map(T.stageOf).filter(Boolean);
  const cap = FB ? { kg: f.capKg, m3: f.capM3 } : { kg: T.mtr(f.mtr).capKg, m3: T.mtr(f.mtr).capM3, pal: T.mtr(f.mtr).capPal };
  const tn = f.sub.tender;
  const subActs = FB ? [['Solicitar booking à transportadora', 'fbReq', { id }]] :
    [['Seleção de transportadora (automática)', 'csRun', { id }], ['Atribuir transportadora manualmente…', 'csManual', { id }], ['Iniciar tendering', 'tdStart', { id }], ['Enviar ordem à transportadora', 'foSend', { id }], [f.subcontract ? 'Mudar para frota própria (sem subcontratação)' : 'Tornar relevante para subcontratação', 'foSubToggle', { id }]];
  const actions = menu('fo-sub', 'Subcontratação', subActs) + btn('Calcular encargos', 'calcFO', { id }) +
    menu('fo-ex', 'Execução', [['Verificar › Pronto para execução', 'foReady', { id }], ['Simular rastreamento (próximo evento)', 'foTrack', { id }], ['Reportar atraso…', 'foDelay', { id }], ['Reportar discrepância…', 'foDisc', { id }]]) +
    menu('fo-more', 'Mais', [[f.fixed ? 'Desfixar plano' : 'Fixar plano', 'foFix', { id }], ['Criar doc. de liquidação de frete', 'fsdCreate', { id }], ['Desatribuir todas as UFs', 'foUnassignAll', { id }], ['Cancelar documento', 'foCancel', { id }]]);
  const tabs = [{ id: 'gen', l: 'Geral' }, { id: 'stops', l: 'Paradas', c: f.stops.length }, { id: 'items', l: 'Itens / UFs', c: ents.length }, { id: 'ch', l: 'Encargos' }, { id: 'sub', l: 'Subcontratação' }, { id: 'exec', l: 'Execução', c: f.events.length }, { id: 'flow', l: 'Fluxo de documentos' }];
  let body = '';
  if (tab === 'gen') body = `<div class="grid2"><div class="sec"><h3>Dados de organização</h3>${kvs([['Categoria', FB ? 'Booking de frete (' + T.modeName(f.mode) + ')' : 'Ordem de frete rodoviária'], ['Tipo de documento', f.type], ['Org. de compras', f.purchOrg], ['Transportadora', f.carrier ? esc(f.carrier + ' ' + T.bpName(f.carrier)) : f.subcontract ? '—' : 'Frota própria'], ['Relevante p/ subcontratação', f.subcontract ? 'Sim' : 'Não'], ['Origem do plano', esc(f.origin || '—')], ['Fixado', f.fixed ? 'Sim' : 'Não'], ...(FB ? [['Programação', esc(f.schedule)], ['Viagem / voo', esc(f.voyage)], [f.mode === 'SEA' ? 'Master B/L' : 'MAWB', f.mbl || '—'], ['Cut-off de carga', dt(f.cutoff)]] : [])])}</div>
    <div class="sec"><h3>Capacidade e custos de planejamento</h3>${kvs([['Meio de transporte', esc(f.mtr + ' – ' + T.mtr(f.mtr).desc)], ['Recurso de veículo', esc(f.resource || '—')], ['Distância', nf(f.km) + ' km'], ['Peso', capBar(f.kg, cap.kg) + `<span class="small muted">${kg(f.kg)} de ${kg(cap.kg)}</span>`], ['Volume', capBar(f.m3, cap.m3) + `<span class="small muted">${nf(f.m3, 1)} de ${nf(cap.m3)} m³</span>`], ...(cap.pal ? [['Paletes', capBar(f.pal, cap.pal)]] : []), ...(!FB ? [['Custo de planejamento', money(f.planCost)], ['Atraso previsto', f.lateH ? nf(f.lateH, 1) + ' h' : 'Nenhum']] : [])])}</div></div>`;
  if (tab === 'stops') body = `<div class="sec">${table([{ l: '#', f: r => f.stops.indexOf(r) + 1 }, { l: 'Local', f: r => esc(T.locName(r.loc)) }, { l: 'Chegada plan.', f: r => dt(r.planArr) }, { l: 'Partida plan.', f: r => dt(r.planDep) }, { l: 'Chegada real', f: r => dt(r.actArr) }, { l: 'Partida real', f: r => dt(r.actDep) }, { l: 'Carregar', f: r => r.load.map(k => L(k.split('#')[0])).join(' ') || '—' }, { l: 'Descarregar', f: r => r.unload.map(k => L(k.split('#')[0])).join(' ') || '—' }], f.stops)}
    <div style="margin-top:12px">${mapSVG(f.stops.map(s => s.loc), [{ path: f.stops.map(s => s.loc), color: FB ? 'var(--crit)' : 'var(--accent)', w: 3, dash: FB }])}</div></div>`;
  if (tab === 'items') body = `<div class="sec">${table([{ l: 'UF', f: r => L(r.fu.id) }, { l: 'Etapa', f: r => r.st.n + ' ' + esc(r.st.type) }, { l: 'Requisito', f: r => r.fu.reqs.map(x => L(x.id)).join(' ') }, { l: 'De → para', f: r => esc(T.loc(r.st.from).city + ' → ' + T.loc(r.st.to).city) }, { l: 'Peso', num: 1, f: r => kg(r.fu.kg) }, { l: 'Pal.', num: 1, f: r => nf(r.fu.pal, 1) }, { l: '', f: r => dgChips(r.fu.traits) }, { l: 'Status de manuseio', f: r => st(r.st.handling) }, { l: '', f: r => `<button class="btn ghost" data-a="foUnassign" data-id="${f.id}" data-key="${r.key}">Desatribuir</button>` }], ents, { empty: 'Nenhuma UF atribuída.' })}</div>`;
  if (tab === 'ch') body = (f.tenderPrice ? `<div class="note" style="margin-bottom:12px">Preço definido no tendering: ${money(f.tenderPrice)}.</div>` : '') + chargesView(f.charges, 'custo');
  if (tab === 'sub') body = subView(f);
  if (tab === 'exec') body = execView(f);
  if (tab === 'flow') {
    const reqs = [...new Map(ents.flatMap(e => e.fu.reqs).map(r => [r.id, r])).values()];
    body = `<div class="sec"><h3>Fluxo de documentos</h3><div class="flow" style="align-items:flex-start"><div style="display:flex;flex-direction:column;gap:8px"><div class="small muted">Requisitos</div>${reqs.map(r => { const d = T.req(r); return flowNode(r.type, r.id, d && d.life); }).join('')}</div><span class="arrow">→</span><div style="display:flex;flex-direction:column;gap:8px"><div class="small muted">Unidades de frete</div>${ents.map(e => flowNode('UF', e.fu.id, e.st.handling)).join('')}</div><span class="arrow">→</span>${flowNode(FB ? 'Booking' : 'Ordem de frete', f.id, f.exec)}<span class="arrow">→</span>${f.fsd ? flowNode('DLF', f.fsd, T.fsd(f.fsd).status) : '<div class="small muted">Sem liquidação</div>'}</div></div>`;
  }
  return header({ title: `${FB ? 'Booking de frete' : 'Ordem de frete'} <span class="mono">${f.id}</span>`, sub: esc(f.stops.map(s => T.loc(s.loc).city).join(' → ') + (FB ? ' · ' + f.voyage : ' · ' + T.mtr(f.mtr).desc)), actions, tabs, tab,
    attrsList: [['Peso', kg(f.kg), 'big'], ['Distância', nf(f.km) + ' km', 'big'], ['Custo', f.charges ? money(f.charges.total) : '—', 'big'], ['Ciclo de vida', st(f.life)], ['Subcontratação', st(f.sub.status)], ['Execução', st(f.exec)], ['Liquidação', st(f.inv)], ...(f.fixed ? [['Plano', st('Fixado')]] : [])] }) + body;
}

function subView(f) {
  const tn = f.sub.tender;
  const cands = f.cat === 'FO' && f.stops.length ? T.carrierCandidates(f.id) : [];
  const rfqs = S.rfq.filter(r => r.fo === f.id);
  return `<div class="grid2"><div class="sec"><h3>Status de subcontratação</h3>${kvs([['Status', st(f.sub.status)], ['Transportadora', f.carrier ? esc(T.bpName(f.carrier)) : '—'], ['Estratégia de seleção', S.md.settings.carrierSel.strategy === 'COST' ? 'Custo total (acordos de frete)' : 'Prioridade da rota'], ['Perfil de tendering', S.md.settings.tendering.id]])}
    <div class="toolbar" style="margin-top:12px">${f.cat === 'FO' ? btn('Seleção de transportadora', 'csRun', { id: f.id }, 'pri') + btn('Iniciar tendering', 'tdStart', { id: f.id }) + btn('Enviar à transportadora', 'foSend', { id: f.id }) : btn('Solicitar booking', 'fbReq', { id: f.id }, 'pri')}${btn('Abrir portal da transportadora', 'go', { app: 'portal' })}</div></div>
    ${f.cat === 'FO' ? `<div class="sec"><h3>Ranking de transportadoras <span class="muted small">rotas de transporte + acordos de frete (cap. 6.5)</span></h3>${table([{ l: 'Rank', k: 'rank' }, { l: 'Transportadora', f: r => esc(r.bp + ' ' + T.bpName(r.bp)) }, { l: 'Rota', k: 'lane' }, { l: 'Prioridade', num: 1, k: 'prio' }, { l: 'Custo (acordo)', num: 1, f: r => r.cost != null ? money(r.cost) : 'sem acordo' }, { l: 'Custo interno da rota', num: 1, f: r => money(r.laneCost) }, { l: '', f: r => `<button class="btn ghost" data-a="csPick" data-id="${f.id}" data-bp="${r.bp}">Atribuir</button>` }], cands, { empty: 'Nenhuma rota de transporte cobre este trajeto.' })}</div>` : ''}</div>
    ${tn ? `<div class="sec"><h3>Tendering <span>${st(tn.status)}</span></h3>${kvs([['Estimativa de custo', money(tn.est)], ['Preço-limite', money(tn.priceLimit)], ['Iniciado em', dt(tn.startedAt)], ['Vencedor', tn.award ? esc(T.bpName(tn.award.carrier)) + ' · ' + money(tn.award.price) : '—']])}
      <h4>Plano de tendering</h4>${table([{ l: 'Etapa', k: 'no' }, { l: 'Tipo', f: r => r.type === 'P2P' ? 'Ponto a ponto' : 'Broadcast' }, { l: 'Transportadoras', f: r => esc(r.carriers.map(T.bpName).join(', ')) }, { l: 'Prazo', f: r => r.hours + ' h' }, { l: 'Status', f: r => st(r.status) }], tn.steps)}
      <h4>RFQs de frete e cotações</h4>${table([{ l: 'RFQ', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Etapa', k: 'step' }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Prazo', f: r => dt(r.dueAt) }, { l: 'Preço cotado', num: 1, f: r => r.price != null ? money(r.price) : '—' }, { l: 'Motivo', f: r => esc(r.reason || '') }, { l: 'Status', f: r => st(r.status) }], rfqs)}
      <div class="toolbar" style="margin-top:12px">${btn('Simular respostas das transportadoras', 'tdSim', { id: f.id }, '', tn.status !== 'Em andamento')}${btn('Avaliar cotações', 'tdEval', { id: f.id }, 'pri', tn.status !== 'Em andamento')}${btn('Avançar relógio 4 h', 'clock', { h: 4 })}</div>
      <p class="small muted">No sistema real, o relatório /SCMTMS/TEND_CONT_PROCESS avalia as cotações em background. Aqui, “Avaliar cotações” executa a mesma lógica: ponto a ponto premia a cotação aceita dentro do preço-limite; broadcast premia o menor preço válido; sem resposta, passa à próxima etapa.</p></div>` : ''}`;
}

function execView(f) {
  const ev = T.expectedEvents(f); const next = ev.find(e => !e.done);
  const evRows = ev.map(e => ({ ...e }));
  return `<div class="sec"><h3>Eventos esperados e reportados <span class="muted small">Event handler · cap. 7.2</span></h3>
    <div class="toolbar" style="margin-bottom:10px">${btn('Verificar prontidão', 'foReady', { id: f.id })}${btn('Simular rastreamento', 'foTrack', { id: f.id }, 'pri', f.exec === 'Executado')}${btn('Reportar atraso', 'foDelay', { id: f.id }, '', f.exec === 'Executado')}${btn('Reportar discrepância', 'foDisc', { id: f.id })}</div>
    ${table([{ l: '#', f: r => r.idx + 1 }, { l: 'Evento', f: r => esc(T.EVENTS[r.code]) }, { l: 'Local', f: r => esc(T.locName(f.stops[r.stop].loc)) }, { l: 'Planejado', f: r => dt(r.plan) }, { l: 'Previsto (ETA)', f: r => r.done ? '—' : dt(r.eta) }, { l: 'Reportado', f: r => r.done ? dt(r.done.at) : '—' }, { l: 'Desvio', num: 1, f: r => r.done ? `<span style="color:${r.done.delayMin > 30 ? 'var(--neg)' : 'var(--pos)'}">${r.done.delayMin > 0 ? '+' : ''}${r.done.delayMin} min</span>` : '' }, { l: '', f: r => r.done ? st('Reportado') : (next && r.idx === next.idx ? `<span style="display:flex;gap:6px;align-items:center"><input type="datetime-local" class="inp" style="width:190px" id="evat_${r.idx}" value="${T.maxIso(S.clock, f.events.length ? f.events[f.events.length - 1].at : S.clock)}"><button class="btn pri" data-a="evReport" data-id="${f.id}" data-idx="${r.idx}">Reportar</button></span>` : st('Esperado')) }], evRows)}
    ${f.delays && f.delays.length ? `<h4>Atrasos reportados</h4>${table([{ l: 'Em', f: r => dt(r.at) }, { l: 'Minutos', num: 1, k: 'minutes' }, { l: 'Motivo', k: 'reason' }], f.delays)}` : ''}
    <h4>Status de manuseio por item</h4>${table([{ l: 'UF', f: r => L(r.fu.id) }, { l: 'Etapa', f: r => r.st.n }, { l: 'Status de manuseio', f: r => st(r.st.handling) }, { l: 'Execução da etapa', f: r => st(r.st.exec) }, { l: 'Execução da UF', f: r => st(r.fu.exec) }], f.stages.map(T.stageOf).filter(Boolean))}</div>`;
}

/* ---------------- Gestão de capacidade ---------------- */
function vCap() {
  return header({ title: 'Gestão de capacidade', sub: 'Criação sistemática de documentos baseados em programação · cap. 6.4.2' }) +
    `<div class="sec"><h3>Programações (schedules)</h3>${table([{ l: 'Programação', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Modal', f: r => T.modeName(r.mode) }, { l: 'Rota', f: r => esc(T.loc(r.from).city + ' → ' + T.loc(r.to).city) }, { l: 'Partidas', f: r => r.weekday === -1 ? 'seg/qua/sex' : ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][r.weekday] + ' ' + r.depHour + 'h' }, { l: 'Trânsito', f: r => r.transitH >= 48 ? nf(r.transitH / 24) + ' dias' : r.transitH + ' h' }, { l: 'Capacidade', num: 1, f: r => kg(r.capKg) }, { l: 'Bookings existentes', num: 1, f: r => S.fo.filter(f => f.schedule === r.id && f.life !== 'Cancelado').length }, { l: '', f: r => `<button class="btn" data-a="capGen" data-id="${r.id}">Criar bookings (4 semanas)</button>` }], S.md.schedules)}</div>
    <div class="sec"><h3>Bookings existentes</h3>${table([{ l: 'Booking', f: r => L(r.id) }, { l: 'Viagem/voo', k: 'voyage' }, { l: 'Rota', f: r => esc(T.loc(r.stops[0].loc).city + ' → ' + T.loc(r.stops[1].loc).city) }, { l: 'Cut-off', f: r => dt(r.cutoff) }, { l: 'Partida', f: r => dt(r.stops[0].planDep) }, { l: 'Chegada', f: r => dt(r.stops[1].planArr) }, { l: 'Ocupação', f: r => capBar(r.kg, r.capKg) }, { l: 'Status', f: r => st(r.sub.status) }], S.fo.filter(f => f.cat === 'FB' && f.life !== 'Cancelado').sort((a, b) => a.stops[0].planDep < b.stops[0].planDep ? -1 : 1))}</div>`;
}

/* ---------------- Tendering monitor ---------------- */
function vTender() {
  const fos = S.fo.filter(f => f.sub.tender);
  return header({ title: 'Monitor de tendering', sub: 'Worklist: cotações a revisar, tenderings sem sucesso · cap. 6.6.2' }) +
    `<div class="sec"><h3>Ordens de frete em tendering</h3>${table([{ l: 'Ordem de frete', f: r => L(r.id) }, { l: 'Rota', f: r => esc(r.stops.map(s => T.loc(s.loc).city).join(' → ')) }, { l: 'Etapa atual', f: r => r.sub.tender.steps[r.sub.tender.cur] ? (r.sub.tender.cur + 1) + ' – ' + (r.sub.tender.steps[r.sub.tender.cur].type === 'P2P' ? 'ponto a ponto' : 'broadcast') : '—' }, { l: 'Preço-limite', num: 1, f: r => money(r.sub.tender.priceLimit) }, { l: 'Vencedor', f: r => r.sub.tender.award ? esc(T.bpName(r.sub.tender.award.carrier)) + ' · ' + money(r.sub.tender.award.price) : '—' }, { l: 'Status', f: r => st(r.sub.tender.status) }, { l: '', f: r => r.sub.tender.status === 'Em andamento' ? `<button class="btn" data-a="tdEval" data-id="${r.id}">Avaliar</button>` : '' }], fos, { empty: 'Nenhum tendering iniciado. Abra uma ordem de frete › Subcontratação › Iniciar tendering.' })}</div>
    <div class="sec"><h3>Todas as RFQs de frete</h3>${table([{ l: 'RFQ', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Ordem de frete', f: r => L(r.fo) }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Tipo', f: r => r.type === 'P2P' ? 'Ponto a ponto' : 'Broadcast' }, { l: 'Enviada', f: r => dt(r.sentAt) }, { l: 'Prazo', f: r => dt(r.dueAt) }, { l: 'Preço', num: 1, f: r => r.price != null ? money(r.price) : '—' }, { l: 'Status', f: r => st(r.status) }], S.rfq)}</div>`;
}

/* ---------------- Portal da transportadora ---------------- */
function vPortal() {
  const carriers = S.md.bps.filter(b => b.roles.includes('Transportadora'));
  const c = U.portalCarrier || '2001'; U.portalCarrier = c;
  const rfqs = S.rfq.filter(r => r.carrier === c && r.status === 'Aberta');
  const fos = S.fo.filter(f => f.carrier === c && f.sub.status === 'Enviado');
  const hist = S.rfq.filter(r => r.carrier === c && r.status !== 'Aberta');
  return header({ title: 'Portal da transportadora', sub: 'Simula o SAP Business Network Freight Collaboration: o usuário age como a transportadora (cap. 6.6.3)' }) +
    `<div class="sec"><div class="fbar" style="margin:0">${fld('Atuar como transportadora', sel('pt_carrier', carriers.map(b => [b.id, b.id + ' ' + b.name]), c, 'data-c="portal"'))}<div class="muted small" style="max-width:560px">Responda RFQs (aceitar com preço ou rejeitar com motivo) e confirme ordens de frete e bookings enviados. Depois volte à ordem de frete e use “Avaliar cotações”.</div></div></div>
    <div class="sec"><h3>RFQs de frete abertas (${rfqs.length})</h3>${table([{ l: 'RFQ', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Ordem', f: r => L(r.fo) }, { l: 'Rota', f: r => { const f = T.fo(r.fo); return esc(f.stops.map(s => T.loc(s.loc).city).join(' → ')); } }, { l: 'Coleta', f: r => dt(T.fo(r.fo).stops[0].planArr) }, { l: 'Peso', num: 1, f: r => kg(T.fo(r.fo).kg) }, { l: 'Responder até', f: r => dt(r.dueAt) }, { l: 'Preço (R$)', f: r => `<input class="inp sm" type="number" id="pp_${r.id}" value="${Math.round(r.est * 1.02)}" style="width:110px">` }, { l: '', f: r => `<span class="toolbar"><button class="btn pos" data-a="ptAcc" data-id="${r.id}">Aceitar</button>${sel('pr_' + r.id, ['Sem capacidade na data', 'Rota fora da malha', 'Preço abaixo do custo'], '', 'class="inp" style="width:180px"')}<button class="btn neg" data-a="ptRej" data-id="${r.id}">Rejeitar</button></span>` }], rfqs, { empty: 'Nenhuma RFQ aberta para esta transportadora.' })}</div>
    <div class="sec"><h3>Ordens e bookings para confirmação (${fos.length})</h3>${table([{ l: 'Documento', f: r => L(r.id) }, { l: 'Rota', f: r => esc(r.stops.map(s => T.loc(s.loc).city).join(' → ')) }, { l: 'Início', f: r => dt(r.stops[0].planArr) }, { l: 'Peso', num: 1, f: r => kg(r.kg) }, { l: 'Valor', num: 1, f: r => r.charges ? money(r.charges.total) : '—' }, { l: '', f: r => `<span class="toolbar"><button class="btn pos" data-a="ptConf" data-id="${r.id}">Confirmar</button><button class="btn neg" data-a="ptDecl" data-id="${r.id}">Rejeitar</button></span>` }], fos, { empty: 'Nada aguardando confirmação.' })}</div>
    <div class="sec"><h3>Histórico de cotações</h3>${table([{ l: 'RFQ', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Ordem', f: r => L(r.fo) }, { l: 'Preço', num: 1, f: r => r.price != null ? money(r.price) : '—' }, { l: 'Status', f: r => st(r.status) }], hist)}</div>`;
}

/* ---------------- Monitor de eventos ---------------- */
function vEM() {
  const docs = S.fo.filter(f => f.life !== 'Cancelado' && f.stages.length && f.exec !== 'Não iniciado' || (f.stages.length && ['Confirmado', 'Transportadora aceitou'].includes(f.sub.status) && f.exec === 'Não iniciado'));
  const row = f => { const ev = T.expectedEvents(f); const next = ev.find(e => !e.done); const last = f.events[f.events.length - 1]; const late = (last && last.delayMin > 30) || (next && next.eta < S.clock); return { f, next, last, late, done: ev.filter(e => e.done).length, total: ev.length }; };
  const rows = docs.map(row);
  return header({ title: 'Monitor de eventos', sub: 'Visibilidade de execução: eventos esperados × reportados (SAP Event Management, cap. 7.2)' }) +
    `<div class="kpis">${[['Em execução', rows.filter(r => r.f.exec === 'Em execução').length], ['Prontos p/ execução', rows.filter(r => r.f.exec === 'Pronto p/ execução').length], ['Com atraso', rows.filter(r => r.late && r.f.exec !== 'Executado').length], ['Executados', rows.filter(r => r.f.exec === 'Executado').length]].map(k => `<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('')}</div>
    <div class="sec"><h3>Event handlers</h3>${table([{ l: 'Documento', f: r => L(r.f.id) }, { l: 'Transportadora', f: r => esc(r.f.carrier ? T.bpName(r.f.carrier) : 'Frota própria') }, { l: 'Rota', f: r => esc(r.f.stops.map(s => T.loc(s.loc).city).join(' → ')) }, { l: 'Progresso', f: r => capBar(r.done, r.total) }, { l: 'Último evento', f: r => r.last ? esc(T.EVENTS[r.last.code]) + ' · ' + dt(r.last.at) : '—' }, { l: 'Próximo esperado', f: r => r.next ? esc(T.EVENTS[r.next.code]) + ' · ' + dt(r.next.eta) : '—' }, { l: 'Situação', f: r => r.f.exec === 'Executado' ? st('Executado') : r.late ? st('Atrasado') : st('No prazo') }, { l: '', f: r => r.f.exec !== 'Executado' ? `<button class="btn" data-a="foTrack" data-id="${r.f.id}">Simular rastreamento</button>` : '' }], rows, { empty: 'Nenhum documento confirmado ou em execução.' })}</div>`;
}

/* ---------------- Liquidação ---------------- */
function vFSDList() {
  return listReport({ title: 'Documentos de liquidação de frete', sub: 'Freight settlement documents · cap. 10.1', rows: S.fsd, open: 'fsd', rowId: r => r.id,
    actions: btn('Criar a partir de ordens executadas', 'fsdMass', {}, 'pri'),
    cols: [{ l: 'DLF', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Documento de frete', f: r => L(r.fo) }, { l: 'Transportadora', f: r => esc(T.bpName(r.carrier)) }, { l: 'Valor', num: 1, f: r => money(r.amount) }, { l: 'Pedido de compra', f: r => r.po || '—' }, { l: 'Folha de serviço', f: r => r.ses || '—' }, { l: 'Status', f: r => st(r.status) }], empty: 'Nenhum DLF. Crie a partir de uma ordem de frete (Mais › Criar doc. de liquidação).' });
}
function vFSD(id) {
  const d = T.fsd(id); if (!d) return '';
  const actions = btn('Transferir ao ERP (MM)', 'fsdTransfer', { id }, 'pri', d.status !== 'Novo') + btn('Lançar fatura do transportador…', 'fsdInvoice', { id }, '', d.status !== 'Transferido') + (d.status === 'Em disputa' ? btn('Aceitar valor faturado', 'fsdDispute', { id, ok: 1 }, 'pos') + btn('Recusar fatura', 'fsdDispute', { id, ok: 0 }, 'neg') : '');
  return header({ title: `Documento de liquidação de frete <span class="mono">${d.id}</span>`, sub: esc(T.bpName(d.carrier)) + ' · ' + d.type, actions,
    attrsList: [['Valor', money(d.amount), 'big'], ['Fatura do transportador', d.invoice ? money(d.invoice.amount) : '—', 'big'], ['Status', st(d.status)], ['Documento de frete', L(d.fo)], ['Pedido de compra', d.po || '—'], ['Folha de registro de serviço', d.ses || '—'], ['Doc. de fatura (MIRO)', d.invoice && d.invoice.doc || '—']] }) +
    `<div class="note" style="margin-bottom:14px">Ao transferir, o TM envia o DLF ao MM: cria pedido de compra de serviço e folha de registro de serviço e lança a provisão. A fatura do transportador é verificada contra esse valor; acima da tolerância de ${S.md.settings.invoiceTolerancePct}% abre-se uma disputa (cap. 10.1.3 e 10.1.5).</div>
    <div class="sec"><h3>Itens de encargo</h3>${table([{ l: 'Linha', k: 'n' }, { l: 'Tipo', f: r => `<span class="mono">${r.ct}</span> ${esc(r.desc)}` }, { l: 'Base', k: 'base' }, { l: 'Valor', num: 1, f: r => money(r.amount) }], d.lines, { sum: `<tr class="sum"><td colspan="3">Total</td><td class="num">${money(d.amount)}</td></tr>` })}</div>
    <div class="sec"><h3>Distribuição de custos <span class="muted small">por peso bruto para UFs e requisitos (cap. 10.2)</span></h3>${table([{ l: 'UF', f: r => L(r.fu) }, { l: 'Requisitos', f: r => r.reqs.map(x => L(x.id)).join(' ') }, { l: 'Participação', num: 1, f: r => nf(r.share, 1) + '%' }, { l: 'Valor', num: 1, f: r => money(r.amount) }], d.dist, { empty: 'A distribuição é calculada na transferência ao ERP.' })}</div>
    <div class="sec"><h3>Histórico</h3>${table([{ l: 'Data', f: r => dt(r.at) }, { l: 'Evento', k: 'text' }], d.history)}</div>`;
}
function vFWSDList() {
  return listReport({ title: 'Documentos de liquidação de expedição', sub: 'Forwarding settlement documents · cap. 11.3', rows: S.fwsd, open: 'fwsd', rowId: r => r.id,
    cols: [{ l: 'DLE', f: r => `<span class="mono">${r.id}</span>` }, { l: 'Ordem de expedição', f: r => L(r.fwo) }, { l: 'Pagador', f: r => esc(T.bpName(r.billTo)) }, { l: 'Valor', num: 1, f: r => money(r.amount) }, { l: 'Doc. de faturamento', f: r => r.billing || '—' }, { l: 'Status', f: r => st(r.status) }], empty: 'Nenhum DLE. Crie a partir de uma ordem de expedição (Mais › Criar doc. de liquidação).' });
}
function vFWSD(id) {
  const d = T.fwsd(id); if (!d) return '';
  return header({ title: `Documento de liquidação de expedição <span class="mono">${d.id}</span>`, sub: esc(T.bpName(d.billTo)) + ' · Org. vendas ' + d.salesOrg, actions: btn('Transferir ao SD (faturamento)', 'fwsdTransfer', { id }, 'pri', d.status !== 'Novo'),
    attrsList: [['Valor', money(d.amount), 'big'], ['Status', st(d.status)], ['Ordem de expedição', L(d.fwo)], ['Doc. de faturamento SD', d.billing || '—']] }) +
    `<div class="sec"><h3>Itens</h3>${table([{ l: 'Linha', k: 'n' }, { l: 'Tipo', f: r => `<span class="mono">${r.ct}</span> ${esc(r.desc)}` }, { l: 'Valor', num: 1, f: r => money(r.amount) }], d.lines, { sum: `<tr class="sum"><td colspan="2">Total</td><td class="num">${money(d.amount)}</td></tr>` })}</div><div class="sec"><h3>Histórico</h3>${table([{ l: 'Data', f: r => dt(r.at) }, { l: 'Evento', k: 'text' }], d.history)}</div>`;
}
