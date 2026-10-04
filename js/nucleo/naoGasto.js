import { MOTIVOS_NAO_GASTO } from './constantes.js';
import { normalizarTexto } from './normalizar.js';

const REGRAS = [
  {
    motivo: MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA,
    termos: [
      'PAGAMENTO FATURA',
      'PAGAMENTO DE FATURA',
      'PAG FATURA',
      'PAGTO FATURA',
      'PGTO FATURA',
      'PAGAMENTO CARTAO',
      'PAGAMENTO DE CARTAO',
      'FATURA CARTAO',
      'PAGAMENTO RECEBIDO'
    ]
  },
  {
    motivo: MOTIVOS_NAO_GASTO.APLICACAO,
    termos: [
      'APLICACAO',
      'APLIC AUTOMATICA',
      'RESGATE',
      'INVESTIMENTO',
      'CDB',
      'POUPANCA',
      'TESOURO DIRETO',
      'RENDIMENTO'
    ]
  },
  {
    motivo: MOTIVOS_NAO_GASTO.TRANSFERENCIA,
    termos: [
      'MESMA TITULARIDADE',
      'ENTRE CONTAS',
      'CONTAS PROPRIAS',
      'TRANSFERENCIA INTERNA',
      'TRANSF INTERNA',
      'TRANSFERENCIA ENTRE CONTAS'
    ]
  }
];

export const ROTULOS_NAO_GASTO = Object.freeze({
  [MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA]: 'pagamento de fatura',
  [MOTIVOS_NAO_GASTO.APLICACAO]: 'aplicação ou resgate',
  [MOTIVOS_NAO_GASTO.TRANSFERENCIA]: 'transferência entre contas suas',
  [MOTIVOS_NAO_GASTO.MANUAL]: 'marcado por você'
});

export function motivoDe(descricao) {
  const texto = normalizarTexto(descricao);
  const regra = REGRAS.find(({ termos }) => termos.some((termo) => texto.includes(termo)));
  return regra ? regra.motivo : false;
}

export function ehGasto(lancamento) {
  return lancamento.naoGasto === false && lancamento.valor < 0;
}

export function ehEntrada(lancamento) {
  return lancamento.naoGasto === false && lancamento.valor > 0;
}
