/* ============ 04 · Open Finance: conectar instituições, contas Origem e Destino ============ */

/* cabeçalho em gradiente com título centralizado e indicador de passos */
function ofScreen({ title, sub = '', dots = 0, body = '', foot = '', back = true }) {
  return `${CURVE}${statusBar(true)}
  <div class="bk" style="margin-top:16px;height:32px"><button type="button" data-back aria-label="Voltar" ${back ? '' : 'style="visibility:hidden"'}>${ic('chevron-left', 24)}</button>
    <p class="h2" style="position:absolute;left:56px;right:56px;text-align:center;color:#fff">${title}</p>
    <span class="row g1">${dots ? [1, 2, 3].map(k => `<i style="display:block;height:4px;border-radius:2px;width:${k === dots ? 12 : 4}px;background:${k === dots ? '#fff' : 'rgba(255,255,255,.5)'}"></i>`).join('') : ''}</span></div>
  ${sub ? `<p class="b16" style="position:relative;z-index:2;padding:20px 20px 0;color:#f5f5f5">${sub}</p>` : ''}
  <div class="sheet" style="background:#fff;margin-top:24px"><div class="sheet-in">${body}</div>${foot ? `<div class="sheet-foot" style="background:#fff">${foot}</div>` : ''}</div>${homeInd()}`;
}
const extDelay = 1600;

screen('of1', {
  render: () => `${statusBar()}<div class="ah"><button type="button" class="bkb" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button></div>
  <div class="scroll px5 col g5" style="display:flex">
    <div class="row g3"><img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40"><span class="c-base">${ic('plus', 14)}</span><img src="assets/celcoin.png" alt="Celcoin" width="83" height="24"></div>
    <p class="h1 c-darker">Conexões rápidas, proteção em cada movimento<span class="dot-blue">.</span></p>
    <p class="b16 c-dark">Usamos a tecnologia da Celcoin para conectar e movimentar suas contas com agilidade e máxima proteção.</p>
    <p class="b14 bold c-darker">Diretrizes de segurança e privacidade</p>
    ${[['lock', 'Regulamentação e Autorização', 'Parceiros autorizados pelo Banco Central, especialistas em proteção de dados financeiros.'], ['shield-check', 'Dados protegidos', 'Informações bancárias protegidas por criptografia de ponta a ponta durante todo o processo.'], ['key-round', 'Controle e Comando', 'Movimentações ocorrem apenas sob seu comando. Garantimos total transparência e simetria.'], ['eye-off', 'Acesso restrito', 'Nenhuma senha é armazenada. Iremos acessar apenas o histórico necessário para sua automação']].map(([i, t, d]) => `<div class="row g3 ais"><span class="ico-c sm">${ic(i, 16)}</span><div class="col g1"><p class="b14 semi c-darker">${t}</p><p class="b14 c-base">${d}</p></div></div>`).join('')}
    <div style="padding:8px 0 20px">${btn('Entendi e continuar', { go: 'of2' })}</div>
  </div>${homeInd()}`,
});

const bankOrder = ['nubank', 'itau', 'bb', 'bradesco', 'btg', 'caixa', 'bmg', 'nordeste', 'santander', 'picpay'];
screen('of2', {
  cls: 'grad',
  render: (p) => {
    const q = (p.q || '').trim().toLowerCase();
    const L = bankOrder.filter(id => !q || BANKS[id].nome.toLowerCase().includes(q) || BANKS[id].curto.toLowerCase().includes(q));
    const list = p.loading ? `<div class="col g3" style="align-items:center;padding:48px 0"><div class="spin" style="border-color:var(--primary-lighter);border-top-color:var(--primary)"></div></div>`
      : L.length ? `<p class="b14 bold c-dark">Todas as instituições</p><div class="col">${L.map(id => `<button type="button" class="li" data-act="pick" data-b="${id}" ${S.contas.includes(id) ? 'disabled style="opacity:.5"' : ''}>${bankIc(id)}<span class="lt b16 semi c-darker">${BANKS[id].nome}</span>${S.contas.includes(id) ? '<span class="badge success">Conectado</span>' : ic('chevron-right', 20, 'c-base')}</button>`).join('')}</div>`
      : `<div class="card row g3 ais" style="background:var(--bg-lighter);border:0"><span class="c-base">${ic('info', 20)}</span><div class="col g1"><p class="b14 semi c-darker">Instituição não encontrada</p><p class="b14 c-dark">Não encontramos "${esc(p.q)}" na nossa lista de instituições parceiras ou homologadas. Tente novamente com uma nova instituição.</p></div></div>`;
    return ofScreen({ title: 'Conectar instituições', sub: 'Conecte as instituições mais utilizadas com segurança para organizar seu planejamento.', dots: 1,
      body: `${field({ id: 'bq', ph: 'Buscar pelo nome do banco...', icon: 'search', value: p.q || '' })}${list}` });
  },
  mount: (el, p) => { if (p.first !== false) { p.first = false; p.loading = true; rerender(); later(() => { p.loading = false; rerender(); }, 700); } },
  onInput: (i) => { if (i.id === 'bq') { stack[stack.length - 1].p.q = i.value; refresh(); } },
  acts: { pick: (b) => { S.flags.ofOk = false; go('of3', { b: b.dataset.b }); } },
});
screen('of3', {
  cls: 'grad',
  render: (p) => ofScreen({ title: 'Conectar Instituição', sub: 'Autorize o Me Paguei a visualizar seus dados financeiros via Open Finance', dots: 2,
    body: `<div class="col g2"><p class="b16 semi c-darker">Banco selecionado:</p><div class="row g3">${bankIc(p.b)}<p class="b16 semi c-darker">${BANKS[p.b].nome}</p></div></div>
    <div class="col g1"><p class="b16 semi c-darker">CPF do titular:</p><p class="b16 c-dark">${esc(S.user.cpf || '055.865.584-94')}</p></div>
    <div class="col g2"><p class="b16 semi c-darker">Central de consentimento</p><p class="b16 c-dark">Quais informações serão visualizadas pelo Me Paguei através do Open Finance</p></div>
    <div class="col">${[['id-card', 'Dados cadastrais', 'Confirmação segura de titularidade para proteger seu perfil contra fraudes e garantir seu acesso.'], ['circle-dollar-sign', 'Saldos', 'Análise precisa da sua margem de segurança para identificar o momento certo de poupar e evitar desequilíbrios.'], ['receipt-text', 'Extratos e histórico de transações', 'Mapeamento detalhado do seu histórico para projetar seu fluxo financeiro e entender seus hábitos.']].map(([i, t, d]) => `<div class="li ais"><span class="ico-c sm">${ic(i, 16)}</span><div class="lt col g1"><p class="b14 semi c-darker">${t}</p><p class="b14 c-base">${d}</p></div></div>`).join('')}</div>
    ${checkbox('flags.ofOk', '<span class="b16">Autorizar integração de dados para inteligência financeira ao Me Paguei</span>', S.flags.ofOk)}
    <div class="row g3 ais" style="background:var(--primary-lighter);border-radius:var(--r-xl);padding:14px"><span class="ico-c sm" style="background:#fff">${ic('calendar-cog', 16)}</span><div class="col g1"><p class="b14 semi c-darker">Período de consentimento:</p><p class="cap c-dark">Você pode revogar esta conexão a qualquer momento, de forma imediata, na sua aba de Consentimento de Contas. Nenhum dado será retido após o eventual cancelamento.</p></div></div>`,
    foot: btn('Autorizar e avançar', { next: true, act: 'ok' }) }),
  valid: () => S.flags.ofOk,
  acts: { ok: () => go('ofExt', { b: P().b, next: 'ofOk' }) },
});
/* simula o app/site do banco (fluxo externo ao Me Paguei) */
screen('ofExt', {
  render: (p) => `${statusBar()}<div class="col g5 center" style="flex:1;align-items:center;justify-content:center;padding:0 32px;background:var(--bg-lighter)">
    <span class="bank-ic" style="width:72px;height:72px;font-size:22px">${BANKS[p.b].logo ? `<img src="assets/${BANKS[p.b].logo}" alt="">` : esc(BANKS[p.b].curto.slice(0, 2))}</span>
    <p class="h2 c-darker">Você está no ambiente do ${esc(BANKS[p.b].curto)}</p>
    <p class="b14 c-dark">Aqui você confirmaria a autorização no aplicativo do seu banco. Nesta versão de teste essa etapa é simulada.</p>
    <div class="spin" style="width:36px;height:36px;border-width:3px;border-color:var(--border-light);border-top-color:var(--primary)"></div>
    <p class="cap c-base">Voltando para o Me Paguei…</p></div>${homeInd()}`,
  mount: (el, p) => later(() => { stack.pop(); go(p.next, { b: p.b }, 'fade'); }, extDelay + 600),
});
screen('ofOk', {
  cls: 'grad',
  render: () => `${CURVE}${statusBar(true)}
  <div style="position:relative;z-index:2;flex:1;min-height:0">
    <img src="assets/logo-white.png" alt="Me Paguei" width="68" height="48" style="position:absolute;left:20px;top:8px">
    <img src="assets/mia-vibra.webp" alt="" style="position:absolute;left:50%;transform:translateX(-50%);bottom:0;height:min(400px,100%);width:auto">
    <span class="chip glass" style="position:absolute;right:20px;bottom:56px;height:30px;font-weight:400;font-size:12px;background:rgba(18,18,18,.35)">${ic('circle-check', 16)} Conta conectada com sucesso!</span>
  </div>
  <div class="sheet" style="background:#fff;flex:none"><div class="sheet-in" style="gap:12px;flex:none">
    <p class="h1 c-darker">Conexão concluída<br>com segurança</p>
    <p class="b16 c-dark">Suas informações foram sincronizadas. A partir de agora, posso acompanhar seus hábitos e te ajudar a poupar.</p>
  </div><div class="sheet-foot" style="background:#fff">${btn('Acessar bancos conectados', { act: 'go' })}</div></div>${homeInd()}`,
  mount: (el, p) => { if (p.b && !S.contas.includes(p.b)) S.contas.push(p.b); },
  acts: { go: () => { stack = stack.filter(s => !/^of[1-3]$|^ofExt$|^ofOk$/.test(s.id)); go('ofBancos', {}, 'fade'); } },
});
function bankRowMenu(id) { return `<div class="li">${bankIc(id)}<span class="lt b16 semi c-darker">${BANKS[id].nome}</span><button type="button" data-act="bmenu" data-b="${id}" aria-label="Opções de ${BANKS[id].curto}" style="padding:4px;color:var(--ty-base)">${ic('ellipsis-vertical', 20)}</button></div>`; }
const bankMenuActs = {
  bmenu: (b) => { const id = b.dataset.b; openSheet(`<div class="row g3">${bankIc(id)}<p class="h4 c-darker">${BANKS[id].nome}</p></div>
    <button type="button" class="li" data-act="bdetail" data-b="${id}">${ic('file-text', 20)}<span class="lt b16 c-darker">Ver dados compartilhados</span></button>
    <button type="button" class="li" data-act="brevoke" data-b="${id}" style="color:var(--danger)">${ic('unlink', 20)}<span class="lt b16">Revogar consentimento</span></button>`); },
  bdetail: (b) => { const id = b.dataset.b; closeOverlays(true); openSheet(`<p class="h4 c-darker">Dados compartilhados</p><p class="b14 c-dark">${BANKS[id].nome} compartilha com o Me Paguei: dados cadastrais, saldos e extratos com histórico de transações.</p>${BANKS[id].contas.map(c => `<div class="card flat"><p class="b14 semi c-darker">${c.tipo}</p><p class="b14 c-dark"><b>Agência:</b> ${c.ag} | <b>Conta:</b> ${c.cc}</p><p class="b14 c-dark"><b>Saldo Disponível:</b> ${fmtBRL(c.saldo)}</p></div>`).join('')}`, { foot: btn('Fechar', { act: 'closeov' }) }); },
  brevoke: (b) => { const id = b.dataset.b; closeOverlays(true); openDialog(`<span class="ico-c" style="background:var(--danger-bg);color:var(--danger)">${ic('unlink', 22)}</span><p class="h3 c-darker">Revogar consentimento?</p><p class="b14 c-base">Vamos parar de acessar os dados do ${BANKS[id].curto}. ${S.origem && S.origem.bank === id || S.destino && S.destino.bank === id ? 'Como essa conta está em uso nas poupanças, as transferências automáticas ficam pausadas até você escolher outra.' : 'Nenhum dado será retido.'}</p>${btn('Revogar', { v: 'd', act: 'doRevoke', attrs: `data-b="${id}"` })}${btn('Cancelar', { v: 'o', act: 'closeov' })}`); },
  doRevoke: (b) => { const id = b.dataset.b; S.contas = S.contas.filter(x => x !== id); if (S.origem && S.origem.bank === id) S.origem = null; if (S.destino && S.destino.bank === id) S.destino = null; closeOverlays(true); rerender(); toast(`Conexão com ${BANKS[id].curto} revogada`, 'success', 'unlink'); },
  closeov: () => closeTopOverlay(),
};
screen('ofBancos', {
  cls: 'grad',
  render: () => ofScreen({ title: 'Bancos conectados', sub: 'Lista das suas instituições bancárias que estão conectadas ao Me Paguei', dots: 1,
    body: `<p class="b14 c-dark">Total de instituições: <b class="c-darker">${S.contas.length}</b></p><div class="col" style="border-bottom:1px solid var(--border-lighter)">${S.contas.map(bankRowMenu).join('')}</div>
      ${btn(ic('plus', 14) + ' Adicionar nova instituição', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-end;padding:0 14px"' })}
      ${S.contas.length < 2 ? `<div class="col g2" style="align-items:center;text-align:center;padding:32px 0 8px"><span class="ico-c" style="background:var(--primary-lighter);color:var(--primary)">${ic('info', 20)}</span><p class="b14 semi c-darker">Sobre contas para poupança</p><p class="b14 c-base">Para poder definir as contas Origem e Destino, <b class="c-dark">é necessário ter pelo menos duas instituições bancárias conectadas</b> ao Me Paguei. Por favor, adicione uma nova instituição</p></div>` : ''}`,
    foot: `${btn('Configurar a Conta Origem', { act: 'principal', attrs: S.contas.length < 2 ? 'disabled' : '' })}<button type="button" class="b14 semi lnk" data-act="home" style="align-self:center;padding:6px">Ir para Início</button>` }),
  acts: Object.assign({}, bankMenuActs, {
    add: () => go('of2'),
    principal: () => go('ofOrig'),
    home: () => reset('home', {}, 'back'),
  }),
});

/* ---------- conta Origem ---------- */
function origemPicker(sel) {
  return `<div class="col g3"><p class="b16 semi c-darker">Selecione um dos bancos disponíveis</p>
  ${S.contas.map(id => { const open = S.flags.origOpen === id; const on = sel && sel.bank === id;
    return `<div class="card" style="padding:0;overflow:hidden;border-color:${on ? 'var(--primary)' : 'var(--border-lighter)'}">
      <button type="button" class="row g3 w100" data-act="oopen" data-b="${id}" style="padding:16px;background:var(--bg-lighter)"><span class="rad ${on ? 'on' : ''}" style="width:auto;padding:0"><span class="o"></span></span>${bankIc(id)}<span class="f1 b16 semi c-darker" style="text-align:left">${BANKS[id].nome}</span>${ic(open ? 'chevron-up' : 'chevron-down', 18, 'c-base')}</button>
      ${open ? `<div class="col" style="background:#fff">${BANKS[id].contas.map((c, k) => `<div class="col g1" style="padding:16px;${k ? 'border-top:1px solid var(--border-lighter)' : ''}">
        <p class="b14 semi c-darker">${c.tipo}</p>
        <p class="b14 c-base"><b class="c-darker">Agência:</b> ${c.ag} <span class="c-light">|</span> <b class="c-darker">Conta:</b> ${c.cc}</p>
        <p class="b14 c-base"><b class="c-darker">Saldo Disponível:</b> ${fmtBRL(c.saldo)}</p></div>`).join('')}</div>` : ''}
    </div>`; }).join('')}</div>`;
}
const featList = `<div class="col g2"><p class="b16 semi c-darker">Funcionalidades para poupar</p><p class="b16 c-dark">O Me Paguei utilizará a sua conta para realizar movimentações para as seguintes funcionalidades abaixo:</p>
  <div class="col">${[['piggy-bank', 'Valor fixo', 'Valor fixo guardado continuamente.', 'var(--primary-lighter)', 'var(--primary)'], ['trophy', 'Placar do Bem', 'Seu time ganha, seu dinheiro cresce.', 'var(--warning-bg)', 'var(--warning)'], ['coins', 'Troco inteligente', 'O troco das suas compras vira poupança.', 'var(--success-bg)', 'var(--success)']].map(([i, t, d, bg, fg]) => `<div class="li ais"><span class="ico-c sm" style="background:${bg};color:${fg}">${ic(i, 16)}</span><div class="lt col g1"><p class="b14 semi c-darker">${t}</p><p class="b14 c-dark">${d}</p></div></div>`).join('')}</div></div>`;
function saldoSegBlock() {
  return `<div class="card col g3"><div class="row g3 ais"><span class="ico-c sm">${ic('file-lock', 16)}</span><div class="col g1"><p class="b16 semi c-darker">Saldo de Segurança <span class="reg c-base">(opcional)</span></p><p class="cap c-dark">Defina o valor mínimo que deseja manter na sua conta. Se o seu saldo estiver abaixo, a transferência não será realizada.</p></div></div>
    ${field({ id: 'sseg', ph: 'R$ 100,00', bind: 'flags.sseg', mask: 'brl' })}
    <p class="cap c-dark" style="background:var(--primary-lighter);border-radius:var(--r-lg);padding:10px 12px">Mesmo sem um valor definido, nosso sistema nunca será responsável por seu saldo bancário ficar negativo.</p></div>`;
}
function miaInsight(title, text) {
  return `<div class="ins" style="box-shadow:none"><div class="row g2"><span class="ava-mia sm"><img src="assets/mia-avatar.webp" alt=""></span><span class="b14 semi c-ia">Insight da MIA</span><img src="assets/tip.png" width="14" height="14" alt=""></div><p class="b14 bold c-dark">${title}</p><p class="cap c-dark">${text}</p></div>`;
}
const origemActs = {
  oopen: (b) => { const id = b.dataset.b; S.tmpOrig = { bank: id, conta: 0 }; S.flags.origOpen = S.flags.origOpen === id ? null : id; rerender(); },
};
screen('ofOrig', {
  cls: 'grad',
  render: () => ofScreen({ title: 'Configurar Origem', sub: 'Selecione a conta que servirá como base para suas operações de poupanças', dots: 2,
    body: `${miaInsight('Qual o objetivo desta conta?', 'Está e a conta que você usa no dia a dia. O Me Paguei vai usar essa conta para pegar o valor que você definir nas poupanças (Valor Fixo, Placar do Bem e Troco Inteligente) e mover para a sua conta Destino.')}
      ${origemPicker(S.tmpOrig)}<div class="divider"></div>${saldoSegBlock()}<div class="divider"></div>${featList}
      ${checkbox('flags.decl', '<span class="b16">Declaro estar ciente de que as transferências automáticas dependem de saldo disponível na conta de origem e ocorrem sob as diretrizes do regulamento de segurança.</span>', S.flags.decl)}`,
    foot: btn('Autorizar e avançar', { next: true, act: 'ok' }) }),
  mount: (el, p) => { if (!p.init) { p.init = 1; S.tmpOrig = S.origem ? { ...S.origem } : null; S.flags.decl = false; S.flags.origOpen = S.contas[0]; if (!S.flags.sseg) S.flags.sseg = 'R$ 100,00'; rerender(); } },
  valid: () => S.tmpOrig && S.flags.decl,
  acts: Object.assign({}, origemActs, { ok: () => { S.origem = { ...S.tmpOrig }; S.saldoSeg = parseBRL(S.flags.sseg); go('ofExt', { b: S.origem.bank, next: 'ofOrigOk' }); } }),
});
screen('ofOrigOk', {
  cls: 'grad',
  render: () => `${CURVE}${statusBar(true)}
  <div style="position:relative;z-index:2;flex:1;min-height:0">
    <img src="assets/logo-white.png" alt="Me Paguei" width="68" height="48" style="position:absolute;left:20px;top:8px">
    <img src="assets/mia-autoriza.webp" alt="" style="position:absolute;left:50%;transform:translateX(-50%);bottom:0;height:min(400px,100%);width:auto">
    <span class="chip glass" style="position:absolute;left:20px;bottom:56px;height:30px;font-weight:400;font-size:12px;background:rgba(18,18,18,.35)">${ic('circle-check', 16)} Conta autorizada com sucesso!</span>
  </div>
  <div class="sheet" style="background:#fff;flex:none"><div class="sheet-in" style="gap:12px;flex:none">
    <p class="h1 c-darker">Autorização concluída<br>com segurança</p>
    <p class="b16 c-dark">Suas informações foram sincronizadas. A partir de agora, posso realizar as movimentações que você definir ao poupar.</p>
  </div><div class="sheet-foot" style="background:#fff">${btn('Configurar conta destino', { act: 'go' })}</div></div>${homeInd()}`,
  acts: { go: () => { stack = stack.filter(s => !/^ofExt$|^ofOrigOk$/.test(s.id)); go('ofDest', {}, 'fade'); } },
});

/* ---------- conta Destino ---------- */
function destinoPicker() {
  const opts = S.contas.filter(id => !S.origem || id !== S.origem.bank);
  return `<div class="col g3"><p class="b16 semi c-darker">Selecione uma das contas disponíveis</p>
  ${opts.map(id => { const on = S.tmpDest && S.tmpDest.bank === id;
    return `<div class="card" style="padding:0;overflow:hidden;border-color:${on ? 'var(--primary)' : 'var(--border-lighter)'};background:${on ? '#fff' : 'var(--bg-lighter)'}">
      <button type="button" class="row g3 w100" data-act="dsel" data-b="${id}" style="padding:12px 16px"><span class="rad ${on ? 'on' : ''}" style="width:auto;padding:0"><span class="o"></span></span>${bankIc(id)}<span class="f1 b16 semi c-darker" style="text-align:left">${BANKS[id].nome}</span>${ic(on ? 'chevron-up' : 'chevron-down', 18, 'c-base')}</button>
      ${on ? `<div style="padding:0 16px 16px">${field({ id: 'pix', label: 'Chave Pix', ph: 'CPF, e-mail, celular ou chave aleatória', bind: 'tmpDest.pix', helper: 'Usaremos a chave para receber o valor poupado.' })}</div>` : ''}</div>`; }).join('')}
  ${S.origem ? `<div class="card row g3" style="background:var(--bg-lighter);border:0;opacity:.7">${bankIc(S.origem.bank)}<div class="f1"><p class="b14 semi c-dark">${BANKS[S.origem.bank].nome}</p><p class="cap c-base">Já definida como conta Origem</p></div></div>` : ''}</div>`;
}
screen('ofDest', {
  cls: 'grad',
  render: (p) => ofScreen({ title: 'Configurar Destino', sub: 'Selecione para onde enviaremos o valor que você decidir poupar.', dots: 3,
    body: `${miaInsight('Qual o objetivo desta conta?', 'Escolha uma conta com pouca movimentação no dia a dia. Isso protege seu dinheiro de impulsos e ajuda você a guardar com consistência.')}${destinoPicker()}`,
    foot: btn(p.fromCentral ? 'Salvar Conta Destino' : 'Confirmar Conta Destino', { next: true, act: 'ok' }) }),
  mount: (el, p) => { if (!p.init) { p.init = 1; S.tmpDest = S.destino ? { ...S.destino } : null; rerender(); } },
  valid: () => S.tmpDest && (S.tmpDest.pix || '').trim().length > 3,
  acts: {
    dsel: (b) => { const id = b.dataset.b; S.tmpDest = S.tmpDest && S.tmpDest.bank === id ? null : { bank: id, pix: '' }; rerender(); later(() => $('#pix', cur)?.focus(), 60); },
    ok: () => { S.destino = { ...S.tmpDest }; if (P().fromCentral) { back(); toast('Conta Destino atualizada'); return; } go('proc', { msg: 'Estamos armazenando suas definições...', next: 'central', nextP: { tab: 'def', final: true } }); },
  },
});

/* ---------- central de consentimento ---------- */
function contaCard(kind) {
  const c = kind === 'p' ? S.origem : S.destino;
  if (!c) return `<button type="button" class="card row g3" data-act="ctab" data-k="${kind === 'p' ? 'pri' : 'cof'}" style="text-align:left"><span class="ico-c sm">${ic(kind === 'p' ? 'wallet' : 'piggy-bank', 16)}</span><span class="f1 col"><span class="b14 bold c-darker">${kind === 'p' ? 'Origem' : 'Destino'}</span><span class="cap c-base">${kind === 'p' ? 'Conta de origem para poupar' : 'Conta de destino do valor poupado'}</span></span>${ic('chevron-right', 20, 'c-light')}</button>`;
  const b = BANKS[c.bank]; const conta = kind === 'p' ? b.contas[c.conta || 0] : null;
  return `<div class="card col g3" style="border-color:var(--border-lighter)">
    <div class="row g3 ais">${bankIc(c.bank)}<div class="f1 col" style="gap:2px"><span class="cap semi c-primary">${kind === 'p' ? 'Origem' : 'Destino'}</span><span class="b16 bold c-darker">${b.curto}</span></div><button type="button" data-act="ctab" data-k="${kind === 'p' ? 'pri' : 'cof'}" aria-label="Editar" style="color:var(--ty-base);padding:2px;align-self:flex-start">${ic('ellipsis-vertical', 18)}</button></div>
    <div class="col g1" style="padding-left:52px">${kind === 'p' ? `<p class="b14 c-dark">Agência | Conta: <b class="c-darker">${conta.ag} | ${conta.cc}</b></p><p class="b14 c-dark">Saldo Disponível: <b class="c-darker">${fmtBRL(conta.saldo)}</b></p>` : `<p class="b14 c-dark">Chave Pix (E-mail):</p><p class="b14 bold c-darker" style="overflow-wrap:anywhere">${esc(c.pix)}</p>`}</div></div>`;
}
screen('central', {
  cls: 'grad',
  render: (p) => {
    const tab = p.tab || 'def';
    let body = '';
    const insts = `<div class="col g2"><p class="b16 bold c-darker">Instituições conectadas (Open Finance)</p>${S.contas.length ? `<p class="b14 c-dark">Total de instituições: ${S.contas.length}</p><div class="col">${S.contas.map(bankRowMenu).join('')}</div>` : '<p class="b14 c-dark">Adicione suas instituições financeiras ao Me Paguei para ter a melhor experiência sobre sua vida financeira.</p>'}
      ${btn(ic('plus', 14) + ' Adicionar nova instituição', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-start;padding:0 14px"' })}</div>`;
    if (tab === 'def') body = `<div class="col g3"><p class="b16 bold c-darker">Contas para Poupança</p><p class="b14 c-dark">${S.origem && S.destino ? 'Confira as contas Origem e Destino vinculadas as funcionalidades de poupança do Me Paguei' : 'Escolha as contas origem e destino para as transferências automáticas'}</p>
        ${contaCard('p')}${contaCard('d')}
</div>
      <div class="divider"></div>
      <div class="col g2"><div class="row jb"><p class="b16 bold c-darker">Saldo de segurança</p>${S.saldoSeg ? `<button type="button" data-act="editSeg" aria-label="Editar saldo de segurança" style="color:var(--ty-base)">${ic('ellipsis-vertical', 18)}</button>` : ''}</div><p class="b14 c-dark">Valor mínimo mantido na conta origem para proteger seu saldo</p>
        ${S.saldoSeg ? `<p class="b16 semi c-darker">${fmtBRL(S.saldoSeg)}</p>` : btn('Definir saldo', { v: 'o', cls: 'btn-xs auto', act: 'editSeg', attrs: 'style="align-self:flex-start;padding:0 14px"' })}</div>
      <div class="divider"></div>${insts}`;
    else if (tab === 'pri') body = `${miaInsight('Qual o objetivo desta conta?', 'Esta é a conta que você usa no dia a dia. O Me Paguei vai usar essa conta para pegar o valor que você definir nas poupanças (Valor Fixo, Placar do Bem e Troco Inteligente) e mover para a sua conta Destino.')}
      ${S.contas.length ? origemPicker(S.tmpOrig) : `<div class="col g2"><p class="b16 semi c-darker">Contas disponíveis via Open Finance</p><p class="b14 c-dark">Adicione suas instituições financeiras ao Me Paguei para ter a melhor experiência sobre sua vida financeira.</p>${btn(ic('plus', 14) + ' Adicionar nova instituição', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-start;padding:0 14px"' })}</div>`}
      ${saldoSegBlock()}${featList}`;
    else if (tab === 'cof') body = `${miaInsight('Objetivo da conta destino', 'Escolha uma conta com pouca movimentação no dia a dia. Isso protege seu dinheiro de impulsos e ajuda você a guardar com consistência.')}
      ${S.destino ? `<div class="card col g2" style="border-color:var(--primary)"><div class="row g3">${bankIc(S.destino.bank)}<p class="f1 b16 semi c-darker">${BANKS[S.destino.bank].nome}</p><span class="badge success">Definida</span></div><p class="b14 c-dark" style="overflow-wrap:anywhere">Chave Pix: ${esc(S.destino.pix)}</p></div>` : `<p class="b14 c-dark">Nenhuma conta Destino definida ainda.</p>`}
      ${S.contas.length > 1 ? btn(S.destino ? 'Editar Conta Destino' : 'Definir Conta Destino', { act: 'editDest' }) : `<p class="b14 c-dark">Adicione suas instituições financeiras ao Me Paguei para ter a melhor experiência sobre sua vida financeira.</p>${btn(ic('plus', 14) + ' Adicionar nova instituição', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-start;padding:0 14px"' })}`}`;
    else body = `<p class="b16 semi c-darker">Bancos conectados</p>${S.contas.length ? `<p class="b14 c-dark">Total de instituições conectadas: ${S.contas.length}</p><div class="col">${S.contas.map(bankRowMenu).join('')}</div>` : '<p class="b14 c-dark">Adicione suas instituições financeiras ao Me Paguei para ter a melhor experiência sobre sua vida financeira.</p>'}
      ${btn(ic('plus', 14) + ' Adicionar nova instituição', { v: 'o', cls: 'btn-xs auto', act: 'add', attrs: 'style="align-self:flex-start;padding:0 14px"' })}`;
    const foot = tab === 'def' ? btn(p.final ? 'Concordar e ir para o Início' : 'Ir para o Início', { act: 'home' }) : tab === 'pri' && S.contas.length ? btn('Salvar conta Origem', { act: 'savePri', next: true }) : '';
    return `${CURVE}${statusBar(true)}
    <div class="bk" style="margin-top:16px;height:28px"><button type="button" data-back aria-label="Voltar" ${p.final ? 'style="visibility:hidden"' : ''}>${ic('chevron-left', 24)}</button>
      <p class="h2" style="position:absolute;left:56px;right:56px;text-align:center;color:#fff">Consentimento de contas</p><span style="width:24px"></span></div>
    <div class="chips" style="position:relative;z-index:2;padding:16px 20px 12px">${[['def', 'Definições'], ['pri', 'Origem'], ['cof', 'Destino'], ['inst', 'Instituições']].map(([k, l]) => `<button type="button" class="chip glass ${k === tab ? 'on' : ''}" data-act="ctab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="scroll" style="position:relative;z-index:2;display:flex;flex-direction:column">
      <div class="col g5" style="flex:1 0 auto;background:#fff;border-radius:32px 32px 0 0;padding:28px 24px 20px">${body}</div></div>${foot ? `<div class="sheet-foot" style="background:#fff;padding-top:8px">${foot}</div>` : ''}${homeInd()}`;
  },
  mount: (el, p) => { if (p.tab === 'pri' && !p.init) { p.init = 1; S.tmpOrig = S.origem ? { ...S.origem } : null; S.flags.origOpen = S.origem ? S.origem.bank : S.contas[0]; S.flags.sseg = S.saldoSeg ? fmtBRL(S.saldoSeg) : ''; rerender(); } },
  valid: (p) => p.tab !== 'pri' || !!S.tmpOrig,
  acts: Object.assign({}, bankMenuActs, origemActs, {
    ctab: (b) => { const p = stack[stack.length - 1].p; p.tab = b.dataset.k; p.init = 0; rerender(); },
    add: () => go('of2'),
    swap: () => { if (S.contas.length) { const o = S.origem, d = S.destino; S.origem = { bank: d.bank, conta: 0 }; S.destino = { bank: o.bank, pix: d.pix }; rerender(); toast('Contas invertidas'); } },
    editSeg: () => { S.flags.sseg2 = S.saldoSeg ? fmtBRL(S.saldoSeg) : ''; openSheet(`<p class="h4 c-darker">Saldo de segurança</p><p class="b14 c-dark">Valor mínimo mantido na conta origem. Se o saldo estiver abaixo disso, não fazemos a transferência do dia.</p>${field({ id: 'sseg2', label: 'Valor', ph: 'R$ 100,00', bind: 'flags.sseg2', mask: 'brl' })}`, { foot: btn('Salvar', { act: 'saveSeg' }) }); },
    saveSeg: () => { S.saldoSeg = parseBRL(S.flags.sseg2); closeOverlays(true); rerender(); toast('Saldo de segurança atualizado'); },
    editDest: () => go('ofDest', { fromCentral: true }),
    savePri: () => { S.origem = { ...S.tmpOrig }; S.saldoSeg = parseBRL(S.flags.sseg) || S.saldoSeg; const p = stack[stack.length - 1].p; p.tab = 'def'; rerender(); toast('Conta Origem atualizada'); },
    home: () => reset('home', {}, 'back'),
  }),
});

flowEntry('Início e conta', 'Conectar contas (Open Finance)', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; reset('home'); go('of1'); });
flowEntry('Início e conta', 'Central de consentimento', () => { if (!S.contas.length) seedDemo(); reset('home'); go('central', { tab: 'def' }); });
