import {
  ABAS_PLANILHA,
  ABAS_REGRAS,
  ACOES,
  CATEGORIAS_PADRAO,
  CATEGORIA_SEM_CLASSIFICACAO,
  COMPETENCIA,
  ESTADOS_COFRE,
  FORMATOS_EXPORTACAO,
  ORIGENS_REGRA,
  TELAS,
  TELA_INICIAL,
  TEMAS,
  TIPOS_IDENTIDADE,
  TIPOS_SUGESTAO
} from '../nucleo/constantes.js';
import { criarRegra, regrasSemente } from '../nucleo/regras.js';
import { reclassificar } from '../nucleo/classificar.js';
import { mesesDisponiveis } from '../nucleo/agregar.js';
import { migrar } from '../nucleo/modelo.js';
import { reavaliar } from '../nucleo/naoGasto.js';
import {
  acrescentarTermo,
  candidatosDe,
  combina,
  identidadeVazia
} from '../nucleo/identidadePessoal.js';

const filtrosIniciais = Object.freeze({
  mes: '',
  banco: '',
  categoria: '',
  tag: '',
  busca: ''
});

const ordenacaoInicial = Object.freeze({
  campo: 'data',
  ascendente: false
});

const estadoInicial = Object.freeze({
  tela: TELA_INICIAL,
  aba: ABAS_PLANILHA.TODOS,
  tema: TEMAS.SISTEMA,
  competencia: COMPETENCIA.COMPRA,
  filtros: filtrosIniciais,
  ordenacao: ordenacaoInicial,
  importacao: Object.freeze({ arquivos: [] }),
  abaRegras: ABAS_REGRAS.USUARIO,
  selecao: Object.freeze([]),
  sugestao: null,
  formatoExportacao: FORMATOS_EXPORTACAO.XLSX,
  cofre: Object.freeze({ situacao: ESTADOS_COFRE.VERIFICANDO, perfil: null, perfis: [], erro: '' }),
  lancamentos: [],
  regras: Object.freeze(regrasSemente()),
  categorias: CATEGORIAS_PADRAO,
  identidade: identidadeVazia()
});

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

function reduzir(atual, acao, dados) {
  switch (acao) {
    case ACOES.TROCAR_TELA:
      return trocarTela(atual, dados);
    case ACOES.DEFINIR_TEMA:
      return definirTema(atual, dados);
    case ACOES.DEFINIR_COMPETENCIA:
      return definirCompetencia(atual, dados);
    case ACOES.DEFINIR_FILTROS:
      return { ...atual, filtros: { ...atual.filtros, ...dados } };
    case ACOES.LIMPAR_FILTROS:
      return { ...atual, filtros: filtrosIniciais };
    case ACOES.REGISTRAR_IMPORTACAO:
      return registrarImportacao(atual, dados);
    case ACOES.DEFINIR_ORDENACAO:
      return definirOrdenacao(atual, dados);
    case ACOES.DEFINIR_ABA:
      return definirAba(atual, dados);
    case ACOES.DEFINIR_FORA_DO_TOTAL:
      return definirForaDoTotal(atual, dados);
    case ACOES.DEFINIR_IDENTIDADE:
      return definirIdentidade(atual, dados);
    case ACOES.DEFINIR_CATEGORIA:
      return definirCategoria(atual, dados);
    case ACOES.ALTERNAR_SELECAO:
      return alternarSelecao(atual, dados);
    case ACOES.LIMPAR_SELECAO:
      return limparSelecao(atual);
    case ACOES.DEFINIR_SELECAO:
      return definirSelecao(atual, dados);
    case ACOES.DEFINIR_ABA_REGRAS:
      return definirAbaRegras(atual, dados);
    case ACOES.DESCARTAR_SUGESTAO:
      return atual.sugestao === null ? atual : { ...atual, sugestao: null };
    case ACOES.CRIAR_REGRA:
      return comRegras({ ...atual, sugestao: null }, [...atual.regras, criarRegra(dados)]);
    case ACOES.REMOVER_REGRA:
      return comRegras(atual, atual.regras.filter((regra) => regra.id !== dados));
    case ACOES.MOVER_REGRA:
      return moverRegra(atual, dados);
    case ACOES.DEFINIR_FORMATO_EXPORTACAO:
      return definirFormatoExportacao(atual, dados);
    case ACOES.RESTAURAR_BACKUP:
      return restaurarBackup(atual, dados);
    case ACOES.DEFINIR_ESTADO_DO_COFRE:
      return definirEstadoDoCofre(atual, dados);
    case ACOES.CARREGAR_DADOS:
      return carregarDados(atual, dados);
    case ACOES.SELECIONAR_PERFIL:
      return selecionarPerfil(atual, dados);
    default:
      throw new Error(`Ação desconhecida: ${acao}`);
  }
}

function trocarTela(atual, tela) {
  if (!Object.values(TELAS).includes(tela) || tela === atual.tela) {
    return atual;
  }
  return { ...atual, tela };
}

function definirTema(atual, tema) {
  if (!Object.values(TEMAS).includes(tema) || tema === atual.tema) {
    return atual;
  }
  return { ...atual, tema };
}

function registrarImportacao(atual, relatorio) {
  if (!relatorio) {
    return atual;
  }

  const recebidos = (relatorio.lancamentos || []).map(migrar);
  const lancamentos = reclassificar([...atual.lancamentos, ...recebidos], atual.regras);

  return {
    ...atual,
    lancamentos,
    filtros: { ...atual.filtros, mes: mesDaImportacao(atual, recebidos, lancamentos) },
    importacao: { arquivos: mesclarArquivos(atual.importacao.arquivos, relatorio.arquivos || []) }
  };
}

function mesDaImportacao(atual, recebidos, lancamentos) {
  const mesesQueEntraram = mesesDisponiveis(recebidos, atual.competencia);
  if (mesesQueEntraram.length > 0) {
    return mesesQueEntraram[mesesQueEntraram.length - 1];
  }

  const meses = mesesDisponiveis(lancamentos, atual.competencia);
  return atual.filtros.mes || meses[meses.length - 1] || '';
}

function comRegras(atual, regras) {
  return { ...atual, regras, lancamentos: reclassificar(atual.lancamentos, regras) };
}

function moverRegra(atual, { id, direcao }) {
  const posicao = atual.regras.findIndex((regra) => regra.id === id);
  const destino = posicao + direcao;

  if (posicao === -1 || destino < 0 || destino >= atual.regras.length) {
    return atual;
  }
  if (atual.regras[destino].origem !== atual.regras[posicao].origem) {
    return atual;
  }

  const regras = [...atual.regras];
  [regras[posicao], regras[destino]] = [regras[destino], regras[posicao]];
  return comRegras(atual, regras);
}

function definirCategoria(atual, { ids, categoria }) {
  const alvos = new Set(ids);
  if (alvos.size === 0 || !categoria) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, categoria, revisadoManual: true, regra: null };
  });

  return { ...atual, lancamentos, sugestao: sugestaoDeCategoria(lancamentos, ids, categoria) };
}

function sugestaoDeCategoria(lancamentos, ids, categoria) {
  if (categoria === CATEGORIA_SEM_CLASSIFICACAO) {
    return null;
  }

  const chaves = [
    ...new Set(
      lancamentos
        .filter((lancamento) => ids.includes(lancamento.id))
        .map((lancamento) => lancamento.comerciante)
        .filter(Boolean)
    )
  ];

  if (chaves.length !== 1) {
    return null;
  }
  return { tipo: TIPOS_SUGESTAO.CATEGORIA, id: ids[0], categoria, chave: chaves[0] };
}

function definirEstadoDoCofre(atual, { situacao, perfil = null, perfis, erro = '' }) {
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

function selecionarPerfil(atual, id) {
  const escolhido = atual.cofre.perfis.find((perfil) => perfil.id === id) ?? null;
  if (escolhido?.id === atual.cofre.perfil?.id) {
    return atual;
  }
  return { ...atual, cofre: { ...atual.cofre, perfil: escolhido, erro: '' } };
}

function carregarDados(atual, dados) {
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
    identidade: dados.identidade ?? atual.identidade,
    lancamentos,
    filtros: { ...atual.filtros, mes: meses[meses.length - 1] ?? '' }
  };
}

function definirFormatoExportacao(atual, formato) {
  if (!Object.values(FORMATOS_EXPORTACAO).includes(formato) || formato === atual.formatoExportacao) {
    return atual;
  }
  return { ...atual, formatoExportacao: formato };
}

function restaurarBackup(atual, conteudo) {
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
    identidade: conteudo.identidade ?? atual.identidade,
    lancamentos: reclassificar(lancamentos, regras),
    filtros: { ...atual.filtros, mes: meses[meses.length - 1] ?? '' },
    selecao: [],
    sugestao: null,
    importacao: { arquivos: [] }
  };
}

function definirAbaRegras(atual, aba) {
  if (!Object.values(ABAS_REGRAS).includes(aba) || aba === atual.abaRegras) {
    return atual;
  }
  return { ...atual, abaRegras: aba };
}

function alternarSelecao(atual, id) {
  const marcado = atual.selecao.includes(id);
  const selecao = marcado ? atual.selecao.filter((item) => item !== id) : [...atual.selecao, id];
  return { ...atual, selecao };
}

function definirSelecao(atual, ids) {
  return { ...atual, selecao: [...new Set(ids)] };
}

function limparSelecao(atual) {
  if (atual.selecao.length === 0) {
    return atual;
  }
  return { ...atual, selecao: [] };
}

function mesclarArquivos(atuais, novos) {
  const mesclados = [...atuais];

  novos.forEach((arquivo) => {
    const posicao = mesclados.findIndex((existente) => existente.nome === arquivo.nome);
    if (posicao === -1) {
      mesclados.push(arquivo);
      return;
    }
    mesclados[posicao] = arquivo;
  });

  return mesclados;
}

function definirOrdenacao(atual, campo) {
  const mesmaColuna = atual.ordenacao.campo === campo;
  return {
    ...atual,
    ordenacao: { campo, ascendente: mesmaColuna ? !atual.ordenacao.ascendente : true }
  };
}

function definirAba(atual, aba) {
  if (!Object.values(ABAS_PLANILHA).includes(aba) || aba === atual.aba) {
    return atual;
  }
  return { ...atual, aba };
}

function definirForaDoTotal(atual, { ids, fora }) {
  const alvos = new Set(ids);
  if (alvos.size === 0) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, foraDoTotalManual: fora };
  });

  return { ...atual, lancamentos, sugestao: sugestaoDeIdentidade(atual, lancamentos, ids, fora) };
}

function definirIdentidade(atual, identidade) {
  if (!identidade) {
    return atual;
  }
  return { ...atual, identidade, lancamentos: reavaliar(atual.lancamentos, identidade) };
}

function sugestaoDeIdentidade(atual, lancamentos, ids, fora) {
  if (fora !== true || ids.length !== 1) {
    return null;
  }

  const alvo = lancamentos.find((lancamento) => lancamento.id === ids[0]);
  if (!alvo || combina(alvo.descricaoOriginal, atual.identidade)) {
    return null;
  }

  const { nome } = candidatosDe(alvo.descricaoOriginal);
  if (!nome || !recebeuDe(lancamentos, nome)) {
    return null;
  }

  return { tipo: TIPOS_SUGESTAO.IDENTIDADE, id: alvo.id, termo: nome, campo: TIPOS_IDENTIDADE.NOMES };
}

function recebeuDe(lancamentos, nome) {
  const comoVoce = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, nome);
  return lancamentos.some(
    (lancamento) => lancamento.valor > 0 && combina(lancamento.descricaoOriginal, comoVoce)
  );
}

function definirCompetencia(atual, competencia) {
  if (!Object.values(COMPETENCIA).includes(competencia) || competencia === atual.competencia) {
    return atual;
  }
  return { ...atual, competencia };
}
