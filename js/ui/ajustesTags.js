import { ACOES } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { normalizarTag, tagsDe } from '../nucleo/tags.js';
import { criarElemento } from './componentes.js';
import { pedirTexto } from './dialogos.js';

const TEXTO_VAZIO = '';

const TEXTOS = Object.freeze({
  TITULO: 'Tags',
  AJUDA:
    'Tag é o seu recorte livre: recorrente, trabalho, viagem. Uma tag posta por você convive com as que vêm de regra, e não é apagada quando o sistema reclassifica o lançamento.',
  NOVA: 'Nova tag',
  CRIAR: 'Criar',
  EXEMPLO: 'recorrente',
  RENOMEAR: 'Renomear',
  RENOMEAR_TITULO: 'Renomear tag',
  NOVO_NOME: 'Novo nome',
  REMOVER: 'Remover',
  REMOVER_TITULO: 'Remover tag',
  CONFIRMAR_REMOCAO: 'Escreva o nome da tag para confirmar',
  VAZIO: 'Nenhuma tag ainda. Crie aqui ou direto na planilha.',
  LANCAMENTO: 'lançamento',
  LANCAMENTOS: 'lançamentos',
  SEM_USO: 'sem uso',
  NOME_VAZIO: 'Escreva o nome da tag.',
  NOME_REPETIDO: 'Já existe uma tag com esse nome.',
  CONFIRMACAO_ERRADA: 'O nome não confere.'
});

export function secaoTags(estado) {
  return criarElemento('section', { class: 'ajustes__secao' }, [
    criarElemento('h2', { texto: TEXTOS.TITULO }),
    criarElemento('p', { class: 'ajustes__ajuda', texto: TEXTOS.AJUDA }),
    entradaDeCriacao(estado),
    estado.tags.length === 0
      ? criarElemento('p', { class: 'fraco', texto: TEXTOS.VAZIO })
      : criarElemento('div', { class: 'catalogo' }, estado.tags.map((tag) => linha(tag, estado)))
  ]);
}

function entradaDeCriacao(estado) {
  const campo = criarElemento('input', {
    class: 'campo__entrada',
    type: 'text',
    placeholder: TEXTOS.EXEMPLO,
    'aria-label': TEXTOS.NOVA
  });

  return criarElemento('div', { class: 'ajustes__entrada' }, [
    campo,
    criarElemento('button', {
      class: 'botao',
      type: 'button',
      texto: TEXTOS.CRIAR,
      onClick: () => {
        despachar(ACOES.CRIAR_TAG, campo.value);
        campo.value = TEXTO_VAZIO;
      }
    })
  ]);
}

function linha(tag, estado) {
  return criarElemento('div', { class: 'catalogo__linha' }, [
    criarElemento('span', { class: 'catalogo__nome', texto: tag }),
    criarElemento('span', { class: 'fraco', texto: uso(tag, estado) }),
    botaoRenomear(tag, estado),
    botaoRemover(tag, estado)
  ]);
}

function quantosUsam(tag, estado) {
  return estado.lancamentos.filter((lancamento) => tagsDe(lancamento).includes(tag)).length;
}

function uso(tag, estado) {
  const quantidade = quantosUsam(tag, estado);
  if (quantidade === 0) {
    return TEXTOS.SEM_USO;
  }
  return `${quantidade} ${quantidade === 1 ? TEXTOS.LANCAMENTO : TEXTOS.LANCAMENTOS}`;
}

function botaoRenomear(tag, estado) {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.RENOMEAR,
    onClick: () =>
      pedirTexto({
        titulo: TEXTOS.RENOMEAR_TITULO,
        rotulo: TEXTOS.NOVO_NOME,
        valor: tag,
        acao: TEXTOS.RENOMEAR,
        aoConfirmar: (valor) => {
          const limpa = normalizarTag(valor);
          if (limpa === TEXTO_VAZIO) {
            return TEXTOS.NOME_VAZIO;
          }
          if (limpa !== tag && estado.tags.includes(limpa)) {
            return TEXTOS.NOME_REPETIDO;
          }
          despachar(ACOES.RENOMEAR_TAG, { de: tag, para: limpa });
          return TEXTO_VAZIO;
        }
      })
  });
}

function botaoRemover(tag, estado) {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.REMOVER,
    onClick: () =>
      pedirTexto({
        titulo: `${TEXTOS.REMOVER_TITULO} "${tag}"`,
        rotulo: `${uso(tag, estado)}. ${TEXTOS.CONFIRMAR_REMOCAO}`,
        exemplo: tag,
        acao: TEXTOS.REMOVER,
        aoConfirmar: (valor) => {
          if (normalizarTag(valor) !== tag) {
            return TEXTOS.CONFIRMACAO_ERRADA;
          }
          despachar(ACOES.REMOVER_TAG_DO_CATALOGO, tag);
          return TEXTO_VAZIO;
        }
      })
  });
}
