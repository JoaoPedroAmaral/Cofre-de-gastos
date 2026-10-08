import { descrever, esperar, isso } from '../runner.js';
import { DURACAO_DA_CONTAGEM, devoAnimar, valorNoAndamento } from '../../js/ui/contador.js';

const VALOR = 120000;
const METADE = 0.5;

descrever('Contagem até o valor', () => {
  isso('comeca do zero', () => {
    esperar(valorNoAndamento(VALOR, 0)).igual(0);
  });

  isso('termina exatamente no valor pedido', () => {
    esperar(valorNoAndamento(VALOR, 1)).igual(VALOR);
  });

  isso('passado o fim, nao ultrapassa o valor', () => {
    esperar(valorNoAndamento(VALOR, 3)).igual(VALOR);
  });

  isso('andamento negativo ou invalido conta como inicio', () => {
    esperar(valorNoAndamento(VALOR, -1)).igual(0);
    esperar(valorNoAndamento(VALOR, Number.NaN)).igual(0);
  });

  isso('so cresce, nunca volta', () => {
    const passos = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((andamento) =>
      valorNoAndamento(VALOR, andamento)
    );
    const caiu = passos.filter((valor, posicao) => posicao > 0 && valor < passos[posicao - 1]);

    esperar(caiu.length).igual(0);
  });

  isso('desacelera: na metade do tempo ja passou da metade do valor', () => {
    esperar(valorNoAndamento(VALOR, METADE) > VALOR * METADE).verdadeiro();
  });

  isso('valor negativo tambem conta ate o fim', () => {
    esperar(valorNoAndamento(-VALOR, 0)).igual(0);
    esperar(valorNoAndamento(-VALOR, 1)).igual(-VALOR);
  });

  isso('a contagem dura menos de um segundo', () => {
    esperar(DURACAO_DA_CONTAGEM < 1000).verdadeiro();
  });
});

descrever('Quando não animar', () => {
  isso('valor zero nao anima', () => {
    esperar(devoAnimar(0, false)).falso();
  });

  isso('quem pede menos movimento nao ve animacao', () => {
    esperar(devoAnimar(VALOR, true)).falso();
  });

  isso('valor diferente de zero, sem restricao, anima', () => {
    esperar(devoAnimar(VALOR, false)).verdadeiro();
    esperar(devoAnimar(-VALOR, false)).verdadeiro();
  });
});
