import { NIVEIS_AVISO } from '../nucleo/constantes.js';
import { avisar, criarElemento } from './componentes.js';
import { icone } from './icones.js';
import { TERMO, ENDERECO_DO_TERMO } from '../privacidade/termo.js';
import { secoesDoTermo, versaoDoTermo } from '../privacidade/conteudo.js';

const TEXTOS = Object.freeze({
  PUBLICA: 'Esta página também existe fora do cofre, para você ler sem destravar nada ou mandar para alguém:',
  ABRIR: 'Abrir',
  COPIAR: 'Copiar link',
  COPIADO: 'Link copiado.',
  SEM_COPIA: 'O navegador não deixou copiar. O endereço está escrito aí ao lado.'
});

export function telaPrivacidade() {
  return criarElemento('div', { class: 'tela tela--texto' }, [
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TERMO.titulo }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: TERMO.resumo })
    ]),
    chamadaDaPaginaPublica(),
    criarElemento('p', { class: 'privacidade' }, [
      icone('travar', 16),
      criarElemento('span', { texto: TERMO.nota })
    ]),
    criarElemento('p', { class: 'fraco', texto: versaoDoTermo() }),
    ...secoesDoTermo(criarElemento)
  ]);
}

function chamadaDaPaginaPublica() {
  const endereco = enderecoCompleto();

  return criarElemento('div', { class: 'faixa-publica' }, [
    criarElemento('p', { class: 'faixa-publica__texto', texto: TEXTOS.PUBLICA }),
    criarElemento('div', { class: 'faixa-publica__acoes' }, [
      criarElemento('span', { class: 'mono faixa-publica__endereco', texto: endereco }),
      criarElemento('a', {
        class: 'botao',
        href: ENDERECO_DO_TERMO,
        target: '_blank',
        rel: 'noopener',
        texto: TEXTOS.ABRIR
      }),
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.COPIAR,
        onClick: () => copiar(endereco)
      })
    ])
  ]);
}

function enderecoCompleto() {
  return `${window.location.origin}${ENDERECO_DO_TERMO}`;
}

async function copiar(endereco) {
  try {
    await navigator.clipboard.writeText(endereco);
    avisar(TEXTOS.COPIADO, NIVEIS_AVISO.SUCESSO);
  } catch {
    avisar(TEXTOS.SEM_COPIA, NIVEIS_AVISO.ATENCAO);
  }
}
