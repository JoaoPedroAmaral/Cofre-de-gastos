import { CENTAVOS_POR_UNIDADE, LOCALE, MOEDA } from '../nucleo/constantes.js';

const PADRAO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const PADRAO_MES = /^(\d{4})-(\d{2})$/;
const TEXTO_VAZIO = '';
const TAMANHO_MES = 7;
const PRIMEIRO_DIA = '-01';
const INICIO_DO_DIA = 8;
const ULTIMO_DIA_MINIMO = 28;

const formatadorMoeda = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: MOEDA
});

const formatadorPercentual = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1
});

const formatadorMesLongo = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const formatadorMesCurto = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

export function formatarMoeda(centavos) {
  if (!Number.isFinite(centavos)) {
    return TEXTO_VAZIO;
  }
  return formatadorMoeda.format(centavos / CENTAVOS_POR_UNIDADE);
}

export function formatarData(iso) {
  const partes = PADRAO_ISO.exec(iso ?? TEXTO_VAZIO);
  if (!partes) {
    return TEXTO_VAZIO;
  }
  const [, ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export function formatarMesLongo(mes) {
  const data = dataDoMes(mes);
  if (!data) {
    return TEXTO_VAZIO;
  }
  return comInicialMaiuscula(formatadorMesLongo.format(data));
}

export function formatarPeriodo(periodo) {
  if (!periodo) {
    return TEXTO_VAZIO;
  }
  if (cobreOMesInteiro(periodo)) {
    return formatarMesLongo(periodo.inicio.slice(0, TAMANHO_MES));
  }
  return `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;
}

function cobreOMesInteiro({ inicio, fim }) {
  const mesmoMes = inicio.slice(0, TAMANHO_MES) === fim.slice(0, TAMANHO_MES);
  return mesmoMes && inicio.endsWith(PRIMEIRO_DIA) && Number(fim.slice(INICIO_DO_DIA)) >= ULTIMO_DIA_MINIMO;
}

export function formatarMesCurto(mes) {
  const data = dataDoMes(mes);
  if (!data) {
    return TEXTO_VAZIO;
  }
  return comInicialMaiuscula(formatadorMesCurto.format(data).replace('.', TEXTO_VAZIO));
}

function comInicialMaiuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function dataDoMes(mes) {
  const partes = PADRAO_MES.exec(mes ?? TEXTO_VAZIO);
  if (!partes) {
    return null;
  }
  return new Date(Number(partes[1]), Number(partes[2]) - 1, 1);
}

export function formatarPercentual(fracao) {
  if (!Number.isFinite(fracao)) {
    return TEXTO_VAZIO;
  }
  return formatadorPercentual.format(fracao);
}
