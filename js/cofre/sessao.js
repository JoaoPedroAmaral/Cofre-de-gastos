import { MINUTOS_AUTO_LOCK } from '../nucleo/constantes.js';

const MILISSEGUNDOS_POR_MINUTO = 60000;
const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'keydown', 'wheel'];

let chaveEmMemoria = null;
let perfilAberto = null;
let temporizador = null;
let aoTravar = null;

export function abrirSessao(perfil, chave, aoTravarAgora) {
  chaveEmMemoria = chave;
  perfilAberto = perfil;
  aoTravar = aoTravarAgora;

  EVENTOS_DE_ATIVIDADE.forEach((evento) => window.addEventListener(evento, adiar, { passive: true }));
  window.addEventListener('beforeunload', travar);
  adiar();
}

export function travar() {
  chaveEmMemoria = null;
  perfilAberto = null;
  cancelar();

  EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, adiar));
  window.removeEventListener('beforeunload', travar);

  if (aoTravar) {
    const avisar = aoTravar;
    aoTravar = null;
    avisar();
  }
}

function adiar() {
  cancelar();
  temporizador = window.setTimeout(travar, MINUTOS_AUTO_LOCK * MILISSEGUNDOS_POR_MINUTO);
}

function cancelar() {
  if (temporizador !== null) {
    window.clearTimeout(temporizador);
    temporizador = null;
  }
}
