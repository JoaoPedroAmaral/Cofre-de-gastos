import { detectarDelimitador } from './detector.js';

const ASPAS = '"';
const QUEBRA_LINHA = /\r\n|\n|\r/;
const DELIMITADOR_PADRAO = ';';
const TEXTO_VAZIO = '';

export function analisar(texto) {
  const delimitador = detectarDelimitador(texto) || DELIMITADOR_PADRAO;
  const linhas = texto
    .split(QUEBRA_LINHA)
    .filter((linha) => linha.trim() !== TEXTO_VAZIO)
    .map((linha) => dividir(linha, delimitador));

  if (linhas.length === 0) {
    return { cabecalho: [], linhas: [], delimitador };
  }

  return {
    cabecalho: linhas[0].map((celula) => celula.trim()),
    linhas: linhas.slice(1),
    delimitador
  };
}

function dividir(linha, delimitador) {
  const celulas = [];
  let atual = TEXTO_VAZIO;
  let dentroDeAspas = false;

  for (let posicao = 0; posicao < linha.length; posicao += 1) {
    const caractere = linha[posicao];

    if (caractere === ASPAS) {
      const proximo = linha[posicao + 1];
      if (dentroDeAspas && proximo === ASPAS) {
        atual += ASPAS;
        posicao += 1;
        continue;
      }
      dentroDeAspas = !dentroDeAspas;
      continue;
    }

    if (caractere === delimitador && !dentroDeAspas) {
      celulas.push(atual);
      atual = TEXTO_VAZIO;
      continue;
    }

    atual += caractere;
  }

  celulas.push(atual);
  return celulas;
}
