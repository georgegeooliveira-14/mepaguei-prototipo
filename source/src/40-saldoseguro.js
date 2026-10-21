/* ============ Clareza · Saldo Seguro (Fluxo Futuro) e Projeção de Faturas ============ */

const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const parseData = s => { const m = (s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (!m) return null; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getDate() === +m[1] ? d : null; };
const fmtK = v => (v < 0 ? '−' : '') + 'R$ ' + Math.round(Math.abs(v)).toLocaleString('pt-BR');
const sinal = v => (v > 0 ? '+ ' : v < 0 ? '− ' : '') + 'R$ ' + Math.round(Math.abs(v)).toLocaleString('pt-BR');
function nthBusinessDay(y, m, n) { let c = 0; for (let d = 1; d <= 31; d++) { const x = new Date(y, m, d); if (x.getMonth() !== m) break; const w = x.getDay(); if (w && w !== 6) { c++; if (c === n) return x; } } return null; }
/* sheet com validação própria */
function sheetForm(html, foot, valid) {
  const ov = openSheet(html, { foot });
  const upd = () => { const ok = valid(); $$('.js-next', ov).forEach(b => b.disabled = !ok); };
  ov.addEventListener('input', () => setTimeout(upd, 0)); ov.addEventListener('change', () => setTimeout(upd, 0)); ov.addEventListener('click', () => setTimeout(upd, 0)); upd();
  return ov;
}

function ssState() {
  if (S.ss) return S.ss;
  const ini = hoje();
  /* As entradas começam vazias: a renda informada no cadastro NÃO entra automaticamente (item 21). */
  S.ss = { inicio: ini, contasSel: {}, manual: null, entradas: [], renda: [], gastos: [], faturas: {}, eventos: [], ativo: false, miaE: false, miaG: false, step: 0 };
  S.contas.forEach(id => { S.ss.contasSel[id] = !(S.destino && S.destino.bank === id); });
  const cards = S.contas.slice(0, 2);
  if (cards[0]) S.ss.faturas[cards[0]] = { status: 'fechada', dia: 15, valor: 2000 };
  if (cards[1]) S.ss.faturas[cards[1]] = { status: 'aberta', dia: 20, valor: null };
  return S.ss;
}
const ssFim = () => addDays(ssState().inicio, 29);
const periodo = () => `${ddmm(ssState().inicio)} a ${ddmm(ssFim())}`;
const contaSaldo = id => BANKS[id].contas.reduce((a, c) => a + c.saldo, 0);
const ssSoma = () => S.contas.filter(id => ssState().contasSel[id]).reduce((a, id) => a + contaSaldo(id), 0);
const ssInicial = () => ssState().manual != null ? ssState().manual : ssSoma();
const allEntradas = () => [...ssState().renda, ...ssState().entradas];
const entradaQuando = e => !e.rec ? e.data : e.tipo === 'util' ? `${e.dia}º dia útil` : `Todo dia ${e.dia}`;

/* ---------- motor da projeção ---------- */
function ssLanc(extra = []) {
  const s = ssState(); const L = []; const ini = s.inicio;
  for (let k = 0; k < 30; k++) {
    const d = addDays(ini, k);
    allEntradas().forEach(e => {
      if (!e.rec) { const x = parseData(e.data); if (x && sameDay(x, d)) L.push({ k, nome: e.nome, tipo: 'Receita', v: e.valor }); }
      else if (e.tipo === 'util') { const x = nthBusinessDay(d.getFullYear(), d.getMonth(), e.dia); if (x && sameDay(x, d)) L.push({ k, nome: e.nome, tipo: 'Receita', v: e.valor }); }
      else if (d.getDate() === Math.min(e.dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())) L.push({ k, nome: e.nome, tipo: 'Receita', v: e.valor });
    });
    s.gastos.forEach(g => { if (d.getDate() === g.dia) L.push({ k, nome: g.nome, tipo: 'Despesa', v: -g.valor, cat: g.cat }); });
    Object.entries(s.faturas).forEach(([id, f]) => { if (f.valor && d.getDate() === f.dia) L.push({ k, nome: `Fatura ${BANKS[id].curto}`, tipo: 'Despesa', v: -f.valor, cat: 'cartao' }); });
    s.eventos.forEach(ev => { if (ev.valor && !ev.nao) { const x = parseData(ev.pag); if (x && sameDay(x, d)) L.push({ k, nome: ev.nome, tipo: 'Despesa', v: -ev.valor, cat: 'evento' }); } });
    vfDatas().forEach(x => { if (sameDay(x, d)) L.push({ k, nome: 'Poupança automática', tipo: 'Poupança', v: -poupState().vf.valor, cat: 'poup' }); });
    extra.forEach(x => { const dd = parseData(x.data); if (dd && sameDay(dd, d)) L.push({ k, nome: x.nome, tipo: x.v > 0 ? 'Receita' : 'Despesa', v: x.v, sim: true }); });
  }
  return L;
}
function vfDatas() {
  const vf = poupState().vf; if (!vf || vf.pausada) return [];
  const ini = ssState().inicio, fim = ssFim(), out = [];
  if (vf.freq === 'sem' || vf.freq === 'quinz') { let d = addDays(ini, (7 - ini.getDay()) % 7); while (d <= fim) { out.push(d); d = addDays(d, vf.freq === 'sem' ? 7 : 14); } }
  else { for (let m = 0; m < 2; m++) { const d = domingoDoMes(ini.getFullYear(), ini.getMonth() + m, vf.freq === 'mesFim'); if (d >= ini && d <= fim) out.push(d); } }
  return out;
}
function ssSerie(extra) {
  const L = ssLanc(extra); let b = ssInicial(); const days = [];
  for (let k = 0; k < 30; k++) { const ops = L.filter(x => x.k === k); const prev = b; b += ops.reduce((a, x) => a + x.v, 0); days.push({ k, d: addDays(ssState().inicio, k), prev, ops, saldo: b }); }
  const max = days.reduce((a, x) => x.saldo > a.saldo ? x : a, days[0]); const min = days.reduce((a, x) => x.saldo < a.saldo ? x : a, days[0]);
  return { days, max, min, final: days[29].saldo };
}
const totEntr = () => ssLanc().filter(x => x.tipo === 'Receita').reduce((a, x) => a + x.v, 0);
const totRec = () => -ssLanc().filter(x => x.tipo === 'Despesa' && x.cat !== 'evento').reduce((a, x) => a + x.v, 0);
const totEvt = () => -ssLanc().filter(x => x.cat === 'evento').reduce((a, x) => a + x.v, 0);
const totPoup = () => -ssLanc().filter(x => x.cat === 'poup').reduce((a, x) => a + x.v, 0);

/* ---------- cabeçalho dos passos ---------- */
/* Header fixo = apenas o frame de 84px (status bar + voltar + título + passos).
   O título da página e o conteúdo rolam juntos (Figma 17790:141485). */
function ssStep({ step, title, sub, body, foot }) {
  const dots = [1, 2, 3, 4, 5].map(k => `<i style="display:block;height:4px;border-radius:2px;width:${k === step ? 12 : 4}px;background:${k <= step ? '#fff' : 'rgba(255,255,255,.5)'}"></i>`).join('');
  return `${CURVE}${statusBar(true)}
  <div class="bk" style="margin-top:16px;height:24px">
    <button type="button" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button>
    <p class="b16 semi" style="position:absolute;left:56px;right:56px;text-align:center;color:#fff">Projeção de Saldo Seguro</p>
    <span class="row g1">${dots}</span></div>
  <div class="scroll" style="position:relative;z-index:2;display:flex;flex-direction:column">
    <div style="flex:none;padding:18px 20px 4px;color:#fff"><p class="h2">${title}</p><p class="b16" style="color:#e9f1fb;margin-top:4px">${sub}</p></div>
    <div style="flex:1 0 auto;background:#fff;margin-top:16px;border-radius:32px 32px 0 0;padding:28px 20px 24px;display:flex;flex-direction:column;gap:24px">${body}</div>
  </div>
  ${foot ? `<div class="sheet-foot" style="background:#fff">${foot}</div>` : ''}${homeInd()}`;
}
const ssFoot = (label, total, cap, act = 'next', dis = false) => `<div class="col g1" style="padding-bottom:4px"><p class="b14 semi c-primary">${label}</p><p class="h2 c-darker num">${fmtBRL(total)}</p><p class="cap c-base">${cap}</p></div>${btn('Avançar', { act, next: true })}${btn('Cancelar', { v: 'o', act: 'ssCancel' })}`;
GLOBAL_ACTS.ssCancel = () => confirmDlg({ icon: 'circle-alert', tone: 'warning', title: 'Sair da projeção?', text: 'Se você sair agora, as informações preenchidas neste estudo serão perdidas.', ok: 'Sair', okAct: 'ssCancelOk', cancel: 'Continuar preenchendo' });
GLOBAL_ACTS.ssCancelOk = () => { closeOverlays(true); S.ss = null; reset('clareza', { tab: 'ss' }, 'back'); };
const periodoChip = () => `<div class="row g2 cap semi c-dark" style="background:var(--primary-lighter);border-radius:var(--r-full);padding:6px 12px;align-self:flex-start">${ic('calendar', 14)} Projeção sendo criada para o período: ${periodo()}</div>`;
const miaMini = (act, flag = '') => `<button type="button" class="mia-mini" data-act="${act}"${flag ? ` data-f="${flag}"` : ''} aria-label="Ver insight da MIA"><img src="assets/mia-avatar.webp" alt=""><img class="sp" src="assets/tip.png" width="14" height="14" alt=""></button>`;
const miaBox = (title, text, act = '', label = 'Entendi', sub = '', flag = '') => `<div class="ins" style="box-shadow:none"><div class="row g2"><span class="ava-mia sm"><img src="assets/mia-avatar.webp" alt=""></span><div class="col"><span class="b14 semi c-ia">${sub ? 'MIA' : 'Insight da MIA'}</span>${sub ? `<span class="cap c-base">${sub}</span>` : ''}</div>${sub ? '' : '<img src="assets/tip.png" width="14" height="14" alt="">'}</div>${title ? `<p class="b14 bold c-dark">${title}</p>` : ''}${Array.isArray(text)
    ? `<div class="mia-sl">${text.map(t => `<div><p class="cap c-dark" style="white-space:pre-line">${t}</p></div>`).join('')}</div><div class="mia-dots">${text.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`
    : `<p class="cap c-dark" style="white-space:pre-line">${text}</p>`}${act ? btn(label, { cls: 'btn-ia', act, attrs: flag ? `data-f="${flag}"` : '' }) : ''}</div>`;
/* Todo insight da MIA tem "Entendi": recolhe no avatar e volta ao clicar nele. */
const miaBlock = (flag, title, text, sub = '') => ssState()[flag] ? miaMini('miaTgl', flag) : miaBox(title, text, 'miaTgl', 'Entendi', sub, flag);
GLOBAL_ACTS.miaTgl = (b) => { const st = ssState(); const f = b.dataset.f; st[f] = !st[f]; rerender(); };

/* ---------- Clareza (aba) ---------- */
/* 00.01 - Saldo Seguro · Entrada · Apresentação (17790:141394): porta de entrada do menu Clareza */
screen('clarezaIntro', {
  render: () => `${statusBar()}
  <div class="row" style="flex:none;padding:17px 20px 0;height:49px"><button type="button" data-back aria-label="Voltar" style="color:var(--ty-darker);display:flex">${ic('chevron-left', 24)}</button></div>
  <div class="scroll col" style="padding:4px 20px 0;gap:14px">
    <img src="assets/cl-intro.webp" alt="Mulher sorrindo olhando o celular em um café" style="width:100%;flex:1;min-height:150px;object-fit:cover;border-radius:24px;display:block">
    <div class="col g6" style="padding-bottom:16px">
      <div class="col g4">
        <p class="h1 c-darker" style="text-wrap:wrap">Dois estudos para você cuidar do seu dinheiro hoje e amanhã<span class="c-primary">.</span></p>
        <p class="b16 c-dark">Descubra quanto você pode gastar com segurança, levando em conta seus lançamentos futuros.</p>
      </div>
      ${btn('Começar', { act: 'go' })}
    </div></div>${homeInd()}`,
  acts: { go: () => { S.flags.clarezaIntro = true; go('ssIntro'); } },
});

screen('clareza', {
  render: (p) => {
    const tab = p.tab || 'ss'; const s = S.ss; const ativo = s && s.ativo;
    let hero = '', body = '';
    if (tab === 'fat') {
      S.flags.fatVisto = true;
      hero = `<p class="b14" style="padding:20px 20px 0;color:#e9f1fb">Faturas dos cartões das contas conectadas</p>`;
      body = S.contas.length ? `<div class="col g1"><p class="h3 c-darker">Próximas faturas</p><p class="b14 c-dark">Veja como suas compras parceladas impactam os próximos meses.</p></div>${faturasChart()}
        <div class="col g2">${[['Alívio no orçamento', 'Em Dez/26 terminam 3 parcelas e liberam R$ 450 por mês.', 'trending-down', 'var(--success-bg)', 'var(--success)'], ['Saldo a pagar', 'Ainda restam R$ 6.950 em compras parceladas já realizadas.', 'receipt-text', 'var(--primary-lighter)', 'var(--primary)']].map(([t, d, i, bg, fg]) => `<div class="card row g3 ais"><span class="ico-c sm" style="background:${bg};color:${fg}">${ic(i, 16)}</span><div class="col g1"><p class="b14 semi c-darker">${t}</p><p class="b14 c-dark">${d}</p></div></div>`).join('')}</div>
        <div class="col g2"><p class="h3 c-darker">Visão por cartão</p>${S.contas.slice(0, 3).map((id, k) => `<div class="li">${bankIc(id)}<span class="lt col"><span class="b14 semi c-darker">Cartão ${BANKS[id].curto}</span><span class="cap c-base">Vence dia ${[15, 20, 10][k]} · ${k === 0 ? 'Fechada' : 'Aberta'}</span></span><span class="b14 bold num money">${fmtBRL([1350, 720, 280][k])}</span></div>`).join('')}</div>`
        : `<div class="empty"><span class="ico-c">${ic('credit-card', 22)}</span><p class="b16 semi c-darker">Conecte seus cartões</p><p class="b14 c-base">Para projetar suas faturas, precisamos acessar seus cartões via Open Finance.</p>${btn('Conectar contas', { go: 'of1', cls: 'auto' })}</div>`;
    } else if (!ativo) {
      body = `<div class="col g6" style="padding-top:8px">
        <div class="col g4"><img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40"><p class="h2 c-darker">Projete seu Saldo Seguro</p><p class="b16 c-dark"><i>Descubra quantos pagamentos você pode assumir</i> sem comprometer sua segurança financeira</p></div>
        <div class="col g4">${[['circle-check', 'Projetamos seu saldo diário para os próximos 30 dias'], ['calendar-days', 'Antecipe cenários desfavoráveis e ganhe tempo para agir'], ['banknote', 'Projeção em 5 etapas']].map(([i, t]) => `<div class="row g3 ais"><span class="ico-c sm">${ic(i, 16)}</span><p class="b14 c-dark">${t}</p></div>`).join('')}</div>
        <div style="padding-top:8px">${btn('Começar novo estudo', { act: 'novo' })}</div></div>`;
    } else {
      const sr = ssSerie(); const neg = sr.min.saldo < 0;
      hero = `<div class="col g1" style="padding:20px 20px 0;color:#fff"><p><span class="num" style="font-size:32px;line-height:40px;font-weight:700">${money(sr.final)}</span> <span class="b14">daqui a 30 dias</span></p><p class="b14">Saldo final projetado em ${ddmm(ssFim())}</p>${neg ? `<p class="row g2 b14" style="margin-top:6px"><span style="width:7px;height:7px;border-radius:50%;background:#ff5a5a"></span>Ponto de atenção em: <b>${ddmm(sr.min.d)}</b></p>` : `<p class="row g2 b14" style="margin-top:6px"><span style="width:7px;height:7px;border-radius:50%;background:#5ee08f"></span>Sem dias com saldo negativo</p>`}</div>`;
      body = ssProjBody(p, sr);
    }
    return `<div class="scroll gscroll ${S.flags.hide ? 'hide-v' : ''}">
      <div style="position:relative">${CURVE}<div style="position:relative">${statusBar(true)}
        <div class="row jb" style="padding:8px 20px 0"><p class="h2" style="color:#fff">Clareza</p><div class="row g2"><button type="button" data-act="hideVals" aria-label="${S.flags.hide ? 'Mostrar valores' : 'Ocultar valores'}" style="width:32px;height:32px;border-radius:50%;background:var(--btn-primary);color:#fff;display:flex;align-items:center;justify-content:center">${ic(S.flags.hide ? 'eye-off' : 'eye', 18)}</button><button type="button" data-act="cfg" aria-label="Configurações do estudo" style="width:32px;height:32px;border-radius:50%;background:var(--btn-primary);color:#fff;display:flex;align-items:center;justify-content:center">${ic('settings', 18)}</button></div></div>
        <div class="chips" style="padding:20px 20px 0"><button type="button" class="chip glass ${tab === 'fat' ? 'on' : ''}" data-act="ctab" data-k="fat">Projeção de Faturas</button><button type="button" class="chip glass ${tab === 'ss' ? 'on' : ''}" data-act="ctab" data-k="ss">Saldo Seguro${ativo ? ` (${periodo()})` : ''}</button></div>
        ${hero}<div style="height:${ativo ? 24 : 36}px"></div></div></div>
      <div class="hbody" style="padding:24px 20px;margin-top:0">${body}</div></div>${navbar('clareza')}`;
  },
  mount: (el) => { const svg = $('#sschart', el); if (svg) svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 311; const k = Math.max(0, Math.min(29, Math.round((x - 8) / (295 / 29)))); stack[stack.length - 1].p.day = k; rerender(); }); },
  acts: {
    ctab: (b) => { stack[stack.length - 1].p.tab = b.dataset.k; render('none'); },
    hideVals: () => { S.flags.hide = !S.flags.hide; rerender(); },
    novo: () => { S.ss = null; go('ssIntro'); },
    cfg: () => { if (S.ss && S.ss.ativo) go('ssCfg'); else toast('Crie um estudo para acessar as configurações', 'success', 'info'); },
    dprev: () => { const p = stack[stack.length - 1].p; p.day = Math.max(0, (p.day ?? defDay()) - 1); rerender(); },
    dnext: () => { const p = stack[stack.length - 1].p; p.day = Math.min(29, (p.day ?? defDay()) + 1); rerender(); },
    miaOk: () => { S.ss.miaP = !S.ss.miaP; rerender(); },
    sim: () => simSheet(),
    simKeep: () => { S.ss.sim = null; rerender(); },
    simApply: () => { S.ss.sim.forEach(x => { const v = Math.abs(x.v); if (x.v > 0) S.ss.entradas.push({ nome: x.nome, rec: false, data: x.data, valor: v }); else S.ss.eventos.push({ nome: x.nome, data: x.data, pag: x.data, valor: v, tipo: 'manual' }); }); S.ss.sim = null; updHomeSS(); rerender(); toast('Projeção atualizada com a simulação'); },
  },
});
const defDay = () => Math.min(14, 29);
function ssChart(sr, k, sim) {
  const W = 311, H = 150, X = i => 8 + i * (295 / 29);
  const all = sr.days.map(d => d.saldo).concat(sim ? sim.days.map(d => d.saldo) : []).concat([0]);
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * .12 || 100;
  const Y = v => 10 + (1 - (v - (lo - pad)) / ((hi + pad) - (lo - pad))) * (H - 20);
  // degraus (o saldo segura e salta no dia do lançamento) com os cantos arredondados
  const pts = arr => { const P = [[X(0), Y(arr[0].prev)]]; arr.forEach((d, i) => { if (i) P.push([X(i), Y(arr[i - 1].saldo)]); P.push([X(i), Y(d.saldo)]); }); P.push([W, Y(arr[29].saldo)]); return P; };
  const rnd = (P, r = 5) => { let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`; for (let i = 1; i < P.length - 1; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], [x2, y2] = P[i + 1]; const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1); if (!l1 || !l2) continue; const c1 = Math.min(r, l1 / 2), c2 = Math.min(r, l2 / 2); d += ` L${(x1 - (x1 - x0) / l1 * c1).toFixed(1)} ${(y1 - (y1 - y0) / l1 * c1).toFixed(1)} Q${x1.toFixed(1)} ${y1.toFixed(1)} ${(x1 + (x2 - x1) / l2 * c2).toFixed(1)} ${(y1 + (y2 - y1) / l2 * c2).toFixed(1)}`; } const L = P[P.length - 1]; return d + ` L${L[0].toFixed(1)} ${L[1].toFixed(1)}`; };
  const y0 = Y(0), line = rnd(pts(sr.days));
  const ticks = [0, 7, 14, 21, 29];
  return `<svg id="sschart" width="100%" viewBox="0 0 ${W} ${H + 22}" style="cursor:pointer;touch-action:manipulation" role="img" aria-label="Saldo projetado dia a dia">
    <defs><clipPath id="ab"><rect x="0" y="0" width="${W}" height="${y0}"/></clipPath>
      <linearGradient id="ssfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--primary);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--primary);stop-opacity:0"/></linearGradient></defs>
    <path d="${line} L${W} ${y0} L8 ${y0} Z" fill="url(#ssfill)" clip-path="url(#ab)"/>
    <line x1="0" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--ty-light)" stroke-dasharray="4 4"/><text x="4" y="${y0 - 4}" font-size="10" fill="var(--ty-base)">R$ 0</text>
    ${sim ? `<path d="${rnd(pts(sim.days))}" fill="none" stroke="var(--ia)" stroke-width="2" stroke-dasharray="5 3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    <path d="${line}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(sr.max.k)}" cy="${Y(sr.max.saldo)}" r="4.5" fill="var(--success)"/><circle cx="${X(sr.min.k)}" cy="${Y(sr.min.saldo)}" r="4.5" fill="var(--danger)"/>
    <line x1="${X(k)}" x2="${X(k)}" y1="6" y2="${H - 6}" stroke="var(--primary)" stroke-width="1" opacity=".25"/><circle cx="${X(k)}" cy="${Y((sim || sr).days[k].saldo)}" r="6" fill="#fff" stroke="var(--primary)" stroke-width="2.5"/>
    ${ticks.map(i => `<text x="${Math.min(W - 16, Math.max(16, X(i)))}" y="${H + 16}" text-anchor="middle" font-size="11" fill="var(--ty-base)">${ddmm(sr.days[i].d)}</text>`).join('')}
  </svg>`;
}
function ssProjBody(p, sr) {
  const s = S.ss; const sim = s.sim ? ssSerie(s.sim) : null; const k = p.day ?? defDay(); const D = (sim || sr).days[k];
  const fin = sr.final, neg = sr.min.saldo < 0;
  const miaTxt = `Considerei seu saldo atual, suas entradas previstas e suas despesas recorrentes e eventuais dos próximos 30 dias.\n\nNo fim do período, em ${ddmm(ssFim())}, seu saldo projetado é de ${fmtK(fin)} — é o valor que deve sobrar, não um limite de gastos.${neg ? `\n\nO ponto de atenção é ${ddmm(sr.min.d)}, quando seu saldo fica mais baixo (${fmtK(sr.min.saldo)}). Concentrar pagamentos fora dessa data ajuda a não ficar no negativo.` : `\n\nNo período, nenhum dia fica negativo — seu saldo se mantém no positivo.`}`;
  return `${s.miaP ? miaMini('miaOk') : miaBox('Como interpretar a projeção', miaTxt, 'miaOk')}
    <div class="col g1"><p class="h3 c-darker">Detalhamento diário</p><p class="b14 c-dark">Veja o impacto das suas escolhas nos próximos 30 dias</p></div>
    ${sim ? `<div class="card col g1" style="border-color:var(--ia);background:var(--ia-bg)"><p class="b14 bold c-darker">Com essas mudanças, seu saldo termina o período em ${fmtK(sim.final)}</p><p class="row g3 cap c-dark"><span class="row g1"><i style="width:14px;height:2px;background:#404040;display:inline-block"></i>Projeção original</span><span class="row g1"><i style="width:14px;border-top:2px dashed #8b3eea;display:inline-block"></i>Simulação</span></p></div>` : ''}
    <div class="card col g3">
      <div class="row jb"><button type="button" data-act="dprev" aria-label="Dia anterior" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--primary);color:var(--primary);display:flex;align-items:center;justify-content:center">${ic('chevron-left', 16)}</button><p class="b16 bold c-darker">${ddmm(D.d)} · ${DIAS[D.d.getDay()]}</p><button type="button" data-act="dnext" aria-label="Próximo dia" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--primary);color:var(--primary);display:flex;align-items:center;justify-content:center">${ic('chevron-right', 16)}</button></div>
      <div class="divider"></div>
      <p class="b14 semi c-darker">Sua tendência até ${ddmmyyyy(ssFim())}</p>
      <div class="row g4"><div><p class="row g1 cap c-base"><i style="width:6px;height:6px;border-radius:50%;background:#348352;display:inline-block"></i>Maior saldo (${ddmm(sr.max.d)})</p><p class="b14 bold c-success money">${fmtK(sr.max.saldo)}</p></div><div><p class="row g1 cap c-base"><i style="width:6px;height:6px;border-radius:50%;background:#d93a3a;display:inline-block"></i>Menor saldo (${ddmm(sr.min.d)})</p><p class="b14 bold money" style="color:${sr.min.saldo < 0 ? 'var(--danger)' : 'var(--ty-dark)'}">${fmtK(sr.min.saldo)}</p></div></div>
      ${ssChart(sr, k, sim)}
      <p class="cap c-base center">Toque no gráfico para ver outro dia</p>
      <div class="card flat col g2"><p class="b14 bold c-darker">Resumo financeiro do dia</p><div class="row jb">${[['Saldo anterior', fmtK(D.prev), D.prev < 0 ? 'var(--danger)' : 'var(--ty-darker)'], ['Operações do dia', sinal(D.saldo - D.prev), D.saldo - D.prev > 0 ? 'var(--success)' : D.saldo - D.prev < 0 ? 'var(--danger)' : 'var(--ty-darker)'], ['Saldo do dia', fmtK(D.saldo), D.saldo < 0 ? 'var(--danger)' : 'var(--success)']].map(([a, v, c]) => `<div class="col"><span class="cap c-base">${a}</span><span class="b14 bold money" style="color:${c}">${v}</span></div>`).join('')}</div>
        <div class="divider"></div><p class="b14 bold c-darker">Lançamentos do dia</p>
        ${D.ops.length ? D.ops.map(o => `<div class="row g3"><span class="ico-c sm" style="background:${o.v > 0 ? 'var(--success-bg)' : o.tipo === 'Poupança' ? 'var(--primary-lighter)' : 'var(--warning-bg)'};color:${o.v > 0 ? 'var(--success)' : o.tipo === 'Poupança' ? 'var(--primary)' : 'var(--warning)'}">${ic(o.v > 0 ? 'arrow-up' : o.tipo === 'Poupança' ? 'piggy-bank' : 'shopping-cart', 16)}</span><div class="f1"><p class="b14 semi c-darker">${esc(o.nome)}${o.sim ? ' <span class="badge ia">simulação</span>' : ''}</p><p class="cap c-base">${o.tipo}</p></div><span class="b14 bold money" style="color:${o.v > 0 ? 'var(--success)' : 'var(--warning)'}">${sinal(o.v)}</span></div>`).join('') : '<p class="b14 c-base">Nenhum lançamento previsto para este dia. O saldo segue o mesmo de ontem.</p>'}
      </div></div>
    ${sim ? `${btn('Substituir projeção atual', { act: 'simApply' })}${btn('Voltar à projeção atual', { v: 'o', act: 'simKeep' })}`
      : `<div class="card col g2"><p class="row g2 b16 semi c-darker"><span class="c-ia">${ic('git-compare-arrows', 20)}</span>Analise mais cenários</p><p class="b14 c-dark">Quer ir além? Simule outros cenários e veja como suas escolhas podem impactar seu saldo.</p>${btn('Fazer simulação', { v: 'o', act: 'sim', attrs: 'style="color:var(--ty-darker);box-shadow:inset 0 0 0 1.5px var(--ty-dark)"' })}</div>`}`;
}
function simSheet() {
  S.tmpSim = { tipo: 'Despesa', nome: '', valorTxt: '', data: '' };
  sheetForm(`<p class="h4 c-darker">Simular um novo lançamento</p><p class="b14 c-dark">Veja como uma receita ou um gasto muda seu saldo, sem alterar o estudo atual.</p>
    <div class="seg" role="tablist">${['Despesa', 'Receita'].map(t => `<button type="button" class="${t === 'Despesa' ? 'on' : ''}" data-act="simTipo" data-t="${t}">${t === 'Despesa' ? 'Gasto' : 'Receita'}</button>`).join('')}</div>
    ${field({ id: 'sn', label: 'Nome', ph: 'ex: Viagem, bônus, conserto do carro', bind: 'tmpSim.nome' })}
    ${field({ id: 'sv', label: 'Valor (R$)', ph: 'R$ 0,00', bind: 'tmpSim.valorTxt', mask: 'brl' })}
    ${field({ id: 'sd', label: 'Data', ph: `Ex: ${ddmmyyyy(addDays(hoje(), 10))}`, bind: 'tmpSim.data', mask: 'data', helper: `Entre ${ddmmyyyy(ssState().inicio)} e ${ddmmyyyy(ssFim())}.` })}`,
    btn('Simular', { act: 'simGo', cls: 'js-next' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }),
    () => { const t = S.tmpSim; const d = parseData(t.data); return t.nome.trim() && parseBRL(t.valorTxt) > 0 && d && d >= addDays(ssState().inicio, 0) && d <= ssFim(); });
}
Object.assign(GLOBAL_ACTS, {
  simTipo: (b) => { S.tmpSim.tipo = b.dataset.t; $$('[data-act=simTipo]').forEach(x => x.classList.toggle('on', x === b)); },
  simGo: () => { const t = S.tmpSim; const v = parseBRL(t.valorTxt) * (t.tipo === 'Receita' ? 1 : -1); S.ss.sim = (S.ss.sim || []).concat([{ nome: t.nome.trim(), v, data: t.data }]); closeOverlays(true); const p = stack[stack.length - 1].p; p.day = Math.round((parseData(t.data) - S.ss.inicio) / 864e5); rerender(); },
});
function updHomeSS() { const sr = ssSerie(); S.saldoSeguro = { negativo: sr.min.saldo < 0, final: sr.final, min: sr.min.saldo, minDay: sr.min.d }; }

/* ---------- entrada e onboarding ---------- */
/* 01.01 / 01.02 - Onboarding do fluxo Clareza (17790:141411 e 17790:141442) */
const SS_OB = ({ fechar, titulo, sub, corpo, dot, foot }) => `${statusBar()}
  <img src="assets/curve.png" alt="" style="position:absolute;left:0;top:0;width:375px;pointer-events:none;z-index:0">
  <div class="ah" style="position:relative;z-index:1"><button type="button" class="bkb" data-back aria-label="${fechar ? 'Fechar' : 'Voltar'}">${ic(fechar ? 'x' : 'chevron-left', 24)}</button></div>
  <div class="scroll px5 col g4" style="position:relative;z-index:1;display:flex;padding-bottom:20px">
    <img src="assets/logo-color.png" alt="Me Paguei" style="height:40px;width:auto;align-self:flex-start;margin-bottom:4px">
    <p class="h1 c-darker">${titulo}</p>
    <p class="b16 c-dark">${sub}</p>
    ${corpo}
    <div class="row jc g1 mt-auto" style="padding-top:16px">${[0, 1].map(k => `<i style="display:block;height:4px;border-radius:2px;width:${k === dot ? 14 : 6}px;background:${k === dot ? 'var(--primary)' : 'var(--border-light)'}"></i>`).join('')}</div>
    <div style="padding-top:8px">${foot}</div></div>${homeInd()}`;
const obItem = (i, t, d) => `<div class="row g3 ais"><span class="ico-c sm">${ic(i, 16)}</span><div class="col g1"><p class="b16 semi c-darker">${t}</p><p class="b14 c-dark">${d}</p></div></div>`;

screen('ssIntro', {
  render: () => SS_OB({
    titulo: 'Projeção de Faturas', dot: 0,
    sub: 'Veja como suas compras parceladas impactam os próximos meses e entenda quanto da sua renda futura já está comprometida.',
    corpo: [['receipt-text', 'Alívio no orçamento', 'Identifique quais parcelas estão chegando ao fim e quanto de folga elas podem liberar nos meses seguintes.'], ['credit-card', 'Visão por cartão', 'Selecione um ou vários cartões para entender como cada um impacta suas finanças.'], ['coins', 'Saldo a pagar', 'Acompanhe quanto ainda resta pagar nas compras parceladas já realizadas.']].map(a => obItem(...a)).join(''),
    foot: btn('Próximo', { go: 'ssOb2' }),
  }),
});
screen('ssOb2', {
  render: () => SS_OB({
    fechar: true, titulo: 'Saldo Seguro', dot: 1,
    sub: 'Para projetar seu saldo para os próximos 30 dias, precisaremos das seguintes informações:',
    corpo: [['wallet', '1. Saldo atual', 'O ponto de partida: o saldo das contas que você escolher.'], ['coins', '2. Entradas previstas', 'Salário, rendas extras e tudo que você espera receber em 30 dias.'], ['repeat', '3. Despesas recorrentes', 'Despesas fixas e faturas de cartão que já têm data de pagamento prevista'], ['gift', '4. Despesas eventuais', 'Viagens, presentes e datas especiais. Usamos os aniversários que você cadastrou em <b class="semi c-darker">Agenda</b>. Se ainda não fez isso, acesso o <b class="semi c-darker">Menu Controle</b>'], ['piggy-bank', '5. Poupança automática', 'Dinheiro poupado não deveria estar disponível para gastos do dia-a-dia ;)']].map(a => obItem(...a)).join(''),
    foot: btn('Começar', { act: 'go' }),
  }),
  acts: { go: () => ssEscolhaSheet() },
});

/* 02.01 - Escolha do estudo (17790:141477) */
const ESTUDOS = [['fat', 'Projeção de faturas', 'Projete seu saldo seguro diário e veja como suas decisões impactam dentro de 30 dias.'], ['ss', 'Projeção do Saldo Seguro', 'Descubra quantos pagamentos você pode assumir nos próximos 30 dias']];
function ssEscolhaSheet() {
  S.tmpEstudo = null;
  const ov = openSheet(`<div class="col g5">
    <div class="col g3"><p class="h4 c-primary">O que você deseja analisar hoje?</p>
      <p class="b14 c-dark">Acompanhar seu fluxo de caixa permite que você antecipe problemas antes que eles apareçam e oportunidades antes que passem.</p></div>
    <div class="col g3">${ESTUDOS.map(([k, t, d]) => `<button type="button" class="rad card est-op" data-act="estSel" data-k="${k}" role="radio" aria-checked="false" style="align-items:flex-start;gap:12px;border-color:var(--border-light)"><span class="o"></span><span class="col g1 f1" style="text-align:left"><span class="b16 semi c-darker">${t}</span><span class="b14 c-base">${d}</span></span></button>`).join('')}</div></div>`,
    { foot: btn('Avançar', { act: 'estOk', cls: 'js-adv' }) + btn('Cancelar', { v: 'o', act: 'closeov' }) });
  $$('.js-adv', ov).forEach(b => b.disabled = true);
}
Object.assign(GLOBAL_ACTS, {
  estSel: (b) => { const ov = b.closest('.ov') || document; S.tmpEstudo = b.dataset.k;
    $$('.est-op', ov).forEach(o => { const on = o.dataset.k === S.tmpEstudo; o.classList.toggle('on', on); o.setAttribute('aria-checked', on); o.style.borderColor = on ? 'var(--primary)' : 'var(--border-light)'; });
    $$('.js-adv', ov).forEach(x => x.disabled = false); },
  estOk: () => { const k = S.tmpEstudo; closeOverlays(true);
    if (k === 'fat') { S.flags.fatVisto = true; reset('clareza', { tab: 'fat' }, 'fade'); return; }
    if (S.flags.ssEntendi) { ssBegin(); return; }
    openSheet(`<div class="col g6">
      <span class="ico-c" style="width:56px;height:56px;background:var(--primary-lighter);color:var(--primary)">${ic('chart-no-axes-combined', 24)}</span>
      <div class="col g4">
        <p class="h4 c-primary">Entenda a projeção</p>
        <p class="b14 semi c-dark">Despesa é o que você consome. Pagamento é quando o dinheiro sai da conta.</p>
        <p class="b14 semi c-primary">Nem sempre os dois acontecem juntos. Uma compra no cartão, por exemplo, é uma despesa hoje, mas só será paga no vencimento da fatura.</p>
        <p class="b14 c-dark">O Saldo Seguro mostra quanto você pode <b class="semi c-darker">assumir em pagamentos</b>, sem comprometer suas finanças.</p>
      </div>
      ${checkbox('flags.ssEntendi', 'Não visualizar esta mensagem novamente', false)}</div>`, { foot: btn('Entendi', { act: 'ssEntOk' }) }); },
  ssEntOk: () => { closeOverlays(true); ssBegin(); },
});
function ssBegin() { S.ss = null; ssState(); if (!S.contas.length) { go('ssSemConta'); return; } go('ssContas'); }
screen('ssSemConta', {
  render: () => `${statusBar()}${appHeader('Projeção de Saldo Seguro')}<div class="col g4 px5" style="flex:1;justify-content:center"><div class="empty"><span class="ico-c" style="width:56px;height:56px">${ic('landmark', 24)}</span><p class="h3 c-darker">Conecte suas contas para projetar</p><p class="b14 c-dark">O ponto de partida do Saldo Seguro é o saldo atual das suas contas. Conecte-as com segurança via Open Finance.</p></div>${btn('Conectar contas', { go: 'of1' })}</div>${homeInd()}`,
});

/* ---------- passo 1 · saldo atual ---------- */
screen('ssContas', {
  cls: 'grad',
  render: () => { const s = ssState(); const dest = S.destino && S.destino.bank; const disp = S.contas.filter(id => id !== dest);
    const row = id => `<button type="button" class="card row g3" data-act="tgl" data-b="${id}" role="checkbox" aria-checked="${!!s.contasSel[id]}" style="text-align:left">${bankIc(id)}<span class="f1 col"><span class="b16 semi c-darker">${BANKS[id].nome}</span><span class="cap c-base">Saldo: ${fmtBRL(contaSaldo(id))}</span></span><span class="chk ${s.contasSel[id] ? 'on' : ''}" style="width:auto"><span class="box" style="width:20px;height:20px;margin:0">${ic('check', 14)}</span></span></button>`;
    const manual = s.manual != null;
    return ssStep({ step: 1, title: 'Saldo atual', sub: 'Selecione as contas que irão compor seu saldo para a projeção:',
      body: `${periodoChip()}<p class="b16 bold c-darker">Disponíveis</p><div class="col g3">${disp.map(row).join('')}</div>
        ${dest ? `<p class="b16 bold c-darker">Conta destino</p><p class="b14 c-dark">Sua conta destino, definida para receber seus aportes automáticos, começa desmarcada para proteger suas economias. Ative-a manualmente se quiser considerar o saldo da conta destino em sua projeção</p>${row(dest)}` : ''}`,
      foot: `<div class="col g1"><p class="b14 c-dark">Saldo inicial da projeção ${manual ? '<span class="badge info">Manual</span>' : ''}</p><div class="row jb"><p class="h2 c-darker num">${fmtBRL(ssInicial())}</p><button type="button" class="row g1 b14 semi c-primary" data-act="edit">${ic('pencil', 14)} ${ssSoma() || manual ? 'Editar valor' : 'Informar valor'}</button></div>
        <p class="b14 c-base">${manual ? `Vamos usar esse valor na projeção, no lugar da soma das contas selecionadas (${fmtBRL(ssSoma())}).` : ssSoma() ? 'Soma das contas selecionadas. Tem dinheiro fora delas? Você pode ajustar o valor.' : 'Nenhuma conta selecionada. Você pode adicionar manualmente o valor que desejar'}</p>
        ${manual ? '<button type="button" class="b14 semi c-primary" data-act="unman" style="align-self:flex-start">Voltar para a soma das contas</button>' : ''}</div>
        ${btn(manual ? 'Continuar com este valor' : 'Usar estas contas', { next: true, act: 'next' })}${btn('Cancelar', { v: 'o', act: 'ssCancel' })}` }); },
  valid: () => ssInicial() !== 0 || ssState().manual != null,
  acts: {
    tgl: (b) => { const s = ssState(); s.contasSel[b.dataset.b] = !s.contasSel[b.dataset.b]; rerender(); },
    edit: () => { S.flags.ssMan = fmtBRL(ssInicial()); sheetForm(`<p class="h4 c-darker">Saldo inicial da projeção</p><p class="b14 c-dark">Tem dinheiro fora das contas conectadas? Informe o valor que devemos considerar como ponto de partida.</p>${field({ id: 'man', label: 'Valor (R$)', ph: 'R$ 0,00', bind: 'flags.ssMan', mask: 'brl' })}`, btn('Salvar', { act: 'manOk', cls: 'js-next' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }), () => !!S.flags.ssMan); },
    manOk: () => { ssState().manual = parseBRL(S.flags.ssMan); closeOverlays(true); rerender(); },
    unman: () => { ssState().manual = null; rerender(); },
    next: () => go('ssEntr'),
  },
});

/* ---------- passo 2 · entradas ---------- */
const FOUND_E = () => { const d = k => ddmmyyyy(addDays(hoje(), -k)); return [['PIX RECEBIDO - REM ARTHUR LEMOS - DOCTO: 584621', d(20), 3000], ['DEPÓSITO SALÁRIO - MARIA SILVA - DOCTO: 784512', d(20), 4500], ['TRANSFERÊNCIA RECEBIDA - CLIENTE JOÃO PEREIRA - DOC: 123987', d(22), 1250.75], ['TRANSFERÊNCIA RECEBIDA - CLIENTE JOÃO PEREIRA - DOC: 123987', d(24), 2000]]; };
function entradaCard(e, k, kind) {
  return `<div class="card row g3 ais" style="border-color:var(--border-lighter)"><span class="ico-c sm">${ic('banknote-arrow-up', 16)}</span><div class="f1 col g1"><p class="b14 bold c-darker">${esc(e.nome)}</p><p class="row g1 cap c-dark">${ic(e.rec ? 'repeat' : 'calendar', 14)} ${esc(entradaQuando(e))}</p><p class="row g1 cap c-dark">${ic('banknote', 14)} ${fmtBRL(e.valor)}</p></div><button type="button" data-act="emenu" data-k="${k}" data-kind="${kind}" aria-label="Opções" style="color:var(--ty-dark)">${ic('ellipsis-vertical', 18)}</button></div>`;
}
function entradaSheet(e, onSave) {
  S.tmpE = e ? { ...e, valorTxt: fmtBRL(e.valor), diaTxt: String(e.dia || '') } : { nome: '', rec: null, tipo: '', diaTxt: '', data: '', valorTxt: '' };
  const draw = () => {
    const t = S.tmpE; closeOverlays(true);
    const ov = sheetForm(`<p class="h4 c-darker">${e ? 'Editar entrada' : 'Adicionar entrada'}</p>
      <div class="col g1"><p class="b16 semi c-darker">Repete todos os meses?</p><p class="b14 c-base">Saber sobre essa entrada nos ajuda a projetar seu saldo futuro com mais precisão.</p></div>
      ${['sim', 'nao'].map(k => `<button type="button" class="radc ${t.rec === (k === 'sim') ? 'on' : ''}" data-act="erec" data-k="${k}"><span class="rad ${t.rec === (k === 'sim') ? 'on' : ''}"><span class="o"></span><span class="lb">${k === 'sim' ? 'Sim, ela se repete todo mês' : 'Não, é um valor único'}</span></span><span class="d">${k === 'sim' ? 'Como salário, aluguel ou mesada.' : 'Um recebimento pontual e único.'}</span></button>`).join('')}
      ${field({ id: 'en', label: 'Nome', ph: 'ex: Salário, Freela, Aluguel', bind: 'tmpE.nome' })}
      ${t.rec === true ? `<div class="fld"><label class="fld-l" for="et">Tipo de data</label><div class="inp"><select id="et" class="${t.tipo ? '' : 'ph'}"><option value="" ${t.tipo ? '' : 'selected'} disabled>Selecionar</option><option value="fixo" ${t.tipo === 'fixo' ? 'selected' : ''}>Dia fixo no mês</option><option value="util" ${t.tipo === 'util' ? 'selected' : ''}>Dia útil no mês</option></select><span class="ib">${ic('chevron-down', 18)}</span></div><p class="fld-h">Assim sabemos quando esperar esse valor todos os meses.</p></div>
        ${t.tipo ? `<div class="fld"><label class="fld-l" for="ed">${t.tipo === 'util' ? 'Dia útil do mês' : 'Dia do mês'}</label><div class="row g2 b16 c-dark">${t.tipo === 'util' ? 'Todo' : 'Todo dia'}<div class="inp" style="width:72px"><input id="ed" data-bind="tmpE.diaTxt" data-mask="int" inputmode="numeric" value="${esc(t.diaTxt)}" placeholder="" style="text-align:center"></div>${t.tipo === 'util' ? 'dia útil do mês' : 'do mês'}</div><p class="fld-h">${t.tipo === 'util' ? 'Escolha entre o 1º e o 20º dia útil do mês.' : 'Escolha um dia de 1 a 31.'}</p></div>` : ''}`
        : t.rec === false ? field({ id: 'edt', label: 'Data prevista de recebimento', ph: `Ex: ${ddmmyyyy(addDays(hoje(), 7))}`, bind: 'tmpE.data', mask: 'data' }) : ''}
      ${field({ id: 'ev', label: 'Valor estimado (R$)', ph: 'Digite o valor', bind: 'tmpE.valorTxt', mask: 'brl' })}`,
      btn(e ? 'Salvar alterações' : 'Salvar', { act: 'eSave', cls: 'js-next' }) + btn('Voltar', { v: 'o', act: 'dlgClose' }),
      () => { const t = S.tmpE; const dia = +t.diaTxt; if (!t.nome.trim() || parseBRL(t.valorTxt) <= 0 || t.rec == null) return false; if (t.rec) return t.tipo && dia >= 1 && dia <= (t.tipo === 'util' ? 20 : 31); return !!parseData(t.data); });
    ov.querySelector('#et')?.addEventListener('change', ev => { S.tmpE.tipo = ev.target.value; draw(); });
  };
  S.flags.eDraw = draw; S.flags.eSave = onSave; draw();
}
Object.assign(GLOBAL_ACTS, {
  erec: (b) => { S.tmpE.rec = b.dataset.k === 'sim'; S.flags.eDraw(); },
  eSave: () => { const t = S.tmpE; const e = { nome: t.nome.trim(), rec: t.rec, tipo: t.tipo, dia: +t.diaTxt, data: t.data, valor: parseBRL(t.valorTxt) }; closeOverlays(true); S.flags.eSave(e); },
});
screen('ssEntr', {
  cls: 'grad',
  render: (p) => { const s = ssState(); const rendaTot = s.renda.reduce((a, e) => a + e.valor, 0); const extra = s.entradas.reduce((a, e) => a + e.valor, 0);
    return ssStep({ step: 2, title: 'Entradas', sub: 'Quanto você recebe todos os meses?',
      body: `${s.miaE ? miaMini('miaE') : s.renda.length ? miaBox('', `<b class="c-dark" style="font-size:16px">${fmtBRL(rendaTot)}</b>\nSua renda mensal cadastrada é de ${fmtBRL(rendaTot)}.\n\nVocê pode editar sua renda mensal, ou adicionar/remover entradas específicas para a projeção dos próximos 30 dias`, 'miaE', 'Entendi', 'Sua assistente financeira')
        : miaBox('Vamos começar pelas suas entradas', ['Eu consigo consultar seus extratos e identificar entradas que devem ser sua renda mensal. Porém, é muito comum existirem oscilações de renda ao longo dos meses. Por isso, nessa etapa, eu prefiro que você me ajude:\n\nMe conta o que você costuma receber mensalmente (considere salário, alugueis recebidos, mesadas, pensões, dentre outros).', 'Caso sua renda oscile por conta de comissões ou prêmios, me informe qual o valor médio esperado por mês: o importante não é acertar na mosca, mas ter clareza sobre a direção'], 'miaE')}
        ${s.renda.length ? `<div class="col g3"><p class="b16 bold c-darker">Sua renda cadastrada</p>${s.renda.map((e, k) => entradaCard(e, k, 'renda')).join('')}<p class="b14 c-dark">Renda mensal cadastrada: <b>${fmtBRL(rendaTot)}</b></p></div><div class="divider"></div>` : ''}
        <div class="col g3"><p class="b16 bold c-darker">Configurar suas entradas</p><p class="b14 c-dark">Cadastre as rendas que você costuma receber e informe o valor e a data esperada de cada uma. Assim, sabemos <b>quanto você espera receber</b> e <b>quando esse dinheiro deve entrar</b>.</p>
          ${s.entradas.length ? `<p class="cap c-base">Incluídas: ${s.entradas.length}</p>${s.entradas.map((e, k) => entradaCard(e, k, 'ent')).join('')}<p class="b14 c-dark">Total de receitas identificadas: <b>${fmtBRL(extra)}</b></p>` : ''}
          ${btn(ic('plus', 14) + ' Adicionar entrada', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-end;padding:0 14px"' })}</div>
        <div class="card col g2"><button type="button" class="row g3" data-act="found" aria-expanded="${!!p.found}"><span class="ico-c sm" style="background:var(--ia-bg);color:var(--ia)">${ic('sparkles', 16)}</span><span class="f1 col" style="text-align:left"><span class="b16 semi c-darker">Consulte suas entradas</span><span class="cap c-base">Lançamentos encontrados: ${FOUND_E().length}</span></span>${ic(p.found ? 'chevron-up' : 'chevron-down', 18)}</button>
          ${p.found ? `<p class="b14 c-dark">Encontramos estas entradas nas suas contas no último mês. Use-as como referência para lembrar os valores das suas receitas</p>${FOUND_E().map(([n, d, v]) => `<div class="li"><span class="lt col"><span class="cap semi c-darker">${n}</span><span class="cap c-base">${d}</span></span><span class="b14 bold c-success">${fmtBRL(v)}</span></div>`).join('')}<p class="b14 c-dark">Valor total: <b>${fmtBRL(FOUND_E().reduce((a, e) => a + e[2], 0))}</b></p>` : ''}</div>`,
      foot: ssFoot('Total de entradas cadastradas:', rendaTot + extra, 'Esta é a sua renda média mensal') }); },
  valid: () => allEntradas().length > 0,
  acts: {
    miaE: () => { const st = ssState(); st.miaE = !st.miaE; rerender(); },
    add: () => entradaSheet(null, e => { ssState().entradas.push(e); rerender(); toast('Entrada adicionada'); }),
    found: () => { const p = stack[stack.length - 1].p; p.found = !p.found; rerender(); },
    emenu: (b) => { const k = +b.dataset.k, kind = b.dataset.kind; openSheet(`<button type="button" class="li" data-act="eEdit" data-k="${k}" data-kind="${kind}">${ic('pencil', 20)}<span class="lt b16 c-darker">Editar</span></button><button type="button" class="li" data-act="eDel" data-k="${k}" data-kind="${kind}" style="color:var(--danger)">${ic('trash-2', 20)}<span class="lt b16">Remover da projeção</span></button>`); },
    eEdit: (b) => { const arr = b.dataset.kind === 'renda' ? ssState().renda : ssState().entradas; const k = +b.dataset.k; closeOverlays(true); entradaSheet(arr[k], e => { arr[k] = e; rerender(); toast('Alterações salvas!'); }); },
    eDel: (b) => { const arr = b.dataset.kind === 'renda' ? ssState().renda : ssState().entradas; arr.splice(+b.dataset.k, 1); closeOverlays(true); rerender(); },
    next: () => go('ssRec'),
  },
});

/* ---------- passo 3 · despesas recorrentes ---------- */
const CATS = ['Moradia', 'Saúde', 'Educação', 'Transporte', 'Assinaturas', 'Serviços', 'Outros'];
/* cada categoria de gasto tem cor e ícone próprios, para diferenciar na lista */
const CAT_COR = { 'Moradia': ['var(--warning)', 'var(--warning-bg)', 'house'], 'Saúde': ['var(--success)', 'var(--success-bg)', 'heart'],
  'Educação': ['var(--primary)', 'var(--primary-bg)', 'book-open'], 'Transporte': ['var(--ia)', 'var(--ia-bg)', 'car'],
  'Assinaturas': ['var(--danger)', 'var(--danger-bg)', 'repeat'], 'Serviços': ['var(--link)', '#e6f3fd', 'settings'],
  'Outros': ['var(--ty-base)', 'var(--bg-lighter)', 'receipt-text'] };
const catCor = c => CAT_COR[c] || CAT_COR['Outros'];
const FOUND_G = [['Conta de luz', 'Moradia', 15, 180], ['Telefonia Vivo', 'Moradia', 15, 110], ['Academia', 'Saúde', 10, 120]];
function gastoSheet(g, onSave) {
  S.tmpG = g ? { ...g, valorTxt: fmtBRL(g.valor), diaTxt: String(g.dia) } : { nome: '', cat: '', diaTxt: '', valorTxt: '' };
  sheetForm(`<p class="h4 c-darker">${g && g.nome ? 'Editar despesa recorrente' : 'Adicionar despesa recorrente'}</p><p class="b14 c-dark">Cadastre aqui apenas despesas recorrentes que não são pagas no cartão de crédito</p>
    ${field({ id: 'gn', label: 'Nome', ph: 'ex: Empreender Dinheiro', bind: 'tmpG.nome' })}${selectField({ id: 'gc', label: 'Categoria', bind: 'tmpG.cat', options: CATS })}
    <div class="fld"><label class="fld-l" for="gd">Dia estimado de vencimento</label><div class="row g2 b16 c-dark">Todo dia<div class="inp" style="width:72px"><input id="gd" data-bind="tmpG.diaTxt" data-mask="int" inputmode="numeric" value="${esc(S.tmpG.diaTxt)}" placeholder="5" style="text-align:center"></div>do mês</div><p class="fld-h">Escolha um dia de 1 a 31.</p></div>
    ${field({ id: 'gv', label: 'Valor (R$)', ph: 'R$ 100,00', bind: 'tmpG.valorTxt', mask: 'brl' })}`,
    btn('Salvar', { act: 'gSave', cls: 'js-next' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }),
    () => { const t = S.tmpG; const d = +t.diaTxt; return t.nome.trim() && t.cat && d >= 1 && d <= 31 && parseBRL(t.valorTxt) > 0; });
  S.flags.gSave = onSave;
}
GLOBAL_ACTS.gSave = () => { const t = S.tmpG; closeOverlays(true); S.flags.gSave({ nome: t.nome.trim(), cat: t.cat, dia: +t.diaTxt, valor: parseBRL(t.valorTxt) }); };
screen('ssRec', {
  cls: 'grad',
  render: (p) => { const s = ssState(); const fatT = Object.values(s.faturas).reduce((a, f) => a + (f.valor || 0), 0); const gT = s.gastos.reduce((a, g) => a + g.valor, 0);
    const intro = !s.miaG;
    return ssStep({ step: 3, title: 'Despesas recorrentes', sub: 'Vamos separar os gastos recorrentes que não são pagos no cartão de crédito. Seu Saldo Seguro também considera suas próximas faturas.',
      body: intro ? `${miaBlock('miaR', 'Hora de configurar suas despesas recorrentes', 'Assim como na renda mensal, eu prefiro que você me ajude a configurar suas despesas recorrentes.\n\nParece que dá trabalho, mas é rápido e você só precisa fazer uma vez!\n\nAo clicar em Configurar gastos recorrentes, vou te guiando até que tenhamos tudo pronto!')}`
        : `${Object.keys(s.faturas).length ? `<div class="col g3"><p class="b16 bold c-darker">Cartões de crédito</p><p class="b14 c-dark">Quando suas faturas estão fechadas, sabemos exatamente qual será o valor na data de vencimento.\n\nEm faturas abertas, você pode estimar quanto será o valor da fatura no vencimento, caso pretenda usar o cartão até o fechamento da fatura.</p>
          ${Object.entries(s.faturas).map(([id, f]) => `<div class="card row g3">${bankIc(id)}<div class="f1 col"><p class="b14 bold c-darker">Fatura ${BANKS[id].curto}</p><p class="cap c-dark">Status: ${f.status}</p><p class="cap c-dark">Vencimento (dia): ${f.dia}</p>${f.valor ? `<p class="cap c-dark">Valor: <b>${fmtBRL(f.valor)}</b></p>` : ''}</div>${f.status === 'aberta' ? `<button type="button" class="btn btn-o btn-xs auto" data-act="estimar" data-b="${id}" style="padding:0 12px">${f.valor ? 'Editar' : 'Estimar valor'}</button>` : ''}</div>`).join('')}
          <p class="b14 c-dark">Total de pagamentos em cartões de crédito nos próximos 30 dias: <b>${fmtBRL(fatT)}</b></p></div><div class="divider"></div>` : ''}
        <div class="col g3"><p class="b16 bold c-darker">Configurar gastos manualmente</p><p class="b14 c-dark">Cadastre os gastos que fazem parte da sua rotina e que não sejam pagos com cartão de crédito.</p>
          ${s.gastos.length ? `<p class="cap c-base">Incluídas: ${s.gastos.length}</p>${s.gastos.map((g, k) => { const [cf, cb, ci] = catCor(g.cat); return `<div class="card row g3 ais" style="border-color:var(--border-lighter)"><span class="ico-c sm" style="background:${cb};color:${cf}">${ic(ci, 16)}</span><div class="f1 col g1"><p class="cap semi" style="color:${cf}">${g.cat}</p><p class="b14 bold c-darker">${esc(g.nome)}</p><p class="row g1 cap c-dark">${ic('repeat', 14)} Todo dia ${g.dia} · ${fmtBRL(g.valor)}</p></div><button type="button" data-act="gmenu" data-k="${k}" aria-label="Opções" style="color:var(--ty-dark)">${ic('ellipsis-vertical', 18)}</button></div>`; }).join('')}<p class="b14 c-dark">Total de gastos adicionados: <b>${fmtBRL(gT)}</b></p>` : ''}
          ${btn(ic('plus', 14) + ' Adicionar gastos recorrentes', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-end;padding:0 14px"' })}</div>
        <div class="card col g2"><button type="button" class="row g3" data-act="found" aria-expanded="${!!p.found}"><span class="ico-c sm" style="background:var(--ia-bg);color:var(--ia)">${ic('sparkles', 16)}</span><span class="f1 col" style="text-align:left"><span class="b16 semi c-darker">Consulte seus gastos</span><span class="cap c-base">Total encontradas: ${FOUND_G.length}</span></span>${ic(p.found ? 'chevron-up' : 'chevron-down', 18)}</button>
          ${p.found ? `<p class="b14 c-dark">Encontramos pagamentos repetidos nos últimos 3 meses. Considere apenas gastos realizados fora do cartão de crédito. Use esta lista como referência para cadastrar seus gastos.</p>${FOUND_G.map(([n, c, d, v]) => `<div class="li"><span class="lt col"><span class="b14 semi c-darker">${n}</span><span class="cap c-base">${c} · dia ${d} · Média mensal dos últimos 90 dias</span></span><span class="b14 bold c-darker">${fmtBRL(v)}</span></div>`).join('')}` : ''}</div>`,
      foot: intro ? btn('Configurar gastos recorrentes', { act: 'start' }) + btn('Cancelar', { v: 'o', act: 'ssCancel' }) : ssFoot('Total de gastos recorrentes', fatT + gT, 'Soma dos gastos selecionados') }); },
  acts: {
    start: () => { ssState().miaG = true; rerender(); },
    estimar: (b) => { const id = b.dataset.b; S.flags.fatV = ssState().faturas[id].valor ? fmtBRL(ssState().faturas[id].valor) : ''; S.flags.fatB = id; sheetForm(`<p class="h4 c-darker">Estimar fatura ${BANKS[id].curto}</p><p class="b14 c-dark">A fatura ainda está aberta. Quanto você imagina que ela vai fechar, considerando o que ainda pretende gastar até o fechamento?</p>${field({ id: 'fv', label: 'Valor estimado (R$)', ph: 'R$ 0,00', bind: 'flags.fatV', mask: 'brl' })}`, btn('Salvar', { act: 'fatOk', cls: 'js-next' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }), () => parseBRL(S.flags.fatV) > 0); },
    fatOk: () => { ssState().faturas[S.flags.fatB].valor = parseBRL(S.flags.fatV); closeOverlays(true); rerender(); },
    add: () => gastoSheet(null, g => { ssState().gastos.push(g); rerender(); toast('Despesa adicionada'); }),
    found: () => { const p = stack[stack.length - 1].p; p.found = !p.found; rerender(); },
    gmenu: (b) => { const k = +b.dataset.k; openSheet(`<button type="button" class="li" data-act="gEdit" data-k="${k}">${ic('pencil', 20)}<span class="lt b16 c-darker">Editar</span></button><button type="button" class="li" data-act="gDel" data-k="${k}" style="color:var(--danger)">${ic('trash-2', 20)}<span class="lt b16">Remover da projeção</span></button>`); },
    gEdit: (b) => { const k = +b.dataset.k; closeOverlays(true); gastoSheet(ssState().gastos[k], g => { ssState().gastos[k] = g; rerender(); }); },
    gDel: (b) => { ssState().gastos.splice(+b.dataset.k, 1); closeOverlays(true); rerender(); },
    next: () => go('ssEvt'),
  },
});

/* ---------- passo 4 · gastos eventuais ---------- */
function datasComemorativas() {
  const ini = ssState().inicio, fim = ssFim(), y = ini.getFullYear(), out = [];
  const nthSun = (yy, m, n) => { const d = new Date(yy, m, 1); d.setDate(1 + (7 - d.getDay()) % 7 + (n - 1) * 7); return d; };
  const lastFri = (yy, m) => { const d = new Date(yy, m + 1, 0); d.setDate(d.getDate() - ((d.getDay() + 2) % 7)); return d; };
  [y, y + 1].forEach(yy => [['Dia das Mães', nthSun(yy, 4, 2)], ['Dia dos Namorados', new Date(yy, 5, 12)], ['Dia dos Pais', nthSun(yy, 7, 2)], ['Independência do Brasil', new Date(yy, 8, 7)], ['Dia das Crianças', new Date(yy, 9, 12)], ['Finados', new Date(yy, 10, 2)], ['Black Friday', lastFri(yy, 10)], ['Natal', new Date(yy, 11, 25)], ['Ano Novo', new Date(yy, 11, 31)]].forEach(([n, d]) => { if (d >= ini && d <= fim) out.push({ nome: n, data: ddmmyyyy(d), tipo: 'data' }); }));
  return out;
}
function anivs() {
  const ini = ssState().inicio, fim = ssFim(); const out = [];
  S.user.pessoas.forEach(p => { const m = p.nasc.match(/^(\d{2})\/(\d{2})/); if (!m) return; [ini.getFullYear(), ini.getFullYear() + 1].forEach(yy => { const d = new Date(yy, +m[2] - 1, +m[1]); if (d >= ini && d <= fim) out.push({ nome: p.nome, sub: `${ddmm(d)} - ${p.par}`, data: ddmmyyyy(d), tipo: 'aniv' }); }); });
  return out;
}
function evtSheet(base, onSave) {
  S.tmpEv = { nome: base.nome, data: base.data || '', pag: base.pag || '', valorTxt: base.valor ? fmtBRL(base.valor) : '', nao: !!base.nao };
  const manual = base.tipo === 'manual';
  sheetForm(`<p class="h4 c-darker">${manual ? (base.nome ? 'Editar despesa eventual' : 'Nova despesa eventual') : base.valor ? 'Editar gasto previsto' : 'Quanto você pretende gastar?'}</p>
    ${manual ? field({ id: 'evn', label: 'Nome', ph: 'ex: Viagem, conserto, presente', bind: 'tmpEv.nome' }) : `<div class="col g1"><p class="b14 semi c-darker">Evento</p><p class="b16 c-dark">${esc(base.nome)}${base.sub ? ' · ' + esc(base.sub.split(' - ')[1] || '') : ''}</p></div><div class="col g1"><p class="b14 semi c-darker">Data do evento</p><p class="b16 c-dark">${base.data}</p></div>`}
    ${field({ id: 'evp', label: manual ? 'Data do desembolso' : 'Data prevista do pagamento', ph: `Ex: ${ddmmyyyy(addDays(hoje(), 10))}`, bind: 'tmpEv.pag', mask: 'data', helper: manual ? '' : 'Quando o dinheiro deve sair da sua conta. Pode ser antes do evento.' })}
    ${field({ id: 'evv', label: 'Valor previsto (R$)', ph: 'R$ 150,00', bind: 'tmpEv.valorTxt', mask: 'brl' })}
    ${manual ? '<p class="cap c-dark" style="background:var(--primary-lighter);border-radius:8px;padding:10px">Aqui você deve informar o valor esperado para pagamento nos próximos 30 dias, com esta despesa eventual. Lembre-se: despesa é o que você consome, pagamento é quando o dinheiro sai da conta.</p>' : `${checkbox('tmpEv.nao', 'Não pretendo gastar neste evento', S.tmpEv.nao)}<p class="cap c-dark" style="background:var(--primary-lighter);border-radius:8px;padding:10px">O que entra na projeção é o pagamento, não o evento. É assim que calculamos seu Saldo Seguro com precisão.</p>`}`,
    btn('Salvar', { act: 'evSave', cls: 'js-next' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }),
    () => { const t = S.tmpEv; if (t.nao) return true; const d = parseData(t.pag); return (!manual || t.nome.trim()) && d && d >= ssState().inicio && d <= ssFim() && parseBRL(t.valorTxt) > 0; });
  S.flags.evSave = onSave;
}
GLOBAL_ACTS.evSave = () => { const t = S.tmpEv; closeOverlays(true); S.flags.evSave({ nome: t.nome.trim(), pag: t.pag, valor: t.nao ? 0 : parseBRL(t.valorTxt), nao: !!t.nao }); };
screen('ssEvt', {
  cls: 'grad',
  render: () => { const s = ssState(); const dc = datasComemorativas(), an = anivs();
    const evOf = (base) => s.eventos.find(e => e.key === base.tipo + base.nome + base.data);
    const evRow = (base, color) => { const e = evOf(base); return `<div class="card col g1" style="border-color:var(--border-lighter)"><div class="row jb ais"><div><p class="b14 bold c-darker">${esc(base.nome)}</p><p class="cap c-base">${base.sub || base.data}</p></div><p class="b14 c-dark">${e ? (e.nao ? 'Sem gasto' : fmtBRL(e.valor)) : 'R$ 0,00'}</p></div><button type="button" class="cap semi row g1" data-act="evAdd" data-key="${esc(base.tipo + base.nome + base.data)}" style="color:${color};align-self:flex-start">${e ? 'Editar gasto previsto' : 'Adicionar gasto previsto'} ${ic('chevrons-right', 14)}</button></div>`; };
    S.flags.evBases = [...dc, ...an];
    const manuais = s.eventos.filter(e => e.tipo === 'manual');
    const tot = s.eventos.reduce((a, e) => a + (e.nao ? 0 : e.valor), 0);
    return ssStep({ step: 4, title: 'Gastos eventuais', sub: 'Preveja datas e eventos dos próximos 30 dias para evitar impactos no saldo',
      body: `${dc.length ? `<div class="card col g3"><p class="row g2 b16 semi c-darker"><span class="ico-c sm">${ic('party-popper', 16)}</span>Datas comemorativas</p><p class="b14 c-dark">Mapeamos os principais eventos de acordo com o calendário nacional brasileiro.</p><p class="cap c-base">Total encontradas: ${dc.length}</p>${dc.map(b => evRow(b, 'var(--primary)')).join('')}</div>` : ''}
        ${an.length ? `<div class="card col g3"><p class="row g2 b16 semi c-darker"><span class="ico-c sm" style="background:var(--warning-bg);color:var(--warning)">${ic('cake', 16)}</span>Presentes e Aniversários</p><p class="b14 c-dark">Lista de aniversários importadas da sua Agenda, que pertence ao menu Controle.</p><p class="cap c-base">Total encontradas: ${an.length}</p>${an.map(b => evRow(b, 'var(--warning)')).join('')}</div>`
          : miaBlock('miaA', 'Não encontrei aniversários cadastrados', 'Você ainda não cadastrou pessoas próximas na Agenda, no menu Controle.\n\nAniversários, viagens e presentes entram aqui. Cadastrar agora evita que eles te peguem de surpresa.', 'Sua assistente financeira')}
        <div class="col g3"><p class="b16 bold c-darker">Outras despesas eventuais</p><p class="b14 c-dark">Deseja adicionar alguma outra despesa que deve ocorrer nos próximos 30 dias? Caso não, clique em Avançar.</p>
          ${manuais.map(e => `<div class="card row g3" style="border-color:var(--border-lighter)"><span class="ico-c sm" style="background:var(--warning-bg);color:var(--warning)">${ic('shopping-bag', 16)}</span><div class="f1 col"><p class="b14 bold c-darker">${esc(e.nome)}</p><p class="cap c-base">${e.pag}</p></div><p class="b14 bold c-darker">${fmtBRL(e.valor)}</p><button type="button" data-act="evDel" data-key="${esc(e.key)}" aria-label="Remover" style="color:var(--ty-base)">${ic('x', 16)}</button></div>`).join('')}
          ${btn(ic('plus', 14) + ' Adicionar gasto manualmente', { v: 'o', cls: 'btn-xs auto', act: 'evMan', attrs: 'style="align-self:flex-end;padding:0 14px"' })}</div>`,
      foot: ssFoot('Total de gastos eventuais', tot, 'Soma dos gastos selecionados') }); },
  acts: {
    evAdd: (b) => { const key = b.dataset.key; const base = S.flags.evBases.find(x => x.tipo + x.nome + x.data === key); const ex = ssState().eventos.find(e => e.key === key); evtSheet({ ...base, ...(ex || {}) }, v => { const s = ssState(); const i = s.eventos.findIndex(e => e.key === key); const obj = { key, nome: base.nome, data: base.data, tipo: base.tipo, ...v, nome2: v.nome }; obj.nome = base.tipo === 'aniv' ? `Presente ${base.nome.split(' ')[0]}` : base.nome; if (i >= 0) s.eventos[i] = obj; else s.eventos.push(obj); rerender(); }); },
    evMan: () => evtSheet({ nome: '', tipo: 'manual' }, v => { ssState().eventos.push({ key: 'm' + Date.now(), tipo: 'manual', ...v }); rerender(); toast('Despesa adicionada'); }),
    evDel: (b) => { const s = ssState(); s.eventos = s.eventos.filter(e => e.key !== b.dataset.key); rerender(); },
    next: () => go('ssPoup'),
  },
});

/* ---------- passo 5 · poupança ---------- */
screen('ssPoup', {
  cls: 'grad',
  render: () => { const vf = poupState().vf; const ds = vfDatas(); const pp = poupState();
    return ssStep({ step: 5, title: 'Poupanças', sub: 'Suas regras de poupança automática também são consideradas na projeção ;)',
      body: vf && !vf.pausada ? `<div class="col g3"><p class="b16 bold c-darker">Poupança automática</p>
          <div class="card col g2" style="border-color:var(--border-lighter)"><p class="row g2 b14 bold c-darker"><span class="ico-c sm">${ic('piggy-bank', 16)}</span>Valor fixo</p>
          <p class="b14 c-dark">Regra ativa: <b class="c-darker">${freqTxt(vf.freq).toLowerCase()}, ${fmtBRL(vf.valor)}</b> são transferidos para sua conta-destino automaticamente.</p>
          <p class="b14 c-dark">Este valor será reduzido do seu Saldo Seguro, afinal, dinheiro poupado não deveria estar disponível para gastos do dia-a-dia ;)</p></div></div>
          ${pp.troco || pp.placar ? miaBlock('miaT', 'Troco Inteligente & Placar do Bem', 'Já que não sabemos se seu time vai ganhar, nem o quanto você vai acumular em centavos, não considero estas opções na sua projeção do Saldo Seguro.', 'Sua assistente financeira') : ''}`
        : miaBlock('miaN', '', 'Nenhum mecanismo de poupança automática foi encontrado em suas configurações.\n\nSeu estudo funciona igual. Mas lembre-se que você pode usar o Menu Poupar para guardar dinheiro no piloto automático ;)', 'Sua assistente financeira'),
      foot: btn(vf && !vf.pausada ? 'Avançar' : 'Pular', { act: 'next' }) + btn('Cancelar', { v: 'o', act: 'ssCancel' }) }); },
  acts: { next: () => go('ssResumo') },
});

/* ---------- resumo ---------- */
screen('ssResumo', {
  cls: 'grad',
  render: (p) => { const s = ssState(); const open = p.open || {}; const L = ssLanc();
    const sec = (k, title, total, totLabel, inner, editTo) => `<div class="card col g3"><button type="button" class="row jb" data-act="tog" data-k="${k}" aria-expanded="${!!open[k]}"><span class="b16 bold c-darker">${title}</span>${ic(open[k] ? 'chevron-up' : 'chevron-down', 18)}</button>${open[k] ? inner : ''}<div class="row jb"><span class="b14 c-dark">${totLabel}</span><span class="b16 bold c-darker num">${fmtBRL(total)}</span></div><button type="button" class="cap semi c-primary row g1" data-act="editStep" data-to="${editTo}" style="align-self:flex-start">${ic('pencil', 14)} Editar ${title.toLowerCase()}</button></div>`;
    const item = (a, b, v, tag) => `<div class="li" style="padding:10px 0"><span class="lt col"><span class="b14 semi c-darker">${esc(a)}</span><span class="cap c-base">${b}</span></span><span class="col" style="align-items:flex-end"><span class="b14 bold c-darker">${fmtBRL(v)}</span>${tag ? `<span class="cap c-base">${tag}</span>` : ''}</span></div>`;
    return ssStep({ step: 5, title: 'Revise seu estudo', sub: 'Confira tudo o que vamos considerar antes de ativar a sua projeção',
      body: `${periodoChip()}
        ${sec('saldo', 'Saldo atual', ssInicial(), 'Saldo inicial do estudo', S.contas.filter(id => s.contasSel[id]).map(id => item(BANKS[id].nome, 'Conta corrente', contaSaldo(id), 'Disponível')).join('') + (s.manual != null ? item('Valor informado manualmente', 'Usado no lugar da soma das contas', s.manual) : ''), 'ssContas')}
        ${sec('ent', 'Entradas', totEntr(), 'Total de entradas', allEntradas().map(e => item(e.nome, entradaQuando(e), e.valor, e.rec ? 'Recorrente' : 'Única')).join(''), 'ssEntr')}
        ${sec('rec', 'Gastos recorrentes', totRec(), 'Total de gastos recorrentes', s.gastos.map(g => item(g.nome, `Todo dia ${g.dia} · ${g.cat}`, g.valor, 'Mensal')).join('') + (Object.keys(s.faturas).length ? item('Faturas de cartão', Object.keys(s.faturas).map(id => BANKS[id].curto).join(' · '), Object.values(s.faturas).reduce((a, f) => a + (f.valor || 0), 0), 'Próximos 30 dias') : ''), 'ssRec')}
        ${sec('evt', 'Gastos eventuais', totEvt(), 'Total de gastos eventuais', s.eventos.filter(e => !e.nao && e.valor).map(e => item(e.nome, e.pag, e.valor)).join('') || '<p class="b14 c-base">Nenhum gasto eventual adicionado para este período.</p>', 'ssEvt')}
        ${sec('poup', 'Poupança', totPoup(), 'Reservado para poupança', poupState().vf && !poupState().vf.pausada ? item('Valor fixo', `${freqTxt(poupState().vf.freq)} · ${fmtBRL(poupState().vf.valor)}`, totPoup(), `${vfDatas().length} aportes`) : '<p class="b14 c-base">Nenhuma poupança automática ativa.</p>', 'ssPoup')}
        <p class="cap c-dark" style="background:var(--warning-bg);border-radius:8px;padding:10px">Ao ativar a projeção, vamos usar essas informações como base e elas não poderão mais ser editadas. Confira tudo antes de continuar.</p>`,
      foot: btn('Ativar projeção', { act: 'ativar' }) + btn('Cancelar', { v: 'o', act: 'ssCancel' }) }); },
  acts: {
    tog: (b) => { const p = stack[stack.length - 1].p; p.open = p.open || {}; p.open[b.dataset.k] = !p.open[b.dataset.k]; rerender(); },
    editStep: (b) => backTo(b.dataset.to),
    ativar: () => { ssState().ativo = true; ssState().miaP = false; updHomeSS(); go('proc', { msg: 'Estamos armazenando suas premissas...', next: 'ssOk' }); },
  },
});
screen('ssOk', { cls: 'grad', render: () => successScreen({ img: 'mia-futuro.webp', chip: 'Seus próximos 30 dias sob controle', chipIcon: 'rocket', title: 'Saldo Seguro disponível', text: '<b>Processei seus dados, tudo pronto ;)</b><br><br>A projeção de saldo seguro representa <b>quanto você pode assumir em pagamentos relacionados ao seu estilo de vida</b> (lazer, cuidados pessoais, dentre outros).', label: 'Ver projeção', act: 'go' }), acts: { go: () => reset('clareza', { tab: 'ss' }, 'fade') } });

/* ---------- configurações do estudo ---------- */
screen('ssCfg', {
  cls: 'grad',
  render: () => `${CURVE}${statusBar(true)}
    <div class="row g3" style="flex:none;position:relative;z-index:2;padding:16px 20px 20px;align-items:center"><button type="button" data-back aria-label="Voltar" style="color:#fff;display:flex">${ic('chevron-left', 24)}</button><p class="h2" style="color:#fff">Configurações</p></div>
    <div class="scroll" style="position:relative;z-index:2;display:flex;flex-direction:column">
      <div class="col" style="flex:1 0 auto;background:#fff;border-radius:32px 32px 0 0;padding:8px 20px 20px">
        <button type="button" class="row g3" data-act="exp" style="padding:20px 0;text-align:left"><span class="col g1 f1"><span class="b16 semi c-darker">Exportar resumo do estudo atual</span><span class="b14 c-base">Guarde o registro do estudo atual</span></span>${ic('chevron-right', 20, 'c-base')}</button>
        <span style="display:block;height:1px;background:var(--border-lighter)"></span>
        <button type="button" class="row g3" data-act="ant" style="padding:20px 0;text-align:left"><span class="col g1 f1"><span class="b16 semi c-darker">Estudos anteriores</span><span class="b14 c-base">Acesse o seu histórico</span></span>${ic('chevron-right', 20, 'c-base')}</button>
        <span style="display:block;height:1px;background:var(--border-lighter)"></span>
        <div class="f1" style="min-height:40px"></div>
        <button type="button" class="b14 bold c-darker center" data-act="del" style="padding:24px 0">Excluir estudo definitivamente</button>
      </div></div>${homeInd()}`,
  acts: {
    exp: () => { const sr = ssSerie(); openSheet(`<p class="h4 c-darker">Exportar resumo do Saldo Seguro</p><div class="card col g2"><p class="b16 bold c-darker">Meu Saldo Seguro</p><p class="cap c-base">Estudo de ${periodo()} · 30 dias</p>${ssChart(sr, 29)}
      ${[['Saldo inicial em ' + ddmm(ssState().inicio), ssInicial()], ['Entradas no período', totEntr()], ['Despesas recorrentes e faturas', -totRec()], ['Despesas eventuais', -totEvt()], ['Poupança automática', -totPoup()]].map(([a, v]) => `<div class="row jb"><span class="b14 c-dark">${a}</span><span class="b14 semi c-darker">${sinal(v).replace('+ ', '')}</span></div>`).join('')}
      <div class="divider"></div><div class="row jb"><span class="b14 bold c-darker">Saldo final projetado para ${ddmm(ssFim())}</span><span class="b16 bold c-primary">${fmtK(sr.final)}</span></div></div><p class="cap c-base">A imagem traz o gráfico e os números do estudo. Os lançamentos do dia a dia ficam no app.</p>`, { foot: btn('Salvar imagem', { act: 'savImg' }) + btn('Voltar', { v: 'o', act: 'dlgClose' }) }); },
    savImg: () => { closeOverlays(true); toast('Nesta versão de teste a imagem não é salva', 'success', 'info'); },
    ant: () => toast('Nenhum estudo anterior ainda', 'success', 'history'),
    del: () => confirmDlg({ icon: 'trash-2', tone: 'danger', title: 'Excluir este estudo?', text: 'A projeção atual e todas as premissas usadas nela serão apagadas. Você pode criar um novo estudo quando quiser.', ok: 'Excluir estudo', okV: 'd', okAct: 'delOk', cancel: 'Manter estudo' }),
    delOk: () => { S.ss = null; S.saldoSeguro = null; closeOverlays(true); reset('clareza', { tab: 'ss' }, 'back'); toast('Estudo excluído.', 'error', 'trash-2'); },
  },
});
/* Item 20: o primeiro acesso a qualquer um dos estudos passa obrigatoriamente pela apresentação. */
const primeiraVezClareza = () => !S.flags.clarezaIntro && !S.ss && !S.saldoSeguro;
screen('faturas', { render: () => '', mount: () => { if (primeiraVezClareza()) { reset('clarezaIntro', {}, 'none'); return; } reset('clareza', { tab: 'fat' }, 'none'); } });

/* exemplo de estudo pronto (conta em uso) */
const seedDemo1 = seedDemo;
seedDemo = function () {
  seedDemo1();
  if (!S.user.renda) S.user.renda = 'R$ 10.000,00';
  if (!S.user.pessoas.length) S.user.pessoas = [{ nome: 'Marcela Pimentel', nasc: ddmm(addDays(hoje(), 9)) + '/1995', par: 'Cônjuge' }, { nome: 'Caio Pimentel', nasc: ddmm(addDays(hoje(), 21)) + '/2016', par: 'Filho(a)' }];
  S.ss = null; const s = ssState();
  s.renda = [{ nome: 'Salário', rec: true, tipo: 'util', dia: 5, valor: 7000 }];
  s.entradas = [{ nome: 'Freela de design', rec: false, data: ddmmyyyy(addDays(hoje(), 14)), valor: 600 }];
  s.gastos = [{ nome: 'Aluguel', cat: 'Moradia', dia: Math.min(28, addDays(hoje(), 3).getDate()), valor: 2800 }, { nome: 'Unimed Recife', cat: 'Saúde', dia: 20, valor: 500 }, { nome: 'Escola do Caio', cat: 'Educação', dia: 10, valor: 1300 }];
  Object.keys(s.faturas).forEach((id, k) => { s.faturas[id].valor = k ? 900 : 2950; });
  s.eventos = [{ key: 'm1', tipo: 'manual', nome: 'Presente Marcela', pag: ddmmyyyy(addDays(hoje(), 8)), valor: 350 }];
  s.contasSel = Object.fromEntries(S.contas.map(id => [id, id !== S.destino.bank]));
  s.miaE = s.miaG = true; s.ativo = true; updHomeSS();
};

flowEntry('Clareza (Saldo Seguro)', 'Entrada do menu Clareza (apresentação)', () => { if (!S.contas.length) seedDemo(); S.ss = null; S.saldoSeguro = null; S.flags.clarezaIntro = false; reset('clarezaIntro'); });
flowEntry('Clareza (Saldo Seguro)', 'Criar estudo do zero', () => { if (!S.contas.length) { seedDemo(); } S.ss = null; S.saldoSeguro = null; reset('clareza', { tab: 'ss' }); });
flowEntry('Clareza (Saldo Seguro)', 'Projeção pronta', () => { seedDemo(); reset('clareza', { tab: 'ss' }); });
flowEntry('Clareza (Saldo Seguro)', 'Projeção de Faturas', () => { if (!S.contas.length) seedDemo(); reset('clareza', { tab: 'fat' }); });
