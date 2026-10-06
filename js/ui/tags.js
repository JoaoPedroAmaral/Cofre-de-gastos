import { ACOES } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { normalizarTag, tagsDe } from '../nucleo/tags.js';
import { criarElemento } from './componentes.js';
import { pedirTexto } from './dialogos.js';

const TEXTO_VAZIO = '';
const SINAL_REMOVER = '×';
const SINAL_ACRESCENTAR = '+';

const TEXTOS = Object.freeze({
  ACRESCENTAR: 'Acrescentar tag',
  TITULO: 'Nova tag',
  ROTULO: 'Tag',
  EXEMPLO: 'recorrente',
  CONFIRMAR: 'Acrescentar',
  REMOVER: 'Tirar a tag',
  DA_REGRA: 'veio da regra que categorizou este lançamento',
  VAZIA: 'Escreva a tag.'
});

export function celulaDeTags(lancamento, estado) {
  const daRegra = new Set(lancamento.tags ?? []);

  return criarElemento('div', { class: 'tags' }, [
    ...tagsDe(lancamento).map((tag) => ficha(tag, lancamento, daRegra.has(tag))),
    botaoDeAcrescentar([lancamento.id], estado)
  ]);
}

export function acrescentarEmLote(ids, estado) {
  return botaoDeAcrescentar(ids, estado, TEXTOS.ACRESCENTAR);
}

function ficha(tag, lancamento, veioDaRegra) {
  if (veioDaRegra) {
    return criarElemento('span', { class: 'tag tag--regra', title: TEXTOS.DA_REGRA, texto: tag });
  }

  return criarElemento('span', { class: 'tag' }, [
    criarElemento('span', { texto: tag }),
    criarElemento('button', {
      class: 'tag__remover',
      type: 'button',
      texto: SINAL_REMOVER,
      'aria-label': `${TEXTOS.REMOVER} ${tag}`,
      onClick: () => despachar(ACOES.REMOVER_TAG, { ids: [lancamento.id], tag })
    })
  ]);
}

function botaoDeAcrescentar(ids, estado, rotulo = SINAL_ACRESCENTAR) {
  return criarElemento('button', {
    class: rotulo === SINAL_ACRESCENTAR ? 'tag tag--acao' : 'botao',
    type: 'button',
    texto: rotulo,
    'aria-label': TEXTOS.ACRESCENTAR,
    title: TEXTOS.ACRESCENTAR,
    onClick: () =>
      pedirTexto({
        titulo: TEXTOS.TITULO,
        rotulo: TEXTOS.ROTULO,
        exemplo: TEXTOS.EXEMPLO,
        sugestoes: estado.tags,
        acao: TEXTOS.CONFIRMAR,
        aoConfirmar: (valor) => {
          if (normalizarTag(valor) === TEXTO_VAZIO) {
            return TEXTOS.VAZIA;
          }
          despachar(ACOES.ACRESCENTAR_TAG, { ids, tag: valor });
          return TEXTO_VAZIO;
        }
      })
  });
}
