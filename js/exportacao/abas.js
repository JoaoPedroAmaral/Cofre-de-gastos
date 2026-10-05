import { ORIGENS_REGRA, ROTULOS_METODO } from '../nucleo/constantes.js';
import { porCategoria, porMes } from '../nucleo/agregar.js';
import { estaForaDoTotal, rotuloForaDoTotal } from '../nucleo/naoGasto.js';
import { ROTULOS_OPERADOR } from '../nucleo/regras.js';
import { deCentavos } from '../nucleo/dinheiro.js';
import { dataDeCompetencia } from '../nucleo/modelo.js';

const TEXTO_VAZIO = '';
const SEPARADOR_TAGS = ', ';
const SIM = 'sim';
const NAO = 'não';

export const NOMES_ABAS = Object.freeze({
  TRANSACOES: 'Transações',
  CATEGORIAS: 'Resumo por Categoria',
  MESES: 'Resumo por Mês',
  REGRAS: 'Regras'
});

export function montarAbas(lancamentos, regras, competencia) {
  return [
    { nome: NOMES_ABAS.TRANSACOES, linhas: abaTransacoes(lancamentos, competencia) },
    { nome: NOMES_ABAS.CATEGORIAS, linhas: abaCategorias(lancamentos) },
    { nome: NOMES_ABAS.MESES, linhas: abaMeses(lancamentos, competencia) },
    { nome: NOMES_ABAS.REGRAS, linhas: abaRegras(regrasRelevantes(lancamentos, regras)) }
  ];
}

function regrasRelevantes(lancamentos, regras) {
  const aplicadas = new Set(lancamentos.map((lancamento) => lancamento.regra).filter(Boolean));
  return regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO || aplicadas.has(regra.id));
}

function abaTransacoes(lancamentos, competencia) {
  const cabecalho = [
    'Data',
    'Competência',
    'Descrição',
    'Estabelecimento',
    'Categoria',
    'Tags',
    'Banco',
    'Método',
    'Parcela',
    'Valor',
    'Conta no total',
    'Motivo fora do total'
  ];

  const linhas = lancamentos.map((lancamento) => [
    lancamento.data,
    dataDeCompetencia(lancamento, competencia),
    lancamento.descricaoOriginal,
    lancamento.comerciante,
    lancamento.categoria,
    lancamento.tags.join(SEPARADOR_TAGS),
    lancamento.banco,
    ROTULOS_METODO[lancamento.metodo] ?? lancamento.metodo,
    lancamento.parcela ? `${lancamento.parcela.atual}/${lancamento.parcela.total}` : TEXTO_VAZIO,
    deCentavos(lancamento.valor),
    estaForaDoTotal(lancamento) ? NAO : SIM,
    rotuloForaDoTotal(lancamento)
  ]);

  return [cabecalho, ...linhas];
}

function abaCategorias(lancamentos) {
  const cabecalho = ['Categoria', 'Total', 'Participação'];
  const linhas = porCategoria(lancamentos).map((fatia) => [
    fatia.categoria,
    deCentavos(-fatia.total),
    fatia.participacao
  ]);

  return [cabecalho, ...linhas];
}

function abaMeses(lancamentos, competencia) {
  const cabecalho = ['Mês', 'Total'];
  const linhas = porMes(lancamentos, competencia).map((item) => [item.mes, deCentavos(-item.total)]);

  return [cabecalho, ...linhas];
}

function abaRegras(regras) {
  const cabecalho = ['Ordem', 'Origem', 'Operador', 'Termo', 'Categoria', 'Tags'];
  const linhas = regras.map((regra, posicao) => [
    posicao + 1,
    regra.origem === ORIGENS_REGRA.USUARIO ? 'sua regra' : 'dicionário',
    ROTULOS_OPERADOR[regra.operador] ?? regra.operador,
    regra.termo,
    regra.categoria,
    regra.tags.join(SEPARADOR_TAGS)
  ]);

  return [cabecalho, ...linhas];
}
