import { detectarDelimitador } from './detector.js';
import { dividirLinha } from './linhaCsv.js';

const QUEBRA_LINHA = /\r\n|\n|\r/;
const DELIMITADOR_PADRAO = ';';
const TEXTO_VAZIO = '';

export function analisar(texto) {
  const delimitador = detectarDelimitador(texto) || DELIMITADOR_PADRAO;
  const linhas = texto
    .split(QUEBRA_LINHA)
    .filter((linha) => linha.trim() !== TEXTO_VAZIO)
    .map((linha) => dividirLinha(linha, delimitador));

  if (linhas.length === 0) {
    return { cabecalho: [], linhas: [], delimitador };
  }

  return {
    cabecalho: linhas[0].map((celula) => celula.trim()),
    linhas: linhas.slice(1),
    delimitador
  };
}
