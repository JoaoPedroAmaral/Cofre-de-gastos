import {
  ABAS_PLANILHA,
  ABAS_REGRAS,
  CATEGORIAS_PADRAO,
  COMPETENCIA,
  CONTEXTOS_DE_PAGINA,
  ESTADOS_COFRE,
  FORMATOS_EXPORTACAO,
  PRIMEIRA_PAGINA,
  TELA_INICIAL,
  TEMAS
} from '../nucleo/constantes.js';
import { regrasSemente } from '../nucleo/regras.js';
import { identidadeVazia } from '../nucleo/identidadePessoal.js';

export const filtrosIniciais = Object.freeze({
  mes: '',
  banco: '',
  categoria: '',
  tag: '',
  busca: ''
});

export const ordenacaoInicial = Object.freeze({
  campo: 'data',
  ascendente: false
});

export const paginasIniciais = Object.freeze({
  [CONTEXTOS_DE_PAGINA.PLANILHA]: PRIMEIRA_PAGINA,
  [CONTEXTOS_DE_PAGINA.REGRAS]: PRIMEIRA_PAGINA,
  [CONTEXTOS_DE_PAGINA.IMPORTACAO]: PRIMEIRA_PAGINA
});

export const estadoInicial = Object.freeze({
  tela: TELA_INICIAL,
  aba: ABAS_PLANILHA.TODOS,
  tema: TEMAS.SISTEMA,
  competencia: COMPETENCIA.COMPRA,
  filtros: filtrosIniciais,
  ordenacao: ordenacaoInicial,
  paginas: paginasIniciais,
  importacao: Object.freeze({ arquivos: [] }),
  abaRegras: ABAS_REGRAS.USUARIO,
  selecao: Object.freeze([]),
  sugestao: null,
  formatoExportacao: FORMATOS_EXPORTACAO.XLSX,
  cofre: Object.freeze({ situacao: ESTADOS_COFRE.VERIFICANDO, perfil: null, perfis: [], erro: '' }),
  lancamentos: [],
  regras: Object.freeze(regrasSemente()),
  categorias: CATEGORIAS_PADRAO,
  tags: [],
  identidade: identidadeVazia()
});
