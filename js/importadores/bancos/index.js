import { indicePorNome } from '../tabela.js';
import { PERFIS_NUBANK } from './nubank.js';

export const PERFIS_DE_BANCO = Object.freeze([...PERFIS_NUBANK]);

const COLUNA_AUSENTE = -1;
const SEPARADOR_DESCRICAO = ' · ';
const TEXTO_VAZIO = '';

export function reconhecer(cabecalho) {
  const perfil = escolher(cabecalho);
  if (!perfil) {
    return null;
  }

  return {
    perfil: perfil.id,
    banco: perfil.banco,
    conta: perfil.conta,
    inverterSinal: Boolean(perfil.inverterSinal),
    colunas: resolverColunas(cabecalho, perfil.colunas)
  };
}

export function descreverPerfil(id) {
  const perfil = PERFIS_DE_BANCO.find((candidato) => candidato.id === id);
  if (!perfil) {
    return TEXTO_VAZIO;
  }
  return `${perfil.banco}${SEPARADOR_DESCRICAO}${perfil.conta}`;
}

function escolher(cabecalho) {
  const compativeis = PERFIS_DE_BANCO.filter((perfil) => atende(cabecalho, perfil));
  if (compativeis.length === 0) {
    return null;
  }
  return compativeis.reduce((escolhido, atual) =>
    atual.exige.length > escolhido.exige.length ? atual : escolhido
  );
}

function atende(cabecalho, perfil) {
  return perfil.exige.every((nome) => indicePorNome(cabecalho, nome) !== COLUNA_AUSENTE);
}

function resolverColunas(cabecalho, nomes) {
  return Object.entries(nomes).reduce((colunas, [papel, nome]) => {
    const indice = indicePorNome(cabecalho, nome);
    if (indice !== COLUNA_AUSENTE) {
      colunas[papel] = indice;
    }
    return colunas;
  }, {});
}
