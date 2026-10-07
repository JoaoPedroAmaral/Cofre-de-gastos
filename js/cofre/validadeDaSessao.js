import { MINUTOS_AUTO_LOCK, SEGUNDOS_ENTRE_RENOVACOES } from '../nucleo/constantes.js';

const MILISSEGUNDOS_POR_MINUTO = 60000;
const MILISSEGUNDOS_POR_SEGUNDO = 1000;
const SEM_TEMPO = 0;

export const JANELA_DE_INATIVIDADE = MINUTOS_AUTO_LOCK * MILISSEGUNDOS_POR_MINUTO;
export const INTERVALO_ENTRE_RENOVACOES = SEGUNDOS_ENTRE_RENOVACOES * MILISSEGUNDOS_POR_SEGUNDO;

export function tempoRestante(visto, agora) {
  if (!Number.isFinite(visto)) {
    return SEM_TEMPO;
  }
  const restante = JANELA_DE_INATIVIDADE - (agora - visto);
  return restante > SEM_TEMPO ? restante : SEM_TEMPO;
}

export function expirou(sessao, agora) {
  return !sessao || tempoRestante(sessao.visto, agora) === SEM_TEMPO;
}

export function daAba(sessao, marcador) {
  return Boolean(sessao) && Boolean(marcador) && sessao.marcador === marcador;
}

export function aproveitavel(sessao, marcador, agora) {
  return daAba(sessao, marcador) && !expirou(sessao, agora);
}

export function podeRenovar(ultimaGravacao, agora) {
  return agora - ultimaGravacao >= INTERVALO_ENTRE_RENOVACOES;
}
