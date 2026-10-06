import { criarElemento } from './componentes.js';
import { icone } from './icones.js';
import { TERMO, ENDERECO_DO_TERMO } from '../privacidade/termo.js';
import { secoesDoTermo, versaoDoTermo } from '../privacidade/conteudo.js';

const TEXTOS = Object.freeze({
  PAGINA_PUBLICA: 'Abrir em página própria, para ler sem o cofre ou mandar para alguém'
});

export function telaPrivacidade() {
  return criarElemento('div', { class: 'tela tela--texto' }, [
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TERMO.titulo }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: TERMO.resumo })
    ]),
    criarElemento('p', { class: 'privacidade' }, [
      icone('travar', 16),
      criarElemento('span', { texto: TERMO.nota })
    ]),
    criarElemento('p', { class: 'fraco', texto: versaoDoTermo() }),
    criarElemento('p', {}, [
      criarElemento('a', {
        class: 'botao botao--discreto',
        href: ENDERECO_DO_TERMO,
        target: '_blank',
        rel: 'noopener',
        texto: TEXTOS.PAGINA_PUBLICA
      })
    ]),
    ...secoesDoTermo(criarElemento)
  ]);
}
