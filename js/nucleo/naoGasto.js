import { MOTIVOS_NAO_GASTO } from './constantes.js';
import { combina } from './identidadePessoal.js';
import { normalizarTexto } from './normalizar.js';

const TEXTO_VAZIO = '';

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
      'RENDIMENTO',
      'COFRINHO',
      'CAIXINHA',
      'DINHEIRO GUARDADO',
      'DINHEIRO RESGATADO',
      'GUARDADO NO',
      'RESGATADO DO',
      'RESERVA DE EMERGENCIA'
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
  [MOTIVOS_NAO_GASTO.CONTA_PROPRIA]: 'transferência entre contas suas',
  [MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA]: 'pagamento de fatura',
  [MOTIVOS_NAO_GASTO.APLICACAO]: 'aplicação ou resgate',
  [MOTIVOS_NAO_GASTO.TRANSFERENCIA]: 'transferência entre contas suas',
  [MOTIVOS_NAO_GASTO.MANUAL]: 'marcado por você'
});

export function motivoDe(descricao, identidade) {
  if (combina(descricao, identidade)) {
    return MOTIVOS_NAO_GASTO.CONTA_PROPRIA;
  }

  const texto = normalizarTexto(descricao);
  const regra = REGRAS.find(({ termos }) => termos.some((termo) => texto.includes(termo)));
  return regra ? regra.motivo : false;
}

export function estaForaDoTotal(lancamento) {
  if (lancamento.foraDoTotalManual === true) {
    return true;
  }
  if (lancamento.foraDoTotalManual === false) {
    return false;
  }
  return lancamento.naoGasto !== false;
}

export function motivoForaDoTotal(lancamento) {
  if (!estaForaDoTotal(lancamento)) {
    return TEXTO_VAZIO;
  }
  if (lancamento.foraDoTotalManual === true) {
    return MOTIVOS_NAO_GASTO.MANUAL;
  }
  return lancamento.naoGasto;
}

export function rotuloForaDoTotal(lancamento) {
  const motivo = motivoForaDoTotal(lancamento);
  return ROTULOS_NAO_GASTO[motivo] ?? motivo;
}

export function reavaliar(lancamentos, identidade) {
  return lancamentos.map((lancamento) => ({
    ...lancamento,
    naoGasto: motivoDe(lancamento.descricaoOriginal, identidade)
  }));
}

export function ehGasto(lancamento) {
  return !estaForaDoTotal(lancamento) && lancamento.valor < 0;
}

export function ehEntrada(lancamento) {
  return !estaForaDoTotal(lancamento) && lancamento.valor > 0;
}
