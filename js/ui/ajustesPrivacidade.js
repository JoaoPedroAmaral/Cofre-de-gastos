import { ACOES, TELAS } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { criarElemento } from './componentes.js';
import { ENDERECO_DO_TERMO } from '../privacidade/termo.js';
import { icone } from './icones.js';

const TAMANHO_DO_ICONE = 16;

const TEXTOS = Object.freeze({
  TITULO: 'Privacidade',
  AJUDA: 'O que sai do seu aparelho, onde os dados ficam e como apagar tudo.',
  GARANTIA: 'Nada do que você importa sai deste navegador.',
  LER: 'Ler o termo',
  PUBLICA: 'O termo também existe fora do cofre, em endereço próprio, para ler sem destravar nada.',
  ABRIR_FORA: 'Abrir em nova aba'
});

export function secaoPrivacidade() {
  return criarElemento('section', { class: 'ajustes__secao' }, [
    criarElemento('h2', { texto: TEXTOS.TITULO }),
    criarElemento('p', { class: 'ajustes__ajuda', texto: TEXTOS.AJUDA }),
    criarElemento('p', { class: 'privacidade' }, [
      icone('travar', TAMANHO_DO_ICONE),
      criarElemento('span', { texto: TEXTOS.GARANTIA })
    ]),
    criarElemento('div', { class: 'ajustes__entrada' }, [
      criarElemento('button', {
        class: 'botao',
        type: 'button',
        texto: TEXTOS.LER,
        onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.PRIVACIDADE)
      }),
      criarElemento('a', {
        class: 'botao botao--discreto',
        href: ENDERECO_DO_TERMO,
        target: '_blank',
        rel: 'noopener',
        texto: TEXTOS.ABRIR_FORA
      })
    ]),
    criarElemento('p', { class: 'ajustes__ajuda', texto: TEXTOS.PUBLICA })
  ]);
}
