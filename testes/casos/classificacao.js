import { descrever, esperar, isso } from '../runner.js';
import { criarRegra, avaliar, ordenar, contarAcertos, alcance, validar } from '../../js/nucleo/regras.js';
import { classificar, reclassificar } from '../../js/nucleo/classificar.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { CATEGORIA_SEM_CLASSIFICACAO, OPERADORES_REGRA, ORIGENS_REGRA } from '../../js/nucleo/constantes.js';

function lancamento(descricao, campos = {}) {
  return preparar({
    data: '05/09/2026',
    valor: '-45,90',
    descricaoOriginal: descricao,
    banco: 'Itau',
    arquivo: 'extrato.ofx',
    ...campos
  });
}

function regra(termo, categoria, extras = {}) {
  return criarRegra({ operador: OPERADORES_REGRA.CONTEM, termo, categoria, ...extras });
}

descrever('Avaliação de regras', () => {
  isso('casa pelo operador contem', () => {
    esperar(avaliar(regra('ALIMENTOS', 'Alimentação'), lancamento('PAGBANK*JL ALIMENTOS'))).verdadeiro();
  });

  isso('casa pela chave de comerciante, nao so pela descricao', () => {
    esperar(avaliar(regra('JL ALIMENTOS', 'Alimentação'), lancamento('PAGBANK*JL ALIMENTOS'))).verdadeiro();
  });

  isso('casa pelo operador comeca com', () => {
    const inicio = criarRegra({ operador: OPERADORES_REGRA.COMECA_COM, termo: 'SMART FIT', categoria: 'Academia' });
    esperar(avaliar(inicio, lancamento('SMART FIT BRASILIA'))).verdadeiro();
  });

  isso('nao casa comeca com quando o termo esta no meio', () => {
    const inicio = criarRegra({ operador: OPERADORES_REGRA.COMECA_COM, termo: 'FIT', categoria: 'Academia' });
    esperar(avaliar(inicio, lancamento('SMART FIT BRASILIA'))).falso();
  });

  isso('casa por expressao regular', () => {
    const expressao = criarRegra({ operador: OPERADORES_REGRA.REGEX, termo: '^UBER', categoria: 'Transporte' });
    esperar(avaliar(expressao, lancamento('UBER *TRIP HELP.UBER.COM'))).verdadeiro();
  });

  isso('ignora acento e caixa na comparacao', () => {
    esperar(avaliar(regra('farmácia', 'Saúde'), lancamento('FARMACIA SAO JOAO'))).verdadeiro();
  });

  isso('marca expressao invalida como regra nao aplicavel', () => {
    const quebrada = criarRegra({ operador: OPERADORES_REGRA.REGEX, termo: '(PIX DES', categoria: 'Outros' });
    esperar(validar(quebrada).valida).falso();
    esperar(avaliar(quebrada, lancamento('PIX DES 24/09 ANA'))).falso();
  });

  isso('recusa regra sem termo', () => {
    esperar(validar(regra('', 'Outros')).valida).falso();
  });

  isso('recusa regra sem categoria', () => {
    esperar(validar(regra('UBER', '')).valida).falso();
  });

  isso('coloca regras do usuario antes do dicionario', () => {
    const semente = criarRegra({
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'UBER',
      categoria: 'Transporte',
      origem: ORIGENS_REGRA.SEMENTE
    });
    const minha = regra('UBER', 'Lazer');
    esperar(ordenar([semente, minha])[0].origem).igual(ORIGENS_REGRA.USUARIO);
  });
});

descrever('Classificação', () => {
  isso('aplica a categoria da regra que bateu', () => {
    const resultado = classificar(lancamento('PAGBANK*JL ALIMENTOS'), [regra('JL ALIMENTOS', 'Alimentação')]);
    esperar(resultado.categoria).igual('Alimentação');
  });

  isso('aplica tambem as tags da regra', () => {
    const comTag = regra('SMART FIT', 'Academia', { tags: ['recorrente'] });
    esperar(classificar(lancamento('SMART FIT BRASILIA'), [comTag]).tags).igual(['recorrente']);
  });

  isso('deixa sem categoria quando nenhuma regra bate', () => {
    esperar(classificar(lancamento('LOJA DESCONHECIDA'), []).categoria).igual(CATEGORIA_SEM_CLASSIFICACAO);
  });

  isso('vence a regra do usuario sobre a do dicionario', () => {
    const semente = criarRegra({
      operador: OPERADORES_REGRA.CONTEM,
      termo: 'UBER',
      categoria: 'Transporte',
      origem: ORIGENS_REGRA.SEMENTE
    });
    const minha = regra('UBER', 'Lazer');
    const resultado = reclassificar([lancamento('UBER *TRIP')], [semente, minha]);
    esperar(resultado[0].categoria).igual('Lazer');
  });

  isso('vence a primeira regra do usuario quando duas batem', () => {
    const primeira = regra('UBER', 'Transporte');
    const segunda = regra('TRIP', 'Lazer');
    esperar(reclassificar([lancamento('UBER *TRIP')], [primeira, segunda])[0].categoria).igual('Transporte');
  });

  isso('preserva lancamento editado a mao', () => {
    const manual = { ...lancamento('PAGBANK*JL ALIMENTOS'), categoria: 'Mercado', revisadoManual: true };
    esperar(reclassificar([manual], [regra('JL ALIMENTOS', 'Alimentação')])[0].categoria).igual('Mercado');
  });

  isso('reclassifica o historico quando a regra e criada', () => {
    const historico = [lancamento('PAGBANK*JL ALIMENTOS'), lancamento('OUTRA COISA')];
    const resultado = reclassificar(historico, [regra('JL ALIMENTOS', 'Alimentação')]);
    esperar(resultado[0].categoria).igual('Alimentação');
    esperar(resultado[1].categoria).igual(CATEGORIA_SEM_CLASSIFICACAO);
  });

  isso('volta para sem categoria quando a regra e removida', () => {
    const historico = reclassificar([lancamento('PAGBANK*JL ALIMENTOS')], [regra('JL ALIMENTOS', 'Alimentação')]);
    esperar(reclassificar(historico, [])[0].categoria).igual(CATEGORIA_SEM_CLASSIFICACAO);
  });

  isso('regra quebrada nao derruba a classificacao das outras', () => {
    const quebrada = criarRegra({ operador: OPERADORES_REGRA.REGEX, termo: '(PIX', categoria: 'Outros' });
    const boa = regra('JL ALIMENTOS', 'Alimentação');
    esperar(reclassificar([lancamento('PAGBANK*JL ALIMENTOS')], [quebrada, boa])[0].categoria).igual('Alimentação');
  });

  isso('a soma por categoria cobre todos os lancamentos', () => {
    const historico = reclassificar(
      [lancamento('PAGBANK*JL ALIMENTOS'), lancamento('UBER *TRIP'), lancamento('LOJA X')],
      [regra('JL ALIMENTOS', 'Alimentação'), regra('UBER', 'Transporte')]
    );
    const porCategoria = historico.reduce((mapa, item) => {
      mapa[item.categoria] = (mapa[item.categoria] ?? 0) + 1;
      return mapa;
    }, {});
    const total = Object.values(porCategoria).reduce((soma, quantidade) => soma + quantidade, 0);
    esperar(total).igual(historico.length);
  });
});

descrever('Impacto das regras', () => {
  isso('conta quantos lancamentos cada regra atinge', () => {
    const historico = [lancamento('UBER *TRIP'), lancamento('UBER *EATS'), lancamento('LOJA X')];
    const minha = regra('UBER', 'Transporte');
    esperar(contarAcertos([minha], historico).get(minha.id)).igual(2);
  });

  isso('nao conta duas vezes o lancamento que bate em duas regras', () => {
    const historico = [lancamento('UBER *TRIP')];
    const primeira = regra('UBER', 'Transporte');
    const segunda = regra('TRIP', 'Lazer');
    const contagem = contarAcertos([primeira, segunda], historico);
    esperar(contagem.get(primeira.id) + contagem.get(segunda.id)).igual(1);
  });

  isso('informa o alcance de uma regra antes de salvar', () => {
    const historico = [
      lancamento('UBER *TRIP'),
      { ...lancamento('UBER *EATS'), revisadoManual: true },
      lancamento('LOJA X')
    ];
    esperar(alcance(regra('UBER', 'Transporte'), historico)).igual({ total: 2, manuais: 1 });
  });
});
