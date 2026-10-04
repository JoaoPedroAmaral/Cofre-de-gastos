import { OPERADORES_REGRA, ORIGENS_REGRA } from './constantes.js';
import { normalizarTexto } from './normalizar.js';
import { REGRAS_SEMENTE } from '../dados/regrasSemente.js';

const TEXTO_VAZIO = '';
const PREFIXO_ID = 'r';
const BASE_ID = 36;

export const ROTULOS_OPERADOR = Object.freeze({
  [OPERADORES_REGRA.CONTEM]: 'contém',
  [OPERADORES_REGRA.COMECA_COM]: 'começa com',
  [OPERADORES_REGRA.REGEX]: 'expressão'
});

const MENSAGENS_REGRA = Object.freeze({
  TERMO_VAZIO: 'Escreva o texto que a regra deve procurar.',
  CATEGORIA_VAZIA: 'Escolha a categoria da regra.',
  REGEX_INVALIDA: 'Expressão inválida. A regra fica pausada até ser corrigida.'
});

let contador = 0;

export function criarRegra({ operador, termo, categoria, tags = [], origem = ORIGENS_REGRA.USUARIO }) {
  contador += 1;

  return {
    id: `${PREFIXO_ID}${Date.now().toString(BASE_ID)}${contador}`,
    operador,
    termo: String(termo ?? TEXTO_VAZIO).trim(),
    categoria,
    tags,
    origem
  };
}

export function regrasSemente() {
  return REGRAS_SEMENTE.map((semente) =>
    criarRegra({
      operador: OPERADORES_REGRA.CONTEM,
      termo: semente.termo,
      categoria: semente.categoria,
      tags: semente.tags ?? [],
      origem: ORIGENS_REGRA.SEMENTE
    })
  );
}

export function validar(regra) {
  if (regra.termo === TEXTO_VAZIO) {
    return { valida: false, motivo: MENSAGENS_REGRA.TERMO_VAZIO };
  }
  if (!regra.categoria) {
    return { valida: false, motivo: MENSAGENS_REGRA.CATEGORIA_VAZIA };
  }
  if (regra.operador === OPERADORES_REGRA.REGEX && !compilar(regra.termo)) {
    return { valida: false, motivo: MENSAGENS_REGRA.REGEX_INVALIDA };
  }
  return { valida: true, motivo: TEXTO_VAZIO };
}

export function avaliar(regra, lancamento) {
  if (!validar(regra).valida) {
    return false;
  }

  const alvos = [normalizarTexto(lancamento.descricaoOriginal), normalizarTexto(lancamento.comerciante)];
  const termo = normalizarTexto(regra.termo);

  if (regra.operador === OPERADORES_REGRA.REGEX) {
    const expressao = compilar(regra.termo);
    return alvos.some((alvo) => expressao.test(alvo));
  }
  if (regra.operador === OPERADORES_REGRA.COMECA_COM) {
    return alvos.some((alvo) => alvo.startsWith(termo));
  }
  return alvos.some((alvo) => alvo.includes(termo));
}

export function ordenar(regras) {
  const usuario = regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO);
  const semente = regras.filter((regra) => regra.origem !== ORIGENS_REGRA.USUARIO);
  return [...usuario, ...semente];
}

export function contarAcertos(regras, lancamentos) {
  const contagem = new Map(regras.map((regra) => [regra.id, 0]));
  const ordenadas = ordenar(regras);

  lancamentos.forEach((lancamento) => {
    const vencedora = ordenadas.find((regra) => avaliar(regra, lancamento));
    if (!vencedora) {
      return;
    }
    contagem.set(vencedora.id, contagem.get(vencedora.id) + 1);
  });

  return contagem;
}

export function alcance(regra, lancamentos) {
  const atingidos = lancamentos.filter((lancamento) => avaliar(regra, lancamento));

  return {
    total: atingidos.length,
    manuais: atingidos.filter((lancamento) => lancamento.revisadoManual).length
  };
}

function compilar(termo) {
  try {
    return new RegExp(termo, 'i');
  } catch {
    return null;
  }
}
