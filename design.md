# DESIGN & BUILD — Protótipo Me Paguei + BlueHub

> **Leia antes de escrever código.** Este arquivo diz **como** construir: build, arquitetura,
> tokens, componentes, receitas de tela, IDs do Figma, assets e as armadilhas já mapeadas.
> O **o quê/por quê** está em `prd.md`. Os dois existem para **economizar tokens**:
> não reexplore o projeto nem o Figma inteiro.

---

## 1. Stack e princípios

HTML/CSS/JS **puro**, sem framework, sem build de JS, sem backend, **sem localStorage**.
`build.py` concatena tudo num único `dist/index.html`. Frame de celular **375×812**.
Fonte **Inter** local (versão 3 — bate com as quebras de linha do Figma).

**Regras:**
- Reutilize componentes/classes existentes; **nunca** recrie um botão/input/card na mão.
- Use **tokens** (`var(--…)`) — hex solto só quando o Figma usa algo fora do DS (e avise).
- Texto **idêntico** ao Figma (acentos, maiúsculas, pontuação).
- **Figma é SOMENTE LEITURA.** Nunca escreva no arquivo.
- Você **não valida acabamento visual fino** — sempre peça ao cliente conferir os prints.

---

## 2. Comandos (sempre a partir de `/home/claude/mepaguei`)

```bash
# build de desenvolvimento → dist/
python3 build.py

# build de publicação → dist-pub/  (metas de PWA, color-scheme light, sem painel de debug)
python3 build.py pub

# render de 1 tela (altura total; --top = só 812). Mostra ERR se houver erro de JS
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 full.py <nome> "<js>;;<js>" [--top]
#   ex.: full.py home "seedDemo();reset('home')"            → audit/home-me.png

# salvar imagem exportada do Figma (casando por tamanho) em assets/
python3 fx.py '[{"n":"nome","w":672,"h":826,"base":[336,413]}]' --webp

# comparação lado a lado com o Figma, em fatias
python3 cmp.py <png_do_figma> <nome>                         → audit/<nome>-pairN.png
```

### Publicar (GitHub Pages)
```bash
python3 build.py pub
PUB=/home/claude/mepaguei-prototipo
rm -rf "$PUB/assets" "$PUB/index.html" "$PUB/manifest.json"
cp -r dist-pub/index.html dist-pub/manifest.json dist-pub/assets "$PUB"/
cd "$PUB" && git add -A && git -c commit.gpgsign=false commit -q -m "<msg>"
timeout 300 git -c http.extraheader= push origin main
```
Link: **https://georgempoliveira.github.io/mepaguei-prototipo/** (propaga em ~1 min; peça
ao cliente abrir em **aba anônima** para evitar cache).

### Restaurar o fonte (se a sessão acabar / o container for reciclado)
O repositório versiona **o build publicado E o código-fonte**:

```
mepaguei-prototipo/
├─ index.html, manifest.json, assets/   ← build publicado (GitHub Pages)
├─ CLAUDE.md, prd.md, design.md         ← documentação
├─ restore.sh                           ← recria o diretório de trabalho
└─ source/
   ├─ src/              (JS + CSS + shell.html)
   ├─ *.py              (build.py, full.py, fx.py, cmp.py, …)
   ├─ vendor-icons/     (123 SVGs Lucide usados — build funciona sem npm)
   └─ package.json
```

```bash
git clone https://github.com/georgempoliveira/mepaguei-prototipo
cd mepaguei-prototipo && ./restore.sh          # destino padrão: /home/claude/mepaguei
cd /home/claude/mepaguei && python3 build.py
```

`build.py` procura os ícones em `node_modules/lucide-static/icons` e, se não houver,
cai em **`vendor-icons/`**. Só rode `npm install` se precisar de um ícone **novo**
(depois, espelhe-o em `vendor-icons/`).

### Modos da URL
`#participante` esconde o painel do moderador · `#cmp` modo auditoria (mostra status bar e
home indicator) · sem hash = painel do moderador visível (no mobile, **toque triplo** na status bar).

---

## 3. Arquitetura (`src/`)

| Arquivo | Conteúdo |
|---|---|
| `core.js` | estado `S`, roteador, helpers, overlays, máscaras, `flowEntry` |
| `base.css` | tokens + componentes do DS **(global — mexer aqui afeta tudo)** |
| `bh.css` | CSS específico da home do BlueHub |
| `10-cadastro.js` | splash, onboarding, cadastro, token, senha, login, perfil |
| `20-home.js` | home, **navbar**, config, notificações, `seedDemo()` |
| `21-openfinance.js` | Open Finance + Central de Consentimento + `miaInsight` |
| `30-poupancas.js` | Poupanças (valor fixo, placar, troco, objetivos) |
| `40-saldoseguro.js` | Clareza / Saldo Seguro + motor de projeção |
| `45-controle.js` | Radar, Agenda, Assinaturas |
| `50-bluehub.js` | app BlueHub inteiro |
| `55-aposentadoria.js` | simulador de aposentadoria (`apCalc`) |
| `boot.js` | ordena os flows e inicia em `bhSplash` **(sempre o último)** |

Ordem de concatenação: `core.js` → demais em ordem alfabética → `boot.js`.

### Roteador
```js
screen(id, { render(p), mount(el,p), acts:{...}, valid(), onInput(i,el), cls })
go(id,p,dir) · replace(id,p,dir) · back() · backTo(id) · reset(id,p,dir) · rerender()
// dir: 'push' | 'back' | 'fade' | 'none'
P()                      // params da tela do topo
stack[stack.length-1].p  // params mutáveis (abas, acordeões) + rerender()
```
Eventos **delegados** (não registre listeners à mão):
`data-act="nome"` → `acts.nome(btn,ev)` ou `GLOBAL_ACTS.nome` ·
`data-go="tela"` · `data-back` · `data-bind="caminho.no.S"` · `data-mask="brl|data|cpf|..."`

---

## 4. Tokens (`base.css :root`)

```
Cor Me Paguei   --primary #328ce3 · --primary-700 #2573d0 · --primary-darker #1a3151
                --primary-lighter #f0f9fe · --primary-bg #e6f3fd · --btn-primary #43a5ee
                --link #245da9
Tipografia      --ty-darker #171717 · --ty-dark #404040 · --ty-base #737373
                --ty-light #a3a3a3 · --ty-lighter #f5f5f5
Fundo/borda     --bg-white/#fff · --bg-lighter #f6f6f6 · --bg-light #fbfbfb
                --border-light #d3d3d3 · --border-lighter #f3f3f3 · --outline #d7d9e4
Feedback        --success #348352 (+bg) · --danger #d93a3a (+bg) · --warning #e77828 (+bg)
IA (MIA)        --ia #8b3eea · --ia-bg #f4ecfd
Gradiente       --grad  linear-gradient(193deg,#2573d0 4.8%,#01358d 50.6%,#080b10 100%)
BlueHub         --bh-blue #2350f5 · --bh-ink #030c23 · --bh-muted #6e7789 · --bh-line #eff1f5
                --bh-teal #46c7be · --bh-orange #ff9c6e · --bh-subtle #f7f8fa · --bh-blue-bg #eef2ff
Espaço          --sp-1 4 · 2 8 · 3 12 · 4 16 · 5 20 · 6 24 · 7 28 · 8 32 · 10 40 · 12 48
Raio            --r-md 6 · --r-xl 12 · --r-2xl 16 · --r-3xl 24 · --r-full 9999
```

**Tipografia (classes):** `.h1` 24/32 bold · `.h2` 20/28 · `.h3` 18/24 · `.h4` 18/24 ·
`.b16` 16/24 · `.b14` 14/22 · `.cap` 12/18 · modificadores `.semi` `.bold` ·
cores `.c-darker .c-dark .c-base .c-primary .c-ia`.
**Layout:** `.col .row .f1 .jb .jc .ais .center .g1…g6` (gap = `--sp-*`) · `.px5` (20px lateral) ·
`.scroll` (área rolável) · `.mt-auto`.

---

## 5. Componentes prontos (reutilize)

| Classe / helper | O que é |
|---|---|
| `btn(label,{v,act,go,cls,next,attrs})` | botão. `v:'o'` outline, `'d'` danger · `cls:'btn-ia'`, `'btn-xs'`, `'lg'` · `next:true` liga ao `valid()` |
| `field({id,label,ph,bind,mask,icon,helper,...})` | input completo (`.fld`+`.inp`) |
| `selectField`, `pwField` | select e campo de senha com olho |
| `checkbox(path,label,on)` · `radio()` · `toggle(key,on)` | `.chk`, `.rad` (`.rad .o` é o círculo), `.sw` |
| `.card` | cartão branco com borda |
| `.li` | linha de lista com ícone + textos + chevron |
| `.chip` / `.chips` | chips; `.chip.glass` sobre gradiente, `.on` = ativo |
| `.badge` | selo (`info/success/warning/danger`) |
| `.ico-c` | tile de ícone redondo (`.sm` menor, `.sq` quadrado) |
| `.ins` | card de **insight da MIA** (borda roxa) |
| `.mia-mini` | insight **recolhido** (avatar da MIA clicável) |
| `openSheet(html,{foot})` | bottom sheet — retorna o overlay |
| `openDialog(html)` · `confirmDlg({...})` | alerta central |
| `toast(msg,tone,icon)` | toast |
| `statusBar(light)` · `homeInd(light)` · `CURVE` · `ME_MARK` | chrome do celular |
| `ic(nome,tam,extra)` | ícone Lucide (embutido no build; `MISSING ICONS` avisa se faltar) |
| `navbar(ativa)` / `bhNav(ativa)` | navbars Me Paguei / BlueHub |
| `miaBox(title,text,act,label,sub)` / `miaMini(act)` | insight expandido / recolhido |
| `fmtBRL(v,cents)` · `parseBRL(s)` · `ddmm(d)` · `periodo()` | formatação |

---

## 6. Receitas de tela (padrões que já funcionam)

**Tela com header em gradiente + folha branca** (Central de Consentimento, `ssCfg`):
```js
screen('x', { cls: 'grad',           // ← o azul vem DAQUI, não do curve.png
  render: () => `${CURVE}${statusBar(true)}
    <div class="row g3" style="flex:none;position:relative;z-index:2;padding:16px 20px 20px">
      <button type="button" data-back style="color:#fff">${ic('chevron-left',24)}</button>
      <p class="h2" style="color:#fff">Título</p></div>
    <div class="scroll" style="position:relative;z-index:2;display:flex;flex-direction:column">
      <div class="col" style="flex:1 0 auto;background:#fff;border-radius:32px 32px 0 0;padding:24px 20px">
        …corpo…
      </div></div>${homeInd()}` });
```
> `curve.png` é só um **detalhe decorativo quase transparente**. O gradiente azul vem de `cls:'grad'`.

**Tela branca simples:** `${statusBar()}` + `<div class="ah">` (header com voltar) + `.scroll px5 col g4` + `homeInd()`.

**Bottom sheet com rodapé:** `openSheet(html, { foot: btn('Avançar',{act:'x'}) + btn('Cancelar',{v:'o',act:'closeov'}) })`.
Para desabilitar o botão até a escolha: dê `cls:'js-x'` e `$$('.js-x',ov).forEach(b=>b.disabled=true)`.

**Onboarding da Clareza:** helper `SS_OB({fechar,titulo,sub,corpo,dot,foot})` + `obItem(icone,titulo,desc)`.

---

## 7. Armadilhas já mapeadas (não repita)

1. **`cls:'grad'`** é o que pinta o fundo azul. `CURVE` sozinho deixa a tela branca (e o texto
   branco some).
2. **`.h1` tem `text-wrap:balance`** — quebra as linhas diferente do Figma. Use
   `style="text-wrap:wrap"` quando precisar casar a quebra.
3. **`</div>` órfão**: ao remover um bloco, confira se não sobrou um fechamento que encerra o
   contêiner de `gap` antes da hora (já zerou o espaçamento inteiro da home do BlueHub).
4. **`objWizard(1,false)` zera `S.tmpObj`** — nunca reabra a folha para refletir um chip;
   altere o input no DOM e dispare `input` (`bubbles:true`).
5. **Modo light forçado**: `:root{color-scheme: only light; forced-color-adjust:none}` +
   metas `color-scheme`/`supported-color-schemes` no `<head>` do build pub. Não remova.
6. **Frames do Figma podem ser mais altos que 812** — se o CTA ficar atrás do home indicator,
   aperte os espaços verticais e **avise o cliente** do desvio.
7. **Ícones**: só existem os que o `build.py` encontra nas chamadas `ic('nome')`. Confira o
   aviso `MISSING ICONS` depois do build.
8. **Telas mais altas/largas que 375×812**: no celular o frame preenche o viewport com
   `height:100%` (html/body são `position:fixed;inset:0`). **Não use `100dvh`** — no iOS ele
   não acompanha o recolher da barra do navegador e sobra uma faixa do `--stage` no rodapé.
   Pelo mesmo motivo, elementos decorativos de fundo (foto, curvas, anéis) usam `width:100%`,
   nunca `width:375px`, e blocos no pé da tela são ancorados por `bottom:`, não por `top:`.
   **Como o viewport do iOS/Android é imprevisível** (barra que recolhe, área segura, standalone),
   não adianta só ajustar altura: `pintaFundo()` (em `core.js`) pinta `html`, `body` e o
   `theme-color` com a **cor da própria tela** a cada render, no celular. Assim qualquer sobra
   fica invisível. No desktop o palco segue cinza. Se criar uma tela com fundo próprio, garanta
   que a cor esteja no `background-color` do `.scr` (gradiente cai no branco da folha).
9. **`closeov` é ação GLOBAL** (fecha o overlay do topo). Antes era declarada tela a tela e
   faltava em várias, deixando "Cancelar" de alguns sheets sem efeito.
10. **Sempre confira `ERR []`** no `full.py` — erro de JS deixa a tela em branco.

---

## 8. Figma — IDs (SOMENTE LEITURA)

Arquivo `yU7YFh3p9777jIi0c23vGX`, página **"Done"** (`14:6`).
Referência-mestre do DS: section **Poupanças** `9309:22948`.

| Fluxo | ID |
|---|---|
| **BlueHub** section | `15413:35877` · Cadastro `15413:35878` · App `15413:36848` |
| BlueHub Home (atual) | **`15413:37574`** (a antiga era `15413:36895`) |
| BlueHub Trilhas | `15413:37519` · Vida+ `18444:30591` · Perfil/Excluir conta `20154:40263` (+ confirmação `20154:93071`) |
| BlueHub outros | Benefícios `15413:37346` · Carteirinha `18004:32727` · Me Paguei `15413:37469` · FAQ `18877:35563` · Notificações `15413:37402` · Externo `15413:37449` · Login `15413:37986` |
| **Cadastro Me Paguei** | `15839:108237` · Splash `1500:7410` · Boas-vindas `1639:2611` · Onboarding `9615:33323` · Senha `15413:36239` |
| **Open Finance / Config** | `9309:22949` · Central de Consentimento `6114:17234` |
| **Home Me Paguei** | `17191:36005` · estado vazio `17191:36011` |
| **Clareza / Saldo Seguro** | section **`17790:141237`** · Apresentação `17790:141394` · Onboarding 1 `17790:141411` · Onboarding 2 `17790:141442` · Sheet de escolha `17790:141477` · Insight recolhido `17790:142435` · Configurações `17790:143843` |
| **Radar** | `15388:34241` · **Aposentadoria** `14014:30981` |

### Como ler e exportar do Figma
```js
// use_figma (carregue a skill figma-use antes) — SOMENTE LEITURA
const n = await figma.getNodeByIdAsync('17790:141394');
await n.screenshot({ scale: 2 });            // export
n.findAll(t => t.type==='TEXT')              // textos exatos
```
**Limitações reais deste ambiente (não perca tempo):**
- Só **~1 imagem por chamada** volta/é salva em disco. Para vários nós, **1 chamada por nó**.
- **A rede do workspace não alcança `figma.com`** → `get_screenshot` devolve URL que você
  **não consegue baixar**. Alternativa: tirar screenshot do **frame inteiro** com `use_figma`
  e **recortar** com PIL a partir do blob salvo em
  `/root/.claude/projects/-home-claude-mepaguei-prototipo/<id>/tool-results/*.png`.
- `fx.py` casa o blob pelo tamanho e salva em `assets/` como `.webp`.
- `t.fontSize` pode ser `figma.mixed` (Symbol) → **não concatene direto em string**.

---

## 9. Assets (`assets/`, 92 arquivos)

| Prefixo | Uso |
|---|---|
| `mia-*.webp`, `mia-avatar`, `tip.png` | ilustrações e avatar da MIA, brilho do insight |
| `logo-color/white.png`, `me-mark.png` | marca Me Paguei |
| `bluehub-logo-*`, `bh-logo-home.png` | marca BlueHub |
| `bh-*`, `bhh-*`, `bhc-*`, `bht-*`, `bhv-*` | fotos e decorações do BlueHub (home, trilhas, Vida+) |
| `bank-*.png` | logos de bancos · `t-*.png` escudos de times (Placar do Bem) |
| `curve.png` | curvas decorativas translúcidas (NÃO é o gradiente) |
| `cl-intro.webp`, `ss-intro.webp`, `poup-intro.webp`, `radar-intro.webp` | aberturas de fluxo |
| `fonts/` | Inter v3 local |

---

## 10. Como trabalhar gastando poucos tokens

1. **Leia `prd.md` + `design.md` e vá direto ao módulo do pedido.** Não releia todos os `src/*.js`.
2. Um módulo por vez. Se delegar a subagentes, 1–2 por vez com escopo estreito.
3. No Figma, leia **só o nó da tela** em questão. Resultados grandes vêm salvos em arquivo —
   leia por trecho com `grep`/`Read`, não inteiro.
4. Edite com `Edit` (trechos cirúrgicos), não reescreva arquivos inteiros.
5. Valide **1 tela por vez**: `build.py` → `full.py` → comparação em fatias de ~1000px.
6. Ao terminar: diga quais componentes/tokens usou e **sinalize todo improviso**.
