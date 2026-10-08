import { descrever, esperar, isso } from '../runner.js';
import { fatiar, paginaValida, precisaPaginar, totalDePaginas } from '../../js/nucleo/paginar.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import {
  ABAS_PLANILHA,
  ABAS_REGRAS,
  ACOES,
  CONTEXTOS_DE_PAGINA,
  TAMANHO_DE_PAGINA
} from '../../js/nucleo/constantes.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { telaPlanilha } from '../../js/ui/planilha.js';
import { telaPainel } from '../../js/ui/painel.js';
import { montarCsv } from '../../js/exportacao/csv.js';
import { aplicar } from '../../js/nucleo/filtrar.js';

const TAMANHO = 10;
const QUEBRA_DE_LINHA = '\n';

function lista(quantidade) {
  return Array.from({ length: quantidade }, (_, posicao) => posicao + 1);
}

function todasAsPaginas(itens, tamanho) {
  const paginas = [];
  for (let pagina = 1; pagina <= totalDePaginas(itens.length, tamanho); pagina += 1) {
    paginas.push(fatiar(itens, pagina, tamanho));
  }
  return paginas;
}

descrever('Quando paginar', () => {
  isso('conjunto menor que o tamanho de pagina nao precisa de paginacao', () => {
    esperar(precisaPaginar(9, TAMANHO)).falso();
  });

  isso('conjunto do tamanho exato da pagina nao precisa de paginacao', () => {
    esperar(precisaPaginar(10, TAMANHO)).falso();
  });

  isso('conjunto maior que a pagina precisa de paginacao', () => {
    esperar(precisaPaginar(11, TAMANHO)).verdadeiro();
  });

  isso('conjunto vazio nao precisa de paginacao', () => {
    esperar(precisaPaginar(0, TAMANHO)).falso();
  });
});

descrever('Contagem de páginas', () => {
  isso('conjunto vazio ainda tem uma pagina', () => {
    esperar(totalDePaginas(0, TAMANHO)).igual(1);
  });

  isso('conjunto exato nao cria pagina a mais', () => {
    esperar(totalDePaginas(30, TAMANHO)).igual(3);
  });

  isso('sobra de um item cria mais uma pagina', () => {
    esperar(totalDePaginas(31, TAMANHO)).igual(4);
  });
});

descrever('Fatia de uma página', () => {
  isso('a primeira pagina traz os primeiros itens', () => {
    esperar(fatiar(lista(25), 1, TAMANHO)).igual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  isso('a ultima pagina traz so o que sobrou, sem completar', () => {
    const ultima = fatiar(lista(25), 3, TAMANHO);

    esperar(ultima.length).igual(5);
    esperar(ultima).igual([21, 22, 23, 24, 25]);
  });

  isso('a soma das paginas e o conjunto inteiro, sem repetir nem faltar', () => {
    const itens = lista(47);
    const juntas = todasAsPaginas(itens, TAMANHO).flat();

    esperar(juntas.length).igual(itens.length);
    esperar(juntas).igual(itens);
    esperar(new Set(juntas).size).igual(itens.length);
  });

  isso('nenhuma pagina vem vazia quando existe conteudo', () => {
    const vazias = todasAsPaginas(lista(47), TAMANHO).filter((pagina) => pagina.length === 0);

    esperar(vazias.length).igual(0);
  });

  isso('conjunto vazio devolve pagina vazia, sem estourar', () => {
    esperar(fatiar([], 1, TAMANHO)).igual([]);
  });
});

descrever('Página fora do intervalo', () => {
  isso('pagina alem do total volta para a ultima valida', () => {
    esperar(paginaValida(99, 25, TAMANHO)).igual(3);
  });

  isso('pedir pagina alem do total devolve a ultima, nao uma fatia vazia', () => {
    esperar(fatiar(lista(25), 99, TAMANHO)).igual([21, 22, 23, 24, 25]);
  });

  isso('conjunto encolhido pelo filtro traz a pagina de volta para o fim', () => {
    const paginaDepoisDoFiltro = paginaValida(5, 12, TAMANHO);

    esperar(paginaDepoisDoFiltro).igual(2);
    esperar(fatiar(lista(12), paginaDepoisDoFiltro, TAMANHO)).igual([11, 12]);
  });

  isso('pagina zero ou negativa vira a primeira', () => {
    esperar(paginaValida(0, 25, TAMANHO)).igual(1);
    esperar(paginaValida(-3, 25, TAMANHO)).igual(1);
  });

  isso('pagina que nao e numero vira a primeira', () => {
    esperar(paginaValida(undefined, 25, TAMANHO)).igual(1);
    esperar(paginaValida(Number.NaN, 25, TAMANHO)).igual(1);
  });

  isso('pagina quebrada e truncada', () => {
    esperar(paginaValida(2.7, 25, TAMANHO)).igual(2);
  });
});


const PLANILHA = CONTEXTOS_DE_PAGINA.PLANILHA;
const REGRAS = CONTEXTOS_DE_PAGINA.REGRAS;

function lancamentosDe(quantidade) {
  return Array.from({ length: quantidade }, (_, posicao) => ({
    ...preparar({
      data: `${String((posicao % 28) + 1).padStart(2, '0')}/09/2026`,
      valor: `-${posicao + 1},00`,
      descricaoOriginal: `COMPRA ${posicao + 1}`,
      banco: 'Itau',
      arquivo: 'extrato.ofx'
    }),
    id: `l${posicao + 1}`
  }));
}

function comLancamentos(quantidade) {
  reiniciar();
  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: lancamentosDe(quantidade), arquivos: [] });
  return obter();
}

function irParaPagina(numero) {
  despachar(ACOES.DEFINIR_PAGINA, { contexto: PLANILHA, pagina: numero });
}

descrever('A página volta ao início quando o conjunto muda', () => {
  isso('mudar o filtro volta para a primeira pagina', () => {
    comLancamentos(60);
    irParaPagina(3);
    esperar(obter().paginas[PLANILHA]).igual(3);

    despachar(ACOES.DEFINIR_FILTROS, { busca: 'COMPRA 1' });

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('mudar a ordenacao volta para a primeira pagina', () => {
    comLancamentos(60);
    irParaPagina(3);

    despachar(ACOES.DEFINIR_ORDENACAO, 'valor');

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('mudar a aba volta para a primeira pagina', () => {
    comLancamentos(60);
    irParaPagina(3);

    despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.SEM_CATEGORIA);

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('limpar os filtros volta para a primeira pagina', () => {
    comLancamentos(60);
    irParaPagina(3);

    despachar(ACOES.LIMPAR_FILTROS);

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('mudar a aba de regras volta a primeira pagina das regras, sem mexer na planilha', () => {
    comLancamentos(60);
    irParaPagina(3);

    despachar(ACOES.DEFINIR_ABA_REGRAS, ABAS_REGRAS.DICIONARIO);

    esperar(obter().paginas[REGRAS]).igual(1);
    esperar(obter().paginas[PLANILHA]).igual(3);
  });

  isso('uma importacao nova zera as paginas', () => {
    comLancamentos(60);
    irParaPagina(3);

    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: [], arquivos: [] });

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('trocar de pagina mexe so no contexto pedido', () => {
    comLancamentos(60);
    irParaPagina(2);

    esperar(obter().paginas[PLANILHA]).igual(2);
    esperar(obter().paginas[REGRAS]).igual(1);
  });

  isso('contexto desconhecido nao muda nada', () => {
    comLancamentos(60);
    const antes = obter().paginas;

    despachar(ACOES.DEFINIR_PAGINA, { contexto: 'inventado', pagina: 7 });

    esperar(obter().paginas).igual(antes);
  });
});

descrever('O que a paginação não pode distorcer', () => {
  const TAMANHO_DA_PLANILHA = TAMANHO_DE_PAGINA[PLANILHA];

  function linhasDesenhadas(estado) {
    return telaPlanilha(estado).querySelectorAll('.tabela tbody tr').length;
  }

  isso('a tabela desenha no maximo o tamanho de uma pagina', () => {
    const estado = comLancamentos(TAMANHO_DA_PLANILHA * 3);

    esperar(linhasDesenhadas(estado)).igual(TAMANHO_DA_PLANILHA);
  });

  isso('a ultima pagina desenha so o que sobrou', () => {
    comLancamentos(TAMANHO_DA_PLANILHA * 2 + 5);
    irParaPagina(3);

    esperar(linhasDesenhadas(obter())).igual(5);
  });

  isso('o resumo conta o conjunto inteiro, nao a pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    const estado = comLancamentos(quantidade);
    const texto = telaPlanilha(estado).querySelector('.titulo-tela__texto').textContent;

    esperar(texto).contem(String(quantidade));
  });

  isso('o contador da aba conta o conjunto inteiro, nao a pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    const estado = comLancamentos(quantidade);
    const contadores = [...telaPlanilha(estado).querySelectorAll('.aba__contador')]
      .map((no) => no.textContent);

    esperar(contadores.includes(String(quantidade))).verdadeiro();
  });

  isso('o rodape da paginacao mostra o total do filtro, nao o da pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    const estado = comLancamentos(quantidade);
    const total = telaPlanilha(estado).querySelector('.paginacao__total').textContent;

    esperar(total).contem(String(quantidade));
  });

  isso('a navegacao some quando tudo cabe numa pagina', () => {
    const estado = comLancamentos(TAMANHO_DA_PLANILHA);

    esperar(telaPlanilha(estado).querySelector('.paginacao')).igual(null);
  });

  isso('selecionar tudo no cabecalho marca o conjunto inteiro, nao so a pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    const estado = comLancamentos(quantidade);
    const marcador = telaPlanilha(estado).querySelector('thead .tabela__selecao input');

    marcador.dispatchEvent(new Event('change', { bubbles: true }));

    esperar(obter().selecao.length).igual(quantidade);
  });

  isso('o marcador do cabecalho anuncia que age sobre o filtro, nao sobre a pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    const estado = comLancamentos(quantidade);
    const marcador = telaPlanilha(estado).querySelector('thead .tabela__selecao input');

    esperar(marcador.title).contem('filtro');
    esperar(marcador.title).contem(String(quantidade));
  });

  isso('marcado tudo, o rotulo passa a ser o de limpar', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    comLancamentos(quantidade);
    despachar(ACOES.DEFINIR_SELECAO, obter().lancamentos.map((lancamento) => lancamento.id));
    const marcador = telaPlanilha(obter()).querySelector('thead .tabela__selecao input');

    esperar(marcador.checked).verdadeiro();
    esperar(marcador.title).contem('Tirar a seleção');
  });

  isso('selecao parcial deixa o marcador indeterminado', () => {
    comLancamentos(TAMANHO_DA_PLANILHA * 3);
    despachar(ACOES.DEFINIR_SELECAO, obter().lancamentos.slice(0, 2).map((lancamento) => lancamento.id));
    const marcador = telaPlanilha(obter()).querySelector('thead .tabela__selecao input');

    esperar(marcador.checked).falso();
    esperar(marcador.indeterminate).verdadeiro();
  });

  isso('a selecao sobrevive a troca de pagina', () => {
    comLancamentos(TAMANHO_DE_PAGINA[PLANILHA] * 3);
    const primeiros = obter().lancamentos.slice(0, 3).map((lancamento) => lancamento.id);
    despachar(ACOES.DEFINIR_SELECAO, primeiros);

    irParaPagina(2);

    esperar(obter().selecao).igual(primeiros);
  });
});

descrever('O que a paginação não pode distorcer fora da planilha', () => {
  const TAMANHO_DA_PLANILHA = TAMANHO_DE_PAGINA[PLANILHA];

  function linhasExportadas(estado) {
    const visiveis = aplicar(estado.lancamentos, estado.filtros, estado.competencia);
    const csv = montarCsv(visiveis, estado.regras, estado.competencia).trim();
    return csv.split(QUEBRA_DE_LINHA).length;
  }

  isso('o export leva o conjunto filtrado inteiro, nao a pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    comLancamentos(quantidade);
    const naPrimeira = linhasExportadas(obter());

    irParaPagina(3);

    esperar(linhasExportadas(obter())).igual(naPrimeira);
    esperar(naPrimeira > quantidade).verdadeiro();
  });

  isso('os totais do painel nao mudam ao trocar de pagina', () => {
    comLancamentos(TAMANHO_DA_PLANILHA * 3);
    const naPrimeira = telaPainel(obter()).textContent;

    irParaPagina(3);

    esperar(telaPainel(obter()).textContent).igual(naPrimeira);
  });

  isso('a busca encontra o que esta em outra pagina', () => {
    const quantidade = TAMANHO_DA_PLANILHA * 3;
    comLancamentos(quantidade);
    irParaPagina(1);

    despachar(ACOES.DEFINIR_FILTROS, { busca: `COMPRA ${quantidade}` });
    const encontrados = aplicar(obter().lancamentos, obter().filtros, obter().competencia);

    esperar(encontrados.length).igual(1);
    esperar(telaPlanilha(obter()).querySelectorAll('.tabela tbody tr').length).igual(1);
  });
});
