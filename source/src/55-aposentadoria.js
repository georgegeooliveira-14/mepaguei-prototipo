/* ============ 11 · Aposentadoria inteligente (dentro do BlueHub) ============ */

const RENT = 0.05, IM = Math.pow(1 + RENT, 1 / 12) - 1, VIDA = 90;
const fmtM = v => { const a = Math.abs(v); const s = a >= 1e6 ? 'R$ ' + (a / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' M' : 'R$ ' + Math.round(a).toLocaleString('pt-BR'); return (v < 0 ? '−' : '') + s; };
function idadeAtual() { const d = parseData(S.user.nasc); if (!d) return 30; const t = hoje(); let a = t.getFullYear() - d.getFullYear(); if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--; return a; }
function apState() { return S.apos ??= { idadeTxt: '', rendaTxt: '', fontes: [], patTxt: '', aporteTxt: '', projetos: [] }; }

/* ---------- cálculo ---------- */
function apCalc(over = {}) {
  const a = apState(); const ia = idadeAtual();
  const idade = over.idade ?? +a.idadeTxt; const renda = over.renda ?? parseBRL(a.rendaTxt); const aporte = over.aporte ?? parseBRL(a.aporteTxt);
  const comp = a.fontes.reduce((s, f) => s + f.valor, 0); const P0 = parseBRL(a.patTxt);
  const saque = Math.max(0, renda - comp);
  const nAcc = Math.max(0, (idade - ia) * 12), nRet = Math.max(1, (VIDA - idade) * 12);
  const needAt = saque * (1 - Math.pow(1 + IM, -nRet)) / IM;
  const evAt = ageY => a.projetos.filter(p => p.ano === ageY);
  const yearNow = hoje().getFullYear();
  /* simula a curva ano a ano para um aporte qualquer: serve para a curva real e para a ideal */
  const sim = (ap) => {
    let pat = P0, inv = P0; const s = [];
    for (let age = ia; age <= VIDA; age++) {
      s.push({ age, pat: Math.max(0, pat), inv: Math.max(0, inv) });
      for (let m = 0; m < 12; m++) { pat *= 1 + IM; if (age < idade) { pat += ap; inv += ap; } else pat -= saque; }
      a.projetos.forEach(p => { if (p.ano === yearNow + (age - ia) + 1) { pat += p.valor; if (p.valor > 0) inv += p.valor; } });
    }
    return s;
  };
  const serie = sim(aporte);
  const proj = serie.find(s => s.age === idade)?.pat ?? 0;
  const acaba = serie.find(s => s.age > idade && s.pat <= 0)?.age || null;
  const fv = n => (Math.pow(1 + IM, n) - 1) / IM;
  const extra = a.projetos.reduce((s, p) => { const y = p.ano - yearNow; const mLeft = Math.max(0, nAcc - y * 12); return s + p.valor * Math.pow(1 + IM, mLeft); }, 0);
  const aporteNec = nAcc ? Math.max(0, (needAt - P0 * Math.pow(1 + IM, nAcc) - extra) / fv(nAcc)) : 0;
  /* curva "Meta · necessário" (Figma 20810:2161 "Linha · ideal"): trajetória com o aporte ideal,
     que acumula até o patrimônio necessário na idade-alvo e se esgota no fim do plano */
  const ideal = sim(aporteNec);
  const rendaPossivel = comp + proj * IM / (1 - Math.pow(1 + IM, -nRet));
  let idadeOk = null; for (let x = idade; x <= 75; x++) { const r = apCalcLite(x, renda, aporte); if (r) { idadeOk = x; break; } }
  const invAt = serie.find(s => s.age === idade)?.inv ?? 0;
  return { ia, idade, renda, aporte, comp, P0, saque, needAt, proj, serie, ideal, acaba, aporteNec, rendaPossivel, idadeOk, invAt, retorno: Math.max(0, proj - invAt), fecha: proj >= needAt * 0.995, ano: yearNow + (idade - ia) };
}
function apCalcLite(idade, renda, aporte) {
  const a = apState(); const ia = idadeAtual(); const comp = a.fontes.reduce((s, f) => s + f.valor, 0); const saque = Math.max(0, renda - comp);
  const nAcc = (idade - ia) * 12, nRet = (VIDA - idade) * 12; const need = saque * (1 - Math.pow(1 + IM, -nRet)) / IM;
  const P0 = parseBRL(a.patTxt); const proj = P0 * Math.pow(1 + IM, nAcc) + aporte * (Math.pow(1 + IM, nAcc) - 1) / IM;
  return proj >= need;
}

/* ---------- moldura escura BlueHub ---------- */
function apScreen({ title, sub, dots = 0, body, foot, back = true }) {
  return `${BH_DECO}${statusBar(true)}
  <div class="row jb" style="position:relative;z-index:2;padding:8px 20px 0;height:36px"><button type="button" data-back aria-label="Voltar" style="color:#fff;${back ? '' : 'visibility:hidden'}">${ic('chevron-left', 24)}</button><p class="h2" style="color:#fff;flex:1;text-align:center">${title}</p>
    <span class="row g1" style="width:40px;justify-content:flex-end">${dots ? [1, 2, 3, 4].map(k => `<i style="display:block;height:4px;border-radius:2px;width:${k === dots ? 12 : 4}px;background:${k <= dots ? '#fff' : 'rgba(80,140,255,.8)'}"></i>`).join('') : ''}</span></div>
  <p class="b16" style="position:relative;z-index:2;padding:20px 20px 24px;color:#e4e9f5">${sub}</p>
  <div class="sheet" style="background:#fff"><div class="sheet-in" style="padding:24px 20px 16px">${body}</div>${foot ? `<div class="sheet-foot" style="background:#fff">${foot}</div>` : ''}</div>${homeInd()}`;
}
const dica = t => `<div class="col g2 center" style="align-items:center;margin-top:auto;padding-top:16px"><span class="bh-ic">${ic('info', 18)}</span><p class="b14 bold" style="color:var(--bh-ink)">Dica importante</p><p class="b14" style="color:var(--bh-muted)">${t}</p></div>`;

screen('apos1', {
  cls: 'bh-light',
  render: () => `<div style="position:absolute;inset:0;background:#fff"></div>${[260, 380].map(s => `<span class="bh-rings" style="left:${-s / 2 + 20}px;top:${-s / 2 - 20}px;width:${s}px;height:${s}px;border-color:rgba(50,121,255,.5)"></span>`).join('')}${statusBar()}
  <div class="row jb" style="position:relative;padding:8px 20px">${`<button type="button" data-back aria-label="Voltar" style="color:var(--bh-ink)">${ic('chevron-left', 24)}</button>`}${BH_LOGO_D}</div>
  <div class="col g4 px5" style="position:relative;flex:1;justify-content:flex-end;padding-bottom:20px">
    <p class="h1" style="color:var(--bh-ink)">Quanto você precisa para se aposentar?</p><p class="b16" style="color:var(--bh-muted)">4 passos simples para entender o caminho até sua independência financeira</p>
    <p class="b14 bold" style="color:var(--bh-ink)">O que você vai descobrir</p>
    ${[['chart-line', 'O potencial dos seus investimentos'], ['shield-check', 'Como construir sua Super Previdência'], ['rocket', 'Escolhas que aceleram seus objetivos']].map(([i, t]) => `<div class="row g3"><span class="bh-ic">${ic(i, 18)}</span><p class="b14" style="color:var(--bh-ink)">${t}</p></div>`).join('')}
    <p class="cap" style="color:var(--bh-muted)">Leva menos de dois minutos. Você pode simular quantas vezes quiser.</p>
    ${btn('Começar', { cls: 'lg', go: 'apos2', attrs: 'style="background:var(--bh-blue)"' })}</div>${homeInd()}`,
});
screen('apos2', {
  cls: 'bh',
  render: () => { const ia = idadeAtual(); return apScreen({ title: 'Meta de aposentadoria', dots: 1, sub: 'Defina quando você pretende se aposentar e a renda mensal necessária para manter seu estilo de vida',
    body: `<p class="b14" style="background:var(--bg-lighter);border-radius:var(--r-xl);padding:10px 14px;color:var(--bh-muted)">Idade atual: <b style="color:var(--bh-ink)">${ia} anos</b></p>
      ${field({ id: 'ai', label: 'Idade de aposentadoria', ph: 'ex: 65', bind: 'apos.idadeTxt', mask: 'int' })}<p class="fld-h err" id="aerr" hidden>Escolha uma idade entre ${ia + 1} e 80 anos.</p>
      ${field({ id: 'ar', label: 'Renda mensal desejada', ph: 'R$ 0,00', bind: 'apos.rendaTxt', mask: 'brl', helper: 'Considere o poder de compra de hoje' })}
      ${dica('Adiar a aposentadoria em poucos anos costuma reduzir o aporte mensal necessário.')}`,
    foot: btn('Próximo', { cls: 'lg', next: true, go: 'apos3', attrs: 'style="background:var(--bh-blue)"' }) }); },
  mount: () => { apState(); },
  onInput: (i, el) => { if (i.id === 'ai') { const v = +i.value; $('#aerr', el).hidden = !i.value || i.value.length < 2 || (v > idadeAtual() && v <= 80); } },
  valid: () => { const a = apState(); const v = +a.idadeTxt; return v > idadeAtual() && v <= 80 && parseBRL(a.rendaTxt) > 0; },
});
screen('apos3', {
  cls: 'bh',
  render: () => { const a = apState();
    return apScreen({ title: 'Rendas complementares', dots: 2, sub: 'Receitas como INSS, pensões ou aluguéis ajudam a compor sua renda na aposentadoria e reduzem o valor que você precisa investir hoje',
      body: a.fontes.length ? `<p class="b14" style="color:var(--bh-muted)">Receitas extras que você espera receber no momento da aposentadoria diminuem o valor necessário para alcançar o seu objetivo.</p><p class="b16 bold" style="color:var(--bh-ink)">Rendas cadastradas</p>
        ${a.fontes.map((f, k) => `<button type="button" class="bh-card row g3" data-act="fEd" data-k="${k}" style="flex-direction:row;align-items:center"><span class="bh-ic">${ic('house', 18)}</span><span class="f1 col"><span class="b16 semi" style="color:var(--bh-ink)">${esc(f.nome)}</span><span class="b14" style="color:var(--bh-muted)">${fmtR(f.valor)} por mês</span></span>${ic('pencil', 16)}</button>`).join('')}
        ${btn(ic('plus', 14) + ' Adicionar outra fonte', { v: 'o', cls: 'btn-xs auto', act: 'fAdd', attrs: 'style="align-self:flex-start;padding:0 14px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}`
        : `<div class="col g3 center" style="align-items:center;padding:20px 0"><span class="bh-ic" style="width:52px;height:52px">${ic('hand-coins', 24)}</span><p class="b16 bold" style="color:var(--bh-ink)">Espera receber alguma renda complementar na aposentadoria?</p><p class="b14" style="color:var(--bh-muted)">Considere aluguéis, pensão, INSS, dentre outros</p>${btn(ic('plus', 16) + ' Adicionar fonte de renda', { v: 'o', act: 'fAdd', cls: 'auto', attrs: 'style="padding:0 18px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}</div>`,
      foot: btn(a.fontes.length ? 'Próximo' : 'Pular', { cls: 'lg', go: 'apos4', attrs: 'style="background:var(--bh-blue)"' }) }); },
  acts: {
    fAdd: () => fonteSheet(),
    fEd: (b) => fonteSheet(+b.dataset.k),
  },
});
function fonteSheet(k) {
  const f = k != null ? apState().fontes[k] : null; S.tmpF = { nome: f ? f.nome : '', valorTxt: f ? fmtBRL(f.valor) : '' };
  sheetForm(`<p class="h4" style="color:var(--bh-ink)">${f ? 'Editar renda' : 'Outras fontes de renda'}</p><p class="b14" style="color:var(--bh-muted)">${f ? 'Ajuste os parâmetros desta receita para recalcular sua projeção.' : 'Cadastre receitas como INSS, aluguéis ou pensões que você espera receber na aposentadoria'}</p>
    ${field({ id: 'fo', label: 'Origem', ph: 'ex: INSS, aluguel, pensão', bind: 'tmpF.nome' })}${field({ id: 'fv', label: 'Valor mensal', ph: 'R$ 0,00', bind: 'tmpF.valorTxt', mask: 'brl', helper: 'em valores de hoje.' })}`,
    btn(f ? 'Salvar' : 'Adicionar', { act: 'fSave', cls: 'js-next', attrs: 'style="background:var(--bh-blue)"' }) + (f ? btn('Remover esta fonte', { v: 'do', act: 'fDel' }) : btn('Cancelar', { v: 'o', act: 'dlgClose' })),
    () => S.tmpF.nome.trim() && parseBRL(S.tmpF.valorTxt) > 0);
  S.flags.fK = k;
}
Object.assign(GLOBAL_ACTS, {
  fSave: () => { const v = { nome: S.tmpF.nome.trim(), valor: parseBRL(S.tmpF.valorTxt) }; const a = apState(); if (S.flags.fK != null) a.fontes[S.flags.fK] = v; else a.fontes.push(v); closeOverlays(true); rerender(); },
  fDel: () => { apState().fontes.splice(S.flags.fK, 1); closeOverlays(true); rerender(); },
});
screen('apos4', {
  cls: 'bh',
  render: () => apScreen({ title: 'Patrimônio inicial', dots: 3, sub: 'Informe o que você já acumulou e veja a evolução do seu patrimônio ao longo do tempo',
    body: `${field({ id: 'ap', label: 'Você já possui investimentos?', ph: 'R$ 0,00', bind: 'apos.patTxt', mask: 'brl', helper: 'Informe os valores aplicados em bancos, corretoras ou outras instituições financeiras. Não inclua casa, carro ou terrenos.' })}
      ${field({ id: 'aa', label: 'Quanto consegue investir por mês?', ph: 'R$ 0,00', bind: 'apos.aporteTxt', mask: 'brl', helper: 'Usamos esse valor como ponto de partida. Na simulação mostramos se ele é suficiente.' })}
      <p class="cap" style="color:var(--bh-muted)">Caso não tenha investimentos, basta seguir para o próximo passo.</p>`,
    foot: btn('Próximo', { cls: 'lg', go: 'apos5', attrs: 'style="background:var(--bh-blue)"' }) }),
});
screen('apos5', {
  cls: 'bh',
  render: () => { const a = apState();
    return apScreen({ title: 'Projetos futuros', dots: 4, sub: 'Eventos previstos que impactarão sua curva de acúmulo de patrimônio.',
      body: a.projetos.length ? `<p class="b16 bold" style="color:var(--bh-ink)">Seus projetos cadastrados</p>${a.projetos.map((p, k) => `<div class="bh-card row g3" style="flex-direction:row;align-items:center"><span class="bh-ic" style="${p.valor > 0 ? 'background:var(--success-bg);color:var(--success)' : ''}">${ic(p.valor > 0 ? 'arrow-down-to-line' : { Viagem: 'plane', Veículo: 'car', Casa: 'house', Educação: 'graduation-cap', Saúde: 'heart-pulse' }[p.cat] || 'target', 18)}</span><div class="f1"><p class="b16 semi" style="color:var(--bh-ink)">${esc(p.nome)}</p><p class="b14" style="color:var(--bh-muted)">${p.data}</p></div><p class="b14 bold" style="color:${p.valor > 0 ? 'var(--success)' : 'var(--danger)'}">${p.valor > 0 ? '+' : '-'}${fmtR(Math.abs(p.valor))}</p><button type="button" data-act="pDel" data-k="${k}" aria-label="Remover" style="color:var(--bh-muted)">${ic('x', 16)}</button></div>`).join('')}
        ${btn(ic('plus', 14) + ' Adicionar projeto', { v: 'o', cls: 'btn-xs auto', act: 'pAdd', attrs: 'style="align-self:flex-start;padding:0 14px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}`
        : `<div class="col g3 center" style="align-items:center;padding:20px 0"><span class="bh-ic" style="width:52px;height:52px">${ic('target', 24)}</span><p class="b16 bold" style="color:var(--bh-ink)">Nenhum projeto cadastrado</p><p class="b14" style="color:var(--bh-muted)">Sua simulação considera o cenário base de acúmulo e aposentadoria. Inclua eventos planejados, como aquisição de ativos, viagens ou aportes pontuais para visualizar o impacto na sua curva de patrimônio.</p>${btn(ic('plus', 16) + ' Adicionar projeto', { v: 'o', act: 'pAdd', cls: 'auto', attrs: 'style="padding:0 18px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}</div>`,
      foot: btn('Gerar minha projeção', { cls: 'lg', act: 'gerar', attrs: 'style="background:var(--bh-blue)"' }) }); },
  acts: {
    pAdd: () => projetoSheet(),
    pDel: (b) => { apState().projetos.splice(+b.dataset.k, 1); rerender(); },
    gerar: () => go('bhProc', { msg: 'Analisando suas informações...', next: 'aposRes' }),
  },
});
function projetoSheet() {
  S.tmpP = { tipo: 'saida', cat: '', nome: '', data: '', valorTxt: '' };
  const draw = () => { const t = S.tmpP; closeOverlays(true);
    sheetForm(`<p class="h4" style="color:var(--bh-ink)">Novo projeto</p><p class="b14" style="color:var(--bh-muted)">Uma despesa tira dinheiro do patrimônio numa data. Um aporte coloca dinheiro nele.</p>
      <div class="seg">${[['saida', 'Saída de capital'], ['entrada', 'Entrada de capital']].map(([k, l]) => `<button type="button" class="${t.tipo === k ? 'on' : ''}" data-act="pTipo" data-k="${k}">${l}</button>`).join('')}</div>
      ${t.tipo === 'saida' ? `<div class="col g2"><p class="fld-l">Categoria</p><div class="row g2" style="flex-wrap:wrap">${['Viagem', 'Veículo', 'Casa', 'Educação', 'Saúde', 'Outro'].map(c => `<button type="button" class="chip" data-act="pCat" data-c="${c}" style="${t.cat === c ? 'background:var(--bh-blue);border-color:var(--bh-blue);color:#fff' : ''}">${c}</button>`).join('')}</div></div>` : ''}
      ${field({ id: 'pn', label: t.tipo === 'saida' ? 'Nome do projeto' : 'De onde vem esse dinheiro', ph: t.tipo === 'saida' ? 'Ex: entrada da casa' : 'Ex: venda de um imóvel', bind: 'tmpP.nome' })}
      ${field({ id: 'pd', label: t.tipo === 'saida' ? 'Data de execução' : 'Quando você espera receber', ph: 'dd/mm/aaaa', bind: 'tmpP.data', mask: 'data' })}
      ${field({ id: 'pv', label: 'Valor total', ph: 'R$ 0,00', bind: 'tmpP.valorTxt', mask: 'brl' })}`,
      btn('Adicionar', { act: 'pSave', cls: 'js-next', attrs: 'style="background:var(--bh-blue)"' }) + btn('Cancelar', { v: 'o', act: 'dlgClose' }),
      () => { const d = parseData(S.tmpP.data); return S.tmpP.nome.trim() && d && d > hoje() && parseBRL(S.tmpP.valorTxt) > 0 && (S.tmpP.tipo === 'entrada' || S.tmpP.cat); }); };
  S.flags.pDraw = draw; draw();
}
Object.assign(GLOBAL_ACTS, {
  pTipo: (b) => { S.tmpP.tipo = b.dataset.k; S.flags.pDraw(); },
  pCat: (b) => { S.tmpP.cat = b.dataset.c; S.flags.pDraw(); },
  pSave: () => { const t = S.tmpP; const v = parseBRL(t.valorTxt); apState().projetos.push({ nome: t.nome.trim(), cat: t.cat, data: t.data, ano: parseData(t.data).getFullYear(), valor: t.tipo === 'saida' ? -v : v }); closeOverlays(true); rerender(); },
});

/* ---------- resultado ---------- */
/* ---------- Gráfico patrimônio · vistas (Figma: component set 20810:2270, tela 11.13) ----------
   Geral = plano inteiro · Até os N = fase de acúmulo · Depois dos N = fase de uso. */
const AP_COR = { meta: '#e77828', invL: '#8fa8fb', invF: 'rgba(143,168,251,.55)', patL: '#348352', patF: 'rgba(102,181,132,.5)' };

function apTicks(r, vista, a0, a1) {
  const t = [];
  if (vista === 'ate') { t.push(a0); for (let x = Math.ceil((a0 + 1) / 10) * 10; x < a1; x += 10) t.push(x); t.push(a1); }
  else if (vista === 'depois') { for (let x = a0; x <= a1; x += 5) t.push(x); if (t[t.length - 1] !== a1) t.push(a1); }
  else {
    const q = f => Math.round((a0 + (r.idade - a0) * f) / 5) * 5;
    t.push(a0, q(1 / 3), q(2 / 3), r.idade, Math.floor(((r.idade + a1) / 2) / 5) * 5, a1);
  }
  return [...new Set(t)].filter(x => x >= a0 && x <= a1).sort((x, y) => x - y);
}

function apChart(r, vista) {
  const W = 309, H = 214, X0 = 6, X1 = 303, YT = 12, YB = 188;
  const a0 = vista === 'depois' ? r.idade : r.ia, a1 = vista === 'ate' ? r.idade : VIDA;
  const max = Math.max(r.needAt, ...r.serie.map(s => s.pat), ...r.ideal.map(s => s.pat)) || 1;
  const X = age => X0 + (age - a0) / ((a1 - a0) || 1) * (X1 - X0), Y = v => YB - (v / max) * (YB - YT);
  const vis = s => s.age >= a0 && s.age <= a1;
  const line = (arr, f) => arr.filter(vis).map((s, i) => `${i ? 'L' : 'M'}${X(s.age).toFixed(1)} ${Y(f(s)).toFixed(1)}`).join(' ');
  const area = (arr, f) => `${line(arr, f)} L${X(a1).toFixed(1)} ${YB} L${X(a0).toFixed(1)} ${YB} Z`;
  /* na fase de uso o investido não pode passar do que ainda resta: a faixa azul cai junto com a verde */
  const vPat = s => s.pat, vInv = s => Math.min(s.inv, s.pat);
  const gx = X(r.idade).toFixed(1);
  const pI = r.ideal.find(s => s.age === r.idade), pP = r.serie.find(s => s.age === r.idade);
  const lab = vista === 'ate' ? `acúmulo dos ${a0} aos ${a1} anos` : vista === 'depois' ? `uso dos ${a0} aos ${a1} anos` : `plano dos ${a0} aos ${a1} anos`;
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Patrimônio por idade — ${lab}">
    ${[0, 1, 2, 3].map(i => { const y = (YT + i * (YB - YT) / 3).toFixed(1); return `<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="#e2e5ec" stroke-dasharray="2 3"/>`; }).join('')}
    <line x1="${gx}" x2="${gx}" y1="${YT}" y2="${YB}" stroke="#c7cdd9" stroke-dasharray="2 3"/>
    <path d="${area(r.serie, vPat)}" fill="${AP_COR.patF}"/>
    <path d="${area(r.serie, vInv)}" fill="${AP_COR.invF}"/>
    <path d="${line(r.serie, vPat)}" fill="none" stroke="${AP_COR.patL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${line(r.serie, vInv)}" fill="none" stroke="${AP_COR.invL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${line(r.ideal, vPat)}" fill="none" stroke="${AP_COR.meta}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pI ? `<circle cx="${gx}" cy="${Y(pI.pat).toFixed(1)}" r="4.5" fill="${AP_COR.meta}" stroke="#fff" stroke-width="2"/>` : ''}
    ${pP ? `<circle cx="${gx}" cy="${Y(pP.pat).toFixed(1)}" r="4.5" fill="${AP_COR.patL}" stroke="#fff" stroke-width="2"/>` : ''}
    ${apTicks(r, vista, a0, a1).map(t => `<text x="${X(t).toFixed(1)}" y="${YB + 19}" text-anchor="${t === a0 ? 'start' : t === a1 ? 'end' : 'middle'}" font-size="10" fill="${t === r.idade ? '#363d4a' : '#6e7789'}" font-weight="${t === r.idade ? 600 : 400}">${t}</text>`).join('')}
  </svg>`;
}

/* chips que trocam a vista (Figma "Seletor de vista" 20810:2139) */
function apChips(r, vista) {
  return `<div class="row g1" style="background:#eff1f5;border-radius:9999px;padding:4px">${[['geral', 'Geral'], ['ate', `Até os ${r.idade}`], ['depois', `Depois dos ${r.idade}`]].map(([k, t]) =>
    `<button type="button" data-act="vista" data-v="${k}" aria-pressed="${k === vista}" style="flex:1;min-width:0;padding:8px 10px;border-radius:9999px;font-size:12px;font-weight:600;line-height:20px;text-align:center;white-space:nowrap;${k === vista ? 'background:#2350f5;color:#fff' : 'color:#363d4a'}">${t}</button>`).join('')}</div>`;
}

function apManchete(r, vista) {
  const pct = r.needAt ? Math.min(100, Math.round(r.proj / r.needAt * 100)) : 100;
  const pRend = r.proj ? Math.round(r.retorno / r.proj * 100) : 0;
  const m = vista === 'ate' ? [`VOCÊ ACUMULA ATÉ OS ${r.idade}`, fmtR(r.proj), `${pRend}% vêm do rendimento, não do seu bolso.`]
    : vista === 'depois' ? ['SUA RENDA DURA ATÉ', `${r.acaba || VIDA} anos`, r.acaba ? `${VIDA - r.acaba} anos a menos que os ${VIDA} do plano.` : `Sua renda dura todo o plano, até os ${VIDA}.`]
      : ['VOCÊ ALCANÇA', `${pct}% da meta`, `Investindo ${fmtR(r.aporteNec)}/mês, você fecha o plano.`];
  return `<div class="col" style="gap:4px;padding-top:16px">
    <p style="font-size:11px;font-weight:600;line-height:15px;letter-spacing:.66px;color:#6e7789">${m[0]}</p>
    <p style="font-size:28px;font-weight:700;line-height:38px;color:#030c23">${m[1]}</p>
    <p style="font-size:13px;line-height:17px;color:#363d4a">${m[2]}</p></div>`;
}

function apLegenda(r, vista) {
  const swL = `<i style="display:block;width:22px;height:3px;border-radius:9999px;background:${AP_COR.meta};flex:none"></i>`;
  const swA = (f, b) => `<i style="display:block;width:22px;height:12px;border-radius:3px;background:${f};border:1.5px solid ${b};flex:none"></i>`;
  const row = (sw, lab, val, { semi = false, cor = '#030c23' } = {}) =>
    `<div class="row jb" style="align-items:center;gap:8px;padding:8px 0">
       <span class="row g2" style="align-items:center;min-width:0">${sw}<span style="font-size:13px;line-height:18px;color:#363d4a${semi ? ';font-weight:600' : ''}">${lab}</span></span>
       <span style="font-size:14px;font-weight:600;line-height:20px;color:${cor};white-space:nowrap;flex:none">${val}</span></div>`;
  const pInv = r.proj ? Math.round(r.invAt / r.proj * 100) : 0;
  const body = vista === 'ate' ? row(swA(AP_COR.invF, AP_COR.invL), 'Total investido por você', `${fmtR(r.invAt)} · ${pInv}%`) + row(swA(AP_COR.patF, AP_COR.patL), 'Retorno dos investimentos', `${fmtR(r.retorno)} · ${100 - pInv}%`)
    : vista === 'depois' ? row('', 'Renda mensal', `${fmtR(r.rendaPossivel)}/mês`) + row(swL, 'Com o aporte ideal, duraria até', `${VIDA} anos`, { semi: true, cor: AP_COR.meta })
      : row(swL, 'Meta · necessário', fmtR(r.needAt), { semi: true, cor: AP_COR.meta }) + row(swA(AP_COR.invF, AP_COR.invL), 'Total investido por você', fmtR(r.invAt)) + row(swA(AP_COR.patF, AP_COR.patL), 'Patrimônio projetado', fmtR(r.proj));
  return `<div class="col" style="padding-top:16px">${body}</div>`;
}
screen('aposRes', {
  cls: 'bh',
  render: (p) => { const r = apCalc(); const gap = r.needAt - r.proj; const vista = p.vista || 'geral';
    const alt = (t, act) => `<button type="button" class="row g3 ais" data-act="${act}" style="text-align:left;padding:8px 0"><span style="color:${r.fecha ? 'var(--success)' : 'var(--warning)'}">${ic('circle-arrow-right', 20)}</span><span class="b14 semi" style="color:var(--bh-ink)">${t}</span></button>`;
    const status = r.fecha ? `<div class="card col g2" style="background:var(--success-bg);border-color:#bfe5cc"><p class="h4" style="color:var(--bh-ink)">Encontramos um caminho!</p><p class="b14" style="color:var(--bh-ink)">Ao investir <b>${fmtR(r.aporte)}</b> por mês você alcança a renda desejada a partir da idade alvo.${r.aporteNec < r.aporte * 0.98 ? ` Na verdade, ${fmtR(r.aporteNec)} por mês já seriam suficientes.` : ''}</p><p class="b14" style="color:var(--bh-ink)">Agora você pode conhecer a SuperPrevidência, uma curadoria de soluções para colocar seu plano em prática:</p>${btn('Ir para SuperPrevidência', { act: 'superp', attrs: 'style="background:var(--success)"' })}</div>`
      : `<div class="card col g2" style="border-color:${r.acaba && r.acaba >= r.idade + 8 ? '#f6c59f' : '#f2b4b4'}"><div class="row jb"><p class="h4" style="color:var(--bh-ink)">Ajuste necessário</p>${r.acaba && r.acaba >= r.idade + 8 ? '<span class="badge warning">Atenção</span>' : ''}</div>
          <p class="b14" style="color:var(--bh-muted)">${r.acaba && r.acaba >= r.idade + 8 ? `Com as premissas atuais, há recursos para a aposentadoria, mas a reserva financeira se esgota aos <b>${r.acaba} anos</b>.` : `Mantendo aportes de <b>${fmtBRL(r.aporte)}/mês</b>, há uma diferença de <b>${fmtM(gap)}</b> para atingir o valor ideal aos <b>${r.idade} anos</b>.`}</p>
          <p class="b16 bold" style="color:var(--bh-ink);margin-top:6px">Veja como resolver</p><p class="b14" style="color:var(--bh-muted)">Toque em uma alternativa para simular com ela na hora.</p>
          ${alt(`Aumentar o aporte mensal para ${fmtBRL(Math.ceil(r.aporteNec / 10) * 10)}/mês`, 'altA')}
          ${alt(`Ajustar a renda desejada para ${fmtBRL(Math.floor(r.rendaPossivel / 100) * 100)}/mês`, 'altR')}
          ${r.idadeOk ? alt(`Aposentar aos ${r.idadeOk} anos`, 'altI') : ''}
          ${alt('Combinar alternativas (aplique mudanças no aporte, renda desejada ou idade de aposentadoria, ao mesmo tempo)', 'edit')}</div>`;
    return apScreen({ title: 'Aposentadoria Inteligente', sub: 'Veja como seu patrimônio pode evoluir ao longo da vida e durante a aposentadoria',
      body: `<div class="bh-card"><p class="h3" style="color:var(--bh-ink)">Seu dinheiro no tempo</p><p class="b14" style="color:#6e7789">Quanto você acumula, quanto rende e até quando dura.</p>
          <div style="padding-top:16px">${apChips(r, vista)}</div>${apManchete(r, vista)}
          <div style="padding-top:16px">${apChart(r, vista)}</div>${apLegenda(r, vista)}
          <div style="height:1px;background:#f1f5f9;margin-top:16px"></div>
          <div class="row jb" style="align-items:center;margin-top:16px;border:1px solid #e2e5ec;border-radius:12px;padding:16px"><span class="b14 semi" style="color:var(--bh-ink)">Aporte necessário</span><span class="h3" style="color:var(--bh-ink)">${fmtR(r.aporteNec)}/mês</span></div>
          <p style="padding-top:16px;font-size:11px;line-height:17px;color:#6e7789">Simulação considerando rentabilidade líquida de 5% ao ano acima da inflação (IPCA)</p></div>
        ${status}
        <div class="bh-card"><button type="button" class="row g3" data-act="tgInfo" aria-expanded="${!!p.info}"><span class="bh-ic">${ic('user', 18)}</span><span class="f1 b16 semi" style="color:var(--bh-ink);text-align:left">Informações consideradas para este cálculo</span>${ic(p.info ? 'chevron-up' : 'chevron-down', 18)}</button>
          ${p.info ? `<div class="col g3" style="background:var(--bg-lighter);border-radius:8px;padding:16px">${[['Idade de aposentadoria', r.idade + ' anos'], ['Renda desejada', fmtR(r.renda) + '/mês'], ['Outras fontes de renda', fmtR(r.comp) + '/mês'], ['Investimento atual', fmtR(r.P0)]].map(([a, v]) => `<div class="row jb"><span class="b14" style="color:#737373">${a}</span><span class="b14 semi" style="color:#404040">${v}</span></div>`).join('')}</div>` : ''}</div>
        <p class="cap center" style="color:#6e7789">As simulações são estimativas e não representam garantia de rentabilidade.</p>`,
      foot: r.fecha ? btn('Ir para SuperPrevidência', { cls: 'lg', act: 'superp', attrs: 'style="background:var(--bh-blue)"' }) + btn('Editar e simular novamente', { v: 'o', act: 'edit', attrs: 'style="color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })
        : btn('Ajustar e simular novamente', { cls: 'lg', act: 'edit', attrs: 'style="background:var(--bh-blue)"' }) + btn('Salvar assim mesmo', { v: 'o', act: 'save', attrs: 'style="color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' }) }); },
  acts: {
    tgInfo: () => { const p = stack[stack.length - 1].p; p.info = !p.info; rerender(); },
    vista: (el) => { const p = stack[stack.length - 1].p; p.vista = el.dataset.v; rerender(); },
    edit: () => backTo('apos2'),
    altA: () => { const r = apCalc(); apState().aporteTxt = fmtBRL(Math.ceil(r.aporteNec / 10) * 10); rerender(); toast('Simulamos com o novo aporte'); },
    altR: () => { const r = apCalc(); apState().rendaTxt = fmtBRL(Math.floor(r.rendaPossivel / 100) * 100); rerender(); toast('Simulamos com a nova renda'); },
    altI: () => { const r = apCalc(); apState().idadeTxt = String(r.idadeOk); rerender(); toast(`Simulamos a aposentadoria aos ${r.idadeOk} anos`); },
    superp: () => toast('A SuperPrevidência abre fora do protótipo', 'success', 'external-link'),
    save: () => { reset('bhHome', {}, 'back'); toast('Simulação salva'); },
  },
});
flowEntry('BlueHub', 'Aposentadoria inteligente', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; S.apos = null; reset('bhHome'); go('apos1'); });
flowEntry('BlueHub', 'Aposentadoria · resultado de exemplo', () => { if (!S.user.nome) S.user.nome = 'Marcelo Pimentel'; /* premissas do exemplo iguais às da tela 11.13 do Figma (idade 65 · renda 14.300 · outras fontes 2.000 · investimento atual 88.000) */
S.apos = { idadeTxt: '65', rendaTxt: 'R$ 14.300,00', fontes: [{ nome: 'Aluguel de imóvel', valor: 2000 }], patTxt: 'R$ 88.000,00', aporteTxt: 'R$ 1.000,00', projetos: [] }; reset('bhHome'); go('apos2'); go('aposRes'); });
