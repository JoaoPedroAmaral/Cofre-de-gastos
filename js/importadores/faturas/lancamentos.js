import { deCentavos, paraCentavos } from '../../nucleo/dinheiro.js';
import { paraIso } from '../../nucleo/datas.js';
import { dataDoLancamento } from './periodo.js';

const PADRAO_DATA_BARRA = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/;
const PADRAO_DATA_MES_CURTO = /^(\d{1,2})\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?(?=\s|$)/i;
const PADRAO_VALOR_FINAL = /(-\s*)?R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*(-)?$/;

const MESES_CURTOS = Object.freeze({
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
});

const LINHAS_DE_RESUMO = Object.freeze([
  'total', 'subtotal', 'saldo', 'limite', 'vencimento', 'pagamento minimo',
  'pagamento mínimo', 'fatura anterior', 'resumo', 'fechamento', 'proxima fatura',
  'próxima fatura', 'credito disponivel', 'crédito disponível'
]);

export const MOTIVOS_PENDENCIA = Object.freeze({
  SEM_VALOR: 'tem data mas nenhum valor reconhecível no fim da linha',
  SEM_DATA: 'tem valor mas nenhuma data reconhecível no começo da linha',
  SEM_DESCRICAO: 'tem data e valor mas nada entre os dois',
  VALOR_ILEGIVEL: 'o valor não pôde ser interpretado',
  DATA_INVALIDA: 'a data do começo da linha não existe no calendário'
});

const PRIMEIRA_LINHA = 1;
const TEXTO_VAZIO = '';

export function lerFatura(linhas, referencia, contexto = {}) {
  const lancamentos = [];
  const pendencias = [];

  linhas.forEach((texto, indice) => {
    const resultado = interpretarLinha(texto, referencia);
    if (!resultado) {
      return;
    }
    if (resultado.motivo) {
      pendencias.push({ linha: indice + PRIMEIRA_LINHA, texto, motivo: resultado.motivo });
      return;
    }
    lancamentos.push({ ...resultado.bruto, ...contexto, linha: indice + PRIMEIRA_LINHA });
  });

  return { lancamentos, pendencias };
}

function interpretarLinha(texto, referencia) {
  const data = inicioComData(texto);
  const valor = PADRAO_VALOR_FINAL.exec(texto);

  if (!data && !valor) {
    return null;
  }
  if (!data) {
    return ehResumo(texto) ? null : { motivo: MOTIVOS_PENDENCIA.SEM_DATA };
  }
  if (!valor) {
    return { motivo: MOTIVOS_PENDENCIA.SEM_VALOR };
  }

  const descricao = texto.slice(data.fim, valor.index).trim();
  if (descricao === TEXTO_VAZIO) {
    return { motivo: MOTIVOS_PENDENCIA.SEM_DESCRICAO };
  }

  const centavos = paraCentavos(valor[2]);
  if (centavos === null) {
    return { motivo: MOTIVOS_PENDENCIA.VALOR_ILEGIVEL };
  }

  const dataIso = dataCompleta(data, referencia);
  if (!dataIso) {
    return { motivo: MOTIVOS_PENDENCIA.DATA_INVALIDA };
  }

  const credito = Boolean(valor[1] || valor[3]);
  return {
    bruto: {
      data: dataIso,
      valor: deCentavos(credito ? centavos : -centavos),
      descricaoOriginal: descricao
    }
  };
}

function inicioComData(texto) {
  const barra = PADRAO_DATA_BARRA.exec(texto);
  if (barra) {
    return { dia: Number(barra[1]), mes: Number(barra[2]), ano: barra[3] || null, fim: barra[0].length };
  }

  const mesCurto = PADRAO_DATA_MES_CURTO.exec(texto);
  if (mesCurto) {
    return {
      dia: Number(mesCurto[1]),
      mes: MESES_CURTOS[mesCurto[2].toLowerCase()],
      ano: null,
      fim: mesCurto[0].length
    };
  }

  return null;
}

function dataCompleta(data, referencia) {
  if (data.ano) {
    return paraIso(`${data.dia}/${data.mes}/${data.ano}`);
  }
  return paraIso(dataDoLancamento(data.dia, data.mes, referencia));
}

function ehResumo(texto) {
  const minusculo = texto.toLowerCase();
  return LINHAS_DE_RESUMO.some((marca) => minusculo.includes(marca));
}

