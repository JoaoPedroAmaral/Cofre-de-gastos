import { apagarSessao, gravarSessao, lerSessao } from '../armazenamento/banco.js';
import { esquecerMarcador, marcadorDaAba } from './marcadorDeAba.js';
import { aproveitavel, expirou, podeRenovar, tempoRestante } from './validadeDaSessao.js';

const NUNCA = 0;

let ultimaGravacao = NUNCA;

export async function guardar(perfilId, chave) {
  const marcador = marcadorDaAba();
  if (!marcador) {
    return false;
  }

  const agora = Date.now();

  try {
    await gravarSessao({ perfilId, chave, marcador, visto: agora });
    ultimaGravacao = agora;
    return true;
  } catch {
    return false;
  }
}

export async function renovar(perfilId, chave) {
  if (!podeRenovar(ultimaGravacao, Date.now())) {
    return false;
  }
  return guardar(perfilId, chave);
}

export async function recuperar() {
  const guardada = await lerComCuidado();
  if (!guardada) {
    return null;
  }

  const agora = Date.now();

  if (expirou(guardada, agora)) {
    await esquecer();
    return null;
  }
  if (!aproveitavel(guardada, marcadorDaAba(), agora)) {
    return null;
  }

  return {
    perfilId: guardada.perfilId,
    chave: guardada.chave,
    restante: tempoRestante(guardada.visto, agora)
  };
}

export async function esquecer() {
  ultimaGravacao = NUNCA;
  esquecerMarcador();

  try {
    await apagarSessao();
  } catch {
    return;
  }
}

async function lerComCuidado() {
  try {
    return await lerSessao();
  } catch {
    return null;
  }
}
