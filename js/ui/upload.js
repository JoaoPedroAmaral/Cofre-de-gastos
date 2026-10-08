import {
  ACOES,
  CONTEXTOS_DE_PAGINA,
  NIVEIS_AVISO,
  TAMANHO_DE_PAGINA,
  TELAS
} from '../nucleo/constantes.js';
import { despachar, obter } from '../estado/store.js';
import { mesclar } from '../nucleo/deduplicar.js';
import { estaForaDoTotal } from '../nucleo/naoGasto.js';
import { RESULTADOS, construirLancamentos, importarArquivos } from '../importadores/importar.js';
import { aplicarMapeamento } from '../importadores/tabela.js';
import { descreverPerfil } from '../importadores/bancos/index.js';
import { avisar, criarElemento } from './componentes.js';
import { ORIGENS_PERIODO, unirPeriodos } from '../importadores/periodo.js';
import { formatarPeriodo } from './formato.js';
import { alvoUpload, icone } from './icones.js';
import { abrirMapeador } from './mapeador.js';
import { navegacaoDePaginas } from './paginacao.js';
import { fatiar } from '../nucleo/paginar.js';

const EXTENSOES_ACEITAS = '.ofx,.csv,.xlsx,.xls,.pdf,.txt';
const CONTEXTO = CONTEXTOS_DE_PAGINA.IMPORTACAO;
const TAMANHO_DA_PAGINA = TAMANHO_DE_PAGINA[CONTEXTO];
const TEXTO_VAZIO = '';
const LIMITE_PENDENCIAS_VISIVEIS = 8;

const TEXTOS = Object.freeze({
  TITULO: 'Importar extratos',
  SUBTITULO:
    'Pode jogar vários arquivos de bancos diferentes de uma vez. O que já foi importado antes é reconhecido e não duplica.',
  ARRASTE: 'Arraste os arquivos aqui',
  FORMATOS: 'OFX, CSV, XLSX e PDF de fatura.',
  BOTAO: 'Escolher arquivos',
  PRIVACIDADE: 'Os arquivos são lidos aqui no navegador. Nada é enviado para lugar nenhum.',
  RELATORIO: 'Esta importação',
  ARQUIVOS_NA_IMPORTACAO: 'arquivos nesta importação',
  SEM_ARQUIVOS: 'Nenhum arquivo selecionado.',
  VER_PLANILHA: 'Ver na planilha',
  AGUARDANDO: 'Formato que ainda não conhecemos',
  RECONHECIDO: 'reconhecido como',
  PERIODO_SUPOSTO: 'período pelo nome do arquivo',
  PERIODO_DA_IMPORTACAO: 'Período importado:',
  PENDENCIAS: 'Linhas que não foram importadas',
  PENDENCIAS_NOTA:
    'A fatura foi lida, mas estas linhas não encaixaram no formato esperado. Nenhuma delas entrou no total. Confira na fatura e, se for lançamento, acrescente pelo extrato da conta ou pelo mapeador.'
});

export function telaImportar(estado) {
  const arquivos = estado.importacao.arquivos;

  return criarElemento('div', { class: 'tela grade-importar' }, [
    criarElemento('div', { class: 'coluna' }, [
      criarElemento('div', { class: 'titulo-tela' }, [
        criarElemento('h1', { texto: TEXTOS.TITULO }),
        criarElemento('p', { class: 'titulo-tela__texto', texto: TEXTOS.SUBTITULO })
      ]),
      areaUpload(),
      criarElemento('p', { class: 'privacidade' }, [
        icone('travar', 16),
        criarElemento('span', { texto: TEXTOS.PRIVACIDADE })
      ])
    ]),
    arquivos.length === 0 ? criarElemento('div') : relatorio(arquivos, estado)
  ]);
}

function areaUpload() {
  const entrada = criarElemento('input', {
    class: 'entrada-arquivo',
    type: 'file',
    multiple: 'multiple',
    accept: EXTENSOES_ACEITAS,
    'aria-label': TEXTOS.BOTAO,
    onChange: (evento) => processar([...evento.target.files])
  });

  const area = criarElemento(
    'section',
    {
      class: 'area-upload',
      onDragover: (evento) => {
        evento.preventDefault();
        area.classList.add('area-upload--ativa');
      },
      onDragleave: () => area.classList.remove('area-upload--ativa'),
      onDrop: (evento) => {
        evento.preventDefault();
        area.classList.remove('area-upload--ativa');
        processar([...evento.dataTransfer.files]);
      }
    },
    [
      criarElemento('span', { class: 'area-upload__alvo' }, [alvoUpload()]),
      criarElemento('span', { class: 'area-upload__rotulos' }, [
        criarElemento('span', { class: 'area-upload__titulo', texto: TEXTOS.ARRASTE }),
        criarElemento('span', { class: 'area-upload__nota', texto: TEXTOS.FORMATOS })
      ]),
      criarElemento('label', { class: 'botao botao--principal' }, [
        criarElemento('span', { texto: TEXTOS.BOTAO }),
        entrada
      ])
    ]
  );

  return area;
}

function relatorio(arquivos, estado) {
  const totalLancamentos = estado.lancamentos.length;
  const novos = arquivos.reduce((soma, item) => soma + item.quantidade, 0);
  const repetidos = arquivos.reduce((soma, item) => soma + item.ignorados, 0);
  const foraDoTotal = arquivos.reduce((soma, item) => soma + item.foraDoTotal, 0);

  return criarElemento('section', { class: 'relatorio', 'aria-label': TEXTOS.RELATORIO }, [
    criarElemento('div', { class: 'relatorio__cabecalho' }, [
      criarElemento('h2', { texto: TEXTOS.RELATORIO }),
      criarElemento('span', { class: 'fraco', texto: `${arquivos.length} arquivos` })
    ]),
    ...fatiar(arquivos, estado.paginas[CONTEXTO], TAMANHO_DA_PAGINA).map(linhaArquivo),
    navegacaoDePaginas({
      contexto: CONTEXTO,
      pagina: estado.paginas[CONTEXTO],
      quantidade: arquivos.length,
      tamanho: TAMANHO_DA_PAGINA,
      rotuloDoTotal: `${arquivos.length} ${TEXTOS.ARQUIVOS_NA_IMPORTACAO}`
    }),
    criarElemento('div', { class: 'resumo-importacao' }, [
      criarElemento('p', {}, [
        criarElemento('span', { class: 'mono', texto: String(novos) }),
        criarElemento('span', { texto: ' lançamentos novos entraram. ' }),
        criarElemento('span', {
          class: 'fraco',
          texto: `${repetidos} repetidos foram ignorados e ${foraDoTotal} ficaram fora do total.`
        }),
        periodoDaImportacao(arquivos)
      ]),
      criarElemento('div', { class: 'resumo-importacao__acoes' }, [
        criarElemento('button', {
          class: 'botao botao--principal',
          type: 'button',
          texto: TEXTOS.VER_PLANILHA,
          onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.PLANILHA)
        }),
        criarElemento('span', {
          class: 'fraco',
          texto: `${totalLancamentos} lançamentos guardados no total`
        })
      ])
    ])
  ]);
}

function periodoDaImportacao(arquivos) {
  const periodo = unirPeriodos(arquivos.map((item) => item.periodo));
  if (!periodo) {
    return null;
  }
  return criarElemento('span', {
    class: 'fraco',
    texto: ` ${TEXTOS.PERIODO_DA_IMPORTACAO} ${formatarPeriodo(periodo)}.`
  });
}

function linhaArquivo(item) {
  const linha = criarElemento('div', { class: 'arquivo' }, [
    criarElemento('span', { class: `arquivo__marca arquivo__marca--${item.resultado}` }, [
      marcaDoResultado(item.resultado)
    ]),
    criarElemento('div', { class: 'arquivo__dados' }, [
      criarElemento('span', { class: 'arquivo__nome', texto: item.nome }),
      criarElemento('span', { class: classeDetalhe(item), texto: detalhe(item) })
    ]),
    numerosDoArquivo(item)
  ]);

  const pendencias = item.pendencias || [];
  if (pendencias.length === 0) {
    return linha;
  }

  return criarElemento('div', { class: 'arquivo-com-pendencias' }, [linha, listaDePendencias(pendencias)]);
}

function listaDePendencias(pendencias) {
  const visiveis = pendencias.slice(0, LIMITE_PENDENCIAS_VISIVEIS);
  const ocultas = pendencias.length - visiveis.length;

  const itens = visiveis.map((pendencia) =>
    criarElemento('li', { class: 'pendencias__linha' }, [
      criarElemento('span', { class: 'mono', texto: pendencia.texto }),
      criarElemento('span', { class: 'pendencias__motivo', texto: pendencia.motivo })
    ])
  );

  if (ocultas > 0) {
    itens.push(
      criarElemento('li', { class: 'pendencias__linha fraco', texto: `e mais ${ocultas}` })
    );
  }

  return criarElemento('div', { class: 'pendencias' }, [
    criarElemento('span', { class: 'pendencias__titulo', texto: TEXTOS.PENDENCIAS }),
    criarElemento('p', { class: 'pendencias__nota', texto: TEXTOS.PENDENCIAS_NOTA }),
    criarElemento('ul', { class: 'pendencias__itens' }, itens)
  ]);
}

function marcaDoResultado(resultado) {
  if (resultado === RESULTADOS.IMPORTADO) {
    return icone('confirmado', 18);
  }
  if (resultado === RESULTADOS.FALHOU) {
    return icone('falhou', 18);
  }
  return criarElemento('span', { class: 'ponto' });
}

function classeDetalhe(item) {
  return item.resultado === RESULTADOS.FALHOU ? 'arquivo__detalhe arquivo__detalhe--erro' : 'arquivo__detalhe';
}

function detalhe(item) {
  if (item.resultado === RESULTADOS.FALHOU) {
    return item.mensagem;
  }
  if (item.resultado === RESULTADOS.PRECISA_MAPEAMENTO) {
    return TEXTOS.AGUARDANDO;
  }

  const partes = [];
  if (item.periodo) {
    partes.push(descreverPeriodo(item.periodo));
  }
  if (item.perfil) {
    partes.push(`${TEXTOS.RECONHECIDO} ${descreverPerfil(item.perfil)}`);
  }
  if (item.ignorados > 0) {
    partes.push(`${item.ignorados} já existiam`);
  }
  if (item.foraDoTotal > 0) {
    partes.push(`${item.foraDoTotal} fora do total`);
  }
  if (item.rejeitadas > 0) {
    partes.push(`${item.rejeitadas} linhas rejeitadas`);
  }
  if ((item.pendencias || []).length > 0) {
    partes.push(`${item.pendencias.length} linhas não reconhecidas`);
  }
  return partes.join(' · ') || item.banco || TEXTO_VAZIO;
}

function descreverPeriodo(periodo) {
  const texto = formatarPeriodo(periodo);
  if (periodo.origem === ORIGENS_PERIODO.NOME) {
    return `${texto} (${TEXTOS.PERIODO_SUPOSTO})`;
  }
  return texto;
}

function numerosDoArquivo(item) {
  if (item.resultado === RESULTADOS.IMPORTADO) {
    return criarElemento('span', { class: 'arquivo__numeros' }, [
      criarElemento('span', { class: 'mono', texto: String(item.quantidade) }),
      criarElemento('span', { texto: ' novos' })
    ]);
  }
  return criarElemento('span', { class: 'arquivo__numeros fraco', texto: TEXTO_VAZIO });
}

async function processar(arquivos) {
  if (arquivos.length === 0) {
    avisar(TEXTOS.SEM_ARQUIVOS, NIVEIS_AVISO.ATENCAO);
    return;
  }

  const lidos = await Promise.all(arquivos.map(lerArquivo));
  const resultado = await importarArquivos(lidos, obter().identidade);

  registrar(resultado.arquivos);

  resultado.arquivos
    .filter((item) => item.resultado === RESULTADOS.PRECISA_MAPEAMENTO)
    .forEach((item) => abrirMapeador(item, (mapeamento) => concluirMapeamento(item, mapeamento)));
}

function concluirMapeamento(item, mapeamento) {
  const brutos = aplicarMapeamento(item.tabela, mapeamento, { arquivo: item.nome });
  const { lancamentos, erros } = construirLancamentos(brutos, obter().identidade);

  registrar([{ ...item, resultado: RESULTADOS.IMPORTADO, lancamentos, erros }]);
}

function registrar(arquivos) {
  const inseridos = [];
  const resumos = [];

  arquivos.forEach((item) => {
    const existentes = [...obter().lancamentos, ...inseridos];
    const mesclagem = mesclar(existentes, item.lancamentos || []);
    inseridos.push(...mesclagem.inseridos);
    resumos.push(resumir(item, mesclagem));
  });

  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: inseridos, arquivos: resumos });
}

function resumir(item, mesclagem) {
  return {
    nome: item.nome,
    resultado: item.resultado,
    periodo: item.periodo || null,
    mensagem: item.mensagem || TEXTO_VAZIO,
    perfil: item.perfil || TEXTO_VAZIO,
    pendencias: item.pendencias || [],
    banco: bancoDe(mesclagem.inseridos),
    quantidade: mesclagem.inseridos.length,
    ignorados: mesclagem.ignorados,
    foraDoTotal: mesclagem.inseridos.filter(estaForaDoTotal).length,
    rejeitadas: (item.erros || []).length
  };
}

function bancoDe(lancamentos) {
  const primeiro = lancamentos[0];
  return primeiro ? primeiro.banco : TEXTO_VAZIO;
}

function lerArquivo(arquivo) {
  return arquivo
    .arrayBuffer()
    .then((conteudo) => ({ nome: arquivo.name, bytes: new Uint8Array(conteudo) }));
}
