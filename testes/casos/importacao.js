import { descrever, esperar, isso } from '../runner.js';
import { RESULTADOS, importarArquivos } from '../../js/importadores/importar.js';
import { assinaturaDe, aplicarMapeamento } from '../../js/importadores/tabela.js';
import { remover, salvar } from '../../js/importadores/mapeamentos.js';
import { analisar as analisarCsv } from '../../js/importadores/csv.js';
import { METODOS } from '../../js/nucleo/constantes.js';
import {
  CSV_CP1252,
  CSV_DEBITO_CREDITO,
  CSV_PONTO_VIRGULA,
  CSV_SEM_ESTRUTURA,
  MAPEAMENTO_DEBITO_CREDITO,
  MAPEAMENTO_PONTO_VIRGULA,
  OFX_CARTAO,
  OFX_CONTA,
  OFX_TAG_ABERTA,
  PDF_FATURA,
  bytesDe
} from '../fixtures/extratos.js';

function arquivo(nome, conteudo) {
  const bytes = conteudo instanceof Uint8Array ? conteudo : bytesDe(conteudo);
  return { nome, bytes };
}

function comMapeamento(texto, mapeamento, executar) {
  const assinatura = assinaturaDe(analisarCsv(texto).cabecalho);
  salvar(assinatura, mapeamento);
  return Promise.resolve(executar()).finally(() => remover(assinatura));
}

descrever('Importação de extratos', () => {
  isso('importa os tres lancamentos de um OFX de conta corrente', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_CONTA)]);
    esperar(relatorio.lancamentos.length).igual(3);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
  });

  isso('preserva banco, conta, data e sinal do valor no OFX', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_CONTA)]);
    const primeiro = relatorio.lancamentos[0];
    esperar(primeiro.banco).igual('Banco Teste');
    esperar(primeiro.conta).igual('12345-6');
    esperar(primeiro.data).igual('2026-09-03');
    esperar(primeiro.valor).igual(-4590);
  });

  isso('reconhece entrada positiva no OFX', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_CONTA)]);
    const salario = relatorio.lancamentos.find((item) => item.descricaoOriginal.includes('SALARIO'));
    esperar(salario.valor).igual(350000);
  });

  isso('marca lancamentos de OFX de cartao como cartao de credito', async () => {
    const relatorio = await importarArquivos([arquivo('fatura.ofx', OFX_CARTAO)]);
    esperar(relatorio.lancamentos[0].metodo).igual(METODOS.CARTAO_CREDITO);
    esperar(relatorio.lancamentos[0].valor).igual(-19990);
  });

  isso('importa OFX com tag de transacao nao fechada', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_TAG_ABERTA)]);
    esperar(relatorio.lancamentos.length).igual(2);
  });

  isso('preserva a descricao original exatamente como veio do arquivo', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.ofx', OFX_CONTA)]);
    esperar(relatorio.lancamentos[0].descricaoOriginal).igual('PAGBANK*JL ALIMENTOS');
  });

  isso('detecta OFX pelo conteudo mesmo com extensao txt', async () => {
    const relatorio = await importarArquivos([arquivo('extrato.txt', OFX_CONTA)]);
    esperar(relatorio.arquivos[0].formato).igual('ofx');
    esperar(relatorio.lancamentos.length).igual(3);
  });

  isso('pede mapeamento para CSV de layout desconhecido', async () => {
    const relatorio = await importarArquivos([arquivo('banco.csv', CSV_PONTO_VIRGULA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.PRECISA_MAPEAMENTO);
    esperar(relatorio.lancamentos.length).igual(0);
  });

  isso('importa CSV direto quando o mapeamento ja esta salvo', async () => {
    await comMapeamento(CSV_PONTO_VIRGULA, MAPEAMENTO_PONTO_VIRGULA, async () => {
      const relatorio = await importarArquivos([arquivo('banco.csv', CSV_PONTO_VIRGULA)]);
      esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.IMPORTADO);
      esperar(relatorio.lancamentos.length).igual(3);
      esperar(relatorio.lancamentos[0].valor).igual(-2345);
      esperar(relatorio.lancamentos[2].valor).igual(350000);
    });
  });

  isso('interpreta colunas separadas de debito e credito', async () => {
    await comMapeamento(CSV_DEBITO_CREDITO, MAPEAMENTO_DEBITO_CREDITO, async () => {
      const relatorio = await importarArquivos([arquivo('banco.csv', CSV_DEBITO_CREDITO)]);
      esperar(relatorio.lancamentos[0].valor).igual(-5890);
      esperar(relatorio.lancamentos[1].valor).igual(12000);
    });
  });

  isso('decodifica acentuacao de arquivo em windows-1252', async () => {
    await comMapeamento('Data;Historico;Valor', MAPEAMENTO_PONTO_VIRGULA, async () => {
      const relatorio = await importarArquivos([arquivo('banco.csv', CSV_CP1252)]);
      esperar(relatorio.lancamentos[0].descricaoOriginal).igual('PADARIA SÃO JOÃO');
    });
  });

  isso('PDF que nao pode ser lido falha com mensagem, sem derrubar a importacao', async () => {
    const relatorio = await importarArquivos([
      arquivo('fatura.pdf', PDF_FATURA),
      arquivo('extrato.ofx', OFX_CONTA)
    ]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.FALHOU);
    esperar(relatorio.arquivos[0].mensagem.length > 0).verdadeiro();
    esperar(relatorio.arquivos[1].resultado).igual(RESULTADOS.IMPORTADO);
    esperar(relatorio.lancamentos.length).igual(3);
  });

  isso('recusa arquivo sem formato reconhecido', async () => {
    const relatorio = await importarArquivos([arquivo('qualquer.txt', CSV_SEM_ESTRUTURA)]);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.FALHOU);
  });

  isso('importa o arquivo valido mesmo quando outro do lote falha', async () => {
    const relatorio = await importarArquivos([
      arquivo('quebrado.txt', CSV_SEM_ESTRUTURA),
      arquivo('extrato.ofx', OFX_CONTA)
    ]);
    esperar(relatorio.lancamentos.length).igual(3);
    esperar(relatorio.arquivos[0].resultado).igual(RESULTADOS.FALHOU);
    esperar(relatorio.arquivos[1].resultado).igual(RESULTADOS.IMPORTADO);
  });

  isso('rejeita linha com data invalida sem derrubar o arquivo', async () => {
    const texto = 'Data;Historico;Valor\n32/13/2026;LINHA RUIM;-10,00\n05/09/2026;LINHA BOA;-20,00';
    await comMapeamento(texto, MAPEAMENTO_PONTO_VIRGULA, async () => {
      const relatorio = await importarArquivos([arquivo('banco.csv', texto)]);
      esperar(relatorio.lancamentos.length).igual(1);
      esperar(relatorio.arquivos[0].erros.length).igual(1);
      esperar(relatorio.arquivos[0].erros[0]).contem('Data inválida');
    });
  });

  isso('produz o mesmo lancamento para tabela de CSV e de planilha', () => {
    const tabelaCsv = analisarCsv(CSV_PONTO_VIRGULA);
    const tabelaPlanilha = {
      cabecalho: tabelaCsv.cabecalho,
      linhas: tabelaCsv.linhas.map((linha) => [...linha])
    };

    const deCsv = aplicarMapeamento(tabelaCsv, MAPEAMENTO_PONTO_VIRGULA, { arquivo: 'x' });
    const dePlanilha = aplicarMapeamento(tabelaPlanilha, MAPEAMENTO_PONTO_VIRGULA, { arquivo: 'x' });

    esperar(deCsv).igual(dePlanilha);
  });

  isso('gera a mesma assinatura para o mesmo cabecalho com acento e caixa diferentes', () => {
    esperar(assinaturaDe(['Data', 'Lançamento', 'Valor'])).igual(assinaturaDe(['DATA', 'lancamento', 'valor']));
  });
});
