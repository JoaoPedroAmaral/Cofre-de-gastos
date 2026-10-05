import { TIPOS_IDENTIDADE } from './constantes.js';
import { normalizarTexto } from './normalizar.js';
import { contemTermo } from './palavras.js';

const TEXTO_VAZIO = '';
const ESPACO = ' ';
const ESPACOS = /\s+/g;
const NAO_DIGITOS = /\D+/g;
const MINIMO_DE_DIGITOS = 4;
const SEPARADOR_DE_PARTES = ' - ';
const PADRAO_DOCUMENTO = /^[\d•*][\d•*./-]*$/;
const PADRAO_NOME = /^[A-Z][A-Z&.\s]+$/;
const MINIMO_DE_PALAVRAS_DO_NOME = 2;
const DEPOIS_DO_TIPO = 1;

const IDENTIDADE_VAZIA = Object.freeze({
  [TIPOS_IDENTIDADE.NOMES]: Object.freeze([]),
  [TIPOS_IDENTIDADE.DOCUMENTOS]: Object.freeze([]),
  [TIPOS_IDENTIDADE.CONTAS]: Object.freeze([])
});

export function identidadeVazia() {
  return IDENTIDADE_VAZIA;
}

export function normalizarTermo(termo) {
  return normalizarTexto(termo).replace(ESPACOS, ESPACO).trim();
}

export function digitosDe(texto) {
  return String(texto ?? TEXTO_VAZIO).replace(NAO_DIGITOS, TEXTO_VAZIO);
}

export function combina(descricao, identidade) {
  const lista = identidade ?? IDENTIDADE_VAZIA;
  const texto = normalizarTermo(descricao);
  const digitos = digitosDe(descricao);

  const porNome = (lista[TIPOS_IDENTIDADE.NOMES] ?? []).some((nome) =>
    contemTermo(texto, normalizarTermo(nome))
  );
  if (porNome) {
    return true;
  }

  const numeros = [
    ...(lista[TIPOS_IDENTIDADE.DOCUMENTOS] ?? []),
    ...(lista[TIPOS_IDENTIDADE.CONTAS] ?? [])
  ];

  return numeros.some((numero) => casaPorDigitos(digitos, numero));
}

export function acrescentarTermo(identidade, tipo, termo) {
  const limpo = String(termo ?? TEXTO_VAZIO).trim();
  const atuais = identidade[tipo] ?? [];

  if (limpo === TEXTO_VAZIO || jaExiste(atuais, limpo)) {
    return identidade;
  }
  return { ...identidade, [tipo]: [...atuais, limpo] };
}

export function removerTermo(identidade, tipo, termo) {
  const atuais = identidade[tipo] ?? [];
  const restantes = atuais.filter((atual) => normalizarTermo(atual) !== normalizarTermo(termo));

  if (restantes.length === atuais.length) {
    return identidade;
  }
  return { ...identidade, [tipo]: restantes };
}

export function temTermo(identidade) {
  return Object.values(TIPOS_IDENTIDADE).some((tipo) => (identidade?.[tipo] ?? []).length > 0);
}

export function candidatosDe(descricao) {
  const partes = String(descricao ?? TEXTO_VAZIO)
    .split(SEPARADOR_DE_PARTES)
    .map((parte) => parte.trim())
    .filter(Boolean)
    .slice(DEPOIS_DO_TIPO);

  return {
    nome: partes.find(ehNome) ?? TEXTO_VAZIO,
    documento: partes.find(ehDocumento) ?? TEXTO_VAZIO
  };
}

function casaPorDigitos(digitosDaDescricao, numero) {
  const procurado = digitosDe(numero);
  if (procurado.length < MINIMO_DE_DIGITOS) {
    return false;
  }
  return digitosDaDescricao.includes(procurado);
}

function jaExiste(atuais, termo) {
  return atuais.some((atual) => normalizarTermo(atual) === normalizarTermo(termo));
}

function ehNome(parte) {
  const normalizado = normalizarTermo(parte);
  if (!PADRAO_NOME.test(normalizado)) {
    return false;
  }
  return normalizado.split(ESPACO).length >= MINIMO_DE_PALAVRAS_DO_NOME;
}

function ehDocumento(parte) {
  return PADRAO_DOCUMENTO.test(parte) && digitosDe(parte).length >= MINIMO_DE_DIGITOS;
}
