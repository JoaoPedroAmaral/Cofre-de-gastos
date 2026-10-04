import { descrever, esperar, isso } from '../runner.js';
import { deCentavos, paraCentavos, somar } from '../../js/nucleo/dinheiro.js';

descrever('Interpretação de valor', () => {
  isso('interpreta formato brasileiro com milhar e decimal', () => {
    esperar(paraCentavos('1.234,56')).igual(123456);
  });

  isso('interpreta formato americano com milhar e decimal', () => {
    esperar(paraCentavos('1,234.56')).igual(123456);
  });

  isso('ignora simbolo de moeda e espacos', () => {
    esperar(paraCentavos('R$ 89,90')).igual(8990);
  });

  isso('trata parenteses como valor negativo', () => {
    esperar(paraCentavos('(123,45)')).igual(-12345);
  });

  isso('trata sinal negativo ao final', () => {
    esperar(paraCentavos('123,45-')).igual(-12345);
  });

  isso('trata coluna de debito convertida em negativo', () => {
    esperar(paraCentavos('-45,00')).igual(-4500);
  });

  isso('interpreta zero sem erro', () => {
    esperar(paraCentavos('0,00')).igual(0);
  });

  isso('interpreta valor inteiro sem separador', () => {
    esperar(paraCentavos('150')).igual(15000);
  });

  isso('trata ponto como separador de milhar quando ha tres casas', () => {
    esperar(paraCentavos('1.500')).igual(150000);
  });

  isso('aceita numero nativo', () => {
    esperar(paraCentavos(12.34)).igual(1234);
  });

  isso('devolve nulo para texto sem numero', () => {
    esperar(paraCentavos('abc')).igual(null);
  });

  isso('devolve nulo para valor ausente', () => {
    esperar(paraCentavos('')).igual(null);
  });

  isso('converte centavos de volta para decimal', () => {
    esperar(deCentavos(123456)).igual(1234.56);
  });

  isso('soma em centavos sem erro de ponto flutuante', () => {
    esperar(somar([1010, 2020, 3030])).igual(6060);
  });

  isso('soma valores que errariam em ponto flutuante decimal', () => {
    esperar(somar([paraCentavos('0,10'), paraCentavos('0,20')])).igual(30);
  });
});
