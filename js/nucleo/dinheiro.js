import { CENTAVOS_POR_UNIDADE } from './constantes.js';

const CARACTERES_IGNORADOS = /[\s R$]/gi;
const APENAS_NUMERO = /^-?\d+$/;
const SEPARADORES = /[.,]/g;
const CASAS_DECIMAIS = 2;
const MENOS_UNICODE = '−';
const TRACO_CURTO = '–';
const TRACO_LONGO = '—';
const SINAIS_NEGATIVOS = ['-', MENOS_UNICODE, TRACO_CURTO, TRACO_LONGO, '(', ')'];
const SINAIS_REMOVIVEIS = /[-−–—()+]/g;
const TEXTO_VAZIO = '';

export function paraCentavos(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? Math.round(valor * CENTAVOS_POR_UNIDADE) : null;
  }
  if (typeof valor !== 'string') {
    return null;
  }

  const limpo = valor.replace(CARACTERES_IGNORADOS, TEXTO_VAZIO);
  if (limpo === TEXTO_VAZIO) {
    return null;
  }

  const negativo = ehNegativo(limpo);
  const digitos = extrairDigitos(limpo);
  if (digitos === null) {
    return null;
  }

  return negativo ? -digitos : digitos;
}

export function deCentavos(centavos) {
  return centavos / CENTAVOS_POR_UNIDADE;
}

export function somar(centavos) {
  return centavos.reduce((total, valor) => total + valor, 0);
}

function ehNegativo(texto) {
  return SINAIS_NEGATIVOS.some((sinal) => texto.includes(sinal));
}

function extrairDigitos(texto) {
  const semSinal = texto.replace(SINAIS_REMOVIVEIS, TEXTO_VAZIO);
  if (semSinal === TEXTO_VAZIO) {
    return null;
  }
  if (APENAS_NUMERO.test(semSinal)) {
    return Number(semSinal) * CENTAVOS_POR_UNIDADE;
  }

  const posicaoDecimal = posicaoSeparadorDecimal(semSinal);
  if (posicaoDecimal === -1) {
    const inteiro = semSinal.replace(SEPARADORES, TEXTO_VAZIO);
    return APENAS_NUMERO.test(inteiro) ? Number(inteiro) * CENTAVOS_POR_UNIDADE : null;
  }

  const inteiro = semSinal.slice(0, posicaoDecimal).replace(SEPARADORES, TEXTO_VAZIO);
  const decimal = semSinal.slice(posicaoDecimal + 1).replace(SEPARADORES, TEXTO_VAZIO);
  const normalizado = `${inteiro || '0'}.${decimal}`;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * CENTAVOS_POR_UNIDADE) : null;
}

function posicaoSeparadorDecimal(texto) {
  const ultimaVirgula = texto.lastIndexOf(',');
  const ultimoPonto = texto.lastIndexOf('.');
  const posicao = Math.max(ultimaVirgula, ultimoPonto);

  if (posicao === -1) {
    return -1;
  }

  const casas = texto.length - posicao - 1;
  if (casas === CASAS_DECIMAIS || casas === 1) {
    return posicao;
  }
  return -1;
}
