import { descrever, esperar, isso } from '../runner.js';
import { descobrirColunas, daColuna } from '../../js/importadores/extratos/colunas.js';
import { MOTIVOS_PENDENCIA_EXTRATO, lerExtratoPicpay } from '../../js/importadores/extratos/picpay.js';
import { paraCentavos } from '../../js/nucleo/dinheiro.js';
import { motivoDe } from '../../js/nucleo/naoGasto.js';
import { avaliar, criarRegra } from '../../js/nucleo/regras.js';
import { MOTIVOS_NAO_GASTO, OPERADORES_REGRA } from '../../js/nucleo/constantes.js';

const COLUNAS = ['Hora', 'Tipo', 'Origem / Destino', 'Forma de pagamento', 'Valor'];

const X = Object.freeze({ HORA: 44, TIPO: 121, ORIGEM: 243, FORMA: 351, VALOR: 512 });
const ALTURA_DA_LINHA = 36;

function item(texto, esquerda, base, largura = 40) {
  return { str: texto, width: largura, transform: [1, 0, 0, 1, esquerda, base] };
}

function cabecalho(base) {
  return [
    item('Hora', X.HORA, base),
    item('Tipo', X.TIPO, base),
    item('Origem / Destino', X.ORIGEM, base),
    item('Forma de pagamento', X.FORMA, base),
    item('Valor', 529.9, base)
  ];
}

function pagina(itens) {
  return [{ numero: 1, itens }];
}

function lancamentoSimples() {
  return [
    ...cabecalho(580),
    item('30 de setembro 2026', X.HORA, 615),
    item('16:18', X.HORA, 547),
    item('Pix enviado', X.TIPO, 547),
    item("MCDONALD'S", X.ORIGEM, 547),
    item('Com saldo', X.FORMA, 547),
    item('−R$ 19,90', X.VALOR, 547)
  ];
}

descrever('Colunas de um extrato tabular', () => {
  isso('descobre as colunas a partir da linha de cabecalho', () => {
    const colunas = descobrirColunas(
      cabecalho(580).map((bruto) => ({
        texto: bruto.str,
        esquerda: bruto.transform[4],
        direita: bruto.transform[4] + bruto.width,
        base: bruto.transform[5]
      })),
      COLUNAS
    );
    esperar(colunas.map((coluna) => coluna.nome)).igual(COLUNAS);
  });

  isso('sem cabecalho reconhecivel, nao inventa colunas', () => {
    esperar(descobrirColunas([{ texto: 'qualquer', esquerda: 10, direita: 50, base: 100 }], COLUNAS)).igual(null);
  });

  isso('o valor alinhado a direita cai na coluna Valor, nao na anterior', () => {
    const colunas = descobrirColunas(
      cabecalho(580).map((bruto) => ({
        texto: bruto.str,
        esquerda: bruto.transform[4],
        direita: bruto.transform[4] + bruto.width,
        base: bruto.transform[5]
      })),
      COLUNAS
    );
    const valor = { texto: '−R$ 19,90', esquerda: X.VALOR, direita: X.VALOR + 37, base: 547 };
    esperar(daColuna(colunas, 'Valor', [valor]).length).igual(1);
    esperar(daColuna(colunas, 'Forma de pagamento', [valor]).length).igual(0);
  });
});

descrever('Lançamentos de um extrato de conta', () => {
  isso('le um lancamento simples com data do dia, tipo, contraparte e valor', () => {
    const { lancamentos, pendencias } = lerExtratoPicpay(pagina(lancamentoSimples()));
    esperar(pendencias.length).igual(0);
    esperar(lancamentos.length).igual(1);
    esperar(lancamentos[0].data).igual('2026-09-30');
    esperar(lancamentos[0].descricaoOriginal).igual("Pix enviado MCDONALD'S");
    esperar(lancamentos[0].valor).igual(-19.9);
  });

  isso('preserva o sinal negativo do extrato, sem inverter como faria numa fatura', () => {
    const { lancamentos } = lerExtratoPicpay(pagina(lancamentoSimples()));
    esperar(lancamentos[0].valor < 0).verdadeiro();
  });

  isso('junta o nome da contraparte quebrado em varias linhas', () => {
    const itens = [
      ...cabecalho(580),
      item('30 de setembro 2026', X.HORA, 615),
      item('14:58', X.HORA, 547),
      item('Pix recebido', X.TIPO, 547),
      item('Robinson de Freitas', X.ORIGEM, 551),
      item('Fernandes', X.ORIGEM, 542),
      item('+R$ 50,00', X.VALOR, 547)
    ];
    const { lancamentos } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos[0].descricaoOriginal).igual('Pix recebido Robinson de Freitas Fernandes');
    esperar(lancamentos[0].valor).igual(50);
  });

  isso('nao leva a contraparte de um lancamento para o lancamento vizinho', () => {
    const itens = [
      ...cabecalho(580),
      item('30 de setembro 2026', X.HORA, 615),
      item('15:00', X.HORA, 547),
      item('Pix recebido', X.TIPO, 547),
      item('TOPOCART TOPOGRAFIA', X.ORIGEM, 551),
      item('ENGENHARIA', X.ORIGEM, 542),
      item('+R$ 1.621,41', X.VALOR, 547),
      item('13:59', X.HORA, 547 - ALTURA_DA_LINHA),
      item('Pix enviado', X.TIPO, 547 - ALTURA_DA_LINHA),
      item('IFOOD.COM AGENCIA', X.ORIGEM, 547 - ALTURA_DA_LINHA + 4),
      item('DE RESTAURANTES', X.ORIGEM, 547 - ALTURA_DA_LINHA - 5),
      item('−R$ 11,98', X.VALOR, 547 - ALTURA_DA_LINHA)
    ];
    const { lancamentos } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos.length).igual(2);
    esperar(lancamentos[0].descricaoOriginal).igual('Pix recebido TOPOCART TOPOGRAFIA ENGENHARIA');
    esperar(lancamentos[1].descricaoOriginal).igual('Pix enviado IFOOD.COM AGENCIA DE RESTAURANTES');
  });

  isso('nao deixa o saldo do cabecalho do dia virar o valor do lancamento', () => {
    const itens = [
      ...cabecalho(580),
      item('30 de setembro 2026', X.HORA, 615),
      item('Saldo ao final do dia:', 438, 615),
      item('R$ 63,84', 515, 615),
      item('16:18', X.HORA, 547),
      item('Pix enviado', X.TIPO, 547),
      item("MCDONALD'S", X.ORIGEM, 547),
      item('−R$ 19,90', X.VALOR, 547)
    ];
    const { lancamentos } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos.length).igual(1);
    esperar(lancamentos[0].valor).igual(-19.9);
  });

  isso('cada lancamento herda o dia do cabecalho acima dele', () => {
    const itens = [
      ...cabecalho(580),
      item('30 de setembro 2026', X.HORA, 615),
      item('16:18', X.HORA, 547),
      item('Pix enviado', X.TIPO, 547),
      item('LOJA A', X.ORIGEM, 547),
      item('−R$ 10,00', X.VALOR, 547),
      item('29 de setembro 2026', X.HORA, 500),
      item('21:53', X.HORA, 460),
      item('Pix enviado', X.TIPO, 460),
      item('LOJA B', X.ORIGEM, 460),
      item('−R$ 20,00', X.VALOR, 460)
    ];
    const { lancamentos } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos.map((lancamento) => lancamento.data)).igual(['2026-09-30', '2026-09-29']);
  });

  isso('lancamento sem data de dia acima vira pendencia', () => {
    const itens = [
      ...cabecalho(580),
      item('16:18', X.HORA, 547),
      item('Pix enviado', X.TIPO, 547),
      item('LOJA A', X.ORIGEM, 547),
      item('−R$ 10,00', X.VALOR, 547)
    ];
    const { lancamentos, pendencias } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos.length).igual(0);
    esperar(pendencias[0].motivo).igual(MOTIVOS_PENDENCIA_EXTRATO.SEM_DATA);
  });

  isso('lancamento sem valor na coluna Valor vira pendencia', () => {
    const itens = [
      ...cabecalho(580),
      item('30 de setembro 2026', X.HORA, 615),
      item('16:18', X.HORA, 547),
      item('Pix enviado', X.TIPO, 547),
      item('LOJA A', X.ORIGEM, 547)
    ];
    const { lancamentos, pendencias } = lerExtratoPicpay(pagina(itens));
    esperar(lancamentos.length).igual(0);
    esperar(pendencias[0].motivo).igual(MOTIVOS_PENDENCIA_EXTRATO.SEM_VALOR);
  });

  isso('pagina sem cabecalho de colunas, mas com lancamento, vira pendencia', () => {
    const itens = [item('16:18', X.HORA, 547), item('Pix enviado', X.TIPO, 547)];
    const { pendencias } = lerExtratoPicpay(pagina(itens));
    esperar(pendencias[0].motivo).igual(MOTIVOS_PENDENCIA_EXTRATO.SEM_CABECALHO);
  });

  isso('nao reclama de pagina sem cabecalho e sem lancamento', () => {
    const { lancamentos, pendencias } = lerExtratoPicpay(pagina([item('Documento emitido em', 31, 60)]));
    esperar(lancamentos.length).igual(0);
    esperar(pendencias.length).igual(0);
  });

  isso('a forma de pagamento nao entra na descricao, para nao poluir o comerciante', () => {
    const { lancamentos } = lerExtratoPicpay(pagina(lancamentoSimples()));
    esperar(lancamentos[0].descricaoOriginal.includes('Com saldo')).falso();
  });
});

descrever('Sinal de menos dos documentos brasileiros', () => {
  isso('entende o menos Unicode que o extrato imprime', () => {
    esperar(paraCentavos('−R$ 19,90')).igual(-1990);
  });

  isso('entende o traco curto e o traco longo', () => {
    esperar(paraCentavos('–R$ 7,00')).igual(-700);
    esperar(paraCentavos('—R$ 7,00')).igual(-700);
  });

  isso('continua entendendo o hifen e os parenteses', () => {
    esperar(paraCentavos('-R$ 19,90')).igual(-1990);
    esperar(paraCentavos('(1.234,56)')).igual(-123456);
  });

  isso('o sinal de mais nao torna o valor negativo', () => {
    esperar(paraCentavos('+R$ 50,00')).igual(5000);
  });
});

descrever('Reserva e cofrinho não são gasto nem entrada', () => {
  isso('guardar na reserva nao conta como gasto', () => {
    esperar(motivoDe('Dinheiro guardado No cofrinho')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('resgatar da reserva nao conta como entrada', () => {
    esperar(motivoDe('Dinheiro resgatado Do cofrinho')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('caixinha e reserva de emergencia tambem contam como aplicacao', () => {
    esperar(motivoDe('Transferencia para caixinha')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
    esperar(motivoDe('Reserva de emergencia')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('pix comum continua contando', () => {
    esperar(motivoDe('Pix recebido Fulano de Tal')).falso();
  });
});

descrever('Regra não casa no meio de outra palavra', () => {
  function casa(termo, descricao) {
    const regra = criarRegra({ operador: OPERADORES_REGRA.CONTEM, termo, categoria: 'X' });
    return avaliar(regra, { descricaoOriginal: descricao, comerciante: '' });
  }

  isso('termo curto nao casa dentro de outra palavra', () => {
    esperar(casa('CEB', 'Pix recebido Robinson de Freitas')).falso();
    esperar(casa('AMIL', 'PIX FAMILIA')).falso();
    esperar(casa('TIM', 'SENTIMENTO DE GRATIDAO')).falso();
    esperar(casa('UBER', 'MERCADO UBERLANDIA')).falso();
  });

  isso('o mesmo termo continua casando quando e a palavra de verdade', () => {
    esperar(casa('UBER', 'UBER DO BRASIL TECNOLOGIA LTDA.')).verdadeiro();
    esperar(casa('CEB', 'PAGAMENTO CEB ENERGIA')).verdadeiro();
  });

  isso('pontuacao conta como fronteira de palavra', () => {
    esperar(casa('IFOOD', 'IFOOD.COM AGENCIA DE RESTAURANTES')).verdadeiro();
    esperar(casa('MCDONALD', "Pix enviado MCDONALD'S")).verdadeiro();
    esperar(casa('NETFLIX', 'NETFLIX.COM')).verdadeiro();
  });

  isso('termo com caractere especial de expressao nao quebra a regra', () => {
    esperar(casa('MP *', 'MP *XYZ SERVICOS')).verdadeiro();
    esperar(casa('C++', 'CURSO C++ AVANCADO')).verdadeiro();
  });
});
