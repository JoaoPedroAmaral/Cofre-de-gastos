import { carregarPdfJs } from '../carregadores/pdfjs.js';
import { agruparEmLinhas } from './faturas/layout.js';
import { emissorDe } from './faturas/emissores.js';
import { lerFatura } from './faturas/lancamentos.js';
import { descobrirReferencia } from './faturas/periodo.js';

export const MENSAGENS_PDF = Object.freeze({
  SEM_TEXTO:
    'Este PDF não tem texto extraível. Faturas digitalizadas ou em imagem não são lidas; exporte a fatura em CSV, OFX ou XLSX.',
  SEM_REFERENCIA:
    'Não encontrei a data de vencimento da fatura, e sem ela o ano de cada compra seria chute. Exporte a fatura em outro formato.',
  SEM_LANCAMENTOS:
    'Nenhuma linha de lançamento foi reconhecida nesta fatura.'
});

const CONTA_FATURA = 'Cartão de crédito';
const PRIMEIRA_PAGINA = 1;

export async function extrairLinhas(bytes) {
  const pdfjs = await carregarPdfJs();
  const documento = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: false,
    useWorkerFetch: false,
    disableFontFace: true
  }).promise;

  try {
    const linhas = [];
    for (let numero = PRIMEIRA_PAGINA; numero <= documento.numPages; numero += 1) {
      const pagina = await documento.getPage(numero);
      const conteudo = await pagina.getTextContent();
      linhas.push(...agruparEmLinhas(conteudo.items));
      pagina.cleanup();
    }
    return linhas;
  } finally {
    await documento.destroy();
  }
}

export async function analisar(bytes, arquivo) {
  const linhas = await extrairLinhas(bytes);
  if (linhas.length === 0) {
    throw new Error(MENSAGENS_PDF.SEM_TEXTO);
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
