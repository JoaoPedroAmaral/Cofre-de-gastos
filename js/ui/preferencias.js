import { CHAVE_PREFERENCIA_TEMA, ORDEM_TEMAS } from '../nucleo/constantes.js';

export function lerTema() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_PREFERENCIA_TEMA);
    return ORDEM_TEMAS.includes(salvo) ? salvo : null;
  } catch {
    return null;
  }
}

export function salvarTema(tema) {
  try {
    window.localStorage.setItem(CHAVE_PREFERENCIA_TEMA, tema);
  } catch {
    return;
  }
}
