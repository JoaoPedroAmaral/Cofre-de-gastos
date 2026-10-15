import { ACOES, CATEGORIAS_PADRAO } from '../js/nucleo/constantes.js';
import { despachar, obter, reiniciar } from '../js/estado/store.js';
import { preparar } from '../js/nucleo/preparar.js';

const MESES_DO_ANO = 12;
const DIAS_DO_CICLO = 27;
const PASSO_DE_VALOR = 37;
const PASSO_MENSAL = 120;
const PASSO_DO_ARQUIVO = 42;
const ANO_BASE = 2025;
const ANO_DOS_LANCAMENTOS = 2026;
const CENTAVOS = 100;
const LANCAMENTOS_PADRAO = 60;
const LINHAS_DO_ARQUIVO = 6;
const TEXTO_VAZIO = '';
const SEM_REGRAS = [];

const BANCOS = ['Nubank', 'Itau', 'PicPay'];
const COLUNAS_RECONHECIDAS = ['Data', 'Descrição', 'Valor'];

export const DESCRICOES = [
  'PAGBANK*JL ALIMENTOS E BEBIDAS LTDA FILIAL CENTRO',
  'UBER *TRIP SAO PAULO BR',
  'MERCADOLIVRE*COMPRA PARCELADA 3/10',
  'SUPERMERCADO SANTA LUZIA MATRIZ',
  'NETFLIX.COM ASSINATURA MENSAL'
];

export const TAGS = ['trabalho', 'reembolsavel', 'familia', 'viagem'];

export function comDados(quantidade = LANCAMENTOS_PADRAO) {
  return () => {
    reiniciar();
    despachar(ACOES.CARREGAR_DADOS, {
      lancamentos: carteira(quantidade),
      categorias: [...CATEGORIAS_PADRAO],
      tags: [...TAGS],
      regras: SEM_REGRAS
    });
    despachar(ACOES.DEFINIR_FILTROS, { mes: TEXTO_VAZIO });
  };
}

export function comSelecao(quantidade) {
  const carregar = comDados();

  return () => {
    carregar();
    despachar(
      ACOES.DEFINIR_SELECAO,
      obter()
        .lancamentos.slice(0, quantidade)
        .map((item) => item.id)
    );
  };
}

export function estadoDoPainel(meses) {
  const lancamentos = Array.from({ length: meses }, (_, indice) => ({
    ...preparar({
      data: `10/${doisDigitos((indice % MESES_DO_ANO) + 1)}/${ANO_BASE + Math.floor(indice / MESES_DO_ANO)}`,
      valor: `-${(indice + 1) * PASSO_MENSAL},00`,
      descricaoOriginal: DESCRICOES[indice % DESCRICOES.length],
      banco: BANCOS[0],
      arquivo: 'extrato.ofx'
    }),
    categoria: CATEGORIAS_PADRAO[indice % CATEGORIAS_PADRAO.length]
  }));

  const atual = obter();
  return { ...atual, lancamentos, filtros: { ...atual.filtros, mes: TEXTO_VAZIO } };
}

export function arquivoDeMuitasColunas(colunas) {
  const extras = Array.from(
    { length: colunas - COLUNAS_RECONHECIDAS.length },
    (_, indice) => `Coluna muito comprida numero ${indice + 1}`
  );

  const linhas = Array.from({ length: LINHAS_DO_ARQUIVO }, (_, linha) => [
    `${doisDigitos(linha + 1)}/09/${ANO_DOS_LANCAMENTOS}`,
    DESCRICOES[linha % DESCRICOES.length],
    `-${(linha + 1) * PASSO_DO_ARQUIVO},90`,
    ...extras.map((_, coluna) => `valor ${linha + 1} da coluna ${coluna + 1}`)
  ]);

  return {
    nome: 'extrato.csv',
    formato: 'csv',
    assinatura: 'medicao-responsivo',
    tabela: { cabecalho: [...COLUNAS_RECONHECIDAS, ...extras], linhas, delimitador: ';' }
  };
}

function carteira(quantidade) {
  return Array.from({ length: quantidade }, (_, indice) => lancamento(indice));
}

function lancamento(indice) {
  return {
    ...preparar({
      data: `${doisDigitos((indice % DIAS_DO_CICLO) + 1)}/${doisDigitos((indice % MESES_DO_ANO) + 1)}/${ANO_DOS_LANCAMENTOS}`,
      valor: `-${(indice + 1) * PASSO_DE_VALOR},${doisDigitos(indice % CENTAVOS)}`,
      descricaoOriginal: DESCRICOES[indice % DESCRICOES.length],
      banco: BANCOS[indice % BANCOS.length],
      conta: '12345-6',
      arquivo: 'extrato.ofx'
    }),
    categoria: CATEGORIAS_PADRAO[indice % CATEGORIAS_PADRAO.length],
    tagsManuais: TAGS.slice(0, (indice % TAGS.length) + 1)
  };
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}
