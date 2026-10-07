import { descrever, esperar, isso } from '../runner.js';
import { aplicar, bancosDe, tagsDe } from '../../js/nucleo/filtrar.js';
import {
  metricas,
  mesAnterior,
  mesSeguinte,
  mesesDisponiveis,
  porCategoria,
  porComerciante,
  porMes
} from '../../js/nucleo/agregar.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { ABAS_PLANILHA, COMPETENCIA, MOTIVOS_NAO_GASTO, TEMAS } from '../../js/nucleo/constantes.js';
import { telaPainel } from '../../js/ui/painel.js';

function gasto(descricao, valor, data, campos = {}) {
  return {
    ...preparar({
      data,
      valor,
      descricaoOriginal: descricao,
      banco: 'Itau',
      arquivo: 'extrato.ofx'
    }),
    categoria: campos.categoria ?? 'Outros',
    tags: campos.tags ?? [],
    ...campos
  };
}

const conjunto = [
  gasto('MERCADO A', '-100,00', '05/09/2026', { categoria: 'Mercado' }),
  gasto('MERCADO B', '-200,00', '10/09/2026', { categoria: 'Mercado' }),
  gasto('UBER X', '-50,00', '12/09/2026', { categoria: 'Transporte', banco: 'Nubank', tags: ['trabalho'] }),
  gasto('SALARIO', '3000,00', '05/09/2026', { categoria: 'Outros' }),
  gasto('PAG FATURA', '-900,00', '28/09/2026', { naoGasto: MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA }),
  gasto('MERCADO C', '-150,00', '05/08/2026', { categoria: 'Mercado' })
];

function estadoCom(lancamentos, mes = '') {
  return {
    tela: 'painel',
    aba: ABAS_PLANILHA.TODOS,
    tema: TEMAS.SISTEMA,
    competencia: COMPETENCIA.COMPRA,
    filtros: { mes, banco: '', categoria: '', tag: '', busca: '' },
    ordenacao: { campo: 'data', ascendente: false },
    selecao: [],
    sugestao: null,
    lancamentos,
    regras: [],
    categorias: ['Mercado', 'Transporte', 'Outros'],
    tags: [],
    identidade: { nomes: [], documentos: [], contas: [] }
  };
}

function barrasDaEvolucao(estado) {
  return telaPainel(estado).querySelectorAll('.barras .barra-mes').length;
}

const TODO_O_PERIODO = '';
const SEM_DESTINO = null;

descrever('Métricas do painel', () => {
  isso('soma apenas os gastos de verdade', () => {
    esperar(metricas(conjunto).gasto).igual(50000);
  });

  isso('soma as entradas separadamente', () => {
    esperar(metricas(conjunto).entradas).igual(300000);
  });

  isso('calcula o saldo do periodo', () => {
    esperar(metricas(conjunto).saldo).igual(250000);
  });

  isso('calcula o ticket medio sobre os gastos', () => {
    esperar(metricas(conjunto).ticketMedio).igual(12500);
  });

  isso('informa a maior categoria', () => {
    esperar(metricas(conjunto).maiorCategoria.categoria).igual('Mercado');
  });

  isso('conta e mede o que esta fora do total', () => {
    const resumo = metricas(conjunto);
    esperar(resumo.foraDoTotal).igual(1);
    esperar(resumo.valorForaDoTotal).igual(90000);
  });

  isso('mede a participacao do que esta sem categoria', () => {
    const comPendente = [...conjunto, gasto('LOJA X', '-50,00', '15/09/2026', { categoria: 'Não categorizado' })];
    const resumo = metricas(comPendente);
    esperar(resumo.semCategoria).igual(1);
    esperar(Math.round(resumo.participacaoSemCategoria * 100)).igual(9);
  });

  isso('nao quebra com lista vazia', () => {
    const resumo = metricas([]);
    esperar(resumo.gasto).igual(0);
    esperar(resumo.ticketMedio).igual(0);
    esperar(resumo.maiorCategoria).igual(null);
  });
});

descrever('Agregações do painel', () => {
  isso('agrupa por categoria em ordem decrescente', () => {
    const categorias = porCategoria(conjunto);
    esperar(categorias[0].categoria).igual('Mercado');
    esperar(categorias[0].total).igual(45000);
  });

  isso('a soma das categorias fecha o total gasto', () => {
    const total = porCategoria(conjunto).reduce((soma, fatia) => soma + fatia.total, 0);
    esperar(total).igual(metricas(conjunto).gasto);
  });

  isso('a participacao das categorias soma um inteiro', () => {
    const soma = porCategoria(conjunto).reduce((total, fatia) => total + fatia.participacao, 0);
    esperar(Math.round(soma)).igual(1);
  });

  isso('agrupa por mes em ordem cronologica', () => {
    const meses = porMes(conjunto, COMPETENCIA.COMPRA);
    esperar(meses[0].mes).igual('2026-08');
    esperar(meses[1].mes).igual('2026-09');
  });

  isso('lista os meses disponiveis', () => {
    esperar(mesesDisponiveis(conjunto, COMPETENCIA.COMPRA)).igual(['2026-08', '2026-09']);
  });

  isso('navega para o mes anterior e seguinte', () => {
    const meses = ['2026-08', '2026-09'];
    esperar(mesAnterior(meses, '2026-09')).igual('2026-08');
    esperar(mesSeguinte(meses, '2026-08')).igual('2026-09');
  });

  isso('do mes mais recente, avancar abre o periodo inteiro', () => {
    esperar(mesSeguinte(['2026-08', '2026-09'], '2026-09')).igual(TODO_O_PERIODO);
  });

  isso('do periodo inteiro, voltar cai no mes mais recente', () => {
    esperar(mesAnterior(['2026-08', '2026-09'], TODO_O_PERIODO)).igual('2026-09');
  });

  isso('o periodo inteiro nao e beco sem saida', () => {
    const meses = ['2026-07', '2026-08', '2026-09'];
    const volta = mesAnterior(meses, TODO_O_PERIODO);

    esperar(volta).diferenteDe(SEM_DESTINO);
    esperar(meses.includes(volta)).verdadeiro();
  });

  isso('do mes mais antigo nao ha para onde voltar', () => {
    esperar(mesAnterior(['2026-08', '2026-09'], '2026-08')).igual(SEM_DESTINO);
  });

  isso('do periodo inteiro nao ha para onde avancar', () => {
    esperar(mesSeguinte(['2026-08', '2026-09'], TODO_O_PERIODO)).igual(SEM_DESTINO);
  });

  isso('com um mes so, o mes e o periodo inteiro se alcancam', () => {
    const meses = ['2026-09'];
    esperar(mesSeguinte(meses, '2026-09')).igual(TODO_O_PERIODO);
    esperar(mesAnterior(meses, TODO_O_PERIODO)).igual('2026-09');
  });

  isso('percorrer de ponta a ponta passa por todas as posicoes, sem repetir', () => {
    const meses = ['2026-07', '2026-08', '2026-09'];
    const caminho = [meses[0]];
    let atual = meses[0];

    while (mesSeguinte(meses, atual) !== SEM_DESTINO) {
      atual = mesSeguinte(meses, atual);
      caminho.push(atual);
    }

    esperar(caminho).igual(['2026-07', '2026-08', '2026-09', TODO_O_PERIODO]);
  });

  isso('e o caminho de volta refaz o mesmo trajeto', () => {
    const meses = ['2026-07', '2026-08', '2026-09'];
    const caminho = [TODO_O_PERIODO];
    let atual = TODO_O_PERIODO;

    while (mesAnterior(meses, atual) !== SEM_DESTINO) {
      atual = mesAnterior(meses, atual);
      caminho.push(atual);
    }

    esperar(caminho).igual([TODO_O_PERIODO, '2026-09', '2026-08', '2026-07']);
  });

  isso('mes que nao existe na lista nao leva a lugar nenhum', () => {
    esperar(mesAnterior(['2026-08'], '2025-01')).igual(SEM_DESTINO);
    esperar(mesSeguinte(['2026-08'], '2025-01')).igual(SEM_DESTINO);
  });

  isso('o grafico de evolucao aparece com um mes so importado', () => {
    const umMes = conjunto.filter((lancamento) => lancamento.data.startsWith('2026-09'));

    esperar(porMes(umMes, COMPETENCIA.COMPRA).length).igual(1);
    esperar(barrasDaEvolucao(estadoCom(umMes))).igual(1);
  });

  isso('o grafico de evolucao continua aparecendo com varios meses', () => {
    esperar(barrasDaEvolucao(estadoCom(conjunto))).igual(2);
  });

  isso('com um mes so, o painel nao esconde o bloco de evolucao', () => {
    const umMes = conjunto.filter((lancamento) => lancamento.data.startsWith('2026-09'));

    esperar(telaPainel(estadoCom(umMes)).textContent).contem('Últimos meses');
  });

  isso('agrupa os maiores comerciantes', () => {
    const topo = porComerciante(conjunto, 2);
    esperar(topo.length).igual(2);
    esperar(topo[0].total).igual(20000);
  });

  isso('usa a data da fatura quando o regime e de caixa', () => {
    const compra = {
      ...gasto('COMPRA CARTAO', '-100,00', '28/09/2026', { categoria: 'Compras' }),
      dataFatura: '2026-10-10'
    };
    esperar(porMes([compra], COMPETENCIA.FATURA)[0].mes).igual('2026-10');
    esperar(porMes([compra], COMPETENCIA.COMPRA)[0].mes).igual('2026-09');
  });
});

descrever('Filtros globais', () => {
  isso('filtra por mes', () => {
    const resultado = aplicar(conjunto, { mes: '2026-08' }, COMPETENCIA.COMPRA);
    esperar(resultado.length).igual(1);
  });

  isso('filtra por banco', () => {
    esperar(aplicar(conjunto, { banco: 'Nubank' }, COMPETENCIA.COMPRA).length).igual(1);
  });

  isso('filtra por categoria', () => {
    esperar(aplicar(conjunto, { categoria: 'Mercado' }, COMPETENCIA.COMPRA).length).igual(3);
  });

  isso('filtra por tag', () => {
    esperar(aplicar(conjunto, { tag: 'trabalho' }, COMPETENCIA.COMPRA).length).igual(1);
  });

  isso('combina filtros por intersecao, nao por uniao', () => {
    const resultado = aplicar(conjunto, { mes: '2026-09', categoria: 'Mercado' }, COMPETENCIA.COMPRA);
    esperar(resultado.length).igual(2);
  });

  isso('busca ignorando acento e caixa', () => {
    const comAcento = [gasto('PADARIA SÃO JOÃO', '-10,00', '05/09/2026')];
    esperar(aplicar(comAcento, { busca: 'sao joao' }, COMPETENCIA.COMPRA).length).igual(1);
  });

  isso('busca tambem pela chave de comerciante', () => {
    const lancamentos = [gasto('PAGBANK*JL ALIMENTOS', '-10,00', '05/09/2026')];
    esperar(aplicar(lancamentos, { busca: 'JL ALIMENTOS' }, COMPETENCIA.COMPRA).length).igual(1);
  });

  isso('devolve tudo quando nao ha filtro', () => {
    esperar(aplicar(conjunto, {}, COMPETENCIA.COMPRA).length).igual(conjunto.length);
  });

  isso('devolve lista vazia sem quebrar as metricas', () => {
    const vazio = aplicar(conjunto, { categoria: 'Academia' }, COMPETENCIA.COMPRA);
    esperar(vazio.length).igual(0);
    esperar(metricas(vazio).gasto).igual(0);
  });

  isso('lista os bancos presentes', () => {
    esperar(bancosDe(conjunto)).igual(['Itau', 'Nubank']);
  });

  isso('lista as tags presentes', () => {
    esperar(tagsDe(conjunto)).igual(['trabalho']);
  });
});
