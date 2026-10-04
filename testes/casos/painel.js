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
import { COMPETENCIA, MOTIVOS_NAO_GASTO } from '../../js/nucleo/constantes.js';

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
    esperar(mesSeguinte(meses, '2026-09')).igual('');
    esperar(mesAnterior(meses, '2026-08')).igual('');
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
