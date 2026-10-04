import { METODOS } from './constantes.js';

const TEXTO_VAZIO = '';
const ESPACO = ' ';

const ACENTOS = /[̀-ͯ]/g;
const DATAS = /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g;
const HORAS = /\b\d{1,2}:\d{2}\b/g;
const DOMINIOS = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/gi;
const NUMEROS_SOLTOS = /\b\d+\b/g;
const PONTUACAO = /[*#.,;:_\-/\()[\]]+/g;
const ESPACOS = /\s+/g;

const INTERMEDIADORES = [
  'PAGBANK',
  'PAGSEGURO',
  'PAG',
  'MP',
  'MERPAGO',
  'MERCADOPAGO',
  'MERCADO PAGO',
  'CIELO',
  'STONE',
  'GETNET',
  'REDE',
  'SUMUP',
  'PICPAY',
  'EBANX',
  'PAYPAL',
  'IFD',
  'PAGARME'
];

const PREFIXOS_RUIDO = [
  'COMPRA DEBITO',
  'COMPRA CARTAO',
  'COMPRA COM CARTAO',
  'DEBITO AUTOMATICO',
  'PAGAMENTO DE',
  'PAGAMENTO',
  'PAGTO',
  'PIX ENVIADO',
  'PIX RECEBIDO',
  'PIX DES',
  'PIX REM',
  'PIX QRS',
  'PIX',
  'TED',
  'DOC',
  'TRANSFERENCIA',
  'TRANSF',
  'PARCELA',
  'PARC',
  'SAQUE',
  'TARIFA'
];

const CIDADES = [
  'SAO PAULO',
  'RIO DE JANEIRO',
  'BELO HORIZONTE',
  'PORTO ALEGRE',
  'BRASILIA',
  'CURITIBA',
  'SALVADOR',
  'RECIFE',
  'FORTALEZA',
  'GOIANIA',
  'MANAUS',
  'CAMPINAS',
  'GUARULHOS',
  'NITEROI',
  'TAGUATINGA'
];

const SIGLAS_ESTADO = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'BR', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

const MARCAS_METODO = [
  { metodo: METODOS.PIX, termos: ['PIX'] },
  { metodo: METODOS.CARTAO_DEBITO, termos: ['COMPRA DEBITO', 'CARTAO DE DEBITO', 'DEBITO AUTOMATICO'] },
  { metodo: METODOS.BOLETO, termos: ['BOLETO', 'PAGAMENTO DE TITULO', 'PAG TITULO'] },
  { metodo: METODOS.TED, termos: ['TED', 'DOC', 'TRANSFERENCIA', 'TRANSF'] },
  { metodo: METODOS.TARIFA, termos: ['TARIFA', 'ANUIDADE', 'IOF', 'JUROS', 'MULTA', 'ENCARGOS'] }
];

const PARCELA = /\bPARC(?:ELA)?\s*(\d{1,2})\s*(?:\/|DE)\s*(\d{1,2})\b/;
const TOTAL_MAXIMO_PARCELAS = 48;

export function normalizarTexto(descricao) {
  return String(descricao ?? TEXTO_VAZIO)
    .normalize('NFD')
    .replace(ACENTOS, TEXTO_VAZIO)
    .toUpperCase()
    .trim();
}

export function chaveComerciante(descricao) {
  const base = separarIntermediador(normalizarTexto(descricao));
  const semRuido = removerPrefixos(base);

  const limpo = semRuido
    .replace(DOMINIOS, ESPACO)
    .replace(DATAS, ESPACO)
    .replace(HORAS, ESPACO)
    .replace(NUMEROS_SOLTOS, ESPACO)
    .replace(PONTUACAO, ESPACO)
    .replace(ESPACOS, ESPACO)
    .trim();

  const semLocal = removerLocalizacao(limpo);
  return semLocal || limpo || normalizarTexto(descricao);
}

export function metodoDe(descricao, metodoAtual) {
  if (metodoAtual && metodoAtual !== METODOS.OUTROS) {
    return metodoAtual;
  }

  const texto = normalizarTexto(descricao);
  const achado = MARCAS_METODO.find(({ termos }) => termos.some((termo) => contemPalavra(texto, termo)));
  return achado ? achado.metodo : METODOS.OUTROS;
}

export function parcelaDe(descricao) {
  const achado = PARCELA.exec(normalizarTexto(descricao));
  if (!achado) {
    return null;
  }

  const atual = Number(achado[1]);
  const total = Number(achado[2]);
  if (atual < 1 || total < atual || total > TOTAL_MAXIMO_PARCELAS) {
    return null;
  }

  return { atual, total };
}

function separarIntermediador(texto) {
  const posicao = texto.indexOf('*');
  if (posicao === -1) {
    return texto;
  }

  const antes = texto.slice(0, posicao).replace(PONTUACAO, ESPACO).trim();
  const depois = texto.slice(posicao + 1).trim();

  if (depois === TEXTO_VAZIO) {
    return antes;
  }
  if (INTERMEDIADORES.includes(antes)) {
    return depois;
  }
  return antes;
}

function removerPrefixos(texto) {
  const prefixo = PREFIXOS_RUIDO.find((termo) => texto.startsWith(`${termo} `) || texto === termo);
  if (!prefixo) {
    return texto;
  }
  return removerPrefixos(texto.slice(prefixo.length).trim());
}

function removerLocalizacao(texto) {
  const semEstado = removerSufixo(texto, SIGLAS_ESTADO);
  const semCidade = removerSufixo(semEstado, CIDADES);
  return removerSufixo(semCidade, SIGLAS_ESTADO);
}

function removerSufixo(texto, sufixos) {
  const achado = sufixos.find((sufixo) => texto.endsWith(` ${sufixo}`));
  return achado ? texto.slice(0, texto.length - achado.length - 1).trim() : texto;
}

function contemPalavra(texto, termo) {
  return texto === termo || texto.startsWith(`${termo} `) || texto.includes(` ${termo} `) || texto.endsWith(` ${termo}`);
}
