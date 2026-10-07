import { NIVEIS_AVISO } from '../nucleo/constantes.js';
import { avisar, criarElemento } from './componentes.js';
import { ENDERECO_DO_TERMO } from '../privacidade/termo.js';
import { CLASSE_DA_COLUNA, corpoDoTermo } from '../privacidade/corpo.js';

const TEXTOS = Object.freeze({
  PUBLICA: 'Esta página também existe fora do cofre, para você ler sem destravar nada ou mandar para alguém:',
  ABRIR: 'Abrir',
  COPIAR: 'Copiar link',
  COPIADO: 'Link copiado.',
  SEM_COPIA: 'O navegador não deixou copiar. O endereço está escrito aí ao lado.'
});

export function telaPrivacidade() {
  return criarElemento('div', { class: 'tela' }, [
    criarElemento(
      'div',
      { class: CLASSE_DA_COLUNA },
      corpoDoTermo(criarElemento, chamadaDaPaginaPublica())
    )
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
