import { ABAS_PLANILHA, COMPETENCIA, CONTEXTOS_DE_PAGINA, PRIMEIRA_PAGINA, TELAS } from '../../nucleo/constantes.js';
import { filtrosIniciais } from '../inicial.js';

export function definirFiltros(atual, dados) {
  return daPrimeiraPagina({ ...atual, filtros: { ...atual.filtros, ...dados } }, CONTEXTOS_DE_PAGINA.PLANILHA);
}

export function limparFiltros(atual) {
  return daPrimeiraPagina({ ...atual, filtros: filtrosIniciais }, CONTEXTOS_DE_PAGINA.PLANILHA);
}

export function daPrimeiraPagina(atual, contexto) {
  return { ...atual, paginas: { ...atual.paginas, [contexto]: PRIMEIRA_PAGINA } };
}

export function definirPagina(atual, { contexto, pagina }) {
  if (!Object.values(CONTEXTOS_DE_PAGINA).includes(contexto)) {
    return atual;
  }
  if (atual.paginas[contexto] === pagina) {
    return atual;
  }
  return { ...atual, paginas: { ...atual.paginas, [contexto]: pagina } };
}

export function definirAba(atual, aba) {
  if (!Object.values(ABAS_PLANILHA).includes(aba) || aba === atual.aba) {
    return atual;
  }
  return daPrimeiraPagina({ ...atual, aba }, CONTEXTOS_DE_PAGINA.PLANILHA);
}

export function definirOrdenacao(atual, campo) {
  const mesmaColuna = atual.ordenacao.campo === campo;
  return daPrimeiraPagina(
    { ...atual, ordenacao: { campo, ascendente: mesmaColuna ? !atual.ordenacao.ascendente : true } },
    CONTEXTOS_DE_PAGINA.PLANILHA
  );
}

export function irParaPlanilha(atual, recorte = {}) {
  const aba = Object.values(ABAS_PLANILHA).includes(recorte.aba) ? recorte.aba : ABAS_PLANILHA.TODOS;
  const filtros = { ...atual.filtros, ...(recorte.filtros ?? {}) };

  return daPrimeiraPagina(
    { ...atual, tela: TELAS.PLANILHA, aba, filtros, selecao: [] },
    CONTEXTOS_DE_PAGINA.PLANILHA
  );
}

export function alternarSelecao(atual, id) {
  const marcado = atual.selecao.includes(id);
  const selecao = marcado ? atual.selecao.filter((item) => item !== id) : [...atual.selecao, id];
  return { ...atual, selecao };
}

export function definirSelecao(atual, ids) {
  return { ...atual, selecao: [...new Set(ids)] };
}

export function limparSelecao(atual) {
  if (atual.selecao.length === 0) {
    return atual;
  }
  return { ...atual, selecao: [] };
}

export function definirCompetencia(atual, competencia) {
  if (!Object.values(COMPETENCIA).includes(competencia) || competencia === atual.competencia) {
    return atual;
  }
  return { ...atual, competencia };
}
