import {
  ACOES,
  ORDEM_TEMAS,
  ORDEM_TELAS,
  ROTULOS_TELA,
  ROTULOS_TEMA,
  TELAS,
  TEMAS
} from '../nucleo/constantes.js';
import { despachar, observar, obter } from '../estado/store.js';
import { criarElemento } from './componentes.js';
import { icone, marca } from './icones.js';
import { lerTema, salvarTema } from './preferencias.js';
import { preservarFoco } from './foco.js';
import { travar } from '../cofre/sessao.js';

const NOME_SISTEMA = 'Gastos Controller';
const ROTULO_TRAVAR = 'Travar';
const ROTULO_TEMA = 'Tema';
const DESCRICAO_TRAVAR = 'Trancar o cofre agora. Ele tranca sozinho depois de um tempo parado';
const CONSULTA_CLARO = '(prefers-color-scheme: light)';
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
        [icone(id), criarElemento('span', { texto: ROTULOS_TELA[id] })]
      )
    );
  });

  const botaoPrivacidade = criarElemento(
    'button',
    {
      class: 'rail__item rail__item--rodape',
      type: 'button',
      dataset: { tela: TELAS.PRIVACIDADE },
      onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.PRIVACIDADE)
    },
    [icone(TELAS.PRIVACIDADE), criarElemento('span', { texto: ROTULOS_TELA[TELAS.PRIVACIDADE] })]
  );

  const botaoTravar = criarElemento(
    'button',
    {
      class: 'rail__item',
      type: 'button',
      title: DESCRICAO_TRAVAR,
      'aria-label': `${ROTULO_TRAVAR}. ${DESCRICAO_TRAVAR}`,
      onClick: travar
    },
    [icone('travar'), criarElemento('span', { texto: ROTULO_TRAVAR })]
  );

  const botaoTema = criarElemento(
    'button',
    {
      class: 'rail__item',
      type: 'button',
      onClick: alternarTema
    },
    [icone('tema'), criarElemento('span', { texto: ROTULO_TEMA })]
  );

  navegacao.append(botaoPrivacidade, botaoTravar, botaoTema);
  raiz.replaceChildren(navegacao, conteudo);
  raiz.classList.add('app');

  telaDesenhada = null;
  cancelarObservacao = observar(() => atualizar(conteudo, navegacao, botaoTema));
  atualizar(conteudo, navegacao, botaoTema);
}

export function aplicarTemaSalvo() {
  const salvo = lerTema();
  if (salvo && salvo !== obter().tema) {
    despachar(ACOES.DEFINIR_TEMA, salvo);
    return;
  }
  aplicarTema(obter().tema);
}

function atualizar(conteudo, navegacao, botaoTema) {
  const estado = obter();

  aplicarTema(estado.tema);
  botaoTema.title = ROTULOS_TEMA[estado.tema];
  botaoTema.setAttribute('aria-label', `Alternar tema. Atual: ${ROTULOS_TEMA[estado.tema]}`);

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

function alternarTema() {
  const atual = obter().tema;
  const proximo = ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(atual) + 1) % ORDEM_TEMAS.length];
  despachar(ACOES.DEFINIR_TEMA, proximo);
  salvarTema(proximo);
}

function aplicarTema(tema) {
  const resolvido = tema === TEMAS.SISTEMA ? temaDoSistema() : tema;

  if (resolvido === TEMAS.ESCURO) {
    delete document.documentElement.dataset.tema;
    return;
  }
  document.documentElement.dataset.tema = resolvido;
}

function temaDoSistema() {
  return window.matchMedia(CONSULTA_CLARO).matches ? TEMAS.CLARO : TEMAS.ESCURO;
}
