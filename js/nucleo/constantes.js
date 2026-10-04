export const TELAS = Object.freeze({
  PAINEL: 'painel',
  PLANILHA: 'planilha',
  IMPORTAR: 'importar',
  REGRAS: 'regras',
  EXPORTAR: 'exportar',
  PRIVACIDADE: 'privacidade'
});

export const ROTULOS_TELA = Object.freeze({
  [TELAS.PAINEL]: 'Painel',
  [TELAS.PLANILHA]: 'Planilha',
  [TELAS.IMPORTAR]: 'Importar',
  [TELAS.REGRAS]: 'Regras',
  [TELAS.EXPORTAR]: 'Exportar',
  [TELAS.PRIVACIDADE]: 'Privacidade'
});

export const ORDEM_TELAS = Object.freeze([
  TELAS.PAINEL,
  TELAS.PLANILHA,
  TELAS.IMPORTAR,
  TELAS.REGRAS,
  TELAS.EXPORTAR
]);

export const TELA_INICIAL = TELAS.IMPORTAR;

export const ABAS_REGRAS = Object.freeze({
  USUARIO: 'usuario',
  SEMENTE: 'semente'
});

export const ROTULOS_ABA_REGRAS = Object.freeze({
  usuario: 'Suas regras',
  semente: 'Dicionário pronto'
});

export const ABAS_PLANILHA = Object.freeze({
  TODOS: 'todos',
  SEM_CATEGORIA: 'sem_categoria',
  FORA_DO_TOTAL: 'fora_do_total'
});

export const ROTULOS_ABA = Object.freeze({
  [ABAS_PLANILHA.TODOS]: 'Todos',
  [ABAS_PLANILHA.SEM_CATEGORIA]: 'Sem categoria',
  [ABAS_PLANILHA.FORA_DO_TOTAL]: 'Fora do total'
});

export const ACOES = Object.freeze({
  TROCAR_TELA: 'trocarTela',
  DEFINIR_TEMA: 'definirTema',
  DEFINIR_FILTROS: 'definirFiltros',
  LIMPAR_FILTROS: 'limparFiltros',
  DEFINIR_COMPETENCIA: 'definirCompetencia',
  REGISTRAR_IMPORTACAO: 'registrarImportacao',
  DEFINIR_ORDENACAO: 'definirOrdenacao',
  DEFINIR_ABA: 'definirAba',
  ALTERNAR_NAO_GASTO: 'alternarNaoGasto',
  DEFINIR_CATEGORIA: 'definirCategoria',
  ALTERNAR_SELECAO: 'alternarSelecao',
  LIMPAR_SELECAO: 'limparSelecao',
  DEFINIR_ABA_REGRAS: 'definirAbaRegras',
  DESCARTAR_SUGESTAO: 'descartarSugestao',
  CRIAR_REGRA: 'criarRegra',
  REMOVER_REGRA: 'removerRegra',
  MOVER_REGRA: 'moverRegra',
  DEFINIR_FORMATO_EXPORTACAO: 'definirFormatoExportacao',
  RESTAURAR_BACKUP: 'restaurarBackup',
  DEFINIR_ESTADO_DO_COFRE: 'definirEstadoDoCofre',
  CARREGAR_DADOS: 'carregarDados',
  SELECIONAR_PERFIL: 'selecionarPerfil'
});

export const TEMAS = Object.freeze({
  SISTEMA: 'sistema',
  CLARO: 'claro',
  ESCURO: 'escuro'
});

export const ORDEM_TEMAS = Object.freeze([TEMAS.SISTEMA, TEMAS.CLARO, TEMAS.ESCURO]);

export const ROTULOS_TEMA = Object.freeze({
  [TEMAS.SISTEMA]: 'Tema do sistema',
  [TEMAS.CLARO]: 'Tema claro',
  [TEMAS.ESCURO]: 'Tema escuro'
});

export const CHAVE_PREFERENCIA_TEMA = 'gastos.tema';

export const CATEGORIA_SEM_CLASSIFICACAO = 'Não categorizado';

export const CATEGORIAS_PADRAO = Object.freeze([
  'Alimentação',
  'Mercado',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação e cursos',
  'Academia',
  'Lazer',
  'Assinaturas',
  'Compras',
  'Serviços',
  'Impostos e tarifas',
  'Outros',
  CATEGORIA_SEM_CLASSIFICACAO
]);

export const METODOS = Object.freeze({
  PIX: 'pix',
  CARTAO_CREDITO: 'cartao_credito',
  CARTAO_DEBITO: 'cartao_debito',
  BOLETO: 'boleto',
  TED: 'ted',
  TARIFA: 'tarifa',
  OUTROS: 'outros'
});

export const ROTULOS_METODO = Object.freeze({
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  boleto: 'Boleto',
  ted: 'TED',
  tarifa: 'Tarifa',
  outros: 'Outros'
});

export const TIPOS_COLUNA = Object.freeze({
  DATA: 'data',
  TEXTO: 'texto',
  MOEDA: 'moeda',
  METODO: 'metodo'
});

export const COLUNAS_PLANILHA = Object.freeze([
  { campo: 'data', rotulo: 'Data', tipo: TIPOS_COLUNA.DATA },
  { campo: 'descricaoOriginal', rotulo: 'Lançamento', tipo: TIPOS_COLUNA.TEXTO },
  { campo: 'categoria', rotulo: 'Categoria', tipo: TIPOS_COLUNA.TEXTO },
  { campo: 'valor', rotulo: 'Valor', tipo: TIPOS_COLUNA.MOEDA }
]);

export const MOTIVOS_NAO_GASTO = Object.freeze({
  TRANSFERENCIA: 'transferencia',
  PAGAMENTO_FATURA: 'pagamento_fatura',
  APLICACAO: 'aplicacao',
  MANUAL: 'manual'
});

export const COMPETENCIA = Object.freeze({
  COMPRA: 'compra',
  FATURA: 'fatura'
});

export const OPERADORES_REGRA = Object.freeze({
  CONTEM: 'contem',
  COMECA_COM: 'comeca_com',
  REGEX: 'regex'
});

export const ORIGENS_REGRA = Object.freeze({
  USUARIO: 'usuario',
  SEMENTE: 'semente'
});

export const NOME_BANCO = 'gastos-controller';
export const VERSAO_BANCO = 1;

export const STORES = Object.freeze({
  LANCAMENTOS: 'lancamentos',
  REGRAS: 'regras',
  CATEGORIAS: 'categorias',
  MAPEAMENTOS: 'mapeamentos',
  PERFIS: 'perfis'
});

export const DERIVACAO = Object.freeze({
  ALGORITMO_CIFRA: 'AES-GCM',
  TAMANHO_CHAVE_BITS: 256,
  TAMANHO_SALT_BYTES: 16,
  TAMANHO_IV_BYTES: 12,
  ITERACOES_PBKDF2: 600000,
  HASH_PBKDF2: 'SHA-256'
});

export const ESTADOS_COFRE = Object.freeze({
  VERIFICANDO: 'verificando',
  SEM_COFRE: 'sem_cofre',
  TRAVADO: 'travado',
  ABERTO: 'aberto'
});

export const LIMITE_DE_PERFIS = 8;

export const MINUTOS_AUTO_LOCK = 10;

export const FORMATOS_EXPORTACAO = Object.freeze({
  XLSX: 'xlsx',
  CSV: 'csv'
});

export const LOCALE = 'pt-BR';
export const MOEDA = 'BRL';
export const CENTAVOS_POR_UNIDADE = 100;

export const NIVEIS_AVISO = Object.freeze({
  INFO: 'info',
  SUCESSO: 'sucesso',
  ATENCAO: 'atencao',
  ERRO: 'erro'
});

export const DURACAO_AVISO_MS = 5000;
