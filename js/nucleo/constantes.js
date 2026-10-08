export const TELAS = Object.freeze({
  PAINEL: 'painel',
  PLANILHA: 'planilha',
  IMPORTAR: 'importar',
  REGRAS: 'regras',
  EXPORTAR: 'exportar',
  AJUSTES: 'ajustes',
  PRIVACIDADE: 'privacidade'
});

export const ROTULOS_TELA = Object.freeze({
  [TELAS.PAINEL]: 'Painel',
  [TELAS.PLANILHA]: 'Planilha',
  [TELAS.IMPORTAR]: 'Importar',
  [TELAS.REGRAS]: 'Regras',
  [TELAS.EXPORTAR]: 'Exportar',
  [TELAS.AJUSTES]: 'Ajustes',
  [TELAS.PRIVACIDADE]: 'Privacidade'
});

export const ORDEM_TELAS = Object.freeze([
  TELAS.PAINEL,
  TELAS.PLANILHA,
  TELAS.IMPORTAR,
  TELAS.REGRAS,
  TELAS.EXPORTAR,
  TELAS.AJUSTES
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
  DEFINIR_FORA_DO_TOTAL: 'definirForaDoTotal',
  DEFINIR_IDENTIDADE: 'definirIdentidade',
  DEFINIR_CATEGORIA: 'definirCategoria',
  CRIAR_CATEGORIA: 'criarCategoria',
  CRIAR_TAG: 'criarTag',
  ACRESCENTAR_TAG: 'acrescentarTag',
  REMOVER_TAG: 'removerTag',
  RENOMEAR_TAG: 'renomearTag',
  REMOVER_TAG_DO_CATALOGO: 'removerTagDoCatalogo',
  RENOMEAR_CATEGORIA: 'renomearCategoria',
  REMOVER_CATEGORIA: 'removerCategoria',
  ALTERNAR_SELECAO: 'alternarSelecao',
  LIMPAR_SELECAO: 'limparSelecao',
  DEFINIR_SELECAO: 'definirSelecao',
  DEFINIR_ABA_REGRAS: 'definirAbaRegras',
  DEFINIR_PAGINA: 'definirPagina',
  IR_PARA_PLANILHA: 'irParaPlanilha',
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
  ESCURO: 'escuro',
  CLARO: 'claro',
  NOITE: 'noite',
  PAPEL: 'papel',
  CONTRASTE: 'contraste'
});

export const ORDEM_TEMAS = Object.freeze([
  TEMAS.SISTEMA,
  TEMAS.ESCURO,
  TEMAS.CLARO,
  TEMAS.NOITE,
  TEMAS.PAPEL,
  TEMAS.CONTRASTE
]);

export const ROTULOS_TEMA = Object.freeze({
  [TEMAS.SISTEMA]: 'Seguir o sistema',
  [TEMAS.ESCURO]: 'Escuro',
  [TEMAS.CLARO]: 'Claro',
  [TEMAS.NOITE]: 'Noite fria',
  [TEMAS.PAPEL]: 'Papel',
  [TEMAS.CONTRASTE]: 'Alto contraste'
});

export const DESCRICOES_TEMA = Object.freeze({
  [TEMAS.SISTEMA]: 'Acompanha o claro ou escuro do seu aparelho',
  [TEMAS.ESCURO]: 'O padrão do sistema, fundo quase preto',
  [TEMAS.CLARO]: 'Fundo claro, para ambiente iluminado',
  [TEMAS.NOITE]: 'Escuro de base azulada, menos quente que o padrão',
  [TEMAS.PAPEL]: 'Claro de base quente, com menos contraste bruto que o branco',
  [TEMAS.CONTRASTE]: 'Preto e branco com a marca saturada, para leitura difícil'
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
  { campo: 'tags', rotulo: 'Tags', tipo: TIPOS_COLUNA.TEXTO },
  { campo: 'valor', rotulo: 'Valor', tipo: TIPOS_COLUNA.MOEDA }
]);

export const COLUNAS_EXPORTACAO = Object.freeze({
  DATA: 'Data',
  COMPETENCIA: 'Competência',
  DESCRICAO: 'Descrição',
  ESTABELECIMENTO: 'Estabelecimento',
  CATEGORIA: 'Categoria',
  TAGS: 'Tags',
  BANCO: 'Banco',
  METODO: 'Método',
  PARCELA: 'Parcela',
  VALOR: 'Valor',
  CONTA_NO_TOTAL: 'Conta no total',
  MOTIVO_FORA_DO_TOTAL: 'Motivo fora do total'
});

export const CONTA_NO_TOTAL = Object.freeze({
  SIM: 'sim',
  NAO: 'não'
});

export const MOTIVOS_NAO_GASTO = Object.freeze({
  CONTA_PROPRIA: 'conta_propria',
  TRANSFERENCIA: 'transferencia',
  PAGAMENTO_FATURA: 'pagamento_fatura',
  APLICACAO: 'aplicacao',
  MANUAL: 'manual'
});

export const TIPOS_IDENTIDADE = Object.freeze({
  NOMES: 'nomes',
  DOCUMENTOS: 'documentos',
  CONTAS: 'contas'
});

export const TIPOS_SUGESTAO = Object.freeze({
  CATEGORIA: 'categoria',
  IDENTIDADE: 'identidade'
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
export const VERSAO_BANCO = 2;

export const STORES = Object.freeze({
  LANCAMENTOS: 'lancamentos',
  REGRAS: 'regras',
  CATEGORIAS: 'categorias',
  MAPEAMENTOS: 'mapeamentos',
  PERFIS: 'perfis',
  SESSAO: 'sessao'
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

export const PRIMEIRA_PAGINA = 1;

export const CONTEXTOS_DE_PAGINA = Object.freeze({
  PLANILHA: 'planilha',
  REGRAS: 'regras',
  IMPORTACAO: 'importacao'
});

export const TAMANHO_DE_PAGINA = Object.freeze({
  [CONTEXTOS_DE_PAGINA.PLANILHA]: 12,
  [CONTEXTOS_DE_PAGINA.REGRAS]: 12,
  [CONTEXTOS_DE_PAGINA.IMPORTACAO]: 10
});

export const LIMITE_DE_PERFIS = 8;

export const MINUTOS_AUTO_LOCK = 10;

export const SEGUNDOS_ENTRE_RENOVACOES = 30;

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
