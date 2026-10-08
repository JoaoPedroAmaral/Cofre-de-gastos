import { ACOES, PRIMEIRA_PAGINA } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { paginaValida, precisaPaginar, totalDePaginas } from '../nucleo/paginar.js';
import { criarElemento } from './componentes.js';
import { icone } from './icones.js';

const TAMANHO_DO_ICONE = 18;

const TEXTOS = Object.freeze({
  ANTERIOR: 'Página anterior',
  PROXIMA: 'Próxima página',
  DE: 'de'
});

export function navegacaoDePaginas({ contexto, pagina, quantidade, tamanho, rotuloDoTotal }) {
  if (!precisaPaginar(quantidade, tamanho)) {
    return criarElemento('div');
  }

  const total = totalDePaginas(quantidade, tamanho);
  const atual = paginaValida(pagina, quantidade, tamanho);

  return criarElemento('div', { class: 'paginacao' }, [
    criarElemento('span', { class: 'paginacao__total fraco', texto: rotuloDoTotal }),
    criarElemento('div', { class: 'paginacao__controles' }, [
      botao(TEXTOS.ANTERIOR, 'anterior', contexto, atual - 1, atual > PRIMEIRA_PAGINA),
      criarElemento('span', {
        class: 'paginacao__posicao mono',
        texto: `${atual} ${TEXTOS.DE} ${total}`
      }),
      botao(TEXTOS.PROXIMA, 'proximo', contexto, atual + 1, atual < total)
    ])
  ]);
}

function botao(rotulo, desenho, contexto, destino, ativo) {
  const elemento = criarElemento(
    'button',
    {
      class: 'botao',
      type: 'button',
      'aria-label': rotulo,
      onClick: () => despachar(ACOES.DEFINIR_PAGINA, { contexto, pagina: destino })
    },
    [icone(desenho, TAMANHO_DO_ICONE)]
  );

  elemento.disabled = !ativo;
  return elemento;
}
