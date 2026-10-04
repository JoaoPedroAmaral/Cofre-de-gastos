import { DERIVACAO } from '../nucleo/constantes.js';
import { deTexto } from './bytes.js';

const ALGORITMO_DERIVACAO = 'PBKDF2';
const USO_DERIVACAO = ['deriveKey'];
const USO_CIFRA = ['encrypt', 'decrypt'];

export function gerarBytes(quantidade) {
  return crypto.getRandomValues(new Uint8Array(quantidade));
}

export function gerarSalt() {
  return gerarBytes(DERIVACAO.TAMANHO_SALT_BYTES);
}

export function gerarIv() {
  return gerarBytes(DERIVACAO.TAMANHO_IV_BYTES);
}

export async function derivarChave(segredo, salt) {
  const base = await crypto.subtle.importKey('raw', deTexto(segredo), ALGORITMO_DERIVACAO, false, USO_DERIVACAO);

  return crypto.subtle.deriveKey(
    {
      name: ALGORITMO_DERIVACAO,
      salt,
      iterations: DERIVACAO.ITERACOES_PBKDF2,
      hash: DERIVACAO.HASH_PBKDF2
    },
    base,
    { name: DERIVACAO.ALGORITMO_CIFRA, length: DERIVACAO.TAMANHO_CHAVE_BITS },
    false,
    USO_CIFRA
  );
}

export function importarChaveDeDados(bytes) {
  return crypto.subtle.importKey('raw', bytes, DERIVACAO.ALGORITMO_CIFRA, false, USO_CIFRA);
}
