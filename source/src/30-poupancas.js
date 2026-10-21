/* ============ 06–08 · Poupanças: total + objetivo, Valor fixo, Placar do Bem, Troco inteligente ============ */

/* ---------- utilitários ---------- */
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const dataLonga = d => `${pad2(d.getDate())} de ${cap1(MESES[d.getMonth()])} ${d.getFullYear()}`;
const dataCurta = d => `${pad2(d.getDate())} de ${MESES[d.getMonth()]}`;
const hoje = () => new Date();
function proxDomingo(from = hoje(), add = 0) { const d = new Date(from); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7) + add); return d; }
function domingoDoMes(y, m, ultimo) { if (ultimo) { const d = new Date(y, m + 1, 0); d.setDate(d.getDate() - d.getDay()); return d; } const d = new Date(y, m, 1); d.setDate(1 + ((7 - d.getDay()) % 7)); return d; }
function proxDeposito(freq) {
  const t = hoje();
  if (freq === 'sem') return proxDomingo(t);
  if (freq === 'quinz') return proxDomingo(t, 7);
  const ult = freq === 'mesFim';
  let d = domingoDoMes(t.getFullYear(), t.getMonth(), ult); if (d <= t) d = domingoDoMes(t.getFullYear(), t.getMonth() + 1, ult); return d;
}
const FREQ = { sem: ['Semanalmente', 'Depósito feito toda semana'], quinz: ['Quinzenalmente', 'Depósito feito a cada 2 semanas'], mesIni: ['Mensalmente', 'Depósito feito no primeiro domingo do mês'], mesFim: ['Mensalmente', 'Depósito feito no último domingo do mês'] };
const freqTxt = f => ({ sem: 'Semanalmente, todo domingo', quinz: 'Quinzenalmente, a cada 2 domingos', mesIni: 'Mensalmente no primeiro domingo do mês', mesFim: 'Mensalmente no último domingo do mês' }[f] || '');
const valorLabel = f => ({ sem: 'Valor todo domingo', quinz: 'Valor a cada 2 domingos', mesIni: 'Valor todo primeiro domingo do mês', mesFim: 'Valor todo último domingo do mês' }[f] || 'Valor do depósito');

const TEAMS_A = [['athletico', 'Athletico Paranaense', 'Paraná - Brasil'], ['atleticomg', 'Atlético Mineiro', 'Minas Gerais - Brasil'], ['bahia', 'Bahia', 'Bahia - Brasil'], ['botafogo', 'Botafogo', 'Rio de Janeiro - Brasil'], ['chapecoense', 'Chapecoense', 'Santa Catarina - Brasil'], ['coritiba', 'Coritiba', 'Paraná - Brasil'], ['corinthians', 'Corinthians', 'São Paulo - Brasil'], ['cruzeiro', 'Cruzeiro', 'Minas Gerais - Brasil'], ['flamengo', 'Flamengo', 'Rio de Janeiro - Brasil'], ['fluminense', 'Fluminense', 'Rio de Janeiro - Brasil'], ['gremio', 'Grêmio', 'Rio Grande do Sul - Brasil'], ['internacional', 'Internacional', 'Rio Grande do Sul - Brasil'], ['mirassol', 'Mirassol', 'São Paulo - Brasil'], ['palmeiras', 'Palmeiras', 'São Paulo - Brasil'], ['bragantino', 'Red Bull Bragantino', 'São Paulo - Brasil'], ['remo', 'Remo', 'Pará - Brasil'], ['santos', 'Santos', 'São Paulo - Brasil'], ['saopaulo', 'São Paulo', 'São Paulo - Brasil'], ['vasco', 'Vasco da Gama', 'Rio de Janeiro - Brasil'], ['vitoria', 'Vitória', 'Bahia - Brasil']];
/* Séries B e C conforme o Figma (20376:41809 e 20376:53643): só os clubes de Pernambuco */
const TEAMS_B = [['nautico', 'Náutico', 'Pernambuco - Brasil'], ['sport', 'Sport Recife', 'Pernambuco - Brasil']];
const TEAMS_C = [['santacruz', 'Santa Cruz', 'Pernambuco - Brasil']];
const SERIES = { A: TEAMS_A, B: TEAMS_B, C: TEAMS_C };
const TEAMS = [...TEAMS_A, ...TEAMS_B, ...TEAMS_C];
const serieDoTime = id => (TEAMS_B.some(t => t[0] === id) ? 'B' : TEAMS_C.some(t => t[0] === id) ? 'C' : 'A');
const team = id => { const t = TEAMS.find(x => x[0] === id) || TEAMS[3]; return { id: t[0], nome: t[1], uf: t[2] }; };
/* só a Série A tem escudo em PNG; B e C usam um círculo com as iniciais do clube */
const CRESTS = new Set(TEAMS.map(t => t[0]));
const crest = (id, s = 48) => CRESTS.has(id)
  ? `<img src="assets/t-${id}.png" alt="" width="${s}" height="${s}" style="border-radius:50%;flex:none;background:#f3f3f3">`
  : `<span aria-hidden="true" style="width:${s}px;height:${s}px;border-radius:50%;flex:none;background:var(--primary-lighter);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(s * 0.3)}px">${esc(sigla((TEAMS.find(t => t[0] === id) || ['', '?'])[1]))}</span>`;
/* duas letras: iniciais de duas palavras (Vila Nova → VN) ou as duas primeiras (Avaí → AV) */
const sigla = (nome) => { const p = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(x => x.length > 1);
  return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] || '?').slice(0, 2)).toUpperCase(); };
const teamRow = (id, extra = '') => { const t = team(id); return `${crest(id)}<div class="f1" style="text-align:left"><p class="b16 semi c-darker">${t.nome}</p><p class="b14 c-base">${t.uf}</p></div>${extra}`; };

function poupState() { return S.poup ??= { total: 0 }; }
const anyPoup = () => { const p = poupState(); return !!(p.vf || p.placar || p.troco); };
const srcTotal = k => { const p = poupState(); return (p[k] && p[k].total) || 0; };
const poupTotal = () => srcTotal('vf') + srcTotal('placar') + srcTotal('troco');
const contasOk = () => !!(S.origem && S.destino);

/* dialogo de confirmação */
function confirmDlg({ icon = 'circle-alert', tone = 'warning', title, text, ok, okAct, okV = '', cancel = 'Manter poupança', cancelAct = 'dlgClose', extra = '' }) {
  const bg = { warning: 'var(--warning-bg)', danger: 'var(--danger-bg)', success: 'var(--success-bg)', info: 'var(--primary-lighter)' }[tone];
  const fg = { warning: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)', info: 'var(--primary)' }[tone];
  openDialog(`<span class="ico-c" style="background:${bg};color:${fg}">${ic(icon, 22)}</span><p class="h3 c-darker">${title}</p><p class="b14 c-base">${text}</p>${extra}${btn(ok, { v: okV, act: okAct })}${btn(cancel, { v: 'o', act: cancelAct })}`);
}
GLOBAL_ACTS.dlgClose = () => closeTopOverlay();

/* tela introdutória (Configure o valor fixo / Placar / Troco) */
function introScreen({ title, text, bullets, act, close = true }) {
  return `${statusBar()}<img src="assets/curve.png" alt="" style="position:absolute;left:-60px;top:-40px;width:520px;opacity:.6;filter:invert(1) brightness(.85);pointer-events:none">
  <div class="ah"><button type="button" class="bkb" data-back aria-label="${close ? 'Fechar' : 'Voltar'}">${ic(close ? 'x' : 'chevron-left', 24)}</button></div>
  <div class="col g4 px5" style="flex:1;position:relative;justify-content:flex-end;padding-bottom:20px">
    <img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40">
    <p class="h1 c-darker">${title}</p><p class="b16 c-dark">${text}</p>
    ${bullets.map(([i, t]) => `<div class="row g3"><span class="ico-c sm">${ic(i, 16)}</span><p class="b14 c-dark">${t}</p></div>`).join('')}
    <div style="padding-top:12px">${btn('Configurar', { act })}</div>
  </div>${homeInd()}`;
}
/* tela de sucesso com a MIA */
function successScreen({ img, chip, chipIcon, title, text, label, act }) {
  return `${CURVE}${statusBar(true)}
  <div style="position:relative;z-index:2;flex:1;min-height:0">
    <img src="assets/logo-white.png" alt="Me Paguei" width="68" height="48" style="position:absolute;left:20px;top:8px">
    <img src="assets/${img}" alt="" style="position:absolute;left:50%;transform:translateX(-50%);bottom:0;height:min(400px,100%);width:auto">
    ${chip ? `<span class="chip glass" style="position:absolute;left:20px;bottom:110px;height:30px;font-weight:400;font-size:12px;background:rgba(18,18,18,.35)">${ic(chipIcon, 16)} ${chip}</span>` : ''}
  </div>
  <div class="sheet" style="background:#fff;flex:none"><div class="sheet-in" style="gap:12px;flex:none"><p class="h1 c-darker">${title}<span class="dot-blue">.</span></p><p class="b16 c-dark">${text}</p></div>
  <div class="sheet-foot" style="background:#fff">${btn(label, { act })}</div></div>${homeInd()}`;
}
/* confirma contas antes de Placar/Troco */
function confirmContasSheet(nome, nextAct) {
  const o = S.origem, d = S.destino, conta = BANKS[o.bank].contas[o.conta || 0];
  openSheet(`<p class="h4 c-darker">Confirme suas contas conectadas</p><p class="b14 c-dark">Estas contas movimentam todas as suas poupanças. Alterações aqui afetarão suas regras ativas. Podemos continuar com ${nome}?</p>
    <div class="card col g1"><span class="badge info" style="align-self:flex-start">Origem</span><div class="row g2" style="margin-top:4px">${bankIc(o.bank, true)}<p class="b16 semi c-darker">${BANKS[o.bank].curto}</p></div><p class="b14 c-dark">Agência | Conta: ${conta.ag} | ${conta.cc}</p><p class="b14 c-dark">Saldo Disponível: ${fmtBRL(conta.saldo)}</p></div>
    <div class="card col g1"><span class="badge success" style="align-self:flex-start">Destino</span><div class="row g2" style="margin-top:4px">${bankIc(d.bank, true)}<p class="b16 semi c-darker">${BANKS[d.bank].curto}</p></div><p class="b14 c-dark" style="overflow-wrap:anywhere">Chave Pix: ${esc(d.pix)}</p></div>
    <div class="card col g1 flat"><p class="b16 semi c-darker">Saldo de segurança</p><p class="b16 semi c-primary">${fmtBRL(S.saldoSeg || 0)}</p><p class="cap c-dark">O valor estabelecido garantirá que nenhuma movimentação seja realizada caso seu saldo esteja abaixo</p></div>`,
    { foot: btn(`Começar ${nome}`, { act: nextAct }) + `<button type="button" class="b14 semi lnk" data-act="toCentralCfg" style="align-self:center;padding:6px">Ir para Consentimento de Contas</button>` });
}
GLOBAL_ACTS.toCentralCfg = () => { closeOverlays(true); go('central', { tab: 'def' }); };
/* sem contas: aviso e encaminhamento ao Open Finance */
function startFeature(kind) {
  S.flags.afterContas = kind;
  if (contasOk()) { if (kind === 'vf') go('vfFreq'); else if (kind === 'placar') go('pbIntro'); else go('trIntro'); return; }
  go('poupContas', { kind });
}
screen('poupContas', {
  render: (p) => `${statusBar()}<img src="assets/curve.png" alt="" style="position:absolute;left:-60px;top:-40px;width:520px;opacity:.6;filter:invert(1) brightness(.85);pointer-events:none">
  <div class="ah"><button type="button" class="bkb" data-back aria-label="Fechar">${ic('x', 24)}</button></div>
  <div class="col g4 px5" style="flex:1;position:relative;justify-content:flex-end;padding-bottom:20px">
    <img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40">
    <p class="h1 c-darker">Configure ${{ vf: 'o valor fixo', placar: 'o Placar do Bem', troco: 'o Troco inteligente' }[p.kind]}</p>
    <p class="b16 c-dark">Antes de automatizar seus depósitos, precisamos concluir dois passos rápidos:</p>
    <div class="row g3"><span class="ico-c sm">${ic('landmark', 16)}</span><p class="b14 c-dark">Primeiro, você autoriza a conexão segura com seu banco.</p></div>
    <div class="row g3"><span class="ico-c sm">${ic('arrow-left-right', 16)}</span><p class="b14 c-dark">Depois, escolha a conta de onde o dinheiro sairá e a conta em que deseja recebê-lo.</p></div>
    <p class="cap c-base">As contas são de sua titularidade e você pode alterar sempre que desejar.</p>
    <div style="padding-top:8px">${btn('Configurar', { act: 'go' })}</div></div>${homeInd()}`,
  acts: { go: () => { if (S.contas.length >= 2) go('ofOrig'); else if (S.contas.length) go('ofBancos'); else go('of1'); } },
});
/* ao terminar Origem/Destino, voltar para a poupança que o usuário estava configurando */
(function () {
  const d = SCREENS.central; const home0 = d.acts.home;
  d.acts.home = () => {
    const k = S.flags.afterContas;
    if (k && contasOk()) {
      S.flags.afterContas = null;
      reset('poupar', { tab: 'total' }, 'back');
      later(() => openDialog(`<span class="ico-c" style="background:var(--success-bg);color:var(--success)">${ic('circle-check', 24)}</span><p class="h3 c-darker">Contas conectadas!</p><p class="b14 c-base">Suas contas foram conectadas. Lembre-se: seu dinheiro continua disponível e você pode resgatar o valor sempre que precisar.</p>${btn('Configurar poupança', { act: 'cfgAfter', attrs: `data-k="${k}"` })}`), 380);
      return;
    }
    home0();
  };
})();
GLOBAL_ACTS.cfgAfter = (b) => { closeOverlays(true); startFeature(b.dataset.k); };

/* ---------- intro e escolha ---------- */
screen('poupIntro', {
  render: () => `${statusBar()}<div class="ah"><button type="button" class="bkb" data-act="tabHome" aria-label="Voltar">${ic('chevron-left', 24)}</button></div>
  <div class="col g4 px5" style="flex:1;padding-bottom:20px">
    <div style="position:relative;margin-bottom:14px;flex:1;min-height:150px;display:flex"><div style="position:absolute;left:40px;right:40px;bottom:-14px;height:30px;border-radius:0 0 28px 28px;background:#d6ebfc"></div><div style="position:absolute;left:12px;right:12px;bottom:-6px;height:30px;border-radius:0 0 28px 28px;background:#c6e3fb"></div>
      <img src="assets/poup-intro.webp" alt="Mulher sorrindo olhando o celular" style="position:relative;width:100%;height:100%;min-height:0;object-fit:cover;border-radius:28px"></div>
    <p class="h1 c-darker" style="margin-top:auto">Poupe de forma automática, sem esforço<span class="dot-blue">.</span></p>
    <p class="b14 c-dark">Aqui você tem total controle pra transferir e retirar seus valores quando precisar.</p>
    ${btn('Explorar', { act: 'go' })}</div>${homeInd()}`,
  acts: { go: () => { S.flags.poupIntroSeen = true; reset('poupar', { tab: 'total' }, 'none'); go('poupEscolher'); }, tabHome: () => reset('home', {}, 'back') },
});
screen('poupEscolher', {
  cls: 'grad',
  render: () => ofScreen({ title: 'Como começar a guardar', body: `<div class="col">${[['vf', 'piggy-bank', 'Valor fixo', 'Valor fixo guardado continuamente.', 'var(--primary-lighter)', 'var(--primary)'], ['troco', 'coins', 'Troco inteligente', 'O troco das suas compras vira poupança.', 'var(--success-bg)', 'var(--success)'], ['placar', 'trophy', 'Placar do bem', 'Seu time ganha e você poupa automaticamente', 'var(--warning-bg)', 'var(--warning)']].map(([k, i, t, d, bg, fg]) => `<button type="button" class="li" data-act="pick" data-k="${k}">${`<span class="ico-c" style="background:${bg};color:${fg}">${ic(i, 20)}</span>`}<span class="lt col g1"><span class="b16 semi c-darker">${t}</span><span class="b14 c-base">${d}</span></span>${poupState()[k] ? '<span class="badge success">Ativa</span>' : ic('chevron-right', 20, 'c-base')}</button>`).join('')}</div>` }),
  acts: { pick: (b) => { const k = b.dataset.k; if (poupState()[k]) { reset('poupar', { tab: k }, 'back'); return; } stack.pop(); startFeature(k); } },
});

/* ---------- tela principal ---------- */
const PTABS = [['total', 'Total'], ['vf', 'Valor fixo'], ['placar', 'Placar do bem'], ['troco', 'Troco inteligente']];
function statusBadge(o) { if (!o) return ''; return o.pausada ? '<span class="badge warning">Pausada</span>' : '<span class="badge success">Ativa</span>'; }
function histItem({ icon, ok = true, t, sub, val, sub2, act = '', data = '' }) {
  return `<${act ? 'button type="button"' : 'div'} class="li" ${act ? `data-act="${act}" ${data}` : ''}><span class="ico-c" style="background:${ok ? 'var(--bg-lighter)' : 'var(--danger-bg)'};color:${ok ? 'var(--ty-dark)' : 'var(--danger)'}">${ic(ok ? icon : 'triangle-alert', 18)}</span>
    <span class="lt col"><span class="b14 bold c-darker">${t}</span><span class="cap c-base">${sub}</span></span>
    <span class="col" style="align-items:flex-end">${sub2 ? `<span class="row g2"><span class="cap c-base">${sub2}</span><span class="b14 bold num money" style="color:${ok ? 'var(--success)' : 'var(--ty-dark)'}">${val}</span></span>` : `<span class="b14 bold num money" style="color:${ok ? 'var(--success)' : 'var(--ty-dark)'}">${val}</span>`}</span></${act ? 'button' : 'div'}>`;
}
const emptyHist = `<div class="empty" style="padding:20px 16px"><span class="ico-c" style="background:var(--primary-lighter)">${ic('calendar-clock', 20)}</span><p class="b14 semi c-darker">Aguardando movimentação</p><p class="b14 c-base">O histórico detalhado da sua economia ficará visível após a primeira transferência.</p></div>`;
function fonteCard(k, icon, nome, bg, fg) {
  const o = poupState()[k]; const tot = poupTotal() || 1;
  if (!o) return `<button type="button" class="card col" data-act="ativar" data-k="${k}" style="flex:none;width:136px;height:116px;background:var(--bg-lighter);border-color:transparent;text-align:left;justify-content:space-between"><p class="cap semi c-dark">${nome}</p><span class="row g1 jc cap semi" style="background:#e3e3e3;border-radius:var(--r-full);height:26px;color:var(--ty-dark)">Ativar ${ic('plus', 14)}</span></button>`;
  return `<button type="button" class="card col g2" data-act="ptab" data-k="${k}" style="flex:none;width:136px;height:116px;text-align:left"><div class="row g2"><span class="ico-c sm" style="width:24px;height:24px;background:${bg};color:${fg}">${ic(icon, 14)}</span><p class="cap semi c-dark">${nome}</p></div>
    <p class="b16 bold c-darker num">${money(o.total || 0)}</p>${o.pausada ? '<span class="badge warning" style="align-self:flex-start">Pausada</span>' : `<p class="cap c-base">${Math.round((o.total || 0) / tot * 100)}% do total</p>`}</button>`;
}
function objetivoCard() {
  const o = S.objetivo;
  if (!o) return `<button type="button" class="card row g3" data-act="objNew" style="text-align:left"><span class="c-ia">${ic('goal', 26)}</span><span class="f1 col"><span class="b16 bold c-darker">Objetivo</span><span class="cap c-base">Defina um objetivo financeiro</span></span>${ic('chevron-right', 20, 'c-base')}</button>`;
  const pct = Math.min(1, poupTotalOuObj() / o.valor);
  return `<button type="button" class="card row g3" data-act="objOpen" style="text-align:left">${donut(pct, 44, 'var(--ia)', 6, `<span class="cap" style="font-size:10px">${Math.round(pct * 100)}%</span>`)}<span class="f1 col"><span class="b16 bold c-darker">${esc(o.nome)}</span><span class="cap c-base">Seu objetivo</span></span>${ic('chevron-right', 20, 'c-base')}</button>`;
}
const poupTotalOuObj = () => (S.objetivo && S.objetivo.atual != null && !anyPoup()) ? S.objetivo.atual : poupTotal();
function progressoChart() {
  const tot = poupTotal();
  if (!tot) return `<div class="card empty" style="padding:24px 16px"><span class="ico-c" style="background:var(--warning-bg);color:var(--warning)">${ic('calendar-clock', 20)}</span><p class="b14 semi c-darker">Progresso financeiro</p><p class="b14 c-base">O histórico detalhado da sua economia ficará visível após a primeira transferência.</p></div>`;
  const t = hoje(); const ms = [2, 1, 0].map(k => new Date(t.getFullYear(), t.getMonth() - k, 1));
  const vals = [tot * 0.35, tot * 0.67, tot]; const W = 311, H = 170, x = i => 34 + i * 120, y = v => 20 + (1 - v / (tot * 1.15)) * 120;
  const path = `M8 ${y(0) + 6} C ${x(0) - 10} ${y(vals[0]) + 30}, ${x(0) + 20} ${y(vals[0])}, ${x(0) + 40} ${y(vals[0]) - 6} S ${x(1) + 20} ${y(vals[1])}, ${x(2)} ${y(vals[2])} L ${W} ${y(vals[2]) - 10}`;
  return `<div class="card col g2"><div class="row g2"><p class="h2 c-darker num">${money(tot)}</p><span class="badge success money">+${fmtBRL(tot - vals[1], false)}</span></div>
    <p class="row g2 cap c-base">Acúmulo no mês atual <span style="width:5px;height:5px;border-radius:50%;background:var(--primary)"></span> <b class="c-dark">${cap1(MESES[t.getMonth()])} ${t.getFullYear()}</b></p>
    <svg width="100%" viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="Evolução do total poupado nos últimos 3 meses">
      <defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#43a5ee" stop-opacity=".35"/><stop offset="1" stop-color="#43a5ee" stop-opacity=".05"/></linearGradient></defs>
      <path d="${path} L ${W} ${H} L 8 ${H} Z" fill="url(#pg)"/><path d="${path}" fill="none" stroke="#1a3151" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${x(2)}" x2="${x(2)}" y1="${y(vals[2])}" y2="${H}" stroke="#121212" stroke-width="1.5"/>
      <circle cx="${x(2)}" cy="${y(vals[2])}" r="7" fill="#1a3151" stroke="#fff" stroke-width="2.5"/>
      <rect x="${x(2) - 36}" y="${y(vals[2]) - 42}" width="72" height="28" rx="6" fill="#1a3151"/><text x="${x(2)}" y="${y(vals[2]) - 23}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" class="money">R$ ${Math.round(tot).toLocaleString('pt-BR')}</text>
      ${ms.map((m, i) => `<text x="${x(i)}" y="${H + 18}" text-anchor="middle" font-size="13" fill="${i === 2 ? '#171717' : '#737373'}" font-weight="${i === 2 ? 700 : 400}">${MES3[m.getMonth()]} ${String(m.getFullYear()).slice(2)}</text>`).join('')}
    </svg></div>`;
}
function vfBody() {
  const o = poupState().vf;
  if (!o) return notCfg('vf');
  const H = o.hist || [];
  return `<div class="col g2"><p class="cap semi c-base">Próximo depósito</p><div class="row g2 b16 semi c-dark" style="background:var(--bg-lighter);border-radius:var(--r-xl);padding:12px 16px">${ic('calendar-clock', 18)} ${o.pausada ? 'Depósitos pausados' : dataLonga(proxDeposito(o.freq))}</div></div>
    <div class="col"><p class="cap semi c-base" style="padding:8px 0">Histórico</p>${H.length ? H.map(h => histItem({ icon: 'wallet', ok: h.ok, t: h.ok ? 'Poupança automática' : 'Falha por saldo insuficiente', sub: h.d, val: h.ok ? '+' + fmtBRL(o.valor, false) : 'R$ 0' })).join('') : emptyHist}</div>`;
}
function placarBody() {
  const o = poupState().placar;
  if (!o) return notCfg('placar');
  const t = team(o.time);
  /* adversário sai da mesma série do time escolhido, senão o confronto fica impossível */
  const mesma = SERIES[serieDoTime(o.time)].filter(x => x[0] !== o.time);
  const adv = team(mesma[o.time.length % mesma.length][0]);
  const H = o.hist || [];
  return `<div class="col g2"><p class="cap semi c-base">Time escolhido</p><div class="row g3" style="background:var(--bg-lighter);border-radius:var(--r-xl);padding:12px 16px">${teamRow(o.time)}</div></div>
    <div class="col g2"><p class="cap semi c-base">Próximo jogo</p><div class="row g2" style="background:var(--primary-lighter);border-radius:var(--r-xl);padding:12px 16px"><span class="b14 bold c-darker">${t.nome.split(' ')[0]}</span>${ic('x', 14)}<span class="b14 bold c-darker f1">${adv.nome.split(' ')[0]}</span><span class="b14 bold c-darker">${ddmm(proxDomingo())}</span><span class="row g1 b14 c-dark">${ic('circle', 10, 'c-primary')} 18:30</span></div></div>
    <div class="col"><p class="cap semi c-base" style="padding:8px 0">Histórico</p>${H.length ? H.map(h => `<div class="li"><span class="ico-c" style="background:${h.ok ? 'var(--bg-lighter)' : 'var(--danger-bg)'};color:${h.ok ? 'var(--ty-dark)' : 'var(--danger)'}">${ic(h.ok ? 'trophy' : 'triangle-alert', 18)}</span><span class="lt col"><span class="b14 bold c-darker">${h.ok ? 'Seu time venceu!' : 'Falha por saldo insuficiente'}</span><span class="cap c-base">${h.placar}</span></span><span class="col" style="align-items:flex-end"><span class="b14 bold num money" style="color:${h.ok ? 'var(--success)' : 'var(--ty-dark)'}">${h.ok ? '+' + fmtBRL(o.valor, false) : 'R$ 0'}</span><span class="cap c-base">${h.d}</span></span></div>`).join('') : emptyHist}</div>`;
}
function trocoBody() {
  const o = poupState().troco;
  if (!o) return notCfg('troco');
  const H = o.hist || [];
  return `<div class="col g2"><p class="cap semi c-base">Regra ativa</p><button type="button" class="row g3" data-act="cfg" style="background:var(--bg-lighter);border-radius:var(--r-xl);padding:14px 16px;text-align:left"><span class="ico-c" style="background:var(--btn-primary);color:#fff">${ic('coins', 18)}</span><span class="f1 col"><span class="b16 bold c-darker">${o.modo === 'fixo' ? 'Guardar valor fixo' : 'Arredondar centavos'}</span><span class="cap c-base">${o.modo === 'fixo' ? fmtBRL(o.fixo) + ' por compra' : 'Multiplicador: ' + (o.mult ? o.mult + 'x' : 'sem')}</span></span>${ic('chevron-right', 20, 'c-base')}</button></div>
    <div class="col"><p class="cap semi c-base" style="padding:8px 0">Histórico</p>${H.length ? H.map((h, k) => histItem({ icon: 'coins', ok: h.ok, t: h.ok ? h.loja : 'Falha por saldo insuficiente', sub: h.d, val: h.ok ? fmtBRL(h.pou) : 'R$ 0', sub2: h.ok ? fmtBRL(h.compra) : '', act: h.ok ? 'compra' : '', data: `data-k="${k}"` })).join('') : emptyHist}</div>`;
}
function notCfg(k) {
  const ICO = { vf: ['piggy-bank', 'var(--primary)', 'var(--primary-lighter)'], placar: ['trophy', 'var(--warning)', 'var(--warning-bg)'], troco: ['coins', 'var(--success)', 'var(--success-bg)'] }[k];
  const m = { vf: ['Configure o Valor fixo', 'Escolha quanto e com que frequência guardar. O Me Paguei transfere para o seu cofrinho no automático.', [['calendar-clock', 'Escolha a frequência dos depósitos.'], ['banknote', 'Defina o valor que quer guardar.']]], placar: ['Configure o Placar do bem', 'Una a torcida pelo seu clube ao hábito de guardar dinheiro. A cada vitória, o valor escolhido vai direto para a sua reserva.', [['flag', 'Escolha o seu time do coração.'], ['banknote', 'Defina o valor que quer poupar por vitória.']]], troco: ['Ative o Troco inteligente', 'Compre com o cartão de crédito da sua conta origem e o Me Paguei guarda o troco no seu cofrinho de forma automática.', [['coins', 'Escolha entre arredondar os centavos ou guardar um valor fixo por compra.'], ['rocket', 'Ative o multiplicador opcional para acelerar seus objetivos.']]] }[k];
  return `<div class="col g4" style="padding-top:8px"><span class="ico-c" style="width:56px;height:56px;background:${ICO[2]};color:${ICO[1]}">${ic(ICO[0], 26)}</span><p class="h2 c-darker">${m[0]}</p><p class="b14 c-dark">${m[1]}</p>${m[2].map(([i, t]) => `<div class="row g3"><span class="ico-c sm">${ic(i, 16)}</span><p class="b14 c-dark">${t}</p></div>`).join('')}${btn('Configurar', { act: 'ativar', attrs: `data-k="${k}"` })}</div>`;
}
screen('poupar', {
  render: (p) => {
    if (!anyPoup() && !S.flags.poupIntroSeen && !S.objetivo) return SCREENS.poupIntro.render(p);
    const tab = p.tab || 'total'; const P0 = poupState();
    const amount = tab === 'total' ? poupTotal() : srcTotal(tab);
    const flows = S.origem && S.destino ? `<span class="row g1">${bankIc(S.origem.bank, true).replace('bank-ic sm', 'bank-ic sm" style="width:22px;height:22px')}${ic('arrow-right', 12)}${bankIc(S.destino.bank, true).replace('bank-ic sm', 'bank-ic sm" style="width:22px;height:22px')}</span>` : '';
    const body = tab === 'total' ? `<div class="col g1"><p class="h3 c-darker">Fontes utilizadas</p><p class="b14 c-dark">Soma dos valores da poupança.</p></div>
        <div class="row g3" style="overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px 4px">${fonteCard('vf', 'piggy-bank', 'Valor fixo', 'var(--btn-primary)', '#fff')}${fonteCard('placar', 'trophy', 'Placar do bem', 'var(--warning)', '#fff')}${fonteCard('troco', 'coins', 'Troco inteligente', 'var(--success)', '#fff')}</div>
        ${objetivoCard()}<div class="col g1" style="margin-top:8px"><p class="h3 c-darker">Progresso financeiro</p><p class="b14 c-dark">Veja quanto você evoluiu até agora.</p></div>${progressoChart()}`
      : tab === 'vf' ? vfBody() : tab === 'placar' ? placarBody() : trocoBody();
    /* modalidade ainda não configurada: sem o hero de saldo, como no Figma (item 18) */
    const semCfg = tab !== 'total' && !P0[tab];
    return `<div class="scroll gscroll ${S.flags.hide ? 'hide-v' : ''}">
      <div style="position:relative">${CURVE}<div style="position:relative">${statusBar(true)}
        <div class="row jb" style="padding:8px 20px 0"><p class="h2" style="color:#fff">Poupanças</p><div class="row g2"><button type="button" class="hb" data-act="hideVals" aria-label="${S.flags.hide ? 'Mostrar valores' : 'Ocultar valores'}" style="width:32px;height:32px;border-radius:50%;background:var(--btn-primary);color:#fff;display:flex;align-items:center;justify-content:center">${ic(S.flags.hide ? 'eye-off' : 'eye', 18)}</button><button type="button" data-act="cfg" aria-label="Configurações" style="width:32px;height:32px;border-radius:50%;background:var(--btn-primary);color:#fff;display:flex;align-items:center;justify-content:center">${ic('settings', 18)}</button></div></div>
        <div class="chips" style="padding:20px 20px 0">${PTABS.map(([k, l]) => `<button type="button" class="chip glass ${k === tab ? 'on' : ''}" data-act="ptab" data-k="${k}">${l}</button>`).join('')}</div>
        ${semCfg ? '' : `<div class="row jb ais" style="padding:24px 20px 0;color:#fff"><div class="col g1"><p class="num" style="font-size:32px;line-height:40px;font-weight:700">${money(amount)}</p><p class="b14">Total economizado</p></div>${tab === 'total' ? flows : statusBadge(P0[tab])}</div>`}
        ${semCfg ? '' : `<p class="cap" style="padding:12px 20px 0;color:#fff">Última atualização em ${ddmmyyyy(hoje())}</p>`}</div></div>
      <div class="hbody" style="padding:24px 20px">${body}</div></div>${navbar('poupar')}`;
  },
  mount: (el, p) => { if (p.openObj) { p.openObj = false; later(() => SCREENS.poupar.acts.objNew(), 350); } },
  acts: {
    ptab: (b) => { stack[stack.length - 1].p.tab = b.dataset.k; stack[stack.length - 1].scroll = 0; render('none'); },
    hideVals: () => { S.flags.hide = !S.flags.hide; rerender(); },
    ativar: (b) => startFeature(b.dataset.k),
    cfg: () => { const t = P().tab || 'total'; if (t === 'total') go('central', { tab: 'def' }); else if (!poupState()[t]) startFeature(t); else go({ vf: 'vfCfg', placar: 'pbCfg', troco: 'trCfg' }[t]); },
    explore: () => go('poupEscolher'),
    go: () => SCREENS.poupIntro.acts.go(),
    tabHome: () => reset('home', {}, 'back'),
    compra: (b) => { const h = poupState().troco.hist[+b.dataset.k]; openSheet(`<div class="col g1 center" style="align-items:center"><p class="b14 c-base">Poupança gerada</p><p class="h1 c-success">${fmtBRL(h.pou)}</p><p class="cap c-base">${h.d}</p></div><div class="col">${[['Estabelecimento', h.loja], ['Compra original', fmtBRL(h.compra)], ['Arredondamento', fmtBRL(h.arr)], ['Multiplicador aplicado', h.mult ? `<span class="badge success">${h.mult}X</span>` : 'Sem multiplicador'], ['Cartão utilizado', '****1234 · ' + BANKS[(S.origem || { bank: 'nubank' }).bank].nome]].map(([a, v]) => `<div class="li jb"><span class="b14 c-base">${a}</span><span class="b14 semi c-darker" style="text-align:right">${v}</span></div>`).join('')}</div>`); },
    objNew: () => { if (!anyPoup()) { exigePoupanca(); return; } objWizard(); },
    objOpen: () => objSheet(),
  },
});

/* ---------- objetivo financeiro ---------- */
const OBJ_SUG = [['briefcase', 'Viagem'], ['car', 'Carro novo'], ['house', 'Reforma da casa'], ['cake', 'Aniversário'], ['gift', 'Presente pro filho']];
function objStep(step, edit) {
  const o = S.tmpObj;
  const dots = `<div class="row jc g1" style="padding-top:8px">${[1, 2, 3].map(k => `<i style="display:block;height:4px;border-radius:2px;width:${k === step ? 12 : 4}px;background:${k === step ? 'var(--primary)' : 'var(--border-light)'}"></i>`).join('')}</div>`;
  let html = '';
  if (step === 1) html = `${field({ id: 'onome', label: 'Escreva em poucas palavras o seu objetivo', ph: 'Nome do objetivo', bind: 'tmpObj.nome' })}<p class="cap semi c-base">Sugestões</p>
    <div class="row g2" style="flex-wrap:wrap">${OBJ_SUG.map(([i, s]) => `<button type="button" class="chip" data-act="osug" data-v="${s}" style="height:30px;font-size:12px;color:var(--ia);border-color:${o.nome === s ? 'var(--ia)' : '#d9c2f7'};background:${o.nome === s ? 'var(--ia-bg)' : '#fff'}">${ic(i, 14)} ${s}</button>`).join('')}</div>`;
  if (step === 2) html = `${field({ id: 'ovalor', label: 'Qual valor deseja atingir?', ph: 'R$ 0,00', bind: 'tmpObj.valorTxt', mask: 'brl' })}${miaInsight('Defina um valor possível', 'Lembre-se de definir um valor que respeite sua realidade atual para manter seu planejamento seguro e sem frustrações.')}`;
  if (step === 3) html = `${field({ id: 'odata', label: 'Data final do objetivo', ph: 'dd/mm/aaaa', bind: 'tmpObj.prazo', mask: 'data', icon: 'calendar-days', helper: 'Escolha quando quer atingir seu objetivo.' })}<p class="fld-h err" id="oerr" hidden>Escolha uma data a partir de amanhã.</p>`;
  const foot = edit ? btn('Salvar', { cls: 'lg js-next', act: 'objSave' }) + btn('Cancelar', { v: 'o', cls: 'lg', act: 'objCancel' }) : `${dots}${btn(step === 3 ? 'Salvar' : 'Próximo', { cls: 'lg js-next', act: 'objNext', attrs: `data-s="${step}"` })}`;
  return { html: `<div class="col g4" style="min-height:330px">${html}</div>`, foot };
}
function objValid(step) {
  const o = S.tmpObj || {};
  if (step === 1) return (o.nome || '').trim().length > 1;
  if (step === 2) return parseBRL(o.valorTxt) > 0;
  if (step === 3) { const m = (o.prazo || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (!m) return false; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d > hoje() && d.getDate() === +m[1]; }
}
function objWizard(step = 1, edit = false) {
  if (step === 1 && !edit) S.tmpObj = { nome: '', valorTxt: '', prazo: '' };
  closeOverlays(true);
  const { html, foot } = objStep(step, edit);
  const ov = openSheet(html, { foot });
  S.flags.objStep = step; S.flags.objEdit = edit;
  const upd = () => { const ok = objValid(step); $$('.js-next', ov).forEach(b => b.disabled = !ok); };
  ov.addEventListener('input', () => setTimeout(upd, 0)); upd();
  later(() => { const i = ov.querySelector('input'); if (i) i.focus(); }, 320);
}
Object.assign(GLOBAL_ACTS, {
  /* chip de sugestão preenche o input na hora (sem reabrir a folha, que zerava o tmpObj) */
  osug: (b) => {
    const v = b.dataset.v; S.tmpObj = S.tmpObj || {}; S.tmpObj.nome = v;
    const ov = b.closest('.ov') || document;
    const i = ov.querySelector('#onome');
    if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }
    $$('[data-act="osug"]', ov).forEach(c => { const on = c.dataset.v === v; c.style.borderColor = on ? 'var(--ia)' : '#d9c2f7'; c.style.background = on ? 'var(--ia-bg)' : '#fff'; });
  },
  objNext: (b) => { const s = +b.dataset.s; if (s < 3) objWizard(s + 1); else objFinish(); },
  objSave: () => { const o = S.objetivo; Object.assign(o, { nome: S.tmpObj.nome, valor: parseBRL(S.tmpObj.valorTxt), prazo: S.tmpObj.prazo }); closeOverlays(true); rerender(); toast('Alterações salvas!'); },
  objCancel: () => closeOverlays(),
});
function objFinish() {
  const o = S.tmpObj; S.objetivo = { nome: o.nome.trim(), valor: parseBRL(o.valorTxt), prazo: o.prazo };
  closeOverlays(true); rerender();
  openSheet(`<div class="col g3 center" style="align-items:center;padding-top:12px"><span class="ico-c" style="width:64px;height:64px;background:var(--ia-bg);color:var(--ia)">${ic('goal', 30)}</span><p class="h1 c-darker">Objetivo definido!</p><p class="b16 c-dark">Você acabou de dar o primeiro passo para tirar o seu plano do papel.</p>
    <div class="card flat col g1" style="text-align:left"><p class="b14 semi c-darker">Este objetivo será alimentado automaticamente.</p><p class="b14 c-dark">Sempre que você poupar através das outras ferramentas do Me Paguei, o saldo acumulado será contabilizado aqui e você verá seu gráfico de progresso avançar.</p></div></div>`, { foot: btn('Concluir', { cls: 'lg', act: 'objDone' }) });
}
GLOBAL_ACTS.objDone = () => closeOverlays();
const prazoLongo = s => { const m = (s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${+m[1]} de ${cap1(MESES[+m[2] - 1])} ${m[3]}` : s; };
function objSheet() {
  const o = S.objetivo; const tot = poupTotalOuObj(); const pct = Math.min(1, tot / o.valor);
  const done = pct >= 1;
  openSheet(`<div class="row jb"><span style="width:24px"></span><p class="h3 c-darker">${done ? `Parabéns, ${esc(firstName())}!` : esc(o.nome)}</p><button type="button" data-act="objMenu" aria-label="Opções do objetivo" style="color:var(--ty-dark)">${ic('ellipsis-vertical', 22)}</button></div>
    ${done ? `<p class="b14 c-base center">Você concluiu seu objetivo <b>${esc(o.nome)}</b>!</p>` : `<p class="row g2 jc b14 c-base">${ic('calendar', 16)} Conclusão em ${prazoLongo(o.prazo)}</p>`}
    <div class="row jc" style="padding:8px 0">${donut(pct, 180, 'var(--ia)', 26, `<span class="col g1" style="align-items:center"><span class="c-ia">${ic(done ? 'circle-check' : 'briefcase', 20)}</span><span class="h1 c-dark">${Math.round(pct * 100)}%</span></span>`)}</div>
    ${done ? '<span class="badge success" style="align-self:center">Concluído</span>' : ''}
    <div class="row jb" style="padding:0 16px"><div class="col center"><p class="b14 c-dark">Total poupado</p><p class="h2 c-darker num">${money(tot)}</p></div><div class="col center"><p class="b14 c-dark">Objetivo</p><p class="h2 c-darker num">${money(o.valor)}</p></div></div>`,
    { foot: done ? `<div class="row g3">${btn('Fechar', { v: 'o', act: 'objDone' })}${btn('Criar novo objetivo', { icon: 'plus', act: 'objRenew' })}</div>` : '' });
}
Object.assign(GLOBAL_ACTS, {
  objMenu: () => openSheet(`<button type="button" class="li" data-act="objEdit">${ic('pencil', 20)}<span class="lt b16 c-darker">Editar</span></button><button type="button" class="li" data-act="objDel" style="color:var(--danger)">${ic('trash-2', 20)}<span class="lt b16">Excluir objetivo</span></button>`),
  objEdit: () => { closeOverlays(true); go('objEdit'); },
  objDel: () => { closeOverlays(true); confirmDlg({ icon: 'trash-2', tone: 'danger', title: 'Excluir este objetivo?', text: `Ao confirmar, o objetivo "${esc(S.objetivo.nome)}" e todo o histórico de progresso salvo nele serão apagados permanentemente.`, extra: '<p class="cap c-dark" style="background:var(--primary-lighter);border-radius:8px;padding:10px">Dica: Se os planos mudaram, você também pode apenas editar o valor ou o prazo!</p>', ok: 'Manter objetivo', okAct: 'dlgClose', cancel: 'Excluir objetivo', cancelAct: 'objDelOk' }); },
  objDelOk: () => { S.objetivo = null; closeOverlays(true); rerender(); toast('Objetivo excluído!', 'error', 'trash-2'); },
  objRenew: () => { S.objetivo = null; objWizard(1); },
});
screen('objEdit', {
  render: () => { const o = S.objetivo || {};
    return `${statusBar()}${appHeader('Objetivo')}<div class="col px5">${[['Nome', o.nome, 1], ['Valor do objetivo', fmtBRL(o.valor), 2], ['Data de conclusão', prazoLongo(o.prazo), 3]].map(([t, v, s]) => `<button type="button" class="li" data-act="ed" data-s="${s}"><span class="lt col"><span class="b16 semi c-darker">${t}</span><span class="b14 c-base">${esc(v)}</span></span>${ic('chevron-right', 20, 'c-base')}</button>`).join('')}</div>${homeInd()}`; },
  acts: { ed: (b) => { const o = S.objetivo; S.tmpObj = { nome: o.nome, valorTxt: fmtBRL(o.valor), prazo: o.prazo }; objWizard(+b.dataset.s, true); } },
});
/* O objetivo só existe se houver poupança para alimentá-lo: sem nenhuma ativa,
   mandamos o usuário escolher uma primeiro (item 1). */
function exigePoupanca() {
  if (anyPoup()) return false;
  if (!S.flags.poupIntroSeen) S.flags.poupIntroSeen = true;
  stack = []; reset('poupar', { tab: 'total' }, 'none');
  later(() => openSheet(`<span class="ico-c" style="color:var(--ia)">${ic('goal', 22)}</span>
    <p class="h3 c-darker">Primeiro, ative uma poupança</p>
    <p class="b14 c-dark">O objetivo é alimentado pelo que você guarda. Escolha uma poupança automática e, assim que ela estiver ativa, criamos seu objetivo juntos.</p>`,
    { foot: btn('Escolher uma poupança', { act: 'explorePoup' }) + btn('Agora não', { v: 'o', act: 'closeov' }) }), 320);
  return true;
}
Object.assign(GLOBAL_ACTS, { explorePoup: () => { closeOverlays(true); go('poupEscolher'); } });
screen('objetivo', { render: () => '', mount: () => { if (exigePoupanca()) return; if (!S.flags.poupIntroSeen) S.flags.poupIntroSeen = true; stack = []; reset('poupar', { tab: 'total', openObj: !S.objetivo }, 'none'); if (S.objetivo) later(objSheet, 350); } });

/* ---------- Valor fixo ---------- */
screen('vfFreq', {
  cls: 'grad',
  render: (p) => { const f = S.tmpVf?.freq; const mes = f === 'mesIni' || f === 'mesFim';
    return ofScreen({ title: 'Valor fixo', body: `<div class="col g1"><p class="b16 semi c-darker">Frequência</p><p class="b16 c-dark">Escolha a periodicidade que melhor se adapta ao seu bolso.</p></div>
    <div class="col">${['sem', 'quinz'].map(k => `<button type="button" class="li" data-act="fsel" data-k="${k}"><span class="lt col"><span class="b16 semi c-darker">${FREQ[k][0]}</span><span class="b14 c-base">${FREQ[k][1]}</span></span><span class="rad ${f === k ? 'on' : ''}" style="width:auto;padding:0"><span class="o"></span></span></button>`).join('')}
      <div style="padding:14px 0"><p class="b16 semi c-darker">Mensalmente</p>${['mesIni', 'mesFim'].map(k => `<button type="button" class="rad ${f === k ? 'on' : ''}" data-act="fsel" data-k="${k}"><span class="o"></span><span class="lb b14">${FREQ[k][1]}</span></button>`).join('')}</div></div>
    <div class="row g2 ais" style="border:1px solid var(--primary);background:var(--primary-lighter);border-radius:var(--r-lg);padding:10px 12px;margin-top:auto">${ic('info', 16, 'c-primary')}<p class="cap c-dark">As transferências automáticas acontecerão aos finais de semana.</p></div>`,
    foot: btn(p.edit ? 'Salvar' : 'Próximo', { next: true, act: 'next' }) }); },
  mount: (el, p) => { if (!p.init) { p.init = 1; S.tmpVf = p.edit ? { ...poupState().vf } : (S.tmpVf && S.tmpVf.fromResumo ? S.tmpVf : { freq: '', valorTxt: '' }); rerender(); } },
  valid: () => !!(S.tmpVf && S.tmpVf.freq),
  acts: {
    fsel: (b) => { S.tmpVf.freq = b.dataset.k; rerender(); },
    next: () => { const p = P(); if (p.edit) { poupState().vf.freq = S.tmpVf.freq; back(); toast('Frequência atualizada!'); return; } if (p.fromResumo) { back(); return; } go('vfValor'); },
  },
});
screen('vfValor', {
  cls: 'grad',
  render: (p) => ofScreen({ title: p.edit ? 'Editar valor' : 'Definir valor', body: `${field({ id: 'vfv', label: valorLabel(S.tmpVf.freq), ph: 'R$ 0,00', bind: 'tmpVf.valorTxt', mask: 'brl' })}
    <div class="row g2" style="flex-wrap:wrap">${[50, 100, 200, 500].map(v => `<button type="button" class="chip" data-act="vq" data-v="${v}">${fmtBRL(v, false)}</button>`).join('')}</div>
    ${S.contas.length ? miaInsight('Sugestão da MIA', `Analisei sua margem livre dos últimos meses: guardar até ${fmtBRL(S.tmpVf.freq === 'sem' ? 75 : S.tmpVf.freq === 'quinz' ? 150 : 300, false)} por depósito não deve apertar seu mês.`) : ''}`,
    foot: btn(p.edit ? 'Salvar' : 'Próximo', { next: true, act: 'next' }) }),
  mount: (el, p) => { if (p.edit && !p.init) { p.init = 1; S.tmpVf = { ...poupState().vf, valorTxt: fmtBRL(poupState().vf.valor) }; rerender(); } later(() => $('#vfv', el)?.focus(), 350); },
  valid: () => parseBRL(S.tmpVf.valorTxt) >= 1,
  acts: {
    vq: (b) => { S.tmpVf.valorTxt = fmtBRL(+b.dataset.v); refresh(); },
    next: () => { const p = P(); if (p.edit) { poupState().vf.valor = parseBRL(S.tmpVf.valorTxt); back(); toast('Valor atualizado!'); return; } go('vfResumo'); },
  },
});
screen('vfResumo', {
  cls: 'grad',
  render: () => ofScreen({ title: 'Resumo', body: `<div class="col">${[['Frequência do depósito', freqTxt(S.tmpVf.freq), 'eFreq'], ['Valor do depósito', fmtBRL(parseBRL(S.tmpVf.valorTxt)), 'eVal']].map(([t, v, a]) => `<div class="li"><span class="lt col"><span class="b16 semi c-darker">${t}</span><span class="b14 c-base">${v}</span></span><button type="button" data-act="${a}" aria-label="Editar ${t}" style="color:var(--ty-dark)">${ic('pencil', 18)}</button></div>`).join('')}</div>`,
    foot: btn('Salvar', { act: 'save' }) }),
  acts: {
    eFreq: () => { S.tmpVf.fromResumo = true; go('vfFreq', { fromResumo: true, init: 1 }); },
    eVal: () => back(),
    save: () => { const t = S.tmpVf; poupState().vf = { freq: t.freq, valor: parseBRL(t.valorTxt), total: 0, hist: [] }; go('proc', { msg: 'Estamos armazenando seus dados...', next: 'vfOk' }); },
  },
});
screen('vfOk', { cls: 'grad', render: () => successScreen({ img: 'mia-punhos.webp', title: 'Pronto! Agora seu dinheiro está no piloto automático', text: 'Parabéns! Você configurou sua poupança automática. A partir de agora, o Me Paguei cuida de tudo para você.', label: 'Ver poupança', act: 'go' }), acts: { go: () => { S.flags.poupIntroSeen = true; reset('poupar', { tab: 'vf' }, 'fade'); } } });

function cfgScreen(title, rows, o) {
  return `${CURVE}${statusBar(true)}<div class="bk" style="margin-top:16px;height:32px"><button type="button" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button><p class="h2" style="position:absolute;left:56px;right:56px;text-align:center;color:#fff">${title}</p><span></span></div>
  <div class="sheet" style="margin-top:32px"><div class="sheet-in" style="gap:0">${rows.map(([t, v, a]) => `<button type="button" class="li" data-act="${a}"><span class="lt col"><span class="b16 semi c-darker">${t}</span><span class="b14 c-base">${v}</span></span>${ic('chevron-right', 20, 'c-base')}</button>`).join('')}
    ${o.pausada ? `<button type="button" class="li" data-act="reativar"><span class="lt col"><span class="b16 semi c-darker">Reativar</span><span class="b14 c-base">Volte a guardar no piloto automático.</span></span>${ic('chevron-right', 20, 'c-base')}</button>` : `<button type="button" class="li" data-act="pausar"><span class="lt col"><span class="b16 semi c-darker">Pausar</span><span class="b14 c-base">Interromper depósito automático</span></span>${ic('chevron-right', 20, 'c-base')}</button>`}
    <button type="button" class="b14 semi c-dark" data-act="cancelar" style="margin-top:auto;padding:16px">Cancelar definitivamente</button></div></div>${homeInd()}`;
}
const cfgActs = (k, nome) => ({
  pausar: () => confirmDlg({ icon: 'pause', tone: 'warning', title: `Pausar ${nome}?`, text: 'Ao pausar, seus depósitos automáticos param até que você decida voltar. Seu dinheiro guardado continua disponível.', ok: 'Pausar', okAct: 'doPause' }),
  doPause: () => { poupState()[k].pausada = true; closeOverlays(true); rerender(); toast('Seus depósitos foram pausados.', 'warn', 'pause'); },
  reativar: () => confirmDlg({ icon: 'play', tone: 'success', title: 'Reativar seus depósitos?', text: 'Que bom ter você de volta! Ao reativar, seus depósitos automáticos voltam a acontecer no valor e frequência que você definiu.', ok: 'Reativar', okAct: 'doResume', cancel: 'Manter pausado' }),
  doResume: () => { poupState()[k].pausada = false; closeOverlays(true); rerender(); toast(`${cap1(nome)} reativada!`); },
  cancelar: () => confirmDlg({ icon: 'trash-2', tone: 'danger', title: `Excluir ${nome}?`, text: 'Ao excluir, seus depósitos param e suas configurações são excluídas. Para voltar a guardar automaticamente, será necessário criar uma nova regra de poupança.', ok: 'Excluir', okV: 'd', okAct: 'doDel' }),
  doDel: () => { delete poupState()[k]; closeOverlays(true); reset('poupar', { tab: k }, 'back'); toast(`${cap1(nome)} excluída.`, 'error', 'trash-2'); },
});
screen('vfCfg', { cls: 'grad', render: () => { const o = poupState().vf; return cfgScreen('Valor fixo', [['Frequência', freqTxt(o.freq), 'eF'], ['Valor do depósito', fmtBRL(o.valor), 'eV']], o); },
  acts: Object.assign(cfgActs('vf', 'poupança automática'), { eF: () => go('vfFreq', { edit: true }), eV: () => { S.tmpVf = { ...poupState().vf }; go('vfValor', { edit: true }); } }) });

/* ---------- Placar do Bem ---------- */
screen('pbIntro', {
  render: () => introScreen({ title: 'Configure o Placar do Bem', text: 'Una a torcida pelo seu clube ao hábito de guardar dinheiro. A cada vitória, o valor escolhido vai direto para a sua reserva. Se o time não vencer, nada acontece.', bullets: [['flag', 'Escolha o seu time do coração.'], ['banknote', 'Defina o valor que quer poupar por vitória.']], act: 'go' }),
  acts: { go: () => confirmContasSheet('o Placar do Bem', 'pbStart'), pbStart: () => { closeOverlays(true); S.tmpPb = { time: '', valorTxt: '' }; go('pbTime'); } },
});
screen('pbTime', {
  cls: 'grad',
  render: (p) => { const q = (p.q || '').trim().toLowerCase(); const serie = p.serie || 'A'; const sel = p.edit ? (S.tmpPb.time || poupState().placar.time) : '';
    const sem = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    /* com busca, procura nas três séries; sem busca, mostra a série escolhida */
    const L = q ? TEAMS.filter(t => sem(t[1]).includes(sem(q))) : SERIES[serie];
    const list = L.length ? `<div class="col">${L.map(([id]) => `<button type="button" class="li" data-act="tpick" data-t="${id}">${teamRow(id, id === sel ? '<span class="badge success">Escolhido</span>' : ic('chevron-right', 20, 'c-base'))}</button>`).join('')}</div>`
      : `<div class="empty"><span class="ico-c" style="background:var(--bg-lighter);color:var(--ty-base)">${ic('search-x', 20)}</span><p class="b14 semi c-darker">Time não encontrado</p><p class="b14 c-dark">O Me Paguei utiliza como base os clubes do atual Campeonato Brasileiro das Séries A, B e C. O ${esc(p.q)} não corresponde a nenhuma dessas equipes. Busque um outro time.</p></div>`;
    return ofScreen({ title: 'Escolha o time', sub: 'Acompanhe um dos 60 clubes disponíveis e crie sua dinâmica para poupar.', dots: p.edit ? 0 : 1,
      body: `${field({ id: 'tq', ph: 'Buscar time...', icon: 'search', value: p.q || '' })}<div class="col g2"><p class="b14 semi c-dark">Brasileirão</p><div class="row g2">${['A', 'B', 'C'].map(s => `<button type="button" class="chip f1 jc" data-act="serie" data-s="${s}" style="${s === serie ? 'background:var(--primary);border-color:var(--primary);color:#fff' : 'border-color:#a9d3f5;color:var(--primary)'}">Série ${s}</button>`).join('')}</div></div>${list}` }); },
  onInput: (i) => { if (i.id === 'tq') { stack[stack.length - 1].p.q = i.value; refresh(); } },
  acts: {
    serie: (b) => { stack[stack.length - 1].p.serie = b.dataset.s; rerender(); },
    tpick: (b) => { const t = b.dataset.t; S.tmpPb.time = t; if (P().edit) { if (t !== poupState().placar.time) { poupState().placar.time = t; back(); toast('Time atualizado!'); } else back(); return; } go('pbValor'); },
  },
});
screen('pbValor', {
  cls: 'grad',
  render: (p) => { const t = team(S.tmpPb.time);
    return ofScreen({ title: p.edit ? 'Editar valor por vitória' : 'Definir valor por vitória', dots: p.edit ? 0 : 2,
      body: `<div class="card row g3">${teamRow(t.id, '<span class="badge success">Escolhido</span>')}</div><p class="b14 c-dark">O valor escolhido só é transferido para a sua poupança quando o ${t.nome} vencer.</p>
      ${field({ id: 'pbv', label: 'Valor por vitória', ph: 'R$ 0,00', bind: 'tmpPb.valorTxt', mask: 'brl' })}
      <div class="row g2" style="flex-wrap:wrap">${[5, 10, 20, 50].map(v => `<button type="button" class="chip" data-act="vq" data-v="${v}">${fmtBRL(v, false)}</button>`).join('')}</div>
      <div class="card flat col g1"><p class="row g2 b14 semi c-darker">${ic('info', 16, 'c-primary')} Como funciona?</p><p class="b14 c-dark">A transferência será feita entre as contas origem e destino cadastradas por você. Se o seu time não vencer, nenhuma movimentação é feita.</p></div>`,
      foot: btn(p.edit ? 'Salvar' : 'Próximo', { next: true, act: 'next' }) + (p.edit ? '' : btn('Cancelar', { v: 'o', act: 'cancel' })) }); },
  mount: (el, p) => { if (p.edit && !p.init) { p.init = 1; S.tmpPb = { time: poupState().placar.time, valorTxt: fmtBRL(poupState().placar.valor) }; rerender(); } },
  valid: () => parseBRL(S.tmpPb.valorTxt) >= 1,
  acts: {
    vq: (b) => { S.tmpPb.valorTxt = fmtBRL(+b.dataset.v); refresh(); },
    next: () => { if (P().edit) { poupState().placar.valor = parseBRL(S.tmpPb.valorTxt); back(); toast('Valor atualizado!'); return; } go('pbResumo'); },
    cancel: () => confirmDlg({ icon: 'circle-alert', tone: 'warning', title: 'Cancelar o Placar do Bem?', text: 'Se você sair agora, os dados preenchidos serão perdidos e você voltará para a tela inicial de poupanças.', ok: 'Sim, cancelar', okAct: 'doCancel', cancel: 'Não, continuar criando' }),
    doCancel: () => { closeOverlays(true); reset('poupar', { tab: 'placar' }, 'back'); },
  },
});
screen('pbResumo', {
  cls: 'grad',
  render: () => ofScreen({ title: 'Resumo', sub: 'Confira todas as informações abaixo antes de começar torcer e poupar.', dots: 3,
    body: `<div class="col g2"><p class="b14 semi c-darker">Time escolhido:</p><div class="card row g3">${teamRow(S.tmpPb.time)}</div></div>
    <div class="col g2"><p class="b14 semi c-darker">Regra definida:</p><div class="row g3"><span class="ico-c sm">${ic('trophy', 16)}</span><div class="f1"><p class="b14 semi c-darker">Por vitória</p><p class="cap c-base">A cada jogo vencido</p></div><p class="b14 bold c-darker">${fmtBRL(parseBRL(S.tmpPb.valorTxt))}</p></div></div>
    <div class="col g2 center" style="align-items:center;padding-top:8px"><span class="ico-c sm">${ic('info', 16)}</span><p class="b14 semi c-darker">Quando ocorrerá as transferências?</p><p class="b14 c-base">No fim de semana, realizamos a movimentação com os resultados da semana. Em caso de empate ou derrota, nada muda: seu dinheiro fica protegido e você nunca perde.</p></div>`,
    foot: btn('Confirmar e ativar', { act: 'ok' }) + btn('Editar', { v: 'o', act: 'edit' }) }),
  acts: {
    ok: () => { poupState().placar = { time: S.tmpPb.time, valor: parseBRL(S.tmpPb.valorTxt), total: 0, hist: [] }; go('proc', { msg: 'Estamos armazenando suas definições...', next: 'pbOk' }); },
    edit: () => openSheet(`<p class="h4 c-darker">O que você quer editar?</p><button type="button" class="li" data-act="eT">${ic('flag', 20)}<span class="lt b16 c-darker">Time escolhido</span>${ic('chevron-right', 18)}</button><button type="button" class="li" data-act="eV">${ic('banknote', 20)}<span class="lt b16 c-darker">Valor por vitória</span>${ic('chevron-right', 18)}</button>`),
    eT: () => { closeOverlays(true); backTo('pbTime'); },
    eV: () => { closeOverlays(true); back(); },
  },
});
screen('pbOk', { cls: 'grad', render: () => successScreen({ img: 'mia-bola.webp', chip: 'Hora de torcer e poupar!', chipIcon: 'trophy', title: 'Tudo pronto!<br>Sua vitória já está garantida', text: 'Você ativou o Placar do Bem. A partir de agora, cada vitória do seu time é um passo a mais em direção aos seus objetivos.', label: 'Ver poupança', act: 'go' }), acts: { go: () => { S.flags.poupIntroSeen = true; reset('poupar', { tab: 'placar' }, 'fade'); } } });
screen('pbCfg', { cls: 'grad', render: () => { const o = poupState().placar; return cfgScreen('Configurações', [['Time escolhido', team(o.time).nome, 'eT'], ['Valor por vitória', fmtBRL(o.valor), 'eV']], o); },
  acts: Object.assign(cfgActs('placar', 'o Placar do Bem'), { eT: () => { S.tmpPb = { time: poupState().placar.time }; go('pbTime', { edit: true }); }, eV: () => go('pbValor', { edit: true }) }) });

/* ---------- Troco inteligente ---------- */
screen('trIntro', {
  render: () => introScreen({ title: 'Ative o Troco inteligente', text: 'Economize sem esforço. Nós juntamos os centavos das compras dos seus cartões conectados e guardamos no seu cofrinho de forma automática.', bullets: [['coins', 'Escolha entre arredondar os centavos ou guardar um valor fixo por compra.'], ['rocket', 'Ative o multiplicador opcional para acelerar seus objetivos.']], act: 'go' }),
  acts: { go: () => confirmContasSheet('o Troco Inteligente', 'trStart'), trStart: () => { closeOverlays(true); S.tmpTr = { modo: '', fixoTxt: '', mult: null, cards: {} }; S.contas.forEach(id => S.tmpTr.cards[id] = true); go('trCards'); } },
});
/* 08.0x · Rastrear compras — escolha de quais cartões usar (Figma 8034:17720).
   Primeira etapa do fluxo: lista os cartões das contas conectadas via Open Finance,
   todos marcados por padrão. Reaproveita BANKS/bankIc e o checkbox do DS. */
screen('trCards', {
  cls: 'grad',
  render: () => {
    const sel = S.tmpTr.cards || {};
    const card = id => `<div class="card row jb" style="align-items:center;padding:12px 16px;gap:12px">
        <span class="row g3" style="align-items:center;min-width:0">${bankIc(id)}
          <span class="col" style="gap:0;min-width:0"><span class="b16 semi c-darker">Crédito</span><span class="b14 c-base" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">•••• 1234 | ${BANKS[id].nome}</span></span></span>
        <button type="button" class="chk ${sel[id] ? 'on' : ''}" data-act="check" data-key="tmpTr.cards.${id}" role="checkbox" aria-checked="${!!sel[id]}" style="width:auto;flex:none"><span class="box" style="margin-top:0">${ic('check', 12)}</span></button>
      </div>`;
    return ofScreen({ title: 'Rastrear compras', sub: 'Monitore as compras feitas nos cartões de crédito conectados via Open Finance.', dots: 1,
      body: `<p class="b14 c-dark">Total de cartões disponíveis: <b class="c-darker">${S.contas.length}</b></p>
        <div class="col g3">${S.contas.map(card).join('')}</div>
        ${btn(ic('plus', 14) + ' Adicionar novo cartão', { v: 'o', cls: 'btn-xs auto', act: 'addCard', attrs: 'style="align-self:flex-end;padding:0 14px"' })}
        <div class="col g2 center" style="align-items:center;padding-top:16px;margin-top:auto">
          <span class="ico-c sm">${ic('info', 16)}</span>
          <p class="b14 semi c-darker">Como funciona?</p>
          <p class="b14 c-base center">A conexão servirá apenas para calcularmos o troco das suas compras. Nenhum valor será debitado dos cartões, o débito total será feito direto da sua conta principal.</p>
        </div>`,
      foot: btn('Próximo', { next: true, act: 'next' }) }); },
  valid: () => Object.values(S.tmpTr.cards || {}).some(Boolean),
  acts: {
    addCard: () => toast('Nesta versão de teste, novos cartões são adicionados pela conexão Open Finance', 'info', 'info'),
    next: () => go('trModo'),
  },
});
screen('trModo', {
  cls: 'grad',
  render: (p) => { const m = S.tmpTr.modo;
    return ofScreen({ title: 'Troco inteligente', sub: 'Escolha a regra que usaremos para calcular o valor poupado em cada compra.', dots: p.edit ? 0 : 2,
      body: `<div class="radc ${m === 'arred' ? 'on' : ''}" data-act="msel" data-m="arred" role="radio" aria-checked="${m === 'arred'}" style="cursor:pointer"><span class="rad ${m === 'arred' ? 'on' : ''}"><span class="o"></span><span class="lb">Arredondar centavos</span></span><span class="d">Arredonda o valor para o próximo número inteiro e guarda a diferença.<br><b class="c-dark">Exemplo:</b> "Uma compra de R$ 4,50 vira R$ 5,00. Você poupa R$ 0,50."</span></div>
      <div class="radc ${m === 'fixo' ? 'on' : ''}" data-act="msel" data-m="fixo" role="radio" aria-checked="${m === 'fixo'}" style="cursor:pointer"><span class="rad ${m === 'fixo' ? 'on' : ''}"><span class="o"></span><span class="lb">Guardar valor fixo</span></span><span class="d">Escolha um valor exato para guardar em cada compra feita.</span>
        ${m === 'fixo' ? `<div class="col g2" style="padding-left:30px;margin-top:6px">${field({ id: 'trf', ph: 'R$ 0,00', bind: 'tmpTr.fixoTxt', mask: 'brl' })}<div class="row g2">${[1, 2, 5].map(v => `<button type="button" class="chip f1 jc" data-act="fq" data-v="${v}" style="height:30px;font-size:12px;${parseBRL(S.tmpTr.fixoTxt) === v ? 'border-color:var(--primary-darker);color:var(--primary-darker)' : 'color:var(--primary);border-color:#a9d3f5'}">${fmtBRL(v)}</button>`).join('')}</div></div>` : ''}</div>`,
      foot: btn(p.edit ? 'Salvar' : 'Próximo', { next: true, act: 'next' }) }); },
  mount: (el, p) => { if (p.edit && !p.init) { p.init = 1; const o = poupState().troco; S.tmpTr = { modo: o.modo, fixoTxt: o.fixo ? fmtBRL(o.fixo) : '', mult: o.mult }; rerender(); } },
  valid: () => S.tmpTr.modo === 'arred' || (S.tmpTr.modo === 'fixo' && parseBRL(S.tmpTr.fixoTxt) > 0),
  acts: {
    msel: (b, e) => { if (e.target.closest('input,.chip')) return; if (S.tmpTr.modo === b.dataset.m) return; S.tmpTr.modo = b.dataset.m; rerender(); if (b.dataset.m === 'fixo') later(() => $('#trf', cur)?.focus(), 50); },
    fq: (b, e) => { e.stopPropagation(); S.tmpTr.fixoTxt = fmtBRL(+b.dataset.v); rerender(); },
    next: () => { const t = S.tmpTr; if (P().edit) { Object.assign(poupState().troco, { modo: t.modo, fixo: parseBRL(t.fixoTxt) }); back(); toast('Regra atualizada!'); return; } if (t.modo === 'arred') go('trMult'); else trSave(); },
  },
});
function trSave() { const t = S.tmpTr; poupState().troco = { modo: t.modo, fixo: parseBRL(t.fixoTxt), mult: t.modo === 'arred' ? t.mult : null, total: 0, hist: [] }; go('proc', { msg: 'Estamos armazenando suas definições...', next: 'trOk' }); }
screen('trMult', {
  cls: 'grad',
  render: (p) => { const m = S.tmpTr.mult;
    return ofScreen({ title: 'Multiplicar centavos', sub: 'Ative para multiplicar o valor arredondado e juntar dinheiro mais rápido.', dots: p.edit ? 0 : 3,
      body: `${[[2, 'R$ 1,00'], [5, 'R$ 2,50'], [10, 'R$ 5,00']].map(([k, v]) => radio('tmpTr.mult', k, `Multiplique por ${k}x`, m === k || m === String(k), `Ex: Se o seu troco for de R$ 0,50, nós guardamos ${v} nessa compra.`)).join('')}
      ${radio('tmpTr.mult', '0', 'Sem multiplicador', m === '0' || m === 0, '').replace('<span class="d"></span>', '')}
      <div class="col g2 center" style="align-items:center;padding-top:4px"><span class="ico-c sm">${ic('info', 16)}</span><p class="b14 semi c-darker">Importante saber</p><p class="b14 c-base">O multiplicador é aplicado sobre qualquer troco gerado entre R$ 0,01 e R$ 0,99. Valores já inteiros (ex: R$ 15,00) não geram depósitos.</p></div>`,
      foot: btn('Salvar', { next: true, act: 'next' }) }); },
  mount: (el, p) => { if (p.edit && !p.init) { p.init = 1; S.tmpTr = { ...S.tmpTr, mult: String(poupState().troco.mult || 0) }; rerender(); } },
  valid: () => S.tmpTr.mult != null && S.tmpTr.mult !== '',
  acts: { next: () => { S.tmpTr.mult = +S.tmpTr.mult; if (P().edit) { poupState().troco.mult = S.tmpTr.mult; back(); toast('Multiplicador atualizado!'); return; } trSave(); } },
});
screen('trOk', { cls: 'grad', render: () => successScreen({ img: 'mia-cofre.webp', chip: 'Compras que rendem!', chipIcon: 'coins', title: 'Tudo pronto! Seu troco já está trabalhando', text: 'A partir de agora, a cada compra com seu cartão, sua reserva cresce de forma automática.', label: 'Ver poupança', act: 'go' }), acts: { go: () => { S.flags.poupIntroSeen = true; reset('poupar', { tab: 'troco' }, 'fade'); } } });
screen('trCfg', { cls: 'grad', render: () => { const o = poupState().troco; return cfgScreen('Configurações', [['Rastrear compras', 'Todos cartões disponíveis', 'eC'], ['Tipo de operação', o.modo === 'fixo' ? `Guardar valor fixo (${fmtBRL(o.fixo)})` : `Arredondar centavos (${o.mult || 0}x)`, 'eM'], ...(o.modo === 'arred' ? [['Multiplicador', o.mult ? o.mult + 'x' : 'Sem multiplicador', 'eX']] : [])], o); },
  acts: Object.assign(cfgActs('troco', 'o Troco Inteligente'), { eC: () => openSheet(`<p class="h4 c-darker">Rastrear compras</p><p class="b14 c-dark">Acompanhamos as compras de todos os cartões das contas conectadas via Open Finance.</p>${S.contas.map(id => `<div class="li">${bankIc(id)}<span class="lt b16 semi c-darker">${BANKS[id].curto}</span><span class="badge success">Rastreando</span></div>`).join('')}`), eM: () => go('trModo', { edit: true }), eX: () => go('trMult', { edit: true }) }) });

/* dados de exemplo das poupanças (conta em uso) */
const seedDemo0 = seedDemo;
seedDemo = function () {
  seedDemo0();
  const d = k => dataCurta(new Date(hoje().getTime() - k * 864e5));
  S.poup = { vf: { freq: 'mesIni', valor: 100, total: 300, hist: [{ ok: false, d: d(4) }, { ok: true, d: d(18) }, { ok: true, d: d(32) }, { ok: true, d: d(46) }] },
    placar: { time: 'botafogo', valor: 5, total: 25, hist: [{ ok: true, placar: 'Botafogo 3 × 2 Mirassol', d: d(3) }, { ok: true, placar: 'Botafogo 2 × 1 Bahia', d: d(10) }, { ok: false, placar: 'Botafogo 1 × 0 Vasco', d: d(17) }, { ok: true, placar: 'Botafogo 2 × 0 Flamengo', d: d(24) }, { ok: true, placar: 'Botafogo 2 × 0 Bragantino', d: d(31) }, { ok: true, placar: 'Botafogo 2 × 0 Santos', d: d(38) }] },
    troco: { modo: 'arred', mult: 2, total: 25, hist: [{ ok: true, loja: 'Ifood', compra: 35.5, arr: .5, mult: 2, pou: 1, d: d(2) }, { ok: true, loja: 'Mundo do cabelereiro', compra: 35.5, arr: .5, mult: 2, pou: 1, d: d(2) }, { ok: true, loja: 'Zé delivery', compra: 35.5, arr: .5, mult: 2, pou: 1, d: d(3) }, { ok: false, d: d(5) }, { ok: true, loja: 'Assaí Atacadista', compra: 35.5, arr: .5, mult: 2, pou: 1, d: d(6) }] } };
  S.objetivo = { nome: 'Viagem para Itália', valor: 5000, prazo: '10/12/2026' };
  S.flags.poupIntroSeen = true;
};

flowEntry('Poupanças', 'Primeiro acesso às Poupanças', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; S.poup = { total: 0 }; S.flags.poupIntroSeen = false; reset('poupar'); });
flowEntry('Poupanças', 'Valor fixo (com contas prontas)', () => { if (!contasOk()) { seedDemo(); S.poup = { total: 0 }; S.objetivo = null; } delete poupState().vf; reset('poupar', { tab: 'total' }); go('vfFreq'); });
flowEntry('Poupanças', 'Placar do Bem (com contas prontas)', () => { if (!contasOk()) { seedDemo(); S.poup = { total: 0 }; S.objetivo = null; } delete poupState().placar; reset('poupar', { tab: 'total' }); go('pbIntro'); });
flowEntry('Poupanças', 'Troco inteligente (com contas prontas)', () => { if (!contasOk()) { seedDemo(); S.poup = { total: 0 }; S.objetivo = null; } delete poupState().troco; reset('poupar', { tab: 'total' }); go('trIntro'); });
flowEntry('Poupanças', 'Poupanças com dados', () => { seedDemo(); reset('poupar', { tab: 'total' }); });
