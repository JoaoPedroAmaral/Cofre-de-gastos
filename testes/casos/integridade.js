import { descrever, esperar, isso } from '../runner.js';
import { mesclar } from '../../js/nucleo/deduplicar.js';
import { chaveDe, idDe } from '../../js/nucleo/identidade.js';
import { preparar } from '../../js/nucleo/preparar.js';

function bruto(campos) {
  return preparar({
    data: '05/09/2026',
    valor: '-45,90',
    descricaoOriginal: 'PAGBANK*JL ALIMENTOS',
    banco: 'Itau',
    conta: '12345-6',
    arquivo: 'extrato.ofx',
    ...campos
  });
}

descrever('Identidade e deduplicação', () => {
  isso('gera a mesma identidade para o mesmo lancamento', () => {
    esperar(idDe(bruto({}))).igual(idDe(bruto({})));
  });

  isso('gera identidades diferentes quando o valor muda', () => {
    esperar(idDe(bruto({}))).diferenteDe(idDe(bruto({ valor: '-45,91' })));
  });

  isso('gera identidades diferentes quando o banco muda', () => {
    esperar(idDe(bruto({}))).diferenteDe(idDe(bruto({ banco: 'Nubank' })));
  });

  isso('inclui banco, conta, data, valor e descricao na chave', () => {
    esperar(chaveDe(bruto({}))).contem('PAGBANK*JL ALIMENTOS');
    esperar(chaveDe(bruto({}))).contem('2026-09-05');
  });

  isso('insere todos os lancamentos quando nao ha nada guardado', () => {
    const resultado = mesclar([], [bruto({}), bruto({ valor: '-10,00' })]);
    esperar(resultado.inseridos.length).igual(2);
    esperar(resultado.ignorados).igual(0);
  });

  isso('ignora reimportacao do mesmo arquivo', () => {
    const lote = [bruto({}), bruto({ valor: '-10,00' })];
    const primeira = mesclar([], lote);
    const segunda = mesclar(primeira.inseridos, lote);

    esperar(segunda.inseridos.length).igual(0);
    esperar(segunda.ignorados).igual(2);
  });

  isso('importa apenas os lancamentos novos de um periodo sobreposto', () => {
    const primeira = mesclar([], [bruto({}), bruto({ valor: '-10,00' })]);
    const segunda = mesclar(primeira.inseridos, [
      bruto({}),
      bruto({ valor: '-10,00' }),
      bruto({ valor: '-33,00' })
    ]);

    esperar(segunda.inseridos.length).igual(1);
    esperar(segunda.ignorados).igual(2);
    esperar(segunda.inseridos[0].valor).igual(-3300);
  });

  isso('preserva dois lancamentos identicos no mesmo dia', () => {
    const resultado = mesclar([], [bruto({}), bruto({})]);
    esperar(resultado.inseridos.length).igual(2);
    esperar(resultado.inseridos[0].id).diferenteDe(resultado.inseridos[1].id);
  });

  isso('nao duplica quando o arquivo com repetidos legitimos e reimportado', () => {
    const lote = [bruto({}), bruto({})];
    const primeira = mesclar([], lote);
    const segunda = mesclar(primeira.inseridos, lote);

    esperar(segunda.inseridos.length).igual(0);
    esperar(segunda.ignorados).igual(2);
  });

  isso('trata lancamentos de bancos diferentes como distintos', () => {
    const resultado = mesclar([], [bruto({}), bruto({ banco: 'Nubank' })]);
    esperar(resultado.inseridos.length).igual(2);
  });

  isso('preserva a categoria editada a mao ao reimportar', () => {
    const guardado = { ...bruto({}), categoria: 'Alimentação', revisadoManual: true };
    const comId = mesclar([], [guardado]).inseridos;
    const segunda = mesclar(comId, [bruto({})]);

    esperar(segunda.inseridos.length).igual(0);
    esperar(comId[0].categoria).igual('Alimentação');
  });
});
