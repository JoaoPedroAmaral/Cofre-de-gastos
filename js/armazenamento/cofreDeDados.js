import { ORIGENS_REGRA } from '../nucleo/constantes.js';
import { cifrar, decifrar } from '../cofre/cofre.js';
import { listar as listarMapeamentos, substituir as substituirMapeamentos } from '../importadores/mapeamentos.js';
import { gravarCofre, lerCofre } from './banco.js';

const COLECOES = Object.freeze({
  LANCAMENTOS: 'lancamentos',
  CONFIGURACAO: 'configuracao'
});

const ESPERA_PARA_GRAVAR = 400;

let agendamento = null;

export async function carregarDoCofre(perfilId, chave) {
  const [lancamentos, configuracao] = await Promise.all([
    ler(perfilId, chave, COLECOES.LANCAMENTOS),
    ler(perfilId, chave, COLECOES.CONFIGURACAO)
  ]);

  if (configuracao?.mapeamentos) {
    substituirMapeamentos(configuracao.mapeamentos);
  }

  return {
    lancamentos: lancamentos ?? [],
    regras: configuracao?.regras ?? [],
    categorias: configuracao?.categorias ?? null,
    tags: configuracao?.tags ?? null,
    identidade: configuracao?.identidade ?? null
  };
}

export async function gravarNoCofre(perfilId, chave, estado) {
  await Promise.all([
    gravar(perfilId, chave, COLECOES.LANCAMENTOS, estado.lancamentos),
    gravar(perfilId, chave, COLECOES.CONFIGURACAO, {
      regras: estado.regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO),
      categorias: estado.categorias,
      tags: estado.tags,
      identidade: estado.identidade,
      mapeamentos: listarMapeamentos()
    })
  ]);
}

export function agendarGravacao(perfilId, chave, estado, aoFalhar) {
  cancelarGravacao();
  agendamento = window.setTimeout(() => {
    agendamento = null;
    gravarNoCofre(perfilId, chave, estado).catch(aoFalhar);
  }, ESPERA_PARA_GRAVAR);
}

export function cancelarGravacao() {
  if (agendamento !== null) {
    window.clearTimeout(agendamento);
    agendamento = null;
  }
}

async function ler(perfilId, chave, colecao) {
  const registro = await lerCofre(perfilId, colecao);
  if (!registro) {
    return null;
  }
  return decifrar(chave, registro);
}

async function gravar(perfilId, chave, colecao, valor) {
  return gravarCofre(perfilId, colecao, await cifrar(chave, valor));
}
