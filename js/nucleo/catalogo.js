import { CATEGORIA_SEM_CLASSIFICACAO } from './constantes.js';
import { normalizarTexto } from './normalizar.js';

const TEXTO_VAZIO = '';
const ESPACOS = /\s+/g;
const ESPACO = ' ';

export function normalizarNome(nome) {
  return normalizarTexto(nome).replace(ESPACOS, ESPACO).trim();
}

export function mesmoNome(um, outro) {
  return normalizarNome(um) === normalizarNome(outro);
}

export function existe(lista, nome) {
  return lista.some((item) => mesmoNome(item, nome));
}

export function ehEditavel(nome) {
  return !mesmoNome(nome, CATEGORIA_SEM_CLASSIFICACAO);
}

export function acrescentar(lista, nome) {
  const limpo = limpar(nome);
  if (limpo === TEXTO_VAZIO || existe(lista, limpo)) {
    return lista;
  }
  return [...lista.filter(ehEditavel), limpo, CATEGORIA_SEM_CLASSIFICACAO];
}

export function renomear(lista, antigo, novo) {
  const limpo = limpar(novo);
  if (limpo === TEXTO_VAZIO || !ehEditavel(antigo) || !existe(lista, antigo)) {
    return lista;
  }
  if (existe(lista, limpo) && !mesmoNome(antigo, limpo)) {
    return lista;
  }
  return lista.map((item) => (mesmoNome(item, antigo) ? limpo : item));
}

export function remover(lista, nome) {
  if (!ehEditavel(nome)) {
    return lista;
  }
  return lista.filter((item) => !mesmoNome(item, nome));
}

export function contarUso(lancamentos, nome) {
  return lancamentos.filter((lancamento) => mesmoNome(lancamento.categoria, nome)).length;
}

function limpar(nome) {
  return String(nome ?? TEXTO_VAZIO).replace(ESPACOS, ESPACO).trim();
}
