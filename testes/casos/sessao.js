import { descrever, esperar, isso } from '../runner.js';
import {
  INTERVALO_ENTRE_RENOVACOES,
  JANELA_DE_INATIVIDADE,
  aproveitavel,
  daAba,
  expirou,
  podeRenovar,
  tempoRestante
} from '../../js/cofre/validadeDaSessao.js';

const AGORA = 1_760_000_000_000;
const MARCADOR = 'aba-1';
const UM_MINUTO = 60000;

function sessaoVista(quandoFoiVista, marcador = MARCADOR) {
  return { perfilId: 'perfil-1', marcador, visto: quandoFoiVista };
}

descrever('Validade da sessão guardada', () => {
  isso('sessão recém-aberta tem a janela inteira pela frente', () => {
    esperar(tempoRestante(AGORA, AGORA)).igual(JANELA_DE_INATIVIDADE);
  });

  isso('o tempo parado é descontado do que resta', () => {
    const parado = 4 * UM_MINUTO;
    esperar(tempoRestante(AGORA - parado, AGORA)).igual(JANELA_DE_INATIVIDADE - parado);
  });

  isso('recarregar não devolve a janela inteira', () => {
    const quaseNoFim = AGORA - (JANELA_DE_INATIVIDADE - UM_MINUTO);
    esperar(tempoRestante(quaseNoFim, AGORA)).igual(UM_MINUTO);
  });

  isso('passada a janela, não resta tempo', () => {
    esperar(tempoRestante(AGORA - JANELA_DE_INATIVIDADE - 1, AGORA)).igual(0);
  });

  isso('sessão sem carimbo de tempo não vale', () => {
    esperar(tempoRestante(undefined, AGORA)).igual(0);
    esperar(expirou({ marcador: MARCADOR }, AGORA)).verdadeiro();
  });

  isso('sessão dentro da janela não expirou', () => {
    esperar(expirou(sessaoVista(AGORA - UM_MINUTO), AGORA)).falso();
  });

  isso('sessão fora da janela expirou', () => {
    esperar(expirou(sessaoVista(AGORA - JANELA_DE_INATIVIDADE), AGORA)).verdadeiro();
  });

  isso('sessão que não existe conta como expirada', () => {
    esperar(expirou(null, AGORA)).verdadeiro();
  });
});

descrever('A sessão pertence à aba onde o cofre foi aberto', () => {
  isso('marcador igual é a mesma aba', () => {
    esperar(daAba(sessaoVista(AGORA), MARCADOR)).verdadeiro();
  });

  isso('marcador diferente é outra aba', () => {
    esperar(daAba(sessaoVista(AGORA), 'aba-2')).falso();
  });

  isso('sem marcador nenhum, não se aproveita sessão', () => {
    esperar(daAba(sessaoVista(AGORA), '')).falso();
  });

  isso('sessão da própria aba e dentro da janela é aproveitável', () => {
    esperar(aproveitavel(sessaoVista(AGORA - UM_MINUTO), MARCADOR, AGORA)).verdadeiro();
  });

  isso('sessão de outra aba não é aproveitável nem dentro da janela', () => {
    esperar(aproveitavel(sessaoVista(AGORA - UM_MINUTO, 'aba-2'), MARCADOR, AGORA)).falso();
  });

  isso('sessão da própria aba não é aproveitável depois da janela', () => {
    esperar(aproveitavel(sessaoVista(AGORA - JANELA_DE_INATIVIDADE), MARCADOR, AGORA)).falso();
  });
});

descrever('Renovação do carimbo de atividade', () => {
  isso('a primeira atividade renova', () => {
    esperar(podeRenovar(0, AGORA)).verdadeiro();
  });

  isso('atividade logo em seguida não grava de novo', () => {
    esperar(podeRenovar(AGORA, AGORA + 1)).falso();
  });

  isso('passado o intervalo, renova', () => {
    esperar(podeRenovar(AGORA, AGORA + INTERVALO_ENTRE_RENOVACOES)).verdadeiro();
  });

  isso('o intervalo é bem menor que a janela de inatividade', () => {
    esperar(INTERVALO_ENTRE_RENOVACOES < JANELA_DE_INATIVIDADE).verdadeiro();
  });
});
