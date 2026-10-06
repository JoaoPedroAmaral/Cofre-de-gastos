const TEXTO_VAZIO = '';
const ESPACOS = /\s+/g;
const ESPACO = ' ';

export function normalizarTag(tag) {
  return String(tag ?? TEXTO_VAZIO).replace(ESPACOS, ESPACO).trim().toLowerCase();
}

export function tagsDe(lancamento) {
  const daRegra = lancamento.tags ?? [];
  const suas = lancamento.tagsManuais ?? [];
  return [...new Set([...daRegra, ...suas].map(normalizarTag).filter(Boolean))].sort();
}

export function acrescentar(lista, tag) {
  const limpa = normalizarTag(tag);
  if (limpa === TEXTO_VAZIO || lista.includes(limpa)) {
    return lista;
  }
  return [...lista, limpa].sort();
}

export function remover(lista, tag) {
  const limpa = normalizarTag(tag);
  if (!lista.includes(limpa)) {
    return lista;
  }
  return lista.filter((item) => item !== limpa);
}

export function renomear(lista, de, para) {
  const antiga = normalizarTag(de);
  const nova = normalizarTag(para);

  if (nova === TEXTO_VAZIO || !lista.includes(antiga)) {
    return lista;
  }
  return acrescentar(remover(lista, antiga), nova);
}
