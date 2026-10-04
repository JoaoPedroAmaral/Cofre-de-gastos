# Bibliotecas locais

Nenhuma biblioteca é carregada de CDN. Num sistema que decifra extrato bancário no navegador,
um script de terceiro na mesma origem leria os dados já decifrados, e a criptografia não
protegeria nada. Por isso cada arquivo é baixado, conferido pelo hash e commitado aqui.

A CSP em `_headers` reforça isso com `script-src 'self'` e `connect-src 'none'`.

## Procedimento para acrescentar uma biblioteca

1. Baixar o arquivo da origem oficial, em versão fixa (nunca `latest`)
2. Calcular o hash: `Get-FileHash -Algorithm SHA256 <arquivo>`
3. Commitar o arquivo dentro de `vendor/<lib>/`
4. Registrar na tabela abaixo
5. Nunca sobrescrever um arquivo existente ao atualizar: criar o novo caminho com a nova versão,
   porque `/vendor/*` é servido com cache imutável

## Inventário

| Biblioteca | Versão | Caminho | Usada em | SHA-256 |
|---|---|---|---|---|
| SheetJS (xlsx.mini) | 0.18.5 | `vendor/sheetjs/xlsx.mini.min.js` | Fases 1 e 5: leitura de XLSX e geração do Excel | `3120abba1fd0ea031f25ab22ac93e726f6f63467da1a6349b82e82f3df5d775c` |
| ~~Chart.js~~ | dispensada | — | Fase 4 | Os gráficos do painel são SVG inline em `js/ui/graficos.js`: o desenho do protótipo são arcos concêntricos e barras, que não justificam uma biblioteca de 200 KB |
| pdf.js (legacy) | 4.10.38 | `vendor/pdfjs/pdf.min.mjs` | Fase 9: extração de texto da fatura em PDF | `44ec6f011027ee77791386b66c14876a5fc29e20bf0433c07c6726fff7212b72` |
| pdf.js worker (legacy) | 4.10.38 | `vendor/pdfjs/pdf.worker.min.mjs` | Fase 9: o trabalho pesado da leitura roda fora da thread principal | `bd88805178a26c729db8c0107a5b630cb900ec070f4d8c7529a3e45530afd41d` |
| argon2-browser (WASM) | pendente | `vendor/argon2/` | Fase 6, somente se a decisão for Argon2id em vez de PBKDF2 nativo | pendente |

## Fontes

As três famílias do design vêm do Google Fonts, mas são servidas localmente: a CSP proíbe
`fonts.googleapis.com` e `fonts.gstatic.com`, e carregar fonte de terceiro numa aplicação E2EE
abriria exatamente o furo que `script-src 'self'` fecha. Só o subconjunto latino foi baixado.
Geist e Geist Mono são variáveis: um arquivo cobre toda a faixa de peso.

| Arquivo | Caminho | Tamanho | SHA-256 |
|---|---|---|---|
| geist-mono-variavel.woff2 | `vendor/fontes/geist-mono-variavel.woff2` | 23128 bytes | `684ad5b531f81d43c1e8c7038262d5db7cdc1f68006e04d6c7769efa8d33c8cc` |
| geist-variavel.woff2 | `vendor/fontes/geist-variavel.woff2` | 29400 bytes | `19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1` |
| syne-700.woff2 | `vendor/fontes/syne-700.woff2` | 14072 bytes | `0aad69416fc0ccf6f340647c46e759d5c6e4628d92576b279ec5ada0afbd9d35` |

Declaradas em `vendor/fontes.css`, importado por `css/base.css`.
Origem: `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Syne:wght@700`, baixadas em 2026-10-01.

## Observações

O SheetJS é carregado sob demanda, apenas quando um arquivo XLSX é importado.
Origem: `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.mini.min.js`, baixado em 2026-10-01.

O pdf.js também é carregado sob demanda, apenas quando um PDF é importado, por `import()` dinâmico
em `js/carregadores/pdfjs.js`. Usamos a build **legacy**, que não depende de recursos recentes de
navegador, e passamos `isEvalSupported: false`, `useWorkerFetch: false` e `disableFontFace: true`:
só extraímos texto, nunca desenhamos a página, então nada disso é necessário e cada opção dessas é
uma superfície a menos. O worker vem de `/vendor/`, coberto por `worker-src 'self'` na CSP, e não
há `standardFontDataUrl` nem `cMapUrl` justamente porque `connect-src 'none'` proíbe buscar
qualquer coisa em tempo de execução.
Origem: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/`, baixado em 2026-10-04.
