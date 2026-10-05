import { carregarPdfJs } from '../carregadores/pdfjs.js';
import { agruparEmLinhas } from './faturas/layout.js';
import { emissorDe } from './faturas/emissores.js';
import { lerFatura } from './faturas/lancamentos.js';
import { descobrirReferencia } from './faturas/periodo.js';
import { BANCO as BANCO_PICPAY, CONTA as CONTA_PICPAY, ehExtratoPicpay, lerExtratoPicpay } from './extratos/picpay.js';

export const MENSAGENS_PDF = Object.freeze({
  SEM_TEXTO:
    'Este PDF não tem texto extraível. Faturas digitalizadas ou em imagem não são lidas; exporte a fatura em CSV, OFX ou XLSX.',
  SEM_REFERENCIA:
    'Não encontrei a data de vencimento da fatura, e sem ela o ano de cada compra seria chute. Exporte a fatura em outro formato.',
  SEM_LANCAMENTOS:
    'Nenhuma linha de lançamento foi reconhecida nesta fatura.'
});

const CONTA_FATURA = 'Cartão de crédito';
const TEXTO_VAZIO = '';
const PRIMEIRA_PAGINA = 1;

export async function extrairPaginas(bytes) {
  const pdfjs = await carregarPdfJs();
  const documento = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: false,
    useWorkerFetch: false,
    disableFontFace: true
  }).promise;

  try {
    const paginas = [];
    for (let numero = PRIMEIRA_PAGINA; numero <= documento.numPages; numero += 1) {
      const pagina = await documento.getPage(numero);
      const conteudo = await pagina.getTextContent();
      paginas.push({ numero, itens: conteudo.items });
      pagina.cleanup();
    }
    return paginas;
  } finally {
    await documento.destroy();
  }
}

export async function extrairLinhas(bytes) {
  const paginas = await extrairPaginas(bytes);
  return paginas.flatMap((pagina) => agruparEmLinhas(pagina.itens));
}

export async function analisar(bytes, arquivo) {
  const paginas = await extrairPaginas(bytes);
  const linhas = paginas.flatMap((pagina) => agruparEmLinhas(pagina.itens));
  if (linhas.length === 0) {
    throw new Error(MENSAGENS_PDF.SEM_TEXTO);
  }

  if (ehExtratoPicpay(linhas)) {
    return lerExtrato(paginas, arquivo);
  }

  const referencia = descobrirReferencia(linhas);
  if (!referencia) {
    throw new Error(MENSAGENS_PDF.SEM_REFERENCIA);
  }

  const banco = emissorDe(linhas);
  const { lancamentos, pendencias } = lerFatura(linhas, referencia, {
    banco,
    conta: CONTA_FATURA,
    dataFatura: referencia,
    arquivo
  });

  return { brutos: lancamentos, pendencias, banco, referencia };
}

function lerExtrato(paginas, arquivo) {
  const { lancamentos, pendencias } = lerExtratoPicpay(paginas, {
    banco: BANCO_PICPAY,
    conta: CONTA_PICPAY,
    arquivo
  });

  return { brutos: lancamentos, pendencias, banco: BANCO_PICPAY, referencia: TEXTO_VAZIO };
}
