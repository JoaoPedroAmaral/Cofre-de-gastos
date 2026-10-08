import {
  ABAS_REGRAS,
  ACOES,
  CATEGORIA_SEM_CLASSIFICACAO,
  CONTEXTOS_DE_PAGINA,
  OPERADORES_REGRA,
  ORIGENS_REGRA,
  ROTULOS_ABA_REGRAS,
  TAMANHO_DE_PAGINA
} from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { ROTULOS_OPERADOR, alcance, contarAcertos, criarRegra, validar } from '../nucleo/regras.js';
import { criarElemento } from './componentes.js';
import { navegacaoDePaginas } from './paginacao.js';
import { fatiar } from '../nucleo/paginar.js';

const CONTEXTO = CONTEXTOS_DE_PAGINA.REGRAS;
const TAMANHO_DA_PAGINA = TAMANHO_DE_PAGINA[CONTEXTO];

const SOMENTE_LEITURA = 'Regras do dicionário não são editáveis. Crie uma regra sua para ter prioridade sobre elas.';

const TEXTOS = Object.freeze({
  TITULO: 'Regras',
  SUBTITULO:
    'É assim que os lançamentos ganham categoria sozinhos. A ordem importa: vale a primeira regra que bater, e as suas vêm antes do dicionário.',
  NOVA: 'Nova regra',
  QUANDO: 'Quando a descrição',
  TEXTO: 'o texto',
  VIRA: 'vira',
  SALVAR: 'Salvar e aplicar',
  SUBIR: 'Subir',
  DESCER: 'Descer',
  REMOVER: 'Remover',
  SEM_REGRAS: 'Você ainda não criou nenhuma regra. Categorize um lançamento na planilha e o sistema oferece criar a primeira.',
  NUNCA_BATEU: 'Nunca encontrou nenhum lançamento.',
  LANCAMENTOS: 'lanç.',
  REGRAS_NA_ABA: 'regras nesta aba'
});

export function telaRegras(estado) {
  const acertos = contarAcertos(estado.regras, estado.lancamentos);
  const daAba = estado.regras.filter((regra) => regra.origem === estado.abaRegras);

  return criarElemento('div', { class: 'tela grade-regras' }, [
    criarElemento('div', { class: 'coluna' }, [
      criarElemento('div', { class: 'titulo-tela' }, [
        criarElemento('h1', { texto: TEXTOS.TITULO }),
        criarElemento('p', { class: 'titulo-tela__texto', texto: TEXTOS.SUBTITULO })
      ]),
      barraDeAbas(estado),
      lista(fatiar(daAba, estado.paginas[CONTEXTO], TAMANHO_DA_PAGINA), acertos),
      navegacaoDePaginas({
        contexto: CONTEXTO,
        pagina: estado.paginas[CONTEXTO],
        quantidade: daAba.length,
        tamanho: TAMANHO_DA_PAGINA,
        rotuloDoTotal: `${daAba.length} ${TEXTOS.REGRAS_NA_ABA}`
      })
    ]),
    painelNovaRegra(estado)
  ]);
}

function barraDeAbas(estado) {
  const abas = Object.values(ABAS_REGRAS).map((aba) =>
    criarElemento(
      'button',
      {
        class: 'aba',
        type: 'button',
        role: 'tab',
        'aria-selected': String(estado.abaRegras === aba),
        onClick: () => despachar(ACOES.DEFINIR_ABA_REGRAS, aba)
      },
      [
        criarElemento('span', { texto: ROTULOS_ABA_REGRAS[aba] }),
        criarElemento('span', {
          class: 'aba__contador aba__contador--neutro',
          texto: String(estado.regras.filter((regra) => regra.origem === aba).length)
        })
      ]
    )
  );

  return criarElemento('div', { class: 'abas', role: 'tablist', 'aria-label': 'Tipo de regra' }, abas);
}

function lista(regras, acertos) {
  if (regras.length === 0) {
    return criarElemento('p', { class: 'fraco', texto: TEXTOS.SEM_REGRAS });
  }

  return criarElemento(
    'div',
    { class: 'regras' },
    regras.map((regra, posicao) => linha(regra, posicao, acertos.get(regra.id) ?? 0))
  );
}

function linha(regra, posicao, acertos) {
  const estadoRegra = validar(regra);
  const editavel = regra.origem === ORIGENS_REGRA.USUARIO;

  return criarElemento('div', { class: 'regra' }, [
    criarElemento('span', { class: 'regra__ordem mono', texto: String(posicao + 1) }),
    criarElemento('span', { class: 'regra__condicao' }, [
      criarElemento('span', { class: 'regra__operador', texto: `${ROTULOS_OPERADOR[regra.operador]} ` }),
      criarElemento('span', { class: 'mono', texto: regra.termo }),
      aviso(estadoRegra, acertos)
    ]),
    criarElemento('span', {}, [
      criarElemento('span', { texto: regra.categoria }),
      regra.tags.length > 0 ? criarElemento('span', { class: 'fraco', texto: ` · ${regra.tags.join(', ')}` }) : null
    ]),
    criarElemento('span', { class: 'regra__acertos' }, [
      criarElemento('span', { class: 'mono', texto: estadoRegra.valida ? String(acertos) : '—' }),
      criarElemento('span', { class: 'fraco', texto: ` ${TEXTOS.LANCAMENTOS}` })
    ]),
    editavel ? acoes(regra) : criarElemento('span', { class: 'fraco', title: SOMENTE_LEITURA })
  ]);
}

function aviso(estadoRegra, acertos) {
  if (!estadoRegra.valida) {
    return criarElemento('small', { class: 'regra__erro', texto: estadoRegra.motivo });
  }
  if (acertos === 0) {
    return criarElemento('small', { class: 'fraco', texto: TEXTOS.NUNCA_BATEU });
  }
  return null;
}

function acoes(regra) {
  return criarElemento('span', { class: 'regra__acoes' }, [
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.SUBIR,
      'aria-label': `${TEXTOS.SUBIR}: ${regra.termo}`,
      onClick: () => despachar(ACOES.MOVER_REGRA, { id: regra.id, direcao: -1 })
    }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.DESCER,
      'aria-label': `${TEXTOS.DESCER}: ${regra.termo}`,
      onClick: () => despachar(ACOES.MOVER_REGRA, { id: regra.id, direcao: 1 })
    }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.REMOVER,
      'aria-label': `${TEXTOS.REMOVER}: ${regra.termo}`,
      onClick: () => despachar(ACOES.REMOVER_REGRA, regra.id)
    })
  ]);
}

function painelNovaRegra(estado) {
  const impacto = criarElemento('p', { class: 'faixa-destaque' });

  const operador = criarElemento(
    'select',
    { class: 'campo__entrada', id: 'operador', onChange: () => atualizar() },
    Object.values(OPERADORES_REGRA).map((valor) =>
      criarElemento('option', { value: valor, texto: ROTULOS_OPERADOR[valor] })
    )
  );

  const termo = criarElemento('input', {
    class: 'campo__entrada mono',
    id: 'termo',
    type: 'text',
    onInput: () => atualizar()
  });

  const categoria = criarElemento(
    'select',
    { class: 'campo__entrada', id: 'categoria', onChange: () => atualizar() },
    estado.categorias
      .filter((nome) => nome !== CATEGORIA_SEM_CLASSIFICACAO)
      .map((nome) => criarElemento('option', { value: nome, texto: nome }))
  );

  function montar() {
    return criarRegra({
      operador: operador.value,
      termo: termo.value,
      categoria: categoria.value
    });
  }

  function atualizar() {
    const regra = montar();
    const estadoRegra = validar(regra);

    if (!estadoRegra.valida) {
      impacto.textContent = estadoRegra.motivo;
      return;
    }

    const atingidos = alcance(regra, estado.lancamentos);
    impacto.textContent = `Vai categorizar ${atingidos.total} lançamentos. ${atingidos.manuais} deles você editou à mão e continuam como estão.`;
  }

  const salvar = criarElemento('button', {
    class: 'botao botao--principal',
    type: 'button',
    texto: TEXTOS.SALVAR,
    onClick: () => {
      const regra = montar();
      if (!validar(regra).valida) {
        return;
      }
      despachar(ACOES.CRIAR_REGRA, {
        operador: regra.operador,
        termo: regra.termo,
        categoria: regra.categoria
      });
    }
  });

  atualizar();

  return criarElemento('section', { class: 'painel-regra', 'aria-label': TEXTOS.NOVA }, [
    criarElemento('h2', { texto: TEXTOS.NOVA }),
    campo(TEXTOS.QUANDO, 'operador', operador),
    campo(TEXTOS.TEXTO, 'termo', termo),
    campo(TEXTOS.VIRA, 'categoria', categoria),
    impacto,
    salvar
  ]);
}

function campo(rotulo, destino, controle) {
  return criarElemento('div', { class: 'campo' }, [
    criarElemento('label', { class: 'campo__rotulo', for: destino, texto: rotulo }),
    controle
  ]);
}
