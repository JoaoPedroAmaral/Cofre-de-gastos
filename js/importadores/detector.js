export const FORMATOS = Object.freeze({
  OFX: 'ofx',
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf',
  DESCONHECIDO: 'desconhecido'
});

const ASSINATURA_ZIP = [0x50, 0x4b];
const ASSINATURA_PDF = [0x25, 0x50, 0x44, 0x46];
const MARCAS_OFX = ['OFXHEADER', '<OFX>', '<STMTTRN>', '<OFX '];
const LINHAS_INSPECIONADAS = 10;
const DELIMITADORES = [';', ',', '\t', '|'];
const QUEBRA_LINHA = /\r?\n/;

export function detectar(bytes, texto) {
  if (combina(bytes, ASSINATURA_ZIP)) {
    return FORMATOS.XLSX;
  }
  if (combina(bytes, ASSINATURA_PDF)) {
    return FORMATOS.PDF;
  }
  if (ehOfx(texto)) {
    return FORMATOS.OFX;
  }
  if (detectarDelimitador(texto)) {
    return FORMATOS.CSV;
  }
  return FORMATOS.DESCONHECIDO;
}

export function detectarDelimitador(texto) {
  const linhas = linhasUteis(texto);
  if (linhas.length === 0) {
    return null;
  }

  const pontuacoes = DELIMITADORES.map((delimitador) => ({
    delimitador,
    ocorrencias: contarConsistentes(linhas, delimitador)
  }));

  const melhor = pontuacoes.reduce((maior, atual) =>
    atual.ocorrencias > maior.ocorrencias ? atual : maior
  );

  return melhor.ocorrencias > 0 ? melhor.delimitador : null;
}

function ehOfx(texto) {
  const inicio = texto.slice(0, 2048).toUpperCase();
  return MARCAS_OFX.some((marca) => inicio.includes(marca));
}

function linhasUteis(texto) {
  return texto
    .split(QUEBRA_LINHA)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    .slice(0, LINHAS_INSPECIONADAS);
}

function contarConsistentes(linhas, delimitador) {
  const contagens = linhas.map((linha) => linha.split(delimitador).length - 1);
  const primeira = contagens[0];
  if (primeira === 0) {
    return 0;
  }
  const consistente = contagens.every((contagem) => contagem === primeira);
  return consistente ? primeira : 0;
}

function combina(bytes, assinatura) {
  if (!bytes || bytes.length < assinatura.length) {
    return false;
  }
  return assinatura.every((byte, indice) => bytes[indice] === byte);
}
