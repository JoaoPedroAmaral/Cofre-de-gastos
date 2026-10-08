const PRIMEIRA_PAGINA = 1;
const MINIMO_DE_PAGINAS = 1;
const SEM_TAMANHO = 0;

export function totalDePaginas(quantidade, tamanho) {
  if (tamanho <= SEM_TAMANHO) {
    return MINIMO_DE_PAGINAS;
  }
  return Math.max(MINIMO_DE_PAGINAS, Math.ceil(quantidade / tamanho));
}

export function paginaValida(pagina, quantidade, tamanho) {
  const total = totalDePaginas(quantidade, tamanho);
  if (!Number.isFinite(pagina)) {
    return PRIMEIRA_PAGINA;
  }
  return Math.min(Math.max(Math.trunc(pagina), PRIMEIRA_PAGINA), total);
}

export function fatiar(itens, pagina, tamanho) {
  if (tamanho <= SEM_TAMANHO) {
    return itens;
  }

  const atual = paginaValida(pagina, itens.length, tamanho);
  const inicio = (atual - PRIMEIRA_PAGINA) * tamanho;
  return itens.slice(inicio, inicio + tamanho);
}

export function precisaPaginar(quantidade, tamanho) {
  return tamanho > SEM_TAMANHO && quantidade > tamanho;
}
