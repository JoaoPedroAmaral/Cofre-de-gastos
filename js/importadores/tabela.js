import { deCentavos, paraCentavos } from '../nucleo/dinheiro.js';

const SEPARADOR_ASSINATURA = '|';
const ACENTOS = /[\u0300-\u036f]/g;
const NAO_ALFANUMERICO = /[^a-z0-9]/g;
const TEXTO_VAZIO = '';
const PRIMEIRA_LINHA_PLANILHA = 2;
const COLUNA_AUSENTE = -1;

export function assinaturaDe(cabecalho) {
  return cabecalho.map(normalizarNome).filter(Boolean).join(SEPARADOR_ASSINATURA);
}

export function aplicarMapeamento(tabela, mapeamento, contexto = {}) {
  const { colunas } = mapeamento;

  return tabela.linhas
    .map((linha, indice) => ({
      data: celula(linha, colunas.data),
      valor: comSinal(valorDa(linha, colunas), mapeamento.inverterSinal),
      descricaoOriginal: celula(linha, colunas.descricao),
      banco: mapeamento.banco || contexto.banco || TEXTO_VAZIO,
      conta: mapeamento.conta || TEXTO_VAZIO,
      arquivo: contexto.arquivo || TEXTO_VAZIO,
      linha: indice + PRIMEIRA_LINHA_PLANILHA
    }))
    .filter((bruto) => bruto.data !== TEXTO_VAZIO || bruto.descricaoOriginal !== TEXTO_VAZIO);
}

export function indiceSugerido(cabecalho, termos) {
  const normalizados = cabecalho.map(normalizarNome);
  const encontrado = normalizados.findIndex((nome) =>
    termos.some((termo) => nome.includes(termo))
  );
  return encontrado;
}

export function indicePorNome(cabecalho, nome) {
  const procurado = normalizarNome(nome);
  if (procurado === TEXTO_VAZIO) {
    return COLUNA_AUSENTE;
  }
  return cabecalho.findIndex((coluna) => normalizarNome(coluna) === procurado);
}

function comSinal(valor, inverter) {
  if (!inverter || valor === TEXTO_VAZIO) {
    return valor;
  }
  const centavos = paraCentavos(valor);
  if (centavos === null) {
    return valor;
  }
  return deCentavos(-centavos);
}

function valorDa(linha, colunas) {
  if (colunas.valor !== undefined && colunas.valor !== null) {
    return celula(linha, colunas.valor);
  }

  const debito = celula(linha, colunas.debito);
  if (debito !== TEXTO_VAZIO) {
    return `-${debito}`;
  }
  return celula(linha, colunas.credito);
}

function celula(linha, indice) {
  if (indice === undefined || indice === null) {
    return TEXTO_VAZIO;
  }
  const conteudo = linha[indice];
  return conteudo === undefined || conteudo === null ? TEXTO_VAZIO : String(conteudo).trim();
}

function normalizarNome(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(ACENTOS, TEXTO_VAZIO)
    .toLowerCase()
    .replace(NAO_ALFANUMERICO, TEXTO_VAZIO);
}
