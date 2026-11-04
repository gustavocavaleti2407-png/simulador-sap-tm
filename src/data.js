/* ==========================================================================
   Dados mestres e Customizing de exemplo (cenário fictício: LSP brasileiro)
   Referências ao livro "Transportation Management with SAP S/4HANA" (cap. 3, 9)
   ========================================================================== */
const SEED_MASTER = () => ({
  org: {
    company: 'TMB Logística S.A.',
    salesOrg: 'VS-SP01', purchOrg: 'CP-SP01', planOrg: 'PL-SP01', execOrg: 'EX-SP01',
    currency: 'BRL'
  },
  bps: [
    { id: '1001', name: 'Alfa Bens de Consumo S.A.', roles: ['Cliente', 'Expedidor'], city: 'Campinas/SP', loc: 'CD_CAMPINAS', sanctioned: false, credit: 900000 },
    { id: '1002', name: 'Química Paulista Ltda.', roles: ['Cliente', 'Expedidor'], city: 'Jundiaí/SP', loc: 'FAB_JUNDIAI', sanctioned: false, credit: 400000 },
    { id: '1003', name: 'Café Serra Verde Exportadora', roles: ['Cliente', 'Expedidor'], city: 'Ribeirão Preto/SP', loc: 'ARM_RIBEIRAO', sanctioned: false, credit: 600000 },
    { id: '1004', name: 'Orion Trading FZE', roles: ['Cliente'], city: 'Dubai/AE', loc: 'CD_CAMPINAS', sanctioned: true, credit: 100000 },
    { id: '1101', name: 'Mercado Bom Preço Ltda.', roles: ['Destinatário'], city: 'Rio de Janeiro/RJ', loc: 'CLI_RIO', sanctioned: false },
    { id: '1102', name: 'Farmácias Vida S.A.', roles: ['Destinatário'], city: 'Belo Horizonte/MG', loc: 'CLI_BH', sanctioned: false },
    { id: '1103', name: 'Construtora Pilar Ltda.', roles: ['Destinatário'], city: 'Curitiba/PR', loc: 'CLI_CURITIBA', sanctioned: false },
    { id: '1104', name: 'Hanseatic Kaffee Import GmbH', roles: ['Destinatário'], city: 'Hamburgo/DE', loc: 'CLI_HAMBURGO', sanctioned: false },
    { id: '1105', name: 'Tintas Aurora Comércio Ltda.', roles: ['Destinatário'], city: 'Porto Alegre/RS', loc: 'CLI_POA', sanctioned: false },
    { id: '1106', name: 'Atacadão Goiás Distribuidora', roles: ['Destinatário'], city: 'Goiânia/GO', loc: 'CLI_GOIANIA', sanctioned: false },
    { id: '1107', name: 'Distribuidora Bahia Norte', roles: ['Destinatário'], city: 'Salvador/BA', loc: 'CLI_SALVADOR', sanctioned: false },
    { id: '1108', name: 'Sunshine Foods Inc.', roles: ['Destinatário'], city: 'Miami/US', loc: 'CLI_MIAMI', sanctioned: false },
    { id: '2001', name: 'TransRápido Logística', roles: ['Transportadora'], city: 'Campinas/SP', scac: 'TRPD', modes: ['RD'], sanctioned: false },
    { id: '2002', name: 'Expresso Serra Sul', roles: ['Transportadora'], city: 'Curitiba/PR', scac: 'EXSS', modes: ['RD'], sanctioned: false },
    { id: '2003', name: 'RodoNorte Cargas', roles: ['Transportadora'], city: 'Belo Horizonte/MG', scac: 'RDNC', modes: ['RD'], sanctioned: false },
    { id: '2004', name: 'Oceanus Line', roles: ['Transportadora'], city: 'Santos/SP', scac: 'OCNL', modes: ['SEA'], sanctioned: false },
    { id: '2005', name: 'Atlântica Shipping', roles: ['Transportadora'], city: 'Santos/SP', scac: 'ATSH', modes: ['SEA'], sanctioned: false },
    { id: '2006', name: 'AeroCarga Brasil', roles: ['Transportadora'], city: 'Guarulhos/SP', scac: 'ACBR', modes: ['AIR'], sanctioned: false },
    { id: '2007', name: 'EuroTrans Logistik GmbH', roles: ['Transportadora'], city: 'Roterdã/NL', scac: 'EUTL', modes: ['RD'], sanctioned: false }
  ],
  locs: [
    { id: 'CD_CAMPINAS', name: 'CD Alfa Campinas', type: 'Centro de distribuição', city: 'Campinas', uf: 'SP', country: 'BR', lat: -22.906, lon: -47.061, bp: '1001' },
    { id: 'FAB_JUNDIAI', name: 'Fábrica Química Paulista', type: 'Planta', city: 'Jundiaí', uf: 'SP', country: 'BR', lat: -23.186, lon: -46.884, bp: '1002' },
    { id: 'ARM_RIBEIRAO', name: 'Armazém Café Serra Verde', type: 'Armazém', city: 'Ribeirão Preto', uf: 'SP', country: 'BR', lat: -21.177, lon: -47.810, bp: '1003' },
    { id: 'HUB_SAOPAULO', name: 'Hub TMB São Paulo', type: 'Hub de transbordo', city: 'São Paulo', uf: 'SP', country: 'BR', lat: -23.550, lon: -46.633, bp: '' },
    { id: 'CLI_RIO', name: 'Mercado Bom Preço - CD Rio', type: 'Cliente', city: 'Rio de Janeiro', uf: 'RJ', country: 'BR', lat: -22.906, lon: -43.172, bp: '1101' },
    { id: 'CLI_BH', name: 'Farmácias Vida - CD BH', type: 'Cliente', city: 'Belo Horizonte', uf: 'MG', country: 'BR', lat: -19.917, lon: -43.934, bp: '1102' },
    { id: 'CLI_CURITIBA', name: 'Construtora Pilar - Canteiro', type: 'Cliente', city: 'Curitiba', uf: 'PR', country: 'BR', lat: -25.428, lon: -49.273, bp: '1103' },
    { id: 'CLI_POA', name: 'Tintas Aurora - Loja Central', type: 'Cliente', city: 'Porto Alegre', uf: 'RS', country: 'BR', lat: -30.035, lon: -51.218, bp: '1105' },
    { id: 'CLI_GOIANIA', name: 'Atacadão Goiás - CD', type: 'Cliente', city: 'Goiânia', uf: 'GO', country: 'BR', lat: -16.686, lon: -49.264, bp: '1106' },
    { id: 'CLI_SALVADOR', name: 'Distribuidora Bahia Norte', type: 'Cliente', city: 'Salvador', uf: 'BA', country: 'BR', lat: -12.971, lon: -38.501, bp: '1107' },
    { id: 'PORTO_SANTOS', name: 'Porto de Santos - Terminal 1', type: 'Porto', city: 'Santos', uf: 'SP', country: 'BR', lat: -23.960, lon: -46.333, bp: '', unlocode: 'BRSSZ' },
    { id: 'AERO_GRU', name: 'Aeroporto de Guarulhos - TECA', type: 'Aeroporto', city: 'Guarulhos', uf: 'SP', country: 'BR', lat: -23.435, lon: -46.473, bp: '', iata: 'GRU' },
    { id: 'PORTO_RTM', name: 'Port of Rotterdam - Maasvlakte', type: 'Porto', city: 'Roterdã', uf: '', country: 'NL', lat: 51.950, lon: 4.140, bp: '', unlocode: 'NLRTM' },
    { id: 'PORTO_HAM', name: 'Hafen Hamburg - CTA', type: 'Porto', city: 'Hamburgo', uf: '', country: 'DE', lat: 53.540, lon: 9.940, bp: '', unlocode: 'DEHAM' },
    { id: 'CLI_HAMBURGO', name: 'Hanseatic Kaffee - Lager', type: 'Cliente', city: 'Hamburgo', uf: '', country: 'DE', lat: 53.575, lon: 10.020, bp: '1104' },
    { id: 'AERO_FRA', name: 'Frankfurt Airport - CargoCity', type: 'Aeroporto', city: 'Frankfurt', uf: '', country: 'DE', lat: 50.037, lon: 8.562, bp: '', iata: 'FRA' },
    { id: 'AERO_MIA', name: 'Miami Intl. Airport - Cargo', type: 'Aeroporto', city: 'Miami', uf: '', country: 'US', lat: 25.795, lon: -80.290, bp: '', iata: 'MIA' },
    { id: 'CLI_MIAMI', name: 'Sunshine Foods - Warehouse', type: 'Cliente', city: 'Miami', uf: '', country: 'US', lat: 25.830, lon: -80.330, bp: '1108' }
  ],
  zones: [
    { id: 'Z_SP', name: 'Estado de São Paulo', locs: ['CD_CAMPINAS', 'FAB_JUNDIAI', 'ARM_RIBEIRAO', 'HUB_SAOPAULO', 'PORTO_SANTOS', 'AERO_GRU'] },
    { id: 'Z_SUDESTE', name: 'Sudeste (RJ/MG)', locs: ['CLI_RIO', 'CLI_BH'] },
    { id: 'Z_SUL', name: 'Sul (PR/RS)', locs: ['CLI_CURITIBA', 'CLI_POA'] },
    { id: 'Z_CO_NE', name: 'Centro-Oeste e Nordeste', locs: ['CLI_GOIANIA', 'CLI_SALVADOR'] },
    { id: 'Z_EU', name: 'Europa (NL/DE)', locs: ['PORTO_RTM', 'PORTO_HAM', 'CLI_HAMBURGO', 'AERO_FRA'] },
    { id: 'Z_US', name: 'Estados Unidos (FL)', locs: ['AERO_MIA', 'CLI_MIAMI'] }
  ],
  // Meios de transporte (Customizing) — cap. 3.3.1
  mtrs: [
    { id: 'VUC', desc: 'Veículo urbano de carga', mode: 'RD', speed: 55, capKg: 3500, capM3: 20, capPal: 8, costKm: 2.2, costFix: 250 },
    { id: 'TRUCK', desc: 'Caminhão truck (3 eixos)', mode: 'RD', speed: 65, capKg: 14000, capM3: 50, capPal: 14, costKm: 3.8, costFix: 450 },
    { id: 'CARRETA', desc: 'Carreta (semirreboque 5 eixos)', mode: 'RD', speed: 65, capKg: 27000, capM3: 90, capPal: 28, costKm: 5.5, costFix: 800 },
    { id: 'NAVIO', desc: 'Navio porta-contêiner', mode: 'SEA', speed: 30, capKg: 0, capM3: 0, capPal: 0, costKm: 0, costFix: 0 },
    { id: 'AVIAO', desc: 'Aeronave cargueira', mode: 'AIR', speed: 780, capKg: 0, capM3: 0, capPal: 0, costKm: 0, costFix: 0 }
  ],
  // Recursos de veículo (multi-recursos) — cap. 3.3.3
  resources: [
    { id: 'VUC-CPS', mtr: 'VUC', home: 'CD_CAMPINAS', qty: 2, desc: 'Frota VUC Campinas' },
    { id: 'TRUCK-CPS', mtr: 'TRUCK', home: 'CD_CAMPINAS', qty: 3, desc: 'Frota truck Campinas' },
    { id: 'CARRETA-CPS', mtr: 'CARRETA', home: 'CD_CAMPINAS', qty: 4, desc: 'Frota carreta Campinas' },
    { id: 'CARRETA-JDI', mtr: 'CARRETA', home: 'FAB_JUNDIAI', qty: 2, desc: 'Frota carreta Jundiaí' },
    { id: 'TRUCK-RTM', mtr: 'TRUCK', home: 'PORTO_RTM', qty: 3, desc: 'Frota truck Europa (Roterdã)' },
    { id: 'TRUCK-HAM', mtr: 'TRUCK', home: 'PORTO_HAM', qty: 2, desc: 'Frota truck Hamburgo' },
    { id: 'CARRETA-HAM', mtr: 'CARRETA', home: 'PORTO_HAM', qty: 1, desc: 'Frota carreta Hamburgo' }
  ],
  products: [
    { id: 'MAT-100', desc: 'Biscoito recheado (cx 24 un)', uom: 'CX', kg: 6, m3: 0.03, perPal: 60, value: 45, group: 'Alimentos', dg: null },
    { id: 'MAT-110', desc: 'Café torrado em grão (saca 30 kg)', uom: 'SC', kg: 30, m3: 0.05, perPal: 24, value: 520, group: 'Alimentos', dg: null },
    { id: 'MAT-200', desc: 'Shampoo 400 ml (cx 12 un)', uom: 'CX', kg: 8, m3: 0.02, perPal: 70, value: 120, group: 'Higiene', dg: null },
    { id: 'MAT-300', desc: 'Tinta acrílica lata 18 L', uom: 'LT', kg: 22, m3: 0.025, perPal: 36, value: 260, group: 'Químicos', dg: { un: 'UN1263', cls: '3', pg: 'III', name: 'Tinta (inflamável)' } },
    { id: 'MAT-310', desc: 'Peróxido de hidrogênio 50% (bombona)', uom: 'BB', kg: 25, m3: 0.03, perPal: 30, value: 150, group: 'Químicos', dg: { un: 'UN2014', cls: '5.1', pg: 'II', name: 'Peróxido de hidrogênio' } },
    { id: 'MAT-320', desc: 'Fogos de artifício (cx)', uom: 'CX', kg: 12, m3: 0.05, perPal: 40, value: 400, group: 'Químicos', dg: { un: 'UN0336', cls: '1.4G', pg: '-', name: 'Fogos de artifício' } },
    { id: 'MAT-400', desc: 'Cimento CP-II saco 50 kg', uom: 'SC', kg: 50, m3: 0.035, perPal: 40, value: 38, group: 'Construção', dg: null },
    { id: 'MAT-500', desc: 'Medicamentos (cx embarque)', uom: 'CX', kg: 4, m3: 0.02, perPal: 100, value: 900, group: 'Farma', dg: null }
  ],
  // Rotas de transporte (lanes) com transportadoras — cap. 3.2.3 / 6.5
  lanes: [
    { id: 'L-SP-SP', from: 'Z_SP', to: 'Z_SP', mode: 'RD', carriers: [{ bp: '2001', prio: 1, costKm: 4.6 }, { bp: '2003', prio: 2, costKm: 4.9 }] },
    { id: 'L-SP-SE', from: 'Z_SP', to: 'Z_SUDESTE', mode: 'RD', carriers: [{ bp: '2001', prio: 1, costKm: 5.2 }, { bp: '2003', prio: 2, costKm: 4.8 }, { bp: '2002', prio: 3, costKm: 5.6 }] },
    { id: 'L-SP-SUL', from: 'Z_SP', to: 'Z_SUL', mode: 'RD', carriers: [{ bp: '2002', prio: 1, costKm: 4.9 }, { bp: '2001', prio: 2, costKm: 5.3 }] },
    { id: 'L-SP-CONE', from: 'Z_SP', to: 'Z_CO_NE', mode: 'RD', carriers: [{ bp: '2003', prio: 1, costKm: 5.0 }, { bp: '2001', prio: 2, costKm: 5.4 }] },
    { id: 'L-EU-EU', from: 'Z_EU', to: 'Z_EU', mode: 'RD', carriers: [{ bp: '2007', prio: 1, costKm: 2.1 }] },
    { id: 'L-SSZ-EU', from: 'PORTO_SANTOS', to: 'Z_EU', mode: 'SEA', carriers: [{ bp: '2004', prio: 1 }, { bp: '2005', prio: 2 }] },
    { id: 'L-GRU-FRA', from: 'AERO_GRU', to: 'AERO_FRA', mode: 'AIR', carriers: [{ bp: '2006', prio: 1 }] },
    { id: 'L-GRU-MIA', from: 'AERO_GRU', to: 'AERO_MIA', mode: 'AIR', carriers: [{ bp: '2006', prio: 1 }] },
    { id: 'L-US-US', from: 'Z_US', to: 'Z_US', mode: 'RD', carriers: [{ bp: '2001', prio: 1, costKm: 6 }] }
  ],
  // Programações (schedules) — cap. 3.2.4 / 6.4
  schedules: [
    { id: 'SCH-OCNL-SSZ-RTM', carrier: '2004', mode: 'SEA', from: 'PORTO_SANTOS', to: 'PORTO_RTM', weekday: 3, depHour: 18, transitH: 17 * 24, cutoffH: 48, capKg: 400000, capM3: 1200, voyagePrefix: 'OC' },
    { id: 'SCH-ATSH-SSZ-HAM', carrier: '2005', mode: 'SEA', from: 'PORTO_SANTOS', to: 'PORTO_HAM', weekday: 5, depHour: 20, transitH: 19 * 24, cutoffH: 48, capKg: 350000, capM3: 1000, voyagePrefix: 'AT' },
    { id: 'SCH-ACBR-GRU-FRA', carrier: '2006', mode: 'AIR', from: 'AERO_GRU', to: 'AERO_FRA', weekday: -1, depHour: 23, transitH: 12, cutoffH: 6, capKg: 18000, capM3: 110, voyagePrefix: 'AC 8' },
    { id: 'SCH-ACBR-GRU-MIA', carrier: '2006', mode: 'AIR', from: 'AERO_GRU', to: 'AERO_MIA', weekday: -1, depHour: 22, transitH: 9, cutoffH: 6, capKg: 15000, capM3: 90, voyagePrefix: 'AC 4' }
  ],
  // Rotas padrão (default routes) para ocean/air — cap. 3.2.6
  defaultRoutes: [
    { id: 'DR-SEA-EU', mode: 'SEA', originGw: 'PORTO_SANTOS', destCountry: 'DE', destGw: 'PORTO_HAM' },
    { id: 'DR-SEA-NL', mode: 'SEA', originGw: 'PORTO_SANTOS', destCountry: 'NL', destGw: 'PORTO_RTM' },
    { id: 'DR-AIR-DE', mode: 'AIR', originGw: 'AERO_GRU', destCountry: 'DE', destGw: 'AERO_FRA' },
    { id: 'DR-AIR-US', mode: 'AIR', originGw: 'AERO_GRU', destCountry: 'US', destGw: 'AERO_MIA' }
  ],
  // Tabelas de taxas (rate tables) e escalas — cap. 9.1.4 / 9.1.5
  rateTables: [
    { id: 'RT-RD-FRETE-PESO', desc: 'Frete-peso rodoviário (R$/t)', curr: 'BRL', base1: 'km', scale1: [150, 400, 700, 1000, 1500, 2500], base2: 't', scale2: [3, 8, 15, 30], unit: 't',
      values: [[95, 80, 70, 62], [150, 128, 110, 98], [215, 185, 160, 140], [280, 240, 205, 180], [370, 315, 270, 240], [520, 450, 390, 350]], min: 450 },
    { id: 'RT-RD-SUL', desc: 'Frete-peso Expresso Serra Sul (R$/t)', curr: 'BRL', base1: 'km', scale1: [400, 800, 1300, 2000], base2: 't', scale2: [8, 15, 30], unit: 't',
      values: [[135, 118, 104], [205, 178, 158], [300, 262, 230], [420, 370, 330]], min: 500 },
    { id: 'RT-RD-NORTE', desc: 'Frete-peso RodoNorte (R$/t)', curr: 'BRL', base1: 'km', scale1: [300, 700, 1200, 2500], base2: 't', scale2: [8, 15, 30], unit: 't',
      values: [[120, 104, 92], [200, 172, 150], [290, 255, 225], [480, 420, 375]], min: 480 },
    { id: 'RT-EU-ROAD', desc: 'EuroTrans Distribution (EUR/t)', curr: 'EUR', base1: 'km', scale1: [100, 300, 800], base2: 't', scale2: [5, 15, 30], unit: 't',
      values: [[38, 30, 24], [62, 50, 41], [110, 92, 78]], min: 150 },
    { id: 'RT-SEA-WM', desc: 'Frete marítimo LCL por W/M (USD convertido em BRL)', curr: 'BRL', base1: 'wm', scale1: [15, 50, 200, 99999], unit: 'wm',
      values: [520, 470, 430, 400], min: 1500 },
    { id: 'RT-AIR-KG', desc: 'Frete aéreo por kg taxável (R$/kg)', curr: 'BRL', base1: 'kgchg', scale1: [45, 100, 300, 500, 1000, 99999], unit: 'kgchg',
      values: [24.5, 21.0, 18.4, 16.9, 15.2, 13.8], min: 650 },
    { id: 'RT-VENDA-RD', desc: 'Tabela de venda rodoviária (R$/t)', curr: 'BRL', base1: 'km', scale1: [150, 400, 700, 1000, 1500, 2500], base2: 't', scale2: [3, 8, 15, 30], unit: 't',
      values: [[140, 120, 104, 95], [215, 185, 160, 145], [305, 265, 230, 205], [395, 340, 295, 260], [520, 450, 390, 345], [730, 640, 560, 500]], min: 650 }
  ],
  // Tipos de encargo (Customizing) — cap. 9.1.3
  chargeTypes: [
    { id: 'FB00', desc: 'Frete básico / frete-peso' },
    { id: 'FUEL', desc: 'Sobretaxa de combustível' },
    { id: 'GRIS', desc: 'GRIS – gerenciamento de risco' },
    { id: 'ADVL', desc: 'Ad valorem' },
    { id: 'PEDG', desc: 'Pedágio' },
    { id: 'STOP', desc: 'Taxa por parada adicional' },
    { id: 'OCFB', desc: 'Frete marítimo básico' },
    { id: 'BAF', desc: 'Bunker adjustment factor' },
    { id: 'THC', desc: 'Terminal handling charge' },
    { id: 'DOCF', desc: 'Taxa de documentação (B/L, AWB)' },
    { id: 'AIRF', desc: 'Frete aéreo' },
    { id: 'FSC', desc: 'Fuel surcharge aéreo' },
    { id: 'SSC', desc: 'Security surcharge' },
    { id: 'MANU', desc: 'Encargo manual' }
  ],
  // Acordos de frete (compra) e acordos de expedição (venda) com folhas de cálculo — cap. 9.1.1/9.1.2 e 11.1.1
  agreements: [
    { id: 'FA-2001-RD', kind: 'FA', party: '2001', desc: 'Acordo de frete TransRápido – rodoviário', mode: 'RD', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-RD-FRETE-PESO' },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 12, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'GRIS', kind: 'PCTVAL', rate: 0.15 },
        { n: 50, ct: 'PEDG', kind: 'PERKM', rate: 0.42 },
        { n: 60, ct: 'STOP', kind: 'PERSTOP', rate: 180 }
      ] },
    { id: 'FA-2002-RD', kind: 'FA', party: '2002', desc: 'Acordo de frete Expresso Serra Sul', mode: 'RD', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-RD-SUL' },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 10, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'GRIS', kind: 'PCTVAL', rate: 0.12 },
        { n: 50, ct: 'PEDG', kind: 'PERKM', rate: 0.40 }
      ] },
    { id: 'FA-2003-RD', kind: 'FA', party: '2003', desc: 'Acordo de frete RodoNorte Cargas', mode: 'RD', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-RD-NORTE' },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 14, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'ADVL', kind: 'PCTVAL', rate: 0.10 },
        { n: 50, ct: 'STOP', kind: 'PERSTOP', rate: 150 }
      ] },
    { id: 'FA-2007-RD', kind: 'FA', party: '2007', desc: 'Freight agreement EuroTrans (EUR)', mode: 'RD', curr: 'EUR', from: 'Z_EU', to: 'Z_EU', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-EU-ROAD' },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 8, refFrom: 20, refTo: 20 }
      ] },
    { id: 'FA-2004-SEA', kind: 'FA', party: '2004', desc: 'Acordo Oceanus Line – LCL Santos/Europa', mode: 'SEA', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'OCFB', kind: 'TAB', table: 'RT-SEA-WM' },
        { n: 30, ct: 'BAF', kind: 'PCT', rate: 18, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'THC', kind: 'FIX', rate: 1450 },
        { n: 50, ct: 'DOCF', kind: 'FIX', rate: 380 }
      ] },
    { id: 'FA-2005-SEA', kind: 'FA', party: '2005', desc: 'Acordo Atlântica Shipping – LCL', mode: 'SEA', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'OCFB', kind: 'TAB', table: 'RT-SEA-WM', factor: 0.96 },
        { n: 30, ct: 'BAF', kind: 'PCT', rate: 21, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'THC', kind: 'FIX', rate: 1380 },
        { n: 50, ct: 'DOCF', kind: 'FIX', rate: 350 }
      ] },
    { id: 'FA-2006-AIR', kind: 'FA', party: '2006', desc: 'Acordo AeroCarga – carga geral', mode: 'AIR', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'AIRF', kind: 'TAB', table: 'RT-AIR-KG' },
        { n: 30, ct: 'FSC', kind: 'PERKGCHG', rate: 2.9 },
        { n: 40, ct: 'SSC', kind: 'PERKGCHG', rate: 0.75 },
        { n: 50, ct: 'DOCF', kind: 'FIX', rate: 210 }
      ] },
    { id: 'FWA-GERAL', kind: 'FWA', party: '*', desc: 'Acordo de expedição padrão (tabela de balcão)', mode: '*', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-VENDA-RD', modes: ['RD'] },
        { n: 21, ct: 'OCFB', kind: 'TAB', table: 'RT-SEA-WM', factor: 1.35, modes: ['SEA'] },
        { n: 22, ct: 'AIRF', kind: 'TAB', table: 'RT-AIR-KG', factor: 1.3, modes: ['AIR'] },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 13, refFrom: 20, refTo: 22 },
        { n: 40, ct: 'GRIS', kind: 'PCTVAL', rate: 0.20 },
        { n: 50, ct: 'ADVL', kind: 'PCTVAL', rate: 0.25 },
        { n: 60, ct: 'DOCF', kind: 'FIX', rate: 180 }
      ] },
    { id: 'FWA-1001', kind: 'FWA', party: '1001', desc: 'Contrato Alfa Bens de Consumo 2026', mode: 'RD', curr: 'BRL', from: '*', to: '*', validFrom: '2026-01-01', validTo: '2026-12-31',
      sheet: [
        { n: 20, ct: 'FB00', kind: 'TAB', table: 'RT-VENDA-RD', factor: 0.92 },
        { n: 30, ct: 'FUEL', kind: 'PCT', rate: 11, refFrom: 20, refTo: 20 },
        { n: 40, ct: 'GRIS', kind: 'PCTVAL', rate: 0.15 },
        { n: 50, ct: 'STOP', kind: 'PERSTOP', rate: 220 }
      ] }
  ],
  // Customizing / perfis — cap. 2.3, 5.2, 5.6, 6.6
  settings: {
    fx: { EUR: 6.05, USD: 5.45, BRL: 1 },
    docTypes: {
      FWO: [{ id: 'ZFWO', desc: 'Ordem de expedição rodoviária', mode: 'RD' }, { id: 'ZFWS', desc: 'Ordem de expedição marítima', mode: 'SEA' }, { id: 'ZFWA', desc: 'Ordem de expedição aérea', mode: 'AIR' }],
      FU: [{ id: 'ZFU1', desc: 'Unidade de frete padrão' }],
      FO: [{ id: 'ZFOR', desc: 'Ordem de frete rodoviária' }],
      FB: [{ id: 'ZFBS', desc: 'Booking de frete marítimo' }, { id: 'ZFBA', desc: 'Booking de frete aéreo' }],
      FSD: [{ id: 'ZFSD', desc: 'Doc. de liquidação de frete' }],
      FWSD: [{ id: 'ZFWS', desc: 'Doc. de liquidação de expedição' }]
    },
    fubr: { id: 'FUBR-PADRAO', strategy: 'REQ', splitKg: 24000, splitM3: 85, splitPal: 26, critical: 'kg', autoBuild: false },
    planning: { id: 'PP-PADRAO', wFix: 1, wKm: 1, wLate: 400, maxStops: 5, iterations: 200, startHour: 8, handlingH: 1 },
    carrierSel: { strategy: 'COST', useAgreements: true },
    tendering: { id: 'TP-PADRAO', steps: [{ type: 'P2P', hours: 4 }, { type: 'BROADCAST', hours: 8, max: 3 }], priceLimitPct: 115 },
    incompat: [
      { a: 'grp:Alimentos', b: 'dg:3', desc: 'Alimentos x inflamáveis (classe 3)' },
      { a: 'grp:Alimentos', b: 'dg:5.1', desc: 'Alimentos x oxidantes (classe 5.1)' },
      { a: 'grp:Farma', b: 'dg:3', desc: 'Farma x inflamáveis (classe 3)' },
      { a: 'dg:3', b: 'dg:5.1', desc: 'Segregação: classe 3 x classe 5.1' }
    ],
    invoiceTolerancePct: 2
  }
});
