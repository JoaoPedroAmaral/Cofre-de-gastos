import { CATEGORIA_SEM_CLASSIFICACAO, TIPOS_IDENTIDADE, TIPOS_SUGESTAO } from '../../nucleo/constantes.js';
import { reavaliar } from '../../nucleo/naoGasto.js';
import { acrescentarTermo, candidatosDe, combina, identidadeVazia } from '../../nucleo/identidadePessoal.js';

const SEM_SUGESTAO = null;
const PRIMEIRO_ALVO = 0;

export function descartarSugestao(atual) {
  return atual.sugestao === SEM_SUGESTAO ? atual : { ...atual, sugestao: SEM_SUGESTAO };
}

export function definirCategoria(atual, { ids, categoria }) {
  const alvos = new Set(ids);
  if (alvos.size === 0 || !categoria) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, categoria, revisadoManual: true, regra: null };
  });

  return { ...atual, lancamentos, sugestao: sugestaoDeCategoria(lancamentos, ids, categoria) };
}

function sugestaoDeCategoria(lancamentos, ids, categoria) {
  if (categoria === CATEGORIA_SEM_CLASSIFICACAO) {
    return SEM_SUGESTAO;
  }

  const chaves = [
    ...new Set(
      lancamentos
        .filter((lancamento) => ids.includes(lancamento.id))
        .map((lancamento) => lancamento.comerciante)
        .filter(Boolean)
    )
  ];

  if (chaves.length !== 1) {
    return SEM_SUGESTAO;
  }
  return { tipo: TIPOS_SUGESTAO.CATEGORIA, id: ids[PRIMEIRO_ALVO], categoria, chave: chaves[PRIMEIRO_ALVO] };
}

export function definirForaDoTotal(atual, { ids, fora }) {
  const alvos = new Set(ids);
  if (alvos.size === 0) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, foraDoTotalManual: fora };
  });

  return { ...atual, lancamentos, sugestao: sugestaoDeIdentidade(atual, lancamentos, ids, fora) };
}

export function definirIdentidade(atual, identidade) {
  if (!identidade) {
    return atual;
  }
  return { ...atual, identidade, lancamentos: reavaliar(atual.lancamentos, identidade) };
}

function sugestaoDeIdentidade(atual, lancamentos, ids, fora) {
  if (fora !== true || ids.length !== 1) {
    return SEM_SUGESTAO;
  }

  const alvo = lancamentos.find((lancamento) => lancamento.id === ids[PRIMEIRO_ALVO]);
  if (!alvo || combina(alvo.descricaoOriginal, atual.identidade)) {
    return SEM_SUGESTAO;
  }

  const { nome } = candidatosDe(alvo.descricaoOriginal);
  if (!nome || !recebeuDe(lancamentos, nome)) {
    return SEM_SUGESTAO;
  }

  return { tipo: TIPOS_SUGESTAO.IDENTIDADE, id: alvo.id, termo: nome, campo: TIPOS_IDENTIDADE.NOMES };
}

function recebeuDe(lancamentos, nome) {
  const comoVoce = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, nome);
  return lancamentos.some(
    (lancamento) => lancamento.valor > 0 && combina(lancamento.descricaoOriginal, comoVoce)
  );
}
