import { ACOES } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { bancosDe, tagsDe } from '../nucleo/filtrar.js';
import { mesAnterior, mesSeguinte } from '../nucleo/agregar.js';
import { criarElemento } from './componentes.js';
import { icone } from './icones.js';
import { formatarMesLongo } from './formato.js';

const TEXTO_VAZIO = '';

const TEXTOS = Object.freeze({
  ANTERIOR: 'Mês anterior',
  PROXIMO: 'Próximo mês',
  TODOS_MESES: 'Todo o período',
  BUSCAR: 'Buscar lançamento',
  BANCO: 'Todos os bancos',
  CATEGORIA: 'Todas as categorias',
  TAG: 'Todas as tags',
  LIMPAR: 'Limpar filtros'
});

export function navegacaoDeMes(estado, meses) {
  const atual = estado.filtros.mes;
  const anterior = mesAnterior(meses, atual);
  const seguinte = mesSeguinte(meses, atual);

  return criarElemento('div', { class: 'navegacao-mes' }, [
    botaoMes(TEXTOS.ANTERIOR, 'anterior', anterior),
    criarElemento('span', {
      class: 'navegacao-mes__rotulo',
      texto: atual ? formatarMesLongo(atual) : TEXTOS.TODOS_MESES
    }),
    botaoMes(TEXTOS.PROXIMO, 'proximo', seguinte),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.TODOS_MESES,
      disabled: atual ? null : 'disabled',
      onClick: () => despachar(ACOES.DEFINIR_FILTROS, { mes: TEXTO_VAZIO })
    })
  ]);
}

function botaoMes(rotulo, direcao, destino) {
  const botao = criarElemento(
    'button',
    {
      class: 'botao',
      type: 'button',
      'aria-label': rotulo,
      onClick: () => despachar(ACOES.DEFINIR_FILTROS, { mes: destino })
    },
    [icone(direcao === 'anterior' ? 'anterior' : 'proximo', 18)]
  );

  if (!destino) {
    botao.disabled = true;
  }

  return botao;
}

export function filtrosDaPlanilha(estado) {
  const busca = criarElemento('input', {
    type: 'search',
    'aria-label': TEXTOS.BUSCAR,
    placeholder: TEXTOS.BUSCAR,
    value: estado.filtros.busca,
    onInput: (evento) => despachar(ACOES.DEFINIR_FILTROS, { busca: evento.target.value })
  });

  return criarElemento('div', { class: 'filtros' }, [
    criarElemento('label', { class: 'busca' }, [icone('busca', 16), busca]),
    seletor(TEXTOS.BANCO, bancosDe(estado.lancamentos), estado.filtros.banco, (valor) =>
      despachar(ACOES.DEFINIR_FILTROS, { banco: valor })
    ),
    seletor(TEXTOS.CATEGORIA, categoriasEmUso(estado), estado.filtros.categoria, (valor) =>
      despachar(ACOES.DEFINIR_FILTROS, { categoria: valor })
    ),
    seletor(TEXTOS.TAG, tagsDe(estado.lancamentos), estado.filtros.tag, (valor) =>
      despachar(ACOES.DEFINIR_FILTROS, { tag: valor })
    ),
    temFiltro(estado.filtros)
      ? criarElemento('button', {
          class: 'botao botao--discreto',
          type: 'button',
          texto: TEXTOS.LIMPAR,
          onClick: () => despachar(ACOES.LIMPAR_FILTROS)
        })
      : null
  ]);
}

function seletor(rotuloVazio, opcoes, escolhido, aoMudar) {
  const campo = criarElemento(
    'select',
    {
      class: 'botao',
      'aria-label': rotuloVazio,
      onChange: (evento) => aoMudar(evento.target.value)
    },
    [
      criarElemento('option', { value: TEXTO_VAZIO, texto: rotuloVazio }),
      ...opcoes.map((opcao) => criarElemento('option', { value: opcao, texto: opcao }))
    ]
  );

  campo.value = escolhido;
  return campo;
}

function categoriasEmUso(estado) {
  const usadas = new Set(estado.lancamentos.map((lancamento) => lancamento.categoria));
  return estado.categorias.filter((categoria) => usadas.has(categoria));
}

function temFiltro(filtros) {
  return Boolean(filtros.banco || filtros.categoria || filtros.tag || filtros.busca);
}
