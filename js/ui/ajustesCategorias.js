import { ACOES, CATEGORIA_SEM_CLASSIFICACAO } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { contarUso, ehEditavel, existe } from '../nucleo/catalogo.js';
import { criarElemento } from './componentes.js';
import { pedirEscolha, pedirTexto } from './dialogos.js';

const TEXTO_VAZIO = '';

const TEXTOS = Object.freeze({
  TITULO: 'Categorias',
  AJUDA:
    'As categorias são suas. Crie as que fizerem sentido para o seu dinheiro, renomeie quando mudar de ideia e remova o que não usa — a planilha e as regras acompanham.',
  NOVA: 'Nova categoria',
  CRIAR: 'Criar',
  EXEMPLO: 'Pets',
  RENOMEAR: 'Renomear',
  RENOMEAR_TITULO: 'Renomear categoria',
  NOVO_NOME: 'Novo nome',
  REMOVER: 'Remover',
  REMOVER_TITULO: 'Remover categoria',
  DESTINO: 'Mover os lançamentos para',
  LANCAMENTO: 'lançamento',
  LANCAMENTOS: 'lançamentos',
  REGRA: 'regra',
  REGRAS: 'regras',
  SEM_USO: 'sem uso',
  FIXA: 'não é categoria, é o estado de quem ainda não tem uma',
  NOME_VAZIO: 'Escreva o nome da categoria.',
  NOME_REPETIDO: 'Já existe uma categoria com esse nome.'
});

export function secaoCategorias(estado) {
  return criarElemento('section', { class: 'ajustes__secao' }, [
    criarElemento('h2', { texto: TEXTOS.TITULO }),
    criarElemento('p', { class: 'ajustes__ajuda', texto: TEXTOS.AJUDA }),
    entradaDeCriacao(estado),
    criarElemento('div', { class: 'catalogo' }, estado.categorias.map((nome) => linha(nome, estado)))
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
        if (!existe(estado.categorias, campo.value)) {
          despachar(ACOES.CRIAR_CATEGORIA, campo.value);
        }
        campo.value = TEXTO_VAZIO;
      }
    })
  ]);
}

function linha(nome, estado) {
  const editavel = ehEditavel(nome);

  return criarElemento('div', { class: 'catalogo__linha' }, [
    criarElemento('span', { class: 'catalogo__nome', texto: nome }),
    criarElemento('span', { class: 'fraco', texto: editavel ? uso(nome, estado) : TEXTOS.FIXA }),
    editavel ? botaoRenomear(nome, estado) : null,
    editavel ? botaoRemover(nome, estado) : null
  ]);
}

function uso(nome, estado) {
  const lancamentos = contarUso(estado.lancamentos, nome);
  const regras = estado.regras.filter((regra) => regra.categoria === nome).length;

  if (lancamentos === 0 && regras === 0) {
    return TEXTOS.SEM_USO;
  }
  return `${contar(lancamentos, TEXTOS.LANCAMENTO, TEXTOS.LANCAMENTOS)} · ${contar(regras, TEXTOS.REGRA, TEXTOS.REGRAS)}`;
}

function contar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function botaoRenomear(nome, estado) {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.RENOMEAR,
    onClick: () =>
      pedirTexto({
        titulo: TEXTOS.RENOMEAR_TITULO,
        rotulo: TEXTOS.NOVO_NOME,
        valor: nome,
        acao: TEXTOS.RENOMEAR,
        aoConfirmar: (valor) => {
          const recusa = recusarNome(valor, nome, estado);
          if (recusa) {
            return recusa;
          }
          despachar(ACOES.RENOMEAR_CATEGORIA, { de: nome, para: valor });
          return TEXTO_VAZIO;
        }
      })
  });
}

function recusarNome(valor, atual, estado) {
  if (valor.trim() === TEXTO_VAZIO) {
    return TEXTOS.NOME_VAZIO;
  }
  if (valor !== atual && existe(estado.categorias, valor)) {
    return TEXTOS.NOME_REPETIDO;
  }
  return TEXTO_VAZIO;
}

function botaoRemover(nome, estado) {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.REMOVER,
    onClick: () =>
      pedirEscolha({
        titulo: `${TEXTOS.REMOVER_TITULO} "${nome}"`,
        texto: `${uso(nome, estado)} usam esta categoria.`,
        rotulo: TEXTOS.DESTINO,
        opcoes: destinos(nome, estado),
        acao: TEXTOS.REMOVER,
        aoConfirmar: (destino) => despachar(ACOES.REMOVER_CATEGORIA, { nome, destino })
      })
  });
}

function destinos(nome, estado) {
  const outras = estado.categorias.filter((item) => item !== nome && ehEditavel(item));
  return [CATEGORIA_SEM_CLASSIFICACAO, ...outras];
}
