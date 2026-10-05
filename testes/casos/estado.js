import { descrever, esperar, isso } from '../runner.js';
import { despachar, obter, observar, reiniciar } from '../../js/estado/store.js';
import {
  ABAS_PLANILHA,
  ABAS_REGRAS,
  ACOES,
  CATEGORIA_SEM_CLASSIFICACAO,
  COMPETENCIA,
  MOTIVOS_NAO_GASTO,
  OPERADORES_REGRA,
  ORIGENS_REGRA,
  TELAS,
  TEMAS
} from '../../js/nucleo/constantes.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { estaForaDoTotal, motivoForaDoTotal } from '../../js/nucleo/naoGasto.js';

function lancamentoDe(descricao, id) {
  return {
    ...preparar({
      data: '05/09/2026',
      valor: '-45,90',
      descricaoOriginal: descricao,
      banco: 'Itau',
      arquivo: 'extrato.ofx'
    }),
    id
  };
}

function importar(lancamentos) {
  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos, arquivos: [] });
}

descrever('Estado da aplicação', () => {
  isso('inicia na tela de importação', () => {
    reiniciar();
    esperar(obter().tela).igual(TELAS.IMPORTAR);
  });

  isso('troca de tela quando a tela existe', () => {
    reiniciar();
    despachar(ACOES.TROCAR_TELA, TELAS.PAINEL);
    esperar(obter().tela).igual(TELAS.PAINEL);
  });

  isso('ignora troca para tela inexistente', () => {
    reiniciar();
    despachar(ACOES.TROCAR_TELA, 'inexistente');
    esperar(obter().tela).igual(TELAS.IMPORTAR);
  });

  isso('define tema valido', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_TEMA, TEMAS.ESCURO);
    esperar(obter().tema).igual(TEMAS.ESCURO);
  });

  isso('ignora tema invalido', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_TEMA, 'neon');
    esperar(obter().tema).igual(TEMAS.SISTEMA);
  });

  isso('alterna o regime de competencia do cartao', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_COMPETENCIA, COMPETENCIA.FATURA);
    esperar(obter().competencia).igual(COMPETENCIA.FATURA);
  });

  isso('mescla filtros sem apagar os demais', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_FILTROS, { banco: 'Itau' });
    despachar(ACOES.DEFINIR_FILTROS, { categoria: 'Mercado' });
    esperar(obter().filtros.banco).igual('Itau');
    esperar(obter().filtros.categoria).igual('Mercado');
  });

  isso('limpa todos os filtros', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_FILTROS, { banco: 'Itau', busca: 'uber' });
    despachar(ACOES.LIMPAR_FILTROS);
    esperar(obter().filtros.banco).igual('');
    esperar(obter().filtros.busca).igual('');
  });

  isso('notifica observadores apenas quando o estado muda', () => {
    reiniciar();
    let notificacoes = 0;
    const cancelar = observar(() => {
      notificacoes += 1;
    });
    despachar(ACOES.TROCAR_TELA, TELAS.REGRAS);
    despachar(ACOES.TROCAR_TELA, TELAS.REGRAS);
    cancelar();
    esperar(notificacoes).igual(1);
  });

  isso('para de notificar depois de cancelar a observacao', () => {
    reiniciar();
    let notificacoes = 0;
    const cancelar = observar(() => {
      notificacoes += 1;
    });
    cancelar();
    despachar(ACOES.TROCAR_TELA, TELAS.PLANILHA);
    esperar(notificacoes).igual(0);
  });

  isso('guarda o relatorio da importacao no estado', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ data: '2026-09-03', valor: -4590 }],
      arquivos: [{ nome: 'extrato.ofx', resultado: 'importado', quantidade: 1, rejeitadas: 0 }]
    });
    esperar(obter().lancamentos.length).igual(1);
    esperar(obter().importacao.arquivos.length).igual(1);
  });

  isso('substitui o relatorio do arquivo remapeado sem duplicar a linha', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [],
      arquivos: [{ nome: 'banco.csv', resultado: 'precisa_mapeamento', quantidade: 0, rejeitadas: 0 }]
    });
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ data: '2026-09-03', valor: -1000 }],
      arquivos: [{ nome: 'banco.csv', resultado: 'importado', quantidade: 1, rejeitadas: 0 }]
    });
    esperar(obter().importacao.arquivos.length).igual(1);
    esperar(obter().importacao.arquivos[0].resultado).igual('importado');
    esperar(obter().lancamentos.length).igual(1);
  });

  isso('acumula lancamentos de importacoes diferentes', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ data: '2026-09-03', valor: -1000 }],
      arquivos: [{ nome: 'um.ofx', resultado: 'importado', quantidade: 1, rejeitadas: 0 }]
    });
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ data: '2026-09-04', valor: -2000 }],
      arquivos: [{ nome: 'dois.ofx', resultado: 'importado', quantidade: 1, rejeitadas: 0 }]
    });
    esperar(obter().lancamentos.length).igual(2);
    esperar(obter().importacao.arquivos.length).igual(2);
  });

  isso('troca a aba da planilha', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.FORA_DO_TOTAL);
    esperar(obter().aba).igual(ABAS_PLANILHA.FORA_DO_TOTAL);
  });

  isso('ignora aba inexistente', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_ABA, 'inventada');
    esperar(obter().aba).igual(ABAS_PLANILHA.TODOS);
  });

  isso('inclui no total um lancamento que o sistema tirou', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ id: 'a1', valor: -100, naoGasto: MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA }],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['a1'], fora: false });
    esperar(estaForaDoTotal(obter().lancamentos[0])).falso();
    esperar(obter().lancamentos[0].naoGasto).igual(MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA);
  });

  isso('tira do total um lancamento que contava', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ id: 'a2', valor: -100, naoGasto: false }],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['a2'], fora: true });
    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
    esperar(motivoForaDoTotal(obter().lancamentos[0])).igual(MOTIVOS_NAO_GASTO.MANUAL);
  });

  isso('devolve o lancamento a decisao automatica', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [{ id: 'a3', valor: -100, naoGasto: MOTIVOS_NAO_GASTO.APLICACAO }],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['a3'], fora: false });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['a3'], fora: null });
    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
    esperar(motivoForaDoTotal(obter().lancamentos[0])).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('tira do total vários selecionados de uma vez', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [
        { id: 'b1', valor: -100, descricaoOriginal: 'UM', naoGasto: false },
        { id: 'b2', valor: -200, descricaoOriginal: 'DOIS', naoGasto: false },
        { id: 'b3', valor: -300, descricaoOriginal: 'TRES', naoGasto: false }
      ],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['b1', 'b3'], fora: true });

    const fora = obter().lancamentos.filter(estaForaDoTotal).map((lancamento) => lancamento.id);
    esperar(fora).igual(['b1', 'b3']);
  });

  isso('ignora marcacao sem nenhum lancamento alvo', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: [], fora: true });
    esperar(obter().lancamentos.length).igual(0);
  });

  isso('aplica o dicionario semente ja na importacao', () => {
    reiniciar();
    importar([lancamentoDe('NETFLIX.COM', 'n1')]);
    esperar(obter().lancamentos[0].categoria).igual('Assinaturas');
  });

  isso('categoriza um lancamento e marca como revisado a mao', () => {
    reiniciar();
    importar([lancamentoDe('LOJA DESCONHECIDA', 'l1')]);
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['l1'], categoria: 'Compras' });
    esperar(obter().lancamentos[0].categoria).igual('Compras');
    esperar(obter().lancamentos[0].revisadoManual).verdadeiro();
  });

  isso('oferece regra apos categorizar um lancamento sozinho', () => {
    reiniciar();
    importar([lancamentoDe('PAGBANK*JL ALIMENTOS', 'l2')]);
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['l2'], categoria: 'Alimentação' });
    esperar(obter().sugestao.chave).igual('JL ALIMENTOS');
    esperar(obter().sugestao.categoria).igual('Alimentação');
  });

  isso('nao oferece regra ao categorizar em lote comerciantes diferentes', () => {
    reiniciar();
    importar([lancamentoDe('PAGBANK*JL ALIMENTOS', 'l3'), lancamentoDe('LOJA X', 'l4')]);
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['l3', 'l4'], categoria: 'Compras' });
    esperar(obter().sugestao).igual(null);
  });

  isso('descarta a sugestao', () => {
    reiniciar();
    importar([lancamentoDe('PAGBANK*JL ALIMENTOS', 'l5')]);
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['l5'], categoria: 'Alimentação' });
    despachar(ACOES.DESCARTAR_SUGESTAO);
    esperar(obter().sugestao).igual(null);
  });

  isso('criar regra reclassifica o historico e limpa a sugestao', () => {
    reiniciar();
    importar([lancamentoDe('CANTINA BOM GOSTO', 'l6'), lancamentoDe('CANTINA BOM GOSTO 2', 'l7')]);
    despachar(ACOES.CRIAR_REGRA, {
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'CANTINA BOM GOSTO',
      categoria: 'Alimentação'
    });
    esperar(obter().lancamentos[1].categoria).igual('Alimentação');
    esperar(obter().sugestao).igual(null);
  });

  isso('remover regra devolve o lancamento para sem categoria', () => {
    reiniciar();
    importar([lancamentoDe('LOJA ESPECIFICA', 'l8')]);
    despachar(ACOES.CRIAR_REGRA, {
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'LOJA ESPECIFICA',
      categoria: 'Compras'
    });
    const criada = obter().regras.find((regra) => regra.origem === ORIGENS_REGRA.USUARIO);
    despachar(ACOES.REMOVER_REGRA, criada.id);
    esperar(obter().lancamentos[0].categoria).igual(CATEGORIA_SEM_CLASSIFICACAO);
  });

  isso('a regra do usuario vence o dicionario na importacao', () => {
    reiniciar();
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'NETFLIX', categoria: 'Lazer' });
    importar([lancamentoDe('NETFLIX.COM', 'n2')]);
    esperar(obter().lancamentos[0].categoria).igual('Lazer');
  });

  isso('move a regra na ordem de prioridade', () => {
    reiniciar();
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'AAA', categoria: 'Compras' });
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'BBB', categoria: 'Lazer' });
    const antes = obter().regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO);
    despachar(ACOES.MOVER_REGRA, { id: antes[1].id, direcao: -1 });
    const depois = obter().regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO);
    esperar(depois[0].termo).igual('BBB');
  });

  isso('nao move regra para fora do grupo de origem', () => {
    reiniciar();
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'AAA', categoria: 'Compras' });
    const minha = obter().regras.find((regra) => regra.origem === ORIGENS_REGRA.USUARIO);
    const antes = obter().regras.length;
    despachar(ACOES.MOVER_REGRA, { id: minha.id, direcao: 1 });
    esperar(obter().regras.length).igual(antes);
  });

  isso('alterna e limpa a selecao', () => {
    reiniciar();
    despachar(ACOES.ALTERNAR_SELECAO, 'x1');
    despachar(ACOES.ALTERNAR_SELECAO, 'x2');
    esperar(obter().selecao.length).igual(2);
    despachar(ACOES.ALTERNAR_SELECAO, 'x1');
    esperar(obter().selecao).igual(['x2']);
    despachar(ACOES.LIMPAR_SELECAO);
    esperar(obter().selecao.length).igual(0);
  });

  isso('seleciona de uma vez a lista inteira que recebeu', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_SELECAO, ['a', 'b', 'c']);
    esperar(obter().selecao).igual(['a', 'b', 'c']);
  });

  isso('selecionar tudo nao repete o que ja estava selecionado', () => {
    reiniciar();
    despachar(ACOES.ALTERNAR_SELECAO, 'a');
    despachar(ACOES.DEFINIR_SELECAO, ['a', 'b']);
    esperar(obter().selecao).igual(['a', 'b']);
  });

  isso('selecionar tudo com lista vazia desmarca todos', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_SELECAO, ['a', 'b']);
    despachar(ACOES.DEFINIR_SELECAO, []);
    esperar(obter().selecao.length).igual(0);
  });

  isso('depois de selecionar tudo, desmarcar um deixa a selecao parcial', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_SELECAO, ['a', 'b', 'c']);
    despachar(ACOES.ALTERNAR_SELECAO, 'b');
    esperar(obter().selecao).igual(['a', 'c']);
  });

  isso('troca a aba de regras', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_ABA_REGRAS, ABAS_REGRAS.SEMENTE);
    esperar(obter().abaRegras).igual(ABAS_REGRAS.SEMENTE);
  });

  isso('rejeita acao desconhecida', () => {
    reiniciar();
    esperar(() => despachar('acaoInventada')).lancaErro('Ação desconhecida');
  });

  isso('nao permite mutacao externa do estado', () => {
    reiniciar();
    const antes = obter();
    despachar(ACOES.TROCAR_TELA, TELAS.PAINEL);
    esperar(antes.tela).igual(TELAS.IMPORTAR);
  });
});
