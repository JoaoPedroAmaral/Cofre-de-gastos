const FRONTEIRA = '\\b';
const CARACTERES_DE_REGEX = /[.*+?^${}()|[\]\\]/g;
const COMECA_SEM_LETRA = /^\W/;
const TERMINA_SEM_LETRA = /\W$/;
const TEXTO_VAZIO = '';
const ESCAPE = '\\$&';

const expressoes = new Map();

export function contemTermo(texto, termo) {
  if (termo === TEXTO_VAZIO) {
    return false;
  }
  return expressaoDe(termo).test(texto);
}

function expressaoDe(termo) {
  const guardada = expressoes.get(termo);
  if (guardada) {
    return guardada;
  }

  const inicio = COMECA_SEM_LETRA.test(termo) ? TEXTO_VAZIO : FRONTEIRA;
  const fim = TERMINA_SEM_LETRA.test(termo) ? TEXTO_VAZIO : FRONTEIRA;
  const expressao = new RegExp(`${inicio}${escapar(termo)}${fim}`);

  expressoes.set(termo, expressao);
  return expressao;
}

function escapar(termo) {
  return termo.replace(CARACTERES_DE_REGEX, ESCAPE);
}
