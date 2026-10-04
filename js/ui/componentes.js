import { DURACAO_AVISO_MS, NIVEIS_AVISO } from '../nucleo/constantes.js';

const CLASSE_AVISOS = 'avisos';
const PREFIXO_TITULO_MODAL = 'modal-titulo-';
const SELETOR_FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
const TECLA_ESCAPE = 'Escape';
const TECLA_TAB = 'Tab';
const ID_CONTEUDO = 'conteudo';

export function criarElemento(etiqueta, atributos = {}, filhos = []) {
  const elemento = document.createElement(etiqueta);

  Object.entries(atributos).forEach(([nome, valor]) => {
    if (valor === null || valor === undefined || valor === false) {
      return;
    }
    if (nome === 'texto') {
      elemento.textContent = valor;
      return;
    }
    if (nome === 'dataset') {
      Object.assign(elemento.dataset, valor);
      return;
    }
    if (nome.startsWith('on')) {
      elemento.addEventListener(nome.slice(2).toLowerCase(), valor);
      return;
    }
    elemento.setAttribute(nome, valor);
  });

  const lista = Array.isArray(filhos) ? filhos : [filhos];
  lista.filter(Boolean).forEach((filho) => elemento.append(filho));

  return elemento;
}

export function estadoVazio({ titulo, texto, nota }) {
  return criarElemento('section', { class: 'estado-vazio' }, [
    criarElemento('h2', { class: 'estado-vazio__titulo', texto: titulo }),
    criarElemento('p', { class: 'estado-vazio__texto', texto }),
    nota ? criarElemento('p', { class: 'estado-vazio__nota', texto: nota }) : null
  ]);
}

let modaisAbertos = 0;

export function abrirModal({ titulo, corpo, acoes = [] }) {
  const focoAnterior = document.activeElement;
  modaisAbertos += 1;
  const idTitulo = `${PREFIXO_TITULO_MODAL}${modaisAbertos}`;
  const fundo = criarElemento('div', { class: 'modal', onKeydown: (evento) => aoTeclar(evento, fundo, acoes) });

  const botoes = acoes.map((acao) =>
    criarElemento('button', {
      class: acao.principal ? 'botao botao--principal' : 'botao',
      type: 'button',
      texto: acao.rotulo,
      onClick: acao.aoClicar
    })
  );

  fundo.append(
    criarElemento(
      'div',
      {
        class: 'modal__caixa',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': idTitulo,
        tabindex: '-1'
      },
      [
        criarElemento('h3', { class: 'modal__titulo', id: idTitulo, texto: titulo }),
        criarElemento('div', { class: 'modal__corpo' }, [corpo]),
        criarElemento('div', { class: 'modal__acoes' }, botoes)
      ]
    )
  );

  document.body.append(fundo);
  primeiroFocavel(fundo).focus();

  return {
    elemento: fundo,
    fechar: () => {
      fundo.remove();
      devolverFoco(focoAnterior);
    }
  };
}

function aoTeclar(evento, fundo, acoes) {
  if (evento.key === TECLA_ESCAPE) {
    const saida = acoes.find((acao) => !acao.principal);
    if (saida) {
      evento.preventDefault();
      saida.aoClicar();
    }
    return;
  }
  if (evento.key === TECLA_TAB) {
    prenderFoco(evento, fundo);
  }
}

function prenderFoco(evento, fundo) {
  const focaveis = [...fundo.querySelectorAll(SELETOR_FOCAVEIS)];
  if (focaveis.length === 0) {
    return;
  }

  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  const alvo = evento.shiftKey ? primeiro : ultimo;
  if (document.activeElement !== alvo) {
    return;
  }

  evento.preventDefault();
  (evento.shiftKey ? ultimo : primeiro).focus();
}

function primeiroFocavel(fundo) {
  return fundo.querySelector(SELETOR_FOCAVEIS) || fundo.querySelector('.modal__caixa');
}

function devolverFoco(elemento) {
  if (elemento && document.contains(elemento)) {
    elemento.focus();
    return;
  }
  document.getElementById(ID_CONTEUDO)?.focus();
}

export function avisar(mensagem, nivel = NIVEIS_AVISO.INFO) {
  const aviso = criarElemento('p', {
    class: `aviso aviso--${nivel}`,
    role: 'status',
    texto: mensagem
  });

  recipienteAvisos().append(aviso);
  window.setTimeout(() => aviso.remove(), DURACAO_AVISO_MS);

  return aviso;
}

function recipienteAvisos() {
  const existente = document.querySelector(`.${CLASSE_AVISOS}`);
  if (existente) {
    return existente;
  }
  const criado = criarElemento('div', { class: CLASSE_AVISOS, 'aria-live': 'polite' });
  document.body.append(criado);
  return criado;
}
