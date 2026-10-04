import { descrever, esperar, isso } from '../runner.js';
import { mesDe, paraIso } from '../../js/nucleo/datas.js';

descrever('Interpretação de data', () => {
  isso('converte data brasileira para ISO', () => {
    esperar(paraIso('05/03/2026')).igual('2026-03-05');
  });

  isso('converte data brasileira com um digito', () => {
    esperar(paraIso('5/3/2026')).igual('2026-03-05');
  });

  isso('converte ano com dois digitos', () => {
    esperar(paraIso('05/03/26')).igual('2026-03-05');
  });

  isso('converte formato compacto com ano no inicio', () => {
    esperar(paraIso('20260305')).igual('2026-03-05');
  });

  isso('converte formato compacto com dia no inicio', () => {
    esperar(paraIso('05032026')).igual('2026-03-05');
  });

  isso('mantem data ja em ISO', () => {
    esperar(paraIso('2026-03-05')).igual('2026-03-05');
  });

  isso('interpreta data com horario do OFX', () => {
    esperar(paraIso('20260903120000[-3:BRT]')).igual('2026-09-03');
  });

  isso('rejeita mes inexistente', () => {
    esperar(paraIso('32/13/2026')).igual(null);
  });

  isso('rejeita dia alem do mes', () => {
    esperar(paraIso('31/04/2026')).igual(null);
  });

  isso('aceita 29 de fevereiro em ano bissexto', () => {
    esperar(paraIso('29/02/2024')).igual('2024-02-29');
  });

  isso('rejeita 29 de fevereiro em ano comum', () => {
    esperar(paraIso('29/02/2026')).igual(null);
  });

  isso('rejeita texto que nao e data', () => {
    esperar(paraIso('sem data')).igual(null);
  });

  isso('rejeita valor ausente', () => {
    esperar(paraIso(null)).igual(null);
  });

  isso('extrai o mes de competencia', () => {
    esperar(mesDe('2026-09-28')).igual('2026-09');
  });
});
