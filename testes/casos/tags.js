import { descrever, esperar, isso } from '../runner.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import { ACOES, COMPETENCIA, OPERADORES_REGRA, ORIGENS_REGRA } from '../../js/nucleo/constantes.js';
import { acrescentar, normalizarTag, remover, renomear, tagsDe } from '../../js/nucleo/tags.js';
import { aplicar, tagsDe as tagsEmUso } from '../../js/nucleo/filtrar.js';
import { montarAbas } from '../../js/exportacao/abas.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { importarArquivos } from '../../js/importadores/importar.js';
import { CSV_EXPORT_DO_SISTEMA, bytesDe } from '../fixtures/extratos.js';

function lancamentoDe(descricao, id) {
  return {
    ...preparar({
      data: '05/09/2026',
      valor: '-45,90',
      descricaoOriginal: descricao,
      banco: 'Banco Teste',
      arquivo: 'extrato.ofx'
    }),
    id
  };
}

function importar(lancamentos) {
  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos, arquivos: [] });
}

function porId(id) {
  return obter().lancamentos.find((lancamento) => lancamento.id === id);
}

descrever('Tags como dado', () => {
  isso('normaliza espacos e caixa', () => {
    esperar(normalizarTag('  Recorrente  ')).igual('recorrente');
    esperar(normalizarTag('viagem  longa')).igual('viagem longa');
  });

  isso('a mesma tag nao entra duas vezes', () => {
    esperar(acrescentar(['recorrente'], 'RECORRENTE')).igual(['recorrente']);
  });

  isso('tag vazia nao entra', () => {
    esperar(acrescentar(['recorrente'], '   ')).igual(['recorrente']);
  });

  isso('remove uma tag da lista', () => {
    esperar(remover(['recorrente', 'trabalho'], 'Recorrente')).igual(['trabalho']);
  });

  isso('renomeia sem duplicar', () => {
    esperar(renomear(['recorrente', 'trabalho'], 'recorrente', 'fixo')).igual(['fixo', 'trabalho']);
  });

  isso('as tags do lancamento sao a uniao do que a regra pos e do que voce pos', () => {
    const lancamento = { tags: ['assinatura'], tagsManuais: ['recorrente'] };
    esperar(tagsDe(lancamento)).igual(['assinatura', 'recorrente']);
  });

  isso('tag repetida entre regra e sua aparece uma vez so', () => {
    const lancamento = { tags: ['recorrente'], tagsManuais: ['Recorrente'] };
    esperar(tagsDe(lancamento)).igual(['recorrente']);
  });

  isso('lancamento sem tag nenhuma devolve lista vazia', () => {
    esperar(tagsDe({})).igual([]);
  });
});

descrever('Tags no estado da aplicação', () => {
  isso('acrescentar tag guarda no lancamento e no catalogo', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'p1')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['p1'], tag: 'Recorrente' });

    esperar(tagsDe(porId('p1'))).igual(['recorrente']);
    esperar(obter().tags).igual(['recorrente']);
  });

  isso('a mesma tag duas vezes no mesmo lancamento continua uma', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'p2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['p2'], tag: 'recorrente' });
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['p2'], tag: ' RECORRENTE ' });

    esperar(tagsDe(porId('p2'))).igual(['recorrente']);
  });

  isso('tag em lote marca todos os selecionados', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'l1'), lancamentoDe('MERCADO DO ZE', 'l2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['l1', 'l2'], tag: 'mercado do mes' });

    esperar(tagsDe(porId('l1'))).igual(['mercado do mes']);
    esperar(tagsDe(porId('l2'))).igual(['mercado do mes']);
  });

  isso('remover tag de quem nao tem nao quebra nem muda os outros', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'r1'), lancamentoDe('MERCADO DO ZE', 'r2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['r1'], tag: 'recorrente' });
    despachar(ACOES.REMOVER_TAG, { ids: ['r1', 'r2'], tag: 'recorrente' });

    esperar(tagsDe(porId('r1'))).igual([]);
    esperar(tagsDe(porId('r2'))).igual([]);
  });

  isso('tirar a tag do lancamento nao tira do catalogo', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'c1')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['c1'], tag: 'recorrente' });
    despachar(ACOES.REMOVER_TAG, { ids: ['c1'], tag: 'recorrente' });

    esperar(obter().tags).igual(['recorrente']);
  });

  isso('tag criada no catalogo nao precisa de lancamento', () => {
    reiniciar();
    despachar(ACOES.CRIAR_TAG, 'viagem');
    esperar(obter().tags).igual(['viagem']);
  });

  isso('sua tag sobrevive a reclassificacao por regra', () => {
    reiniciar();
    importar([lancamentoDe('NETFLIX.COM', 'n1')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['n1'], tag: 'da familia' });
    despachar(ACOES.CRIAR_REGRA, {
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'NETFLIX',
      categoria: 'Assinaturas',
      tags: ['assinatura']
    });

    esperar(tagsDe(porId('n1'))).igual(['assinatura', 'da familia']);
  });

  isso('trocar a regra troca so a tag da regra', () => {
    reiniciar();
    importar([lancamentoDe('NETFLIX.COM', 'n2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['n2'], tag: 'da familia' });
    despachar(ACOES.CRIAR_REGRA, {
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'NETFLIX',
      categoria: 'Assinaturas',
      tags: ['assinatura']
    });
    const minhaRegra = obter().regras.find((item) => item.origem === ORIGENS_REGRA.USUARIO);
    despachar(ACOES.REMOVER_REGRA, minhaRegra.id);

    esperar(tagsDe(porId('n2'))).igual(['da familia', 'recorrente']);
  });

  isso('renomear tag muda no lancamento e no catalogo', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'q1')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['q1'], tag: 'recorrente' });
    despachar(ACOES.RENOMEAR_TAG, { de: 'recorrente', para: 'fixo' });

    esperar(tagsDe(porId('q1'))).igual(['fixo']);
    esperar(obter().tags).igual(['fixo']);
  });

  isso('remover do catalogo tira a tag de todos os lancamentos', () => {
    reiniciar();
    importar([lancamentoDe('PADARIA CENTRAL', 'z1'), lancamentoDe('MERCADO DO ZE', 'z2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['z1', 'z2'], tag: 'recorrente' });
    despachar(ACOES.REMOVER_TAG_DO_CATALOGO, 'recorrente');

    esperar(obter().tags).igual([]);
    esperar(tagsDe(porId('z1'))).igual([]);
    esperar(tagsDe(porId('z2'))).igual([]);
  });

  isso('o catalogo volta do cofre', () => {
    reiniciar();
    despachar(ACOES.CARREGAR_DADOS, { lancamentos: [], regras: [], tags: ['viagem', 'trabalho'] });
    esperar(obter().tags).igual(['viagem', 'trabalho']);
  });

  isso('filtrar por tag encontra tanto a sua quanto a da regra', () => {
    reiniciar();
    importar([lancamentoDe('NETFLIX.COM', 'f1'), lancamentoDe('PADARIA CENTRAL', 'f2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['f2'], tag: 'manha' });

    const estado = obter();
    const porTagSua = aplicar(estado.lancamentos, { ...estado.filtros, tag: 'manha' }, COMPETENCIA.COMPRA);
    esperar(porTagSua.length).igual(1);
    esperar(porTagSua[0].id).igual('f2');
  });

  isso('a lista de tags em uso traz as duas origens', () => {
    reiniciar();
    importar([lancamentoDe('SMART FIT BRASILIA', 'u1'), lancamentoDe('PADARIA CENTRAL', 'u2')]);
    despachar(ACOES.ACRESCENTAR_TAG, { ids: ['u2'], tag: 'manha' });

    esperar(tagsEmUso(obter().lancamentos).includes('manha')).verdadeiro();
  });
});

descrever('Tags no export e na volta', () => {
  isso('o export traz as duas origens, sem repetir', () => {
    const lancamento = {
      ...lancamentoDe('NETFLIX.COM', 'e1'),
      tags: ['assinatura'],
      tagsManuais: ['da familia', 'assinatura']
    };
    const [cabecalho, linha] = montarAbas([lancamento], [], COMPETENCIA.COMPRA)[0].linhas;

    esperar(linha[cabecalho.indexOf('Tags')]).igual('assinatura, da familia');
  });

  isso('a planilha exportada traz as tags de volta como suas', async () => {
    const relatorio = await importarArquivos([
      { nome: 'gastos.csv', bytes: bytesDe(CSV_EXPORT_DO_SISTEMA_COM_TAGS) }
    ]);
    const alvo = relatorio.lancamentos.find((item) => item.descricaoOriginal.includes('SMART FIT'));

    esperar(alvo.tagsManuais).igual(['recorrente', 'saude']);
  });

  isso('tag que volta da planilha entra no catalogo', () => {
    reiniciar();
    importar([{ ...lancamentoDe('SMART FIT BRASILIA', 'v1'), tagsManuais: ['recorrente'] }]);
    esperar(obter().tags).igual(['recorrente']);
  });
});

const CSV_EXPORT_DO_SISTEMA_COM_TAGS = `Data;Competência;Descrição;Estabelecimento;Categoria;Tags;Banco;Método;Parcela;Valor;Conta no total;Motivo fora do total
2026-09-15;2026-09-15;SMART FIT BRASILIA;SMART FIT;Academia;recorrente, saude;Banco Teste;Outros;;-189,90;sim;`;
