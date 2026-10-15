import { ABAS_REGRAS, CONTEXTOS_DE_PAGINA } from '../../nucleo/constantes.js';
import { criarRegra } from '../../nucleo/regras.js';
import { reclassificar } from '../../nucleo/classificar.js';
import { daPrimeiraPagina } from './recorte.js';

export function acrescentarRegra(atual, dados) {
  return comRegras({ ...atual, sugestao: null }, [...atual.regras, criarRegra(dados)]);
}

export function removerRegra(atual, id) {
  return comRegras(
    atual,
    atual.regras.filter((regra) => regra.id !== id)
  );
}

export function comRegras(atual, regras) {
  return { ...atual, regras, lancamentos: reclassificar(atual.lancamentos, regras) };
}

export function moverRegra(atual, { id, direcao }) {
  const posicao = atual.regras.findIndex((regra) => regra.id === id);
  const destino = posicao + direcao;

  if (posicao === -1 || destino < 0 || destino >= atual.regras.length) {
    return atual;
  }
  if (atual.regras[destino].origem !== atual.regras[posicao].origem) {
    return atual;
  }

  const regras = [...atual.regras];
  [regras[posicao], regras[destino]] = [regras[destino], regras[posicao]];
  return comRegras(atual, regras);
}

export function definirAbaRegras(atual, aba) {
  if (!Object.values(ABAS_REGRAS).includes(aba) || aba === atual.abaRegras) {
    return atual;
  }
  return daPrimeiraPagina({ ...atual, abaRegras: aba }, CONTEXTOS_DE_PAGINA.REGRAS);
}
