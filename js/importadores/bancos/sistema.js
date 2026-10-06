import { COLUNAS_EXPORTACAO } from '../../nucleo/constantes.js';

export const PERFIS_DO_SISTEMA = Object.freeze([
  Object.freeze({
    id: 'gastos-controller-planilha',
    preferido: true,
    banco: 'Gastos Controller',
    conta: 'Planilha exportada',
    descricao: 'Planilha exportada pelo próprio sistema',
    exige: [
      COLUNAS_EXPORTACAO.DATA,
      COLUNAS_EXPORTACAO.DESCRICAO,
      COLUNAS_EXPORTACAO.VALOR,
      COLUNAS_EXPORTACAO.BANCO,
      COLUNAS_EXPORTACAO.CONTA_NO_TOTAL
    ],
    colunas: {
      data: COLUNAS_EXPORTACAO.DATA,
      valor: COLUNAS_EXPORTACAO.VALOR,
      descricao: COLUNAS_EXPORTACAO.DESCRICAO,
      categoria: COLUNAS_EXPORTACAO.CATEGORIA,
      banco: COLUNAS_EXPORTACAO.BANCO,
      contaNoTotal: COLUNAS_EXPORTACAO.CONTA_NO_TOTAL,
      motivoForaDoTotal: COLUNAS_EXPORTACAO.MOTIVO_FORA_DO_TOTAL
    }
  })
]);
