import { ABAS_PLANILHA, ACOES, TELAS } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { aplicar } from '../nucleo/filtrar.js';
import {
  metricas,
  mesesDisponiveis,
  porCategoria,
  porComerciante,
  porMes
} from '../nucleo/agregar.js';
import { criarElemento, estadoVazio } from './componentes.js';
import { anelCategorias, barrasMensais } from './graficos.js';
import { formatarMesCurto, formatarMesLongo, formatarMoeda, formatarPercentual } from './formato.js';
import { navegacaoDeMes } from './filtros.js';

const TOTAL_DE_SERIES = 8;
const PERCENTUAL_CHEIO = 100;
const CATEGORIAS_VISIVEIS = 4;
const COMERCIANTES_VISIVEIS = 3;
const TEXTO_VAZIO = '';

const TEXTOS = Object.freeze({
  VAZIO_TITULO: 'Nada para mostrar ainda',
  VAZIO_TEXTO: 'Importe um extrato e o painel aparece com seus gastos do mês.',
  VAZIO_ACAO: 'Ir para importação',
  SALDO_POSITIVO: 'Você fechou no azul em',
  SALDO_NEGATIVO: 'Você fechou no vermelho em',
  ENTROU: 'Entrou',
  SAIU: 'Saiu',
  GASTOU: 'Você gastou em',
  TICKET: 'Ticket médio',
  CATEGORIAS: 'Categorias',
  VER_TODAS: 'Ver todas',
  EVOLUCAO: 'Últimos meses',
  ONDE: 'Onde mais gastou',
  REVISAR: 'Revisar',
  OUTRAS: 'Outras categorias',
  SEM_GASTO: 'Nenhum gasto neste mês',
  VER_QUAIS: 'Ver quais'
});

export function telaPainel(estado) {
  if (estado.lancamentos.length === 0) {
    return vazio();
  }

  const meses = mesesDisponiveis(estado.lancamentos, estado.competencia);
  const visiveis = aplicar(estado.lancamentos, estado.filtros, estado.competencia);
  const resumo = metricas(visiveis);
  const categorias = porCategoria(visiveis);

  return criarElemento('div', { class: 'tela' }, [
    navegacaoDeMes(estado, meses),
    criarElemento('section', { class: 'painel-topo' }, [
      destaque(estado, resumo),
      criarElemento('div', { class: 'anel' }, [
        anelCategorias(categorias),
        criarElemento('div', { class: 'anel__centro' }, centroDoAnel(categorias))
      ])
    ]),
    criarElemento('section', { class: 'painel-baixo' }, [
      blocoCategorias(categorias),
      criarElemento('div', { class: 'coluna' }, [
        blocoEvolucao(estado),
        blocoComerciantes(porComerciante(visiveis, COMERCIANTES_VISIVEIS))
      ])
    ]),
    rodape(resumo)
  ]);
}

function vazio() {
  const tela = estadoVazio({ titulo: TEXTOS.VAZIO_TITULO, texto: TEXTOS.VAZIO_TEXTO });
  tela.append(
    criarElemento('button', {
      class: 'botao botao--principal',
      type: 'button',
      texto: TEXTOS.VAZIO_ACAO,
      onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.IMPORTAR)
    })
  );
  return tela;
}

function destaque(estado, resumo) {
  const periodo = estado.filtros.mes ? formatarMesLongo(estado.filtros.mes).toLowerCase() : 'todo o período';

  const sobrou = resumo.saldo >= 0;

  return criarElemento('div', { class: 'destaque' }, [
    criarElemento('span', {
      class: 'fraco',
      texto: `${sobrou ? TEXTOS.SALDO_POSITIVO : TEXTOS.SALDO_NEGATIVO} ${periodo}`
    }),
    criarElemento('span', {
      class: sobrou ? 'destaque__valor display destaque__valor--entrada' : 'destaque__valor display',
      texto: formatarMoeda(resumo.saldo)
    }),
    criarElemento('div', { class: 'destaque__secundarios' }, [
      metrica(TEXTOS.ENTROU, formatarMoeda(resumo.entradas), true),
      metrica(TEXTOS.SAIU, formatarMoeda(-resumo.gasto)),
      metrica(TEXTOS.TICKET, formatarMoeda(-resumo.ticketMedio))
    ]),
    resumo.semCategoria > 0 ? avisoSemCategoria(resumo) : null
  ]);
}

function metrica(rotulo, valor, positivo = false) {
  return criarElemento('div', { class: 'metrica' }, [
    criarElemento('span', { class: 'fraco', texto: rotulo }),
    criarElemento('span', {
      class: positivo ? 'metrica__valor mono metrica__valor--entrada' : 'metrica__valor mono',
      texto: valor
    })
  ]);
}

function avisoSemCategoria(resumo) {
  return criarElemento(
    'button',
    {
      class: 'faixa-destaque faixa-destaque--acao',
      type: 'button',
      onClick: () => {
        despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.SEM_CATEGORIA);
        despachar(ACOES.TROCAR_TELA, TELAS.PLANILHA);
      }
    },
    [
      criarElemento('span', { class: 'ponto' }),
      criarElemento('span', {
        texto: `${resumo.semCategoria} lançamentos sem categoria`
      }),
      criarElemento('span', {
        class: 'fraco',
        texto: `· ${formatarPercentual(resumo.participacaoSemCategoria)} do total ainda é estimativa`
      }),
      criarElemento('span', { class: 'faixa-destaque__acao', texto: TEXTOS.REVISAR })
    ]
  );
}

function centroDoAnel(categorias) {
  if (categorias.length === 0) {
    return [criarElemento('span', { class: 'fraco', texto: TEXTOS.SEM_GASTO })];
  }

  const maior = categorias[0];
  return [
    criarElemento('span', { class: 'anel__percentual display', texto: formatarPercentual(maior.participacao) }),
    criarElemento('span', { class: 'fraco', texto: `foi ${maior.categoria.toLowerCase()}` })
  ];
}

function blocoCategorias(categorias) {
  const visiveis = categorias.slice(0, CATEGORIAS_VISIVEIS);
  const restantes = categorias.slice(CATEGORIAS_VISIVEIS);

  const linhas = visiveis.map((fatia, indice) => linhaCategoria(fatia, categorias[0].total, indice));

  if (restantes.length > 0) {
    const total = restantes.reduce((soma, fatia) => soma + fatia.total, 0);
    const participacao = restantes.reduce((soma, fatia) => soma + fatia.participacao, 0);
    linhas.push(
      linhaCategoria(
        { categoria: `${TEXTOS.OUTRAS} (${restantes.length})`, total, participacao },
        categorias[0].total,
        CATEGORIAS_VISIVEIS
      )
    );
  }

  return criarElemento('div', { class: 'bloco' }, [
    criarElemento('div', { class: 'bloco__cabecalho' }, [
      criarElemento('h2', { texto: TEXTOS.CATEGORIAS }),
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.VER_TODAS,
        onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.PLANILHA)
      })
    ]),
    ...linhas
  ]);
}

function linhaCategoria(fatia, maior, indice) {
  const preenchimento = criarElemento('span', { class: 'barra__preenchimento' });
  preenchimento.style.width = `${maior === 0 ? 0 : Math.round((fatia.total / maior) * PERCENTUAL_CHEIO)}%`;
  preenchimento.style.background = `var(--serie-${Math.min(indice + 1, TOTAL_DE_SERIES)})`;

  return criarElemento('div', { class: 'categoria' }, [
    criarElemento('span', { class: 'categoria__nome', texto: fatia.categoria }),
    criarElemento('span', { class: 'categoria__valor mono', texto: formatarMoeda(-fatia.total) }),
    criarElemento('span', { class: 'categoria__parte mono fraco', texto: formatarPercentual(fatia.participacao) }),
    criarElemento('span', { class: 'barra' }, [preenchimento])
  ]);
}

function blocoEvolucao(estado) {
  const todos = aplicar(estado.lancamentos, { ...estado.filtros, mes: TEXTO_VAZIO }, estado.competencia);
  const meses = porMes(todos, estado.competencia);

  return criarElemento('div', { class: 'bloco' }, [
    criarElemento('h2', { texto: TEXTOS.EVOLUCAO }),
    criarElemento('div', { class: 'barras' }, barrasMensais(meses, estado.filtros.mes)),
    criarElemento(
      'div',
      { class: 'barras__rotulos fraco' },
      meses.map((item) =>
        criarElemento('span', {
          class: item.mes === estado.filtros.mes ? 'barras__rotulo barras__rotulo--ativo' : 'barras__rotulo',
          texto: formatarMesCurto(item.mes)
        })
      )
    )
  ]);
}

function blocoComerciantes(comerciantes) {
  if (comerciantes.length === 0) {
    return criarElemento('div');
  }

  return criarElemento('div', { class: 'bloco' }, [
    criarElemento('h2', { texto: TEXTOS.ONDE }),
    ...comerciantes.map((item) =>
      criarElemento('div', { class: 'comerciante' }, [
        criarElemento('span', { texto: item.comerciante }),
        criarElemento('span', { class: 'mono', texto: formatarMoeda(-item.total) })
      ])
    )
  ]);
}

function rodape(resumo) {
  if (resumo.foraDoTotal === 0) {
    return criarElemento('div');
  }

  return criarElemento('p', { class: 'fraco painel-rodape' }, [
    criarElemento('span', {
      texto: `${formatarMoeda(resumo.valorForaDoTotal)} em faturas, transferências e aplicações não entraram na conta. `
    }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.VER_QUAIS,
      onClick: () => {
        despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.FORA_DO_TOTAL);
        despachar(ACOES.TROCAR_TELA, TELAS.PLANILHA);
      }
    })
  ]);
}
