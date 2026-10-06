import { descrever, esperar, isso } from '../runner.js';
import { ORIGENS_PERIODO, periodoDoNome, unirPeriodos } from '../../js/importadores/periodo.js';
import { RESULTADOS, importarArquivos } from '../../js/importadores/importar.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import { ACOES, COMPETENCIA, MOTIVOS_NAO_GASTO } from '../../js/nucleo/constantes.js';
import { mesclar } from '../../js/nucleo/deduplicar.js';
import { estaForaDoTotal, motivoForaDoTotal } from '../../js/nucleo/naoGasto.js';
import { descreverPerfil } from '../../js/importadores/bancos/index.js';
import { assinaturaDe } from '../../js/importadores/tabela.js';
import { analisar as analisarCsv } from '../../js/importadores/csv.js';
import { remover, salvar } from '../../js/importadores/mapeamentos.js';
import { formatarPeriodo } from '../../js/ui/formato.js';
import { preparar } from '../../js/nucleo/preparar.js';
import {
  CSV_EXPORT_DO_SISTEMA,
  CSV_NUBANK_CONTA,
  CSV_PONTO_VIRGULA,
  OFX_CONTA,
  OFX_NUBANK_CONTA,
  OFX_SEM_PERIODO,
  bytesDe
} from '../fixtures/extratos.js';

function arquivo(nome, conteudo) {
  return { nome, bytes: bytesDe(conteudo) };
}

function porDescricao(lancamentos, trecho) {
  return lancamentos.find((lancamento) => lancamento.descricaoOriginal.includes(trecho));
}

function lancamentoDe(descricao, data, valor) {
  return preparar({ data, valor, descricaoOriginal: descricao, banco: 'Banco Teste', arquivo: 'teste.ofx' });
}

descrever('Período do arquivo importado', () => {
  isso('le o periodo declarado no OFX', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_NUBANK_CONTA)]);
    esperar(relatorio.arquivos[0].periodo.inicio).igual('2026-09-01');
    esperar(relatorio.arquivos[0].periodo.fim).igual('2026-09-30');
    esperar(relatorio.arquivos[0].periodo.origem).igual(ORIGENS_PERIODO.CONTEUDO);
  });

  isso('sem periodo declarado, usa as datas dos lancamentos', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_SEM_PERIODO)]);
    esperar(relatorio.arquivos[0].periodo.inicio).igual('2026-07-05');
    esperar(relatorio.arquivos[0].periodo.fim).igual('2026-07-18');
    esperar(relatorio.arquivos[0].periodo.origem).igual(ORIGENS_PERIODO.CONTEUDO);
  });

  isso('le o periodo do nome quando o conteudo nao responde', () => {
    const periodo = periodoDoNome('NU_806631482_01SET2026_30SET2026.ofx');
    esperar(periodo.inicio).igual('2026-09-01');
    esperar(periodo.fim).igual('2026-09-30');
    esperar(periodo.origem).igual(ORIGENS_PERIODO.NOME);
  });

  isso('entende ano-mes no nome', () => {
    esperar(periodoDoNome('extrato-2026-09.csv').inicio).igual('2026-09-01');
    esperar(periodoDoNome('extrato-2026-09.csv').fim).igual('2026-09-30');
  });

  isso('entende mes e ano colados no nome', () => {
    esperar(periodoDoNome('Extrato conta corrente - 092026.ofx').inicio).igual('2026-09-01');
  });

  isso('entende mes por extenso no nome', () => {
    esperar(periodoDoNome('extrato-setembro-2026.csv').inicio).igual('2026-09-01');
  });

  isso('entende duas datas completas no nome', () => {
    const periodo = periodoDoNome('extrato-2026-09-01-2026-09-30.csv');
    esperar(periodo.inicio).igual('2026-09-01');
    esperar(periodo.fim).igual('2026-09-30');
  });

  isso('nome sem padrao nenhum nao inventa periodo', () => {
    esperar(periodoDoNome('extrato.csv')).igual(null);
  });

  isso('numero longo no nome nao vira periodo', () => {
    esperar(periodoDoNome('NU_806631482.ofx')).igual(null);
  });

  isso('mes invalido no nome nao vira periodo', () => {
    esperar(periodoDoNome('arquivo-132026.csv')).igual(null);
  });

  isso('une periodos de arquivos diferentes', () => {
    const unido = unirPeriodos([
      { inicio: '2026-08-01', fim: '2026-08-31', origem: ORIGENS_PERIODO.CONTEUDO },
      { inicio: '2026-09-01', fim: '2026-09-30', origem: ORIGENS_PERIODO.CONTEUDO }
    ]);
    esperar(unido.inicio).igual('2026-08-01');
    esperar(unido.fim).igual('2026-09-30');
  });

  isso('periodo suposto contamina a uniao, para nao prometer certeza', () => {
    const unido = unirPeriodos([
      { inicio: '2026-08-01', fim: '2026-08-31', origem: ORIGENS_PERIODO.CONTEUDO },
      { inicio: '2026-09-01', fim: '2026-09-30', origem: ORIGENS_PERIODO.NOME }
    ]);
    esperar(unido.origem).igual(ORIGENS_PERIODO.NOME);
  });

  isso('o periodo nao muda a data de nenhum lancamento', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_NUBANK_CONTA)]);
    const datas = relatorio.lancamentos.map((lancamento) => lancamento.data).sort();
    esperar(datas).igual(['2026-09-03', '2026-09-10', '2026-09-29']);
  });

  isso('mes inteiro aparece pelo nome do mes, e recorte parcial pelas datas', () => {
    esperar(formatarPeriodo({ inicio: '2026-09-01', fim: '2026-09-30' })).igual('Setembro de 2026');
    esperar(formatarPeriodo({ inicio: '2026-08-10', fim: '2026-09-30' })).igual('10/08/2026 a 30/09/2026');
  });
});

descrever('Mês que a tela mostra depois de importar', () => {
  isso('vai para o mes do que acabou de entrar, mesmo com outro mes escolhido', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_FILTROS, { mes: '2026-10' });
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamentoDe('PADARIA', '05/09/2026', '-10,00')],
      arquivos: []
    });
    esperar(obter().filtros.mes).igual('2026-09');
  });

  isso('com dois meses no mesmo lote, fica no mais recente', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [
        lancamentoDe('PADARIA', '05/08/2026', '-10,00'),
        lancamentoDe('MERCADO', '05/09/2026', '-20,00')
      ],
      arquivos: []
    });
    esperar(obter().filtros.mes).igual('2026-09');
  });

  isso('importacao sem lancamento novo nao mexe no mes escolhido', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamentoDe('PADARIA', '05/09/2026', '-10,00')],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FILTROS, { mes: '2026-08' });
    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: [], arquivos: [] });
    esperar(obter().filtros.mes).igual('2026-08');
  });

  isso('com competencia de fatura, usa o mes da fatura', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_COMPETENCIA, COMPETENCIA.FATURA);
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [
        {
          ...lancamentoDe('COMPRA PARCELADA', '28/08/2026', '-90,00'),
          dataFatura: '2026-09-10'
        }
      ],
      arquivos: []
    });
    esperar(obter().filtros.mes).igual('2026-09');
  });
});

descrever('Integridade entre arquivos', () => {
  isso('o mesmo mes em OFX e em CSV do mesmo banco nao duplica', async () => {
    const porOfx = await importarArquivos([arquivo('conta.ofx', OFX_NUBANK_CONTA)]);
    const porCsv = await importarArquivos([arquivo('conta.csv', CSV_NUBANK_CONTA)]);

    const primeiro = mesclar([], porOfx.lancamentos);
    const segundo = mesclar(primeiro.inseridos, porCsv.lancamentos);

    esperar(primeiro.inseridos.length).igual(3);
    esperar(segundo.inseridos.length).igual(0);
    esperar(segundo.ignorados).igual(3);
  });

  isso('o identificador do banco decide, mesmo com a descricao diferente', () => {
    const guardado = { ...lancamentoDe('Compra no débito - JL ALIMENTOS', '03/09/2026', '-45,90'), identificadorBanco: 'abc12345678' };
    const chegando = { ...lancamentoDe('COMPRA DEBITO JL ALIMENTOS LTDA', '03/09/2026', '-45,90'), identificadorBanco: 'abc12345678' };

    esperar(mesclar([guardado], [chegando]).ignorados).igual(1);
  });

  isso('sem identificador, a comparacao por texto continua valendo', () => {
    const guardado = lancamentoDe('PADARIA CENTRAL', '03/09/2026', '-10,00');
    const chegando = lancamentoDe('PADARIA CENTRAL', '03/09/2026', '-10,00');

    esperar(mesclar([guardado], [chegando]).ignorados).igual(1);
  });

  isso('lancamento guardado antes do identificador existir nao duplica', () => {
    const antigo = lancamentoDe('Compra no débito - JL ALIMENTOS', '03/09/2026', '-45,90');
    const novo = { ...antigo, identificadorBanco: '6a1b2c3d-0001' };

    esperar(mesclar([antigo], [novo]).ignorados).igual(1);
  });

  isso('meses diferentes com mesma descricao e valor nao se confundem', () => {
    const agosto = lancamentoDe('ALUGUEL', '05/08/2026', '-1450,00');
    const setembro = lancamentoDe('ALUGUEL', '05/09/2026', '-1450,00');

    esperar(mesclar([agosto], [setembro]).inseridos.length).igual(1);
  });

  isso('dois lancamentos iguais no mesmo dia continuam sendo dois', () => {
    const um = lancamentoDe('CAFE', '05/09/2026', '-7,00');
    const outro = lancamentoDe('CAFE', '05/09/2026', '-7,00');

    esperar(mesclar([], [um, outro]).inseridos.length).igual(2);
  });
});

descrever('Planilha do próprio sistema reimportada', () => {
  isso('entra sem mapeamento manual', async () => {
    const relatorio = await importarArquivos([arquivo('gastos-2026-09.csv', CSV_EXPORT_DO_SISTEMA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
    esperar(relatorio.lancamentos.length).igual(4);
    esperar(descreverPerfil(relatorio.arquivos[0].perfil)).contem('Gastos Controller');
  });

  isso('traz a categoria de volta, e como decisao sua', async () => {
    const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
    const mercado = porDescricao(relatorio.lancamentos, 'COMPRA DEBITO MERCADO');

    esperar(mercado.categoria).igual('Mercado');
    esperar(mercado.revisadoManual).verdadeiro();
  });

  isso('o que estava sem categoria volta sem categoria, e livre para a regra', async () => {
    const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
    const aplicacao = porDescricao(relatorio.lancamentos, 'APLICACAO AUTOMATICA');

    esperar(aplicacao.categoria).igual('Não categorizado');
    esperar(aplicacao.revisadoManual).falso();
  });

  isso('traz de volta o que voce tirou do total a mao', async () => {
    const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
    const presente = porDescricao(relatorio.lancamentos, 'PRESENTE PARA MINHA MAE');

    esperar(estaForaDoTotal(presente)).verdadeiro();
    esperar(motivoForaDoTotal(presente)).igual(MOTIVOS_NAO_GASTO.MANUAL);
  });

  isso('o que saiu do total por deducao volta a ser deduzido, nao vira decisao sua', async () => {
    const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
    const aplicacao = porDescricao(relatorio.lancamentos, 'APLICACAO AUTOMATICA');

    esperar(aplicacao.foraDoTotalManual).igual(null);
    esperar(motivoForaDoTotal(aplicacao)).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('cada linha guarda o banco que estava na planilha', async () => {
    const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
    esperar(relatorio.lancamentos.every((lancamento) => lancamento.banco === 'Banco Teste')).verdadeiro();
  });

  isso('o perfil do sistema vence um mapeamento manual antigo da mesma planilha', async () => {
    const assinatura = assinaturaDe(analisarCsv(CSV_EXPORT_DO_SISTEMA).cabecalho);
    salvar(assinatura, { banco: 'mapeado a mao', colunas: { data: 0, descricao: 2, valor: 9 } });

    try {
      const relatorio = await importarArquivos([arquivo('gastos.csv', CSV_EXPORT_DO_SISTEMA)]);
      const mercado = porDescricao(relatorio.lancamentos, 'COMPRA DEBITO MERCADO');

      esperar(mercado.banco).igual('Banco Teste');
      esperar(mercado.categoria).igual('Mercado');
    } finally {
      remover(assinatura);
    }
  });

  isso('arquivo que o sistema nao conhece continua usando o mapeamento salvo', async () => {
    const assinatura = assinaturaDe(analisarCsv(CSV_PONTO_VIRGULA).cabecalho);
    salvar(assinatura, { banco: 'Banco Mapeado', colunas: { data: 0, descricao: 1, valor: 2 } });

    try {
      const relatorio = await importarArquivos([arquivo('outro.csv', CSV_PONTO_VIRGULA)]);
      esperar(relatorio.lancamentos[0].banco).igual('Banco Mapeado');
    } finally {
      remover(assinatura);
    }
  });

  isso('o extrato comum nao e confundido com a planilha do sistema', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_CONTA)]);
    esperar(relatorio.arquivos[0].perfil ?? '').diferenteDe('gastos-controller-planilha');
  });
});
