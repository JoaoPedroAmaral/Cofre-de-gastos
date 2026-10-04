import { descrever, esperar, isso } from '../runner.js';
import { chaveComerciante, metodoDe, parcelaDe } from '../../js/nucleo/normalizar.js';
import { motivoDe } from '../../js/nucleo/naoGasto.js';
import { METODOS, MOTIVOS_NAO_GASTO } from '../../js/nucleo/constantes.js';

descrever('Chave de comerciante', () => {
  isso('agrupa o mesmo estabelecimento em cidades diferentes', () => {
    esperar(chaveComerciante('CIELO ME 2938 SP 12/09')).igual(chaveComerciante('CIELO ME 2938 RJ 04/10'));
  });

  isso('remove o intermediador de pagamento e mantem o lojista', () => {
    esperar(chaveComerciante('PAGBANK*JL ALIMENTOS')).igual('JL ALIMENTOS');
  });

  isso('remove o prefixo do Mercado Pago', () => {
    esperar(chaveComerciante('MP *XYZ SERVICOS')).igual('XYZ SERVICOS');
  });

  isso('mantem a marca quando ela vem antes do asterisco', () => {
    esperar(chaveComerciante('UBER *TRIP HELP.UBER.COM')).igual('UBER');
  });

  isso('remove numero de loja e sufixo de estado', () => {
    esperar(chaveComerciante('ASSAI ATACADISTA 0231 DF')).igual('ASSAI ATACADISTA');
  });

  isso('remove a cidade do final', () => {
    esperar(chaveComerciante('SMART FIT BRASILIA')).igual('SMART FIT');
  });

  isso('remove a data do meio da descricao', () => {
    esperar(chaveComerciante('IFOOD CLUB 01/09 SAO PAULO BR')).igual('IFOOD CLUB');
  });

  isso('remove o prefixo de PIX e mantem o favorecido', () => {
    esperar(chaveComerciante('PIX DES 24/09 ANA PAULA R')).igual('ANA PAULA R');
  });

  isso('remove o marcador de parcela', () => {
    esperar(chaveComerciante('PARC 03/10 CURSO TECH ONLINE')).igual('CURSO TECH ONLINE');
  });

  isso('ignora acento e caixa', () => {
    esperar(chaveComerciante('Farmácia São João')).igual(chaveComerciante('FARMACIA SAO JOAO'));
  });

  isso('mantem estabelecimentos diferentes com chaves diferentes', () => {
    esperar(chaveComerciante('ASSAI ATACADISTA 0231')).diferenteDe(chaveComerciante('CARREFOUR 0231'));
  });

  isso('nao devolve chave vazia quando a descricao e so ruido', () => {
    esperar(chaveComerciante('PIX 12/09').length > 0).verdadeiro();
  });
});

descrever('Método e parcela', () => {
  isso('reconhece pix', () => {
    esperar(metodoDe('PIX DES 24/09 ANA PAULA R', METODOS.OUTROS)).igual(METODOS.PIX);
  });

  isso('reconhece compra no debito', () => {
    esperar(metodoDe('COMPRA DEBITO ASSAI 0231', METODOS.OUTROS)).igual(METODOS.CARTAO_DEBITO);
  });

  isso('reconhece boleto', () => {
    esperar(metodoDe('PAGAMENTO BOLETO ENERGIA', METODOS.OUTROS)).igual(METODOS.BOLETO);
  });

  isso('reconhece tarifa', () => {
    esperar(metodoDe('TARIFA MENSALIDADE PACOTE', METODOS.OUTROS)).igual(METODOS.TARIFA);
  });

  isso('preserva cartao de credito vindo do arquivo', () => {
    esperar(metodoDe('PIX DES ANA', METODOS.CARTAO_CREDITO)).igual(METODOS.CARTAO_CREDITO);
  });

  isso('cai para outros quando nao ha marca', () => {
    esperar(metodoDe('JL ALIMENTOS', METODOS.OUTROS)).igual(METODOS.OUTROS);
  });

  isso('extrai parcela com marcador', () => {
    esperar(parcelaDe('PARC 03/10 CURSO TECH ONLINE')).igual({ atual: 3, total: 10 });
  });

  isso('extrai parcela escrita por extenso', () => {
    esperar(parcelaDe('CURSO TECH PARCELA 2 DE 12')).igual({ atual: 2, total: 12 });
  });

  isso('nao confunde data com parcela', () => {
    esperar(parcelaDe('IFOOD CLUB 01/09 SAO PAULO BR')).igual(null);
  });

  isso('rejeita parcela com total absurdo', () => {
    esperar(parcelaDe('PARC 03/99 ALGO')).igual(null);
  });
});

descrever('Lançamentos fora do total', () => {
  isso('marca pagamento de fatura', () => {
    esperar(motivoDe('PAG FATURA CARTAO 09/2026')).igual(MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA);
  });

  isso('marca pagamento de fatura escrito por extenso', () => {
    esperar(motivoDe('PAGAMENTO DE FATURA CARTAO VISA')).igual(MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA);
  });

  isso('marca aplicacao automatica', () => {
    esperar(motivoDe('APLICACAO AUTOMATICA CDB')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('marca resgate', () => {
    esperar(motivoDe('RESGATE INVEST FACIL')).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('marca transferencia entre contas proprias', () => {
    esperar(motivoDe('TED MESMA TITULARIDADE')).igual(MOTIVOS_NAO_GASTO.TRANSFERENCIA);
  });

  isso('nao marca uma compra comum', () => {
    esperar(motivoDe('PAGBANK*JL ALIMENTOS')).falso();
  });

  isso('nao marca pix para terceiro', () => {
    esperar(motivoDe('PIX DES 24/09 ANA PAULA R')).falso();
  });
});
