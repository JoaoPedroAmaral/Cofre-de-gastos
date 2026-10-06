import { paraIso } from '../nucleo/datas.js';

export const ORIGENS_PERIODO = Object.freeze({
  CONTEUDO: 'conteudo',
  NOME: 'nome'
});

const MESES_ABREVIADOS = Object.freeze({
  JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
  JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12
});

const MESES_POR_EXTENSO = Object.freeze({
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12
});

const PADRAO_ISO = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g;
const PADRAO_DIA_MES_ANO = /(?<!\d)(\d{2})([A-Z]{3})(\d{4})(?!\d)/g;
const PADRAO_ANO_MES = /(?<!\d)(\d{4})[-_](\d{2})(?!\d)/;
const PADRAO_MES_ANO = /(?<!\d)(\d{2})[-_]?(\d{4})(?!\d)/;
const PADRAO_MES_POR_EXTENSO = /([A-Z]{4,9})[-_ ]+(\d{4})/;
const ACENTOS = /[̀-ͯ]/g;
const PRIMEIRO_DIA = '01';
const TEXTO_VAZIO = '';
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FEVEREIRO = 2;
const DIAS_FEVEREIRO_BISSEXTO = 29;

export function periodoDeLancamentos(lancamentos, competencia, dataDe) {
  const datas = lancamentos.map((lancamento) => dataDe(lancamento, competencia)).filter(Boolean).sort();
  if (datas.length === 0) {
    return null;
  }
  return { inicio: datas[0], fim: datas[datas.length - 1], origem: ORIGENS_PERIODO.CONTEUDO };
}

export function periodoDoNome(nome) {
  const texto = normalizar(nome);
  const achado = porDatasCompletas(texto) || porDiaMesAno(texto) || porMesEAno(texto);

  if (!achado) {
    return null;
  }
  return { ...achado, origem: ORIGENS_PERIODO.NOME };
}

export function unirPeriodos(periodos) {
  const validos = periodos.filter(Boolean);
  if (validos.length === 0) {
    return null;
  }

  const inicios = validos.map((periodo) => periodo.inicio).sort();
  const fins = validos.map((periodo) => periodo.fim).sort();
  const suposto = validos.some((periodo) => periodo.origem === ORIGENS_PERIODO.NOME);

  return {
    inicio: inicios[0],
    fim: fins[fins.length - 1],
    origem: suposto ? ORIGENS_PERIODO.NOME : ORIGENS_PERIODO.CONTEUDO
  };
}

function porDatasCompletas(texto) {
  const achados = [...texto.matchAll(PADRAO_ISO)].map((achado) => achado[0]);
  if (achados.length === 0) {
    return null;
  }
  const ordenados = [...achados].sort();
  return { inicio: ordenados[0], fim: ordenados[ordenados.length - 1] };
}

function porDiaMesAno(texto) {
  const achados = [...texto.matchAll(PADRAO_DIA_MES_ANO)]
    .map((achado) => montar(Number(achado[3]), MESES_ABREVIADOS[achado[2]], Number(achado[1])))
    .filter(Boolean)
    .sort();

  if (achados.length === 0) {
    return null;
  }
  return { inicio: achados[0], fim: achados[achados.length - 1] };
}

function porMesEAno(texto) {
  const porExtenso = PADRAO_MES_POR_EXTENSO.exec(texto);
  if (porExtenso && MESES_POR_EXTENSO[porExtenso[1]]) {
    return mesInteiro(Number(porExtenso[2]), MESES_POR_EXTENSO[porExtenso[1]]);
  }

  const anoMes = PADRAO_ANO_MES.exec(texto);
  if (anoMes) {
    return mesInteiro(Number(anoMes[1]), Number(anoMes[2]));
  }

  const mesAno = PADRAO_MES_ANO.exec(texto);
  if (mesAno) {
    return mesInteiro(Number(mesAno[2]), Number(mesAno[1]));
  }
  return null;
}

function mesInteiro(ano, mes) {
  const inicio = montar(ano, mes, 1);
  if (!inicio) {
    return null;
  }
  return { inicio, fim: montar(ano, mes, ultimoDia(ano, mes)) };
}

function montar(ano, mes, dia) {
  if (!mes || mes < 1 || mes > DIAS_POR_MES.length) {
    return null;
  }
  return paraIso(`${ano}-${preencher(mes)}-${preencher(dia)}`);
}

function ultimoDia(ano, mes) {
  if (mes === FEVEREIRO && ehBissexto(ano)) {
    return DIAS_FEVEREIRO_BISSEXTO;
  }
  return DIAS_POR_MES[mes - 1];
}

function ehBissexto(ano) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

function preencher(numero) {
  return String(numero).padStart(PRIMEIRO_DIA.length, '0');
}

function normalizar(nome) {
  return String(nome ?? TEXTO_VAZIO)
    .normalize('NFD')
    .replace(ACENTOS, TEXTO_VAZIO)
    .toUpperCase();
}
