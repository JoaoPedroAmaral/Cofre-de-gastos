import {
  ABAS_PLANILHA,
  ACOES,
  CATEGORIA_SEM_CLASSIFICACAO,
  COLUNAS_PLANILHA,
  CONTEXTOS_DE_PAGINA,
  PAPEIS_COLUNA_PLANILHA,
  ROTULOS_ABA,
  ROTULOS_METODO,
  TAMANHO_DE_PAGINA,
  TELAS
} from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { ehContaPropria, estaForaDoTotal, rotuloForaDoTotal } from '../nucleo/naoGasto.js';
import { criarElemento, estadoVazio } from './componentes.js';
import { pedirTexto } from './dialogos.js';
import { existe } from '../nucleo/catalogo.js';
import { ordenarLancamentos } from '../nucleo/ordenar.js';
import { acrescentarEmLote, celulaDeTags } from './tags.js';
import { faixaDeSugestao } from './sugestoes.js';
import { reconciliarLista } from './reconciliar.js';
import { navegacaoDePaginas } from './paginacao.js';
import { fatiar } from '../nucleo/paginar.js';
import { tagsDe } from '../nucleo/tags.js';
import { filtrosDaPlanilha, navegacaoDeMes } from './filtros.js';
import { aplicar } from '../nucleo/filtrar.js';
import { mesesDisponiveis } from '../nucleo/agregar.js';
import { formatarData, formatarMoeda } from './formato.js';

const TEXTO_VAZIO = '';
const INDICADORES = Object.freeze({ ASCENDENTE: '▲', DESCENDENTE: '▼' });
const SEPARADOR_DETALHE = ' · ';
const COLUNA_DE_SELECAO = 1;
const OPCAO_NOVA_CATEGORIA = 'nova-categoria';
const SEPARADOR_DE_ASSINATURA = '~';
const PREFIXO_DA_LINHA = 'l';
const PREFIXO_DA_SUGESTAO = 's';
const COLUNAS_DA_TABELA = COLUNAS_PLANILHA.length + COLUNA_DE_SELECAO;
const CONTEXTO = CONTEXTOS_DE_PAGINA.PLANILHA;
const TAMANHO_DA_PAGINA = TAMANHO_DE_PAGINA[CONTEXTO];

const TEXTOS = Object.freeze({
  TITULO: 'Planilha',
  VAZIO_TITULO: 'Nenhum lançamento importado',
  VAZIO_TEXTO: 'Importe um extrato para ver a planilha de gastos.',
  VAZIO_ACAO: 'Ir para importação',
  SEM_RESULTADO: 'Nada nesta aba',
  SEM_RESULTADO_TEXTO: 'Troque de aba para ver os outros lançamentos.',
  CATEGORIZAR: 'Categorizar',
  NOVA_CATEGORIA: 'Nova categoria…',
  NOVA_CATEGORIA_TITULO: 'Nova categoria',
  NOME_DA_CATEGORIA: 'Nome da categoria',
  CRIAR_CATEGORIA: 'Criar e aplicar',
  EXEMPLO_CATEGORIA: 'Pets',
  NOME_VAZIO: 'Escreva o nome da categoria.',
  NOME_REPETIDO: 'Já existe uma categoria com esse nome.',
  INCLUIR: 'Incluir no total',
  TIRAR: 'Tirar do total',
  AUTOMATICO: 'Voltar ao automático',
  FORA: 'Fora do total',
  SELECIONAR_TUDO: 'Selecionar todos os lançamentos do filtro, não só os desta página',
  NESTA_PAGINA: 'nesta página',
  UM_LANCAMENTO: '1 lançamento no filtro',
  VARIOS_LANCAMENTOS: 'lançamentos no filtro',
  LIMPAR_TUDO: 'Tirar a seleção de todos',
  SELECIONADO: 'selecionado',
  SELECIONADOS: 'selecionados',
  EM_LOTE: 'Categorizar como',
  LIMPAR: 'Limpar seleção',
  EDITADO: 'editado'
});

export function telaPlanilha(estado) {
  const raiz = criarElemento('div', { class: 'tela' }, [
    criarElemento('div', { class: 'planilha__topo' }),
    criarElemento('div', { class: 'planilha__lista' }),
    criarElemento('div', { class: 'planilha__paginacao' }),
    criarElemento('div', { class: 'planilha__selecao' })
  ]);

  atualizarPlanilha(raiz, estado);
  return raiz;
}

export function atualizarPlanilha(raiz, estado) {
  const topo = raiz.querySelector('.planilha__topo');
  const lista = raiz.querySelector('.planilha__lista');
  const paginacao = raiz.querySelector('.planilha__paginacao');
  const selecao = raiz.querySelector('.planilha__selecao');

  if (estado.lancamentos.length === 0) {
    topo.replaceChildren();
    lista.replaceChildren(vazioInicial());
    paginacao.replaceChildren();
    selecao.replaceChildren();
    return;
  }

  const noPeriodo = aplicar(estado.lancamentos, estado.filtros, estado.competencia);
  const visiveis = ordenarLancamentos(filtrarPorAba(noPeriodo, estado.aba), estado.ordenacao);

  topo.replaceChildren(
    navegacaoDeMes(estado, mesesDisponiveis(estado.lancamentos, estado.competencia)),
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TEXTOS.TITULO }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: resumo(noPeriodo) })
    ]),
    barraDeAbas(estado, noPeriodo)
  );

  const paginados = daPagina(visiveis, estado);

  if (visiveis.length === 0) {
    lista.replaceChildren(estadoVazio({ titulo: TEXTOS.SEM_RESULTADO, texto: TEXTOS.SEM_RESULTADO_TEXTO }));
  } else {
    atualizarTabela(lista, paginados, visiveis, estado);
  }

  paginacao.replaceChildren(
    navegacaoDePaginas({
      contexto: CONTEXTO,
      pagina: estado.paginas[CONTEXTO],
      quantidade: visiveis.length,
      tamanho: TAMANHO_DA_PAGINA,
      rotuloDoTotal: rotuloDoTotal(visiveis.length)
    })
  );

  selecao.replaceChildren(
    estado.selecao.length === 0 ? criarElemento('div') : barraDeSelecao(estado, paginados)
  );
}

function daPagina(visiveis, estado) {
  return fatiar(visiveis, estado.paginas[CONTEXTO], TAMANHO_DA_PAGINA);
}

function rotuloDaSelecao(estado, paginados) {
  const total = estado.selecao.length;
  const marcados = new Set(estado.selecao);
  const nestaPagina = paginados.filter((lancamento) => marcados.has(lancamento.id)).length;
  const contagem = `${total} ${total === 1 ? TEXTOS.SELECIONADO : TEXTOS.SELECIONADOS}`;

  if (nestaPagina === total) {
    return contagem;
  }
  return `${contagem}${SEPARADOR_DETALHE}${nestaPagina} ${TEXTOS.NESTA_PAGINA}`;
}

function rotuloDoTotal(quantidade) {
  return quantidade === 1 ? TEXTOS.UM_LANCAMENTO : `${quantidade} ${TEXTOS.VARIOS_LANCAMENTOS}`;
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
  return `${lancamentos.length} lançamentos de ${bancos.size} ${plural}. A aba "Sem categoria" reúne o que falta categorizar.`;
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
      (lancamento) => !estaForaDoTotal(lancamento) && lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO
    );
  }
  if (aba === ABAS_PLANILHA.FORA_DO_TOTAL) {
    return lancamentos.filter(estaForaDoTotal);
  }
  return lancamentos;
}

function atualizarTabela(lista, paginados, filtrados, estado) {
  const tabela = lista.querySelector('.tabela') ?? lista.appendChild(montarTabela());

  tabela.querySelector('thead').replaceWith(cabecalho(estado, filtrados));
  reconciliarLista(tabela.querySelector('tbody'), itensDaTabela(paginados, estado), {
    chaveDe: (item) => item.chave,
    assinaturaDe: (item) => item.assinatura,
    montar: (item) => item.montar()
  });
}

function montarTabela() {
  return criarElemento('table', { class: 'tabela' }, [
    criarElemento('thead'),
    criarElemento('tbody')
  ]);
}

function itensDaTabela(lancamentos, estado) {
  const catalogo = assinaturaDoCatalogo(estado);
  const selecionados = new Set(estado.selecao);

  return lancamentos.flatMap((lancamento) => {
    const linhaDoLancamento = {
      chave: `${PREFIXO_DA_LINHA}:${lancamento.id}`,
      assinatura: assinaturaDaLinha(lancamento, selecionados, catalogo),
      montar: () => linha(lancamento, estado)
    };

    if (!estado.sugestao || estado.sugestao.id !== lancamento.id) {
      return [linhaDoLancamento];
    }

    return [
      linhaDoLancamento,
      {
        chave: `${PREFIXO_DA_SUGESTAO}:${lancamento.id}`,
        assinatura: JSON.stringify(estado.sugestao),
        montar: () => faixaDeSugestao(estado, COLUNAS_DA_TABELA)
      }
    ];
  });
}

function assinaturaDoCatalogo(estado) {
  return [estado.categorias.join(), estado.tags.join()].join(SEPARADOR_DE_ASSINATURA);
}

function assinaturaDaLinha(lancamento, selecionados, catalogo) {
  return [
    lancamento.categoria,
    lancamento.revisadoManual,
    lancamento.naoGasto,
    lancamento.foraDoTotalManual,
    tagsDe(lancamento).join(),
    selecionados.has(lancamento.id),
    catalogo
  ].join(SEPARADOR_DE_ASSINATURA);
}

function cabecalho(estado, lancamentos) {
  const ordenacao = estado.ordenacao;

  return criarElemento('thead', {}, [
    criarElemento('tr', {}, [
      criarElemento('th', { class: PAPEIS_COLUNA_PLANILHA.SELECAO }, [
        marcadorDeTudo(estado, lancamentos)
      ]),
      ...COLUNAS_PLANILHA.map((coluna) =>
        criarElemento('th', { class: coluna.papel }, [
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

function rotuloDoMarcador(quantidade, todosMarcados) {
  const acao = todosMarcados ? TEXTOS.LIMPAR_TUDO : TEXTOS.SELECIONAR_TUDO;
  return `${acao} (${quantidade})`;
}

function marcadorDeTudo(estado, lancamentos) {
  const ids = lancamentos.map((lancamento) => lancamento.id);
  const selecionados = ids.filter((id) => estado.selecao.includes(id));
  const todos = ids.length > 0 && selecionados.length === ids.length;

  const marcador = criarElemento('input', {
    type: 'checkbox',
    'aria-label': rotuloDoMarcador(ids.length, todos),
    title: rotuloDoMarcador(ids.length, todos),
    disabled: ids.length === 0 ? 'disabled' : null,
    onChange: () => despachar(ACOES.DEFINIR_SELECAO, todos ? [] : ids)
  });

  marcador.checked = todos;
  marcador.indeterminate = selecionados.length > 0 && !todos;

  return marcador;
}

function linha(lancamento, estado) {
  const fora = estaForaDoTotal(lancamento);
  const selecionado = estado.selecao.includes(lancamento.id);

  const marcador = criarElemento('input', {
    type: 'checkbox',
    'aria-label': `Selecionar ${lancamento.descricaoOriginal}`,
    onChange: () => despachar(ACOES.ALTERNAR_SELECAO, lancamento.id)
  });
  marcador.checked = selecionado;

  return criarElemento('tr', { class: classeLinha(fora, selecionado) }, [
    criarElemento('td', { class: PAPEIS_COLUNA_PLANILHA.SELECAO }, [marcador]),
    criarElemento('td', { class: PAPEIS_COLUNA_PLANILHA.DATA, texto: formatarData(lancamento.data) }),
    criarElemento('td', { class: PAPEIS_COLUNA_PLANILHA.DESCRICAO }, [
      criarElemento('div', { class: 'lancamento' }, [
        criarElemento('span', { texto: lancamento.descricaoOriginal }),
        criarElemento('small', { class: 'lancamento__detalhe', texto: detalhe(lancamento) })
      ])
    ]),
    criarElemento('td', { class: PAPEIS_COLUNA_PLANILHA.CATEGORIA }, [
      celulaCategoria(lancamento, estado, fora)
    ]),
    criarElemento('td', { class: PAPEIS_COLUNA_PLANILHA.TAGS }, [celulaDeTags(lancamento, estado)]),
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
    return criarElemento('div', { class: 'celula-categoria' }, [
      criarElemento('span', {
        class: 'etiqueta etiqueta--fora',
        texto: `${TEXTOS.FORA} · ${rotuloForaDoTotal(lancamento)}`
      }),
      ehContaPropria(lancamento) ? null : botaoDeTotal(lancamento, TEXTOS.INCLUIR, false),
      ehContaPropria(lancamento) || lancamento.foraDoTotalManual === null
        ? null
        : botaoDeTotal(lancamento, TEXTOS.AUTOMATICO, null)
    ]);
  }

  return criarElemento('div', { class: 'celula-categoria' }, [
    seletorCategoria(lancamento, estado),
    lancamento.revisadoManual ? criarElemento('span', { class: 'tag', texto: TEXTOS.EDITADO }) : null,
    botaoDeTotal(lancamento, TEXTOS.TIRAR, true)
  ]);
}

function botaoDeTotal(lancamento, rotulo, fora) {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: rotulo,
    onClick: () => despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: [lancamento.id], fora })
  });
}

function seletorCategoria(lancamento, estado) {
  const semCategoria = lancamento.categoria === CATEGORIA_SEM_CLASSIFICACAO;

  const seletor = criarElemento(
    'select',
    {
      class: semCategoria ? 'etiqueta etiqueta--vazia seletor' : 'etiqueta seletor',
      'aria-label': `Categoria de ${lancamento.descricaoOriginal}`,
      onChange: (evento) => escolher(evento.target, lancamento, estado)
    },
    [
      ...estado.categorias.map((categoria) =>
        criarElemento('option', {
          value: categoria,
          texto: categoria === CATEGORIA_SEM_CLASSIFICACAO ? TEXTOS.CATEGORIZAR : categoria
        })
      ),
      criarElemento('option', { value: OPCAO_NOVA_CATEGORIA, texto: TEXTOS.NOVA_CATEGORIA })
    ]
  );

  seletor.value = lancamento.categoria;
  return seletor;
}

function escolher(seletor, lancamento, estado) {
  if (seletor.value !== OPCAO_NOVA_CATEGORIA) {
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: [lancamento.id], categoria: seletor.value });
    return;
  }

  seletor.value = lancamento.categoria;
  pedirTexto({
    titulo: TEXTOS.NOVA_CATEGORIA_TITULO,
    rotulo: TEXTOS.NOME_DA_CATEGORIA,
    exemplo: TEXTOS.EXEMPLO_CATEGORIA,
    acao: TEXTOS.CRIAR_CATEGORIA,
    aoConfirmar: (nome) => {
      const recusa = recusarNome(nome, estado);
      if (recusa) {
        return recusa;
      }
      despachar(ACOES.CRIAR_CATEGORIA, nome);
      despachar(ACOES.DEFINIR_CATEGORIA, { ids: [lancamento.id], categoria: nome.trim() });
      return TEXTO_VAZIO;
    }
  });
}

function recusarNome(nome, estado) {
  if (nome.trim() === TEXTO_VAZIO) {
    return TEXTOS.NOME_VAZIO;
  }
  if (existe(estado.categorias, nome)) {
    return TEXTOS.NOME_REPETIDO;
  }
  return TEXTO_VAZIO;
}

function barraDeSelecao(estado, paginados) {
  const seletor = criarElemento(
    'select',
    {
      class: 'campo__entrada seletor',
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
    criarElemento('span', { class: 'barra-selecao__contagem', texto: rotuloDaSelecao(estado, paginados) }),
    seletor,
    acrescentarEmLote(estado.selecao, estado),
    acaoEmLote(estado, TEXTOS.TIRAR, true),
    acaoEmLote(estado, TEXTOS.INCLUIR, false),
    acaoEmLote(estado, TEXTOS.AUTOMATICO, null),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.LIMPAR,
      onClick: () => despachar(ACOES.LIMPAR_SELECAO)
    })
  ]);
}

function acaoEmLote(estado, rotulo, fora) {
  return criarElemento('button', {
    class: 'botao',
    type: 'button',
    texto: rotulo,
    onClick: () => despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: estado.selecao, fora })
  });
}

function detalhe(lancamento) {
  const partes = [lancamento.comerciante, lancamento.banco, ROTULOS_METODO[lancamento.metodo]];

  if (lancamento.parcela) {
    partes.push(`parcela ${lancamento.parcela.atual} de ${lancamento.parcela.total}`);
  }

  return partes.filter(Boolean).join(SEPARADOR_DETALHE);
}

function classeValor(lancamento) {
  const papel = PAPEIS_COLUNA_PLANILHA.VALOR;
  return lancamento.valor > 0 ? `${papel} ${papel}--entrada` : papel;
}

function indicador(campo, ordenacao) {
  if (ordenacao.campo !== campo) {
    return TEXTO_VAZIO;
  }
  return ordenacao.ascendente ? INDICADORES.ASCENDENTE : INDICADORES.DESCENDENTE;
}

