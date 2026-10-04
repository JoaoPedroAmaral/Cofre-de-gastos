import { preparar } from '../nucleo/preparar.js';
import { FORMATOS, detectar } from './detector.js';
import { decodificar } from './texto.js';
import { assinaturaDe, aplicarMapeamento } from './tabela.js';
import { obter as obterMapeamento } from './mapeamentos.js';
import { reconhecer } from './bancos/index.js';
import * as ofx from './ofx.js';
import * as csv from './csv.js';
import * as xlsx from './xlsx.js';
import * as pdf from './pdf.js';

export const RESULTADOS = Object.freeze({
  IMPORTADO: 'importado',
  PRECISA_MAPEAMENTO: 'precisa_mapeamento',
  FALHOU: 'falhou'
});

const LIMITE_INSPECAO_TEXTO = 8192;
const TEXTO_VAZIO = '';

const MENSAGENS = Object.freeze({
  FORMATO_DESCONHECIDO:
    'Formato não reconhecido. São aceitos OFX, CSV, XLSX e PDF de fatura.',
  SEM_LANCAMENTOS: 'Nenhum lançamento encontrado no arquivo.'
});

export async function importarArquivos(arquivos) {
  const relatorio = { lancamentos: [], arquivos: [] };

  for (const arquivo of arquivos) {
    const resultado = await importarArquivo(arquivo);
    relatorio.arquivos.push(resultado);
    relatorio.lancamentos.push(...(resultado.lancamentos || []));
  }

  return relatorio;
}

export function construirLancamentos(brutos) {
  const lancamentos = [];
  const erros = [];

  brutos.forEach((bruto) => {
    try {
      lancamentos.push(preparar(bruto));
    } catch (erro) {
      erros.push(erro.message);
    }
  });

  return { lancamentos, erros };
}

async function importarArquivo(arquivo) {
  try {
    return await processar(arquivo);
  } catch (erro) {
    return falha(arquivo, erro.message);
  }
}

async function processar(arquivo) {
  const { nome, bytes } = arquivo;
  const amostra = decodificar(bytes.slice(0, LIMITE_INSPECAO_TEXTO));
  const formato = detectar(bytes, amostra);

  if (formato === FORMATOS.PDF) {
    return processarPdf(nome, bytes);
  }
  if (formato === FORMATOS.DESCONHECIDO) {
    return falha(arquivo, MENSAGENS.FORMATO_DESCONHECIDO);
  }
  if (formato === FORMATOS.OFX) {
    return processarOfx(nome, decodificar(bytes));
  }

  const tabela = formato === FORMATOS.XLSX ? await xlsx.analisar(bytes) : csv.analisar(decodificar(bytes));
  return processarTabela(nome, formato, tabela);
}

async function processarPdf(nome, bytes) {
  const { brutos, pendencias, banco } = await pdf.analisar(bytes, nome);
  if (brutos.length === 0) {
    return { ...falha({ nome }, pdf.MENSAGENS_PDF.SEM_LANCAMENTOS), pendencias };
  }

  const { lancamentos, erros } = construirLancamentos(brutos);
  return {
    nome,
    formato: FORMATOS.PDF,
    resultado: RESULTADOS.IMPORTADO,
    perfil: TEXTO_VAZIO,
    banco,
    pendencias,
    lancamentos,
    erros
  };
}

function processarOfx(nome, texto) {
  const brutos = ofx.analisar(texto, nome);
  if (brutos.length === 0) {
    return falha({ nome }, MENSAGENS.SEM_LANCAMENTOS);
  }

  const { lancamentos, erros } = construirLancamentos(brutos);
  return {
    nome,
    formato: FORMATOS.OFX,
    resultado: RESULTADOS.IMPORTADO,
    lancamentos,
    erros
  };
}

function processarTabela(nome, formato, tabela) {
  if (tabela.cabecalho.length === 0) {
    return falha({ nome }, MENSAGENS.SEM_LANCAMENTOS);
  }

  const assinatura = assinaturaDe(tabela.cabecalho);
  const mapeamento = obterMapeamento(assinatura) || reconhecer(tabela.cabecalho);

  if (!mapeamento) {
    return {
      nome,
      formato,
      resultado: RESULTADOS.PRECISA_MAPEAMENTO,
      assinatura,
      tabela,
      lancamentos: [],
      erros: []
    };
  }

  const brutos = aplicarMapeamento(tabela, mapeamento, { arquivo: nome });
  const { lancamentos, erros } = construirLancamentos(brutos);

  return {
    nome,
    formato,
    resultado: RESULTADOS.IMPORTADO,
    assinatura,
    perfil: mapeamento.perfil || TEXTO_VAZIO,
    lancamentos,
    erros
  };
}

function falha(arquivo, mensagem) {
  return {
    nome: arquivo.nome || TEXTO_VAZIO,
    resultado: RESULTADOS.FALHOU,
    mensagem,
    pendencias: [],
    lancamentos: [],
    erros: []
  };
}
