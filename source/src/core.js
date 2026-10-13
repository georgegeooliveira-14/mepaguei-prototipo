/* ============ Core: estado em memória, roteador, componentes ============ */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- estado (somente memória; nada é salvo) ---------- */
function freshState() {
  return {
    user: { nome: '', cpf: '', email: '', termos: false, senha: '', senha2: '', genero: '', nasc: '', foto: false,
      civil: '', profissao: '', renda: '', cep: '', rua: '', numero: '', compl: '', bairro: '', cidade: '', uf: '',
      cel: '', objetivo: 'Poupar sem depender de disciplina', pessoas: [] },
    perfilCompleto: false,
    contas: [],          // instituições conectadas via Open Finance
    origem: null, destino: null,
    flags: {},
  };
}
let S = freshState();

/* ---------- sessão do participante (sessionStorage, por CPF) ----------
   O protótipo continua não gravando nada no aparelho: sessionStorage vive só
   enquanto a aba está aberta e é apagado pelo navegador quando ela fecha.
   Serve para o participante sair do Bluehub, entrar de novo com CPF + senha e
   reencontrar tudo como deixou. */
const KCONTA = 'mp.conta.';
const soDig = s => String(s || '').replace(/\D/g, '');
const sess = (fn, alt) => { try { return fn(sessionStorage); } catch (e) { return alt; } };
let contaAtual = '';                     /* CPF (só dígitos) da sessão aberta */
/* a maior parte de S.flags é rascunho de formulário/sheet aberta e não deve voltar.
   Só estas marcam progresso do participante e por isso são guardadas. */
const FLAGS_PERSIST = ['hide', 'poupIntroSeen', 'radarIntroSeen', 'fatVisto', 'agendaSeen',
  'clarezaIntro', 'ssEntendi', 'mpAtivo', 'viaBH', 'termsOk', 'ofOk', 'startChoice',
  'sseg', 'miaPess', 'miaS', 'miaR', 'miaA'];
function salvaConta() {
  if (!contaAtual) return;
  const { flags, ...resto } = S;
  resto.flags = {};
  FLAGS_PERSIST.forEach(k => { if (flags[k] !== undefined) resto.flags[k] = flags[k]; });
  sess(ss => ss.setItem(KCONTA + contaAtual, JSON.stringify(resto)));
}
/* novaConta: cadastro recém-feito — passa a gravar neste CPF sem restaurar nada */
function novaConta(cpf) { const k = soDig(cpf); if (k.length === 11) { contaAtual = k; salvaConta(); } }
function abreConta(cpf) {
  const k = soDig(cpf); if (k.length !== 11) return false;
  const raw = sess(ss => ss.getItem(KCONTA + k), null);
  contaAtual = k;
  if (!raw) return false;
  /* o JSON transforma Date em texto ISO (ex.: S.ss.inicio); aqui volta a ser Date */
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  try { const d = JSON.parse(raw, (k, v) => (typeof v === 'string' && ISO.test(v) ? new Date(v) : v));
    S = Object.assign(freshState(), d); S.flags = Object.assign({}, d.flags); return true; } catch (e) { return false; }
}
function fechaConta(apaga) {
  if (apaga && contaAtual) sess(ss => ss.removeItem(KCONTA + contaAtual));
  else salvaConta();
  contaAtual = ''; S = freshState();
}
const iniciais = (n) => { const p = String(n || 'Marcelo Pimentel').trim().split(/\s+/).filter(Boolean); return ((p[0] || '')[0] + (p.length > 1 ? (p[p.length - 1] || '')[0] : '')).toUpperCase(); };
const firstName = () => (S.user.nome.trim().split(/\s+/)[0] || 'Marcelo');
/* foto única do usuário: a que ele envia no BlueHub vale também no Me Paguei */
const fotoUser = () => S.user.bhFoto || '';

/* ---------- formatadores ---------- */
const fmtBRL = (v, cents = true) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
const parseBRL = s => { const d = String(s || '').replace(/\D/g, ''); return d ? parseInt(d, 10) / 100 : 0; };
const pad2 = n => String(n).padStart(2, '0');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES3 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const ddmm = d => pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
const ddmmyyyy = d => ddmm(d) + '/' + d.getFullYear();

const MASKS = {
  cpf: v => { v = v.replace(/\D/g, '').slice(0, 11); return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); },
  cel: v => { v = v.replace(/\D/g, '').slice(0, 11); if (v.length <= 2) return v ? '(' + v : v; if (v.length <= 7) return '(' + v.slice(0, 2) + ') ' + v.slice(2); return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7); },
  data: v => { v = v.replace(/\D/g, '').slice(0, 8); return v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2'); },
  cep: v => { v = v.replace(/\D/g, '').slice(0, 8); return v.replace(/(\d{5})(\d)/, '$1-$2'); },
  brl: v => { const d = v.replace(/\D/g, '').slice(0, 11); if (!d) return ''; return fmtBRL(parseInt(d, 10) / 100); },
  brl0: v => { const d = v.replace(/\D/g, '').slice(0, 9); if (!d) return ''; return 'R$ ' + parseInt(d, 10).toLocaleString('pt-BR'); },
  diames: v => { v = v.replace(/\D/g, '').slice(0, 4); return v.replace(/(\d{2})(\d)/, '$1/$2'); },
  int: v => v.replace(/\D/g, '').slice(0, 3),
  dig: v => v.replace(/\D/g, '').slice(0, 6),
  numero: v => v.replace(/\D/g, '').slice(0, 6),
};
/* no navegador o teclado e completo: barra a letra antes de ela entrar no campo numerico */
const SO_DIGITO = /^(cpf|cel|data|cep|brl|brl0|diames|int|dig|numero)$/;
document.addEventListener('beforeinput', (e) => {
  const i = e.target; if (!i || !i.dataset || !SO_DIGITO.test(i.dataset.mask || '')) return;
  if (e.data != null && /\D/.test(e.data)) e.preventDefault();
}, true);

/* ---------- ícones (Lucide, embutidos no build) ---------- */
function ic(name, size = 24, extra = '') {
  const body = ICONS[name] || '';
  return `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ---------- peças fixas ---------- */
function statusBar(light) {
  return `<div class="sb ${light ? 'light' : ''}" data-sb><span class="t">9:41</span><span class="ico">
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .9C5.2.9 2.7 2 .8 3.8L2 5c1.6-1.5 3.7-2.4 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.9 6.9 0 0 0 8 4.3c-1.8 0-3.5.7-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c-.6 0-1.1.2-1.5.6L8 11.4l1.5-1.5c-.4-.4-.9-.6-1.5-.6Z"/></svg>
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/><path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity=".45"/></svg>
  </span></div>`;
}
const homeInd = (light) => `<div class="hi ${light ? 'light' : ''}"></div>`;
const CURVE = `<img class="curve" src="assets/curve.png" alt="" width="375" height="511">`;
const ME_MARK = `<img class="mark" src="assets/me-mark.png" alt="Me Paguei" width="58" height="26">`;

/* tela com cabeçalho em gradiente + folha clara (padrão de cadastro/login) */
function gradScreen({ title, sub = '', step = '', back = true, body = '', foot = '', mark = true }) {
  return `${CURVE}${statusBar(true)}
  <div class="bk">${back ? `<button type="button" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button>` : '<span style="width:24px"></span>'}${mark ? ME_MARK : ''}${/^\d+\/\d+$/.test(step) ? `<span class="step-dots">${Array.from({ length: +step.split('/')[1] }, (_, i) => `<i class="${i === +step.split('/')[0] - 1 ? 'on' : ''}"></i>`).join('')}</span>` : mark ? `<span class="step">${esc(step)}</span>`
    /* sem a marca, o rótulo vai centralizado (padrão das telas de Agenda no Figma) */
    : `<span class="step" style="flex:1;text-align:center;font-weight:600">${esc(step)}</span><span style="width:24px"></span>`}</div>
  <div class="ttl"><p class="h2">${title}</p>${sub ? `<p class="b14">${sub}</p>` : ''}</div>
  <div class="sheet"><div class="sheet-in">${body}</div>${foot ? `<div class="sheet-foot">${foot}</div>` : ''}</div>
  ${homeInd()}`;
}

/* cabeçalho azul sobre o gradiente (padrão de 09.xx - Configurações de Sistema).
   `head` é o conteúdo que fica no azul, antes da folha branca. */
function gradPage({ title, acts = '', head = '', body = '', foot = '', pad = true }) {
  return `${CURVE}${statusBar(true)}
  <div class="ah light"><button type="button" class="bkb" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button><p class="ttl2" style="color:#fff">${title}</p><div class="acts">${acts}</div></div>
  ${head}
  <div class="sheet" style="background:#fff"><div class="sheet-in" style="background:#fff${pad ? '' : ';padding-left:0;padding-right:0'}">${body}</div>${foot ? `<div class="sheet-foot" style="background:#fff">${foot}</div>` : ''}</div>
  ${homeInd()}`;
}

/* cabeçalho branco com voltar */
function appHeader(title, { back = true, acts = '', light = false } = {}) {
  return `<div class="ah ${light ? 'light' : ''}">${back ? `<button type="button" class="bkb" data-back aria-label="Voltar">${ic('chevron-left', 24)}</button>` : ''}<p class="ttl2">${title}</p><div class="acts">${acts}</div></div>`;
}

/* FormControl + Input */
function field({ id, label, ph = '', bind = '', mask = '', type = 'text', helper = '', icon = '', iconAct = '', value, dis = false, opt = false, mode = '', cls = '', pre = '' }) {
  const v = value !== undefined ? value : (bind ? getPath(bind) : '');
  const im = mode || (['cpf', 'cel', 'data', 'cep', 'int', 'dig'].includes(mask) ? 'numeric' : (mask.startsWith('brl') ? 'numeric' : ''));
  return `<div class="fld ${cls}">${label ? `<label class="fld-l" for="${id}">${label}${opt ? ' <span class="opt">(opcional)</span>' : ''}</label>` : ''}
  <div class="inp ${dis ? 'dis' : ''}">${pre ? `<span class="pre">${pre}</span>` : ''}<input id="${id}" type="${type}" placeholder="${esc(ph)}" value="${esc(v)}" ${bind ? `data-bind="${bind}"` : ''} ${mask ? `data-mask="${mask}"` : ''} ${im ? `inputmode="${im}"` : ''} ${dis ? 'disabled' : ''} autocomplete="off">
  ${icon ? `<button type="button" class="ib" ${iconAct ? `data-act="${iconAct}"` : 'tabindex="-1"'} aria-label="${icon}">${ic(icon, 18)}</button>` : ''}</div>
  ${helper ? `<p class="fld-h">${helper}</p>` : ''}</div>`;
}
function selectField({ id, label, bind, options, ph = 'Selecionar', helper = '' }) {
  const v = getPath(bind);
  return `<div class="fld"><label class="fld-l" for="${id}">${label}</label>
  <div class="inp"><select id="${id}" data-bind="${bind}" class="${v ? '' : 'ph'}"><option value="" ${v ? '' : 'selected'} disabled>${ph}</option>${options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select><span class="ib">${ic('chevron-down', 18)}</span></div>
  ${helper ? `<p class="fld-h">${helper}</p>` : ''}</div>`;
}
function pwField({ id, label, ph, bind }) {
  return `<div class="fld"><label class="fld-l" for="${id}">${label}</label>
  <div class="inp"><input id="${id}" type="password" placeholder="${esc(ph)}" value="${esc(getPath(bind))}" data-bind="${bind}" autocomplete="new-password"><button type="button" class="ib" data-act="toggle-pw" aria-label="Mostrar senha">${ic('eye-off', 18)}</button></div></div>`;
}
function btn(label, { v = '', act = '', go = '', cls = '', id = '', icon = '', next = false, attrs = '' } = {}) {
  const vc = v === 'o' ? 'btn-o' : v === 'l' ? 'btn-l' : v === 'd' ? 'btn-d' : v === 'do' ? 'btn-do' : v === 'w' ? 'btn-w' : '';
  return `<button type="button" class="btn ${vc} ${cls} ${next ? 'js-next' : ''}" ${id ? `id="${id}"` : ''} ${act ? `data-act="${act}"` : ''} ${go ? `data-go="${go}"` : ''} ${attrs}>${icon ? ic(icon, 18) : ''}${label}</button>`;
}
function checkbox(id, label, on) {
  return `<button type="button" class="chk ${on ? 'on' : ''}" data-act="check" data-key="${id}" role="checkbox" aria-checked="${!!on}"><span class="box">${ic('check', 12)}</span><span class="b14 c-darker">${label}</span></button>`;
}
function radio(group, value, label, on, desc) {
  if (desc !== undefined) return `<button type="button" class="radc ${on ? 'on' : ''}" data-act="radio" data-group="${group}" data-val="${esc(value)}" role="radio" aria-checked="${!!on}"><span class="rad ${on ? 'on' : ''}"><span class="o"></span><span class="lb">${label}</span></span><span class="d">${desc}</span></button>`;
  return `<button type="button" class="rad ${on ? 'on' : ''}" data-act="radio" data-group="${group}" data-val="${esc(value)}" role="radio" aria-checked="${!!on}"><span class="o"></span><span class="lb">${label}</span></button>`;
}
function toggle(key, on, rotulo = '') { return `<button type="button" class="sw ${on ? 'on' : ''}" data-act="toggle" data-key="${key}" role="switch" aria-checked="${!!on}" aria-label="${esc(rotulo || 'Ativar')}"></button>`; }
function miaCard(text, { title = 'Mia', act = '' } = {}) {
  return `<div class="mia"><div class="av"><img src="assets/mia-avatar.webp" alt=""></div><div class="col g1 f1"><p class="cap semi c-ia">${title}</p><p class="b14 c-dark">${text}</p>${act}</div></div>`;
}

/* ---------- caminho no estado ---------- */
function getPath(p) { return p.split('.').reduce((o, k) => (o == null ? o : o[k]), S) ?? ''; }
function setPath(p, v) { const ks = p.split('.'); const last = ks.pop(); const o = ks.reduce((o, k) => (o[k] ??= {}), S); o[last] = v; }

/* ---------- roteador ---------- */
const SCREENS = {};
const FLOWS = [];           // para o painel do moderador
function screen(id, def) { SCREENS[id] = def; }
function flowEntry(group, label, fn) { let g = FLOWS.find(f => f.g === group); if (!g) FLOWS.push(g = { g: group, items: [] }); g.items.push({ label, fn }); }

let stack = [];
let cur = null;
const P = () => (stack[stack.length - 1] || {}).p || {};

/* No celular o frame ocupa a tela toda, mas o navegador (barra que recolhe, área segura,
   modo standalone) pode deixar uma sobra de alguns pixels. Em vez de brigar com o viewport,
   pintamos a "mesa" atrás do frame com a cor da própria tela — a sobra fica invisível.
   No desktop o palco continua cinza, para o celular aparecer como um aparelho. */
function pintaFundo(el) {
  if (!matchMedia('(max-width:600px)').matches) return;
  let c = getComputedStyle(el).backgroundColor;
  if (!c || /rgba\(.*,\s*0\)$/.test(c)) c = '#ffffff';   // .grad usa imagem: cai no branco da folha
  document.documentElement.style.background = c;
  document.body.style.background = c;          // o body cobre a área interna; o html, a sobra
  const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', c);
}
/* insight da MIA com vários slides: os pontinhos seguem o deslize (item 22) */
document.addEventListener('scroll', (e) => {
  const el = e.target;
  if (!el || !el.classList || !el.classList.contains('mia-sl')) return;
  const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
  const dots = el.parentElement.querySelectorAll('.mia-dots i');
  dots.forEach((d, k) => d.classList.toggle('on', k === i));
}, true);
function render(dir) {
  const top = stack[stack.length - 1]; if (!top) return;
  const def = SCREENS[top.id]; if (!def) { console.warn('tela inexistente', top.id); return; }
  const vp = $('#viewport');
  const el = document.createElement('div');
  el.className = 'scr ' + (def.cls || '');
  el.dataset.id = top.id;
  el.innerHTML = def.render(top.p, top);
  const old = cur;
  vp.appendChild(el);
  if (old) {
    if (dir === 'back') { old.classList.add('leave-back'); el.classList.add('enter-back'); }
    else if (dir === 'fade') { el.classList.add('fade'); old.classList.add('leave'); old.style.animation = 'fadeOut .3s ease both'; }
    else if (dir === 'none') { old.remove(); }
    else { el.classList.add('enter'); old.classList.add('leave'); }
    if (dir !== 'none') setTimeout(() => old.remove(), 340);
  }
  cur = el;
  pintaFundo(el);
  logTela(top.id);
  salvaConta();
  clearTimers();
  closeOverlays(true);
  if (top.scroll) { const sc = el.querySelector('.scroll, .sheet-in'); if (sc) sc.scrollTop = top.scroll; }
  alvoToque(el);
  def.mount && def.mount(el, top.p, top);
  refreshValid();
}
/* alvo de toque: botão só de ícone recebe área clicável de 40px sem mudar o visual
   (o padding amplia a área, a margem negativa devolve o espaço ao layout) */
function alvoToque(el) {
  el.querySelectorAll('button:not(.bkb):not(.btn)').forEach(b => {
    if (b.children.length !== 1 || b.firstElementChild.tagName.toLowerCase() !== 'svg') return;
    if ((b.textContent || '').trim() || b.style.margin) return;
    const st = getComputedStyle(b);
    if (st.borderTopWidth !== '0px' || st.backgroundImage !== 'none') return;
    const bg = st.backgroundColor;
    if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return;
    const r = b.getBoundingClientRect();
    const dx = Math.max(0, Math.round((40 - r.width) / 2)), dy = Math.max(0, Math.round((40 - r.height) / 2));
    if (!dx && !dy) return;
    /* soma ao padding que o botão já tem e devolve a diferença em margem negativa */
    const pt = parseFloat(st.paddingTop) || 0, pl = parseFloat(st.paddingLeft) || 0;
    /* content-box: se o botão tem largura fixa, o padding cresce para fora em vez de comer o ícone */
    b.style.boxSizing = 'content-box';
    b.style.padding = (pt + dy) + 'px ' + (pl + dx) + 'px'; b.style.margin = -dy + 'px ' + -dx + 'px';
  });
}
function saveScroll() { const top = stack[stack.length - 1]; if (top && cur) { const sc = cur.querySelector('.scroll, .sheet-in'); top.scroll = sc ? sc.scrollTop : 0; } }
function go(id, p = {}, dir) { saveScroll(); stack.push({ id, p }); render(dir); }
function replace(id, p = {}, dir = 'fade') { stack.pop(); stack.push({ id, p }); render(dir); }
function back() { if (closeTopOverlay()) return; if (stack.length > 1) { stack.pop(); render('back'); } }
function backTo(id) { const i = stack.map(s => s.id).lastIndexOf(id); if (i >= 0) { stack = stack.slice(0, i + 1); render('back'); } }
function reset(id, p = {}, dir = 'fade') { stack = [{ id, p }]; render(dir); }
function rerender() { saveScroll(); render('none'); }
/* atualizar só a tela atual sem animação, preservando foco */
function refresh() { const a = document.activeElement; const aid = a && a.id; const sel = a && a.selectionStart; rerender(); if (aid) { const n = document.getElementById(aid); if (n) { n.focus(); try { n.setSelectionRange(sel, sel); } catch (e) {} } } }

/* ---------- timers por tela ---------- */
let timers = [];
function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

/* ---------- validação: habilita .js-next conforme def.valid ---------- */
function refreshValid() {
  const top = stack[stack.length - 1]; if (!top || !cur) return;
  const def = SCREENS[top.id];
  if (!def.valid) return;
  const ok = !!def.valid(top.p, cur);
  $$('.js-next', cur).forEach(b => b.disabled = !ok);
  const ovb = $$('#overlay .js-next'); if (ovb.length && def.validOv) { const o2 = !!def.validOv(top.p); ovb.forEach(b => b.disabled = !o2); }
}

/* ---------- overlays ---------- */
const overlays = [];
function openSheet(html, { cls = '', onClose, foot = '', grab = true } = {}) {
  const ov = document.createElement('div');
  ov.className = 'ov ' + cls;
  ov.innerHTML = `<div class="scrim" data-close></div><div class="bs" role="dialog" aria-modal="true">${grab ? '<div class="grab"></div>' : ''}<div class="bs-in">${html}</div>${foot ? `<div class="bs-foot">${foot}</div>` : ''}</div>`;
  $('#overlay').appendChild(ov); overlays.push({ ov, onClose });
  arrastaParaFechar(ov);
  refreshValid();
  return ov;
}
/* Arrastar o bottom sheet para baixo fecha. O arrasto pega na alça, nas bordas e no rodapé;
   dentro do conteúdo o toque continua rolando normalmente (.bs-in tem touch-action pan-y). */
function arrastaParaFechar(ov) {
  const bs = ov.querySelector('.bs'); if (!bs) return;
  const dentro = ov.querySelector('.bs-in');
  let y0 = 0, dy = 0, arr = false;
  bs.addEventListener('pointerdown', e => {
    if (dentro && dentro.contains(e.target) && dentro.scrollTop > 0) return;
    arr = true; y0 = e.clientY; dy = 0;
    /* NÃO captura o ponteiro aqui: isso roubaria o clique dos botões do rodapé.
       A captura só começa quando o dedo realmente anda (> 6px). */
  });
  bs.addEventListener('pointermove', e => {
    if (!arr) return;
    const d = e.clientY - y0;
    if (dy === 0 && Math.abs(d) < 6) return;
    if (dy === 0) { bs.style.transition = 'none'; try { bs.setPointerCapture(e.pointerId); } catch (err) {} }
    dy = Math.max(0, d);
    bs.style.transform = dy ? `translateY(${dy}px)` : '';
  });
  const fim = () => {
    if (!arr) return; arr = false;
    if (!dy) return;                       /* foi um toque, não um arrasto */
    bs.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
    if (dy > 80 || dy > bs.offsetHeight * 0.25) { bs.style.transform = 'translateY(100%)'; later(() => closeTopOverlay(), 200); }
    else bs.style.transform = '';
  };
  bs.addEventListener('pointerup', fim); bs.addEventListener('pointercancel', fim);
}
function openDialog(html, { onClose } = {}) {
  const ov = document.createElement('div');
  ov.className = 'ov center';
  ov.innerHTML = `<div class="scrim" data-close></div><div class="dlg" role="alertdialog" aria-modal="true">${html}</div>`;
  $('#overlay').appendChild(ov); overlays.push({ ov, onClose });
  return ov;
}
function closeTopOverlay() {
  const o = overlays.pop(); if (!o) return false;
  o.ov.classList.add('closing'); setTimeout(() => o.ov.remove(), 220); o.onClose && o.onClose();
  return true;
}
function closeOverlays(instant) { while (overlays.length) { const o = overlays.pop(); if (instant) o.ov.remove(); else { o.ov.classList.add('closing'); setTimeout(() => o.ov.remove(), 220); } } }
function toast(msg, type = 'success', icon) {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = (icon !== false ? ic(icon || (type === 'error' ? 'circle-alert' : 'circle-check'), 18) : '') + `<span>${msg}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------- eventos (delegação) ---------- */
const GLOBAL_ACTS = {
  closeov: () => closeTopOverlay(),      /* era definido tela a tela: faltava em várias */
  'toggle-pw': (b) => { const i = b.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eye' : 'eye-off', 18); },
  check: (b) => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); setPath(b.dataset.key, on); refreshValid(); },
  radio: (b) => { const g = b.dataset.group; $$(`[data-group="${g}"]`, b.closest('.ov') || cur).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); const r = x.querySelector('.rad'); if (r) r.classList.toggle('on', on); }); setPath(g, b.dataset.val); refreshValid(); },
  toggle: (b) => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); setPath(b.dataset.key, on); },
};
function findAct(name) {
  const top = stack[stack.length - 1]; const def = top && SCREENS[top.id];
  return (def && def.acts && def.acts[name]) || GLOBAL_ACTS[name];
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close]')) { closeTopOverlay(); return; }
  const b = t.closest('[data-back],[data-go],[data-act]');
  if (!b || b.disabled) return;
  if (b.hasAttribute('data-back')) { back(); return; }
  if (b.dataset.go) { const [id, arg] = b.dataset.go.split(':'); go(id, arg ? { arg } : {}); return; }
  const fn = findAct(b.dataset.act);
  if (fn) fn(b, e); else console.warn('ação sem handler', b.dataset.act);
});
document.addEventListener('input', e => {
  const i = e.target;
  if (i.dataset.mask && MASKS[i.dataset.mask]) {
    const before = i.value; const v = MASKS[i.dataset.mask](before);
    if (v !== before) { i.value = v; try { i.setSelectionRange(v.length, v.length); } catch (er) {} }
  }
  if (i.dataset.bind) setPath(i.dataset.bind, i.type === 'checkbox' ? i.checked : i.value);
  if (i.tagName === 'SELECT') i.classList.toggle('ph', !i.value);
  const top = stack[stack.length - 1]; const def = top && SCREENS[top.id];
  def && def.onInput && def.onInput(i, cur, top.p);
  refreshValid();
});
document.addEventListener('change', e => { const i = e.target; if (i.tagName === 'SELECT') { if (i.dataset.bind) setPath(i.dataset.bind, i.value); i.classList.toggle('ph', !i.value); const top = stack[stack.length - 1]; const def = top && SCREENS[top.id]; def && def.onInput && def.onInput(i, cur, top.p); refreshValid(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTopOverlay(); });

/* ---------- registro da sessão (substitui ferramentas externas tipo Clarity) ----------
   Grava O QUE foi tocado, não o que foi digitado: de campos guarda só o rótulo.
   Vive em sessionStorage como o resto: some quando a aba fecha. */
const KLOG = 'mp.log';
let LOG = [], T0 = Date.now(), telaT0 = Date.now(), telaAtual = '';
const rotulo = (el) => {
  const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
  return t.slice(0, 48) || '(sem rótulo)';
};
function logEv(tipo, alvo, extra) {
  LOG.push({ t: Date.now() - T0, tipo, tela: telaAtual, alvo: alvo || '', extra: extra || '' });
  if (LOG.length > 1500) LOG.shift();
  sess(ss => ss.setItem(KLOG, JSON.stringify(LOG)));
  pintaLog();
}
function logTela(id) {
  if (telaAtual) logEv('saiu', telaAtual, Math.round((Date.now() - telaT0) / 100) / 10 + 's');
  telaAtual = id; telaT0 = Date.now();
  logEv('tela', id);
}
(() => { const raw = sess(ss => ss.getItem(KLOG), null); if (raw) { try { LOG = JSON.parse(raw); T0 = Date.now() - (LOG[LOG.length - 1] || {}).t || Date.now(); } catch (e) {} } })();

/* captura: roda antes dos handlers, inclusive em cliques que não acionam nada */
document.addEventListener('click', e => {
  if (e.target.closest('#mod-sheet, #mod, #fs-btn')) return;   /* painel do moderador não conta */
  const b = e.target.closest('[data-back],[data-go],[data-act],a,button,input,select,label');
  if (!b) { logEv('clique sem efeito', rotulo(e.target.closest('div,p,span,section') || document.body)); return; }
  if (b.hasAttribute('data-back')) { logEv('voltar', rotulo(b)); return; }
  if (b.dataset && b.dataset.go) { logEv('clique', rotulo(b), '→ ' + b.dataset.go); return; }
  if (b.dataset && b.dataset.act) { logEv('clique', rotulo(b), b.dataset.act); return; }
  if (b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.tagName === 'LABEL') return;  /* tratado no change */
  logEv('clique', rotulo(b));
}, true);
/* campos: registra que foi preenchido, nunca o conteúdo */
document.addEventListener('change', e => {
  const i = e.target; if (!i.id && !i.dataset.bind) return;
  const cx = i.closest('.fc, .field, label');
  const lb = cx && cx.querySelector('label, .lb');
  const nome = ((lb && lb.textContent) || i.id || i.dataset.bind || '').replace(/\s+/g, ' ').trim();
  logEv('preencheu', nome.slice(0, 48), i.value ? 'com valor' : 'vazio');
}, true);

function resumoLog() {
  const cl = LOG.filter(l => l.tipo === 'clique').length;
  const mortos = LOG.filter(l => l.tipo === 'clique sem efeito').length;
  const voltas = LOG.filter(l => l.tipo === 'voltar').length;
  const telas = LOG.filter(l => l.tipo === 'tela');
  const tempos = {};
  LOG.filter(l => l.tipo === 'saiu').forEach(l => { tempos[l.alvo] = (tempos[l.alvo] || 0) + parseFloat(l.extra); });
  const top = Object.entries(tempos).sort((a, b) => b[1] - a[1])[0];
  return { dur: Math.round((LOG.length ? LOG[LOG.length - 1].t : 0) / 1000), telas: telas.length,
    unicas: new Set(telas.map(l => l.alvo)).size, cl, mortos, voltas,
    top: top ? `${top[0]} (${Math.round(top[1])}s)` : '—' };
}
function logCSV() {
  const esq = v => `"${String(v).replace(/"/g, '""')}"`;
  return 'tempo_s;tipo;tela;alvo;detalhe\n' +
    LOG.map(l => [(l.t / 1000).toFixed(1), l.tipo, l.tela, l.alvo, l.extra].map(esq).join(';')).join('\n');
}
function baixaLog() {
  const b = new Blob(['﻿' + logCSV()], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'sessao-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.csv';
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function pintaLog() {
  const r = resumoLog();
  const resumo = [['Duração', r.dur + 's'], ['Telas visitadas', `${r.telas} (${r.unicas} diferentes)`],
    ['Cliques', r.cl], ['Cliques sem efeito', r.mortos], ['Voltas', r.voltas], ['Mais tempo em', r.top]];
  const linhas = LOG.slice(-40).reverse().map(l =>
    `<li><b>${(l.t / 1000).toFixed(1)}s</b> <i>${esc(l.tipo)}</i> ${esc(l.alvo)}${l.extra ? ` <u>${esc(l.extra)}</u>` : ''}</li>`).join('');
  const html = `<div class="log-sum">${resumo.map(([k, v]) => `<span><b>${v}</b>${k}</span>`).join('')}</div>
    <div class="log-acts"><button type="button" data-log-csv>Baixar CSV</button><button type="button" data-log-copy>Copiar</button><button type="button" data-log-clr>Limpar</button></div>
    <ol class="log-list">${linhas || '<li>Nada registrado ainda.</li>'}</ol>`;
  $$('.log-box').forEach(el => { el.innerHTML = html; });
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-log-csv]')) { baixaLog(); return; }
  if (e.target.closest('[data-log-copy]')) { navigator.clipboard.writeText(logCSV()).then(() => toast('Registro copiado'), () => toast('Não consegui copiar', 'danger')); return; }
  if (e.target.closest('[data-log-clr]')) { LOG = []; T0 = Date.now(); sess(ss => ss.removeItem(KLOG)); pintaLog(); return; }
}, true);

/* ---------- painel do moderador ---------- */
function buildMod() {
  const html = FLOWS.map((f, gi) => `<div class="mod-grp"><p>${esc(f.g)}</p>${f.items.map((it, ii) => `<button type="button" data-mod="${gi}.${ii}">${esc(it.label)}</button>`).join('')}</div>`).join('');
  $('#mod-list').innerHTML = html; $('#mod-list-m').innerHTML = html;
  pintaLog();
}
document.addEventListener('click', e => {
  const m = e.target.closest('[data-mod]');
  if (m) { const [g, i] = m.dataset.mod.split('.').map(Number); $('#mod-sheet').hidden = true; closeOverlays(true); FLOWS[g].items[i].fn(); return; }
  if (e.target.closest('[data-mod-reset]')) { $('#mod-sheet').hidden = true; fechaConta(false); closeOverlays(true); reset('bhSplash'); return; }
  if (e.target.closest('[data-mod-close]') || e.target.id === 'mod-sheet') { $('#mod-sheet').hidden = true; }
}, true);
/* Três toques rápidos na barra de status abrem o painel — inclusive na versão publicada,
   senão o moderador não teria como ver o registro no aparelho do participante.
   O gesto é discreto o bastante (3 toques em 450ms nos 48px do topo) para ninguém cair nele. */
let tapN = 0, tapT = 0;
document.addEventListener('pointerdown', e => {
  const r = $('#phone').getBoundingClientRect();
  if (e.clientY - r.top > 48) return;
  const now = Date.now(); tapN = now - tapT < 450 ? tapN + 1 : 1; tapT = now;
  if (tapN >= 3) { tapN = 0; $('#mod-sheet').hidden = false; pintaLog(); }
});

/* ---------- escala do telefone no desktop ---------- */
function fit() {
  const w = $('#phone-wrap'); if (innerWidth <= 480) { w.style.transform = ''; return; }
  const s = Math.min(1, (innerHeight - 40) / 832);
  w.style.transform = s < 1 ? `scale(${s})` : '';
  w.style.margin = s < 1 ? `${-(812 * (1 - s)) / 2}px ${-(375 * (1 - s)) / 2}px` : '';
}
addEventListener('resize', fit);
