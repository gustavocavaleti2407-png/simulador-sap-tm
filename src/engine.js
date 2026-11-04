/* ==========================================================================
   Motor de regras do simulador SAP TM
   Objetos: FWQ, FWO, OTR/DTR, UF (freight unit), OF (freight order), BF (freight booking),
            RFQ de frete (tendering), DLF (freight settlement), DLE (forwarding settlement)
   ========================================================================== */
let S = null;               // estado global
const OUT = [];             // mensagens do último comando (S/W/E/I)

const T = {
  m(type, text, ref) { OUT.push({ type, text, ref: ref || null }); if (S) { S.log.unshift({ type, text, ref: ref || null, at: S.clock }); if (S.log.length > 400) S.log.length = 400; } },
  ok(t, r) { T.m('S', t, r); }, warn(t, r) { T.m('W', t, r); }, err(t, r) { T.m('E', t, r); }, info(t, r) { T.m('I', t, r); },

  /* ---------- utilitários ---------- */
  nextId(kind) {
    const base = { FWQ: 1200000000, FWO: 1100000000, OTR: 3100000000, DTR: 8000000000, FU: 4100000000, FO: 6100000000, FB: 6200000000, RFQ: 4600000000, FSD: 7100000000, FWSD: 8100000000, PO: 4500000000, SES: 1000000000, INV: 5105600000, BIL: 90000000, SO: 12000 };
    S.seq[kind] = (S.seq[kind] || base[kind]) + 1;
    return String(S.seq[kind]);
  },
  now() { return new Date(S.clock); },
  iso(d) { const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; },
  addH(iso, h) { const d = new Date(iso); d.setTime(d.getTime() + h * 3600000); return T.iso(d); },
  maxIso(a, b) { return a > b ? a : b; },
  hoursBetween(a, b) { return (new Date(b) - new Date(a)) / 3600000; },
  advanceClock(h) { S.clock = T.addH(S.clock, h); T.info(`Data do sistema avançada para ${S.clock.replace('T', ' ')}`); T.expireRFQs(); },
  setClock(iso) { S.clock = iso; },
  round2: n => Math.round(n * 100) / 100,

  bp: id => S.md.bps.find(b => b.id === id),
  loc: id => S.md.locs.find(l => l.id === id),
  prod: id => S.md.products.find(p => p.id === id),
  mtr: id => S.md.mtrs.find(m => m.id === id),
  res: id => S.md.resources.find(r => r.id === id),
  zone: id => S.md.zones.find(z => z.id === id),
  table: id => S.md.rateTables.find(t => t.id === id),
  agr: id => S.md.agreements.find(a => a.id === id),
  sched: id => S.md.schedules.find(s => s.id === id),
  fwo: id => S.fwo.find(x => x.id === id),
  fwq: id => S.fwq.find(x => x.id === id),
  otr: id => S.otr.find(x => x.id === id),
  fu: id => S.fu.find(x => x.id === id),
  fo: id => S.fo.find(x => x.id === id),
  fsd: id => S.fsd.find(x => x.id === id),
  fwsd: id => S.fwsd.find(x => x.id === id),
  rfq: id => S.rfq.find(x => x.id === id),
  req(r) { return r.type === 'FWO' ? T.fwo(r.id) : T.otr(r.id); },
  bpName: id => (T.bp(id) || {}).name || id || '—',
  locName: id => (T.loc(id) || {}).name || id || '—',
  modeName: m => ({ RD: 'Rodoviário', SEA: 'Marítimo', AIR: 'Aéreo' }[m] || m),

  zonesOf(locId) { return S.md.zones.filter(z => z.locs.includes(locId)).map(z => z.id); },
  inArea(locId, area) { if (!area || area === '*') return true; if (area === locId) return true; const z = T.zone(area); return !!(z && z.locs.includes(locId)); },
  hav(a, b) {
    const A = T.loc(a), B = T.loc(b); if (!A || !B) return 0;
    const R = 6371, rad = x => x * Math.PI / 180;
    const dLat = rad(B.lat - A.lat), dLon = rad(B.lon - A.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(A.lat)) * Math.cos(rad(B.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  },
  km(a, b, mode = 'RD') { if (a === b) return 0; const f = { RD: 1.25, SEA: 1.22, AIR: 1.05 }[mode] || 1.25; return Math.round(T.hav(a, b) * f); },
  lanesFor(from, to, mode) { return S.md.lanes.filter(l => l.mode === mode && T.inArea(from, l.from) && T.inArea(to, l.to)); },

  /* ---------- medidas ---------- */
  itemMeasures(productId, qty) {
    const p = T.prod(productId); if (!p) return { kg: 0, m3: 0, pal: 0, value: 0 };
    return { kg: T.round2(p.kg * qty), m3: T.round2(p.m3 * qty), pal: T.round2(qty / p.perPal), value: T.round2(p.value * qty) };
  },
  sumMeasures(list) { return list.reduce((a, i) => ({ kg: T.round2(a.kg + (i.kg || 0)), m3: T.round2(a.m3 + (i.m3 || 0)), pal: T.round2(a.pal + (i.pal || 0)), value: T.round2(a.value + (i.value || 0)) }), { kg: 0, m3: 0, pal: 0, value: 0 }); },
  traitsOfItems(items) {
    const t = new Set();
    items.forEach(i => { const p = T.prod(i.product); if (!p) return; t.add('grp:' + p.group); if (p.dg) t.add('dg:' + p.dg.cls); });
    return [...t];
  },
  incompatible(traitsA, traitsB) {
    for (const r of S.md.settings.incompat) {
      if ((traitsA.includes(r.a) && traitsB.includes(r.b)) || (traitsA.includes(r.b) && traitsB.includes(r.a))) return r;
    }
    return null;
  },

  /* ==========================================================================
     Requisitos de transporte: FWQ / FWO / OTR
     ========================================================================== */
  buildStages(doc, quiet) {
    const mode = doc.mode;
    if (mode === 'RD') return [{ n: 1, type: 'Direto', from: doc.src, to: doc.dst, mode: 'RD' }];
    const dst = T.loc(doc.dst);
    const route = S.md.defaultRoutes.find(r => r.mode === mode && r.destCountry === (dst && dst.country));
    if (!route) { if (!quiet) T.err(`Nenhuma rota padrão (${T.modeName(mode)}) para o país ${dst && dst.country}. Verifique Dados mestres › Rotas padrão.`); return null; }
    const st = []; let n = 1;
    const mv = doc.movement || 'DD';
    if (mv === 'PP') return [{ n: 1, type: 'Transporte principal', from: route.originGw, to: route.destGw, mode }];
    if (doc.src !== route.originGw) st.push({ n: n++, type: 'Pré-transporte', from: doc.src, to: route.originGw, mode: 'RD' });
    st.push({ n: n++, type: 'Transporte principal', from: route.originGw, to: route.destGw, mode });
    if (mv === 'DD' && doc.dst !== route.destGw) st.push({ n: n++, type: 'Pós-transporte', from: route.destGw, to: doc.dst, mode: 'RD' });
    return st;
  },

  normalizeItems(items) {
    return items.filter(i => i.product && +i.qty > 0).map((i, k) => ({ n: (k + 1) * 10, product: i.product, qty: +i.qty, ...T.itemMeasures(i.product, +i.qty) }));
  },

  checkDoc(doc, kindLabel) {
    let errors = 0;
    [...new Set(['orderingParty', 'shipper', 'consignee'].map(r => doc[r]))].forEach(id => {
      const b = T.bp(id); if (b && b.sanctioned) { T.err(`${kindLabel} ${doc.id}: parceiro ${b.id} ${b.name} consta em lista de partes sancionadas (SPL). Documento bloqueado.`, doc.id); errors++; doc.block = 'Bloqueio de conformidade (SPL)'; S.flags.splBlocked = true; }
    });
    doc.items.forEach(i => {
      const p = T.prod(i.product); if (!p || !p.dg) return;
      if (doc.mode === 'AIR' && p.dg.cls.startsWith('1')) { T.err(`Produto perigoso ${p.dg.un} (classe ${p.dg.cls}) não permitido no modal aéreo.`, doc.id); errors++; doc.block = doc.block || 'Bloqueio produto perigoso'; }
      else T.warn(`Item ${i.n}: produto perigoso ${p.dg.un} classe ${p.dg.cls} – exige documentação ${doc.mode === 'SEA' ? 'IMDG' : doc.mode === 'AIR' ? 'IATA DGR' : 'ADR/ANTT'}.`, doc.id);
    });
    if (doc.delivery < doc.pickup) { T.err('Data de entrega anterior à data de coleta.', doc.id); errors++; }
    const st = T.buildStages(doc); if (!st) errors++;
    if (!errors) { doc.block = null; T.ok(`${kindLabel} ${doc.id}: verificação concluída sem erros.`, doc.id); }
    return errors === 0;
  },

  createFWO(d) {
    const items = T.normalizeItems(d.items || []);
    if (!d.orderingParty || !d.src || !d.dst) { T.err('Preencha parte solicitante, local de origem e de destino.'); return null; }
    if (!items.length) { T.err('Inclua pelo menos um item com quantidade.'); return null; }
    const typeByMode = { RD: 'ZFWO', SEA: 'ZFWS', AIR: 'ZFWA' };
    const fwo = {
      id: T.nextId('FWO'), type: typeByMode[d.mode || 'RD'], mode: d.mode || 'RD', movement: d.movement || 'DD',
      salesOrg: S.md.org.salesOrg, orderingParty: d.orderingParty, shipper: d.shipper || d.orderingParty, consignee: d.consignee || '',
      src: d.src, dst: d.dst, pickup: d.pickup, delivery: d.delivery, incoterm: d.incoterm || 'CIF', ref: d.ref || '',
      items, stages: [], fus: [], charges: null, block: null, life: 'Novo', inv: 'Não faturado', fwsd: null,
      createdAt: S.clock, notes: d.notes || ''
    };
    fwo.stages = T.buildStages(fwo) || [];
    S.fwo.unshift(fwo);
    T.ok(`Ordem de expedição ${fwo.id} criada (tipo ${fwo.type}).`, fwo.id);
    T.checkDoc(fwo, 'OE');
    if (S.md.settings.fubr.autoBuild && !fwo.block) T.buildFUs([{ type: 'FWO', id: fwo.id }]);
    return fwo;
  },

  createFWQ(d) {
    const items = T.normalizeItems(d.items || []);
    if (!d.orderingParty || !d.src || !d.dst || !items.length) { T.err('Cotação incompleta: parte solicitante, origem, destino e itens são obrigatórios.'); return null; }
    const q = { id: T.nextId('FWQ'), mode: d.mode || 'RD', movement: d.movement || 'DD', orderingParty: d.orderingParty, shipper: d.orderingParty, consignee: d.consignee || '',
      src: d.src, dst: d.dst, pickup: d.pickup, delivery: d.delivery, validTo: d.validTo || T.addH(S.clock, 24 * 14).slice(0, 10), items, stages: [], charges: null, status: 'Em processamento', fwo: null, createdAt: S.clock };
    q.stages = T.buildStages(q) || [];
    S.fwq.unshift(q);
    T.ok(`Cotação de expedição ${q.id} criada.`, q.id);
    T.calcCharges(q, 'FWQ');
    return q;
  },
  fwqSubmit(id) { const q = T.fwq(id); if (!q.charges) { T.err('Calcule os encargos antes de enviar a cotação.'); return; } q.status = 'Enviada ao cliente'; T.ok(`Cotação ${id} enviada ao cliente (${T.fmtMoney(q.charges.total)}).`, id); },
  fwqRespond(id, accept) { const q = T.fwq(id); if (q.status !== 'Enviada ao cliente') { T.err('A cotação precisa estar com status "Enviada ao cliente".'); return; } q.status = accept ? 'Aceita' : 'Rejeitada'; T[accept ? 'ok' : 'warn'](`Cliente ${accept ? 'aceitou' : 'rejeitou'} a cotação ${id}.`, id); },
  fwoFromFWQ(id) {
    const q = T.fwq(id); if (q.status !== 'Aceita') { T.err('Somente cotações aceitas podem gerar ordem de expedição (cap. 4.2.4).'); return null; }
    if (q.fwo) { T.err(`A cotação já gerou a OE ${q.fwo}.`); return null; }
    const fwo = T.createFWO({ ...q, items: q.items.map(i => ({ product: i.product, qty: i.qty })), ref: 'FWQ ' + q.id });
    if (fwo) { q.fwo = fwo.id; q.status = 'Convertida em OE'; fwo.quote = q.id; if (q.charges) { fwo.charges = JSON.parse(JSON.stringify(q.charges)); fwo.charges.log.push('Encargos copiados da cotação ' + q.id); } }
    return fwo;
  },

  createSalesOrder(d) {
    const items = T.normalizeItems(d.items || []);
    if (!d.soldTo || !d.src || !d.dst || !items.length) { T.err('Pedido de venda incompleto.'); return null; }
    const so = '00000' + T.nextId('SO');
    const otr = { id: T.nextId('OTR'), so, soldTo: d.soldTo, orderingParty: d.soldTo, shipper: d.soldTo, consignee: d.consignee || '', src: d.src, dst: d.dst, pickup: d.pickup, delivery: d.delivery,
      mode: 'RD', movement: 'DD', items, stages: [], fus: [], life: 'Novo', dtr: null, delivDoc: null, createdAt: S.clock };
    otr.stages = T.buildStages(otr);
    S.otr.unshift(otr);
    T.ok(`Pedido de venda ${so} gravado no SAP S/4HANA (SD). Requisito de transporte baseado em ordem (OTR) ${otr.id} criado automaticamente.`, otr.id);
    T.checkDoc(otr, 'OTR');
    return otr;
  },
  createDelivery(otrId) {
    const o = T.otr(otrId);
    if (!o.fus.length) { T.err('Crie e planeje as unidades de frete antes de gerar a entrega.'); return; }
    if (T.reqPlanStatus(o) !== 'Planejado') { T.err('Proposta de entrega exige OTR totalmente planejado (cap. 4.1.4).'); return; }
    if (o.dtr) { T.err('Entrega já criada.'); return; }
    o.delivDoc = T.nextId('DTR'); o.dtr = 'DTR-' + o.delivDoc; o.life = 'Entrega criada';
    T.ok(`Proposta de entrega enviada ao SD: entrega de saída ${o.delivDoc} criada. DTR ${o.dtr} consome o resultado do planejamento do OTR.`, o.id);
  },

  /* ==========================================================================
     Unidades de frete — regra de criação de UF (FUBR), cap. 5.2
     ========================================================================== */
  buildFUs(reqRefs) {
    const rule = S.md.settings.fubr;
    const reqs = reqRefs.map(r => ({ ref: r, doc: T.req(r) })).filter(x => x.doc);
    const valid = [];
    for (const x of reqs) {
      if (x.doc.block) { T.err(`${x.ref.id}: documento bloqueado (${x.doc.block}). Criação de UF não permitida.`, x.ref.id); continue; }
      if (x.doc.fus.length) { T.err(`${x.ref.id}: já possui unidades de frete. Exclua-as para recriar.`, x.ref.id); continue; }
      if (!x.doc.stages.length) { T.err(`${x.ref.id}: sem etapas válidas.`, x.ref.id); continue; }
      valid.push(x);
    }
    if (!valid.length) return [];
    // agrupamento de requisitos (estratégia "consolidar o máximo possível")
    const pools = [];
    if (rule.strategy === 'MAX') {
      valid.forEach(x => {
        const d = x.doc; const key = [d.src, d.dst, d.pickup, d.mode, d.incoterm || ''].join('|');
        let p = pools.find(p => p.key === key); if (!p) { p = { key, list: [] }; pools.push(p); }
        p.list.push(x);
      });
    } else valid.forEach(x => pools.push({ key: x.ref.id, list: [x] }));

    const created = [];
    for (const pool of pools) {
      const head = pool.list[0].doc;
      let pieces = [];
      pool.list.forEach(x => x.doc.items.forEach(i => pieces.push({ req: x.ref, item: i.n, product: i.product, qty: i.qty })));
      // grupos compatíveis
      let groups = [];
      if (rule.strategy === 'ITEM') groups = pieces.map(p => [p]);
      else {
        pieces.forEach(p => {
          const tr = T.traitsOfItems([p]);
          let g = groups.find(g => !T.incompatible(T.traitsOfItems(g), tr));
          if (!g) { g = []; groups.push(g); }
          g.push(p);
        });
        if (groups.length > 1) T.info(`Incompatibilidade na criação de UF: itens separados em ${groups.length} grupos (${pool.list.map(x => x.ref.id).join(', ')}).`);
      }
      for (const g of groups) {
        const crit = rule.critical || 'kg';
        const per = p => { const pr = T.prod(p.product); return crit === 'm3' ? pr.m3 : crit === 'pal' ? 1 / pr.perPal : pr.kg; };
        g.sort((a, b) => per(b) * b.qty - per(a) * a.qty);
        let cur = null; const fus = [];
        const open = () => { cur = { items: [], kg: 0, m3: 0, pal: 0 }; fus.push(cur); };
        open();
        for (const p of g) {
          const pr = T.prod(p.product); let left = p.qty;
          while (left > 0) {
            const remKg = rule.splitKg - cur.kg, remM3 = rule.splitM3 - cur.m3, remPal = rule.splitPal - cur.pal;
            const fit = Math.floor(Math.min(remKg / pr.kg, remM3 / pr.m3, remPal * pr.perPal) + 1e-9);
            if (fit <= 0) { if (!cur.items.length) { T.err(`Item ${p.item}: uma unidade de ${pr.desc} excede a quantidade de divisão da FUBR.`); left = 0; break; } open(); continue; }
            const q = Math.min(fit, left);
            const m = T.itemMeasures(p.product, q);
            cur.items.push({ req: p.req, item: p.item, product: p.product, qty: q, ...m });
            cur.kg = T.round2(cur.kg + m.kg); cur.m3 = T.round2(cur.m3 + m.m3); cur.pal = T.round2(cur.pal + m.pal);
            left -= q;
          }
        }
        fus.filter(f => f.items.length).forEach(f => {
          const meas = T.sumMeasures(f.items);
          const fu = {
            id: T.nextId('FU'), type: 'ZFU1', rule: rule.id, splitKg: rule.splitKg, reqs: [...new Map(f.items.map(i => [i.req.id, i.req])).values()],
            items: f.items, ...meas, src: head.src, dst: head.dst, pickup: head.pickup, delivery: head.delivery, mode: head.mode,
            stages: head.stages.map(s => ({ ...s, fo: null, handling: 'Não determinado', exec: 'Não iniciado' })),
            traits: T.traitsOfItems(f.items), exec: 'Não iniciado', discrepancies: [], createdAt: S.clock
          };
          S.fu.unshift(fu); created.push(fu);
          fu.reqs.forEach(r => { const d = T.req(r); if (d && !d.fus.includes(fu.id)) d.fus.push(fu.id); });
        });
      }
      pool.list.forEach(x => { x.doc.life = 'Em processamento'; });
    }
    T.ok(`${created.length} unidade(s) de frete criada(s) com a regra ${rule.id} (estratégia ${({ REQ: 'consolidar por requisito', ITEM: 'por item', MAX: 'consolidar o máximo possível' })[rule.strategy]}, divisão em ${rule.splitKg.toLocaleString('pt-BR')} kg).`);
    return created;
  },
  deleteFUs(ref) {
    const d = T.req(ref);
    const fus = d.fus.map(T.fu);
    if (fus.some(f => f.stages.some(s => s.fo))) { T.err('Existem UFs planejadas. Desatribua-as das ordens de frete antes de excluir.'); return; }
    S.fu = S.fu.filter(f => !d.fus.includes(f.id)); d.fus = []; d.life = 'Novo';
    T.ok(`Unidades de frete de ${ref.id} excluídas.`);
  },

  fuPlanStatus(fu) { const n = fu.stages.filter(s => s.fo).length; return n === 0 ? 'Não planejado' : n === fu.stages.length ? 'Planejado' : 'Parcialmente planejado'; },
  reqPlanStatus(d) {
    if (!d.fus.length) return 'UFs não criadas';
    const st = d.fus.map(id => T.fuPlanStatus(T.fu(id)));
    if (st.every(s => s === 'Planejado')) return 'Planejado';
    if (st.every(s => s === 'Não planejado')) return 'Não planejado';
    return 'Parcialmente planejado';
  },
  reqExecStatus(d) {
    if (!d.fus.length) return 'Não iniciado';
    const st = d.fus.map(id => T.fu(id).exec);
    if (st.every(s => s === 'Executado')) return 'Executado';
    if (st.some(s => s !== 'Não iniciado')) return 'Em execução';
    return 'Não iniciado';
  },
  refreshFU(fu) {
    const ex = fu.stages.map(s => s.exec);
    fu.exec = ex.every(e => e === 'Executado') ? 'Executado' : ex.some(e => e !== 'Não iniciado') ? 'Em execução' : 'Não iniciado';
    fu.reqs.forEach(r => { const d = T.req(r); if (!d) return; if (T.reqExecStatus(d) === 'Executado' && d.life !== 'Concluído') { d.life = 'Concluído'; T.ok(`${r.type} ${d.id}: todas as UFs executadas. Status de ciclo de vida: Concluído.`, d.id); } });
  },

  /* ==========================================================================
     Planejamento — rotas, OF, bookings, otimizador (cap. 5.7 / 5.8)
     ========================================================================== */
  stageOf(key) { const [fuId, n] = key.split('#'); const fu = T.fu(fuId); if (!fu) return null; const st = fu.stages.find(s => s.n === +n); return st ? { fu, st, key } : null; },
  openStages(mode) {
    const out = [];
    S.fu.forEach(fu => fu.stages.forEach(st => { if (!st.fo && (!mode || st.mode === mode)) out.push({ key: fu.id + '#' + st.n, fu, st }); }));
    return out;
  },
  stageReady(fu, st) {
    // data mais cedo para iniciar a etapa: coleta da UF ou chegada da etapa anterior
    const prev = fu.stages.find(s => s.n === st.n - 1);
    if (prev && prev.fo) { const fo = T.fo(prev.fo); const stop = fo && fo.stops.find(x => x.loc === prev.to); if (stop) return stop.planArr; }
    return fu.pickup + 'T' + String(S.md.settings.planning.startHour).padStart(2, '0') + ':00';
  },
  stageDeadline(fu, st) {
    const next = fu.stages.find(s => s.n === st.n + 1);
    if (next && next.fo) { const fb = T.fo(next.fo); if (fb && fb.cat === 'FB') return fb.cutoff; }
    if (!next) return fu.delivery + 'T23:59';
    return null;
  },
  route(entries, mtrId, startMin) {
    const mt = T.mtr(mtrId); const P = S.md.settings.planning;
    const picks = [...new Set(entries.map(e => e.st.from))];
    const drops = [...new Set(entries.map(e => e.st.to))];
    const readyOf = loc => entries.filter(e => e.st.from === loc).map(e => T.stageReady(e.fu, e.st)).sort()[0];
    picks.sort((a, b) => readyOf(a) < readyOf(b) ? -1 : 1);
    const nn = (start, list) => { const out = []; let cur = start; const rest = [...list]; while (rest.length) { rest.sort((a, b) => T.km(cur, a) - T.km(cur, b)); cur = rest.shift(); out.push(cur); } return out; };
    const orderP = picks.length ? [picks[0], ...nn(picks[0], picks.slice(1))] : [];
    const orderD = nn(orderP[orderP.length - 1], drops.filter(d => !picks.includes(d) || true));
    const seq = [...orderP.map(l => ({ loc: l, kind: 'P' })), ...orderD.map(l => ({ loc: l, kind: 'D' }))];
    let t = T.maxIso(readyOf(orderP[0]), startMin || S.clock);
    let km = 0; const stops = [];
    seq.forEach((s, i) => {
      if (i > 0) { const d = T.km(seq[i - 1].loc, s.loc, mt.mode); km += d; t = T.addH(t, d / mt.speed); }
      if (s.kind === 'P') { const r = readyOf(s.loc); if (r > t) t = r; }
      const arr = t; t = T.addH(t, P.handlingH);
      stops.push({ loc: s.loc, planArr: arr, planDep: t, load: s.kind === 'P' ? entries.filter(e => e.st.from === s.loc).map(e => e.key) : [], unload: s.kind === 'D' ? entries.filter(e => e.st.to === s.loc).map(e => e.key) : [], actArr: null, actDep: null });
    });
    let lateH = 0; const lateList = [];
    entries.forEach(e => { const dl = T.stageDeadline(e.fu, e.st); const stop = stops.find(s => s.unload.includes(e.key)); if (dl && stop && stop.planArr > dl) { const h = T.hoursBetween(dl, stop.planArr); lateH += h; lateList.push({ key: e.key, h }); } });
    return { stops, km, lateH: T.round2(lateH), lateList };
  },
  loadOf(entries) { return T.sumMeasures(entries.map(e => ({ kg: e.fu.kg, m3: e.fu.m3, pal: e.fu.pal, value: e.fu.value }))); },
  fits(load, mt) { return load.kg <= mt.capKg + 1e-6 && load.m3 <= mt.capM3 + 1e-6 && load.pal <= mt.capPal + 1e-6; },
  traitsOfEntries(entries) { return [...new Set(entries.flatMap(e => e.fu.traits))]; },
  entriesCompatible(entries) {
    for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) { const r = T.incompatible(entries[i].fu.traits, entries[j].fu.traits); if (r) return r; }
    return null;
  },
  planCost(mtrId, km, lateH) { const mt = T.mtr(mtrId); const P = S.md.settings.planning; return T.round2(P.wFix * mt.costFix + P.wKm * mt.costKm * km + P.wLate * lateH); },
  resourceUse(resId, dateStr, excludeFo) { return S.fo.filter(f => f.cat === 'FO' && f.resource === resId && f.id !== excludeFo && f.stops[0] && f.stops[0].planArr.slice(0, 10) === dateStr && f.life !== 'Cancelado').length; },

  createFO(keys, opts = {}) {
    const entries = keys.map(T.stageOf).filter(Boolean);
    if (!entries.length) { T.err('Selecione pelo menos uma etapa de unidade de frete.'); return null; }
    if (entries.some(e => e.st.fo)) { T.err('Uma das etapas já está planejada.'); return null; }
    if (entries.some(e => e.st.mode !== 'RD')) { T.err('Etapas marítimas/aéreas são planejadas em bookings de frete (cap. 6.2).'); return null; }
    const res = opts.resource ? T.res(opts.resource) : null;
    const mtrId = res ? res.mtr : (opts.mtr || 'CARRETA'); const mt = T.mtr(mtrId);
    const load = T.loadOf(entries);
    if (!T.fits(load, mt)) { T.err(`Capacidade excedida para ${mt.id}: ${load.kg.toLocaleString('pt-BR')} kg / ${load.m3} m³ / ${Math.ceil(load.pal)} pal (máx. ${mt.capKg.toLocaleString('pt-BR')} kg / ${mt.capM3} m³ / ${mt.capPal} pal).`); return null; }
    const inc = T.entriesCompatible(entries); if (inc) { S.flags.incompatHit = true; T.err(`Incompatibilidade: ${inc.desc}. As UFs não podem ser consolidadas na mesma OF (cap. 2.3.2).`); return null; }
    const r = T.route(entries, mtrId);
    if (r.stops.length > S.md.settings.planning.maxStops + 1 && !opts.force) T.warn(`Rota com ${r.stops.length} paradas excede o máximo do perfil de planejamento (${S.md.settings.planning.maxStops}).`);
    if (res) { const used = T.resourceUse(res.id, r.stops[0].planArr.slice(0, 10)); if (used >= res.qty) { T.err(`Recurso ${res.id} sem disponibilidade em ${r.stops[0].planArr.slice(0, 10)} (${used}/${res.qty} em uso).`); return null; } }
    const fo = {
      id: T.nextId('FO'), cat: 'FO', type: 'ZFOR', mode: 'RD', mtr: mtrId, resource: res ? res.id : null, purchOrg: S.md.org.purchOrg,
      carrier: null, subcontract: opts.subcontract !== false, stages: entries.map(e => e.key), stops: r.stops, km: r.km, lateH: r.lateH,
      ...load, planCost: T.planCost(mtrId, r.km, r.lateH), sub: { status: 'Não iniciado', tender: null }, life: 'Novo', exec: 'Não iniciado',
      fixed: false, charges: null, events: [], fsd: null, inv: 'Não liquidado', createdAt: S.clock, origin: opts.origin || 'Manual'
    };
    entries.forEach(e => { e.st.fo = fo.id; e.st.handling = 'Não carregado'; });
    S.fo.unshift(fo);
    T.ok(`Ordem de frete ${fo.id} criada (${mt.desc}, ${r.km} km, ${r.stops.length} paradas).`, fo.id);
    if (r.lateH > 0) T.warn(`OF ${fo.id}: entrega prevista com atraso de ${r.lateH.toFixed(1)} h em relação à data solicitada.`, fo.id);
    if (opts.carrier) T.assignCarrier(fo.id, opts.carrier, 'Proposta de transporte');
    return fo;
  },
  recomputeFO(fo) {
    if (fo.cat === 'FB') { const L = T.loadOf(fo.stages.map(T.stageOf).filter(Boolean)); Object.assign(fo, L); return; }
    const entries = fo.stages.map(T.stageOf).filter(Boolean);
    if (!entries.length) return;
    const r = T.route(entries, fo.mtr, fo.stops[0] && fo.events.length ? fo.stops[0].planArr : null);
    fo.stops = r.stops; fo.km = r.km; fo.lateH = r.lateH; Object.assign(fo, T.loadOf(entries)); fo.planCost = T.planCost(fo.mtr, r.km, r.lateH);
    if (fo.charges) { fo.charges = null; T.warn(`OF ${fo.id}: plano alterado – encargos precisam ser recalculados.`, fo.id); }
  },
  assignToFO(foId, keys) {
    const fo = T.fo(foId); if (!fo) return;
    if (fo.fixed) { T.err(`Documento ${fo.id} está fixado. Desfixe para alterar o plano.`); return; }
    if (fo.exec !== 'Não iniciado' && fo.exec !== 'Pronto p/ execução') { T.err('Documento já em execução.'); return; }
    if (fo.cat === 'FB') return T.assignToBooking(foId, keys);
    const entries = keys.map(T.stageOf).filter(e => e && !e.st.fo);
    if (!entries.length) { T.err('Nenhuma etapa não planejada selecionada.'); return; }
    if (entries.some(e => e.st.mode !== 'RD')) { T.err('Somente etapas rodoviárias podem ser atribuídas a ordens de frete rodoviárias.'); return; }
    const all = [...fo.stages.map(T.stageOf), ...entries];
    const mt = T.mtr(fo.mtr); const load = T.loadOf(all);
    if (!T.fits(load, mt)) { T.err(`Capacidade de ${mt.id} excedida (${load.kg.toLocaleString('pt-BR')} kg / ${Math.ceil(load.pal)} pal).`); return; }
    const inc = T.entriesCompatible(all); if (inc) { S.flags.incompatHit = true; T.err(`Incompatibilidade: ${inc.desc}.`); return; }
    entries.forEach(e => { e.st.fo = fo.id; e.st.handling = 'Não carregado'; fo.stages.push(e.key); });
    T.recomputeFO(fo);
    if (fo.sub.status === 'Confirmado' || fo.sub.status === 'Enviado') { fo.sub.status = 'Transportadora atribuída'; T.warn(`OF ${fo.id} alterada após envio – reenvie para a transportadora.`, fo.id); }
    T.ok(`${entries.length} etapa(s) atribuída(s) à OF ${fo.id}. Rota recalculada: ${fo.km} km.`, fo.id);
  },
  unassign(foId, keys) {
    const fo = T.fo(foId); if (!fo) return;
    if (fo.fixed) { T.err(`Documento ${fo.id} está fixado.`); return; }
    if (fo.events.length) { T.err('Não é possível desatribuir: já existem eventos de execução.'); return; }
    if (fo.fsd) { T.err('Documento já possui liquidação de frete.'); return; }
    const ks = keys && keys.length ? keys : [...fo.stages];
    ks.forEach(k => { const e = T.stageOf(k); if (e && e.st.fo === fo.id) { e.st.fo = null; e.st.handling = 'Não determinado'; } });
    fo.stages = fo.stages.filter(k => !ks.includes(k));
    if (!fo.stages.length && fo.cat === 'FO') { S.fo = S.fo.filter(f => f.id !== fo.id); S.rfq = S.rfq.filter(r => r.fo !== fo.id); T.ok(`Todas as UFs desatribuídas; OF ${fo.id} excluída.`); return; }
    T.recomputeFO(fo);
    T.ok(`${ks.length} etapa(s) desatribuída(s) de ${fo.id}.`, fo.id);
  },
  toggleFix(foId) { const fo = T.fo(foId); fo.fixed = !fo.fixed; T.ok(`${fo.id} ${fo.fixed ? 'fixado – o otimizador e alterações manuais não modificam mais o plano' : 'desfixado'}.`, fo.id); },
  cancelFO(foId) {
    const fo = T.fo(foId);
    if (fo.events.length || fo.fsd) { T.err('Documento com execução ou liquidação não pode ser cancelado.'); return; }
    fo.stages.forEach(k => { const e = T.stageOf(k); if (e) { e.st.fo = null; e.st.handling = 'Não determinado'; } });
    fo.stages = []; fo.life = 'Cancelado'; fo.sub.status = fo.carrier ? 'Cancelado' : fo.sub.status;
    S.rfq.filter(r => r.fo === fo.id && r.status === 'Aberta').forEach(r => r.status = 'Cancelada');
    T.ok(`${fo.cat === 'FB' ? 'Booking' : 'Ordem de frete'} ${fo.id} cancelado(a); UFs liberadas para replanejamento.`, fo.id);
  },

  /* ---------- Bookings (capacidade por programação) cap. 6.2 / 6.4 ---------- */
  createBookingsFromSchedule(schedId, weeks = 4) {
    const sc = T.sched(schedId); const start = new Date(S.clock.slice(0, 10) + 'T00:00'); let n = 0;
    for (let d = 0; d < weeks * 7; d++) {
      const day = new Date(start.getTime() + d * 86400000);
      if (sc.weekday !== -1 && day.getDay() !== sc.weekday) continue;
      if (sc.weekday === -1 && day.getDay() % 2 === 0) continue; // aéreo: voos em dias ímpares da semana (seg/qua/sex)
      day.setHours(sc.depHour, 0, 0, 0);
      const dep = T.iso(day);
      if (dep < S.clock) continue;
      if (S.fo.some(f => f.cat === 'FB' && f.schedule === sc.id && f.stops[0].planDep === dep)) continue;
      const voy = sc.voyagePrefix + (sc.mode === 'SEA' ? String(240 + Math.round(day.getTime() / 6048e5) % 100) + 'S' : String(day.getDate()).padStart(2, '0'));
      const fb = {
        id: T.nextId('FB'), cat: 'FB', type: sc.mode === 'SEA' ? 'ZFBS' : 'ZFBA', mode: sc.mode, schedule: sc.id, carrier: sc.carrier, voyage: voy, mtr: sc.mode === 'SEA' ? 'NAVIO' : 'AVIAO',
        stops: [{ loc: sc.from, planArr: T.addH(dep, -sc.cutoffH), planDep: dep, load: [], unload: [], actArr: null, actDep: null }, { loc: sc.to, planArr: T.addH(dep, sc.transitH), planDep: T.addH(dep, sc.transitH + 24), load: [], unload: [], actArr: null, actDep: null }],
        cutoff: T.addH(dep, -sc.cutoffH), capKg: sc.capKg, capM3: sc.capM3, stages: [], kg: 0, m3: 0, pal: 0, value: 0, km: T.km(sc.from, sc.to, sc.mode),
        subcontract: true, sub: { status: 'Não enviado', tender: null }, life: 'Novo', exec: 'Não iniciado', fixed: false, charges: null, events: [], fsd: null, inv: 'Não liquidado',
        mbl: null, createdAt: S.clock, purchOrg: S.md.org.purchOrg, origin: 'Programação'
      };
      S.fo.unshift(fb); n++;
    }
    T.ok(`${n} booking(s) de frete criado(s) a partir da programação ${sc.id} (${weeks} semanas).`);
    return n;
  },
  assignToBooking(fbId, keys) {
    const fb = T.fo(fbId);
    const entries = keys.map(T.stageOf).filter(e => e && !e.st.fo);
    if (!entries.length) { T.err('Nenhuma etapa não planejada selecionada.'); return; }
    for (const e of entries) {
      if (e.st.mode !== fb.mode) { T.err(`Etapa ${e.key} é ${T.modeName(e.st.mode)}; booking é ${T.modeName(fb.mode)}.`); return; }
      if (e.st.from !== fb.stops[0].loc || e.st.to !== fb.stops[1].loc) { T.err(`Etapa ${e.key} (${e.st.from} → ${e.st.to}) não corresponde à rota do booking (${fb.stops[0].loc} → ${fb.stops[1].loc}).`); return; }
    }
    const all = [...fb.stages.map(T.stageOf), ...entries]; const L = T.loadOf(all);
    if (L.kg > fb.capKg || L.m3 > fb.capM3) { T.err(`Capacidade do booking ${fb.id} excedida (${L.kg.toLocaleString('pt-BR')}/${fb.capKg.toLocaleString('pt-BR')} kg).`); return; }
    entries.forEach(e => {
      const ready = T.stageReady(e.fu, e.st);
      if (ready > fb.cutoff) T.warn(`UF ${e.fu.id}: disponibilidade no porto/aeroporto (${ready.replace('T', ' ')}) após o cut-off ${fb.cutoff.replace('T', ' ')}.`, fb.id);
      if (fb.stops[1].planArr.slice(0, 10) > e.fu.delivery) T.warn(`UF ${e.fu.id}: chegada ${fb.stops[1].planArr.slice(0, 10)} posterior à data de entrega solicitada ${e.fu.delivery}.`, fb.id);
      e.st.fo = fb.id; e.st.handling = 'Não carregado'; fb.stages.push(e.key);
      fb.stops[0].load.push(e.key); fb.stops[1].unload.push(e.key);
    });
    Object.assign(fb, { kg: L.kg, m3: L.m3, pal: L.pal, value: L.value });
    if (fb.charges) { fb.charges = null; }
    T.ok(`${entries.length} etapa(s) atribuída(s) ao booking ${fb.id} (viagem ${fb.voyage}).`, fb.id);
  },
  bookingRequest(fbId) { const fb = T.fo(fbId); if (fb.sub.status !== 'Não enviado' && fb.sub.status !== 'Rejeitado') { T.err('Booking já solicitado.'); return; } fb.sub.status = 'Enviado'; T.ok(`Solicitação de booking ${fb.id} enviada a ${T.bpName(fb.carrier)} (IFTMBF).`, fb.id); },

  /* ---------- Otimizador VSR simplificado (cap. 5.8) ---------- */
  optimize(keys) {
    const P = S.md.settings.planning; const log = [];
    let entries = (keys && keys.length ? keys.map(T.stageOf) : T.openStages('RD')).filter(e => e && !e.st.fo && e.st.mode === 'RD');
    log.push(`Início da otimização: ${entries.length} etapa(s) de UF rodoviárias, perfil ${P.id} (peso custo fixo ${P.wFix}, custo km ${P.wKm}, penalidade atraso ${P.wLate}/h, máx. ${P.maxStops} paradas).`);
    const unplanned = [];
    // pré-checagem de pré-requisitos (etapa anterior precisa estar planejada? não — mas etapa seguinte de booking define deadline)
    const fleets = S.md.resources;
    const mtrsByCap = S.md.mtrs.filter(m => m.mode === 'RD').sort((a, b) => a.capKg - b.capKg);
    const groups = {};
    entries.forEach(e => { (groups[e.st.from] = groups[e.st.from] || []).push(e); });
    const tours = [];
    const availRes = (loc, mtrId, date, pending) => {
      const zs = T.zonesOf(loc);
      return fleets.filter(r => r.mtr === mtrId && (r.home === loc || T.zonesOf(r.home).some(z => zs.includes(z))))
        .find(r => T.resourceUse(r.id, date) + pending.filter(t => t.resource === r.id && t.date === date).length < r.qty);
    };
    const evalTour = (ents, mtrId) => { const r = T.route(ents, mtrId); return { ...r, cost: T.planCost(mtrId, r.km, r.lateH) }; };
    const smallestFit = load => mtrsByCap.find(m => T.fits(load, m));
    for (const origin of Object.keys(groups)) {
      const list = groups[origin].sort((a, b) => a.fu.delivery < b.fu.delivery ? -1 : a.fu.delivery > b.fu.delivery ? 1 : T.km(origin, b.st.to) - T.km(origin, a.st.to));
      log.push(`Origem ${origin}: ${list.length} etapa(s). Ordenação por data de entrega e distância.`);
      const local = [];
      for (const e of list) {
        if (!smallestFit(T.loadOf([e]))) { unplanned.push({ key: e.key, reason: `UF excede a capacidade de todos os meios de transporte (${e.fu.kg.toLocaleString('pt-BR')} kg).` }); continue; }
        let best = null;
        for (const t of local) {
          const ents = [...t.ents, e];
          if (T.entriesCompatible(ents)) continue;
          if (new Set(ents.map(x => x.st.to)).size + 1 > P.maxStops) continue;
          const m = smallestFit(T.loadOf(ents)); if (!m) continue;
          const ev = evalTour(ents, m.id);
          const delta = ev.cost - t.cost;
          const alone = evalTour([e], smallestFit(T.loadOf([e])).id).cost;
          if (delta < alone && (!best || delta < best.delta)) best = { t, ents, m, ev, delta };
        }
        if (best) { Object.assign(best.t, { ents: best.ents, mtr: best.m.id, ...best.ev }); log.push(`  UF ${e.fu.id} inserida no tour ${best.t.no} (custo incremental ${best.delta.toFixed(0)} < tour dedicado).`); }
        else { const m = smallestFit(T.loadOf([e])); const ev = evalTour([e], m.id); const t = { no: tours.length + local.length + 1, ents: [e], mtr: m.id, ...ev }; local.push(t); log.push(`  Novo tour ${t.no} para UF ${e.fu.id} com ${m.id}.`); }
      }
      // melhoria local: fusão de tours
      let improved = true, it = 0;
      while (improved && it < P.iterations) {
        improved = false; it++;
        outer: for (let i = 0; i < local.length; i++) for (let j = i + 1; j < local.length; j++) {
          const ents = [...local[i].ents, ...local[j].ents];
          if (T.entriesCompatible(ents)) continue;
          if (new Set(ents.map(x => x.st.to)).size > P.maxStops) continue;
          const m = smallestFit(T.loadOf(ents)); if (!m) continue;
          const ev = evalTour(ents, m.id);
          if (ev.cost < local[i].cost + local[j].cost - 1) { log.push(`  Melhoria: tours ${local[i].no} e ${local[j].no} fundidos (economia ${(local[i].cost + local[j].cost - ev.cost).toFixed(0)}).`); Object.assign(local[i], { ents, mtr: m.id, ...ev }); local.splice(j, 1); improved = true; break outer; }
        }
      }
      tours.push(...local);
    }
    // atribuição de recursos
    const pending = []; const final = [];
    const queue = [...tours];
    while (queue.length) {
      const t = queue.shift();
      const date = t.stops[0].planArr.slice(0, 10);
      let res = availRes(t.stops[0].loc, t.mtr, date, pending);
      if (!res) { // tenta veículo maior
        for (const m of mtrsByCap.filter(m => m.capKg > T.mtr(t.mtr).capKg)) { res = availRes(t.stops[0].loc, m.id, date, pending); if (res) { const ev = evalTour(t.ents, m.id); log.push(`  Tour ${t.no}: sem ${t.mtr} disponível; usado ${m.id}.`); Object.assign(t, { mtr: m.id, ...ev }); break; } }
      }
      if (!res && t.ents.length > 1) {
        log.push(`  Tour ${t.no}: nenhum recurso comporta a carga consolidada em ${t.stops[0].loc}; tour dividido em ${t.ents.length} tours individuais.`);
        t.ents.forEach((e, k) => { const m = smallestFit(T.loadOf([e])); queue.push({ no: t.no + '.' + (k + 1), ents: [e], mtr: m.id, ...evalTour([e], m.id) }); });
        continue;
      }
      if (!res) { t.ents.forEach(e => unplanned.push({ key: e.key, reason: `Sem recurso de veículo disponível na zona de ${t.stops[0].loc} em ${date}.` })); continue; }
      pending.push({ resource: res.id, date }); t.resource = res.id; final.push(t);
    }
    const kpi = { tours: final.length, km: final.reduce((a, t) => a + t.km, 0), cost: T.round2(final.reduce((a, t) => a + t.cost, 0)), late: T.round2(final.reduce((a, t) => a + t.lateH, 0)), unplanned: unplanned.length };
    log.push(`Resultado: ${kpi.tours} tour(s), ${kpi.km} km, custo de planejamento ${kpi.cost.toLocaleString('pt-BR')}; ${kpi.unplanned} etapa(s) não planejada(s).`);
    return { tours: final.map(t => ({ keys: t.ents.map(e => e.key), mtr: t.mtr, resource: t.resource, km: t.km, cost: t.cost, lateH: t.lateH, stops: t.stops.map(s => s.loc) })), unplanned, kpi, log };
  },
  acceptPlan(result) {
    let n = 0;
    result.tours.forEach(t => { const fo = T.createFO(t.keys, { resource: t.resource, origin: 'Otimizador VSR' }); if (fo) n++; });
    S.flags.optimizerAccepted = true;
    T.ok(`Plano do otimizador aceito: ${n} ordem(ns) de frete criada(s).`);
  },

  /* ---------- Proposta de transporte (cap. 5.7.9) ---------- */
  proposals(fuId, n) {
    const fu = T.fu(fuId); const out = [];
    const st = n ? fu.stages.find(s => s.n === +n && !s.fo) : fu.stages.find(s => !s.fo); if (!st) { T.err('Todas as etapas desta UF já estão planejadas.'); return []; }
    const key = fu.id + '#' + st.n; const e = { fu, st, key };
    if (st.mode === 'RD') {
      S.md.mtrs.filter(m => m.mode === 'RD' && T.fits(T.loadOf([e]), m)).forEach(m => {
        const r = T.route([e], m.id);
        T.lanesFor(st.from, st.to, 'RD').forEach(l => l.carriers.forEach(c => {
          const fake = { cat: 'FO', mode: 'RD', carrier: c.bp, stops: r.stops, km: r.km, ...T.loadOf([e]) };
          const ch = T.chargesFor(fake, 'FO', true);
          out.push({ key, mtr: m.id, carrier: c.bp, km: r.km, arr: r.stops[r.stops.length - 1].planArr, lateH: r.lateH, cost: ch ? ch.total : null, label: `${m.desc} · ${T.bpName(c.bp)}` });
        }));
      });
    } else {
      S.fo.filter(f => f.cat === 'FB' && f.mode === st.mode && f.stops[0].loc === st.from && f.stops[1].loc === st.to && f.life !== 'Cancelado' && f.exec === 'Não iniciado' && f.capKg - f.kg >= fu.kg).forEach(fb => {
        const ready = T.stageReady(fu, st);
        out.push({ key, booking: fb.id, carrier: fb.carrier, km: fb.km, arr: fb.stops[1].planArr, lateH: Math.max(0, T.hoursBetween(fu.delivery + 'T23:59', fb.stops[1].planArr)), cutoffOk: ready <= fb.cutoff, cost: null, label: `${fb.voyage} · ${T.bpName(fb.carrier)} · partida ${fb.stops[0].planDep.replace('T', ' ')}` });
      });
    }
    out.sort((a, b) => (a.lateH - b.lateH) || ((a.cost || 0) - (b.cost || 0)));
    return out;
  },
  acceptProposal(p) {
    if (p.booking) return T.assignToBooking(p.booking, [p.key]);
    return T.createFO([p.key], { mtr: p.mtr, carrier: p.carrier, origin: 'Proposta de transporte' });
  },

  /* ==========================================================================
     Gestão de encargos de transporte (cap. 9)
     ========================================================================== */
  ctxOf(doc, kind) {
    let km = 0, kg = doc.kg, m3 = doc.m3, value = doc.value, stops = 2;
    if (kind === 'FO') { km = doc.km; stops = doc.stops.length; }
    else { const it = T.sumMeasures(doc.items); kg = it.kg; m3 = it.m3; value = it.value; km = doc.stages.reduce((a, s) => a + T.km(s.from, s.to, s.mode), 0); stops = 2; }
    const t = kg / 1000;
    return { km, kg, t: T.round2(t), m3, value, stops, wm: T.round2(Math.max(t, m3)), kgchg: Math.round(Math.max(kg, m3 * 167)) };
  },
  determineAgreement(doc, kind) {
    const date = S.clock.slice(0, 10);
    if (kind === 'FO') {
      const first = doc.stops[0].loc, last = doc.stops[doc.stops.length - 1].loc;
      return S.md.agreements.find(a => a.kind === 'FA' && a.party === doc.carrier && (a.mode === doc.mode || a.mode === '*') && a.validFrom <= date && a.validTo >= date && T.inArea(first, a.from) && T.inArea(last, a.to));
    }
    const valid = a => a.kind === 'FWA' && (a.mode === doc.mode || a.mode === '*') && a.validFrom <= date && a.validTo >= date;
    return S.md.agreements.find(a => valid(a) && a.party === doc.orderingParty) || S.md.agreements.find(a => valid(a) && a.party === '*');
  },
  runSheet(agr, ctx, mode) {
    const fx = S.md.settings.fx; const lines = []; const log = [];
    const sheet = [...agr.sheet].sort((a, b) => a.n - b.n);
    for (const l of sheet) {
      if (l.modes && !l.modes.includes(mode)) continue;
      const ct = S.md.chargeTypes.find(c => c.id === l.ct) || { desc: l.ct };
      let amt = 0, base = '', qty = 0, rate = 0, unit = '';
      if (l.kind === 'TAB') {
        const tb = T.table(l.table); if (!tb) { log.push(`Linha ${l.n}: tabela ${l.table} não encontrada.`); continue; }
        const v1 = ctx[tb.base1]; let i = tb.scale1.findIndex(s => v1 <= s); if (i < 0) i = tb.scale1.length - 1;
        if (tb.base2) { const v2 = ctx[tb.base2]; let j = tb.scale2.findIndex(s => v2 <= s); if (j < 0) j = tb.scale2.length - 1; rate = tb.values[i][j]; log.push(`Linha ${l.n} ${l.ct}: tabela ${tb.id}, escala ${tb.base1} ${v1} → até ${tb.scale1[i]}, ${tb.base2} ${v2} → até ${tb.scale2[j]}: taxa ${rate} ${tb.curr}/${tb.unit}.`); }
        else { rate = tb.values[i]; log.push(`Linha ${l.n} ${l.ct}: tabela ${tb.id}, escala ${tb.base1} ${v1} → até ${tb.scale1[i]}: taxa ${rate} ${tb.curr}/${tb.unit}.`); }
        rate = T.round2(rate * (l.factor || 1)); if (l.factor && l.factor !== 1) log.push(`  fator ${l.factor} aplicado → ${rate}.`);
        qty = ctx[tb.unit]; unit = tb.unit; base = { t: 'Peso bruto (t)', wm: 'W/M (receita t)', kgchg: 'Peso taxável (kg)', km: 'Distância' }[tb.unit] || tb.unit;
        amt = rate * qty; const min = tb.min * (l.factor || 1);
        if (amt < min) { log.push(`  valor ${amt.toFixed(2)} abaixo do mínimo ${min.toFixed(2)} → mínimo aplicado.`); amt = min; }
        l._curr = tb.curr;
      } else if (l.kind === 'PCT') {
        const refSum = lines.filter(x => x.n >= l.refFrom && x.n <= l.refTo).reduce((a, x) => a + x.amount, 0);
        rate = l.rate; qty = refSum; unit = '%'; base = `% sobre linhas ${l.refFrom}–${l.refTo}`; amt = refSum * l.rate / 100;
        log.push(`Linha ${l.n} ${l.ct}: ${l.rate}% de ${refSum.toFixed(2)}.`);
      } else if (l.kind === 'PCTVAL') { rate = l.rate; qty = ctx.value; unit = '%'; base = '% valor da mercadoria'; amt = ctx.value * l.rate / 100; log.push(`Linha ${l.n} ${l.ct}: ${l.rate}% do valor da mercadoria ${ctx.value.toFixed(2)}.`); }
      else if (l.kind === 'PERKM') { rate = l.rate; qty = ctx.km; unit = 'km'; base = 'Distância (km)'; amt = l.rate * ctx.km; log.push(`Linha ${l.n} ${l.ct}: ${l.rate} × ${ctx.km} km.`); }
      else if (l.kind === 'PERSTOP') { qty = Math.max(0, ctx.stops - 2); rate = l.rate; unit = 'parada'; base = 'Paradas adicionais'; amt = l.rate * qty; log.push(`Linha ${l.n} ${l.ct}: ${qty} parada(s) adicional(is) × ${l.rate}.`); }
      else if (l.kind === 'PERKGCHG') { rate = l.rate; qty = ctx.kgchg; unit = 'kg'; base = 'Peso taxável (kg)'; amt = l.rate * ctx.kgchg; log.push(`Linha ${l.n} ${l.ct}: ${l.rate} × ${ctx.kgchg} kg taxável.`); }
      else if (l.kind === 'FIX') { rate = l.rate; qty = 1; unit = 'fixo'; base = 'Valor fixo'; amt = l.rate; log.push(`Linha ${l.n} ${l.ct}: valor fixo ${l.rate}.`); }
      const curr = l.kind === 'TAB' ? l._curr : agr.curr;
      const amountBRL = T.round2(amt * (fx[curr] || 1));
      if (curr !== 'BRL') log.push(`  conversão ${curr} → BRL à taxa ${fx[curr]}: ${amountBRL.toFixed(2)} BRL.`);
      lines.push({ n: l.n, ct: l.ct, desc: ct.desc, base, qty: T.round2(qty), unit, rate, curr, amountCurr: T.round2(amt), amount: amountBRL });
    }
    const total = T.round2(lines.reduce((a, x) => a + x.amount, 0));
    return { lines, total, log };
  },
  chargesFor(doc, kind, silent) {
    const agr = T.determineAgreement(doc, kind);
    if (!agr) { if (!silent) T.err(kind === 'FO' ? `Nenhum acordo de frete válido para a transportadora ${T.bpName(doc.carrier)} (${T.modeName(doc.mode)}).` : 'Nenhum acordo de expedição válido encontrado.'); return null; }
    const ctx = T.ctxOf(doc, kind === 'FO' ? 'FO' : 'REQ');
    const r = T.runSheet(agr, ctx, doc.mode);
    return { agreement: agr.id, ctx, ...r, log: [`Determinação de contrato: acordo ${agr.id} (${agr.desc}).`, `Base de cálculo: ${ctx.km} km · ${ctx.kg.toLocaleString('pt-BR')} kg · ${ctx.m3} m³ · W/M ${ctx.wm} · kg taxável ${ctx.kgchg} · ${ctx.stops} paradas · valor ${ctx.value.toFixed(2)}.`, ...r.log], at: S.clock, curr: 'BRL' };
  },
  calcCharges(doc, kind) {
    if (kind === 'FO' && !doc.carrier) { T.err('Atribua uma transportadora antes de calcular os encargos (determinação do acordo de frete usa a transportadora).'); return null; }
    if (kind === 'FO' && doc.tenderPrice) {
      doc.charges = { agreement: 'Cotação de frete (tendering)', ctx: T.ctxOf(doc, 'FO'), lines: [{ n: 10, ct: 'FB00', desc: 'Frete acordado no tendering', base: 'Cotação', qty: 1, unit: 'fixo', rate: doc.tenderPrice, curr: 'BRL', amountCurr: doc.tenderPrice, amount: doc.tenderPrice }], total: doc.tenderPrice, log: ['Preço da cotação de frete premiada transferido para os encargos (cap. 6.6).'], at: S.clock, curr: 'BRL' };
      T.ok(`Encargos de ${doc.id}: ${T.fmtMoney(doc.tenderPrice)} (preço do tendering).`, doc.id); return doc.charges;
    }
    const c = T.chargesFor(doc, kind); if (!c) return null;
    doc.charges = c;
    T.ok(`Encargos calculados para ${doc.id}: ${T.fmtMoney(c.total)} (acordo ${c.agreement}).`, doc.id);
    return c;
  },
  fmtMoney(v, c = 'BRL') { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: c }); },

  /* ==========================================================================
     Seleção de transportadora (cap. 6.5) e tendering (cap. 6.6)
     ========================================================================== */
  carrierCandidates(foId) {
    const fo = T.fo(foId);
    const first = fo.stops[0].loc, last = fo.stops[fo.stops.length - 1].loc;
    const lanes = T.lanesFor(first, last, fo.mode);
    const cands = [];
    lanes.forEach(l => l.carriers.forEach(c => {
      if (cands.some(x => x.bp === c.bp)) return;
      const b = T.bp(c.bp); if (!b || b.sanctioned) return;
      const ch = T.chargesFor({ ...fo, carrier: c.bp }, 'FO', true);
      cands.push({ bp: c.bp, lane: l.id, prio: c.prio, laneCost: T.round2((c.costKm || 0) * fo.km), cost: ch ? ch.total : null, agreement: ch ? ch.agreement : null });
    }));
    const strat = S.md.settings.carrierSel.strategy;
    cands.sort((a, b) => strat === 'PRIO' ? a.prio - b.prio : ((a.cost ?? 1e12) - (b.cost ?? 1e12)) || (a.prio - b.prio));
    cands.forEach((c, i) => c.rank = i + 1);
    return cands;
  },
  runCarrierSelection(foId) {
    const fo = T.fo(foId); const c = T.carrierCandidates(foId);
    if (!c.length) { T.err(`Nenhuma transportadora encontrada nas rotas de transporte para ${fo.stops[0].loc} → ${fo.stops[fo.stops.length - 1].loc}.`); return; }
    T.assignCarrier(foId, c[0].bp, `Seleção de transportadora (estratégia ${S.md.settings.carrierSel.strategy === 'COST' ? 'custo' : 'prioridade'})`);
    S.flags.carrierSelection = true;
  },
  assignCarrier(foId, bpId, how) {
    const fo = T.fo(foId);
    if (fo.fixed) { T.err('Documento fixado.'); return; }
    if (['Enviado', 'Confirmado'].includes(fo.sub.status) && fo.carrier !== bpId) T.warn(`OF ${fo.id} já havia sido enviada a ${T.bpName(fo.carrier)}; cancelamento será comunicado.`, fo.id);
    fo.carrier = bpId; fo.sub.status = 'Transportadora atribuída'; fo.tenderPrice = null;
    T.ok(`Transportadora ${bpId} ${T.bpName(bpId)} atribuída a ${fo.id}${how ? ' via ' + how : ''}.`, fo.id);
    T.calcCharges(fo, 'FO');
  },
  sendToCarrier(foId) {
    const fo = T.fo(foId);
    if (!fo.carrier) { T.err('Nenhuma transportadora atribuída.'); return; }
    if (fo.sub.status === 'Confirmado') { T.info('Ordem já confirmada pela transportadora.'); return; }
    fo.sub.status = 'Enviado'; T.ok(`OF ${fo.id} enviada para ${T.bpName(fo.carrier)} (mensagem B2B TransportationOrderRequest).`, fo.id);
  },
  carrierRespondFO(foId, confirm, reason) {
    const fo = T.fo(foId);
    if (fo.sub.status !== 'Enviado') { T.err('A ordem não está aguardando confirmação.'); return; }
    if (confirm) { fo.sub.status = 'Confirmado'; if (fo.cat === 'FB') fo.mbl = fo.mbl || (fo.mode === 'SEA' ? T.bp(fo.carrier).scac + 'U' + String(Math.floor(Math.random() * 9e6) + 1e6) : '577-' + String(Math.floor(Math.random() * 9e7) + 1e7)); T.ok(`${T.bpName(fo.carrier)} confirmou ${fo.id}${fo.mbl ? ' (' + (fo.mode === 'SEA' ? 'MBL ' : 'MAWB ') + fo.mbl + ')' : ''}.`, fo.id); }
    else { fo.sub.status = 'Rejeitado'; T.warn(`${T.bpName(fo.carrier)} rejeitou ${fo.id}: ${reason || 'sem motivo'}.`, fo.id); if (fo.cat === 'FO') { fo.carrier = null; fo.charges = null; } }
  },
  startTender(foId) {
    const fo = T.fo(foId);
    if (fo.cat !== 'FO') { T.err('Tendering disponível para ordens de frete.'); return; }
    if (fo.sub.tender && fo.sub.tender.status === 'Em andamento') { T.err('Tendering já em andamento.'); return; }
    if (fo.fixed) { T.err('Documento fixado.'); return; }
    const cands = T.carrierCandidates(foId);
    if (!cands.length) { T.err('Nenhuma transportadora nas rotas de transporte para iniciar o tendering.'); return; }
    const prof = S.md.settings.tendering;
    const est = cands.find(c => c.cost) ? Math.min(...cands.filter(c => c.cost).map(c => c.cost)) : fo.planCost;
    const byPrio = [...cands].sort((a, b) => a.prio - b.prio);
    const steps = prof.steps.map((s, i) => ({ no: i + 1, type: s.type, hours: s.hours, carriers: s.type === 'P2P' ? [byPrio[0].bp] : byPrio.slice(prof.steps[0].type === 'P2P' ? 1 : 0).slice(0, s.max || 3).map(c => c.bp), status: 'Não iniciado' })).filter(s => s.carriers.length);
    fo.sub.tender = { profile: prof.id, steps, cur: 0, status: 'Em andamento', priceLimit: T.round2(est * prof.priceLimitPct / 100), est, award: null, startedAt: S.clock };
    fo.carrier = null; fo.charges = null; fo.tenderPrice = null; fo.sub.status = 'Em tendering';
    T.ok(`Tendering iniciado para ${fo.id} com o perfil ${prof.id}. Preço-limite ${T.fmtMoney(fo.sub.tender.priceLimit)} (${prof.priceLimitPct}% da estimativa).`, fo.id);
    T.tenderOpenStep(fo);
  },
  tenderOpenStep(fo) {
    const tn = fo.sub.tender; const step = tn.steps[tn.cur];
    step.status = 'Em andamento'; step.openedAt = S.clock;
    step.carriers.forEach(c => {
      const r = { id: T.nextId('RFQ'), fo: fo.id, carrier: c, step: step.no, type: step.type, sentAt: S.clock, dueAt: T.addH(S.clock, step.hours), status: 'Aberta', price: null, reason: null, respondedAt: null, est: tn.est };
      S.rfq.unshift(r);
    });
    T.info(`Etapa ${step.no} (${step.type === 'P2P' ? 'ponto a ponto' : 'broadcast'}): RFQ de frete enviada a ${step.carriers.map(T.bpName).join(', ')}. Prazo ${step.hours} h.`, fo.id);
  },
  rfqRespond(rfqId, accept, price, reason) {
    const r = T.rfq(rfqId);
    if (r.status !== 'Aberta') { T.err('Esta RFQ não está aberta.'); return; }
    if (S.clock > r.dueAt) { r.status = 'Expirada'; T.err('Prazo da RFQ expirado.'); return; }
    r.status = accept ? 'Aceita' : 'Rejeitada'; r.price = accept ? T.round2(+price) : null; r.reason = accept ? null : (reason || 'Sem capacidade'); r.respondedAt = S.clock;
    T[accept ? 'ok' : 'warn'](`Cotação de frete de ${T.bpName(r.carrier)} para ${r.fo}: ${accept ? 'aceita por ' + T.fmtMoney(r.price) : 'rejeitada (' + r.reason + ')'}.`, r.fo);
  },
  simulateRFQResponses(foId) {
    const open = S.rfq.filter(r => r.fo === foId && r.status === 'Aberta');
    if (!open.length) { T.info('Nenhuma RFQ aberta para simular.'); return; }
    open.forEach(r => { const acc = Math.random() < 0.72; const p = r.est * (0.88 + Math.random() * 0.3); T.rfqRespond(r.id, acc, Math.round(p), acc ? null : ['Sem capacidade na data', 'Rota fora da malha', 'Preço abaixo do custo'][Math.floor(Math.random() * 3)]); });
  },
  expireRFQs() { S.rfq.forEach(r => { if (r.status === 'Aberta' && S.clock > r.dueAt) { r.status = 'Expirada'; T.warn(`RFQ ${r.id} (${T.bpName(r.carrier)}) expirou sem resposta.`, r.fo); } }); },
  evaluateTender(foId) {
    const fo = T.fo(foId); const tn = fo.sub.tender;
    if (!tn || tn.status !== 'Em andamento') { T.err('Não há tendering em andamento.'); return; }
    T.expireRFQs();
    const step = tn.steps[tn.cur];
    const rfqs = S.rfq.filter(r => r.fo === foId && r.step === step.no && ['Aberta', 'Aceita', 'Rejeitada', 'Expirada'].includes(r.status));
    const open = rfqs.filter(r => r.status === 'Aberta');
    const acc = rfqs.filter(r => r.status === 'Aceita').sort((a, b) => a.price - b.price);
    const within = acc.filter(r => r.price <= tn.priceLimit);
    if (step.type === 'P2P' && open.length && !acc.length) { T.info('Aguardando resposta da transportadora (ponto a ponto). Avance a data do sistema ou simule a resposta.'); return; }
    if (step.type === 'BROADCAST' && open.length && S.clock <= T.addH(step.openedAt, step.hours)) {
      if (!within.length) { T.info('Broadcast em andamento: aguardando cotações até o fim do prazo.'); return; }
    }
    acc.filter(r => r.price > tn.priceLimit).forEach(r => { r.status = 'Recusada (preço)'; T.warn(`Cotação ${r.id} de ${T.bpName(r.carrier)} acima do preço-limite (${T.fmtMoney(r.price)} > ${T.fmtMoney(tn.priceLimit)}).`, fo.id); });
    if (within.length) {
      const win = within[0];
      win.status = 'Premiada'; within.slice(1).forEach(r => r.status = 'Não premiada'); open.forEach(r => r.status = 'Cancelada');
      step.status = 'Concluído'; tn.status = 'Premiado'; tn.award = { carrier: win.carrier, price: win.price, rfq: win.id };
      fo.carrier = win.carrier; fo.tenderPrice = win.price; fo.sub.status = 'Transportadora aceitou';
      T.ok(`Tendering concluído: ${T.bpName(win.carrier)} premiada com ${T.fmtMoney(win.price)} (RFQ ${win.id}).`, fo.id);
      T.calcCharges(fo, 'FO'); S.flags.tenderAwarded = true; return;
    }
    open.forEach(r => r.status = 'Cancelada');
    step.status = 'Sem sucesso';
    if (tn.cur + 1 < tn.steps.length) { tn.cur++; T.warn(`Etapa ${step.no} sem cotação válida. Iniciando etapa ${tn.cur + 1}.`, fo.id); T.tenderOpenStep(fo); }
    else { tn.status = 'Sem sucesso'; fo.sub.status = 'Tendering sem sucesso'; T.err(`Tendering de ${fo.id} sem sucesso. Atribua uma transportadora manualmente ou reinicie.`, fo.id); }
  },

  /* ==========================================================================
     Execução e monitoramento (cap. 7)
     ========================================================================== */
  EVENTS: { ARRIV: 'Chegada (check-in)', LOAD: 'Carregamento concluído', DEPART: 'Partida (check-out)', UNLOAD: 'Descarregamento concluído', POD: 'Comprovante de entrega (POD)' },
  expectedEvents(fo) {
    const ev = []; const last = fo.stops.length - 1;
    fo.stops.forEach((s, i) => {
      if (fo.cat === 'FB') {
        if (i === 0) { ev.push({ code: 'LOAD', stop: i, plan: s.planDep }); ev.push({ code: 'DEPART', stop: i, plan: s.planDep }); }
        else { ev.push({ code: 'ARRIV', stop: i, plan: s.planArr }); ev.push({ code: 'UNLOAD', stop: i, plan: T.addH(s.planArr, 12) }); }
        return;
      }
      ev.push({ code: 'ARRIV', stop: i, plan: s.planArr });
      if (s.unload.length) ev.push({ code: 'UNLOAD', stop: i, plan: s.planDep });
      if (s.load.length) ev.push({ code: 'LOAD', stop: i, plan: s.planDep });
      if (i < last) ev.push({ code: 'DEPART', stop: i, plan: s.planDep });
      else ev.push({ code: 'POD', stop: i, plan: s.planDep });
    });
    const shift = fo.etaShiftMin || 0;
    ev.forEach((e, k) => { e.idx = k; const done = fo.events.find(x => x.idx === k); e.done = done || null; e.eta = shift && !done ? T.addH(e.plan, shift / 60) : e.plan; });
    return ev;
  },
  checkReady(foId, silent) {
    const fo = T.fo(foId); const errs = [];
    if (!fo.stages.length) errs.push('Documento sem unidades de frete atribuídas.');
    if (fo.subcontract && !fo.carrier) errs.push('Documento relevante para subcontratação sem transportadora.');
    if (fo.subcontract && !['Confirmado', 'Transportadora aceitou'].includes(fo.sub.status)) errs.push(`Status de subcontratação "${fo.sub.status}" – necessário "Confirmado".`);
    if (fo.cat === 'FO' && !fo.subcontract && !fo.resource) errs.push('Execução própria exige recurso de veículo.');
    const dg = T.traitsOfEntries(fo.stages.map(T.stageOf).filter(Boolean)).filter(t => t.startsWith('dg:'));
    if (errs.length) { if (!silent) errs.forEach(e => T.err(`${fo.id}: ${e}`, fo.id)); return false; }
    if (fo.exec === 'Não iniciado') { fo.exec = 'Pronto p/ execução'; fo.life = 'Em processamento'; if (!silent) T.ok(`${fo.id} pronto para execução do transporte${dg.length ? ` (produtos perigosos: classes ${dg.map(d => d.slice(3)).join(', ')} – documentação gerada)` : ''}.`, fo.id); }
    else if (!silent) T.info(`${fo.id}: status de execução "${fo.exec}".`, fo.id);
    return true;
  },
  reportEvent(foId, idx, at, note) {
    const fo = T.fo(foId);
    if (fo.exec === 'Não iniciado' && !T.checkReady(foId, true)) { T.err(`${fo.id} não está pronto para execução. Use Verificar › Pronto para execução.`, fo.id); return; }
    if (fo.exec === 'Executado') { T.err('Execução já concluída.'); return; }
    const ev = T.expectedEvents(fo); const next = ev.find(e => !e.done);
    if (!next || next.idx !== idx) { T.err(`Evento fora de sequência. Próximo evento esperado: ${next ? T.EVENTS[next.code] : '—'}.`, fo.id); return; }
    at = at || S.clock;
    const prev = fo.events[fo.events.length - 1]; if (prev && at < prev.at) { T.err('Data/hora do evento anterior ao último evento reportado.'); return; }
    const delayMin = Math.round(T.hoursBetween(next.plan, at) * 60);
    const stop = fo.stops[next.stop];
    fo.events.push({ idx, code: next.code, stop: next.stop, loc: stop.loc, plan: next.plan, at, delayMin, note: note || '', reportedAt: S.clock });
    if (at > S.clock) S.clock = at;
    fo.exec = 'Em execução';
    const stageEntries = k => k.map(T.stageOf).filter(Boolean);
    if (next.code === 'ARRIV') { stop.actArr = at; stageEntries(stop.unload).forEach(e => { e.st.handling = 'Não descarregado'; }); }
    if (next.code === 'LOAD') stageEntries(stop.load).forEach(e => { e.st.handling = 'Carregado'; e.st.exec = 'Em execução'; T.refreshFU(e.fu); });
    if (next.code === 'DEPART') stop.actDep = at;
    if (next.code === 'UNLOAD') stageEntries(stop.unload).forEach(e => { e.st.handling = 'Descarregado'; e.st.exec = 'Executado'; T.refreshFU(e.fu); });
    if (next.code === 'POD') stop.actDep = at;
    const rest = T.expectedEvents(fo).filter(e => !e.done);
    if (!rest.length) { fo.exec = 'Executado'; fo.life = 'Concluído'; T.ok(`${fo.id}: todos os eventos esperados reportados. Status de execução: Executado.`, fo.id); }
    T.m(delayMin > 30 ? 'W' : 'S', `Evento "${T.EVENTS[next.code]}" em ${T.locName(stop.loc)} reportado para ${fo.id}${delayMin > 30 ? ` com atraso de ${delayMin} min` : ''}.`, fo.id);
  },
  reportDelay(foId, minutes, reason) {
    const fo = T.fo(foId);
    if (!['Pronto p/ execução', 'Em execução'].includes(fo.exec)) { T.err('Evento de atraso só pode ser reportado durante a execução.'); return; }
    fo.etaShiftMin = (fo.etaShiftMin || 0) + (+minutes);
    S.flags.delayReported = true; fo.delays = fo.delays || []; fo.delays.push({ at: S.clock, minutes: +minutes, reason });
    T.warn(`Atraso de ${minutes} min reportado para ${fo.id} (${reason}). Eventos esperados reprogramados.`, fo.id);
  },
  reportDiscrepancy(foId, fuId, qty, type) {
    const fu = T.fu(fuId); fu.discrepancies.push({ fo: foId, qty: +qty, type, at: S.clock });
    T.warn(`Discrepância registrada na UF ${fuId}: ${type}, ${qty} unidade(s) (cap. 7.1.2).`, foId);
  },
  simulateTracking(foId) {
    const fo = T.fo(foId); if (fo.exec === 'Não iniciado' && !T.checkReady(foId)) return;
    const next = T.expectedEvents(fo).find(e => !e.done); if (!next) { T.info('Nenhum evento pendente.'); return; }
    const dev = Math.round(-15 + Math.random() * 100);
    const base = T.maxIso(next.eta, S.clock); const at = T.addH(base, dev / 60);
    T.reportEvent(foId, next.idx, T.maxIso(at, fo.events.length ? fo.events[fo.events.length - 1].at : at));
  },

  /* ==========================================================================
     Liquidação (cap. 10 e 11.3)
     ========================================================================== */
  createFSD(foId) {
    const fo = T.fo(foId);
    if (!fo.subcontract) { T.err('Ordem executada com frota própria: não há fatura de fornecedor a liquidar.'); return null; }
    if (!fo.carrier) { T.err('Documento sem transportadora.'); return null; }
    if (fo.fsd) { T.err(`Já existe o documento de liquidação ${fo.fsd}.`); return null; }
    if (!['Confirmado', 'Transportadora aceitou'].includes(fo.sub.status)) { T.err('Liquidação exige status de subcontratação Confirmado.'); return null; }
    if (!fo.charges) { T.calcCharges(fo, 'FO'); if (!fo.charges) return null; }
    if (fo.exec !== 'Executado') T.warn(`${fo.id} ainda não está executado – liquidação antecipada (provisão).`, fo.id);
    const d = { id: T.nextId('FSD'), type: 'ZFSD', fo: fo.id, foCat: fo.cat, carrier: fo.carrier, purchOrg: fo.purchOrg, status: 'Novo', lines: JSON.parse(JSON.stringify(fo.charges.lines)), amount: fo.charges.total, curr: 'BRL', created: S.clock, po: null, ses: null, invoice: null, dist: [], history: [{ at: S.clock, text: 'Documento criado a partir de ' + fo.id }] };
    S.fsd.unshift(d); fo.fsd = d.id; fo.inv = 'Liquidação criada';
    T.ok(`Documento de liquidação de frete ${d.id} criado (${T.fmtMoney(d.amount)}).`, d.id);
    return d;
  },
  distributeCost(fo, amount) {
    const ents = fo.stages.map(T.stageOf).filter(Boolean); const tot = ents.reduce((a, e) => a + e.fu.kg, 0) || 1;
    return ents.map(e => ({ fu: e.fu.id, key: e.key, reqs: e.fu.reqs, share: T.round2(e.fu.kg / tot * 100), amount: T.round2(amount * e.fu.kg / tot) }));
  },
  transferFSD(id) {
    const d = T.fsd(id); if (d.status !== 'Novo') { T.err('Somente documentos com status Novo podem ser transferidos.'); return; }
    d.po = T.nextId('PO'); d.ses = T.nextId('SES'); d.status = 'Transferido'; const fo = T.fo(d.fo); fo.inv = 'Transferido p/ ERP';
    d.dist = T.distributeCost(fo, d.amount);
    d.history.push({ at: S.clock, text: `Transferido ao MM: pedido de compra de serviço ${d.po}, folha de registro de serviço ${d.ses}, provisão contábil lançada.` });
    T.ok(`DLF ${d.id} transferido: pedido ${d.po} / folha de serviço ${d.ses}. Distribuição de custos para ${d.dist.length} UF(s) (base peso bruto).`, d.id);
  },
  postInvoice(id, amount, ref) {
    const d = T.fsd(id); if (d.status !== 'Transferido') { T.err('A fatura só pode ser verificada após a transferência (pedido e folha de serviço).'); return; }
    amount = +amount; const diff = T.round2(amount - d.amount); const pct = d.amount ? diff / d.amount * 100 : 0;
    d.invoice = { amount, ref: ref || 'NF-e ' + Math.floor(Math.random() * 90000 + 10000), diff, pct: T.round2(pct), at: S.clock, doc: null };
    if (Math.abs(pct) <= S.md.settings.invoiceTolerancePct) { d.invoice.doc = T.nextId('INV'); d.status = 'Fatura verificada'; T.fo(d.fo).inv = 'Faturado'; d.history.push({ at: S.clock, text: `Fatura ${d.invoice.ref} verificada (MIRO ${d.invoice.doc}), diferença ${pct.toFixed(2)}% dentro da tolerância.` }); T.ok(`Fatura do transportador verificada (doc. ${d.invoice.doc}). Diferença ${T.fmtMoney(diff)}.`, d.id); }
    else { d.status = 'Em disputa'; d.history.push({ at: S.clock, text: `Fatura ${d.invoice.ref} de ${T.fmtMoney(amount)} diverge ${pct.toFixed(2)}% – disputa aberta.` }); T.warn(`Fatura diverge ${pct.toFixed(2)}% (tolerância ${S.md.settings.invoiceTolerancePct}%). Caso de disputa aberto (cap. 10.1.5).`, d.id); }
  },
  resolveDispute(id, accept) {
    const d = T.fsd(id); if (d.status !== 'Em disputa') { T.err('Documento não está em disputa.'); return; }
    if (accept) { d.amount = d.invoice.amount; d.lines.push({ n: 900, ct: 'MANU', desc: 'Ajuste aceito em disputa', base: 'Manual', qty: 1, unit: 'fixo', rate: d.invoice.diff, curr: 'BRL', amountCurr: d.invoice.diff, amount: d.invoice.diff }); d.dist = T.distributeCost(T.fo(d.fo), d.amount); d.invoice.doc = T.nextId('INV'); S.flags.disputeResolved = true; d.status = 'Fatura verificada'; T.fo(d.fo).inv = 'Faturado'; d.history.push({ at: S.clock, text: 'Disputa resolvida: valor faturado aceito, custo redistribuído.' }); T.ok(`Disputa resolvida a favor do transportador. Doc. de fatura ${d.invoice.doc}.`, d.id); }
    else { d.status = 'Fatura recusada'; d.history.push({ at: S.clock, text: 'Disputa: fatura recusada, transportador deve reemitir com o valor acordado.' }); T.warn(`Fatura recusada. Solicitada nova fatura de ${T.fmtMoney(d.amount)}.`, d.id); d.status = 'Transferido'; d.invoice = null; }
  },
  createFWSD(fwoId) {
    const f = T.fwo(fwoId);
    if (f.fwsd) { T.err(`Já existe o documento de liquidação ${f.fwsd}.`); return null; }
    if (!f.charges) { T.err('Calcule os encargos da ordem de expedição antes de faturar.'); return null; }
    if (f.block) { T.err('Documento bloqueado.'); return null; }
    const d = { id: T.nextId('FWSD'), type: 'ZFWS', fwo: f.id, billTo: f.orderingParty, salesOrg: f.salesOrg, status: 'Novo', lines: JSON.parse(JSON.stringify(f.charges.lines)), amount: f.charges.total, created: S.clock, billing: null, history: [{ at: S.clock, text: 'Criado a partir da OE ' + f.id }] };
    S.fwsd.unshift(d); f.fwsd = d.id; f.inv = 'Liquidação criada';
    T.ok(`Documento de liquidação de expedição ${d.id} criado (${T.fmtMoney(d.amount)}).`, d.id); return d;
  },
  transferFWSD(id) {
    const d = T.fwsd(id); if (d.status !== 'Novo') { T.err('Documento já transferido.'); return; }
    d.billing = T.nextId('BIL'); d.status = 'Faturado'; T.fwo(d.fwo).inv = 'Faturado';
    d.history.push({ at: S.clock, text: `Transferido ao SD: documento de faturamento ${d.billing} criado e contabilizado.` });
    T.ok(`DLE ${d.id} transferido ao SD: documento de faturamento ${d.billing}.`, d.id);
  },

  /* ---------- Rentabilidade (cap. 11.3.6) ---------- */
  profitability(reqDoc) {
    const rows = [];
    reqDoc.fus.forEach(fuId => {
      const fu = T.fu(fuId); if (!fu) return;
      const shareOfFu = fu.items.filter(i => i.req.id === reqDoc.id).reduce((a, i) => a + i.kg, 0) / (fu.kg || 1);
      fu.stages.forEach(st => {
        if (!st.fo) { rows.push({ fu: fu.id, stage: st, doc: null, kind: 'Não planejado', amount: 0 }); return; }
        const fo = T.fo(st.fo); const key = fu.id + '#' + st.n;
        const fsd = fo.fsd && T.fsd(fo.fsd);
        if (fsd && fsd.dist.length) { const d = fsd.dist.find(x => x.key === key); rows.push({ fu: fu.id, stage: st, doc: fo.id, kind: 'Real (liquidação ' + fsd.id + ')', amount: T.round2((d ? d.amount : 0) * shareOfFu) }); return; }
        const total = fo.charges ? fo.charges.total : fo.subcontract ? 0 : fo.planCost || 0;
        const part = T.distributeCost(fo, total).find(x => x.key === key);
        rows.push({ fu: fu.id, stage: st, doc: fo.id, kind: fo.charges ? 'Previsto (encargos da OF)' : fo.subcontract ? 'Sem encargos' : 'Custo interno (frota própria)', amount: T.round2((part ? part.amount : 0) * shareOfFu) });
      });
    });
    const revenue = reqDoc.charges ? reqDoc.charges.total : 0; const cost = T.round2(rows.reduce((a, r) => a + r.amount, 0));
    return { rows, revenue, cost, margin: T.round2(revenue - cost), pct: revenue ? T.round2((revenue - cost) / revenue * 100) : 0 };
  }
};

/* ---------- estado inicial + cenário de demonstração ---------- */
function newState(withDemo = true) {
  S = { v: 3, clock: '2026-10-12T08:00', seq: {}, md: SEED_MASTER(), fwq: [], fwo: [], otr: [], fu: [], fo: [], rfq: [], fsd: [], fwsd: [], log: [], flags: {}, savedAt: null };
  if (withDemo) buildDemo();
  OUT.length = 0;
  S.log = [{ type: 'I', text: 'Sistema inicializado com dados de demonstração. Data do sistema: 12/10/2026 08:00.', at: S.clock }];
  S.flags = {};
  S.seed = { locs: S.md.locs.length, lanes: S.md.lanes.length, bps: S.md.bps.length, fwo: S.fwo.map(x => x.id), fo: S.fo.map(x => x.id), fsd: S.fsd.map(x => x.id), fwsd: S.fwsd.map(x => x.id), otr: S.otr.map(x => x.id) };
  return S;
}
function buildDemo() {
  const realClock = '2026-10-12T08:00';
  // 1) ciclo completo concluído (semana anterior)
  S.clock = '2026-10-05T07:00';
  const a = T.createFWO({ orderingParty: '1001', consignee: '1101', src: 'CD_CAMPINAS', dst: 'CLI_RIO', pickup: '2026-10-05', delivery: '2026-10-06', mode: 'RD', incoterm: 'CIF', items: [{ product: 'MAT-100', qty: 1200 }, { product: 'MAT-200', qty: 300 }], ref: 'PED-ALFA-88231' });
  T.calcCharges(a, 'FWO');
  T.buildFUs([{ type: 'FWO', id: a.id }]);
  const foA = T.createFO(a.fus.flatMap(id => T.fu(id).stages.map(s => id + '#' + s.n)), { resource: 'CARRETA-CPS', origin: 'Manual' });
  T.runCarrierSelection(foA.id); T.sendToCarrier(foA.id); T.carrierRespondFO(foA.id, true); T.checkReady(foA.id);
  T.expectedEvents(foA).forEach(e => T.reportEvent(foA.id, e.idx, T.addH(e.plan, (e.idx % 3) * 0.25)));
  const fsdA = T.createFSD(foA.id); T.transferFSD(fsdA.id); T.postInvoice(fsdA.id, fsdA.amount, 'NF-e 48211');
  const fwsdA = T.createFWSD(a.id); T.transferFWSD(fwsdA.id);
  // 2) em execução
  S.clock = '2026-10-11T16:00';
  const b = T.createFWO({ orderingParty: '1001', consignee: '1102', src: 'CD_CAMPINAS', dst: 'CLI_BH', pickup: '2026-10-12', delivery: '2026-10-13', mode: 'RD', items: [{ product: 'MAT-100', qty: 600 }, { product: 'MAT-200', qty: 250 }], ref: 'PED-ALFA-88310' });
  T.calcCharges(b, 'FWO'); T.buildFUs([{ type: 'FWO', id: b.id }]);
  const foB = T.createFO(b.fus.flatMap(id => T.fu(id).stages.map(s => id + '#' + s.n)), { resource: 'TRUCK-CPS' });
  T.assignCarrier(foB.id, '2003', 'Atribuição manual'); T.sendToCarrier(foB.id); T.carrierRespondFO(foB.id, true); T.checkReady(foB.id);
  S.clock = realClock;
  const evB = T.expectedEvents(foB); T.reportEvent(foB.id, evB[0].idx, '2026-10-12T08:05'); T.reportEvent(foB.id, evB[1].idx, '2026-10-12T09:20');
  // 3) UFs criadas, não planejadas (DG)
  S.clock = '2026-10-12T07:30';
  const c = T.createFWO({ orderingParty: '1002', consignee: '1105', src: 'FAB_JUNDIAI', dst: 'CLI_POA', pickup: '2026-10-13', delivery: '2026-10-15', mode: 'RD', items: [{ product: 'MAT-300', qty: 600 }, { product: 'MAT-310', qty: 200 }], ref: 'PQ-55120' });
  T.buildFUs([{ type: 'FWO', id: c.id }]);
  const d = T.createFWO({ orderingParty: '1001', consignee: '1103', src: 'CD_CAMPINAS', dst: 'CLI_CURITIBA', pickup: '2026-10-13', delivery: '2026-10-14', mode: 'RD', items: [{ product: 'MAT-400', qty: 180 }, { product: 'MAT-100', qty: 400 }], ref: 'PED-ALFA-88355' });
  T.buildFUs([{ type: 'FWO', id: d.id }]);
  // 4) nova, sem UFs
  T.createFWO({ orderingParty: '1001', consignee: '1106', src: 'CD_CAMPINAS', dst: 'CLI_GOIANIA', pickup: '2026-10-14', delivery: '2026-10-16', mode: 'RD', items: [{ product: 'MAT-100', qty: 2500 }, { product: 'MAT-200', qty: 900 }], ref: 'PED-ALFA-88401' });
  // 5) marítima porta a porta com booking
  S.clock = realClock;
  T.createBookingsFromSchedule('SCH-ATSH-SSZ-HAM', 4); T.createBookingsFromSchedule('SCH-OCNL-SSZ-RTM', 4); T.createBookingsFromSchedule('SCH-ACBR-GRU-FRA', 2);
  const e = T.createFWO({ orderingParty: '1003', consignee: '1104', src: 'ARM_RIBEIRAO', dst: 'CLI_HAMBURGO', pickup: '2026-10-14', delivery: '2026-11-12', mode: 'SEA', movement: 'DD', incoterm: 'CIF', items: [{ product: 'MAT-110', qty: 640 }], ref: 'EXP-CSV-2026-077' });
  T.calcCharges(e, 'FWO'); T.buildFUs([{ type: 'FWO', id: e.id }]);
  const fb = S.fo.filter(f => f.cat === 'FB' && f.schedule === 'SCH-ATSH-SSZ-HAM').sort((x, y) => x.stops[0].planDep < y.stops[0].planDep ? -1 : 1)[0];
  T.assignToBooking(fb.id, e.fus.map(id => id + '#2')); T.bookingRequest(fb.id); T.carrierRespondFO(fb.id, true); T.calcCharges(fb, 'FO');
  // 6) pedido de venda (cenário embarcador / OTR)
  T.createSalesOrder({ soldTo: '1001', consignee: '1107', src: 'CD_CAMPINAS', dst: 'CLI_SALVADOR', pickup: '2026-10-15', delivery: '2026-10-19', items: [{ product: 'MAT-200', qty: 1200 }] });
  S.clock = realClock;
}

if (typeof module !== 'undefined') module.exports = { T, newState, getS: () => S, setS: x => { S = x; }, OUT };
