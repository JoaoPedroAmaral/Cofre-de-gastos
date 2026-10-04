import { descrever, esperar, isso } from '../runner.js';
import { formatarData, formatarMoeda, formatarPercentual } from '../../js/ui/formato.js';

const ESPACO_FIXO = / /g;

function normalizar(texto) {
  return texto.replace(ESPACO_FIXO, ' ');
}

descrever('Formatação de exibição', () => {
  isso('formata centavos como moeda brasileira', () => {
    esperar(normalizar(formatarMoeda(123456))).igual('R$ 1.234,56');
  });

  isso('formata valor negativo preservando o sinal', () => {
    esperar(normalizar(formatarMoeda(-8990))).contem('89,90');
  });

  isso('formata zero sem erro', () => {
    esperar(normalizar(formatarMoeda(0))).igual('R$ 0,00');
  });

  isso('devolve texto vazio para valor nao numerico', () => {
    esperar(formatarMoeda(undefined)).igual('');
  });

  isso('converte data ISO para o formato brasileiro', () => {
    esperar(formatarData('2026-03-05')).igual('05/03/2026');
  });

  isso('devolve texto vazio para data em formato invalido', () => {
    esperar(formatarData('05/03/2026')).igual('');
  });

  isso('devolve texto vazio para data ausente', () => {
    esperar(formatarData(null)).igual('');
  });

  isso('formata fracao como percentual', () => {
    esperar(normalizar(formatarPercentual(0.125))).igual('12,5%');
  });

  isso('devolve texto vazio para percentual nao numerico', () => {
    esperar(formatarPercentual(Number.NaN)).igual('');
  });
});
