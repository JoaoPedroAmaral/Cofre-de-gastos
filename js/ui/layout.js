import { ACOES, ORDEM_TELAS, ROTULOS_TELA, TEMAS } from '../nucleo/constantes.js';
import { despachar, observar, obter } from '../estado/store.js';
import { criarElemento } from './componentes.js';
import { icone, marca } from './icones.js';
import { lerTema } from './preferencias.js';
import { preservarFoco } from './foco.js';
import { travar } from '../cofre/sessao.js';

const NOME_SISTEMA = 'Gastos Controller';
const ROTULO_TRAVAR = 'Travar';
const DESCRICAO_TRAVAR = 'Trancar o cofre agora. Ele tranca sozinho depois de um tempo parado';
const CONSULTA_CLARO = '(prefers-color-scheme: light)';
const ICONE_DA_TRILHA = 20;
const TEXTO_VAZIO = '';

const telas = new Map();

let cancelarObservacao = null;
let telaDesenhada = null;

export function registrarTela(id, renderizar) {
  const definicao = typeof renderizar === 'function' ? { montar: renderizar } : renderizar;
  telas.set(id, definicao);
}

export function montarLayout(raiz) {
  if (cancelarObservacao) {
    cancelarObservacao();
    cancelarObservacao = null;
  }

  const conteudo = criarElemento('main', { class: 'conteudo', id: 'conteudo', tabindex: '-1' });
  const navegacao = criarElemento('nav', { class: 'rail', 'aria-label': 'Seções' });

  navegacao.append(criarElemento('span', { class: 'rail__marca', 'aria-label': NOME_SISTEMA, role: 'img' }, [marca()]));

  ORDEM_TELAS.forEach((id) => {
    navegacao.append(
      criarElemento(
        'button',
        {
          class: 'rail__item',
          type: 'button',
          dataset: { tela: id },
          onClick: () => despachar(ACOES.TROCAR_TELA, id)
        },
        [icone(id, ICONE_DA_TRILHA), criarElemento('span', { texto: ROTULOS_TELA[id] })]
      )
    );
  });

  const botaoTravar = criarElemento(
    'button',
    {
      class: 'rail__item rail__item--rodape',
      type: 'button',
      title: DESCRICAO_TRAVAR,
      'aria-label': `${ROTULO_TRAVAR}. ${DESCRICAO_TRAVAR}`,
      onClick: travar
    },
    [icone('travar', ICONE_DA_TRILHA), criarElemento('span', { texto: ROTULO_TRAVAR })]
  );

  navegacao.append(botaoTravar);
  raiz.replaceChildren(navegacao, conteudo);
  raiz.classList.add('app');

  telaDesenhada = null;
  cancelarObservacao = observar(() => atualizar(conteudo, navegacao));
  atualizar(conteudo, navegacao);
}

export function desmontarLayout(raiz) {
  if (cancelarObservacao) {
    cancelarObservacao();
    cancelarObservacao = null;
  }

  telaDesenhada = null;
  raiz.classList.remove('app');
  raiz.replaceChildren();
}

export function aplicarTemaSalvo() {
  const salvo = lerTema();
  if (salvo && salvo !== obter().tema) {
    despachar(ACOES.DEFINIR_TEMA, salvo);
    return;
  }
  aplicarTema(obter().tema);
}

function atualizar(conteudo, navegacao) {
  const estado = obter();

  aplicarTema(estado.tema);

  navegacao.querySelectorAll('.rail__item[data-tela]').forEach((item) => {
    if (item.dataset.tela === estado.tela) {
      item.setAttribute('aria-current', 'page');
      return;
    }
    item.removeAttribute('aria-current');
  });

  preservarFoco(() => desenharTela(conteudo, estado));
}

function desenharTela(conteudo, estado) {
  const definicao = telas.get(estado.tela);
  if (!definicao) {
    conteudo.replaceChildren(document.createTextNode(TEXTO_VAZIO));
    telaDesenhada = null;
    return;
  }

  const desenhada = conteudo.firstElementChild;
  const podeAtualizar = telaDesenhada === estado.tela && Boolean(definicao.atualizar) && Boolean(desenhada);
  if (podeAtualizar) {
    definicao.atualizar(desenhada, estado);
    return;
  }

  conteudo.replaceChildren(definicao.montar(estado));
  telaDesenhada = estado.tela;
}

function aplicarTema(tema) {
  const conhecido = Object.values(TEMAS).includes(tema) ? tema : TEMAS.SISTEMA;
  const resolvido = conhecido === TEMAS.SISTEMA ? temaDoSistema() : conhecido;

  if (resolvido === TEMAS.ESCURO) {
    delete document.documentElement.dataset.tema;
    return;
  }
  document.documentElement.dataset.tema = resolvido;
}

function temaDoSistema() {
  return window.matchMedia(CONSULTA_CLARO).matches ? TEMAS.CLARO : TEMAS.ESCURO;
}
