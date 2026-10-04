import { CATEGORIA_SEM_CLASSIFICACAO } from './constantes.js';
import { mesDe } from './datas.js';
import { dataDeCompetencia } from './modelo.js';
import { ehEntrada, ehGasto } from './naoGasto.js';

const TEXTO_VAZIO = '';
const LIMITE_COMERCIANTES = 10;

export function metricas(lancamentos) {
  const gastos = lancamentos.filter(ehGasto);
  const entradas = lancamentos.filter(ehEntrada);
  const foraDoTotal = lancamentos.filter((lancamento) => lancamento.naoGasto !== false);
  const semCategoria = gastos.filter((lancamento) => lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO);

  const totalGasto = somar(gastos);
  const totalEntradas = somar(entradas);
  const categorias = porCategoria(lancamentos);

  return {
    gasto: Math.abs(totalGasto),
    entradas: totalEntradas,
    saldo: totalEntradas + totalGasto,
    quantidade: gastos.length,
    ticketMedio: gastos.length === 0 ? 0 : Math.round(Math.abs(totalGasto) / gastos.length),
    maiorCategoria: categorias[0] ?? null,
    semCategoria: semCategoria.length,
    participacaoSemCategoria: participacao(somar(semCategoria), totalGasto),
    foraDoTotal: foraDoTotal.length,
    valorForaDoTotal: Math.abs(somar(foraDoTotal))
  };
}

export function porCategoria(lancamentos) {
  const gastos = lancamentos.filter(ehGasto);
  const total = somar(gastos);
  const mapa = new Map();

  gastos.forEach((lancamento) => {
    mapa.set(lancamento.categoria, (mapa.get(lancamento.categoria) ?? 0) + lancamento.valor);
  });

  return [...mapa.entries()]
    .map(([categoria, valor]) => ({
      categoria,
      total: Math.abs(valor),
      participacao: participacao(valor, total)
    }))
    .sort((a, b) => b.total - a.total);
}

export function porMes(lancamentos, competencia) {
  const mapa = new Map();

  lancamentos.filter(ehGasto).forEach((lancamento) => {
    const mes = mesDe(dataDeCompetencia(lancamento, competencia));
    mapa.set(mes, (mapa.get(mes) ?? 0) + lancamento.valor);
  });

  return [...mapa.entries()]
    .map(([mes, valor]) => ({ mes, total: Math.abs(valor) }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

export function porComerciante(lancamentos, limite = LIMITE_COMERCIANTES) {
  const mapa = new Map();

  lancamentos.filter(ehGasto).forEach((lancamento) => {
    const chave = lancamento.comerciante || lancamento.descricaoOriginal;
    mapa.set(chave, (mapa.get(chave) ?? 0) + lancamento.valor);
  });

  return [...mapa.entries()]
    .map(([comerciante, valor]) => ({ comerciante, total: Math.abs(valor) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

export function mesesDisponiveis(lancamentos, competencia) {
  const meses = new Set(
    lancamentos.map((lancamento) => mesDe(dataDeCompetencia(lancamento, competencia))).filter(Boolean)
  );
  return [...meses].sort();
}

export function mesAnterior(meses, mes) {
  const posicao = meses.indexOf(mes);
  return posicao > 0 ? meses[posicao - 1] : TEXTO_VAZIO;
}

export function mesSeguinte(meses, mes) {
  const posicao = meses.indexOf(mes);
  return posicao !== -1 && posicao < meses.length - 1 ? meses[posicao + 1] : TEXTO_VAZIO;
}

function somar(lancamentos) {
  return lancamentos.reduce((total, lancamento) => total + lancamento.valor, 0);
}

function participacao(parte, total) {
  if (total === 0) {
    return 0;
  }
  return Math.abs(parte) / Math.abs(total);
}
