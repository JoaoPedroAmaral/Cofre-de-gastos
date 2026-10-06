import { mesDe } from './datas.js';
import { dataDeCompetencia } from './modelo.js';
import { normalizarTexto } from './normalizar.js';
import { tagsDe as tagsDoLancamento } from './tags.js';

const TEXTO_VAZIO = '';

export function aplicar(lancamentos, filtros, competencia) {
  return lancamentos.filter(
    (lancamento) =>
      combinaMes(lancamento, filtros.mes, competencia) &&
      combinaCampo(lancamento.banco, filtros.banco) &&
      combinaCampo(lancamento.categoria, filtros.categoria) &&
      combinaTag(lancamento, filtros.tag) &&
      combinaBusca(lancamento, filtros.busca)
  );
}

export function bancosDe(lancamentos) {
  return [...new Set(lancamentos.map((lancamento) => lancamento.banco))].sort();
}

export function tagsDe(lancamentos) {
  return [...new Set(lancamentos.flatMap(tagsDoLancamento))].sort();
}

function combinaMes(lancamento, mes, competencia) {
  if (!mes) {
    return true;
  }
  return mesDe(dataDeCompetencia(lancamento, competencia)) === mes;
}

function combinaCampo(valor, filtro) {
  if (!filtro) {
    return true;
  }
  return valor === filtro;
}

function combinaTag(lancamento, tag) {
  if (!tag) {
    return true;
  }
  return tagsDoLancamento(lancamento).includes(tag);
}

function combinaBusca(lancamento, busca) {
  if (!busca) {
    return true;
  }

  const procurado = normalizarTexto(busca);
  const alvos = [
    normalizarTexto(lancamento.descricaoOriginal),
    normalizarTexto(lancamento.comerciante),
    normalizarTexto(lancamento.categoria),
    normalizarTexto(lancamento.banco ?? TEXTO_VAZIO)
  ];

  return alvos.some((alvo) => alvo.includes(procurado));
}
