const ASPAS = '"';
const TEXTO_VAZIO = '';

export function dividirLinha(linha, delimitador) {
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
