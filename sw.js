const VERSAO = 'v8';
const NOME_DO_CACHE = `gastos-controller-${VERSAO}`;
const PAGINA = '/index.html';
const METODO_LIDO = 'GET';
const PASTAS_IMUTAVEIS = ['/vendor/', '/icones/'];

const ESSENCIAIS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/base.css',
  '/css/componentes.css',
  '/css/tema.css',
  '/js/main.js',
  '/js/armazenamento/backup.js',
  '/js/armazenamento/banco.js',
  '/js/armazenamento/cofreDeDados.js',
  '/js/carregadores/pdfjs.js',
  '/js/carregadores/servicoOffline.js',
  '/js/carregadores/sheetjs.js',
  '/js/cofre/bytes.js',
  '/js/cofre/cofre.js',
  '/js/cofre/derivacao.js',
  '/js/cofre/recuperacao.js',
  '/js/cofre/sessao.js',
  '/js/dados/regrasSemente.js',
  '/js/estado/store.js',
  '/js/exportacao/abas.js',
  '/js/exportacao/arquivo.js',
  '/js/exportacao/csv.js',
  '/js/exportacao/xlsx.js',
  '/js/importadores/csv.js',
  '/js/importadores/detector.js',
  '/js/importadores/extratos/colunas.js',
  '/js/importadores/extratos/picpay.js',
  '/js/importadores/importar.js',
  '/js/importadores/linhaCsv.js',
  '/js/importadores/mapeamentos.js',
  '/js/importadores/ofx.js',
  '/js/importadores/periodo.js',
  '/js/importadores/pdf.js',
  '/js/importadores/tabela.js',
  '/js/importadores/texto.js',
  '/js/importadores/xlsx.js',
  '/js/importadores/bancos/index.js',
  '/js/importadores/bancos/nubank.js',
  '/js/importadores/bancos/picpay.js',
  '/js/importadores/bancos/sistema.js',
  '/js/importadores/faturas/emissores.js',
  '/js/importadores/faturas/lancamentos.js',
  '/js/importadores/faturas/layout.js',
  '/js/importadores/faturas/periodo.js',
  '/js/nucleo/agregar.js',
  '/js/nucleo/catalogo.js',
  '/js/nucleo/classificar.js',
  '/js/nucleo/constantes.js',
  '/js/nucleo/datas.js',
  '/js/nucleo/deduplicar.js',
  '/js/nucleo/dinheiro.js',
  '/js/nucleo/filtrar.js',
  '/js/nucleo/identidade.js',
  '/js/nucleo/identidadePessoal.js',
  '/js/nucleo/modelo.js',
  '/js/nucleo/naoGasto.js',
  '/js/nucleo/normalizar.js',
  '/js/nucleo/ordenar.js',
  '/js/nucleo/palavras.js',
  '/js/nucleo/preparar.js',
  '/js/nucleo/regras.js',
  '/js/ui/ajustes.js',
  '/js/ui/ajustesCategorias.js',
  '/js/ui/ajustesIdentidade.js',
  '/js/ui/cadeado.js',
  '/js/ui/componentes.js',
  '/js/ui/dialogos.js',
  '/js/ui/exportar.js',
  '/js/ui/filtros.js',
  '/js/ui/formato.js',
  '/js/ui/graficos.js',
  '/js/ui/icones.js',
  '/js/ui/layout.js',
  '/js/ui/mapeador.js',
  '/js/ui/painel.js',
  '/js/ui/planilha.js',
  '/js/ui/preferencias.js',
  '/js/ui/privacidade.js',
  '/js/ui/regras.js',
  '/js/ui/sugestoes.js',
  '/js/ui/upload.js',
  '/vendor/fontes/geist-mono-variavel.woff2',
  '/vendor/fontes/geist-variavel.woff2',
  '/vendor/fontes/syne-700.woff2',
  '/icones/icone-192.png',
  '/icones/icone-512.png',
  '/icones/icone-mascara-512.png',
  '/vendor/fontes.css'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(guardarEssenciais().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(limparAntigos().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== METODO_LIDO || !daMesmaOrigem(pedido)) {
    return;
  }
  if (pedido.mode === 'navigate') {
    evento.respondWith(responderNavegacao(pedido));
    return;
  }

  if (ehImutavel(pedido)) {
    const revalidacao = revalidar(pedido);
    evento.waitUntil(revalidacao);
    evento.respondWith(responderDoCache(pedido, revalidacao));
    return;
  }

  evento.respondWith(responderDaRede(pedido));
});

function ehImutavel(pedido) {
  const caminho = new URL(pedido.url).pathname;
  return PASTAS_IMUTAVEIS.some((pasta) => caminho.startsWith(pasta));
}

async function guardarEssenciais() {
  const cache = await caches.open(NOME_DO_CACHE);
  await Promise.all(ESSENCIAIS.map((caminho) => cache.add(caminho).catch(() => null)));
}

async function limparAntigos() {
  const nomes = await caches.keys();
  await Promise.all(nomes.filter((nome) => nome !== NOME_DO_CACHE).map((nome) => caches.delete(nome)));
}

async function responderNavegacao(pedido) {
  const cache = await caches.open(NOME_DO_CACHE);
  try {
    const resposta = await fetch(pedido);
    await cache.put(PAGINA, resposta.clone());
    return resposta;
  } catch {
    const guardada = await cache.match(PAGINA);
    return guardada || Response.error();
  }
}

async function responderDoCache(pedido, revalidacao) {
  const cache = await caches.open(NOME_DO_CACHE);
  const guardada = await cache.match(pedido);
  if (guardada) {
    return guardada;
  }

  const atualizada = await revalidacao;
  return atualizada || Response.error();
}

async function responderDaRede(pedido) {
  const atualizada = await revalidar(pedido);
  if (atualizada) {
    return atualizada;
  }

  const cache = await caches.open(NOME_DO_CACHE);
  const guardada = await cache.match(pedido);
  return guardada || Response.error();
}

async function revalidar(pedido) {
  try {
    const cache = await caches.open(NOME_DO_CACHE);
    const resposta = await fetch(pedido);
    if (resposta.ok) {
      await cache.put(pedido, resposta.clone());
    }
    return resposta;
  } catch {
    return null;
  }
}

function daMesmaOrigem(pedido) {
  return new URL(pedido.url).origin === self.location.origin;
}
