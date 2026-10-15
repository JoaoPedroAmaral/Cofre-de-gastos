import { ENDERECO_DO_TERMO } from '../../privacidade/termo.js';
import { criarElemento } from '../componentes.js';
import { marca } from '../icones.js';
import { TEXTOS } from './textos.js';

const TAMANHO_DA_MARCA = 64;
const PRIMEIRO_PASSO = 1;
const SEM_INICIAL = '?';

export function trocarTela(conteudo) {
  document.getElementById('app').replaceChildren(conteudo);
}

export function paragrafoDeAjuda(ajuda) {
  if (typeof ajuda === 'string') {
    return criarElemento('p', { class: 'fraco', texto: ajuda });
  }
  return ajuda;
}

export function moldura(titulo, ajuda, conteudo) {
  return criarElemento('div', { class: 'cofre' }, [
    criarElemento('div', { class: 'cofre__caixa' }, [
      criarElemento('span', { class: 'cofre__marca' }, [marca(TAMANHO_DA_MARCA)]),
      criarElemento('div', { class: 'cofre__titulo' }, [
        criarElemento('h1', { texto: titulo }),
        paragrafoDeAjuda(ajuda)
      ]),
      ...conteudo
    ]),
    criarElemento('p', { class: 'cofre__rodape fraco' }, [
      criarElemento('span', { texto: `${TEXTOS.RODAPE} ` }),
      criarElemento('a', { href: ENDERECO_DO_TERMO, texto: TEXTOS.LER_TERMO })
    ])
  ]);
}

export function passos(ativo) {
  return criarElemento(
    'div',
    { class: 'passos' },
    TEXTOS.PASSOS.map((rotulo, indice) =>
      criarElemento('span', { class: indice + PRIMEIRO_PASSO === ativo ? 'passo passo--ativo' : 'passo' }, [
        criarElemento('b', { texto: String(indice + PRIMEIRO_PASSO) }),
        criarElemento('span', { texto: rotulo })
      ])
    )
  );
}

export function campoSecreto(id, rotulo, tipo = 'password', preenchimento = 'current-password') {
  return criarElemento('input', {
    class: 'campo__entrada campo__entrada--grande',
    id,
    type: tipo,
    'aria-label': rotulo,
    autocomplete: tipo === 'password' ? preenchimento : 'off'
  });
}

export function rotulado(entrada, rotulo) {
  return criarElemento('span', { class: 'campo' }, [
    criarElemento('label', { class: 'campo__rotulo', for: entrada.id, texto: rotulo }),
    entrada
  ]);
}

export function inicialDe(nome) {
  return String(nome ?? '').trim().charAt(0).toUpperCase() || SEM_INICIAL;
}
