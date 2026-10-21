/* ============ 11 · Aposentadoria inteligente (dentro do BlueHub) ============ */

const RENT = 0.05, IM = Math.pow(1 + RENT, 1 / 12) - 1, VIDA = 90;
/* Variante do teste: ?sem-aporte esconde o campo de aporte mensal. É o modelo descrito
   pelo cliente — a pessoa não informa quanto investe, e o resultado da simulação é
   justamente o aporte necessário. Mesma build serve as duas versões. */
const SEM_APORTE = /[?&]sem-aporte(\b|=)/.test(location.search);
const fmtM = v => { const a = Math.abs(v); const s = a >= 1e6 ? 'R$ ' + (a / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' M' : 'R$ ' + Math.round(a).toLocaleString('pt-BR'); return (v < 0 ? '−' : '') + s; };
/* idade derivada da data de nascimento do cadastro, quando houver */
function idadeDaData() { const d = parseData(S.user.nasc); if (!d) return null; const t = hoje(); let a = t.getFullYear() - d.getFullYear(); if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--; return a; }
/* a idade informada na tela manda; a data de nascimento é só o valor inicial do campo */
function idadeAtual() { const v = +(S.apos || {}).iaTxt; if (v >= 18 && v <= 90) return v; return idadeDaData() ?? 30; }
function apState() { return S.apos ??= { iaTxt: idadeDaData() != null ? String(idadeDaData()) : '', idadeTxt: '', rendaTxt: '', fontes: [], patTxt: '', aporteTxt: '' }; }

/* ---------- cálculo ---------- */
function apCalc(over = {}) {
  const a = apState(); const ia = idadeAtual();
  const idade = over.idade ?? +a.idadeTxt; const renda = over.renda ?? parseBRL(a.rendaTxt); const aporte = over.aporte ?? parseBRL(a.aporteTxt);
  const comp = a.fontes.reduce((s, f) => s + f.valor, 0); const P0 = parseBRL(a.patTxt);
  const saque = Math.max(0, renda - comp);
  const nAcc = Math.max(0, (idade - ia) * 12), nRet = Math.max(1, (VIDA - idade) * 12);
  const needAt = saque * (1 - Math.pow(1 + IM, -nRet)) / IM;
  const yearNow = hoje().getFullYear();
  /* simula a curva ano a ano para um aporte qualquer: serve para a curva real e para a ideal */
  const sim = (ap, sq = saque) => {
    let pat = P0, inv = P0; const s = [];
    for (let age = ia; age <= VIDA; age++) {
      s.push({ age, pat: Math.max(0, pat), inv: Math.max(0, inv) });
      for (let m = 0; m < 12; m++) { pat *= 1 + IM; if (age < idade) { pat += ap; inv += ap; } else pat -= sq; }
    }
    return s;
  };
  const serie = sim(aporte);
  const proj = serie.find(s => s.age === idade)?.pat ?? 0;
  const acaba = serie.find(s => s.age > idade && s.pat <= 0)?.age || null;
  const fv = n => (Math.pow(1 + IM, n) - 1) / IM;
  const aporteNec = nAcc ? Math.max(0, (needAt - P0 * Math.pow(1 + IM, nAcc)) / fv(nAcc)) : 0;
  /* curva "Meta · necessário" (Figma 20810:2161 "Linha · ideal"): trajetória com o aporte ideal,
     que acumula até o patrimônio necessário na idade-alvo e se esgota no fim do plano */
  const ideal = sim(aporteNec);
  const rendaPossivel = comp + proj * IM / (1 - Math.pow(1 + IM, -nRet));
  let idadeOk = null; for (let x = idade; x <= 75; x++) { const r = apCalcLite(x, renda, aporte); if (r) { idadeOk = x; break; } }
  const invAt = serie.find(s => s.age === idade)?.inv ?? 0;
  /* composição do plano que funciona (usada quando não há aporte informado):
     quanto sairia do bolso com o aporte necessário e quanto viria de rendimento */
  const idealInv = P0 + aporteNec * nAcc;
  /* até que idade a renda dura com um aporte qualquer — serve para a sensibilidade */
  const duraCom = (ap) => sim(ap).find(s => s.age > idade && s.pat <= 0)?.age ?? VIDA;
  return { ia, idade, renda, aporte, comp, P0, saque, needAt, proj, serie, ideal, acaba, aporteNec, rendaPossivel, idadeOk, invAt, retorno: Math.max(0, proj - invAt), idealInv, idealRet: Math.max(0, needAt - idealInv), duraCom, fecha: proj >= needAt * 0.995, ano: yearNow + (idade - ia) };
}
function apCalcLite(idade, renda, aporte) {
  const a = apState(); const ia = idadeAtual(); const comp = a.fontes.reduce((s, f) => s + f.valor, 0); const saque = Math.max(0, renda - comp);
  const nAcc = (idade - ia) * 12, nRet = (VIDA - idade) * 12; const need = saque * (1 - Math.pow(1 + IM, -nRet)) / IM;
  const P0 = parseBRL(a.patTxt); const proj = P0 * Math.pow(1 + IM, nAcc) + aporte * (Math.pow(1 + IM, nAcc) - 1) / IM;
  return proj >= need;
}

/* ---------- moldura escura BlueHub ---------- */
/* `subRola` põe o subtítulo dentro da área de rolagem: a página rola até encostar
   no cabeçalho, em vez de rolar só a folha branca (usado na tela do gráfico). */
function apScreen({ title, sub, dots = 0, body, foot, back = true, subRola = false }) {
  const topo = `${BH_DECO}${statusBar(true)}
  <div class="row jb" style="position:relative;z-index:2;padding:8px 20px 0;height:36px"><button type="button" data-back aria-label="Voltar" style="color:#fff;${back ? '' : 'visibility:hidden'}">${ic('chevron-left', 24)}</button><p class="h2" style="color:#fff;flex:1;text-align:center">${title}</p>
    <span class="row g1" style="width:40px;justify-content:flex-end">${dots ? [1, 2, 3].map(k =>`<i style="display:block;height:4px;border-radius:2px;width:${k === dots ? 12 : 4}px;background:${k <= dots ? '#fff' : 'rgba(80,140,255,.8)'}"></i>`).join('') : ''}</span></div>`;
  const rodape = foot ? `<div class="sheet-foot" style="background:#fff">${foot}</div>` : '';
  if (subRola) return `${topo}
  <div class="sheet" style="background:transparent;border-radius:0">
    <div class="sheet-in" style="padding:0;gap:0">
      <p class="b16" style="flex:none;padding:20px 20px 24px;color:#e4e9f5">${sub}</p>
      <div class="col g6" style="flex:1 0 auto;background:#fff;border-radius:32px 32px 0 0;padding:24px 20px 16px">${body}</div>
    </div>${rodape}</div>${homeInd()}`;
  return `${topo}
  <p class="b16" style="position:relative;z-index:2;padding:20px 20px 24px;color:#e4e9f5">${sub}</p>
  <div class="sheet" style="background:#fff"><div class="sheet-in" style="padding:24px 20px 16px">${body}</div>${rodape}</div>${homeInd()}`;
}
const dica = t => `<div class="col g2 center" style="align-items:center;margin-top:auto;padding-top:16px"><span class="bh-ic">${ic('info', 18)}</span><p class="b14 bold" style="color:var(--bh-ink)">Dica importante</p><p class="b14" style="color:var(--bh-muted)">${t}</p></div>`;

screen('apos1', {
  cls: 'bh-light',
  render: () => `<div style="position:absolute;inset:0;background:#fff"></div>${[260, 380].map(s => `<span class="bh-rings" style="left:${-s / 2 + 20}px;top:${-s / 2 - 20}px;width:${s}px;height:${s}px;border-color:rgba(50,121,255,.5)"></span>`).join('')}${statusBar()}
  <div class="row jb" style="position:relative;padding:8px 20px">${`<button type="button" data-back aria-label="Voltar" style="color:var(--bh-ink)">${ic('chevron-left', 24)}</button>`}${BH_LOGO_D}</div>
  <div class="col g4 px5" style="position:relative;flex:1;justify-content:flex-end;padding-bottom:20px">
    <p class="h1" style="color:var(--bh-ink)">Quanto você precisa para se aposentar?</p><p class="b16" style="color:var(--bh-muted)">3 passos simples para entender o caminho até sua independência financeira</p>
    <p class="b14 bold" style="color:var(--bh-ink)">O que você vai descobrir</p>
    ${[['chart-line', 'O potencial dos seus investimentos'], ['shield-check', 'Como construir sua Super Previdência'], ['rocket', 'Escolhas que aceleram seus objetivos']].map(([i, t]) => `<div class="row g3"><span class="bh-ic">${ic(i, 18)}</span><p class="b14" style="color:var(--bh-ink)">${t}</p></div>`).join('')}
    <p class="cap" style="color:var(--bh-muted)">Leva menos de dois minutos. Você pode simular quantas vezes quiser.</p>
    ${btn('Começar', { cls: 'lg', go: 'apos2', attrs: 'style="background:var(--bh-blue)"' })}</div>${homeInd()}`,
});
screen('apos2', {
  cls: 'bh',
  /* apState() antes de montar o corpo: é ele que preenche a idade a partir do cadastro,
     e o campo precisa desse valor já no primeiro render */
  render: () => { apState(); return apScreen({ title: 'Meta de aposentadoria', dots: 1, sub: 'Defina quando você pretende se aposentar e a renda mensal necessária para manter seu estilo de vida',
    /* a idade atual é editável: antes vinha só da data de nascimento do cadastro, e quem
       entrasse direto neste fluxo era simulado como se tivesse 30 anos */
    body: `${field({ id: 'ac', label: 'Sua idade atual', ph: 'Ex: 40', bind: 'apos.iaTxt', mask: 'int', helper: 'Usamos esse valor como ponto de partida da projeção.' })}
      ${field({ id: 'ai', label: 'Idade de aposentadoria', ph: 'Ex: 65', bind: 'apos.idadeTxt', mask: 'int' })}<p class="fld-h err" id="aerr" hidden>A idade de aposentadoria precisa ser maior que a sua idade atual e no máximo 80 anos.</p>
      ${field({ id: 'ar', label: 'Renda mensal desejada', ph: 'R$ 0,00', bind: 'apos.rendaTxt', mask: 'brl', helper: 'Considere o poder de compra de hoje' })}
      ${dica('Ajustar o prazo da aposentadoria pode reduzir o esforço mensal necessário para construir seu futuro')}`,
    foot: btn('Próximo', { cls: 'lg', next: true, go: 'apos3', attrs: 'style="background:var(--bh-blue)"' }) }); },
  onInput: (i, el) => { if (i.id === 'ai' || i.id === 'ac') { const v = +($('#ai', el)?.value || 0); const ai = $('#ai', el)?.value || ''; $('#aerr', el).hidden = !ai || ai.length < 2 || (v > idadeAtual() && v <= 80); } },
  valid: () => { const a = apState(); const ia = +a.iaTxt, v = +a.idadeTxt; return ia >= 18 && ia <= 90 && v > ia && v <= 80 && parseBRL(a.rendaTxt) > 0; },
});
screen('apos3', {
  cls: 'bh',
  render: () => { const a = apState();
    return apScreen({ title: 'Rendas complementares', dots: 2, sub: 'Receitas como INSS, pensões ou aluguéis ajudam a compor sua renda na aposentadoria e reduzem o valor que você precisa investir hoje',
      body: a.fontes.length ? `<p class="b14" style="color:var(--bh-muted)">Receitas extras que você espera receber no momento da aposentadoria diminuem o valor necessário para alcançar o seu objetivo.</p><p class="b16 bold" style="color:var(--bh-ink)">Rendas cadastradas</p>
        ${a.fontes.map((f, k) => `<button type="button" class="bh-card row g3" data-act="fEd" data-k="${k}" style="flex-direction:row;align-items:center"><span class="bh-ic">${ic('house', 18)}</span><span class="f1 col"><span class="b16 semi" style="color:var(--bh-ink)">${esc(f.nome)}</span><span class="b14" style="color:var(--bh-muted)">${fmtR(f.valor)} por mês</span></span>${ic('pencil', 16)}</button>`).join('')}
        ${btn(ic('plus', 14) + ' Adicionar outra fonte', { v: 'o', cls: 'btn-xs auto', act: 'fAdd', attrs: 'style="align-self:flex-start;padding:0 14px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}`
        : `<div class="col g3 center" style="align-items:center;padding:20px 0"><p class="b16 bold" style="color:var(--bh-ink)">Espera receber alguma renda complementar na aposentadoria?</p><p class="b14" style="color:var(--bh-muted)">Considere aluguéis, pensão, INSS, dentre outros</p>${btn(ic('plus', 16) + ' Adicionar fonte de renda', { v: 'o', act: 'fAdd', cls: 'auto', attrs: 'style="padding:0 18px;color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })}</div>`,
      foot: btn('Próximo', { cls: 'lg', go: 'apos4', attrs: 'style="background:var(--bh-blue)"' }) }); },
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
    /* o aporte mensal não existe na 11.04 do Figma, mas sem ele a simulação parte de zero
       e nenhum cenário fecha percorrendo o fluxo — por isso segue aqui */
    body: `${field({ id: 'ap', label: 'Você já possui investimentos?', ph: 'R$ 0,00', bind: 'apos.patTxt', mask: 'brl', helper: 'Informe os valores aplicados em bancos, corretoras ou outras instituições financeiras. <b>Não inclua casa, carro ou terrenos.</b>' })}
      ${SEM_APORTE ? '' : field({ id: 'aa', label: 'Quanto consegue investir por mês?', ph: 'R$ 0,00', bind: 'apos.aporteTxt', mask: 'brl', helper: 'Usamos esse valor como ponto de partida. Na simulação mostramos se ele é suficiente.' })}
      <p class="cap" style="color:var(--bh-muted);margin-top:auto">Caso não tenha investimentos, basta gerar sua projeção.</p>`,
    foot: btn('Gerar minha projeção', { cls: 'lg', act: 'gerar', attrs: 'style="background:var(--bh-blue)"' }) }),
  acts: { gerar: () => go('bhProc', { msg: 'Analisando suas informações...', next: 'aposRes' }) },
});
/* ---------- resultado ---------- */
/* ---------- Gráfico patrimônio · visão única (Figma 11.10 · 21017:129073) ----------
   Vista única do plano inteiro (dos `ia` aos VIDA anos): a área azul é o total investido,
   a faixa verde entre ela e a curva é o retorno, e a linha azul por cima é o patrimônio
   total, com um ponto marcando o pico na idade-alvo. Antes havia 3 chips de vista
   (Geral/Até/Depois) + manchete grande; o layout novo os removeu. */
const AP_COR = { pat: '#2350f5', invL: '#8fa8fb', invF: 'rgba(143,168,251,.55)', retF: 'rgba(102,181,132,.45)', retB: '#66b584' };
/* Na variante sem aporte a pessoa não informa quanto investe: o resultado da simulação
   é o próprio plano necessário, e o gráfico descreve essa trajetória ideal.
   Com aporte informado, descreve a projeção declarada. */
const AP_IDEAL = SEM_APORTE;

/* ticks fixos do plano inteiro: início, marcos intermediários, idade-alvo (destaque) e fim */
function apTicks(r, a0, a1) {
  const q = f => Math.round((a0 + (r.idade - a0) * f) / 5) * 5;
  const t = [a0, q(1 / 3), q(2 / 3), r.idade, Math.floor(((r.idade + a1) / 2) / 5) * 5, a1];
  return [...new Set(t)].filter(x => x >= a0 && x <= a1).sort((x, y) => x - y);
}

function apChart(r) {
  const W = 309, H = 214, X0 = 6, X1 = 303, YT = 12, YB = 188;
  const a0 = r.ia, a1 = VIDA;
  const serie = AP_IDEAL ? r.ideal : r.serie;        // curva mostrada
  const max = Math.max(r.needAt, ...serie.map(s => s.pat)) || 1;
  const X = age => X0 + (age - a0) / ((a1 - a0) || 1) * (X1 - X0), Y = v => YB - (v / max) * (YB - YT);
  const line = (f) => serie.map((s, i) => `${i ? 'L' : 'M'}${X(s.age).toFixed(1)} ${Y(f(s)).toFixed(1)}`).join(' ');
  const area = (f) => `${line(f)} L${X(a1).toFixed(1)} ${YB} L${X(a0).toFixed(1)} ${YB} Z`;
  /* na fase de uso o investido não pode passar do que ainda resta: a faixa azul cai junto com a verde */
  const vPat = s => s.pat, vInv = s => Math.min(s.inv, s.pat);
  const gx = X(r.idade).toFixed(1);
  const pP = serie.find(s => s.age === r.idade);
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução estimada do patrimônio dos ${a0} aos ${a1} anos">
    ${[0, 1, 2, 3].map(i => { const y = (YT + i * (YB - YT) / 3).toFixed(1); return `<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="#e2e5ec" stroke-dasharray="2 3"/>`; }).join('')}
    <line x1="${gx}" x2="${gx}" y1="${YT}" y2="${YB}" stroke="${AP_COR.pat}" stroke-opacity=".45" stroke-dasharray="2 3"/>
    <path d="${area(vPat)}" fill="${AP_COR.retF}"/>
    <path d="${area(vInv)}" fill="${AP_COR.invF}"/>
    <path d="${line(vInv)}" fill="none" stroke="${AP_COR.invL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${line(vPat)}" fill="none" stroke="${AP_COR.pat}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pP ? `<circle cx="${gx}" cy="${Y(pP.pat).toFixed(1)}" r="4.5" fill="#fff" stroke="${AP_COR.pat}" stroke-width="2"/>` : ''}
    ${apTicks(r, a0, a1).map(t => `<text x="${X(t).toFixed(1)}" y="${YB + 19}" text-anchor="${t === a0 ? 'start' : t === a1 ? 'end' : 'middle'}" font-size="10" fill="${t === r.idade ? '#363d4a' : '#6e7789'}" font-weight="${t === r.idade ? 600 : 400}">${t}</text>`).join('')}
  </svg>`;
}

/* Detalhamento "Aos N anos · ANO" (Figma 21017:129110): composição do patrimônio na idade-alvo.
   Com aporte → projeção declarada (invAt/retorno/proj); sem aporte → plano necessário (idealInv/idealRet/needAt). */
function apDetalhe(r) {
  const proj = AP_IDEAL ? r.needAt : r.proj;
  const inv = AP_IDEAL ? r.idealInv : r.invAt;
  const ret = AP_IDEAL ? r.idealRet : r.retorno;
  /* badge "linha + ponto" do patrimônio, igual à marca da curva no gráfico */
  const swPat = `<span style="position:relative;display:inline-flex;align-items:center;width:24px;height:12px;flex:none"><i style="display:block;width:100%;height:2px;border-radius:9999px;background:${AP_COR.pat}"></i><i style="position:absolute;left:8px;top:2px;width:8px;height:8px;border-radius:9999px;background:#fff;border:1.5px solid ${AP_COR.pat}"></i></span>`;
  const swA = (f, b) => `<i style="display:block;width:22px;height:11px;border-radius:3px;background:${f};border:1.5px solid ${b};flex:none"></i>`;
  const row = (sw, lab, val, semi) =>
    `<div class="row jb" style="align-items:center;gap:8px;padding:10px 4px;border-bottom:1px solid #f1f5f9">
       <span class="row g2" style="align-items:center;min-width:0">${sw}<span style="font-size:12px;line-height:18px;color:#363d4a${semi ? ';font-weight:600' : ''}">${lab}</span></span>
       <span style="font-size:12px;font-weight:700;line-height:18px;color:#030c23;white-space:nowrap;flex:none">${val}</span></div>`;
  return `<div class="col" style="gap:2px;padding-top:20px">
    <div class="row g2" style="align-items:center;padding:6px 0 6px 5px">
      <i style="display:block;width:3px;height:23px;border-radius:9999px;background:#e77828;flex:none"></i>
      <span style="font-size:14px;font-weight:600;line-height:22px;color:#171717">Aos ${r.idade} anos · ${r.ano}</span></div>
    ${row(swPat, 'Patrimônio projetado', fmtR(proj), true)}
    ${row(swA(AP_COR.invF, AP_COR.invL), 'Total investido por você', fmtR(inv))}
    ${row(swA(AP_COR.retF, AP_COR.retB), 'Retorno dos investimentos', fmtR(ret))}
  </div>`;
}
screen('aposRes', {
  cls: 'bh',
  render: (p) => { const r = apCalc(); const gap = r.needAt - r.proj;
    const alt = (t, act) => `<button type="button" class="row g3 ais" data-act="${act}" style="text-align:left;padding:8px 0"><span style="color:${r.fecha ? 'var(--success)' : 'var(--warning)'}">${ic('circle-arrow-right', 20)}</span><span class="b14 semi" style="color:var(--bh-ink)">${t}</span></button>`;
    /* sem aporte informado sempre há um caminho — ele é o próprio resultado da simulação.
       O card de ajuste não cabe aqui: falaria de "manter aportes de R$ 0,00/mês". */
    const temCaminho = r.fecha || SEM_APORTE;
    const status = temCaminho ? `<div class="card col g2" style="background:var(--success-bg);border-color:#bfe5cc"><p class="h4" style="color:var(--bh-ink)">Encontramos um caminho!</p><p class="b14" style="color:var(--bh-ink)">Ao investir <b>${fmtR(SEM_APORTE ? r.aporteNec : r.aporte)}</b> por mês você alcança a renda desejada a partir da idade alvo.${!SEM_APORTE && r.aporteNec < r.aporte * 0.98 ? ` Na verdade, ${fmtR(r.aporteNec)} por mês já seriam suficientes.` : ''}</p><p class="b14" style="color:var(--bh-ink)">Agora você pode conhecer a SuperPrevidência, uma curadoria de soluções para colocar seu plano em prática:</p>${btn('Ir para SuperPrevidência', { act: 'superp', attrs: 'style="background:var(--success)"' })}</div>`
      : `<div class="card col g2" style="border-color:${r.acaba && r.acaba >= r.idade + 8 ? '#f6c59f' : '#f2b4b4'}"><div class="row jb"><p class="h4" style="color:var(--bh-ink)">Ajuste necessário</p>${r.acaba && r.acaba >= r.idade + 8 ? '<span class="badge warning">Atenção</span>' : ''}</div>
          <p class="b14" style="color:var(--bh-muted)">${r.acaba && r.acaba >= r.idade + 8 ? `Com as premissas atuais, há recursos para a aposentadoria, mas a reserva financeira se esgota aos <b>${r.acaba} anos</b>.` : `Mantendo aportes de <b>${fmtBRL(r.aporte)}/mês</b>, há uma diferença de <b>${fmtM(gap)}</b> para atingir o valor ideal aos <b>${r.idade} anos</b>.`}</p>
          <p class="b16 bold" style="color:var(--bh-ink);margin-top:6px">Veja como resolver</p><p class="b14" style="color:var(--bh-muted)">Toque em uma alternativa para simular com ela na hora.</p>
          ${alt(`Aumentar o aporte mensal para ${fmtBRL(Math.ceil(r.aporteNec / 10) * 10)}/mês`, 'altA')}
          ${alt(`Ajustar a renda desejada para ${fmtBRL(Math.floor(r.rendaPossivel / 100) * 100)}/mês`, 'altR')}
          ${r.idadeOk ? alt(`Aposentar aos ${r.idadeOk} anos`, 'altI') : ''}
          ${alt('Combinar alternativas (aplique mudanças no aporte, renda desejada ou idade de aposentadoria, ao mesmo tempo)', 'edit')}</div>`;
    return apScreen({ title: 'Aposentadoria Inteligente', sub: 'Veja como seu patrimônio pode evoluir ao longo da vida e durante a aposentadoria', subRola: true,
      /* paddings conforme o card 20810:181252: 24/12/20 com raio 20, sem gap entre blocos
         (cada bloco traz o próprio respiro); o título fica 8px mais para dentro que o gráfico */
      body: `<div class="bh-card" style="padding:24px 12px 20px;border-radius:20px;gap:0">
          <div style="padding:0 8px"><p class="h3" style="color:var(--bh-ink)">Seu dinheiro no tempo</p><p class="b14" style="color:#6e7789;padding-top:4px">Evolução estimada do seu patrimônio</p></div>
          <div style="padding-top:16px">${apChart(r)}</div>
          <div style="padding-top:20px"><div style="height:1px;background:#f1f5f9"></div></div>
          <div style="padding-top:20px"><div class="row jb" style="align-items:center;background:#f7f8fa;border:1px solid #e2e5ec;border-radius:12px;padding:12px 14px"><span class="b14 semi" style="color:var(--ty-darker)">Aporte necessário</span><span class="b14 bold" style="color:var(--ty-darker)">${fmtR(r.aporteNec)}/mês</span></div></div>
          ${apDetalhe(r)}
          <p style="padding-top:20px;font-size:11px;line-height:17px;color:#6e7789">Simulação considerando rentabilidade líquida de 5% ao ano acima da inflação (IPCA)</p></div>
        ${status}
        <div class="bh-card"><button type="button" class="row g3" data-act="tgInfo" aria-expanded="${!!p.info}"><span class="bh-ic">${ic('user', 18)}</span><span class="f1 b16 semi" style="color:var(--bh-ink);text-align:left">Informações consideradas para este cálculo</span>${ic(p.info ? 'chevron-up' : 'chevron-down', 18)}</button>
          ${p.info ? `<div class="col g3" style="background:var(--bg-lighter);border-radius:8px;padding:16px">${[['Idade de aposentadoria', r.idade + ' anos'], ['Renda desejada', fmtR(r.renda) + '/mês'], ['Outras fontes de renda', fmtR(r.comp) + '/mês'], ['Investimento atual', fmtR(r.P0)]].map(([a, v]) => `<div class="row jb"><span class="b14" style="color:#737373">${a}</span><span class="b14 semi" style="color:#404040">${v}</span></div>`).join('')}</div>` : ''}</div>
        <p class="cap center" style="color:#6e7789">As simulações são estimativas e não representam garantia de rentabilidade.</p>`,
      foot: temCaminho ? btn('Ir para SuperPrevidência', { cls: 'lg', act: 'superp', attrs: 'style="background:var(--bh-blue)"' }) + btn('Editar e simular novamente', { v: 'o', act: 'edit', attrs: 'style="color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' })
        : btn('Ajustar e simular novamente', { cls: 'lg', act: 'edit', attrs: 'style="background:var(--bh-blue)"' }) + btn('Salvar assim mesmo', { v: 'o', act: 'save', attrs: 'style="color:var(--bh-blue);box-shadow:inset 0 0 0 1px var(--bh-blue)"' }) }); },
  acts: {
    tgInfo: () => { const p = stack[stack.length - 1].p; p.info = !p.info; rerender(); },
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
S.apos = { iaTxt: '40', idadeTxt: '65', rendaTxt: 'R$ 14.300,00', fontes: [{ nome: 'Aluguel de imóvel', valor: 2000 }], patTxt: 'R$ 88.000,00', aporteTxt: SEM_APORTE ? '' : 'R$ 1.000,00' }; reset('bhHome'); go('apos2'); go('aposRes'); });
