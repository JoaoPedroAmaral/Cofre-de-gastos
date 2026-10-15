# Gastos Controller

Controle de gastos pessoais a partir de extratos bancários. Você importa os arquivos que o seu banco
já fornece, o sistema monta uma planilha categorizada e um painel de para onde o dinheiro foi, e
exporta tudo para Excel.

**Nenhum dado sai do seu navegador.** Não existe servidor de aplicação, banco de dados nosso nem
conta remota. Os arquivos são lidos em memória, na sua máquina, e o que fica guardado está cifrado
no armazenamento do próprio navegador.

---

## O problema que ele resolve

O nome que aparece no extrato não é o nome da empresa. `PAGBANK*JL ALIMENTOS`, `MP *XYZ SERVICOS` e
`CIELO ME 2938 SP` precisam virar Alimentação, Transporte, Academia — e precisam continuar virando
isso nos meses seguintes, sem retrabalho manual.

O sistema deriva uma chave de comerciante da descrição, removendo data, parcela, código de loja,
cidade e dígitos soltos, de modo que o mesmo estabelecimento gere sempre a mesma chave. A partir
daí, categorizar uma vez vale para o histórico inteiro e para as importações futuras.

## O que ele faz

- Importa OFX, CSV, XLSX e PDF de fatura, com detecção do formato pelo conteúdo, não pela extensão
- Mapeador manual de colunas para qualquer CSV ou XLSX de banco desconhecido, reaplicado nas
  próximas importações do mesmo layout
- Deduplica ao reimportar o mesmo período, e identifica transferência entre contas próprias e
  pagamento de fatura, que não são gasto
- Categoriza por regras suas, com dicionário de comerciantes brasileiros e aprendizado assistido
- Planilha com edição na linha, busca, ordenação, paginação e edição em lote
- Painel com totais, distribuição por categoria, evolução mensal e maiores estabelecimentos
- Exporta `.xlsx` e `.csv`, e gera backup cifrado para levar os dados a outro dispositivo
- Funciona sem rede depois da primeira visita, e é instalável como aplicativo

## Privacidade, que aqui é arquitetura e não promessa

| O que | Como |
|---|---|
| Dados em repouso | AES-256-GCM no IndexedDB, com IV aleatório por registro |
| Chave | Derivada da sua senha com PBKDF2, SHA-256, 600 mil iterações e salt próprio |
| Chave de dados | Aleatória e guardada envelopada pela chave da senha, o que permite trocar a senha sem recifrar o histórico |
| Chave de sessão | Existe só em memória, como `CryptoKey` não exportável. Nunca em `localStorage` |
| Saída de rede | A CSP declara `connect-src 'none'`: `fetch`, `XMLHttpRequest`, WebSocket e `sendBeacon` são proibidos |
| Terceiros | `script-src 'self'`. Nenhuma biblioteca por CDN, nenhum analytics, nenhum cookie de rastreamento |

O `connect-src 'none'` é o item central. Num sistema que decifra extrato bancário na própria origem,
ele é o que garante que **nem uma biblioteca comprometida conseguiria enviar os dados para fora** —
a tentativa vira erro visível no console.

Como consequência direta: **não existe recuperação de senha.** Não há cópia da sua chave em servidor
nenhum. Perder a senha e o código de recuperação ao mesmo tempo significa perder os dados, e isso é
propriedade do desenho, não falha. O backup cifrado é funcionalidade de primeira classe por isso.

## Rodar localmente

Não há build, não há `npm install`, não há dependência de execução.

```
python servidor-dev.py 8000
```

Abre em `http://127.0.0.1:8000`. A suíte de testes fica em `http://127.0.0.1:8000/testes/`.

ES modules não funcionam por `file://`, então um servidor estático é obrigatório. O
`servidor-dev.py` existe em vez de `python -m http.server` por dois motivos: no Windows o módulo
`mimetypes` costuma servir `.js` como `text/plain`, e o navegador recusa um módulo com esse tipo —
a página abre em branco **sem nenhum erro no console**. E ele aplica localmente a mesma CSP de
produção, para violação de política aparecer durante o desenvolvimento.

> `localhost` e o domínio publicado são origens diferentes, e cada origem tem o próprio IndexedDB.
> O cofre criado em desenvolvimento não aparece em produção, e vice-versa.

## Arquitetura

JavaScript puro, módulos ES nativos, sem bundler. O fluxo é `estado → função pura → DOM`.

```
┌─ UI ──────────────────────────────────────────────┐
│  uma tela por arquivo, mais componentes,          │
│  reconciliação, foco, paginação, temas, gráficos  │
└───────────────┬───────────────────────────────────┘
                │ lê estado, despacha ações
┌───────────────▼─── ESTADO ────────────────────────┐
│  store único observável                           │
└───────────────┬───────────────────────────────────┘
                │
┌───────────────▼─── NÚCLEO (puro, sem DOM) ────────┐
│  preparar · classificar · filtrar · agregar ·     │
│  ordenar · paginar · deduplicar · naoGasto        │
└───────┬───────────────────────────┬───────────────┘
        │                           │
┌───────▼─── IMPORTADORES ───┐ ┌────▼─── PERSISTÊNCIA ────┐
│ detector · ofx · csv ·     │ │ cofre · indexeddb ·      │
│ xlsx · pdf · bancos/       │ │ backup                   │
└────────────────────────────┘ └──────────────────────────┘
```

**A regra de dependência é o que sustenta o resto.** A UI conhece o estado e o núcleo. O núcleo não
conhece a UI nem o DOM: é função pura, e é por isso que a regra de negócio é testável sem navegador
headless. Os importadores recebem texto ou bytes e devolvem lançamentos crus, sem tocar em estado.

### Onde fica cada coisa

```
js/nucleo/        regras puras: preparar, classificar, filtrar, agregar, ordenar, paginar,
                  deduplicar, identidade, naoGasto, catalogo, tags, dinheiro, datas, palavras
js/estado/        store.js: estado único, ações, reducer, observadores
js/cofre/         derivação, sessão, validade da sessão, código de recuperação
js/armazenamento/ banco.js (IndexedDB), cofreDeDados.js, backup.js
js/importadores/  detector, linhaCsv, periodo, tabela, bancos/, extratos/, faturas/
js/exportacao/    csv, xlsx, abas, arquivo
js/ui/            uma tela por arquivo, mais componentes, reconciliar, foco, paginacao, temas
js/privacidade/   termo (texto), corpo (montagem única), pagina (página pública)
css/              base.css (tokens e escala), tema.css (cinco temas), componentes.css
testes/           runner próprio e casos por regra de negócio
vendor/           pdf.js, SheetJS e fontes, com versão fixa, servidos da própria origem
sw.js             service worker: precache, rede primeiro para código, cache primeiro para vendor
```

### Convenções

- Nomes de arquivos, pastas e identificadores em português, acompanhando o domínio
- **Dinheiro em centavos, como inteiro**, dentro de todo o núcleo. Conversão só na borda de exibição
  e export, o que elimina erro de ponto flutuante na soma por categoria
- Datas em `yyyy-mm-dd` como string no núcleo; `Date` só na borda de formatação
- Zero comentários no código: nomes e estrutura explicam
- Toda constante significativa em `js/nucleo/constantes.js`

### Peças que vale conhecer antes de mexer

| Arquivo | Por quê |
|---|---|
| `js/ui/reconciliar.js` | Reconciliação de lista por chave e assinatura. É o que faz a planilha atualizar sem remontar |
| `js/ui/layout.js` | `registrarTela` aceita função ou `{ montar, atualizar }`. Quem só monta é remontado a cada mudança de estado |
| `js/cofre/validadeDaSessao.js` | Regras puras da sessão: janela, aba, renovação |
| `js/nucleo/paginar.js` | Paginação pura. A fatia acontece depois de tudo que conta, para o total nunca ser o da página |
| `js/privacidade/corpo.js` | Montagem única do termo, usada pela tela interna e pela página pública |

## Testes

A suíte roda no navegador, em `testes/`, com runner próprio e sem dependência externa. Os casos
verificam **comportamento e regra de negócio, nunca arquivo ou implementação**: se o sistema for
refatorado e os requisitos continuarem cumpridos, os testes passam sem alteração.

```
node testes/precache.mjs      confere que o sw.js lista todos os arquivos do projeto
```

Esse guarda existe porque, sem build, a lista do service worker é mantida à mão, e um arquivo novo
esquecido ali quebra o funcionamento offline em silêncio.

## Publicação

Hospedagem estática. O projeto está em Cloudflare Pages, escolhido por aceitar cabeçalhos HTTP
próprios via `_headers` — sem isso a CSP só existiria em `<meta>`, que é mais fraca e não cobre
`frame-ancestors`.

Dois cuidados que já causaram incidente:

- **Toda mudança em arquivo do projeto exige acrescentá-lo a `ESSENCIAIS` no `sw.js` e subir
  `VERSAO`.** O navegador só reinstala o service worker quando os bytes do arquivo mudam
- **O Pages soma as regras do `_headers` em vez de a mais específica substituir a genérica.** A
  regra do `/sw.js` desanexa os cabeçalhos acumulados antes de definir os dela, e fica por último no
  arquivo. Sem isso o `/sw.js` recebe duas CSP, o navegador aplica a interseção, e o
  `connect-src 'none'` bloqueia o `fetch` de dentro do próprio service worker — o que derruba o site

## Licença

Sem licença definida.
