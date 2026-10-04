import { descrever, esperar, isso } from '../runner.js';
import { agruparEmLinhas } from '../../js/importadores/faturas/layout.js';
import { dataDoLancamento, descobrirReferencia } from '../../js/importadores/faturas/periodo.js';
import { MOTIVOS_PENDENCIA, lerFatura } from '../../js/importadores/faturas/lancamentos.js';
import { emissorDe } from '../../js/importadores/faturas/emissores.js';

function item(texto, esquerda, base, largura = 10) {
  return { str: texto, width: largura, transform: [1, 0, 0, 1, esquerda, base] };
}

const VENCIMENTO = '2026-10-10';

function ler(linhas, referencia = VENCIMENTO) {
  return lerFatura(linhas, referencia);
}

function valores(linhas) {
  return ler(linhas).lancamentos.map((lancamento) => lancamento.valor);
}

descrever('Linhas de uma fatura em PDF', () => {
  isso('junta numa linha os pedaços que estao na mesma altura', () => {
    esperar(
      agruparEmLinhas([item('23,45', 400, 700), item('03/09', 50, 700), item('UBER', 100, 700)])
    ).igual(['03/09 UBER 23,45']);
  });

  isso('ordena as linhas de cima para baixo', () => {
    esperar(agruparEmLinhas([item('rodape', 50, 100), item('topo', 50, 700)])).igual([
      'topo',
      'rodape'
    ]);
  });

  isso('tolera pequena variacao de altura dentro da mesma linha', () => {
    esperar(agruparEmLinhas([item('mesma', 50, 700), item('linha', 100, 701)])).igual([
      'mesma linha'
    ]);
  });

  isso('separa alturas distantes em linhas diferentes', () => {
    esperar(agruparEmLinhas([item('uma', 50, 700), item('outra', 50, 680)]).length).igual(2);
  });

  isso('descarta pedaco sem texto', () => {
    esperar(agruparEmLinhas([item('   ', 50, 700), item('texto', 100, 700)])).igual(['texto']);
  });

  isso('nao inventa espaco entre pedacos colados', () => {
    esperar(agruparEmLinhas([item('NET', 50, 700, 20), item('FLIX', 70, 700, 20)])).igual([
      'NETFLIX'
    ]);
  });

  isso('nao devolve linha vazia', () => {
    esperar(agruparEmLinhas([])).igual([]);
  });
});

descrever('Período da fatura', () => {
  isso('prefere a data marcada como vencimento', () => {
    esperar(descobrirReferencia(['Fechamento 02/10/2026', 'Vencimento: 10/10/2026'])).igual(
      '2026-10-10'
    );
  });

  isso('sem vencimento, usa a primeira data completa', () => {
    esperar(descobrirReferencia(['Emitido em 02/10/2026', 'outra 15/11/2026'])).igual('2026-10-02');
  });

  isso('sem nenhuma data completa, nao inventa referencia', () => {
    esperar(descobrirReferencia(['03/09 UBER 23,45', 'Total 23,45'])).igual(null);
  });

  isso('mes anterior ao vencimento fica no mesmo ano', () => {
    esperar(dataDoLancamento(3, 9, VENCIMENTO)).igual('2026-09-03');
  });

  isso('mes posterior ao vencimento vem do ano anterior', () => {
    esperar(dataDoLancamento(22, 12, VENCIMENTO)).igual('2025-12-22');
  });

  isso('mesmo mes do vencimento, dia anterior, fica no mesmo ano', () => {
    esperar(dataDoLancamento(2, 10, VENCIMENTO)).igual('2026-10-02');
  });

  isso('mesmo mes do vencimento, dia posterior, vem do ano anterior', () => {
    esperar(dataDoLancamento(30, 10, VENCIMENTO)).igual('2025-10-30');
  });
});

descrever('Lançamentos de uma fatura', () => {
  isso('compra da fatura entra como gasto, com sinal negativo', () => {
    esperar(valores(['03/09 UBER *TRIP SAO PAULO 21,90'])).igual([-21.9]);
  });

  isso('valor com sinal antes entra como credito', () => {
    esperar(valores(['25/09 PAGAMENTO RECEBIDO -500,00'])).igual([500]);
  });

  isso('valor com sinal depois entra como credito', () => {
    esperar(valores(['26/09 ESTORNO IFOOD 58,40-'])).igual([58.4]);
  });

  isso('le milhar com ponto e simbolo de moeda', () => {
    esperar(valores(['12/09 NOTEBOOK R$ 3.499,00'])).igual([-3499]);
  });

  isso('separa data, descricao e valor', () => {
    const [lancamento] = ler(['12/09 ASSAI ATACADISTA LOJA 08 312,70']).lancamentos;
    esperar(lancamento.data).igual('2026-09-12');
    esperar(lancamento.descricaoOriginal).igual('ASSAI ATACADISTA LOJA 08');
    esperar(lancamento.valor).igual(-312.7);
  });

  isso('data com ano explicito nao depende da referencia', () => {
    esperar(ler(['15/03/2024 COMPRA ANTIGA 10,00']).lancamentos[0].data).igual('2024-03-15');
  });

  isso('aceita mes abreviado em portugues', () => {
    esperar(ler(['05 SET SMART FIT 129,90']).lancamentos[0].data).igual('2026-09-05');
  });

  isso('preserva o contexto recebido em cada lancamento', () => {
    const { lancamentos } = lerFatura(['03/09 UBER 21,90'], VENCIMENTO, {
      banco: 'Inter',
      conta: 'Cartão de crédito'
    });
    esperar(lancamentos[0].banco).igual('Inter');
    esperar(lancamentos[0].conta).igual('Cartão de crédito');
  });

  isso('ignora linha de resumo que tem valor mas nao e lancamento', () => {
    const resumo = [
      'Total da fatura R$ 627,25',
      'Limite total: R$ 5.000,00',
      'Pagamento minimo: R$ 94,09',
      'Saldo anterior 100,00'
    ];
    esperar(ler(resumo).lancamentos.length).igual(0);
    esperar(ler(resumo).pendencias.length).igual(0);
  });

  isso('ignora texto solto, sem data e sem valor', () => {
    const { lancamentos, pendencias } = ler([
      'Obrigado por usar nosso cartao',
      'Data Descricao Valor'
    ]);
    esperar(lancamentos.length).igual(0);
    esperar(pendencias.length).igual(0);
  });
});

descrever('Pendências da fatura', () => {
  isso('linha com data e sem valor vira pendencia, nao lancamento', () => {
    const { lancamentos, pendencias } = ler(['29/09 COMPRA SEM VALOR']);
    esperar(lancamentos.length).igual(0);
    esperar(pendencias[0].motivo).igual(MOTIVOS_PENDENCIA.SEM_VALOR);
  });

  isso('linha com valor e sem data, fora do resumo, vira pendencia', () => {
    esperar(ler(['TARIFA AVULSA 12,00']).pendencias[0].motivo).igual(MOTIVOS_PENDENCIA.SEM_DATA);
  });

  isso('linha com data e valor mas sem descricao vira pendencia', () => {
    esperar(ler(['03/09 21,90']).pendencias[0].motivo).igual(MOTIVOS_PENDENCIA.SEM_DESCRICAO);
  });

  isso('a pendencia aponta a linha e o texto original', () => {
    const { pendencias } = ler(['03/09 UBER 21,90', '29/09 COMPRA SEM VALOR']);
    esperar(pendencias[0].linha).igual(2);
    esperar(pendencias[0].texto).igual('29/09 COMPRA SEM VALOR');
  });

  isso('uma fatura inteira so produz pendencia do que nao encaixou', () => {
    const fatura = [
      'Banco Inter',
      'Vencimento: 10/10/2026',
      'Limite total: R$ 5.000,00',
      'Data Descricao Valor (R$)',
      '03/09 UBER *TRIP SAO PAULO 21,90',
      '12/09 ASSAI ATACADISTA LOJA 08 312,70',
      '29/09 COMPRA SEM VALOR',
      'Total desta fatura 627,25'
    ];
    const { lancamentos, pendencias } = ler(fatura);
    esperar(lancamentos.length).igual(2);
    esperar(pendencias.length).igual(1);
  });
});

descrever('Emissor da fatura', () => {
  isso('reconhece o banco pelo nome impresso, ignorando acento e caixa', () => {
    esperar(emissorDe(['BANCO INTER S.A.', 'Fatura'])).igual('Inter');
    esperar(emissorDe(['Itaú Unibanco', 'Fatura'])).igual('Itaú');
  });

  isso('sem nome conhecido, nao chuta banco', () => {
    esperar(emissorDe(['Fatura do cartao', 'Vencimento 10/10/2026'])).igual('');
  });
});

descrever('Data impossível na fatura', () => {
  isso('linha com dia ou mes que nao existe vira pendencia', () => {
    const { lancamentos, pendencias } = ler(['31/02 LOJA INEXISTENTE 10,00']);
    esperar(lancamentos.length).igual(0);
    esperar(pendencias[0].motivo).igual(MOTIVOS_PENDENCIA.DATA_INVALIDA);
  });

  isso('aceita ano de dois digitos', () => {
    esperar(ler(['15/03/24 COMPRA ANTIGA 10,00']).lancamentos[0].data).igual('2024-03-15');
  });
});
