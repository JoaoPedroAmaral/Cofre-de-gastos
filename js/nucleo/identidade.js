const SEPARADOR = '|';
const BASE_FNV = 2166136261;
const PRIMO_FNV = 16777619;
const SEGUNDA_SEMENTE = 2166136263;
const BASE_HEX = 16;
const DIGITOS_HEX = 8;

export function chaveDe(lancamento) {
  return [
    lancamento.banco,
    lancamento.conta,
    lancamento.data,
    lancamento.valor,
    lancamento.descricaoOriginal
  ].join(SEPARADOR);
}

export function idDe(lancamento, ocorrencia = 0) {
  const chave = chaveDe(lancamento);
  return `${resumir(chave, BASE_FNV)}${resumir(chave, SEGUNDA_SEMENTE)}-${ocorrencia}`;
}

function resumir(texto, semente) {
  let hash = semente;
  for (let posicao = 0; posicao < texto.length; posicao += 1) {
    hash ^= texto.charCodeAt(posicao);
    hash = Math.imul(hash, PRIMO_FNV);
  }
  return (hash >>> 0).toString(BASE_HEX).padStart(DIGITOS_HEX, '0');
}
