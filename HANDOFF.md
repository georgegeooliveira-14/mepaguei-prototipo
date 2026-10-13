# Continuar o protótipo em outra conta do Claude

Tudo o que importa está **neste repositório público**, não na conversa:

    https://github.com/georgempoliveira/mepaguei-prototipo

Conversas, projetos e memória **não passam de uma conta para outra**. O repositório passa.
Ele carrega o código-fonte, o build publicado, os assets e os três documentos
(`CLAUDE.md`, `prd.md`, `design.md`) que explicam o produto e a arquitetura — foi exatamente
para isso que eles foram escritos.

---

## 1. Antes de sair daqui

Confira que está tudo versionado (nada pendente):

```bash
cd /home/claude/mepaguei-prototipo && git status --short && git log --oneline -1
```

Se aparecer arquivo pendente, peça para o Claude publicar antes de trocar de conta.

---

## 2. Na outra conta — primeira mensagem

Abra um chat novo e cole isto:

> Vou continuar um protótipo HTML que está pronto neste repositório público:
> https://github.com/georgempoliveira/mepaguei-prototipo
>
> Clone o repositório, rode `./restore.sh` para recriar o diretório de trabalho e
> **leia `CLAUDE.md`, `prd.md` e `design.md` antes de qualquer coisa** — eles já têm o
> produto, os fluxos, a arquitetura, os IDs do Figma e as armadilhas já mapeadas.
> Não reexplore o projeto do zero.

O `restore.sh` recria `/home/claude/mepaguei` com `src/`, os scripts de build e render,
os ícones vendorizados e os assets. Depois é só `python3 build.py`.

### O que **não** atravessa e precisa ser refeito lá

| Item | Como resolver |
|---|---|
| Conector do **Figma** | Reconectar na outra conta (Configurações → Conectores). O arquivo é o mesmo: `yU7YFh3p9777jIi0c23vGX`, página "Done", **somente leitura** |
| **Publicar** no GitHub Pages | A outra conta precisa de acesso de escrita ao repositório, ou publica num fork dela (o link do teste muda) |
| Instruções do **projeto "Me Paguei"** | Já estão resumidas no `CLAUDE.md` do repositório; se quiser, recrie o projeto lá e suba os três `.md` |
| Google Docs / Drive do roteiro de teste | Compartilhar o documento com a outra conta |

---

## 3. Ao voltar para cá

Nesta conta, antes de pedir qualquer mudança:

```bash
cd /home/claude/mepaguei-prototipo && git pull
./restore.sh && cd /home/claude/mepaguei && python3 build.py
```

Isso traz o que foi feito do outro lado e recria o diretório de trabalho — o container
desta sessão é temporário e pode ter sido reciclado nesse meio-tempo.

---

## 4. Regra prática

Cada lado **publica no repositório ao terminar** (`python3 build.py pub` + commit + push) e
**dá `git pull` ao começar**. Enquanto isso for respeitado, pode ir e voltar quantas vezes
quiser sem perder nada. Evite mexer nos dois lados ao mesmo tempo — aí vira conflito de merge.
