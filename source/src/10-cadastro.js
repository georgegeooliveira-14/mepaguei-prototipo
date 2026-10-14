/* ============ 01–03 · Splash, onboarding, boas-vindas, cadastro, perfil ============ */

screen('splash', {
  cls: 'splash',
  render: () => `<div style="position:absolute;inset:0;background:var(--primary)"></div>${statusBar(true)}
    <div class="col jc" style="flex:1;align-items:center;position:relative"><img src="assets/logo-white.png" alt="Me Paguei" width="102" height="72" style="animation:pop .6s .2s cubic-bezier(.2,.8,.2,1) both"></div>${homeInd(true)}`,
  /* `next` permite reusar a splash ao voltar do Bluehub para o Me Paguei (item 3) */
  mount: (el, p) => later(() => reset((p && p.next) || 'onboarding', {}, 'fade'), 1700),
});

/* 4 slides conforme Figma 9615:33323 (section "Onboarding", telas 03.01.01 a 03.01.03) */
const OB = [
  { img: 'mia-avatar.webp', w: 199, h: 227, t: 'Sua Assistente Financeira', d: 'Conheça a MIA. Ela acompanha seu dinheiro e avisa o que importa antes de virar problema.', round: true },
  { img: 'ob-poupanca.png', w: 250, h: 204, t: 'Poupança Automática', d: 'Você escolhe como guardar e a MIA faz o resto, no automático.' },
  { img: 'ob-clareza.png', w: 225, h: 204, t: 'Clareza para decidir', d: 'Veja suas faturas antes de elas chegarem e saiba quanto dá para gastar.' },
  { img: 'ob-controle.png', w: 204, h: 204, t: 'Tudo sob controle!', d: 'A MIA cuida das suas metas, encontra assinaturas esquecidas e avisa antes dos gastos chegarem.' },
];
screen('onboarding', {
  render: (p) => {
    const i = p.i || 0, s = OB[i], last = i === OB.length - 1;
    return `${statusBar()}
    <div class="col" style="flex:1;padding:0 20px;align-items:center">
      <div style="height:88px;display:flex;align-items:center"><img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40"></div>
      <div class="col jc" style="flex:1;align-items:center;width:100%" data-swipe>
        <img src="assets/${s.img}" alt="" width="${s.w}" height="${s.h}" style="${s.round ? 'border-radius:16px;' : ''}max-height:300px;width:auto;object-fit:contain;animation:fadeIn .4s ease both" draggable="false">
      </div>
      <div class="col g4 center w100" style="padding-bottom:16px">
        <p class="h1 c-darker">${s.t}</p>
        <p class="b16 c-dark">${s.d}</p>
        <div class="row jc g1" style="height:16px" aria-label="Passo ${i + 1} de ${OB.length}">${OB.map((_, k) => `<span style="height:4px;border-radius:2px;width:${k === i ? 16 : 4}px;background:${k === i ? 'var(--primary)' : 'var(--primary-darker)'}"></span>`).join('')}</div>
        <div class="col g2" style="margin-top:8px">
          ${btn(last ? (S.flags.viaBH ? 'Continuar' : 'Iniciar cadastro') : 'Próximo', { act: 'next' })}
          ${last ? '<div style="height:40px"></div>' : btn('Pular', { v: 'l', cls: 'muted', act: 'skip' })}
        </div>
      </div>
    </div>${homeInd()}`;
  },
  mount: (el, p) => {
    let x0 = null;
    el.addEventListener('pointerdown', e => { x0 = e.clientX; });
    el.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; const i = p.i || 0; if (dx < -50 && i < OB.length - 1) replace('onboarding', { i: i + 1 }, 'none'); if (dx > 50 && i > 0) replace('onboarding', { i: i - 1 }, 'none'); });
  },
  acts: {
    next: () => { const i = P().i || 0; if (i < OB.length - 1) replace('onboarding', { i: i + 1 }, 'none'); else if (S.flags.viaBH) go('proc', { msg: 'Ativando seu assistente financeiro...', next: 'cadOk' }); else go('cad1'); },
    skip: () => S.flags.viaBH ? go('proc', { msg: 'Ativando seu assistente financeiro...', next: 'cadOk' }) : go('welcome'),
  },
});

screen('welcome', {
  render: () => `${statusBar()}
    <div class="col" style="flex:1;padding:8px 19px 0;position:relative">
      <div style="position:relative;width:337px;height:500px;max-width:100%;margin:0 auto">
        <div style="position:absolute;left:44px;right:44px;bottom:0;height:40px;border-radius:0 0 32px 32px;background:#c9e4fb"></div>
        <div style="position:absolute;left:12px;right:12px;bottom:8px;height:40px;border-radius:0 0 32px 32px;background:#e3f1fd"></div>
        <img src="assets/welcome.webp" alt="Homem sorrindo segurando o celular" style="position:relative;width:100%;height:484px;object-fit:cover;border-radius:32px">
        <div style="position:absolute;left:0;top:0;width:113px;height:57px;background:#fff;border-radius:0 0 24px 0;display:flex;align-items:center;justify-content:center"><img src="assets/logo-color.png" alt="Me Paguei" width="56" height="34"></div>
      </div>
      <p class="h1 c-darker" style="margin-top:24px">Construindo seu futuro financeiro todos os dias<span class="dot-blue">.</span></p>
      <div class="col g3 mt-auto" style="padding:16px 0 20px">
        ${btn('Criar conta', { go: 'cad1' })}
        ${btn('Entrar', { v: 'o', go: 'login' })}
      </div>
    </div>${homeInd()}`,
});

/* ---------- cadastro: etapa 1 de 3 ---------- */
screen('cad1', {
  cls: 'grad',
  render: () => gradScreen({
    title: 'Cadastro', sub: 'Para começar, precisamos de alguns dados básicos', step: 'Etapa 1 de 3',
    body: `<div class="col g6">
      ${field({ id: 'nome', label: 'Nome completo', ph: 'ex: Maria da Silva', bind: 'user.nome' })}
      ${field({ id: 'cpf', label: 'CPF', ph: '123.456.789-00', bind: 'user.cpf', mask: 'cpf', helper: 'Usamos seu CPF para garantir a segurança da sua conta.' })}
      ${field({ id: 'email', label: 'E-mail', ph: 'seuemail@email.com', bind: 'user.email', type: 'email', mode: 'email' })}
    </div>
    <div class="col g4 mt-auto">
      <div class="chk ${S.user.termos ? 'on' : ''}" data-act="check" data-key="user.termos" role="checkbox" aria-checked="${S.user.termos}" tabindex="0" style="cursor:pointer"><span class="box">${ic('check', 12)}</span><span class="b14 c-darker">Li e aceito as <button type="button" class="lnk" data-act="terms" style="display:inline">Políticas de Privacidade</button> e <button type="button" class="lnk" data-act="terms" style="display:inline">Termos de Uso</button></span></div>
      <p class="cap c-base">Você pode ler os documentos clicando no link acima</p>
    </div>`,
    foot: btn('Próximo', { next: true, act: 'next' }),
  }),
  valid: () => S.user.nome.trim().length > 2 && S.user.cpf.length === 14 && /.+@.+\..+/.test(S.user.email) && S.user.termos,
  acts: {
    terms: (b, e) => { e.stopPropagation(); openSheet(`<p class="h4 c-primary">Políticas de Privacidade e Termos de Uso</p><p class="b14 c-dark">Aqui ficam os documentos que explicam como o Me Paguei usa e protege os seus dados, e as regras de uso do aplicativo.</p><p class="b14 c-base">Nesta versão de teste o texto completo não está disponível.</p>`, { foot: btn('Entendi', { act: 'closeov' }) }); },
    closeov: () => closeTopOverlay(),
    next: () => go('token', { kind: 'email', step: 'Etapa 2 de 3', next: 'cad3' }),
  },
});

/* ---------- código de verificação (e-mail ou SMS) ---------- */
function tokenRender(p) {
  const mail = p.kind === 'email';
  const dest = mail ? (S.user.email || 'm...@gmail.com') : (S.user.cel || '(81) 91234-5678');
  return gradScreen({
    title: 'Código de Verificação', sub: mail ? 'Preencha o campo abaixo com o código' : 'Preencha o campo abaixo com o código enviado por SMS.', step: p.step || '',
    body: `<div class="col g6" style="align-items:center">
      <p class="b16 c-darker center">${mail ? `Você receberá um código no seu e-mail <b>${esc(dest)}</b>.` : `Digite o código de 6 dígitos enviado por SMS para <b>${esc(dest)}</b>`}</p>
      <label class="dig w100" for="dig" aria-label="Código de 6 dígitos">${[0, 1, 2, 3, 4, 5].map(k => `<span class="d" data-d="${k}"></span>`).join('')}<input id="dig" data-mask="dig" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label>
      <p class="b16 c-darker">Tempo para expirar: <b class="num" id="tmr">4:59</b></p>
      <p class="cap c-base center">Digite o código de 6 dígitos que enviamos.</p>
      <div class="row g2 ais w100" style="background:var(--warning-bg);border-radius:12px;padding:12px">
        <span class="c-warning" style="flex:0 0 auto;display:flex">${ic('triangle-alert', 18)}</span>
        <p class="cap c-darker">Se o código não chegar em alguns minutos, siga sem confirmar. Dá para validar depois, em Configurações.</p>
      </div>
    </div>`,
    foot: btn('Validar código', { next: true, act: 'ok' }) + btn('Reenviar código', { v: 'o', act: 'resend', id: 'resend', attrs: 'disabled' }) + btn('Confirmar depois', { v: 'o', act: 'ok' }),
  });
}
function startTimer(el) {
  let s = 299; const t = $('#tmr', el); const rs = $('#resend', el);
  const tick = () => { t.textContent = Math.floor(s / 60) + ':' + pad2(s % 60); rs.disabled = s > 0; if (s > 0) s--; };
  tick(); every(tick, 1000);
}
const tokenDef = {
  cls: 'grad',
  render: tokenRender,
  mount: (el) => { startTimer(el); const i = $('#dig', el); setTimeout(() => i.focus(), 350); paintDigits(el); },
  onInput: (i, el) => { if (i.id === 'dig') paintDigits(el); },
  valid: (p, el) => ($('#dig', el)?.value || '').length === 6,
  acts: {
    ok: () => { const p = P(); go(p.next, p.nextP || {}); },
    resend: () => { clearTimers(); startTimer(cur); toast('Enviamos um novo código', 'success', 'mail'); },
  },
};
function paintDigits(el) { const v = $('#dig', el).value; $$('.dig .d', el).forEach((d, k) => { d.textContent = v[k] || ''; d.classList.toggle('cur', k === Math.min(v.length, 5) && document.activeElement === $('#dig', el)); }); }
screen('token', tokenDef);

/* ---------- senha (criar / nova / alterar) ---------- */
const PW_RULES = [
  ['Mínimo de 12 caracteres;', s => s.length >= 12],
  ['Contém letras maiúsculas;', s => /[A-Z]/.test(s)],
  ['Contém letras minúsculas;', s => /[a-z]/.test(s)],
  ['Contém caracteres numéricos;', s => /\d/.test(s)],
  ['Contém símbolo especial (ex: @, #, $, etc).', s => /[^A-Za-z0-9\s]/.test(s)],
  ['Não contém sequências simples (ex: “123”, “abc”)', s => s.length > 0 && !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|qwe|asd)/i.test(s)],
];
const pwScore = s => PW_RULES.filter(r => r[1](s)).length;
function pwBlock() {
  return `<div class="col g3">
    ${pwField({ id: 'pw1', label: 'Senha', ph: 'Crie uma senha', bind: 'user.senha' })}
    <div class="col g1"><div class="pw-bars" id="pwbars"><i></i><i></i><i></i><i></i><i></i></div><p class="b14 c-base" id="pwlabel" style="text-align:right">Força</p></div>
    <div class="col g1" id="pwrules">${PW_RULES.map(r => `<p class="pw-chk">${ic('x', 16)}<span>${r[0]}</span></p>`).join('')}</div>
  </div>
  ${pwField({ id: 'pw2', label: 'Confirmar senha', ph: 'Confirme sua senha', bind: 'user.senha2' })}
  <p class="fld-h err" id="pwmis" hidden>As senhas não são iguais. Confira e digite novamente.</p>`;
}
function paintPw(el) {
  const s = S.user.senha, sc = pwScore(s);
  const lvl = !s ? 0 : sc <= 2 ? 1 : sc === 3 ? 2 : sc === 4 ? 3 : sc === 5 ? 4 : 5;
  $('#pwbars', el).className = 'pw-bars s' + lvl;
  const lab = $('#pwlabel', el); lab.textContent = ['Força', 'Fraca', 'Média', 'Boa', 'Forte', 'Muito forte'][lvl]; lab.style.color = lvl >= 4 ? 'var(--success)' : lvl ? 'var(--ty-dark)' : '';
  $$('#pwrules .pw-chk', el).forEach((p, k) => { const ok = PW_RULES[k][1](s); p.classList.toggle('ok', ok); p.querySelector('svg').outerHTML = ic(ok ? 'check' : 'x', 16); });
  /* sinaliza divergência assim que o que foi digitado deixa de bater com a senha */
  const s2 = S.user.senha2 || '';
  const mis = !!s2 && s2 !== s && (s2.length >= s.length || !s.startsWith(s2));
  const msg = $('#pwmis', el); if (msg) msg.hidden = !mis;
  const f2 = $('#pw2', el); const box = f2 && f2.closest('.inp');
  if (box) box.classList.toggle('err', mis);
}
const pwValid = () => pwScore(S.user.senha) === PW_RULES.length && S.user.senha === S.user.senha2;
screen('cad3', {
  cls: 'grad',
  render: () => gradScreen({ title: 'Criar senha', sub: 'Crie uma senha forte seguindo as instruções.', step: 'Etapa 3 de 3', body: pwBlock(), foot: btn('Finalizar cadastro', { next: true, act: 'next' }) }),
  mount: paintPw, onInput: (i, el) => paintPw(el), valid: pwValid,
  acts: { next: () => go('proc', { msg: 'Estamos armazenando seus dados...', next: 'cadOk' }) },
});

/* ---------- processamento ---------- */
screen('proc', {
  cls: 'grad',
  render: (p) => `${CURVE}${statusBar(true)}<div class="col proc g6" style="flex:1;position:relative;z-index:2"><div class="spin" role="progressbar" aria-label="Carregando"></div><p class="h3" style="color:#f5f5f5">${p.msg}</p></div>${homeInd(true)}`,
  mount: (el, p) => later(() => { stack.pop(); go(p.next, p.nextP || {}, 'fade'); }, p.ms || 2000),
});

/* ---------- conta criada ---------- */
screen('cadOk', {
  cls: 'grad',
  render: () => `${CURVE}${statusBar(true)}
  <div style="position:relative;z-index:2;height:184px;margin:0 20px;flex:none">
    <img src="assets/logo-white.png" alt="Me Paguei" width="68" height="48" style="position:absolute;left:0;top:8px">
    <img src="assets/mia-celular.webp" alt="" width="164" height="156" style="position:absolute;right:0;bottom:0">
    <span class="chip glass" style="position:absolute;left:0;bottom:24px;height:30px;font-weight:400;font-size:12px">${ic('circle-check', 16)} ${S.flags.viaBH ? 'Assistente ativado com sucesso!' : 'Conta criada com sucesso!'}</span>
  </div>
  <div class="sheet" style="background:#fff"><div class="sheet-in" style="gap:16px">
    <p class="h1 c-darker">${esc(firstName())}, veja sua vida financeira sob uma nova perspectiva<span class="dot-blue">.</span></p>
    <p class="b16 c-dark">Com o Me Paguei, visualize o seu futuro financeiro antes dele chegar</p>
    <p class="b14 semi c-darker" style="margin-top:4px">Nossos próximos passos:</p>
    ${[['landmark', 'Adicione suas instituições bancárias<br>de forma segura via Open Finance'], ['arrow-up-down', 'Conecte as contas de origem<br>e destino para começar a poupar'], ['sparkles', 'Junto com a <b>Mia</b>, planeje suas finanças de hoje e do futuro']].map(([i, t]) => `<div class="row g3"><span class="ico-c sq sm">${ic(i, 18)}</span><p class="b14 c-dark">${t}</p></div>`).join('')}
  </div><div class="sheet-foot" style="background:#fff">${btn('Vamos começar', { act: 'start' })}</div></div>${homeInd()}`,
  acts: {
    start: () => {
      S.flags.startChoice = S.flags.startChoice || 'perfil';
      openSheet(`<p class="h4 c-primary">Como quer começar no Me Paguei?</p>
        <p class="b14 c-dark">Para começarmos a acompanhar sua jornada e identificar oportunidades de economia, escolha o seu ponto de partida:</p>
        ${radio('flags.startChoice', 'perfil', 'Personalizar seu perfil', S.flags.startChoice === 'perfil', 'Adicione mais informações sobre você e conecte suas contas via Open Finance para uma experiência completa.')}
        ${radio('flags.startChoice', 'inicio', 'Ir direto para o Início', S.flags.startChoice === 'inicio', 'Explore o aplicativo e conheça nossas ferramentas no seu ritmo, sem integrar dados agora.')}`,
        { foot: btn('Avançar', { act: 'choose' }) });
    },
    choose: () => { closeOverlays(true); if (S.flags.startChoice === 'perfil') go('obj'); else reset('home'); },
  },
});

/* ---------- objetivo ---------- */
const OBJETIVOS = ['Poupar sem depender de disciplina', 'Saber quanto posso gastar', 'Antecipar gastos e evitar surpresas', 'Conquistar um objetivo financeiro', 'Sair das dívidas e recuperar o controle'];
screen('obj', {
  render: () => `${statusBar()}<div class="ah"><button type="button" class="bkb" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button></div>
  <div class="col px5" style="flex:1;padding-top:8px;gap:40px">
    <img src="assets/logo-color.png" alt="Me Paguei" width="66" height="40">
    <div class="col g4">
      <p class="h1 c-darker" style="text-wrap:wrap">O que você quer melhorar na sua vida financeira?</p>
      <p class="b16 c-dark">Escolha seu maior desafio hoje. A partir dele, vamos encontrar caminhos para alcançar seus objetivos</p></div>
    <div class="col g6" role="radiogroup">${OBJETIVOS.map(o => radio('user.objetivo', o, o, S.user.objetivo === o)).join('')}</div>
    <div class="mt-auto" style="padding:16px 0 20px">${btn('Avançar', { go: 'perf1' })}</div>
  </div>${homeInd()}`,
});

/* ---------- perfil · etapa 1 de 4 ---------- */
/* profissões mais comuns do mercado brasileiro (item 12) */
const PROFISSOES = ['Administrador(a)', 'Advogado(a)', 'Arquiteto(a)', 'Autônomo(a)', 'Comerciante', 'Contador(a)', 'Designer', 'Empresário(a)', 'Engenheiro(a)', 'Funcionário(a) Público(a)', 'Médico(a)', 'Militar', 'Motorista', 'Professor(a)', 'Profissional da Saúde', 'Profissional de Tecnologia (TI)', 'Psicólogo(a)', 'Vendedor(a)', 'Aposentado(a)', 'Desempregado(a)', 'Dona(o) de Casa', 'Estudante', 'Outros'];
screen('perf1', {
  cls: 'grad',
  render: () => gradScreen({
    title: 'Informações básicas', sub: 'Informe seus dados iniciais para que possamos dar início à personalização do seu perfil. Campos com * são obrigatórios.', step: '1/3',
    body: `<div class="col g2" style="align-items:center">
      <span style="width:128px;height:128px;border-radius:50%;overflow:hidden;background:var(--btn-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;line-height:48px;font-weight:700">${fotoUser() ? `<img src="${fotoUser()}" alt="" style="width:100%;height:100%;object-fit:cover">` : esc(iniciais(S.user.nome))}</span>
      <p class="cap c-base center" style="max-width:240px">Sua foto pode ser alterada no seu perfil do BlueHub.</p>
    </div>
    ${selectField({ id: 'gen', label: 'Gênero *', bind: 'user.genero', options: ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'] })}
    ${field({ id: 'nasc', label: 'Quando você nasceu? *', ph: 'dd/mm/aaaa', bind: 'user.nasc', mask: 'data' })}`,
    foot: btn('Continuar', { next: true, go: 'perf2' }),
  }),
  valid: () => S.user.genero && S.user.nasc.length === 10,
});
screen('perf2', {
  cls: 'grad',
  render: () => gradScreen({
    title: 'Perfil profissional', sub: 'Estes dados são importantes para compreendermos seu momento atual. Campos com * são obrigatórios.', step: '2/3',
    body: `${selectField({ id: 'civil', label: 'Estado Civil *', bind: 'user.civil', ph: 'Selecione uma opção', options: ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)'], helper: 'Nos ajuda a entender melhor seu momento de vida.' })}
    ${selectField({ id: 'prof', label: 'Profissão *', bind: 'user.profissao', ph: 'Selecione uma opção', options: PROFISSOES })}
    ${field({ id: 'renda', label: 'Qual o valor da sua renda mensal? *', ph: 'R$ 1.620,00', bind: 'user.renda', mask: 'brl', helper: 'Essa informação será utilizada para melhor atender seus interesses no Me Paguei' })}`,
    /* Endereço (perf3) saiu do fluxo: o perfil passou a ter 3 passos (Figma 5447:18386/5449:38714/5917:9924) */
    foot: btn('Continuar', { next: true, go: 'perf4' }),
  }),
  valid: () => S.user.civil && S.user.profissao.trim() && S.user.renda,
});
/* Busca de CEP no ViaCEP (público, com CORS). Se a rede falhar, cai no endereço de exemplo
   para o teste nunca travar. `cepSeq` descarta resposta atrasada de um CEP já reescrito. */
let cepSeq = 0;
const ENDERECO_EXEMPLO = { rua: 'Rua Bione', bairro: 'Bairro do Recife', cidade: 'Recife', uf: 'PE' };
async function buscaCep(valor) {
  const d = String(valor).replace(/\D/g, '');
  if (d.length !== 8) return;
  const seq = ++cepSeq;
  S.flags.cepSt = 'load'; refresh();
  let data = null, semRede = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal });
    clearTimeout(t);
    data = await r.json();
  } catch (e) { semRede = true; }
  if (seq !== cepSeq) return;                       // o usuário já mudou o CEP
  if (!semRede && data && !data.erro) {
    Object.assign(S.user, { rua: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' });
    S.flags.cepSt = 'ok';
  } else if (!semRede && data && data.erro) {
    Object.assign(S.user, { rua: '', bairro: '', cidade: '', uf: '' });
    S.flags.cepSt = 'err';
  } else {
    Object.assign(S.user, ENDERECO_EXEMPLO);        // sem internet: segue com o exemplo
    S.flags.cepSt = 'ok';
  }
  refresh();
  later(() => $(S.flags.cepSt === 'ok' ? '#num' : '#rua', cur)?.focus(), 60);
}
screen('perf3', {
  cls: 'grad',
  render: () => {
    const st = S.flags.cepSt || '';
    const ok = st === 'ok' || st === 'err';
    return gradScreen({
      /* fora do fluxo de cadastro do perfil; segue acessível para edição pelo Perfil, por isso sem indicador */
      title: 'Endereço', sub: 'Informe seu endereço residencial para fins de validação cadastral. Campos com * são obrigatórios.', step: '',
      body: `${field({ id: 'cep', label: 'CEP *', ph: '12345-078', bind: 'user.cep', mask: 'cep', icon: 'search', helper: st === 'load' ? 'Buscando endereço...' : '' })}
      ${st === 'err' ? '<p class="fld-h err" style="margin-top:-8px">CEP não encontrado. Confira o número ou preencha o endereço abaixo.</p>' : ''}
      <div class="row g3 ais">${field({ id: 'rua', label: 'Rua / Logradouro *', ph: 'ex: Rua Bione', bind: 'user.rua', dis: !ok, cls: 'f1' })}<div style="width:96px">${field({ id: 'num', label: 'Número *', ph: '123', bind: 'user.numero', dis: !ok, mask: 'numero' })}</div></div>
      ${field({ id: 'compl', label: 'Complemento', opt: true, ph: 'ex: Apto. 234, Bloco A', bind: 'user.compl', dis: !ok })}
      ${field({ id: 'bairro', label: 'Bairro *', ph: 'ex: Bairro do Recife', bind: 'user.bairro', dis: !ok })}
      <div class="row g3 ais">${field({ id: 'cid', label: 'Cidade *', ph: 'ex: Recife', bind: 'user.cidade', dis: !ok, cls: 'f1' })}<div style="width:110px">${field({ id: 'uf', label: 'Estado (UF) *', ph: 'PE', bind: 'user.uf', dis: !ok })}</div></div>`,
      foot: btn('Continuar', { next: true, go: 'perf4' }),
    });
  },
  onInput: (i) => {
    if (i.id !== 'cep') return;
    if (i.value.length === 9) { if (S.flags.cepSt !== 'load') buscaCep(i.value); }
    else if (S.flags.cepSt) { S.flags.cepSt = ''; cepSeq++; Object.assign(S.user, { rua: '', bairro: '', cidade: '', uf: '' }); refresh(); }
  },
  valid: () => S.flags.cepSt !== 'load' && S.user.cep.length === 9 && S.user.rua && S.user.numero && S.user.bairro && S.user.cidade && S.user.uf,
});
screen('perf4', {
  cls: 'grad',
  render: () => gradScreen({
    title: 'Informações de contato', sub: 'Insira seu número de telefone para validação de segurança e recebimento de comunicações.', step: '3/3',
    body: field({ id: 'cel', label: 'Celular', ph: '(99) 99999-9999', bind: 'user.cel', mask: 'cel', type: 'tel' }),
    foot: btn('Continuar', { next: true, act: 'next' }),
  }),
  valid: () => S.user.cel.length >= 14,
  acts: { next: () => go('token', { kind: 'sms', step: '3/3', next: 'perfProc' }) },
});

/* ---------- pessoas próximas ---------- */
const PARENTESCO = ['Mãe', 'Pai', 'Parceiro(a)', 'Filhos e afilhados', 'Irmãos', 'Avós, tios, primos', 'Amigos de infância', 'Outras especiais'];
function aniv(d) { const m = d.match(/^(\d{2})\/(\d{2})/); if (!m) return d; const mes = MESES[+m[2] - 1] || ''; return `${+m[1]} de ${mes.charAt(0).toUpperCase() + mes.slice(1)}`; }
function memberItem(m, k, menu = true) {
  return `<div class="card row g3 ais" style="border-color:var(--border-lighter)"><span class="ico-c sm" style="background:var(--bg-lighter);color:var(--ty-base)">${ic('user', 18)}</span>
    <div class="col g1 f1"><p class="b16 semi c-dark">${esc(m.nome)}</p><p class="row g1h b14 c-dark">${ic('cake', 16)} ${esc(aniv(m.nasc))}</p><p class="row g1h b14 c-dark">${ic('users', 16)} ${esc(m.par)}</p></div>
    ${menu ? `<button type="button" data-act="mmenu" data-k="${k}" aria-label="Opções de ${esc(m.nome)}" style="padding:4px;color:var(--ty-base)">${ic('ellipsis-vertical', 20)}</button>` : ''}</div>`;
}
/* ponte: o perfil termina direto no processamento (as pessoas próximas viraram parte da Agenda) */
screen('perfProc', { render: () => '', mount: () => { stack.pop(); go('proc', { msg: 'Salvando dados...', next: 'perfilOk' }, 'none'); } });
screen('pessoas', {
  cls: 'grad',
  render: () => {
    const L = S.user.pessoas;
    const body = L.length ? `<p class="cap semi c-base">Familiares cadastrados (${L.length})</p><div class="col g3">${L.map((m, k) => memberItem(m, k)).join('')}</div>`
      : `<div class="empty" style="margin:auto 0"><span class="ico-c" style="width:56px;height:56px;background:var(--bg-white);color:var(--ty-base)">${ic('user-plus', 26)}</span><p class="b14 semi c-dark">Nenhuma pessoa cadastrada</p><p class="cap c-base" style="max-width:260px">Adicione o primeiro cadastro para antecipar despesas importantes automaticamente e se planejar sem aperto!</p></div>`;
    /* rodapé do Figma: "Adicionar" em botão cheio e "Finalizar" como link */
    const foot = btn('Adicionar', { icon: 'plus', act: 'add' }) +
      `<button type="button" class="b16 semi c-primary center" data-act="done" style="padding:10px">Finalizar</button>`;
    return gradScreen({ title: 'Cadastro de pessoas próximas', sub: 'Adicione aniversários de familiares e amigos próximos dentro da sua agenda.', step: 'Agenda', mark: false, body, foot });
  },
  acts: {
    add: () => { S.tmpM = { nome: '', nasc: '', par: '' }; go('pessoaForm', { k: -1, agenda: P().agenda }); },
    done: () => go('proc', { msg: 'Salvando dados...', next: 'perfilOk' }),
    mmenu: (b) => {
      const k = +b.dataset.k;
      openSheet(`<p class="h4 c-darker">${esc(S.user.pessoas[k].nome)}</p>
        <button type="button" class="li" data-act="medit" data-k="${k}">${ic('pencil', 20)}<span class="lt b16 c-darker">Editar dados</span></button>
        <button type="button" class="li" data-act="mdel" data-k="${k}" style="color:var(--danger)">${ic('trash-2', 20)}<span class="lt b16">Excluir pessoa</span></button>`);
    },
    medit: (b) => { const k = +b.dataset.k; closeOverlays(true); S.tmpM = { ...S.user.pessoas[k] }; go('pessoaForm', { k }); },
    mdel: (b) => { const k = +b.dataset.k; const n = S.user.pessoas[k].nome; S.user.pessoas.splice(k, 1); closeOverlays(true); rerender(); toast(`${esc(n)} foi removida da lista`, 'success', 'trash-2'); },
  },
});
screen('pessoaForm', {
  cls: 'grad',
  render: (p) => gradScreen({
    title: 'Cadastro de pessoas próximas', sub: 'Adicione aniversários de familiares e amigos próximos dentro da sua agenda.', step: 'Agenda', mark: false,
    /* na edição o Figma (15388:36014) não traz o insight da MIA */
    body: `${p.k >= 0 ? '' : S.flags.miaPess ? miaMini('miaPess') : miaBox('Quem é importante para você também faz parte da sua vida financeira', ['Aniversários são fáceis de esquecer no planejamento, mas acontecem o ano inteiro — e são previsíveis.\n\nCadastre as pessoas que fazem parte da sua vida para que eu possa levar essas datas em conta', 'Assim, quando a data entrar no período da sua projeção, eu já considero o gasto e você não é pego de surpresa'], 'miaPess')}
      ${field({ id: 'mn', label: 'Nome', ph: 'ex: Marcelo Pimentel', bind: 'tmpM.nome' })}
      ${field({ id: 'md', label: 'Dia e mês de aniversário', ph: 'Selecionar', bind: 'tmpM.nasc', mask: 'diames', icon: 'calendar-days' })}
      ${field({ id: 'mp', label: 'Grau de parentesco', ph: 'ex: Mãe', bind: 'tmpM.par' })}
      <p class="cap c-base">Considere, no mínimo, pessoas como:</p>
      <div class="row g2" style="flex-wrap:wrap">${PARENTESCO.map(x => `<button type="button" class="chip" data-act="psug" data-v="${esc(x)}" style="height:30px;font-size:12px;color:var(--ia);border-color:${S.tmpM && S.tmpM.par === x ? 'var(--ia)' : '#d9c2f7'};background:${S.tmpM && S.tmpM.par === x ? 'var(--ia-bg)' : '#fff'}">${ic('cake', 14)} ${esc(x)}</button>`).join('')}</div>`,
    foot: btn('Salvar', { next: true, act: 'save' }) + (p.k >= 0 ? btn('Cancelar edição', { v: 'o', act: 'cancel' }) : ''),
  }),
  valid: () => S.tmpM && S.tmpM.nome.trim() && S.tmpM.nasc.length === 5 && S.tmpM.par,
  acts: {
    psug: (b) => { S.tmpM.par = b.dataset.v; refresh(); },
    miaPess: () => { S.flags.miaPess = !S.flags.miaPess; rerender(); },
    save: () => { const p = P(); const k = p.k;
      if (k >= 0) S.user.pessoas[k] = { ...S.tmpM }; else S.user.pessoas.push({ ...S.tmpM });
      /* vindo da Agenda, o Figma leva para a lista de cadastrados (15388:36065) */
      if (p.agenda && stack[stack.length - 2] && stack[stack.length - 2].id !== 'pessoas') replace('pessoas', { agenda: true }, 'fade');
      else back();
      toast(k >= 0 ? 'Dados atualizados' : 'Pessoa adicionada'); },
    cancel: () => back(),
  },
});

screen('perfilOk', {
  cls: 'grad',
  render: () => `${CURVE}${statusBar(true)}
  <div style="position:relative;z-index:2;height:330px;margin:0 20px;flex:none">
    <img src="assets/logo-white.png" alt="Me Paguei" width="68" height="48" style="position:absolute;left:0;top:8px">
    <img src="assets/mia-celebra.webp" alt="" width="204" height="286" style="position:absolute;right:10px;bottom:-8px">
    <span class="chip glass" style="position:absolute;left:0;bottom:24px;height:30px;font-weight:400;font-size:12px">${ic('user-check', 16)} Dados personalizados</span>
  </div>
  <div class="sheet" style="background:#fff"><div class="sheet-in" style="gap:12px">
    <p class="h1 c-darker">Personalização concluída com sucesso!</p>
    <p class="b16 c-dark">Para que nossos alertas de gastos sejam 100% precisos com o seu saldo real, precisamos que você autorize a conexão via Open Finance.</p>
  </div><div class="sheet-foot" style="background:#fff">${btn('Conectar contas', { cls: 'lg', act: 'connect' })}${btn('Deixar para depois', { v: 'o', cls: 'lg', act: 'later' })}</div></div>${homeInd()}`,
  acts: {
    connect: () => { S.perfilCompleto = true; reset('home'); go('of1'); },
    later: () => { S.perfilCompleto = true; reset('home'); },
  },
});

/* ---------- login e recuperação de senha ---------- */
screen('login', {
  cls: 'grad',
  render: () => gradScreen({
    title: 'Login', sub: 'Informe seu CPF e senha para acessar seu dinheiro e continuar no piloto automático.',
    body: `${field({ id: 'lcpf', label: 'CPF', ph: '123.456.789-00', bind: 'flags.lcpf', mask: 'cpf' })}
      ${pwField({ id: 'lpw', label: 'Senha', ph: '************', bind: 'flags.lpw' })}`,
    foot: `${btn('Entrar', { next: true, act: 'enter' })}
      <p class="b16 center c-darker">Não possui uma conta? <button type="button" class="lnk2" data-go="cad1">Cadastre-se</button></p>
      <button type="button" class="b16 lnk2" data-go="rec1" style="align-self:center">Esqueci a senha</button>`,
  }),
  valid: () => (S.flags.lcpf || '').length === 14 && (S.flags.lpw || '').length >= 4,
  acts: { enter: () => go('token', { kind: 'email', step: '', next: 'loginOk' }) },
});
screen('loginOk', { render: () => '', mount: () => { if (!S.user.nome) Object.assign(S.user, { nome: 'Marcelo Pimentel', email: 'marcelo.pimentel@gmail.com' }); S.perfilCompleto = true; reset('home'); } });
screen('rec1', {
  cls: 'grad',
  render: () => gradScreen({ title: 'Recuperar senha', sub: 'Para sua segurança, informe seu CPF e confirme sua identidade para continuar.', body: field({ id: 'rcpf', label: 'CPF', ph: '123.456.789-00', bind: 'flags.rcpf', mask: 'cpf' }), foot: btn('Enviar código', { next: true, act: 'next' }) }),
  valid: () => (S.flags.rcpf || '').length === 14,
  acts: { next: () => go('token', { kind: 'email', next: 'rec3' }) },
});
screen('rec3', {
  cls: 'grad',
  render: () => gradScreen({ title: 'Nova senha', sub: 'Crie uma senha forte seguindo as instruções.', body: pwBlock(), foot: btn('Próximo', { next: true, act: 'next' }) }),
  mount: paintPw, onInput: (i, el) => paintPw(el), valid: pwValid,
  acts: { next: () => { backTo('login'); later(() => toast('Senha redefinida. Entre com a nova senha.'), 350); } },
});

flowEntry('Primeiro acesso', 'Splash e onboarding', () => reset('splash'));
flowEntry('Primeiro acesso', 'Boas-vindas', () => reset('welcome'));
flowEntry('Primeiro acesso', 'Cadastro · etapa 1', () => { reset('welcome'); go('cad1'); });
flowEntry('Primeiro acesso', 'Conta criada', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; reset('cadOk'); });
flowEntry('Primeiro acesso', 'Personalizar perfil', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; reset('cadOk'); go('obj'); });
flowEntry('Primeiro acesso', 'Login', () => { reset('welcome'); go('login'); });
flowEntry('Primeiro acesso', 'Esqueci a senha', () => { reset('welcome'); go('login'); go('rec1'); });
