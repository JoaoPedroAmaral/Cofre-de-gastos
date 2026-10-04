import { baixar, nomeDoArquivo } from './arquivo.js';
import { montarAbas, NOMES_ABAS } from './abas.js';

const TIPO = 'text/csv;charset=utf-8';
const PREFIXO = 'gastos';
const EXTENSAO = 'csv';
const DELIMITADOR = ';';
const QUEBRA = '\r\n';
const MARCA_UTF8 = '﻿';
const ASPAS = '"';
const PRECISA_ASPAS = /[";\r\n]/;
const DECIMAL = ',';
const PONTO = '.';
const CASAS = 2;

export function montarCsv(lancamentos, regras, competencia) {
  const transacoes = montarAbas(lancamentos, regras, competencia).find(
    (aba) => aba.nome === NOMES_ABAS.TRANSACOES
  );

  const corpo = transacoes.linhas.map((linha) => linha.map(celula).join(DELIMITADOR)).join(QUEBRA);
  return `${MARCA_UTF8}${corpo}${QUEBRA}`;
}

export function exportarCsv(lancamentos, regras, competencia, mes) {
  baixar(nomeDoArquivo(PREFIXO, mes, EXTENSAO), montarCsv(lancamentos, regras, competencia), TIPO);
}

function celula(valor) {
  if (typeof valor === 'number') {
    return valor.toFixed(CASAS).replace(PONTO, DECIMAL);
  }

  const texto = String(valor ?? '');
  if (!PRECISA_ASPAS.test(texto)) {
    return texto;
  }
  return `${ASPAS}${texto.split(ASPAS).join(`${ASPAS}${ASPAS}`)}${ASPAS}`;
}
