import { ACOES, DESCRICOES_TEMA, ORDEM_TEMAS, ROTULOS_TEMA, TEMAS } from '../nucleo/constantes.js';
import { despachar, obter } from '../estado/store.js';
import { abrirModal, criarElemento } from './componentes.js';
import { salvarTema } from './preferencias.js';

const TEXTOS = Object.freeze({
  TITULO: 'Tema',
  AJUDA: 'A escolha vale neste navegador e muda na hora.',
  FECHAR: 'Fechar',
  ATUAL: 'Em uso'
});

const AMOSTRAS = Object.freeze({
  [TEMAS.SISTEMA]: ['#0b0d0c', '#f7f6f3', '#e3b75a'],
  [TEMAS.ESCURO]: ['#0b0d0c', '#171b19', '#e3b75a'],
  [TEMAS.CLARO]: ['#f7f6f3', '#eceae3', '#8a6410'],
  [TEMAS.NOITE]: ['#0a0c11', '#171d29', '#e3b75a'],
  [TEMAS.PAPEL]: ['#f3eee3', '#e8e0cf', '#7a5410'],
  [TEMAS.CONTRASTE]: ['#000000', '#171717', '#ffc83d']
});

export function abrirMenuDeTemas() {
  const corpo = criarElemento('div', { class: 'temas' }, [
    criarElemento('p', { class: 'fraco', texto: TEXTOS.AJUDA }),
    criarElemento('div', { class: 'temas__lista', role: 'radiogroup', 'aria-label': TEXTOS.TITULO })
  ]);

  const modal = abrirModal({
    titulo: TEXTOS.TITULO,
    corpo,
    acoes: [{ rotulo: TEXTOS.FECHAR, aoClicar: () => modal.fechar() }]
  });

  const lista = corpo.querySelector('.temas__lista');
  lista.replaceChildren(...ORDEM_TEMAS.map((tema) => opcao(tema, lista)));
  return modal;
}

function opcao(tema, lista) {
  const escolhido = obter().tema === tema;

  return criarElemento(
    'button',
    {
      class: escolhido ? 'tema tema--ativo' : 'tema',
      type: 'button',
      role: 'radio',
      'aria-checked': String(escolhido),
      onClick: () => escolher(tema, lista)
    },
    [
      amostra(tema),
      criarElemento('span', { class: 'tema__nome', texto: ROTULOS_TEMA[tema] }),
      criarElemento('span', { class: 'tema__descricao fraco', texto: DESCRICOES_TEMA[tema] }),
      criarElemento('span', { class: 'tema__atual', texto: escolhido ? TEXTOS.ATUAL : '' })
    ]
  );
}

function amostra(tema) {
  return criarElemento(
    'span',
    { class: 'tema__amostra', 'aria-hidden': 'true' },
    AMOSTRAS[tema].map((cor) => {
      const faixa = criarElemento('span', { class: 'tema__faixa' });
      faixa.style.background = cor;
      return faixa;
    })
  );
}

function escolher(tema, lista) {
  despachar(ACOES.DEFINIR_TEMA, tema);
  salvarTema(tema);
  lista.replaceChildren(...ORDEM_TEMAS.map((cada) => opcao(cada, lista)));
}
