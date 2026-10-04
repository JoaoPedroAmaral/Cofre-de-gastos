import { CATEGORIA_SEM_CLASSIFICACAO } from './constantes.js';
import { avaliar, ordenar } from './regras.js';

export function classificar(lancamento, regrasOrdenadas) {
  if (lancamento.revisadoManual) {
    return lancamento;
  }

  const vencedora = regrasOrdenadas.find((regra) => avaliar(regra, lancamento));
  if (!vencedora) {
    return { ...lancamento, categoria: CATEGORIA_SEM_CLASSIFICACAO, tags: [], regra: null };
  }

  return {
    ...lancamento,
    categoria: vencedora.categoria,
    tags: [...vencedora.tags],
    regra: vencedora.id
  };
}

export function reclassificar(lancamentos, regras) {
  const ordenadas = ordenar(regras);
  return lancamentos.map((lancamento) => classificar(lancamento, ordenadas));
}
