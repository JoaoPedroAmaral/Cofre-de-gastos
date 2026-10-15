import { FORMATOS_EXPORTACAO, TELAS, TEMAS } from '../../nucleo/constantes.js';

export function trocarTela(atual, tela) {
  if (!Object.values(TELAS).includes(tela) || tela === atual.tela) {
    return atual;
  }
  return { ...atual, tela };
}

export function definirTema(atual, tema) {
  if (!Object.values(TEMAS).includes(tema) || tema === atual.tema) {
    return atual;
  }
  return { ...atual, tema };
}

export function definirFormatoExportacao(atual, formato) {
  if (!Object.values(FORMATOS_EXPORTACAO).includes(formato) || formato === atual.formatoExportacao) {
    return atual;
  }
  return { ...atual, formatoExportacao: formato };
}
