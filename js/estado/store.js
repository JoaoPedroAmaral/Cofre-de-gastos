import { ACOES } from '../nucleo/constantes.js';
import { estadoInicial } from './inicial.js';
import { definirFormatoExportacao, definirTema, trocarTela } from './redutores/preferencias.js';
import {
  alternarSelecao,
  definirAba,
  definirCompetencia,
  definirFiltros,
  definirOrdenacao,
  definirPagina,
  definirSelecao,
  irParaPlanilha,
  limparFiltros,
  limparSelecao
} from './redutores/recorte.js';
import {
  acrescentarTag,
  criarCategoria,
  criarTag,
  removerCategoria,
  removerTag,
  removerTagDoCatalogo,
  renomearCategoria,
  renomearTag
} from './redutores/catalogos.js';
import { acrescentarRegra, definirAbaRegras, moverRegra, removerRegra } from './redutores/regras.js';
import {
  definirCategoria,
  definirForaDoTotal,
  definirIdentidade,
  descartarSugestao
} from './redutores/lancamentos.js';
import { registrarImportacao } from './redutores/importacao.js';
import { carregarDados, definirEstadoDoCofre, restaurarBackup, selecionarPerfil } from './redutores/cofre.js';

let estado = estadoInicial;
const observadores = new Set();

export function obter() {
  return estado;
}

export function observar(observador) {
  observadores.add(observador);
  return () => observadores.delete(observador);
}

export function despachar(acao, dados) {
  const proximo = reduzir(estado, acao, dados);
  if (proximo === estado) {
    return estado;
  }
  estado = proximo;
  observadores.forEach((observador) => observador(estado));
  return estado;
}

export function reiniciar() {
  estado = estadoInicial;
  observadores.forEach((observador) => observador(estado));
  return estado;
}

const REDUTORES = Object.freeze({
  [ACOES.TROCAR_TELA]: trocarTela,
  [ACOES.DEFINIR_TEMA]: definirTema,
  [ACOES.DEFINIR_COMPETENCIA]: definirCompetencia,
  [ACOES.DEFINIR_FILTROS]: definirFiltros,
  [ACOES.LIMPAR_FILTROS]: limparFiltros,
  [ACOES.REGISTRAR_IMPORTACAO]: registrarImportacao,
  [ACOES.DEFINIR_ORDENACAO]: definirOrdenacao,
  [ACOES.DEFINIR_ABA]: definirAba,
  [ACOES.DEFINIR_FORA_DO_TOTAL]: definirForaDoTotal,
  [ACOES.DEFINIR_IDENTIDADE]: definirIdentidade,
  [ACOES.DEFINIR_CATEGORIA]: definirCategoria,
  [ACOES.CRIAR_CATEGORIA]: criarCategoria,
  [ACOES.CRIAR_TAG]: criarTag,
  [ACOES.ACRESCENTAR_TAG]: acrescentarTag,
  [ACOES.REMOVER_TAG]: removerTag,
  [ACOES.RENOMEAR_TAG]: renomearTag,
  [ACOES.REMOVER_TAG_DO_CATALOGO]: removerTagDoCatalogo,
  [ACOES.RENOMEAR_CATEGORIA]: renomearCategoria,
  [ACOES.REMOVER_CATEGORIA]: removerCategoria,
  [ACOES.ALTERNAR_SELECAO]: alternarSelecao,
  [ACOES.LIMPAR_SELECAO]: limparSelecao,
  [ACOES.DEFINIR_SELECAO]: definirSelecao,
  [ACOES.DEFINIR_ABA_REGRAS]: definirAbaRegras,
  [ACOES.DEFINIR_PAGINA]: definirPagina,
  [ACOES.IR_PARA_PLANILHA]: irParaPlanilha,
  [ACOES.DESCARTAR_SUGESTAO]: descartarSugestao,
  [ACOES.CRIAR_REGRA]: acrescentarRegra,
  [ACOES.REMOVER_REGRA]: removerRegra,
  [ACOES.MOVER_REGRA]: moverRegra,
  [ACOES.DEFINIR_FORMATO_EXPORTACAO]: definirFormatoExportacao,
  [ACOES.RESTAURAR_BACKUP]: restaurarBackup,
  [ACOES.DEFINIR_ESTADO_DO_COFRE]: definirEstadoDoCofre,
  [ACOES.CARREGAR_DADOS]: carregarDados,
  [ACOES.SELECIONAR_PERFIL]: selecionarPerfil
});

function reduzir(atual, acao, dados) {
  if (!Object.hasOwn(REDUTORES, acao)) {
    throw new Error(`Ação desconhecida: ${acao}`);
  }
  return REDUTORES[acao](atual, dados);
}
