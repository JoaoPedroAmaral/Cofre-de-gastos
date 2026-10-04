import {
  ABAS_PLANILHA,
  ACOES,
  CATEGORIA_SEM_CLASSIFICACAO,
  OPERADORES_REGRA,
  COLUNAS_PLANILHA,
  ROTULOS_ABA,
  ROTULOS_METODO,
  TELAS,
  TIPOS_COLUNA
} from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { ROTULOS_NAO_GASTO } from '../nucleo/naoGasto.js';
import { criarRegra, alcance } from '../nucleo/regras.js';
import { criarElemento, estadoVazio } from './componentes.js';
import { filtrosDaPlanilha, navegacaoDeMes } from './filtros.js';
import { aplicar } from '../nucleo/filtrar.js';
import { mesesDisponiveis } from '../nucleo/agregar.js';
import { formatarData, formatarMoeda } from './formato.js';

const TEXTO_VAZIO = '';
const INDICADORES = Object.freeze({ ASCENDENTE: '▲', DESCENDENTE: '▼' });
const SEPARADOR_DETALHE = ' · ';
const COLUNA_DE_SELECAO = 1;
const COLUNAS_DA_TABELA = COLUNAS_PLANILHA.length + COLUNA_DE_SELECAO;

const TEXTOS = Object.freeze({
  TITULO: 'Planilha',
  VAZIO_TITULO: 'Nenhum lançamento importado',
  VAZIO_TEXTO: 'Importe um extrato para ver a planilha de gastos.',
  VAZIO_ACAO: 'Ir para importação',
  SEM_RESULTADO: 'Nada nesta aba',
  SEM_RESULTADO_TEXTO: 'Troque de aba para ver os outros lançamentos.',
  CATEGORIZAR: 'Categorizar',
  INCLUIR: 'Incluir no total',
  FORA: 'Fora do total',
  SELECIONADOS: 'selecionados',
  EM_LOTE: 'Categorizar como',
  LIMPAR: 'Limpar seleção',
  AGORA_NAO: 'Agora não',
  CRIAR_REGRA: 'Criar regra',
  EDITADO: 'editado'
});

export function telaPlanilha(estado) {
  if (estado.lancamentos.length === 0) {
    return vazioInicial();
  }

  const noPeriodo = aplicar(estado.lancamentos, estado.filtros, estado.competencia);
  const visiveis = ordenar(filtrarPorAba(noPeriodo, estado.aba), estado.ordenacao);

  return criarElemento('div', { class: 'tela' }, [
    navegacaoDeMes(estado, mesesDisponiveis(estado.lancamentos, estado.competencia)),
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TEXTOS.TITULO }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: resumo(noPeriodo) })
    ]),
    barraDeAbas(estado, noPeriodo),
    visiveis.length === 0
      ? estadoVazio({ titulo: TEXTOS.SEM_RESULTADO, texto: TEXTOS.SEM_RESULTADO_TEXTO })
      : tabela(visiveis, estado),
    estado.selecao.length === 0 ? criarElemento('div') : barraDeSelecao(estado)
  ]);
}

function vazioInicial() {
  const vazio = estadoVazio({ titulo: TEXTOS.VAZIO_TITULO, texto: TEXTOS.VAZIO_TEXTO });
  vazio.append(
    criarElemento('button', {
      class: 'botao botao--principal',
      type: 'button',
      texto: TEXTOS.VAZIO_ACAO,
      onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.IMPORTAR)
    })
  );
  return vazio;
}

function resumo(lancamentos) {
  const bancos = new Set(lancamentos.map((lancamento) => lancamento.banco));
  const plural = bancos.size === 1 ? 'banco' : 'bancos';
  return `${lancamentos.length} lançamentos de ${bancos.size} ${plural}. O que ainda não tem categoria fica sempre em cima.`;
}

function barraDeAbas(estado, noPeriodo) {
  const abas = Object.values(ABAS_PLANILHA).map((aba) => {
    const quantidade = filtrarPorAba(noPeriodo, aba).length;
    const destaque = aba === ABAS_PLANILHA.SEM_CATEGORIA && quantidade > 0;

    return criarElemento(
      'button',
      {
        class: 'aba',
        type: 'button',
        role: 'tab',
        'aria-selected': String(estado.aba === aba),
        onClick: () => despachar(ACOES.DEFINIR_ABA, aba)
      },
      [
        criarElemento('span', { texto: ROTULOS_ABA[aba] }),
        criarElemento('span', {
          class: destaque ? 'aba__contador' : 'aba__contador aba__contador--neutro',
          texto: String(quantidade)
        })
      ]
    );
  });

  return criarElemento('div', { class: 'barra-ferramentas' }, [
    criarElemento('div', { class: 'abas', role: 'tablist', 'aria-label': 'Mostrar' }, abas),
    filtrosDaPlanilha(estado)
  ]);
}

function filtrarPorAba(lancamentos, aba) {
  if (aba === ABAS_PLANILHA.SEM_CATEGORIA) {
    return lancamentos.filter(
      (lancamento) => lancamento.naoGasto === false && lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO
    );
  }
  if (aba === ABAS_PLANILHA.FORA_DO_TOTAL) {
    return lancamentos.filter((lancamento) => lancamento.naoGasto !== false);
  }
  return lancamentos;
}

function tabela(lancamentos, estado) {
  const corpo = criarElemento('tbody', {});

  lancamentos.forEach((lancamento) => {
    corpo.append(linha(lancamento, estado));
    if (estado.sugestao && estado.sugestao.id === lancamento.id) {
      corpo.append(linhaSugestao(estado));
    }
  });

  return criarElemento('table', { class: 'tabela' }, [cabecalho(estado.ordenacao), corpo]);
}

function cabecalho(ordenacao) {
  return criarElemento('thead', {}, [
    criarElemento('tr', {}, [
      criarElemento('th', { class: 'tabela__selecao' }),
      ...COLUNAS_PLANILHA.map((coluna) =>
        criarElemento('th', { class: classeDaColuna(coluna) }, [
          criarElemento(
            'button',
            {
              class: 'tabela__ordenar',
              type: 'button',
              onClick: () => despachar(ACOES.DEFINIR_ORDENACAO, coluna.campo)
            },
            [
              criarElemento('span', { texto: coluna.rotulo }),
              criarElemento('span', { class: 'tabela__indicador', texto: indicador(coluna.campo, ordenacao) })
            ]
          )
        ])
      )
    ])
  ]);
}

function classeDaColuna(coluna) {
  return coluna.tipo === TIPOS_COLUNA.MOEDA ? 'tabela__coluna-valor' : TEXTO_VAZIO;
}

function linha(lancamento, estado) {
  const fora = lancamento.naoGasto !== false;
  const selecionado = estado.selecao.includes(lancamento.id);

  const marcador = criarElemento('input', {
    type: 'checkbox',
    'aria-label': `Selecionar ${lancamento.descricaoOriginal}`,
    onChange: () => despachar(ACOES.ALTERNAR_SELECAO, lancamento.id)
  });
  marcador.checked = selecionado;

  return criarElemento('tr', { class: classeLinha(fora, selecionado) }, [
    criarElemento('td', { class: 'tabela__selecao' }, [marcador]),
    criarElemento('td', { class: 'tabela__data', texto: formatarData(lancamento.data) }),
    criarElemento('td', {}, [
      criarElemento('div', { class: 'lancamento' }, [
        criarElemento('span', { texto: lancamento.descricaoOriginal }),
        criarElemento('small', { class: 'lancamento__detalhe', texto: detalhe(lancamento) })
      ])
    ]),
    criarElemento('td', {}, [celulaCategoria(lancamento, estado, fora)]),
    criarElemento('td', {
      class: classeValor(lancamento),
      texto: formatarMoeda(lancamento.valor)
    })
  ]);
}

function classeLinha(fora, selecionado) {
  const classes = [];
  if (fora) {
    classes.push('linha--fora');
  }
  if (selecionado) {
    classes.push('linha--selecionada');
  }
  return classes.join(' ');
}

function celulaCategoria(lancamento, estado, fora) {
  if (fora) {
    return criarElemento('div', { class: 'lancamento' }, [
      criarElemento('span', {
        class: 'etiqueta etiqueta--fora',
        texto: `${TEXTOS.FORA} · ${ROTULOS_NAO_GASTO[lancamento.naoGasto] || lancamento.naoGasto}`
      }),
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.INCLUIR,
        onClick: () => despachar(ACOES.ALTERNAR_NAO_GASTO, lancamento.id)
      })
    ]);
  }

  return criarElemento('div', { class: 'celula-categoria' }, [
    seletorCategoria(lancamento, estado),
    ...lancamento.tags.map((tag) => criarElemento('span', { class: 'tag', texto: tag })),
    lancamento.revisadoManual ? criarElemento('span', { class: 'tag', texto: TEXTOS.EDITADO }) : null
  ]);
}

function seletorCategoria(lancamento, estado) {
  const semCategoria = lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO;

  const seletor = criarElemento(
    'select',
    {
      class: semCategoria ? 'etiqueta etiqueta--vazia' : 'etiqueta',
      'aria-label': `Categoria de ${lancamento.descricaoOriginal}`,
      onChange: (evento) => despachar(ACOES.DEFINIR_CATEGORIA, { ids: [lancamento.id], categoria: evento.target.value })
    },
    estado.categorias.map((categoria) =>
      criarElemento('option', {
        value: categoria,
        texto: categoria === CATEGORIA_SEM_CLASSIFICACAO ? TEXTOS.CATEGORIZAR : categoria
      })
    )
  );

  seletor.value = lancamento.categoria;
  return seletor;
}

function linhaSugestao(estado) {
  const { sugestao } = estado;
  const regra = criarRegra({
    operador: OPERADORES_REGRA.CONTEM,
    termo: sugestao.chave,
    categoria: sugestao.categoria
  });
  const atingidos = alcance(regra, estado.lancamentos);

  return criarElemento('tr', { class: 'linha--sugestao' }, [
    criarElemento('td', { colspan: String(COLUNAS_DA_TABELA) }, [
      criarElemento('div', { class: 'sugestao' }, [
        criarElemento('span', { class: 'sugestao__texto' }, [
          criarElemento('span', { texto: 'Usar ' }),
          criarElemento('b', { texto: sugestao.categoria }),
          criarElemento('span', { texto: ' sempre que aparecer ' }),
          criarElemento('span', { class: 'mono', texto: sugestao.chave }),
          criarElemento('span', { texto: '? ' }),
          criarElemento('span', {
            class: 'fraco',
            texto: `Vale para ${atingidos.total} lançamentos e para as próximas importações.`
          })
        ]),
        criarElemento('button', {
          class: 'botao botao--discreto',
          type: 'button',
          texto: TEXTOS.AGORA_NAO,
          onClick: () => despachar(ACOES.DESCARTAR_SUGESTAO)
        }),
        criarElemento('button', {
          class: 'botao botao--principal',
          type: 'button',
          texto: TEXTOS.CRIAR_REGRA,
          onClick: () =>
            despachar(ACOES.CRIAR_REGRA, {
              operador: regra.operador,
              termo: regra.termo,
              categoria: regra.categoria,
              tags: regra.tags
            })
        })
      ])
    ])
  ]);
}

function barraDeSelecao(estado) {
  const seletor = criarElemento(
    'select',
    {
      class: 'campo__entrada',
      'aria-label': TEXTOS.EM_LOTE,
      onChange: (evento) => {
        despachar(ACOES.DEFINIR_CATEGORIA, { ids: estado.selecao, categoria: evento.target.value });
        despachar(ACOES.LIMPAR_SELECAO);
      }
    },
    [
      criarElemento('option', { value: TEXTO_VAZIO, texto: TEXTOS.EM_LOTE }),
      ...estado.categorias
        .filter((categoria) => categoria !== CATEGORIA_SEM_CLASSIFICACAO)
        .map((categoria) => criarElemento('option', { value: categoria, texto: categoria }))
    ]
  );

  return criarElemento('div', { class: 'barra-selecao', role: 'status' }, [
    criarElemento('span', { texto: `${estado.selecao.length} ${TEXTOS.SELECIONADOS}` }),
    seletor,
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.LIMPAR,
      onClick: () => despachar(ACOES.LIMPAR_SELECAO)
    })
  ]);
}

function detalhe(lancamento) {
  const partes = [lancamento.comerciante, lancamento.banco, ROTULOS_METODO[lancamento.metodo]];

  if (lancamento.parcela) {
    partes.push(`parcela ${lancamento.parcela.atual} de ${lancamento.parcela.total}`);
  }

  return partes.filter(Boolean).join(SEPARADOR_DETALHE);
}

function classeValor(lancamento) {
  return lancamento.valor > 0 ? 'tabela__valor tabela__valor--entrada' : 'tabela__valor';
}

function indicador(campo, ordenacao) {
  if (ordenacao.campo !== campo) {
    return TEXTO_VAZIO;
  }
  return ordenacao.ascendente ? INDICADORES.ASCENDENTE : INDICADORES.DESCENDENTE;
}

function ordenar(lancamentos, ordenacao) {
  const direcao = ordenacao.ascendente ? 1 : -1;

  return [...lancamentos].sort((a, b) => {
    const prioridade = prioridadeDe(a) - prioridadeDe(b);
    if (prioridade !== 0) {
      return prioridade;
    }

    const valorA = a[ordenacao.campo];
    const valorB = b[ordenacao.campo];

    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return (valorA - valorB) * direcao;
    }
    return String(valorA).localeCompare(String(valorB)) * direcao;
  });
}

function prioridadeDe(lancamento) {
  if (lancamento.naoGasto === false && lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO) {
    return 0;
  }
  return 1;
}
