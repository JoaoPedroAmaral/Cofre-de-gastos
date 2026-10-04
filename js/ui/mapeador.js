import { NIVEIS_AVISO } from '../nucleo/constantes.js';
import { aplicarMapeamento, indiceSugerido } from '../importadores/tabela.js';
import { TERMOS_COLUNA, salvar } from '../importadores/mapeamentos.js';
import { construirLancamentos } from '../importadores/importar.js';
import { abrirModal, avisar, criarElemento } from './componentes.js';
import { formatarData, formatarMoeda } from './formato.js';

const LINHAS_PREVIA = 4;
const SEM_COLUNA = '';
const TEXTO_VAZIO = '';

const TEXTOS = Object.freeze({
  TITULO: 'O que é cada coluna?',
  EXPLICACAO:
    'Só precisamos de data, valor e descrição. Você faz isso uma vez: da próxima vez, arquivos com este mesmo formato entram direto.',
  COMO_FICA: 'Como vai ficar',
  NOME_FORMATO: 'Nome deste formato',
  DETECTADO: 'Detectamos sozinhos',
  SALVAR: 'Salvar e importar',
  CANCELAR: 'Cancelar',
  OBRIGATORIOS: 'Escolha as colunas de data, valor e descrição.',
  SEM_PREVIA: 'Nenhuma linha pôde ser interpretada com as colunas escolhidas.',
  IGNORAR: 'Ignorar'
});

const CAMPOS = Object.freeze([
  { chave: 'data', rotulo: 'Data', termos: TERMOS_COLUNA.DATA },
  { chave: 'descricao', rotulo: 'Descrição', termos: TERMOS_COLUNA.DESCRICAO },
  { chave: 'valor', rotulo: 'Valor', termos: TERMOS_COLUNA.VALOR },
  { chave: 'debito', rotulo: 'Débito', termos: TERMOS_COLUNA.DEBITO },
  { chave: 'credito', rotulo: 'Crédito', termos: TERMOS_COLUNA.CREDITO }
]);

export function abrirMapeador(item, aoConfirmar) {
  const selecoes = sugerirSelecoes(item.tabela.cabecalho);
  const previa = criarElemento('div', { class: 'previa' });
  const campoNome = criarElemento('input', {
    class: 'campo__entrada',
    type: 'text',
    id: 'nome-formato',
    value: nomeSugerido(item.nome)
  });

  const aoMudar = () => atualizarPrevia(previa, item, selecoes, campoNome.value);

  const modal = abrirModal({
    titulo: TEXTOS.TITULO,
    corpo: criarElemento('div', { class: 'mapeador' }, [
      criarElemento('div', { class: 'mapeador__principal' }, [
        criarElemento('p', { class: 'titulo-tela__texto', texto: TEXTOS.EXPLICACAO }),
        tabelaBruta(item.tabela, selecoes, aoMudar),
        criarElemento('h3', { texto: TEXTOS.COMO_FICA }),
        previa
      ]),
      criarElemento('aside', { class: 'mapeador__lateral' }, [
        criarElemento('div', { class: 'campo' }, [
          criarElemento('label', { class: 'campo__rotulo', for: 'nome-formato', texto: TEXTOS.NOME_FORMATO }),
          campoNome
        ]),
        criarElemento('div', {}, [
          criarElemento('p', { class: 'campo__rotulo', texto: TEXTOS.DETECTADO }),
          ...detectados(item)
        ])
      ])
    ]),
    acoes: [
      { rotulo: TEXTOS.CANCELAR, principal: false, aoClicar: () => modal.fechar() },
      {
        rotulo: TEXTOS.SALVAR,
        principal: true,
        aoClicar: () => confirmar(item, selecoes, campoNome.value, modal, aoConfirmar)
      }
    ]
  });

  aoMudar();
}

function tabelaBruta(tabela, selecoes, aoMudar) {
  const cabecalho = tabela.cabecalho.map((nome, indice) =>
    criarElemento('th', {}, [
      seletorDeCampo(indice, selecoes, aoMudar),
      criarElemento('small', { class: 'mapeador__coluna-origem', texto: nome })
    ])
  );

  const linhas = tabela.linhas.slice(0, LINHAS_PREVIA).map((linha) =>
    criarElemento(
      'tr',
      {},
      tabela.cabecalho.map((_, indice) => criarElemento('td', { texto: linha[indice] ?? TEXTO_VAZIO }))
    )
  );

  return criarElemento('div', { class: 'tabela-rolagem' }, [
    criarElemento('table', { class: 'mapeador__bruto' }, [
      criarElemento('thead', {}, [criarElemento('tr', {}, cabecalho)]),
      criarElemento('tbody', {}, linhas)
    ])
  ]);
}

function seletorDeCampo(indice, selecoes, aoMudar) {
  const opcoes = [
    criarElemento('option', { value: SEM_COLUNA, texto: TEXTOS.IGNORAR }),
    ...CAMPOS.map((campo) => criarElemento('option', { value: campo.chave, texto: campo.rotulo }))
  ];

  const seletor = criarElemento(
    'select',
    {
      class: 'seletor-coluna',
      'aria-label': `Campo da coluna ${indice + 1}`,
      onChange: (evento) => {
        atribuir(selecoes, indice, evento.target.value);
        sincronizar(selecoes);
        aoMudar();
      }
    },
    opcoes
  );

  seletor.value = selecoes.get(indice) ?? SEM_COLUNA;
  seletor.classList.toggle('seletor-coluna--ignorada', seletor.value === SEM_COLUNA);
  seletor.dataset.coluna = String(indice);

  return seletor;
}

function sincronizar(selecoes) {
  document.querySelectorAll('.seletor-coluna').forEach((seletor) => {
    const indice = Number(seletor.dataset.coluna);
    seletor.value = selecoes.get(indice) ?? SEM_COLUNA;
    seletor.classList.toggle('seletor-coluna--ignorada', seletor.value === SEM_COLUNA);
  });
}

function atribuir(selecoes, indice, campo) {
  if (campo === SEM_COLUNA) {
    selecoes.delete(indice);
    return;
  }

  [...selecoes.entries()]
    .filter(([, escolhido]) => escolhido === campo)
    .forEach(([posicao]) => selecoes.delete(posicao));

  selecoes.set(indice, campo);
}

function sugerirSelecoes(cabecalho) {
  const selecoes = new Map();

  CAMPOS.forEach((campo) => {
    const indice = indiceSugerido(cabecalho, campo.termos);
    if (indice !== -1 && !selecoes.has(indice)) {
      selecoes.set(indice, campo.chave);
    }
  });

  return selecoes;
}

function montarMapeamento(selecoes, banco) {
  const colunas = {};
  selecoes.forEach((campo, indice) => {
    colunas[campo] = indice;
  });

  const temValor = colunas.valor !== undefined || colunas.debito !== undefined || colunas.credito !== undefined;
  if (colunas.data === undefined || colunas.descricao === undefined || !temValor) {
    return null;
  }

  return { colunas, banco: banco.trim() };
}

function atualizarPrevia(previa, item, selecoes, banco) {
  const mapeamento = montarMapeamento(selecoes, banco);
  if (!mapeamento) {
    previa.replaceChildren(criarElemento('p', { class: 'fraco', texto: TEXTOS.OBRIGATORIOS }));
    return;
  }

  const recorte = { cabecalho: item.tabela.cabecalho, linhas: item.tabela.linhas.slice(0, LINHAS_PREVIA) };
  const { lancamentos } = construirLancamentos(aplicarMapeamento(recorte, mapeamento, { arquivo: item.nome }));

  if (lancamentos.length === 0) {
    previa.replaceChildren(criarElemento('p', { class: 'fraco', texto: TEXTOS.SEM_PREVIA }));
    return;
  }

  previa.replaceChildren(
    ...lancamentos.map((lancamento) =>
      criarElemento('div', { class: 'previa__linha' }, [
        criarElemento('span', { class: 'mono fraco', texto: formatarData(lancamento.data) }),
        criarElemento('span', { texto: lancamento.descricaoOriginal }),
        criarElemento('span', {
          class: lancamento.valor > 0 ? 'tabela__valor tabela__valor--entrada' : 'tabela__valor',
          texto: formatarMoeda(lancamento.valor)
        })
      ])
    )
  );
}

function detectados(item) {
  return [
    { rotulo: 'Formato', valor: item.formato.toUpperCase() },
    { rotulo: 'Separador', valor: item.tabela.delimitador || 'coluna de planilha' },
    { rotulo: 'Colunas', valor: String(item.tabela.cabecalho.length) },
    { rotulo: 'Linhas', valor: String(item.tabela.linhas.length) }
  ].map(({ rotulo, valor }) =>
    criarElemento('div', { class: 'detectado' }, [
      criarElemento('span', { texto: rotulo }),
      criarElemento('span', { class: 'detectado__valor', texto: valor })
    ])
  );
}

function confirmar(item, selecoes, banco, modal, aoConfirmar) {
  const mapeamento = montarMapeamento(selecoes, banco);
  if (!mapeamento) {
    avisar(TEXTOS.OBRIGATORIOS, NIVEIS_AVISO.ATENCAO);
    return;
  }

  salvar(item.assinatura, mapeamento);
  modal.fechar();
  aoConfirmar(mapeamento);
}

function nomeSugerido(arquivo) {
  return arquivo
    .replace(/\.[^.]+$/, TEXTO_VAZIO)
    .replace(/[_-]+/g, ' ')
    .trim();
}
