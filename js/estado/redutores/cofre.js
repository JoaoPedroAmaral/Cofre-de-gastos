import { ESTADOS_COFRE, ORIGENS_REGRA } from '../../nucleo/constantes.js';
import { migrar } from '../../nucleo/modelo.js';
import { reclassificar } from '../../nucleo/classificar.js';
import { mesesDisponiveis } from '../../nucleo/agregar.js';
import { estadoInicial } from '../inicial.js';

const TEXTO_VAZIO = '';

export function definirEstadoDoCofre(atual, { situacao, perfil = null, perfis, erro = TEXTO_VAZIO }) {
  const lista = perfis ?? atual.cofre.perfis;

  if (situacao === ESTADOS_COFRE.TRAVADO || situacao === ESTADOS_COFRE.SEM_COFRE) {
    return {
      ...estadoInicial,
      tema: atual.tema,
      cofre: { situacao, perfil, perfis: lista, erro }
    };
  }
  return { ...atual, cofre: { situacao, perfil, perfis: lista, erro } };
}

export function selecionarPerfil(atual, id) {
  const escolhido = atual.cofre.perfis.find((perfil) => perfil.id === id) ?? null;
  if (escolhido?.id === atual.cofre.perfil?.id) {
    return atual;
  }
  return { ...atual, cofre: { ...atual.cofre, perfil: escolhido, erro: TEXTO_VAZIO } };
}

export function carregarDados(atual, dados) {
  if (!dados) {
    return atual;
  }

  const regras = [
    ...(dados.regras ?? []),
    ...atual.regras.filter((regra) => regra.origem !== ORIGENS_REGRA.USUARIO)
  ];
  const lancamentos = reclassificar((dados.lancamentos ?? []).map(migrar), regras);
  const meses = mesesDisponiveis(lancamentos, atual.competencia);

  return {
    ...atual,
    regras,
    categorias: dados.categorias ?? atual.categorias,
    tags: dados.tags ?? atual.tags,
    identidade: dados.identidade ?? atual.identidade,
    lancamentos,
    filtros: { ...atual.filtros, mes: meses[meses.length - 1] ?? TEXTO_VAZIO }
  };
}

export function restaurarBackup(atual, conteudo) {
  if (!conteudo) {
    return atual;
  }

  const regras = [...conteudo.regras, ...atual.regras.filter((regra) => regra.origem !== ORIGENS_REGRA.USUARIO)];
  const lancamentos = conteudo.lancamentos.map(migrar);
  const meses = mesesDisponiveis(lancamentos, atual.competencia);

  return {
    ...atual,
    regras,
    categorias: conteudo.categorias ?? atual.categorias,
    tags: conteudo.tags ?? atual.tags,
    identidade: conteudo.identidade ?? atual.identidade,
    lancamentos: reclassificar(lancamentos, regras),
    filtros: { ...atual.filtros, mes: meses[meses.length - 1] ?? TEXTO_VAZIO },
    selecao: [],
    sugestao: null,
    importacao: { arquivos: [] }
  };
}
