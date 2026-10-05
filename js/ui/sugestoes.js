import { ACOES, OPERADORES_REGRA, TIPOS_SUGESTAO } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { acrescentarTermo } from '../nucleo/identidadePessoal.js';
import { criarRegra, alcance } from '../nucleo/regras.js';
import { criarElemento } from './componentes.js';

const TEXTOS = Object.freeze({
  AGORA_NAO: 'Agora não',
  CRIAR_REGRA: 'Criar regra',
  CADASTRAR: 'É você',
  USAR: 'Usar ',
  SEMPRE_QUE: ' sempre que aparecer ',
  VALE_PARA: 'Vale para',
  LANCAMENTOS_E_PROXIMAS: 'lançamentos e para as próximas importações.',
  TRATAR: 'Tratar ',
  PERGUNTA: '? ',
  COMO_CONTA_SUA: ' como conta sua? '
});

export function faixaDeSugestao(estado, colunas) {
  const { sugestao } = estado;
  if (!sugestao) {
    return null;
  }
  if (sugestao.tipo === TIPOS_SUGESTAO.IDENTIDADE) {
    return faixa(colunas, conteudoDeIdentidade(estado, sugestao));
  }
  return faixa(colunas, conteudoDeCategoria(estado, sugestao));
}

function faixa(colunas, conteudo) {
  return criarElemento('tr', { class: 'linha--sugestao' }, [
    criarElemento('td', { colspan: String(colunas) }, [
      criarElemento('div', { class: 'sugestao' }, conteudo)
    ])
  ]);
}

function conteudoDeCategoria(estado, sugestao) {
  const regra = criarRegra({
    operador: OPERADORES_REGRA.CONTEM,
    termo: sugestao.chave,
    categoria: sugestao.categoria
  });
  const atingidos = alcance(regra, estado.lancamentos);

  return [
    criarElemento('span', { class: 'sugestao__texto' }, [
      criarElemento('span', { texto: TEXTOS.USAR }),
      criarElemento('b', { texto: sugestao.categoria }),
      criarElemento('span', { texto: TEXTOS.SEMPRE_QUE }),
      criarElemento('span', { class: 'mono', texto: sugestao.chave }),
      criarElemento('span', { texto: TEXTOS.PERGUNTA }),
      criarElemento('span', {
        class: 'fraco',
        texto: `${TEXTOS.VALE_PARA} ${atingidos.total} ${TEXTOS.LANCAMENTOS_E_PROXIMAS}`
      })
    ]),
    botaoDescartar(),
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
  ];
}

function conteudoDeIdentidade(estado, sugestao) {
  const identidade = acrescentarTermo(estado.identidade, sugestao.campo, sugestao.termo);
  const atingidos = estado.lancamentos.filter((lancamento) =>
    lancamento.descricaoOriginal.includes(sugestao.termo)
  ).length;

  return [
    criarElemento('span', { class: 'sugestao__texto' }, [
      criarElemento('span', { texto: TEXTOS.TRATAR }),
      criarElemento('span', { class: 'mono', texto: sugestao.termo }),
      criarElemento('span', { texto: TEXTOS.COMO_CONTA_SUA }),
      criarElemento('span', {
        class: 'fraco',
        texto: `${TEXTOS.VALE_PARA} ${atingidos} ${TEXTOS.LANCAMENTOS_E_PROXIMAS}`
      })
    ]),
    botaoDescartar(),
    criarElemento('button', {
      class: 'botao botao--principal',
      type: 'button',
      texto: TEXTOS.CADASTRAR,
      onClick: () => {
        despachar(ACOES.DEFINIR_IDENTIDADE, identidade);
        despachar(ACOES.DESCARTAR_SUGESTAO);
      }
    })
  ];
}

function botaoDescartar() {
  return criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.AGORA_NAO,
    onClick: () => despachar(ACOES.DESCARTAR_SUGESTAO)
  });
}
