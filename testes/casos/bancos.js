import { descrever, esperar, isso } from '../runner.js';
import { RESULTADOS, importarArquivos } from '../../js/importadores/importar.js';
import { assinaturaDe } from '../../js/importadores/tabela.js';
import { remover, salvar } from '../../js/importadores/mapeamentos.js';
import { analisar as analisarCsv } from '../../js/importadores/csv.js';
import { PERFIS_DE_BANCO, descreverPerfil, reconhecer } from '../../js/importadores/bancos/index.js';
import { mesclar } from '../../js/nucleo/deduplicar.js';
import { MOTIVOS_NAO_GASTO } from '../../js/nucleo/constantes.js';
import {
  CSV_NUBANK_CARTAO,
  CSV_NUBANK_CARTAO_COM_EXTRA,
  CSV_NUBANK_CONTA,
  CSV_PICPAY_CONTA,
  CSV_PONTO_VIRGULA,
  OFX_BB_CONTA,
  bytesDe
} from '../fixtures/extratos.js';
import { detectar, FORMATOS, detectarDelimitador } from '../../js/importadores/detector.js';
import { deCentavos } from '../../js/nucleo/dinheiro.js';

function arquivo(nome, conteudo) {
  return { nome, bytes: bytesDe(conteudo) };
}

function porDescricao(lancamentos, trecho) {
  return lancamentos.find((lancamento) => lancamento.descricaoOriginal.includes(trecho));
}

descrever('Reconhecimento de banco', () => {
  isso('cada perfil declara banco, conta e as colunas que precisa', () => {
    esperar(PERFIS_DE_BANCO.length > 0).verdadeiro();
    const completos = PERFIS_DE_BANCO.every(
      (perfil) =>
        Boolean(perfil.id && perfil.banco && perfil.conta) &&
        perfil.exige.length > 0 &&
        Boolean(perfil.colunas.data && perfil.colunas.descricao)
    );
    esperar(completos).verdadeiro();
  });

  isso('nenhum perfil repete identificador', () => {
    const ids = PERFIS_DE_BANCO.map((perfil) => perfil.id);
    esperar(new Set(ids).size).igual(ids.length);
  });

  isso('resolve as colunas pelo nome do cabecalho', () => {
    esperar(reconhecer(['date', 'title', 'amount']).colunas).igual({ data: 0, descricao: 1, valor: 2 });
  });

  isso('aceita coluna extra e cabecalho fora de ordem', () => {
    esperar(reconhecer(['date', 'category', 'title', 'amount']).colunas).igual({
      data: 0,
      descricao: 2,
      valor: 3
    });
  });

  isso('ignora acento e caixa ao comparar o cabecalho', () => {
    esperar(reconhecer(['DATA', 'VALOR', 'IDENTIFICADOR', 'DESCRICAO']).perfil).igual('nubank-conta-csv');
  });

  isso('nao reconhece cabecalho que nao tem todas as colunas exigidas', () => {
    esperar(reconhecer(['date', 'title'])).igual(null);
    esperar(reconhecer(['Data', 'Lançamento', 'Valor'])).igual(null);
  });

  isso('descreve o perfil para o relatorio de importacao', () => {
    esperar(descreverPerfil('nubank-cartao-csv')).igual('Nubank · Cartão de crédito');
    esperar(descreverPerfil('inexistente')).igual('');
  });
});

descrever('Importação por adaptador de banco', () => {
  isso('importa fatura do cartao sem pedir mapeamento', async () => {
    const relatorio = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
    esperar(relatorio.arquivos[0].perfil).igual('nubank-cartao-csv');
    esperar(relatorio.lancamentos.length).igual(3);
  });

  isso('marca banco e conta do perfil em cada lancamento', async () => {
    const relatorio = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);
    esperar(relatorio.lancamentos.every((lancamento) => lancamento.banco === 'Nubank')).verdadeiro();
    esperar(relatorio.lancamentos[0].conta).igual('Cartão de crédito');
  });

  isso('inverte o sinal da fatura, onde gasto vem positivo', async () => {
    const { lancamentos } = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);
    esperar(porDescricao(lancamentos, 'Uber').valor).igual(-2345);
    esperar(porDescricao(lancamentos, 'Pagamento recebido').valor).igual(15000);
  });

  isso('mantem o sinal do extrato de conta, onde gasto ja vem negativo', async () => {
    const { lancamentos } = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CONTA)]);
    esperar(porDescricao(lancamentos, 'JL ALIMENTOS').valor).igual(-4590);
    esperar(porDescricao(lancamentos, 'EMPRESA XYZ').valor).igual(350000);
  });

  isso('le data ISO da fatura e data brasileira da conta', async () => {
    const cartao = await importarArquivos([arquivo('cartao.csv', CSV_NUBANK_CARTAO)]);
    const conta = await importarArquivos([arquivo('conta.csv', CSV_NUBANK_CONTA)]);
    esperar(porDescricao(cartao.lancamentos, 'Uber').data).igual('2026-09-03');
    esperar(porDescricao(conta.lancamentos, 'JL ALIMENTOS').data).igual('2026-09-03');
  });

  isso('ignora a coluna que o perfil nao usa', async () => {
    const { lancamentos } = await importarArquivos([
      arquivo('nubank.csv', CSV_NUBANK_CARTAO_COM_EXTRA)
    ]);
    esperar(lancamentos.length).igual(1);
    esperar(lancamentos[0].descricaoOriginal).igual('Uber *trip');
    esperar(lancamentos[0].valor).igual(-2345);
  });

  isso('reconhece pagamento de fatura como fora do total', async () => {
    const { lancamentos } = await importarArquivos([arquivo('conta.csv', CSV_NUBANK_CONTA)]);
    esperar(porDescricao(lancamentos, 'Pagamento de fatura').naoGasto).igual(
      MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA
    );
  });

  isso('o mesmo arquivo importado duas vezes nao duplica nada', async () => {
    const primeira = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);
    const segunda = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);

    const inicial = mesclar([], primeira.lancamentos);
    const repetida = mesclar(inicial.inseridos, segunda.lancamentos);

    esperar(inicial.inseridos.length).igual(3);
    esperar(repetida.inseridos.length).igual(0);
    esperar(repetida.ignorados).igual(3);
  });

  isso('arquivo de banco sem perfil continua pedindo mapeamento', async () => {
    const relatorio = await importarArquivos([arquivo('outro.csv', CSV_PONTO_VIRGULA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.PRECISA_MAPEAMENTO);
  });

  isso('mapeamento salvo pelo usuario tem prioridade sobre o perfil do banco', async () => {
    const assinatura = assinaturaDe(analisarCsv(CSV_NUBANK_CARTAO).cabecalho);
    salvar(assinatura, { colunas: { data: 0, descricao: 1, valor: 2 }, banco: 'Meu banco' });

    try {
      const { lancamentos } = await importarArquivos([arquivo('nubank.csv', CSV_NUBANK_CARTAO)]);
      esperar(lancamentos[0].banco).igual('Meu banco');
      esperar(porDescricao(lancamentos, 'Uber').valor).igual(2345);
    } finally {
      remover(assinatura);
    }
  });
});

descrever('Extrato do PicPay em CSV', () => {
  isso('reconhece o arquivo como CSV mesmo com virgula decimal dentro de aspas', () => {
    const bytes = bytesDe(CSV_PICPAY_CONTA);
    esperar(detectar(bytes, CSV_PICPAY_CONTA)).igual(FORMATOS.CSV);
    esperar(detectarDelimitador(CSV_PICPAY_CONTA)).igual(',');
  });

  isso('o valor entre aspas continua uma celula so', () => {
    const tabela = analisarCsv(CSV_PICPAY_CONTA);
    esperar(tabela.cabecalho.length).igual(6);
    esperar(tabela.linhas[0].length).igual(6);
    esperar(tabela.linhas[0][4]).igual('−R$ 40,00');
  });

  isso('reconhece o perfil do extrato de conta', () => {
    const tabela = analisarCsv(CSV_PICPAY_CONTA);
    const mapeamento = reconhecer(tabela.cabecalho);
    esperar(mapeamento.banco).igual('PicPay');
    esperar(mapeamento.conta).igual('Conta');
  });

  isso('a descricao junta o tipo com a contraparte', async () => {
    const relatorio = await importarArquivos([arquivo('picpay.csv', CSV_PICPAY_CONTA)]);
    const lancamento = porDescricao(relatorio.lancamentos, 'PADARIA CENTRAL');
    esperar(lancamento.descricaoOriginal).igual('Pix recebido PADARIA CENTRAL LTDA');
  });

  isso('a forma de pagamento nao entra na descricao', async () => {
    const relatorio = await importarArquivos([arquivo('picpay.csv', CSV_PICPAY_CONTA)]);
    const comSaldo = relatorio.lancamentos.filter((item) => item.descricaoOriginal.includes('Com saldo'));
    esperar(comSaldo.length).igual(0);
  });

  isso('entende o menos Unicode e o mais que o PicPay imprime', async () => {
    const relatorio = await importarArquivos([arquivo('picpay.csv', CSV_PICPAY_CONTA)]);
    esperar(deCentavos(porDescricao(relatorio.lancamentos, 'MARIA SILVA').valor)).igual(-40);
    esperar(deCentavos(porDescricao(relatorio.lancamentos, 'PADARIA CENTRAL').valor)).igual(220);
  });

  isso('le o valor com separador de milhar', async () => {
    const relatorio = await importarArquivos([arquivo('picpay.csv', CSV_PICPAY_CONTA)]);
    esperar(deCentavos(porDescricao(relatorio.lancamentos, 'CONSTRUTORA').valor)).igual(-1320.88);
  });

  isso('importa todas as linhas, sem rejeitar nenhuma', async () => {
    const relatorio = await importarArquivos([arquivo('picpay.csv', CSV_PICPAY_CONTA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
    esperar(relatorio.lancamentos.length).igual(4);
    esperar(relatorio.arquivos[0].erros.length).igual(0);
  });
});

descrever('Extrato do Banco do Brasil em OFX', () => {
  isso('importa sem pedir mapeamento', async () => {
    const relatorio = await importarArquivos([arquivo('bb.ofx', OFX_BB_CONTA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
    esperar(relatorio.lancamentos.length).igual(2);
  });

  isso('junta o tipo da operacao com o historico, que vem em campos separados', async () => {
    const relatorio = await importarArquivos([arquivo('bb.ofx', OFX_BB_CONTA)]);
    const recebido = porDescricao(relatorio.lancamentos, 'COOPERATIVA EXEMPLO');
    esperar(recebido.descricaoOriginal.startsWith('Pix - Recebido')).verdadeiro();
    esperar(deCentavos(recebido.valor)).igual(3144.36);
  });

  isso('guarda o banco e a conta do cabecalho do arquivo', async () => {
    const relatorio = await importarArquivos([arquivo('bb.ofx', OFX_BB_CONTA)]);
    esperar(relatorio.lancamentos[0].banco).igual('Banco do Brasil');
    esperar(relatorio.lancamentos[0].conta).igual('1009671-X');
  });

  isso('o salario entra como entrada e a transferencia para voce mesmo nao', async () => {
    const identidade = { nomes: ['Maria Silva Souza'], documentos: [], contas: [] };
    const relatorio = await importarArquivos([arquivo('bb.ofx', OFX_BB_CONTA)], identidade);
    const recebido = porDescricao(relatorio.lancamentos, 'COOPERATIVA EXEMPLO');
    const enviado = porDescricao(relatorio.lancamentos, 'Maria Silva Souza');

    esperar(recebido.naoGasto).falso();
    esperar(enviado.naoGasto).igual(MOTIVOS_NAO_GASTO.CONTA_PROPRIA);
  });
});
