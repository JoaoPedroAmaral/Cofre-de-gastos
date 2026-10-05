import { criarLancamento } from './modelo.js';
import { chaveComerciante, metodoDe, parcelaDe } from './normalizar.js';
import { motivoDe } from './naoGasto.js';

export function preparar(bruto, identidade) {
  const lancamento = criarLancamento(bruto);
  const descricao = lancamento.descricaoOriginal;

  return {
    ...lancamento,
    comerciante: chaveComerciante(descricao),
    metodo: metodoDe(descricao, lancamento.metodo),
    parcela: parcelaDe(descricao),
    naoGasto: motivoDe(descricao, identidade)
  };
}
