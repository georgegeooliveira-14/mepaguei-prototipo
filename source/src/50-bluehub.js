/* ============ BlueHub: cadastro, login, app e entrada no Me Paguei (Figma · section "Telas - BlueHub" 15413:35877) ============ */

const BH_LOGO_W = `<img src="assets/bluehub-logo-white.png" alt="bluehub" width="88" height="24">`;
const BH_LOGO_D = `<img src="assets/bluehub-logo-dark.png" alt="bluehub" width="88" height="24">`;
/* decoração das telas escuras (Subtract + Group 10812 do Figma) */
const BH_DECO = `<img class="bhd-sub" src="assets/bh-deco-sub.svg" alt=""><img class="bhd-rings" src="assets/bh-deco-rings.svg" alt="">`;
/* BH button: v = '' (primário #3279ff) | 'o' (contorno) | 'dk' (BH/Button #2350f5) | 'g' (cinza) */
function bhBtn(label, { v = '', lg = false, act = '', go = '', next = false, id = '', icon = '', attrs = '', cls = '' } = {}) {
  return `<button type="button" class="bhb ${v} ${lg ? 'lg' : ''} ${cls} ${next ? 'js-next' : ''}" ${id ? `id="${id}"` : ''} ${act ? `data-act="${act}"` : ''} ${go ? `data-go="${go}"` : ''} ${attrs}>${icon ? ic(icon, 18) : ''}${label}</button>`;
}
/* Indicador slider (5 passos) */
const bhDots = (k) => `<span class="bhd-dots" aria-label="Etapa ${k} de 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i === k ? 'on' : ''}"></i>`).join('')}</span>`;

/* tela escura com folha clara (cadastro / login BlueHub) */
function bhScreen({ title, sub = '', dots = 0, body = '', foot = '', back = true, top = 52, pt = 12, pb = 20, sheet = '#f6f6f6', pad = '32px 24px 40px' }) {
  return `${BH_DECO}${statusBar(true)}
  <div class="bhd-nav" style="margin-top:${top - 44}px">${back ? `<button type="button" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button>` : '<span></span>'}${BH_LOGO_W}${dots ? bhDots(dots) : ''}</div>
  <div class="bhd-ttl" style="padding:${pt}px 24px ${pb}px"><p class="h2">${title}</p>${sub ? `<p class="b14">${sub}</p>` : ''}</div>
  <div class="bhd-sheet" style="background:${sheet}"><div class="bhd-in" style="padding:${pad}">${body}${foot ? `<div class="bhd-foot">${foot}</div>` : ''}</div></div>
  <div class="hi" style="background:${sheet}"></div>`;
}

/* 00.00.01 Splash (15413:35917) */
screen('bhSplash', {
  cls: 'bh',
  render: () => `${statusBar(true)}
    <svg class="bhs-pat" width="263" height="160" viewBox="0 0 263 160" fill="none" aria-hidden="true"><g opacity=".2"><circle opacity=".45" cx="95.5" cy="80" r="74" stroke="#2350F5" stroke-width="2"/><circle opacity=".75" cx="95.5" cy="80" r="51" stroke="#2350F5" stroke-width="2"/><circle cx="95.5" cy="80" r="28" stroke="#2350F5" stroke-width="2"/><circle cx="95.5" cy="80" r="8" fill="#2350F5"/></g></svg>
    <img class="bhs-logo" src="assets/bluehub-logo-white.png" alt="bluehub" width="245" height="66">
    <p class="bhs-by">Uma solução da Empreender Dinheiro</p><div class="f1"></div>${homeInd(true)}`,
  mount: () => later(() => reset('bhWelcome', {}, 'fade'), 1700),
});

/* 01.01 Boas-vindas (15413:35892) */
screen('bhWelcome', {
  cls: 'bh',
  render: () => `<div class="bhw-photo"><img src="assets/bh-familia1.webp" alt="Família sorrindo abraçada"></div><div class="bhw-grad"></div>
    <img src="assets/bh-deco-sub2.svg" alt="" style="position:absolute;left:0;top:0;width:173px;height:158px;pointer-events:none">
    ${statusBar(true)}<img src="assets/bluehub-logo-white.png" alt="bluehub" width="148" height="40" style="position:absolute;left:21px;top:74px">
    <div class="col" style="position:absolute;left:20px;right:20px;bottom:51px;gap:24px">
      <div class="col g4">
        <p class="h1" style="color:#f5f5f5;text-wrap:wrap">Tudo para cuidar da sua vida e de quem você ama, agora ao seu alcance.</p>
        <p class="b16" style="color:#f5f5f5">Sua Jornada Blue começa aqui.</p></div>
      <div class="col g4">${bhBtn('Criar conta', { lg: true, go: 'bhCad' })}${bhBtn('Entrar', { v: 'oc', lg: true, go: 'bhLogin' })}</div></div>
    <div class="hi bhw-hi"></div>`,
});

/* checkbox do DS (20×20) */
const bhChk = (key, on, label) => `<div class="bh-chk ${on ? 'on' : ''}" data-act="check" data-key="${key}" role="checkbox" aria-checked="${!!on}" tabindex="0"><span class="box">${ic('check', 14)}</span>${label}</div>`;

/* 01.02 Cadastro (15413:36097 vazio · 15413:36060 preenchido) */
screen('bhCad', {
  cls: 'bh',
  render: () => bhScreen({ title: 'Vamos ao seu cadastro', sub: 'Informe os dados abaixo para começarmos.', dots: 1, pt: 12.5, pb: 20.5, pad: '32px 24px 16px',
    body: `<div class="col g6">
      ${field({ id: 'nome', label: 'Nome completo', ph: 'ex: Maria da Silva', bind: 'user.nome' })}
      ${field({ id: 'cpf', label: 'CPF', ph: '123.456.789-00', bind: 'user.cpf', mask: 'cpf', helper: 'Usamos para garantir a segurança da sua conta.' })}
      ${field({ id: 'email', label: 'E-mail', ph: 'seuemail@email.com', bind: 'user.email', type: 'email', mode: 'email' })}</div>
      <div class="col g4" style="margin-top:56px">
      ${bhChk('user.termos', S.user.termos, `<span class="b16 c-darker">Li e aceito as <span class="bh-lnk" role="button" tabindex="0" data-act="terms">Políticas de Privacidade e Termos de Uso</span></span>`)}
      <p class="cap c-base" style="padding-bottom:8px">Você pode ler os documentos clicando no link acima</p></div>`,
    foot: bhBtn('Próximo', { lg: true, next: true, act: 'next' }) }),
  valid: () => S.user.nome.trim().length > 2 && S.user.cpf.length === 14 && /.+@.+\..+/.test(S.user.email) && S.user.termos,
  validOv: () => !!S.flags.termsOk,
  acts: {
    terms: (b, e) => { e.stopPropagation(); bhTerms(); },
    next: () => go('bhToken', { next: 'bhSenha' }),
  },
});
/* BottomSheet · Política de Privacidade e Termos de Uso (15571:35731) */
function bhTerms() {
  S.flags.termsOk = S.user.termos;
  const body = TERMOS.split('\n\n').map(par => { const [h, ...r] = par.split('\n'); return r.length && h.length < 40 ? `<p><b>${esc(h)}</b><br>${esc(r.join('\n'))}</p>` : `<p>${esc(par)}</p>`; }).join('');
  openSheet(`<p class="bht-h">Política de Privacidade<br>e Termos de Uso do Me Paguei</p><div class="bht-b">${body}</div>`,
    { cls: 'bh-ov bh-terms', foot: `${bhChk('flags.termsOk', S.flags.termsOk, '<span class="b16" style="color:#737373">Li e aceito os termos</span>')}${bhBtn('Avançar', { act: 'termsOk', next: true, cls: 'auto' })}` });
}
GLOBAL_ACTS.termsOk = () => { S.user.termos = !!S.flags.termsOk; closeOverlays(true); rerender(); };

/* 01.03 Verificação (15413:36134 · preenchido 36169 · expirado 36204) e código do "Esqueci a senha" (15413:38127) */
function bhDigits(el) { const i = $('#dig', el); const v = i.value; $$('.dig .d', el).forEach((d, k) => { d.textContent = v[k] || ''; d.classList.toggle('cur', k === Math.min(v.length, 5) && document.activeElement === i); }); }
function bhTimer(el) {
  let s = 299; const t = $('#tmr', el); const rs = $('#resend', el);
  const tick = () => { t.textContent = Math.floor(s / 60) + ':' + pad2(s % 60); rs.disabled = s > 0; if (s > 0) s--; };
  tick(); every(tick, 1000);
}
const bhTokenBase = {
  cls: 'bh',
  mount: (el) => { bhTimer(el); const i = $('#dig', el); setTimeout(() => { i.focus(); bhDigits(el); }, 350); bhDigits(el); i.addEventListener('blur', () => bhDigits(el)); },
  onInput: (i, el) => { if (i.id === 'dig') bhDigits(el); },
  valid: (p, el) => ($('#dig', el)?.value || '').length === 6,
};
const bhTokenBody = (txt, boldTime) => `<div class="col" style="gap:40px;align-items:center">
  <p class="b16 c-darker center">${txt}</p>
  <label class="dig w100" for="dig" aria-label="Código de 6 dígitos">${[0, 1, 2, 3, 4, 5].map(k => `<span class="d" data-d="${k}"></span>`).join('')}<input id="dig" data-mask="dig" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label>
  <p class="b16 c-darker center">Tempo para expirar: <span class="num ${boldTime ? 'bold' : ''}" id="tmr">4:59</span></p></div>`;
const bhTokenFoot = () => bhBtn('Validar código', { next: true, act: 'ok' }) + bhBtn('Reenviar código', { v: 'o', act: 'resend', id: 'resend', attrs: 'disabled' });
const bhResend = () => { clearTimers(); bhTimer(cur); toast('Enviamos um novo código', 'success', 'mail'); };
screen('bhToken', Object.assign({}, bhTokenBase, {
  render: () => bhScreen({ title: 'Código de Verificação', sub: 'Preencha o campo abaixo com o código.', dots: 2,
    body: bhTokenBody(`Você receberá um código no e-mail ${esc(S.user.email || 'marcelo.pimentel@gmail.com')}.`), foot: bhTokenFoot() }),
  acts: { ok: () => go('bhSenha'), resend: bhResend },
}));

/* 01.04 Senha (15413:36239 · preenchido 36271) */
screen('bhSenha', {
  cls: 'bh',
  render: () => bhScreen({ title: 'Criar senha', sub: 'Crie uma senha forte seguindo as instruções', dots: 3, pt: 12.5, pb: 20.5, body: `<div class="col g6 bh-pw">${pwBlock()}</div>`, foot: bhBtn('Finalizar cadastro', { next: true, act: 'next' }) }),
  mount: paintPw, onInput: (i, el) => paintPw(el), valid: pwValid,
  acts: { next: () => { novaConta(S.user.cpf); go('bhProc', { msg: 'Analisando suas informações...', next: 'bhPlano' }); } },
});

/* 01.05 Processamento (15413:36733) e 01.10 Pré-home (15413:36621): logo + texto sobre os arcos, sem spinner */
const bhProcScreen = (msg) => `${BH_DECO}${statusBar(true)}
  <img src="assets/bluehub-logo-white.png" alt="bluehub" width="178" height="48" style="position:absolute;left:98.5px;top:295px;animation:pop .5s cubic-bezier(.2,.8,.2,1) both">
  <p class="b16 semi center" role="status" style="position:absolute;left:24px;right:24px;top:371px;color:#f5f5f5">${msg}</p><div class="f1"></div>${homeInd(true)}`;
screen('bhProc', {
  cls: 'bh',
  render: (p) => bhProcScreen(p.msg),
  mount: (el, p) => later(() => { if (p.root) reset(p.next, {}, 'fade'); else { stack.pop(); go(p.next, {}, 'fade'); } }, 2000),
});

/* 01.06 Plano corporativo (15413:36303) */
/* sem data relativa: o Figma não traz "Há 2 dias" nestes cards */
const bhFeat = ([i, t, d, when = '']) => `<div class="bh-feat"><span class="bh-fi">${ic(i, 16)}</span><div class="col f1" style="gap:8px"><div class="col" style="gap:2px"><p class="t">${t}</p><p class="d">${d}</p></div>${when ? `<p class="w">${when}</p>` : ''}</div></div>`;
screen('bhPlano', {
  cls: 'bh',
  render: () => `${BH_DECO}${statusBar(true)}
  <div style="position:relative;height:40px;display:flex;justify-content:center;align-items:flex-end">${BH_LOGO_W}</div>
  <div class="col" style="position:relative;gap:8px;padding:32px 24px 31px"><p class="cap semi" style="color:var(--bh-teal)">VÍNCULO CONFIRMADO</p><p class="h1" style="color:#fff">Encontramos o seu plano!</p></div>
  <div class="bhd-sheet" style="background:var(--bh-subtle);border-radius:28px 28px 0 0"><div class="bhd-in" style="padding:32px 24px 16px;gap:24px">
    <div class="col g2" style="box-shadow:inset 0 0 0 1px var(--bh-blue);background:var(--bh-blue-bg);border-radius:16px;padding:16px"><p class="cap semi" style="color:var(--bh-blue)">O seu plano é o:</p><p class="h2" style="color:var(--bh-ink)">Blue Alicerce</p><p class="cap" style="color:var(--bh-base)">Seguro de vida de R$ 100 mil.<br>21 benefícios e 19 trilhas liberados.</p></div>
    <div class="col g4">${[['lock', 'Contratado por', 'CESAR'], ['star', 'Você é o titular', 'A cobertura principal está no seu nome'], ['heart', 'Alguns benefícios são familiares', 'Farmácia, teleconsulta e exames valem para quem mora com você']].map(bhFeat).join('')}</div>
    <p class="cap" style="color:var(--bh-muted)">Dúvidas sobre a cobertura? Consulte o FAQ ou entre em contato pelo WhatsApp, em Suporte.</p>
    ${bhBtn('Acessar meus benefícios', { v: 'dk', lg: true, go: 'bhPre' })}
  </div></div><div class="hi" style="background:var(--bh-subtle)"></div>`,
});
screen('bhPre', {
  cls: 'bh',
  render: () => bhProcScreen('Preparando os seus benefícios...'),
  mount: () => later(() => reset('bhHome', {}, 'fade'), 1800),
});

/* ---------- 02 · Entrar / Esqueci minha senha (section Login 15413:37986) ---------- */
/* 01.05.01–02 Entrar (15413:38017 · 15413:38059) */
screen('bhLogin', {
  cls: 'bh',
  render: () => bhScreen({ title: 'Entrar', sub: 'Informe seu CPF e senha para acessar seus benefícios.', top: 60, pt: 12, pb: 19, sheet: '#fbfbfb',
    body: `<div class="col g6">
      ${field({ id: 'lcpf', label: 'CPF', ph: '123.456.789-00', bind: 'flags.lcpf', mask: 'cpf' })}
      ${pwField({ id: 'lpw', label: 'Senha', ph: '************', bind: 'flags.lpw' })}</div>`,
    foot: `${bhBtn('Entrar', { v: 'dk16', next: true, act: 'entrar' })}
      <div class="col g4" style="align-items:center"><p class="b16" style="color:#121212">Não possui uma conta? <button type="button" class="bh-lnk2" data-act="cad">Cadastre-se</button></p><button type="button" class="bh-lnk2 b16" data-act="esqueci">Esqueci a senha</button></div>` }),
  valid: () => (S.flags.lcpf || '').length === 14 && !!S.flags.lpw,
  acts: {
    entrar: () => { const cpf = S.flags.lcpf; const volta = abreConta(cpf);
      if (!volta) { S.user.cpf = cpf; }
      if (!S.user.nome) S.user.nome = 'Marcelo Pimentel';
      go('bhProc', { msg: volta ? 'Bem-vindo de volta! Carregando suas informações...' : 'Preparando os seus benefícios...', next: 'bhHome', root: true }); },
    cad: () => replace('bhCad', {}, 'fade'),
    esqueci: () => go('bhEsq'),
  },
});

/* 01.06.01 Esqueci minha senha · CPF (15413:38096) */
screen('bhEsq', {
  cls: 'bh',
  render: () => bhScreen({ title: 'Recuperar senha', sub: 'Para sua segurança, informe seu CPF e confirme sua identidade para continuar.', top: 60, pt: 12, pb: 19,
    body: field({ id: 'ecpf', label: 'CPF', ph: '123.456.789-00', bind: 'flags.lcpf', mask: 'cpf' }),
    foot: bhBtn('Enviar código', { next: true, act: 'next' }) }),
  valid: () => (S.flags.lcpf || '').length === 14,
  acts: { next: () => go('bhEsqCod') },
});
/* 01.06.02 Esqueci minha senha · código (15413:38127) + Dialogue Container (15565:34298) */
const bhOkDialog = (t, d, label, act) => openDialog(`<div class="col g6"><div class="col g4" style="align-items:center"><span class="bh-okic">${ic('check', 24)}</span><div class="col g3"><p class="b16 bold c-darker">${t}</p><p class="b14 c-base">${d}</p></div></div>${bhBtn(label, { v: 'mp', act })}</div>`);
screen('bhEsqCod', Object.assign({}, bhTokenBase, {
  render: () => bhScreen({ title: 'Código de Verificação', sub: 'Preencha o campo abaixo com o código.', top: 60, pt: 16, pb: 26,
    body: bhTokenBody('Você receberá um código no seu e-mail m...@gmail.com.', true), foot: bhTokenFoot() }),
  acts: {
    ok: () => bhOkDialog('Código verificado com sucesso', 'Sua identidade foi confirmada. Prossiga para alterar sua senha.', 'Continuar', 'cont'),
    cont: () => { closeOverlays(true); go('bhNovaSenha'); },
    resend: bhResend,
  },
}));
/* 01.06.03 Esqueci minha senha · nova senha (15413:37987) + Dialogue Container (15565:34299) */
screen('bhNovaSenha', {
  cls: 'bh',
  render: () => bhScreen({ title: 'Nova senha', sub: 'Crie uma senha forte seguindo as instruções.', top: 60, pt: 16, pb: 30, body: `<div class="col g6 bh-pw">${pwBlock()}</div>`, foot: bhBtn('Próximo', { next: true, act: 'next' }) }),
  mount: paintPw, onInput: (i, el) => paintPw(el), valid: pwValid,
  acts: {
    next: () => bhOkDialog('Senha alterada com sucesso!', 'Tudo pronto. Sua nova senha foi salva com segurança.', 'Voltar para login', 'login'),
    login: () => { closeOverlays(true); S.flags.lpw = ''; backTo('bhLogin'); },
  },
});
/* ---------- app BlueHub ---------- */
const BH_TABS = [['bhHome', 'house', 'Início'], ['bhBenef', 'wallet-cards', 'Benefícios'], ['bhCart', 'id-card', 'Carteirinha'], ['bhPerfil', 'user', 'Perfil']];
/* Navbar-Bluehub (flutuante, 351px, r40) + Home Indicator */
const bhNav = (a) => `<nav class="bhh-nav" aria-label="Menu BlueHub">${BH_TABS.map(([id, i, l]) => `<button type="button" class="${id === a ? 'on' : ''}" data-act="bhtab" data-tab="${id}" ${id === a ? 'aria-current="page"' : ''}><span class="pill">${ic(i, 24)}</span>${l}</button>`).join('')}</nav><div class="bhh-hi hi-bh"><i></i></div>`;
GLOBAL_ACTS.bhtab = (b) => reset(b.dataset.tab, {}, 'none');
/* nas abas a pilha tem 1 item so (bhtab usa reset), entao 'voltar' cai na Inicio */
GLOBAL_ACTS.bhBack = () => { if (stack.length > 1) back(); else reset('bhHome', {}, 'none'); };
GLOBAL_ACTS.bhSoon = (b) => toast(`${b.dataset.n || 'Este benefício'} abre fora do protótipo`, 'success', 'external-link');
const bhFoto = (px) => S.user.bhFoto
  ? `<img src="${S.user.bhFoto}" alt="" style="width:100%;height:100%;object-fit:cover">`
  : `<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--bh-blue);font-weight:700;font-size:${Math.round(px * 0.36)}px">${esc(iniciais(S.user.nome))}</span>`;
/* no Perfil o avatar é editável: lápis sobre a imagem abre o seletor de arquivo */
const bhUserEdit = () => `<label for="bhfoto" style="position:relative;width:52px;height:52px;border-radius:999px;overflow:hidden;flex:none;cursor:pointer">${bhFoto(52)}
  <span style="position:absolute;right:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;background:var(--bh-blue);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #fff">${ic('pencil', 12)}</span>
  <input id="bhfoto" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"></label>
  <div class="col f1" style="gap:2px;min-width:0"><p style="font-size:24px;line-height:32px;font-weight:700;color:#fff">Olá, ${esc(firstName())}</p><p style="font-size:12px;line-height:18px;color:#fff">Plano Ultrablue | CESAR</p></div>`;
const bhUser = () => `<button type="button" data-go="bhPerfil" aria-label="Ver meu perfil" style="width:52px;height:52px;border-radius:999px;overflow:hidden;flex:none">${bhFoto(52)}</button><div class="col f1" style="gap:2px;min-width:0"><p style="font-size:24px;line-height:32px;font-weight:700;color:#fff">Olá, ${esc(firstName())}</p><p style="font-size:12px;line-height:18px;color:#fff">Plano Ultrablue | CESAR</p></div>`;
const MP_ATIVO = () => !!S.flags.mpAtivo;
const bhTile = ([i, t, d, act, w = 200]) => `<button type="button" class="bhh-tile" style="width:${w}px" data-act="${act || 'bhSoon'}" data-n="${t}"><span class="bhh-ic">${ic(i, 18)}</span><span class="t">${t}</span><span class="d">${d}</span></button>`;
const bhPhoto = (img, o, h) => `<button type="button" class="bhh-photo" data-act="bhSoon" data-n="${h}"><img src="assets/${img}" alt=""><div><p class="o">${o}</p><p class="h">${h}</p></div></button>`;

screen('bhHome', {
  cls: 'bh-light',
  render: () => `<div class="scroll" style="background:var(--bh-subtle)">
    <div class="bhh-hdr"><div style="position:relative">${statusBar(true).replace('class="sb light"', 'class="sb light" style="position:absolute;left:0;right:0;top:0"')}
      <div class="row jb" style="height:32px"><img src="assets/bh-logo-home.png" alt="bluehub" width="110" height="30"><button type="button" aria-label="Notificações" data-go="bhNotif" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:9999px">${ic('bell', 18)}</button></div>
      <div class="row" style="gap:8px;align-items:flex-start">${bhUser()}</div></div></div>
    <div class="col" style="gap:32px;padding-bottom:120px">
      <section class="bhh-sec bhh-white">
        <div class="col bhh-px" style="gap:8px"><span style="display:block;width:72px;height:3px;border-radius:2px;background:var(--bh-teal)"></span><p style="font-size:16px;line-height:24px;font-weight:700;color:var(--bh-ink)">Minhas Finanças</p></div>
        <div class="bhh-px"><button type="button" class="bhh-tile" data-act="mp" style="flex-direction:row;width:100%;gap:8px"><span class="f1" style="font-size:12px;line-height:18px;color:var(--bh-base)"><b style="font-weight:700">MIA, sua assistente financeira</b><br>Acompanhe gastos, antecipe compromissos, poupe automaticamente e receba insights para organizar suas finanças${MP_ATIVO() ? '<br><span class="badge success" style="display:inline-flex;margin-top:6px">Ativo</span>' : ''}</span><img src="assets/bhh-mia-foto.webp" alt="" width="127" height="126" style="border-radius:16px;object-fit:cover;flex:none"></button></div>
        <div class="bhh-car" style="align-items:stretch">${[['calendar-days', 'Médico das finanças', 'Agenda uma sessão com um consultor financeiro certificado'], ['chart-line', 'Aposentadoria', 'Use o simulador para descobrir como conquistar uma aposentadoria tranquila', 'apos'], ['circle-play', 'Clube do livro', 'Ouça os melhores livros de finanças no trânsito ou no treino!']].map(([i, t, d, a]) => bhTile([i, t, d, a, 190])).join('')}</div>
        </section>
      <section class="bhh-sec"><div class="bhh-st"><p>Blue+ · Economia Familiar</p><button type="button" data-act="bhtab" data-tab="bhBenef">Ver todos (3)</button></div>
        <div class="bhh-car">${bhPhoto('bhc-blue0.webp', 'BLUE+', 'Programa de Economia Familiar')}${[['sun', 'Conta de energia', 'Descontos de até 20% com a Serena'], ['heart', 'Desconto Farmácia', 'Familiar. Pelo app TEM Saúde.'], ['star', 'Academias', 'TotalPass. Só para CPF contratante.']].map(bhTile).join('')}</div></section>
      <section class="bhh-sec"><div class="bhh-st"><p>Minha Saúde</p><button type="button" data-act="bhtab" data-tab="bhBenef">Ver todos (4)</button></div>
        <div class="bhh-car">${bhPhoto('bhc-saude0.webp', 'MINHA SAÚDE', 'Saúde sem filas')}${[['phone', 'Médico na Tela', 'Agende uma consulta online gratuitamente'], ['phone', 'Especialista na Tela', 'Titular. Agendamento Docway.'], ['calendar-days', 'Consultas e Exames', 'Familiar. Preço reduzido, app TEM Saúde.'], ['info', 'Cesta Natalidade', 'Titular. Como receber o benefício.']].map(bhTile).join('')}</div></section>
      <section class="bhh-sec"><div class="bhh-st"><p>Minhas Proteções</p><button type="button" data-act="bhtab" data-tab="bhBenef">Ver todos (5)</button></div>
        <div class="bhh-car">${bhPhoto('bhc-prot0.webp', 'MINHAS PROTEÇÕES', 'Sua família amparada')}${[['lock', 'Seguro de vida', 'R$ 100 mil. Guia, assistências e beneficiários.', '', 240], ['circle-alert', 'Invalidez por acidente', 'Até R$ 100 mil.'], ['info', 'Assistência funeral', 'Familiar.'], ['globe', 'Assistência residencial', 'Guia e contatos.'], ['info', 'Despesas médicas', 'Por acidente.']].map(bhTile).join('')}</div></section>
      <div class="bhh-px"><div style="background:var(--bh-ink);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:12px">
        <span style="align-self:flex-start;background:var(--bh-orange);border-radius:16px;padding:4px 8px;font-size:12px;line-height:16px;font-weight:700;color:#f5f5f5">Adicionar Dependentes</span>
        <div class="col" style="gap:16px"><img src="assets/bhh-vida-foto.webp" alt="Mulher sorrindo usando o notebook no sofá" style="width:100%;height:150px;object-fit:cover;border-radius:16px;display:block"><p style="font-size:18px;line-height:24px;font-weight:700;color:#fff">Estenda a proteção para quem você ama.</p></div>
        <div class="col" style="gap:16px;align-items:flex-end"><p style="font-size:12px;line-height:18px;color:#fff;width:100%">Leve as principais proteções da Bluehub para seus familiares e dependentes por apenas 49,90.</p><button type="button" data-act="vida" style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-teal)">Ver o plano Vida+</button></div></div></div>
      <section class="bhh-sec"><div class="bhh-st"><p>Pra tudo ficar Blue</p><button type="button" data-act="trilhas">Ver as trilhas</button></div>
        <div class="bhh-car">${[['Objetivos e Finanças', '9 aulas'], ['Foco & Performance', '3 aulas'], ['Hábitos poderosos', '3 aulas'], ['Energia e Bem-estar', '4 aulas']].map(([t, a], k) => `<button type="button" class="bhh-video" data-act="trilha" data-k="${k}"><img src="assets/bhc-tri${k}.webp" alt=""><span style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-ink)">${t}</span><span style="font-size:12px;line-height:18px;color:var(--bh-muted)">${a}</span></button>`).join('')}</div></section>
      <div class="bhh-px"><div style="overflow:hidden;background:var(--bh-blue);border-radius:20px;display:flex;flex-direction:column">
        <img src="assets/bhh-amplie-foto.webp" alt="Mulher no sofá usando o celular" style="width:100%;height:150px;object-fit:cover;display:block">
        <div class="col" style="gap:12px;padding:20px 20px 24px">
          <p style="font-size:18px;line-height:24px;font-weight:700;color:#fff">Amplie suas proteções</p>
          <p style="font-size:14px;line-height:22px;color:#fff">Acompanhamento com psicólogo, plano odontológico, coberturas maiores e outros benefícios, por uma fração do valor de mercado</p>
          <button type="button" data-go="bhCobertura" style="height:44px;border-radius:9999px;background:rgba(255,255,255,.88);color:var(--bh-ink);font-size:14px;line-height:22px;font-weight:600;margin-top:4px">Conhecer minhas vantagens</button>
        </div></div></div>
      <div class="bhh-px"><button type="button" data-act="bhSoon" data-n="WhatsApp" style="width:100%;height:100px;background:#fff;border:1px solid var(--bh-line);border-radius:16px;padding:16px;display:flex;align-items:center;gap:16px;text-align:left">
        <span style="width:40px;height:40px;border-radius:10px;background:var(--bh-blue-bg);color:var(--bh-blue);display:flex;align-items:center;justify-content:center;flex:none">${ic('circle-help', 24)}</span>
        <span class="col f1" style="gap:8px"><span style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-ink)">Ficou com dúvida?</span><span style="font-size:12px;line-height:18px;color:var(--bh-muted);white-space:nowrap">Fale com nossa equipe no whatsapp</span></span><span style="color:var(--bh-muted);display:flex">${ic('chevron-right', 16)}</span></button></div>
    </div></div>${bhNav('bhHome')}`,
  acts: {
    mp: () => { if (MP_ATIVO()) { reset('splash', { next: 'home' }, 'fade'); } else go('bhMP'); },
    apos: () => { if (SCREENS.apos1) go('apos1'); else GLOBAL_ACTS.bhSoon({ dataset: { n: 'Aposentadoria' } }); },
    vida: () => SCREENS.bhVida ? go('bhVida') : GLOBAL_ACTS.bhSoon({ dataset: { n: 'Plano Vida+' } }),
    trilhas: () => SCREENS.bhTrilhas ? go('bhTrilhas') : GLOBAL_ACTS.bhSoon({ dataset: { n: 'Trilhas' } }),
    trilha: () => go('bhTrilhas'),
  },
});

/* 03.05 Trilhas (15413:37519) */
const TRILHAS = [['Objetivos e Finanças', '9 Aulas'], ['Foco e Performance', '3 Aulas'], ['Hábitos poderosos', '3 Aulas'], ['Energia e Bem-estar', '4 Aulas']];
screen('bhTrilhas', {
  cls: 'bh-light',
  render: () => `${statusBar()}
  <div class="row" style="flex:none;padding:8px 16px"><button type="button" data-back aria-label="Voltar" style="color:var(--bh-ink)">${ic('chevron-left', 24)}</button></div>
  <div class="scroll" style="background:#fff">
    <div class="col" style="gap:16px;padding:8px 24px 16px">
      <p style="font-size:24px;line-height:32px;font-weight:700;color:var(--bh-ink)">Pra tudo ficar Blue</p>
      <p style="font-size:14px;line-height:22px;color:var(--bh-muted)">Trilhas de conteúdo prático para tratar dos temas que mais impactam sua vida financeira</p></div>
    ${TRILHAS.map(([t], k) => `<div style="padding:24px 24px 16px"><button type="button" data-act="aula" data-n="${t}" aria-label="Abrir a trilha ${t}" style="display:block;width:100%"><img src="assets/bht-${k}.webp" alt="${t}" style="width:100%;border-radius:16px;display:block"></button></div><div style="height:1px;background:var(--bh-line)"></div>`).join('')}
    <div style="height:24px"></div>
  </div>${homeInd()}`,
  acts: { aula: (b) => toast(`${b.dataset.n} abre fora do protótipo`, 'success', 'circle-play') },
});

/* 03.06 Vida+ · convite (18444:30591) */
const VIDA_BENEF = [['shield', 'Seguro de vida', 'R$ 50 mil · titular e beneficiários'], ['circle-alert', 'Invalidez permanente por acidente', 'Até R$ 50 mil'], ['info', 'Assistência funeral', 'Titular'], ['phone', 'Médico Especialista na Tela', '+25 Especialidades Médicas'], ['sun', 'Redução da conta de energia', 'Até 20% de desconto na conta de luz'], ['book-open', 'Clube do Livro e Leilão de Crédito', 'Também inclusos'], ['message-circle', 'Suporte via assistente', 'Atendimento humano pelo WhatsApp']];
screen('bhVida', {
  cls: 'bh-light',
  render: () => `<div class="scroll" style="background:var(--bh-subtle)">
    <div style="position:relative;height:300px;flex:none">
      <img src="assets/bhv-hero.webp" alt="Família sorrindo junta" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,12,35,.45) 0%,rgba(3,12,35,.25) 40%,rgba(3,12,35,.75) 100%)"></div>
      ${statusBar(true).replace('class="sb light"', 'class="sb light" style="position:absolute;left:0;right:0;top:0;z-index:2"')}
      <button type="button" data-back aria-label="Voltar" style="position:absolute;left:16px;top:52px;z-index:2;color:#fff">${ic('chevron-left', 24)}</button>
      <div class="col" style="position:absolute;left:24px;right:24px;bottom:24px;gap:8px;z-index:2">
        <p style="font-size:12px;line-height:16px;font-weight:700;color:var(--bh-orange)">Plano VIDA+</p>
        <p style="font-size:24px;line-height:32px;font-weight:700;color:#fff">Como adicionar dependentes?</p></div></div>
    <div class="col" style="gap:32px;padding:24px 24px 32px">
      <div class="col" style="gap:12px;background:var(--bh-ink);border-radius:20px;padding:20px">
        <span style="align-self:flex-start;background:var(--bh-blue);border-radius:16px;padding:4px 10px;font-size:12px;line-height:16px;font-weight:600;color:#fff">Plano complementar</span>
        <p style="font-size:20px;line-height:28px;font-weight:700;color:#fff">Vida+</p>
        <p style="font-size:12px;line-height:18px;color:#c9d2e8">Proteja seus familiares: coberturas próprias para quem está ao lado do colaborador.</p>
        <p style="font-size:28px;line-height:36px;font-weight:700;color:#fff">R$ 49,90 <span style="font-size:12px;font-weight:400;color:#c9d2e8">por familiar · mês</span></p>
        <p style="font-size:12px;line-height:18px;color:#c9d2e8">Como funciona: o Vida+ só pode ser contratado para familiares de quem já tem um plano Blue ativo. É isso que permite o preço.</p></div>
      <div class="col" style="gap:12px">
        <p style="font-size:16px;line-height:24px;font-weight:600;color:var(--bh-ink)">O que seu dependente vai ganhar?</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${VIDA_BENEF.map(([i, t, d]) => `<div class="col" style="gap:6px;background:#fff;border:1px solid var(--bh-line);border-radius:12px;padding:12px"><span style="color:var(--bh-blue);display:flex">${ic(i, 18)}</span><span style="font-size:12px;line-height:18px;font-weight:600;color:var(--bh-ink)">${t}</span><span style="font-size:12px;line-height:18px;color:var(--bh-muted)">${d}</span></div>`).join('')}</div></div>
      <div class="col" style="gap:12px">
        <p style="font-size:16px;line-height:24px;font-weight:600;color:var(--bh-ink)">Mais barato que uma pizza. A contratação mais barata possível</p>
        <div class="col" style="gap:8px;background:var(--bh-ink);border-radius:20px;padding:20px">
          <p style="font-size:12px;line-height:18px;color:#c9d2e8;text-decoration:line-through">De R$ 89,90/mês</p>
          <p style="font-size:28px;line-height:36px;font-weight:700;color:#fff">R$ 49,90</p>
          <p style="font-size:12px;line-height:18px;color:#c9d2e8">Valor mensal, por pessoa adicionada<br>Menos de R$2,00 por dia</p>
          <button type="button" data-act="proteger" style="height:44px;border-radius:9999px;background:var(--bh-blue);color:#fff;font-size:14px;line-height:22px;font-weight:600;margin-top:8px">Proteger dependente</button></div></div>
      <div class="col" style="gap:12px">
        <p style="font-size:16px;line-height:24px;font-weight:600;color:var(--bh-ink)">Por que você deveria proteger sua família?</p>
        <p style="font-size:12px;line-height:18px;color:var(--bh-muted)">Uma mensagem sobre a importância da segurança financeira:</p>
        <div style="position:relative;background:var(--bh-ink);border-radius:16px;height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff">
          ${ic('circle-play', 36)}<span style="font-size:12px;line-height:18px;font-weight:600">Vídeo em breve</span>
          <span style="position:absolute;right:12px;bottom:12px;font-size:12px;font-weight:600;color:#c9d2e8">15:04</span></div></div>
      <div class="col" style="gap:8px">
        <button type="button" data-act="proteger" style="height:44px;border-radius:9999px;background:var(--bh-blue);color:#fff;font-size:14px;line-height:22px;font-weight:600">Proteger dependente</button>
        <p class="center" style="font-size:12px;line-height:18px;color:var(--bh-muted)">Você será redirecionado para o site Bluehub.</p></div>
    </div></div>${homeInd()}`,
  acts: { proteger: () => toast('A contratação segue no site da Bluehub', 'success', 'external-link') },
});

/* 03.08.01 - Bluehub · Cobertura (15413:37424) */
const COBERTURAS = [['Plano Odontológico - R$11,90', 'Mais de 270 procedimentos odontológicos disponíveis.'], ['Apoio Psicológico Online', 'Consulta psicológica via vídeo chamada.'], ['Cobertura personalizada para proteger a saúde dos seus filhos.', 'Consulte condições.']];
screen('bhCobertura', {
  cls: 'bh-light',
  render: () => `${statusBar()}
    <div class="row jc" style="flex:none;padding:8px 20px;position:relative">${BH_LOGO_D}<button type="button" data-back aria-label="Voltar" style="position:absolute;left:16px;top:8px;color:var(--bh-ink)">${ic('chevron-left', 24)}</button></div>
    <div class="scroll" style="background:#fff">
      <div class="col" style="gap:8px;padding:16px 24px 20px">
        <p style="font-size:24px;line-height:32px;font-weight:700;color:var(--bh-ink)">Mais opções de cobertura</p>
        <p style="font-size:14px;line-height:22px;color:var(--bh-muted)">Você pode ampliar seus benefícios. Entre em contato conosco para ativar mais opções.</p></div>
      <div class="col" style="gap:16px;padding:20px 24px 24px;background:var(--bh-subtle)">
        <p style="font-size:16px;line-height:24px;font-weight:600;color:var(--bh-ink)">Quais são suas prioridades?</p>
        ${COBERTURAS.map(([t, d]) => `<div class="row g3 ais" style="background:#fff;border-radius:16px;padding:16px"><span class="bh-ic">${ic('plus', 18)}</span><span class="col g1 f1"><span style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-ink)">${t}</span><span style="font-size:12px;line-height:18px;color:var(--bh-muted)">${d}</span></span></div>`).join('')}
        <div class="col g2" style="padding-top:8px">
          <p style="font-size:16px;line-height:24px;font-weight:600;color:var(--bh-ink)">Fale conosco</p>
          <p style="font-size:12px;line-height:18px;color:var(--bh-muted)">Atendimento de segunda a sexta, das 9h às 18h.</p>
          <button type="button" class="row g2 jc" data-act="bhSoon" data-n="WhatsApp" style="height:48px;border-radius:9999px;background:var(--bh-blue);color:#fff;font-size:14px;font-weight:600;margin-top:8px">${ic('message-circle', 18)} Falar no WhatsApp</button></div>
      </div></div>${homeInd()}`,
});

/* página do Me Paguei dentro do BlueHub */
screen('bhMP', {
  cls: 'bh-light',
  render: () => `<div style="background:var(--bh-blue);color:#fff;flex:none">${statusBar(true)}<div class="row g3" style="padding:8px 16px 14px"><button type="button" data-back aria-label="Voltar" style="color:#fff">${ic('chevron-left', 22)}</button><div class="f1"><p class="h4">Saúde Financeira</p><p class="cap" style="color:#dfe7ff">Me Paguei - Assistente Financeiro</p></div><button type="button" data-back aria-label="Fechar" style="color:#fff">${ic('x', 22)}</button></div></div>
  <div class="scroll" style="background:#fff"><div class="col g5" style="padding:20px">
    <div style="position:relative;height:474px;flex:none;margin-bottom:6px">
      <div style="position:absolute;left:36px;right:36px;bottom:-8px;height:30px;border-radius:0 0 28px 28px;background:#c9e4fb"></div>
      <img src="assets/welcome.webp" alt="Homem sorrindo segurando o celular" style="position:relative;width:100%;height:474px;object-fit:cover;object-position:center 20%;border-radius:28px">
      <div style="position:absolute;left:0;top:0;width:96px;height:52px;background:#fff;border-radius:0 0 20px 0;display:flex;align-items:center;justify-content:center"><img src="assets/logo-color.png" alt="Me Paguei" width="56" height="34"></div></div>
    <div class="col g2"><p class="h1" style="color:var(--bh-ink)">Me Paguei</p><p class="b16" style="color:var(--bh-muted)">Cuidar das suas finanças nunca foi tão fácil.</p></div>
    <p class="b16 bold" style="color:var(--bh-ink)">O que você acessa através do Me Paguei:</p>
    <div class="col g3">${[['piggy-bank', 'Poupança Automática', 'Defina um objetivo e nós guardamos o valor para você, sem esforço.'], ['lock', 'Saldo Seguro', 'Uma previsão dos seus próximos 30 dias para você saber quanto tem livre.'], ['globe', 'Radar', 'Mostra para onde seu dinheiro está indo'], ['message-circle', 'MIA', 'A MIA te ajuda a manter as finanças em dia com lembretes e notificações.']].map(([i, t, d]) => `<div class="bh-card row g3 ais" style="flex-direction:row"><span class="bh-ic">${ic(i, 18)}</span><div class="col g1"><p class="b16 semi" style="color:var(--bh-ink)">${t}</p><p class="b14" style="color:var(--bh-muted)">${d}</p></div></div>`).join('')}</div>
    <div class="col g3" style="padding:8px 0 12px">${btn('Ativar assistente financeiro', { cls: 'lg', act: 'ativar', attrs: 'style="background:var(--bh-blue)"' })}${btn('Agora não', { cls: 'lg', act: 'nao', attrs: 'style="background:#eceef3;color:var(--bh-ink)"' })}</div>
  </div></div>${homeInd()}`,
  acts: {
    ativar: () => { S.flags.viaBH = true; S.flags.mpAtivo = true; S.flags.startChoice = 'perfil'; reset('onboarding', {}, 'fade'); },
    nao: () => back(),
  },
});

screen('bhBenef', {
  cls: 'bh-light',
  render: (p) => { const open = p.open ?? -1;
    const G = [['circle-dollar-sign', 'Minhas Finanças', [['Assistente Financeiro - Me Paguei', 'Organize sua vida financeira sem esforço.', 'mp'], ['Aposentadoria Inteligente', 'Simule, planeje e conquiste a aposentadoria dos seus sonhos.', 'apos'], ['SuperPrevidência', 'Apoio especializado na escolha de uma Previdência Privada.'], ['Médico das Finanças', 'Agende uma sessão de consultoria financeira'], ['Clube do Livro', 'Ouça um livro de finanças no seu tempo livre.'], ['Leilão e Cashback de Crédito', 'Solicite uma cotação com economia de juros.']]],
      ['star', 'Blue+ · Economia Familiar', [['Redução da conta de energia', 'Desconto todo mês na sua conta de luz'], ['Desconto em Farmácia', 'Até 80% de desconto em medicamentos'], ['Desconto em Academias', 'Acesse o TotalPass']]],
      ['heart-pulse', 'Minha saúde', [['Médico na Tela Familiar', 'Médico SulAmérica'], ['Médico Especialista na Tela', 'Agende consultas médicas para você e sua familia'], ['Consultas e Exames', 'Mais de 25 especialidades médicas disponíveis'], ['Cesta Natalidade', 'Vai ter ou adotar um filho? Acione sua cesta']]],
      ['shield', 'Minhas Proteções', [['Despesas médicas por acidente', 'Cobertura financeira para despesas médicas e odontológicas em acidentes'], ['Seguro de vida do titular', 'Acesse as condições da sua proteção'], ['Invalidez permanente por acidente', 'Acesse as condições da sua proteção'], ['Auxílio funeral', 'A Sulamérica cuida de tudo pra você'], ['Assistência residencial', 'Solicite um profissional na sua casa']]],
      ['circle-play', 'Pra tudo ficar Blue', [['Objetivos e Finanças · 9 aulas', 'Entenda como se planejar financeiramente para realizar seus objetivos'], ['Foco e Performance · 3 aulas', 'Atitudes práticas para melhorar seu rendimento e produtividade'], ['Hábitos Poderosos · 3 aulas', 'Como desenvolver hábitos inteligentes'], ['Energia e Bem-estar · 4 aulas', 'Pequenas mudanças que melhoram sua qualidade de vida']]]];
    return `${statusBar()}<div class="row jc" style="position:relative;padding:8px 20px">${BH_LOGO_D}<button type="button" data-act="bhBack" aria-label="Voltar" style="position:absolute;left:24px;top:11px;color:var(--bh-ink);display:flex">${ic('chevron-left', 18)}</button></div>
    <div class="scroll"><div class="col g2" style="padding:16px 20px 20px;background:#fff"><p class="h1" style="color:var(--bh-ink)">Benefícios</p><p class="b14" style="color:var(--bh-muted)">Confira abaixo todos os benefícios que você já tem disponíveis no seu plano Ultrablue.</p></div>
    <div class="col g3" style="padding:16px">${G.map(([i, t, items], k) => `<div class="bh-acc"><button type="button" data-act="acc" data-k="${k}" aria-expanded="${open === k}"><span class="bh-ic">${ic(i, 18)}</span><span class="f1 b16 semi" style="color:var(--bh-ink)">${t}</span>${ic(open === k ? 'chevron-up' : 'chevron-down', 18)}</button>
      ${open === k ? `<div class="in">${items.map(([a, d, act]) => `<button type="button" class="li" data-act="${act || 'bhSoon'}" data-n="${a}"><span class="lt col"><span class="b14 semi" style="color:var(--bh-ink)">${a}</span><span class="cap" style="color:var(--bh-muted)">${d}</span></span>${ic('chevron-right', 18)}</button>`).join('')}</div>` : ''}</div>`).join('')}</div></div>${bhNav('bhBenef')}`; },
  acts: {
    acc: (b) => { const p = stack[stack.length - 1].p; const k = +b.dataset.k; p.open = p.open === k ? -1 : k; rerender(); },
    mp: () => SCREENS.bhHome.acts.mp(),
    apos: () => SCREENS.bhHome.acts.apos(),
  },
});
/* 03.03 Bluehub · Carteirinha (18004:32727) */
const CART_TEL = [
  ['Seguros de Vida e Auxílio Funeral', 'SulAmérica · Central de Serviços',
    [['link', 'sulamericavida.docway.com.br', ''], ['link', 'Espaço do cliente - acessar minha apólice', ''],
     ['tel', '4004 4935', 'Seg-sex, 8h às 18h30'], ['tel', '0800 722 0504', 'SAC 24h, feriados e finais de semana'],
     ['tel', '0800 702 2242', 'SAC 24h, feriados e finais de semana'], ['tel', '0800 725 3374', 'Ouvidoria']],
    'Orientações iniciais e direcionamento sobre o acionamento do seguro. Não substitui o SAC 24h para urgências.'],
  ['Médico na Tela Familiar', 'SulAmérica · Central de Assistências',
    [['link', 'sulamericavida.docway.com.br', ''], ['tel', '4004 4935', 'Capitais e regiões metropolitanas'], ['tel', '0800 726 4935', 'Demais localidades']], ''],
  ['Assistência Residencial', 'Assistência 24h',
    [['tel', '4090 1073', 'Capitais e regiões metropolitanas'], ['tel', '0800 778 1073', 'Demais localidades'], ['tel', '+55 11 4126 9317', 'Exterior']],
    'Canal exclusivo para pessoas com deficiência auditiva e de fala.'],
  ['Consultas e exames presenciais', 'Central de Serviços',
    [['link', 'temsaude.com/maywd', ''], ['tel', '4000 1681', 'Capitais e regiões metropolitanas'], ['tel', '0800 836 8836', 'Demais localidades · seg-sex, 9h às 18h (exceto feriados)']], ''],
];
screen('bhCart', {
  cls: 'bh-light',
  render: (p) => { const open = p.open ?? 0;
    return `${statusBar()}<div class="row jc" style="flex:none;padding:8px 20px;position:relative">${BH_LOGO_D}<button type="button" data-act="bhBack" aria-label="Voltar" style="position:absolute;left:24px;top:11px;color:var(--bh-ink);display:flex">${ic('chevron-left', 18)}</button></div>
    <div class="scroll"><div class="col" style="gap:20px;padding:8px 24px 20px">
      <p style="font-size:24px;line-height:32px;font-weight:700;color:var(--bh-ink)">Carteirinha</p>
      <div style="position:relative;overflow:hidden;border-radius:20px;padding:20px;background:linear-gradient(120deg,#1b3bd6,#0a1b6b);color:#fff;display:flex;flex-direction:column;gap:14px">
        <img src="assets/bh-deco-rings.svg" alt="" style="position:absolute;right:-30px;top:-20px;width:170px;opacity:.5;pointer-events:none">
        <img src="assets/bluehub-logo-white.png" alt="bluehub" width="88" height="24" style="position:relative">
        <p class="num" style="font-size:22px;line-height:30px;font-weight:700;position:relative">${esc(S.user.cpf || '123.456.789-00')}</p>
        <div class="col" style="gap:10px;position:relative">
          <div><p style="font-size:14px;line-height:22px;font-weight:600">${esc(S.user.nome || 'Marcelo Andrade de Souza')}</p><p style="font-size:11px;line-height:16px;opacity:.75">Nome do beneficiário</p></div>
          <div><p style="font-size:14px;line-height:22px;font-weight:600">UltraBlue</p><p style="font-size:11px;line-height:16px;opacity:.75">Tipo do plano</p></div>
          <div class="row g3" style="align-items:center"><div class="f1"><p style="font-size:14px;line-height:22px;font-weight:600">CESAR</p><p style="font-size:11px;line-height:16px;opacity:.75">Contratante</p></div>
            <span style="background:#2fd0e0;color:#03204a;border-radius:9999px;padding:2px 10px;font-size:10px;font-weight:700;letter-spacing:.04em">TITULAR</span>
            <span style="font-size:12px;opacity:.9">Desde 08/2026</span></div></div></div>
      <button type="button" data-act="bhSoon" data-n="Salvar carteirinha" style="height:48px;border-radius:9999px;background:transparent;color:var(--bh-blue);font-size:14px;font-weight:600;box-shadow:inset 0 0 0 1.5px var(--bh-blue)">Salvar carteirinha</button>
      <p style="font-size:14px;line-height:22px;color:var(--bh-muted)">Para acionar os benefícios por telefone, utilize os contatos abaixo:</p>
      <p style="font-size:16px;line-height:24px;font-weight:700;color:var(--bh-ink)">Telefones úteis</p>
      ${CART_TEL.map(([t, sub, rows, zap], k) => `<div style="background:#fff;border:1px solid var(--bh-line);border-radius:16px;overflow:hidden">
        <button type="button" data-act="cacc" data-k="${k}" aria-expanded="${open === k}" class="row g3" style="width:100%;padding:16px;text-align:left"><span class="col g1 f1"><span style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-ink)">${t}</span><span style="font-size:12px;line-height:18px;color:var(--bh-muted)">${sub}</span></span><span style="color:var(--bh-muted);display:flex">${ic(open === k ? 'chevron-up' : 'chevron-down', 18)}</span></button>
        ${open === k ? `<div class="col" style="padding:0 16px 16px;gap:12px">
          ${rows.map(([tipo, v, d]) => `<div class="row g3 ais"><span class="bh-ic" style="width:32px;height:32px;flex:none">${ic(tipo === 'link' ? 'external-link' : 'phone', 15)}</span><span class="col g1 f1">${tipo === 'link'
            ? `<span style="font-size:13px;line-height:20px;color:var(--bh-blue);text-decoration:underline;overflow-wrap:anywhere">${v}</span>`
            : `<span class="num" style="font-size:14px;line-height:22px;font-weight:600;color:var(--bh-ink);user-select:all">${v}</span>${d ? `<span style="font-size:12px;line-height:18px;color:var(--bh-muted)">${d}</span>` : ''}`}</span></div>`).join('')}
          ${zap ? `<div class="col g2" style="background:#eefaf1;border:1px solid #cdecd6;border-radius:12px;padding:12px">
            <p style="font-size:12px;line-height:18px;color:#1f5c38">${zap}</p>
            <button type="button" class="row g2 jc" data-act="bhSoon" data-n="WhatsApp" style="height:40px;border-radius:9999px;background:#1f7a46;color:#fff;font-size:13px;font-weight:600">${ic('message-circle', 16)} Falar no WhatsApp</button></div>` : ''}
        </div>` : ''}</div>`).join('')}
    </div></div>${bhNav('bhCart')}`; },
  acts: { cacc: (b) => { const p = stack[stack.length - 1].p; const k = +b.dataset.k; p.open = p.open === k ? -1 : k; rerender(); } },
});
screen('bhPerfil', {
  cls: 'bh-light',
  render: (p) => { const open = p.open ?? -1;
    const A = [['user', 'Seus dados', [['Nome completo', S.user.nome || 'Marcelo Andrade de Souza'], ['CPF', (S.user.cpf || '123.456.789-00') + ' · não editável'], ['E-mail', S.user.email || 'marcelo@email.com']]], ['circle-help', 'Ajuda e suporte', [['Perguntas frequentes', 'Como usar cada benefício'], ['Falar com a assistente', 'Tire dúvidas sobre seus benefícios']]], ['settings', 'Conta', [['Alterar senha', 'Modifique sua senha de acesso'], ['Notificações', 'Lembretes e novidades do plano'], ['Privacidade e termos', 'Política e termos de uso']]]];
    const acc = (i, t, k, inner) => `<div class="bh-acc"><button type="button" data-act="${k === null ? 'bhSoon' : 'acc'}" ${k === null ? 'data-n="Indique a Bluehub"' : `data-k="${k}" aria-expanded="${open === k}"`} style="min-height:64px"><span class="bh-ic">${ic(i, 18)}</span><span class="f1 b16 semi" style="color:var(--bh-ink)">${t}</span>${k === null ? '' : ic(open === k ? 'chevron-up' : 'chevron-down', 18)}</button>${inner || ''}</div>`;
    return `<div class="scroll" style="background:var(--bh-subtle)">
      <div style="flex:none;position:relative;height:200px;background:var(--bh-blue);border-radius:0 0 28px 28px;padding:56px 24px 24px;display:flex;flex-direction:column;gap:32px">
        ${statusBar(true).replace('class="sb light"', 'class="sb light" style="position:absolute;left:0;right:0;top:0"')}
        <div class="row" style="height:24px"><button type="button" data-act="bhBack" aria-label="Voltar" style="color:#fff;display:flex">${ic('chevron-left', 24)}</button></div>
        <div class="row" style="gap:8px;align-items:center">${bhUserEdit()}</div></div>
    <div class="col" style="gap:16px;padding:24px">
      <div style="border-radius:16px;padding:16px;background:linear-gradient(135deg,#1f3fb8,#0b1d5c);color:#fff;display:flex;flex-direction:column;gap:16px">
        <p style="font-size:18px;line-height:24px;font-weight:700;color:#f5f5f5">Amplie seus benefícios</p>
        <p style="font-size:12px;line-height:18px;color:#dfe7ff">Como titular, <b>você tem direito de adicionar os melhores benefícios da Bluehub</b> para você e seus familiares!</p>
        <button type="button" data-act="vidaMais" style="height:40px;border-radius:9999px;background:#fff;color:var(--bh-ink);font-size:12px;line-height:18px;font-weight:600">Ver mais</button></div>
      <div class="col" style="gap:24px">
        <div class="col" style="gap:16px">${A.map(([i, t, rows], k) => acc(i, t, k, open === k ? `<div class="in">${rows.map(([a, d]) => `<div class="li"><span class="lt col"><span class="b14 semi" style="color:var(--bh-ink)">${esc(a)}</span><span class="cap" style="color:var(--bh-muted)">${esc(d)}</span></span></div>`).join('')}</div>` : '')).join('')}</div>
        <div class="bh-acc" style="background:var(--bh-blue-bg);border-color:var(--bh-blue-bg)"><button type="button" data-act="bhSoon" data-n="Indique a Bluehub" style="min-height:64px"><span class="bh-ic" style="background:var(--bh-blue);color:#fff">${ic('share-2', 18)}</span><span class="f1 b16 semi" style="color:var(--bh-ink)">Indique a Bluehub</span></button></div></div>
      <div class="col" style="gap:40px;padding-top:8px">
        <button type="button" data-act="sair" style="height:44px;border-radius:9999px;background:var(--bh-line);color:var(--bh-ink);font-size:14px;line-height:22px;font-weight:600">Sair da conta</button>
        <button type="button" data-act="delConta" style="height:44px;border-radius:9999px;background:transparent;color:var(--bh-blue);font-size:14px;line-height:22px;font-weight:600">Cancelar assinatura</button></div>
    </div></div>${bhNav('bhPerfil')}`; },
  /* dataURL (e não objectURL): assim a foto sobrevive a sair e entrar de novo */
  mount: (el) => { const i = $('#bhfoto', el); if (i) i.addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.user.bhFoto = r.result; rerender(); toast('Foto atualizada'); }; r.readAsDataURL(f); }); },
  acts: {
    acc: (b) => { const p = stack[stack.length - 1].p; const k = +b.dataset.k; p.open = p.open === k ? -1 : k; rerender(); },
    sair: () => { fechaConta(false); reset('bhWelcome'); },
    vidaMais: () => go('bhVida'),
    delConta: () => openDialog(`<div class="col g4" style="text-align:left">
      <span class="ico-c sq" style="background:var(--bh-blue-bg);color:var(--bh-blue)">${ic('circle-x', 22)}</span>
      <p class="h4" style="color:var(--bh-ink)">Cancelar sua assinatura?</p>
      <p class="b14" style="color:var(--bh-muted)">Ao confirmar, sua assinatura será encerrada e você perderá o acesso aos benefícios do seu plano. Para voltar a usá-los, será preciso assinar novamente.</p>
      <div class="col g3">${btn('Cancelar assinatura', { act: 'delOk', attrs: 'style="background:var(--bh-blue)"' })}${btn('Manter assinatura', { v: 'o', act: 'closeov', attrs: 'style="color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}</div></div>`),
    delOk: () => { closeOverlays(true); fechaConta(true); reset('bhWelcome', {}, 'fade'); later(() => toast('Assinatura cancelada', 'success', 'circle-check'), 400); },
  },
});
screen('bhNotif', {
  cls: 'bh-light',
  render: () => `${statusBar()}${appHeader('Notificações')}<div class="scroll px5 col g3" style="display:flex;padding-bottom:20px">
    <p class="b14" style="color:var(--bh-muted)">A Bluehub é o único aplicativo do seu celular que quanto mais você usa, mais você economiza! Ative as notificações.</p>
    <p class="b14 bold" style="color:var(--bh-ink);margin-top:8px">Esta semana</p>
    ${[['Informe o beneficiário', 'Lembre-se de deixar seu beneficiário informado do seu seguro de vida. Você conta com uma cobertura de R$ 100 mil.'], ['Médico das Finanças', 'Precisa de um especialista para organizar as finanças ou tomar uma decisão importante? Agende uma consulta com seu Médico das Finanças.']].map(([t, d]) => `<div class="bh-card"><p class="b14 bold" style="color:var(--bh-ink)">${t}</p><p class="b14" style="color:var(--bh-muted)">${d}</p><p class="cap" style="color:var(--bh-muted)">Há 2 dias</p></div>`).join('')}
    <p class="b14 bold" style="color:var(--bh-ink);margin-top:8px">Antes</p>
    ${[['Já entrou no Clube do Livro?', 'Uma forma de aprender mais sobre boas decisões financeiras é acompanhar o Clube do Livro. Clique para ouvir.'], ['Se aposente com segurança', 'Você sabe o quanto você precisa para se aposentar com segurança? Descubra agora'], ['Bons hábitos em dia!', `${esc(firstName())}, talvez você ainda não perceba, mas cada vez que volta aqui está fortalecendo um ótimo hábito financeiro.`]].map(([t, d]) => `<div class="bh-card"><p class="b14 bold" style="color:var(--bh-ink)">${t}</p><p class="b14" style="color:var(--bh-muted)">${d}</p><p class="cap" style="color:var(--bh-muted)">Há 2 dias</p></div>`).join('')}
  </div>${homeInd()}`,
});

flowEntry('BlueHub', 'Cadastro no BlueHub (início do teste)', () => { fechaConta(false); reset('bhSplash'); });
flowEntry('BlueHub', 'Home do BlueHub', () => { if (!S.user.nome) Object.assign(S.user, { nome: 'Marcelo Pimentel', email: 'marcelo.pimentel@gmail.com', cpf: '123.456.789-00' }); reset('bhHome'); });
flowEntry('BlueHub', 'Trilhas (Pra tudo ficar Blue)', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; reset('bhHome'); go('bhTrilhas'); });
flowEntry('BlueHub', 'Plano Vida+', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; reset('bhHome'); go('bhVida'); });
flowEntry('BlueHub', 'Página do Me Paguei no BlueHub', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; S.flags.mpAtivo = false; reset('bhHome'); go('bhMP'); });
