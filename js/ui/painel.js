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
import { animarAte } from './contador.js';
import { formatarMesLongo, formatarMoeda, formatarPercentual } from './formato.js';
import { navegacaoDeMes } from './filtros.js';

const TOTAL_DE_SERIES = 8;
const PERCENTUAL_CHEIO = 100;
const CATEGORIAS_VISIVEIS = 4;
const COMERCIANTES_VISIVEIS = 3;
const VARIAVEL_DE_MESES = '--meses';
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
  VER_QUAIS: 'Ver quais',
  VER_LANCAMENTOS: 'Ver na planilha os lançamentos de'
});

const COM_ANIMACAO = true;
const SEM_ANIMACAO = false;

export function telaPainel(estado) {
  return montarPainel(estado, COM_ANIMACAO);
}

export function atualizarPainel(raiz, estado) {
  raiz.replaceWith(montarPainel(estado, SEM_ANIMACAO));
}

function montarPainel(estado, comAnimacao) {
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
      destaque(estado, resumo, comAnimacao),
      criarElemento('div', { class: 'anel' }, [
        anelCategorias(categorias),
        criarElemento('div', { class: 'anel__centro' }, centroDoAnel(categorias))
      ])
    ]),
    criarElemento('section', { class: 'painel-baixo' }, [
      blocoCategorias(categorias, estado),
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

function destaque(estado, resumo, comAnimacao) {
  const periodo = estado.filtros.mes ? formatarMesLongo(estado.filtros.mes).toLowerCase() : 'todo o período';

  const sobrou = resumo.saldo >= 0;

  return criarElemento('div', { class: 'destaque' }, [
    criarElemento('span', {
      class: 'fraco',
      texto: `${sobrou ? TEXTOS.SALDO_POSITIVO : TEXTOS.SALDO_NEGATIVO} ${periodo}`
    }),
    valorPrincipal(resumo.saldo, sobrou, comAnimacao),
    criarElemento('div', { class: 'destaque__secundarios' }, [
      metrica(TEXTOS.ENTROU, formatarMoeda(resumo.entradas), true),
      metrica(TEXTOS.SAIU, formatarMoeda(-resumo.gasto)),
      metrica(TEXTOS.TICKET, formatarMoeda(-resumo.ticketMedio))
    ]),
    resumo.semCategoria > 0 ? avisoSemCategoria(resumo) : null
  ]);
}

function valorPrincipal(saldo, sobrou, comAnimacao) {
  const elemento = criarElemento('span', {
    class: sobrou ? 'destaque__valor display destaque__valor--entrada' : 'destaque__valor display',
    texto: formatarMoeda(saldo)
  });

  if (comAnimacao) {
    animarAte(elemento, saldo, formatarMoeda);
  }

  return elemento;
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
      onClick: () => despachar(ACOES.IR_PARA_PLANILHA, { aba: ABAS_PLANILHA.SEM_CATEGORIA })
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

function blocoCategorias(categorias, estado) {
  const visiveis = categorias.slice(0, CATEGORIAS_VISIVEIS);
  const restantes = categorias.slice(CATEGORIAS_VISIVEIS);

  const linhas = visiveis.map((fatia, indice) =>
    linhaCategoria(fatia, categorias[0].total, indice, estado)
  );

  if (restantes.length > 0) {
    const total = restantes.reduce((soma, fatia) => soma + fatia.total, 0);
    const participacao = restantes.reduce((soma, fatia) => soma + fatia.participacao, 0);
    linhas.push(
      linhaDeOutras(
        { categoria: `${TEXTOS.OUTRAS} (${restantes.length})`, total, participacao },
        categorias[0].total
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
        onClick: () => despachar(ACOES.IR_PARA_PLANILHA, { filtros: { categoria: TEXTO_VAZIO } })
      })
    ]),
    ...linhas
  ]);
}

function linhaCategoria(fatia, maior, indice, estado) {
  const filtrada = estado.filtros.categoria === fatia.categoria;

  return criarElemento(
    'button',
    {
      class: 'categoria',
      type: 'button',
      'aria-pressed': String(filtrada),
      title: `${TEXTOS.VER_LANCAMENTOS} ${fatia.categoria}`,
      onClick: () => despachar(ACOES.IR_PARA_PLANILHA, { filtros: { categoria: fatia.categoria } })
    },
    conteudoDaCategoria(fatia, maior, indice)
  );
}

function conteudoDaCategoria(fatia, maior, indice) {
  const preenchimento = criarElemento('span', { class: 'barra__preenchimento' });
  preenchimento.style.width = `${maior === 0 ? 0 : Math.round((fatia.total / maior) * PERCENTUAL_CHEIO)}%`;
  preenchimento.style.background = `var(--serie-${Math.min(indice + 1, TOTAL_DE_SERIES)})`;

  return [
    criarElemento('span', { class: 'categoria__nome', texto: fatia.categoria }),
    criarElemento('span', { class: 'categoria__valor mono', texto: formatarMoeda(-fatia.total) }),
    criarElemento('span', { class: 'categoria__parte mono fraco', texto: formatarPercentual(fatia.participacao) }),
    criarElemento('span', { class: 'barra' }, [preenchimento])
  ];
}

function linhaDeOutras(fatia, maior) {
  return criarElemento(
    'div',
    { class: 'categoria categoria--outras' },
    conteudoDaCategoria(fatia, maior, CATEGORIAS_VISIVEIS)
  );
}

function blocoEvolucao(estado) {
  const todos = aplicar(estado.lancamentos, { ...estado.filtros, mes: TEXTO_VAZIO }, estado.competencia);
  const meses = porMes(todos, estado.competencia);

  const grafico = criarElemento('div', { class: 'barras' }, barrasMensais(meses, estado.filtros.mes));
  grafico.style.setProperty(VARIAVEL_DE_MESES, String(meses.length));

  return criarElemento('div', { class: 'bloco' }, [
    criarElemento('h2', { texto: TEXTOS.EVOLUCAO }),
    grafico
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
        despachar(ACOES.IR_PARA_PLANILHA, { aba: ABAS_PLANILHA.FORA_DO_TOTAL });
      }
    })
  ]);
}
