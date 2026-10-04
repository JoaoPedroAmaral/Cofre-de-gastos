import { CATEGORIA_SEM_CLASSIFICACAO, COMPETENCIA, METODOS } from './constantes.js';
import { paraCentavos } from './dinheiro.js';
import { paraIso } from './datas.js';

const TEXTO_VAZIO = '';
const BANCO_DESCONHECIDO = 'Desconhecido';

export function criarLancamento(bruto) {
  const data = paraIso(bruto.data);
  if (!data) {
    throw new Error(`Data inválida: ${descreverOrigem(bruto)} recebeu "${bruto.data}"`);
  }

  const valor = paraCentavos(bruto.valor);
  if (valor === null) {
    throw new Error(`Valor inválido: ${descreverOrigem(bruto)} recebeu "${bruto.valor}"`);
  }

  const descricaoOriginal = texto(bruto.descricaoOriginal);
  if (descricaoOriginal === TEXTO_VAZIO) {
    throw new Error(`Descrição ausente: ${descreverOrigem(bruto)}`);
  }

  return {
    data,
    dataFatura: paraIso(bruto.dataFatura),
    valor,
    descricaoOriginal,
    comerciante: TEXTO_VAZIO,
    banco: texto(bruto.banco) || BANCO_DESCONHECIDO,
    conta: texto(bruto.conta),
    metodo: bruto.metodo || METODOS.OUTROS,
    categoria: CATEGORIA_SEM_CLASSIFICACAO,
    tags: [],
    parcela: null,
    naoGasto: false,
    origem: {
      arquivo: texto(bruto.arquivo),
      linha: bruto.linha ?? null
    },
    revisadoManual: false
  };
}

export function dataDeCompetencia(lancamento, competencia) {
  if (competencia === COMPETENCIA.FATURA && lancamento.dataFatura) {
    return lancamento.dataFatura;
  }
  return lancamento.data;
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : TEXTO_VAZIO;
}

function descreverOrigem(bruto) {
  const arquivo = texto(bruto.arquivo) || 'arquivo';
  if (bruto.linha === undefined || bruto.linha === null) {
    return arquivo;
  }
  return `${arquivo}, linha ${bruto.linha}`;
}
