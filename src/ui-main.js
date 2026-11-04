/* ==========================================================================
   Renderização, shell e tratamento de eventos
   ========================================================================== */
function appTitle(a) { return (APPS[a] || APPS[{ 'so-new': 'otr', 'fwq-new': 'fwq', 'md-loc': 'loc' }[a]] || ['Simulador'])[0]; }
function viewFor() {
  const a = U.app, id = U.id;
  switch (a) {
    case 'home': return vLaunchpad();
    case 'fwo-new': return reqForm('FWO'); case 'fwq-new': return reqForm('FWQ'); case 'so-new': return reqForm('SO');
    case 'fwo': return id ? vFWO(id) : vFWOList(); case 'fwq': return id ? vFWQ(id) : vFWQList(); case 'otr': return id ? vOTR(id) : vOTRList();
    case 'fu': return id ? vFU(id) : vFUList(); case 'cockpit': return vCockpit(); case 'cap': return vCap();
    case 'fo': return id ? vFO(id) : vFOList('FO'); case 'fb': return id ? vFO(id) : vFOList('FB');
    case 'tender': return vTender(); case 'portal': return vPortal(); case 'em': return vEM();
    case 'fsd': return id ? vFSD(id) : vFSDList(); case 'fwsd': return id ? vFWSD(id) : vFWSDList();
    case 'agr': return id ? vAgr(id) : vAgrList(); case 'rt': return id ? vRT(id) : vRTList();
    case 'bp': case 'loc': case 'zone': case 'lane': case 'sched': case 'res': case 'prod': return vMD(a);
    case 'analytics': return vAnalytics(); case 'log': return vLog(); case 'cfg': return vCfg(); case 'sys': return vSys();
    case 'ex': return vEx(); case 'gloss': return vGloss();
  }
  return vLaunchpad();
}
function shell() {
  const t = U.app === 'home' ? 'Página inicial' : appTitle(U.app);
  return `<header class="shell"><button class="ibtn logo" data-a="home" aria-label="Página inicial"><b>SAP</b><span>Transportation Management</span></button>
    ${U.app !== 'home' ? `<button class="ibtn" data-a="back" aria-label="Voltar">←</button>` : ''}<span class="title">${esc(t)}</span><span class="sp"></span>
    <input class="search" id="gsearch" placeholder="Nº do documento ou app" aria-label="Pesquisar documento ou app">
    <span class="clock clock-l" title="Data do sistema">${dt(S.clock)}</span>
    <button class="ibtn" data-a="clock" data-h="1" title="Avançar 1 hora">+1h</button><button class="ibtn" data-a="clock" data-h="24" title="Avançar 1 dia">+1d</button>
    <button class="ibtn" data-a="theme" title="Tema claro/escuro" aria-label="Alternar tema" style="font-size:18px">◐</button><span class="avatar" title="Gustavo – planejador de transporte">GU</span></header>`;
}
function crumbs() {
  if (U.app === 'home') return '';
  const base = { fwo: 'fwo', fwq: 'fwq', otr: 'otr', fu: 'fu', fo: 'fo', fb: 'fb', fsd: 'fsd', fwsd: 'fwsd', agr: 'agr', rt: 'rt' }[U.app];
  return `<nav class="crumbs" aria-label="Navegação"><a data-a="home">Página inicial</a><span>›</span>${U.id && base ? `<a data-a="go" data-app="${base}">${esc(appTitle(base))}</a><span>›</span><span class="mono">${esc(U.id)}</span>` : `<span>${esc(appTitle(U.app))}</span>`}</nav>`;
}
function footer() {
  const m = U.lastMsgs; const c = t => m.filter(x => x.type === t).length;
  const last = m[m.length - 1] || S.log[0];
  return `<div class="footer"><div class="msgs">${['E', 'W', 'S'].filter(t => c(t)).map(t => `<button class="mcount" data-a="pop"><span class="mi ${t}">${{ E: '✕', W: '!', S: '✓' }[t]}</span>${c(t)}</button>`).join('')}<button class="mcount" data-a="pop" title="Mensagens">Mensagens</button><span class="last">${last ? `<span class="mi ${last.type}">${{ S: '✓', W: '!', E: '✕', I: 'i' }[last.type]}</span> ${esc(last.text)}` : ''}</span></div>${btn('Exercícios', 'go', { app: 'ex' })}</div>
  ${U.pop ? `<div class="pop" role="dialog" aria-label="Mensagens"><div class="row" style="justify-content:space-between"><b>Mensagens da última ação</b><button class="btn ghost" data-a="go" data-app="log">Ver log completo</button></div>${(m.length ? m : S.log.slice(0, 8)).map(x => `<div class="row"><span class="mi ${x.type}">${{ S: '✓', W: '!', E: '✕', I: 'i' }[x.type]}</span><div style="min-width:0">${esc(x.text)}${x.ref && docApp(x.ref) ? ' ' + L(x.ref) : ''}</div></div>`).join('')}</div>` : ''}`;
}
function render() {
  const root = document.getElementById('app'); if (!root) return;
  const y = window.scrollY; const key = U.app + '|' + U.id;
  let main = '';
  try { main = viewFor(); } catch (e) { console.error(e); main = `<div class="strip E"><span class="mi E">✕</span>Erro ao exibir a tela: ${esc(e.message)}</div>`; }
  const strips = U.lastMsgs.filter(m => m.type === 'E').slice(0, 3).map(m => `<div class="strip E"><span class="mi E">✕</span><div>${esc(m.text)}</div></div>`).join('');
  root.innerHTML = shell() + `<main>${crumbs()}${strips}${main}</main>` + footer() + renderDlg() + `<div class="toast" id="toast" ${U.toast ? '' : 'hidden'}>${U.toast ? esc(U.toast.text) : ''}</div>`;
  if (U._key === key) window.scrollTo(0, y); U._key = key;
}

/* ---------------- ações ---------------- */
const C = () => U.ck;
const A = {
  home: () => go('home'), back: () => back(),
  go: d => { if (d.app === 'rt' && d.id) return go('rt', d.id); go(d.app, d.id || null); },
  open: d => openDoc(d.id),
  row: d => { if (d.app.startsWith('md-')) return mdEdit(d.app.slice(3), d.id); go(d.app, d.id); },
  tab: d => { U.tab = d.tab; if (d.tab === 'flow' && U.app === 'fwo' && !S.flags.flowSeen) { S.flags.flowSeen = true; save(); } render(); },
  menu: d => { U.menu = U.menu === d.id ? null : d.id; render(); },
  sel: d => { U.sel.has(d.id) ? U.sel.delete(d.id) : U.sel.add(d.id); render(); },
  selall: d => { const ids = d.ids ? d.ids.split(',') : []; const all = ids.every(i => U.sel.has(i)); ids.forEach(i => all ? U.sel.delete(i) : U.sel.add(i)); render(); },
  cksel: d => { const s = C().sel; s.has(d.id) ? s.delete(d.id) : s.add(d.id); render(); },
  ckselall: d => { const s = C().sel; const ids = d.ids ? d.ids.split(',') : []; const all = ids.length && ids.every(i => s.has(i)); ids.forEach(i => all ? s.delete(i) : s.add(i)); render(); },
  pop: () => { U.pop = !U.pop; render(); },
  theme: () => { const r = document.documentElement; const cur = r.getAttribute('data-theme'); const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.setAttribute('data-theme', dark ? 'light' : 'dark'); try { localStorage.setItem('sap-tm-theme', dark ? 'light' : 'dark'); } catch (e) { } },
  dlgbtn: d => { const b = U.dlg && U.dlg.buttons[+d.i]; if (b) b.fn(); },
  dlgclose: () => closeDlg(), ovclick: (d, el, e) => { if (e.target === el) closeDlg(); },
  clock: d => act(() => T.advanceClock(+d.h)),
  clockSet: () => act(() => { const v = val('sys_clock'); if (v) { T.setClock(v); T.info('Data do sistema definida para ' + dt(v)); T.expireRFQs(); } }),

  /* formulário de requisito */
  rfAdd: () => { readReqForm(); U.form.items.push({ product: 'MAT-200', qty: 100 }); render(); },
  rfDel: d => { readReqForm(); U.form.items.splice(+d.i, 1); if (!U.form.items.length) U.form.items.push({ product: 'MAT-100', qty: 100 }); render(); },
  reqSave: d => {
    readReqForm(); const F = U.form;
    const r = act(() => d.kind === 'FWO' ? T.createFWO({ ...F, items: F.items }) : d.kind === 'FWQ' ? T.createFWQ({ ...F }) : T.createSalesOrder({ soldTo: F.orderingParty, consignee: F.consignee, src: F.src, dst: F.dst, pickup: F.pickup, delivery: F.delivery, items: F.items }));
    if (r) { U.form = null; U.app = { FWO: 'fwo', FWQ: 'fwq', SO: 'otr' }[d.kind]; U.id = r.id; U.tab = null; render(); window.scrollTo(0, 0); }
  },

  /* OE / OTR / cotações */
  fwoCheck: d => act(() => T.checkDoc(T.fwo(d.id), 'OE')),
  fwoBuild: d => act(() => T.buildFUs([{ type: 'FWO', id: d.id }])),
  fwoBuildSel: () => { if (!U.sel.size) return toast('Selecione ordens de expedição na lista.', 'W'); act(() => T.buildFUs([...U.sel].map(id => ({ type: 'FWO', id })))); U.sel.clear(); render(); },
  fwoDelFU: d => act(() => T.deleteFUs({ type: 'FWO', id: d.id })),
  otrBuild: d => act(() => T.buildFUs([{ type: 'OTR', id: d.id }])), otrDelFU: d => act(() => T.deleteFUs({ type: 'OTR', id: d.id })), otrDeliv: d => act(() => T.createDelivery(d.id)),
  calcReq: d => act(() => T.calcCharges(d.kind === 'FWO' ? T.fwo(d.id) : T.fwq(d.id), d.kind)),
  fwqSubmit: d => act(() => T.fwqSubmit(d.id)), fwqResp: d => act(() => T.fwqRespond(d.id, d.ok === '1')),
  fwqToFwo: d => { const r = act(() => T.fwoFromFWQ(d.id)); if (r) go('fwo', r.id); },
  fwsdCreate: d => { U.menu = null; const r = act(() => T.createFWSD(d.id)); if (r) go('fwsd', r.id); },
  tpFwo: d => { U.menu = null; const f = T.fwo(d.id); const fu = f.fus.map(T.fu).find(u => u.stages.some(s => !s.fo)); if (!fu) return act(() => T.err(f.fus.length ? 'Todas as UFs estão planejadas.' : 'Crie as unidades de frete primeiro.')); tpDialog(fu.id); },
  tp: d => tpDialog(d.id),
  ckFromReq: d => { U.menu = null; const doc = docApp(d.id) === 'fwo' ? T.fwo(d.id) : T.otr(d.id); if (!doc.fus.length) return act(() => T.err('Crie as unidades de frete primeiro.')); ckPreselect(doc.fus); },
  ckFromFu: d => ckPreselect([d.id]),

  /* cockpit */
  ckres: d => { C().res = d.id; render(); }, ckdoc: d => { C().doc = d.id; render(); },
  ckCreate: () => { const fo = act(() => T.createFO([...C().sel], { resource: C().res, origin: 'Manual' })); if (fo) { C().sel.clear(); C().doc = fo.id; render(); } },
  ckAssign: () => { const keys = [...C().sel]; act(() => T.assignToFO(C().doc, keys)); if (keys.every(k => { const e = T.stageOf(k); return e && e.st.fo; })) { C().sel.clear(); render(); } },
  ckUnassign: () => { const keys = [...C().sel].filter(k => { const e = T.stageOf(k); return e && e.st.fo === C().doc; }); if (!keys.length) return act(() => T.err('Marque etapas já atribuídas ao documento selecionado (filtro Exibir › Incluir planejadas) ou use “Desatribuir todas” na ordem.')); act(() => T.unassign(C().doc, keys)); C().sel.clear(); if (!T.fo(C().doc)) C().doc = null; render(); },
  ckTP: () => { const e = T.stageOf([...C().sel][0]); if (e) tpDialog(e.fu.id, e.st.n); },
  ckOpt: () => optDialog(),

  /* ordens de frete */
  csRun: d => { U.menu = null; act(() => T.runCarrierSelection(d.id)); },
  csPick: d => act(() => T.assignCarrier(d.id, d.bp, 'atribuição manual pelo ranking')),
  csManual: d => { U.menu = null; const f = T.fo(d.id); const opts = S.md.bps.filter(b => b.roles.includes('Transportadora') && (b.modes || []).includes(f.mode)).map(b => [b.id, b.id + ' ' + b.name]);
    dialog('Atribuir transportadora', fld('Transportadora', sel('dl_bp', opts, f.carrier || opts[0][0])) + '<p class="small muted">Sem rota de transporte ou acordo válido, os encargos não poderão ser calculados.</p>', [{ l: 'Atribuir', cls: 'pri', fn: () => { const bp = val('dl_bp'); U.dlg = null; act(() => T.assignCarrier(d.id, bp, 'atribuição manual')); } }]); },
  tdStart: d => { U.menu = null; act(() => T.startTender(d.id)); U.tab = 'sub'; render(); },
  tdSim: d => act(() => T.simulateRFQResponses(d.id)), tdEval: d => act(() => T.evaluateTender(d.id)),
  foSend: d => { U.menu = null; act(() => T.sendToCarrier(d.id)); },
  foSubToggle: d => { U.menu = null; act(() => { const f = T.fo(d.id); if (f.events.length) return T.err('Documento já em execução.'); f.subcontract = !f.subcontract; if (!f.subcontract) { f.carrier = null; f.charges = null; f.sub.status = 'Não relevante'; if (!f.resource) { const r = S.md.resources.find(r => r.mtr === f.mtr && T.zonesOf(r.home).some(z => T.zonesOf(f.stops[0].loc).includes(z))); f.resource = r ? r.id : null; } } else f.sub.status = 'Não iniciado'; T.ok(`${f.id}: ${f.subcontract ? 'relevante para subcontratação' : 'execução com frota própria' + (f.resource ? ' (recurso ' + f.resource + ')' : '')}.`, f.id); }); },
  fbReq: d => { U.menu = null; act(() => T.bookingRequest(d.id)); },
  calcFO: d => act(() => T.calcCharges(T.fo(d.id), 'FO')),
  foReady: d => { U.menu = null; act(() => T.checkReady(d.id)); },
  foTrack: d => { U.menu = null; act(() => T.simulateTracking(d.id)); },
  foFix: d => { U.menu = null; act(() => T.toggleFix(d.id)); },
  foCancel: d => { U.menu = null; dialog('Cancelar documento', `<p>Cancelar ${d.id}? As unidades de frete voltam a ficar sem planejamento.</p>`, [{ l: 'Cancelar documento', cls: 'neg', fn: () => { U.dlg = null; act(() => T.cancelFO(d.id)); } }]); },
  foUnassignAll: d => { U.menu = null; act(() => T.unassign(d.id)); if (!T.fo(d.id)) go('fo'); },
  foUnassign: d => { act(() => T.unassign(d.id, [d.key])); if (!T.fo(d.id)) go('fo'); },
  foDelay: d => { U.menu = null; dialog('Reportar evento de atraso', `<div class="form">${fld('Atraso (minutos)', '<input id="dl_min" type="number" value="90">')}${fld('Motivo', sel('dl_rs', ['Congestionamento', 'Quebra de veículo', 'Fila no cliente', 'Condições climáticas', 'Fiscalização']))}</div>`, [{ l: 'Reportar', cls: 'pri', fn: () => { const m = val('dl_min'), r = val('dl_rs'); U.dlg = null; act(() => T.reportDelay(d.id, m, r)); } }]); },
  foDisc: d => { U.menu = null; const f = T.fo(d.id); const fus = f.stages.map(k => k.split('#')[0]); if (!fus.length) return; dialog('Reportar discrepância', `<div class="form">${fld('Unidade de frete', sel('dl_fu', fus, fus[0]))}${fld('Tipo', sel('dl_ty', ['Avaria', 'Falta', 'Sobra']))}${fld('Quantidade', '<input id="dl_q" type="number" value="2">')}</div>`, [{ l: 'Registrar', cls: 'pri', fn: () => { const a = val('dl_fu'), t = val('dl_ty'), q = val('dl_q'); U.dlg = null; act(() => T.reportDiscrepancy(d.id, a, q, t)); } }]); },
  evReport: d => { const v = val('evat_' + d.idx); act(() => T.reportEvent(d.id, +d.idx, v || S.clock)); },
  capGen: d => act(() => T.createBookingsFromSchedule(d.id, 4)),

  /* portal */
  ptAcc: d => { const p = val('pp_' + d.id); act(() => T.rfqRespond(d.id, true, p)); },
  ptRej: d => { const r = val('pr_' + d.id); act(() => T.rfqRespond(d.id, false, 0, r)); },
  ptConf: d => act(() => T.carrierRespondFO(d.id, true)), ptDecl: d => act(() => T.carrierRespondFO(d.id, false, 'Sem disponibilidade de veículo')),

  /* liquidação */
  fsdCreate: d => { U.menu = null; const r = act(() => T.createFSD(d.id)); if (r) go('fsd', r.id); },
  fsdMass: () => act(() => { const list = S.fo.filter(f => f.exec === 'Executado' && f.subcontract && !f.fsd && f.carrier); if (!list.length) return T.info('Nenhum documento executado pendente de liquidação.'); list.forEach(f => T.createFSD(f.id)); }),
  fsdTransfer: d => act(() => T.transferFSD(d.id)),
  fsdInvoice: d => { const x = T.fsd(d.id); dialog('Lançar fatura do transportador', `<p class="muted">Valor esperado: ${money(x.amount)} · tolerância ${S.md.settings.invoiceTolerancePct}%</p><div class="form">${fld('Valor faturado (R$)', `<input id="dl_amt" type="number" step="0.01" value="${x.amount}">`)}${fld('Referência (NF-e)', '<input id="dl_ref" value="NF-e ' + (Math.floor(Math.random() * 90000) + 10000) + '">')}</div>`, [{ l: 'Verificar fatura', cls: 'pri', fn: () => { const a = val('dl_amt'), r = val('dl_ref'); U.dlg = null; act(() => T.postInvoice(d.id, a, r)); } }]); },
  fsdDispute: d => act(() => T.resolveDispute(d.id, d.ok === '1')),
  fwsdTransfer: d => act(() => T.transferFWSD(d.id)),

  /* dados mestres */
  mdNew: d => mdEdit(d.app, null),
  agrSave: d => act(() => { const a = T.agr(d.id); a.sheet.forEach(l => { const v = val('ag_' + l.n); if (v === '') return; if (l.kind === 'TAB') l.factor = +v; else l.rate = +v; }); T.ok(`Acordo ${a.id} gravado.`); }),
  agrCopy: d => { const a = T.agr(d.id); const parties = a.kind === 'FA' ? S.md.bps.filter(b => b.roles.includes('Transportadora')) : S.md.bps.filter(b => b.roles.includes('Cliente'));
    dialog('Copiar acordo', `<div class="form">${fld('Novo ID', `<input id="dl_id" value="${a.id}-COPIA">`)}${fld('Parceiro', sel('dl_party', [...(a.kind === 'FWA' ? [['*', 'Todos']] : []), ...parties.map(b => [b.id, b.id + ' ' + b.name])], a.party))}${fld('Descrição', `<input id="dl_desc" value="${esc(a.desc)} (cópia)">`)}</div>`, [{ l: 'Copiar', cls: 'pri', fn: () => { const id = val('dl_id').trim(), party = val('dl_party'), desc = val('dl_desc'); if (T.agr(id)) return toast('ID já existe.', 'E'); U.dlg = null; act(() => { S.md.agreements.push({ ...JSON.parse(JSON.stringify(a)), id, party, desc }); T.ok(`Acordo ${id} criado como cópia de ${a.id}.`); }); go('agr', id); } }]); },
  rtSave: d => act(() => { const t = T.table(d.id); t.scale1.forEach((s, i) => { if (t.base2) t.scale2.forEach((x, j) => { const v = val(`rt_${i}_${j}`); if (v !== '') t.values[i][j] = +v; }); else { const v = val('rt_' + i); if (v !== '') t.values[i] = +v; } }); t.min = +val('rt_min'); T.ok(`Tabela de taxas ${t.id} gravada.`); }),
  logClear: () => act(() => { S.log = []; T.info('Log limpo.'); }),
  cfgSave: () => act(() => {
    const s = S.md.settings; s.fubr.strategy = val('cf_strategy'); s.fubr.splitKg = +val('cf_splitKg'); s.fubr.splitM3 = +val('cf_splitM3'); s.fubr.splitPal = +val('cf_splitPal'); s.fubr.critical = val('cf_critical'); s.fubr.autoBuild = val('cf_autoBuild') === '1';
    ['wFix', 'wKm', 'wLate', 'maxStops', 'startHour', 'handlingH'].forEach(k => s.planning[k] = +val('cf_' + k));
    s.carrierSel.strategy = val('cf_cs'); s.tendering.steps[0].type = val('cf_t1'); s.tendering.steps[0].hours = +val('cf_t1h'); if (s.tendering.steps[1]) s.tendering.steps[1].hours = +val('cf_t2h'); s.tendering.priceLimitPct = +val('cf_pl');
    s.invoiceTolerancePct = +val('cf_tol'); s.fx.EUR = +val('cf_eur'); s.fx.USD = +val('cf_usd');
    if (s.fubr.splitKg <= 0 || s.fubr.splitPal <= 0) { s.fubr.splitKg = Math.max(1000, s.fubr.splitKg); s.fubr.splitPal = Math.max(1, s.fubr.splitPal); T.warn('Quantidades de divisão inválidas foram corrigidas.'); }
    T.ok('Customizing gravado.');
  }),
  incDel: d => act(() => { S.md.settings.incompat.splice(+d.i, 1); T.ok('Incompatibilidade removida.'); }),
  incAdd: () => act(() => { const a = val('inc_a'), b = val('inc_b'); if (a === b) return T.err('Escolha características diferentes.'); S.md.settings.incompat.push({ a, b, desc: a.replace(':', ' ') + ' x ' + b.replace(':', ' ') }); T.ok('Incompatibilidade adicionada.'); }),

  /* sistema */
  exportJ: () => { const j = JSON.stringify(S); dialog('Exportar estado', `<p class="muted small">Copie e guarde este JSON. Para restaurar, use “Importar estado”.</p><textarea id="dl_json" class="inp" style="height:260px;width:100%;font-family:var(--f-mono);font-size:11px" readonly>${esc(j)}</textarea>`, [{ l: 'Copiar', cls: 'pri', fn: () => { const t = document.getElementById('dl_json'); (navigator.clipboard ? navigator.clipboard.writeText(j) : Promise.reject()).then(() => toast('JSON copiado.')).catch(() => { t.focus(); t.select(); toast('Selecionado: use Ctrl+C.'); }); } }], true); },
  importJ: () => dialog('Importar estado', '<textarea id="dl_json" class="inp" style="height:260px;width:100%;font-family:var(--f-mono);font-size:11px" placeholder="Cole aqui o JSON exportado"></textarea>', [{ l: 'Importar', cls: 'pri', fn: () => { try { const x = JSON.parse(val('dl_json')); if (x.v !== 3 || !x.md) throw new Error('formato'); S = x; U.dlg = null; U.app = 'home'; U.id = null; act(() => T.ok('Estado importado.')); } catch (e) { toast('JSON inválido para este simulador.', 'E'); } } }], true),
  resetAsk: d => dialog('Reinicializar sistema', `<p>${d.demo === '1' ? 'Restaurar o cenário de demonstração' : 'Começar apenas com dados mestres'}? Todos os documentos atuais serão apagados.</p>`, [{ l: 'Reinicializar', cls: 'neg', fn: () => { newState(d.demo === '1'); U.dlg = null; U.lastMsgs = []; U.ck = { sel: new Set(), doc: null, res: null, mode: 'RD', zone: '', showPlanned: false }; U.stack = []; save(); go('home', null, null, false); toast('Sistema reinicializado.'); } }]),
  exToggle: d => { const e = EXERCISES.find(x => x.id === d.id); const cur = U.exOpen[d.id] ?? (!exDone(e) && EXERCISES.findIndex(x => !exDone(x)) === EXERCISES.indexOf(e)); U.exOpen[d.id] = !cur; render(); },
  exGo: d => { const e = EXERCISES.find(x => x.id === d.id); go(e.app, e.appId || null, e.appTab || null); }
};
function ckPreselect(fuIds) {
  const C0 = U.ck; C0.sel = new Set(); let mode = null;
  fuIds.forEach(id => { const u = T.fu(id); const st = u && u.stages.find(s => !s.fo); if (st) { mode = mode || st.mode; if (st.mode === mode) C0.sel.add(u.id + '#' + st.n); } });
  C0.mode = mode || 'RD'; C0.zone = ''; C0.doc = null; go('cockpit');
}
function tpDialog(fuId, n) {
  OUT.length = 0; const ps = T.proposals(fuId, n); const errs = [...OUT];
  if (!ps.length) { U.lastMsgs = errs.length ? errs : [{ type: 'W', text: 'Nenhuma proposta encontrada (verifique rotas de transporte, bookings e capacidade).' }]; render(); toast(U.lastMsgs[0].text, 'W'); return; }
  U.tpList = ps;
  dialog('Proposta de transporte · UF ' + fuId, `<p class="muted small">Alternativas calculadas com as rotas de transporte e os acordos de frete (rodoviário) ou com os bookings disponíveis (marítimo/aéreo). Cap. 5.7.9.</p>` +
    table([{ l: 'Alternativa', f: r => esc(r.label) }, { l: 'Distância', num: 1, f: r => nf(r.km) + ' km' }, { l: 'Chegada', f: r => dt(r.arr) }, { l: 'Atraso', num: 1, f: r => r.lateH ? nf(r.lateH, 1) + ' h' : '—' }, { l: 'Custo', num: 1, f: r => r.cost != null ? money(r.cost) : (r.booking ? (r.cutoffOk ? 'cut-off ok' : '<span style="color:var(--neg)">após cut-off</span>') : '—') }, { l: '', f: r => `<button class="btn pri" data-a="tpPick" data-i="${ps.indexOf(r)}">Selecionar</button>` }], ps), [], true);
}
A.tpPick = d => { const p = U.tpList[+d.i]; U.dlg = null; const r = act(() => T.acceptProposal(p)); if (r && r.id) go('fo', r.id); };
function optDialog() {
  OUT.length = 0; const r = T.optimize([...U.ck.sel]);
  if (!r.tours.length && !r.unplanned.length) return act(() => T.info('Nenhuma etapa rodoviária aberta para otimizar.'));
  U.optRes = r;
  dialog('Resultado do otimizador VSR', `<div class="kpis">${[['Tours', r.kpi.tours], ['Distância', nf(r.kpi.km) + ' km'], ['Custo de planejamento', money(r.kpi.cost)], ['Atraso total', nf(r.kpi.late, 1) + ' h'], ['Não planejadas', r.kpi.unplanned]].map(k => `<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('')}</div>
    <h4>Tours propostos</h4>${table([{ l: '#', f: x => r.tours.indexOf(x) + 1 }, { l: 'Veículo', f: x => esc(x.mtr + ' · ' + x.resource) }, { l: 'Rota', f: x => esc(x.stops.map(s => T.loc(s).city).join(' → ')) }, { l: 'UFs', f: x => x.keys.map(k => k.split('#')[0]).join(', ') }, { l: 'km', num: 1, f: x => nf(x.km) }, { l: 'Custo', num: 1, f: x => money(x.cost) }, { l: 'Atraso', num: 1, f: x => x.lateH ? nf(x.lateH, 1) + ' h' : '—' }], r.tours)}
    ${r.unplanned.length ? `<h4>Etapas não planejadas</h4>${table([{ l: 'Etapa', f: x => esc(x.key) }, { l: 'Motivo', f: x => esc(x.reason) }], r.unplanned)}` : ''}
    <h4>Ferramenta de explicação (cap. 5.8.6)</h4><ol class="small muted" style="padding-left:18px">${r.log.map(l => `<li>${esc(l)}</li>`).join('')}</ol>`, [{ l: 'Aceitar plano', cls: 'pri', fn: () => { U.dlg = null; U.ck.sel.clear(); act(() => T.acceptPlan(U.optRes)); } }], true);
}
function mdEdit(app, id) {
  const M = MD[app]; const rec = id ? S.md[M.coll].find(x => x[M.key] === id) : null;
  dialog((rec ? 'Editar ' : 'Criar ') + M.one, mdForm(app, rec), [{ l: 'Gravar', cls: 'pri', fn: () => {
    const { out, errs } = readMD(app, rec);
    if (errs.length) return toast('Preencha: ' + errs.join(', '), 'E');
    if (!rec && S.md[M.coll].some(x => x[M.key] === out[M.key])) return toast('Já existe um registro com esse ID.', 'E');
    U.dlg = null;
    act(() => { if (rec) Object.assign(rec, out); else S.md[M.coll].push(out); T.ok(`${M.title}: ${out[M.key]} ${rec ? 'alterado' : 'criado'}.`); });
  } }], true);
}

/* ---------------- listeners ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (U.menu && !e.target.closest('.menu')) { U.menu = null; if (!el) { render(); return; } }
  if (U.pop && !e.target.closest('.pop') && !(el && el.dataset.a === 'pop')) { U.pop = false; if (!el) { render(); return; } }
  if (!el) return;
  if (el.tagName === 'TR' && e.target.closest('input,button,select,a,.lnk')) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  fn(el.dataset, el, e);
});
document.addEventListener('change', e => {
  const el = e.target; const c = el.dataset && el.dataset.c; if (!c) return;
  if (c === 'filter') { U.f[U.app] = U.f[U.app] || {}; U.f[U.app][el.dataset.k] = el.value; render(); }
  if (c === 'rf') {
    const F = U.form; const k = el.id.replace('rf_', ''); readReqForm();
    if (k === 'consignee') { const b = T.bp(el.value); if (b && b.loc) F.dst = b.loc; }
    if (k === 'orderingParty') { const b = T.bp(el.value); if (b && b.loc) F.src = b.loc; }
    if (k === 'mode') F.movement = 'DD';
    render();
  }
  if (c === 'ck') { const C0 = U.ck; if (el.id === 'ck_mode') { C0.mode = el.value; C0.sel.clear(); C0.doc = null; } if (el.id === 'ck_zone') C0.zone = el.value; if (el.id === 'ck_planned') C0.showPlanned = el.value === '1'; render(); }
  if (c === 'portal') { U.portalCarrier = el.value; render(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (U.dlg) closeDlg(); else if (U.menu || U.pop) { U.menu = null; U.pop = false; render(); } }
  if (e.key === 'Enter' && e.target.id === 'gsearch') {
    const q = e.target.value.trim(); if (!q) return;
    if (/^\d{8,10}$/.test(q)) { const a = docApp(q); const exists = a && ({ fwo: T.fwo, fwq: T.fwq, otr: T.otr, fu: T.fu, fo: T.fo, fsd: T.fsd, fwsd: T.fwsd, rfq: T.rfq }[a])(q); if (exists) return openDoc(q); return toast('Documento ' + q + ' não encontrado.', 'E'); }
    const hit = Object.entries(APPS).find(([k, v]) => (v[0] + ' ' + v[1]).toLowerCase().includes(q.toLowerCase())); if (hit) go(hit[0]); else toast('Nada encontrado para “' + q + '”.', 'W');
  }
});

/* ---------------- inicialização ---------------- */
(function init() {
  try { const t = localStorage.getItem('sap-tm-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) { }
  const had = load();
  if (!had) save();
  render();
  setTimeout(connectDB, 50);
})();
