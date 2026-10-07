import { esquecer, guardar, renovar } from './sessaoGuardada.js';
import { JANELA_DE_INATIVIDADE } from './validadeDaSessao.js';

const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'keydown', 'wheel'];

let chaveEmMemoria = null;
let perfilAberto = null;
let temporizador = null;
let aoTravar = null;

export async function abrirSessao(perfil, chave, aoTravarAgora) {
  assumir(perfil, chave, aoTravarAgora, JANELA_DE_INATIVIDADE);
  await guardar(perfil.id, chave);
}

export function retomarSessao(perfil, chave, aoTravarAgora, restante) {
  assumir(perfil, chave, aoTravarAgora, restante);
}

export function travar() {
  chaveEmMemoria = null;
  perfilAberto = null;
  cancelar();

  EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, aoAgir));
  esquecer();

  if (aoTravar) {
    const avisar = aoTravar;
    aoTravar = null;
    avisar();
  }
}

function assumir(perfil, chave, aoTravarAgora, tempo) {
  chaveEmMemoria = chave;
  perfilAberto = perfil;
  aoTravar = aoTravarAgora;

  EVENTOS_DE_ATIVIDADE.forEach((evento) => window.addEventListener(evento, aoAgir, { passive: true }));
  adiar(tempo);
}

function aoAgir() {
  adiar(JANELA_DE_INATIVIDADE);
  if (perfilAberto && chaveEmMemoria) {
    renovar(perfilAberto.id, chaveEmMemoria);
  }
}

function adiar(tempo) {
  cancelar();
  temporizador = window.setTimeout(travar, tempo);
}

function cancelar() {
  if (temporizador !== null) {
    window.clearTimeout(temporizador);
    temporizador = null;
  }
}
