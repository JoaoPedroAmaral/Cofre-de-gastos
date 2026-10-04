import { gerarBytes } from './derivacao.js';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GRUPOS = 6;
const TAMANHO_GRUPO = 4;
const SEPARADOR = '-';
const NAO_ALFABETO = /[^A-Z2-9]/g;

export function gerarCodigo() {
  const bytes = gerarBytes(GRUPOS * TAMANHO_GRUPO);
  const letras = [...bytes].map((byte) => ALFABETO[byte % ALFABETO.length]);

  const grupos = [];
  for (let indice = 0; indice < GRUPOS; indice += 1) {
    grupos.push(letras.slice(indice * TAMANHO_GRUPO, (indice + 1) * TAMANHO_GRUPO).join(''));
  }

  return grupos.join(SEPARADOR);
}

export function normalizarCodigo(codigo) {
  return String(codigo ?? '')
    .toUpperCase()
    .replace(NAO_ALFABETO, '');
}

export function formatarCodigo(codigo) {
  const limpo = normalizarCodigo(codigo);
  const grupos = [];

  for (let inicio = 0; inicio < limpo.length; inicio += TAMANHO_GRUPO) {
    grupos.push(limpo.slice(inicio, inicio + TAMANHO_GRUPO));
  }

  return grupos.join(SEPARADOR);
}

export function codigoCompleto(codigo) {
  return normalizarCodigo(codigo).length === GRUPOS * TAMANHO_GRUPO;
}
