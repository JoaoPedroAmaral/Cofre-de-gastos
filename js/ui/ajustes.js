import { criarElemento } from './componentes.js';
import { secaoIdentidade } from './ajustesIdentidade.js';
import { secaoCategorias } from './ajustesCategorias.js';
import { secaoTags } from './ajustesTags.js';

const TEXTOS = Object.freeze({
  TITULO: 'Ajustes',
  SUBTITULO: 'O que o sistema precisa saber sobre você para não confundir seu dinheiro com gasto.'
});

export function telaAjustes(estado) {
  return criarElemento('div', { class: 'tela' }, [
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TEXTOS.TITULO }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: TEXTOS.SUBTITULO })
    ]),
    secaoIdentidade(estado),
    secaoCategorias(estado),
    secaoTags(estado)
  ]);
}
