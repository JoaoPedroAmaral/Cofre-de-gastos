const SEPARADOR = '|';
const PREFIXO_IDENTIFICADOR = 'id';
const MINIMO_DO_IDENTIFICADOR = 8;
const BASE_FNV = 2166136261;
const PRIMO_FNV = 16777619;
const SEGUNDA_SEMENTE = 2166136263;
const BASE_HEX = 16;
const DIGITOS_HEX = 8;
const TEXTO_VAZIO = '';

export function chaveDe(lancamento) {
  return chaveDoIdentificador(lancamento) ?? chaveDoTexto(lancamento);
}

export function chavesDe(lancamento) {
  const porIdentificador = chaveDoIdentificador(lancamento);
  const porTexto = chaveDoTexto(lancamento);
  return porIdentificador ? [porIdentificador, porTexto] : [porTexto];
}

export function idDe(lancamento, ocorrencia = 0) {
  const chave = chaveDe(lancamento);
  return `${resumir(chave, BASE_FNV)}${resumir(chave, SEGUNDA_SEMENTE)}-${ocorrencia}`;
}

function chaveDoIdentificador(lancamento) {
  const identificador = String(lancamento.identificadorBanco ?? TEXTO_VAZIO).trim();
  if (identificador.length < MINIMO_DO_IDENTIFICADOR) {
    return null;
  }
  return [PREFIXO_IDENTIFICADOR, identificador].join(SEPARADOR);
}

function chaveDoTexto(lancamento) {
  return [
    lancamento.banco,
    lancamento.conta,
    lancamento.data,
    lancamento.valor,
    lancamento.descricaoOriginal
  ].join(SEPARADOR);
}

function resumir(texto, semente) {
  let hash = semente;
  for (let posicao = 0; posicao < texto.length; posicao += 1) {
    hash ^= texto.charCodeAt(posicao);
    hash = Math.imul(hash, PRIMO_FNV);
  }
  return (hash >>> 0).toString(BASE_HEX).padStart(DIGITOS_HEX, '0');
}
