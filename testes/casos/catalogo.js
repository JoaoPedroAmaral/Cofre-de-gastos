import { descrever, esperar, isso } from '../runner.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import { ACOES, CATEGORIA_SEM_CLASSIFICACAO, OPERADORES_REGRA } from '../../js/nucleo/constantes.js';
import { acrescentar, contarUso, ehEditavel, existe, mesmoNome, remover, renomear } from '../../js/nucleo/catalogo.js';
import { ordenarLancamentos } from '../../js/nucleo/ordenar.js';
import { preparar } from '../../js/nucleo/preparar.js';

function lancamentoDe(descricao, valor, id) {
  return {
    ...preparar({
      data: '05/09/2026',
      valor,
      descricaoOriginal: descricao,
      banco: 'Banco Teste',
      arquivo: 'extrato.ofx'
    }),
    id
  };
}

function importar(lancamentos) {
  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos, arquivos: [] });
}

function categoriaDe(id) {
  return obter().lancamentos.find((lancamento) => lancamento.id === id).categoria;
}

descrever('Catálogo de nomes', () => {
  isso('acrescenta uma categoria nova', () => {
    esperar(existe(acrescentar(['Mercado', CATEGORIA_SEM_CLASSIFICACAO], 'Pets'), 'Pets')).verdadeiro();
  });

  isso('mantem o nao categorizado sempre no fim', () => {
    const lista = acrescentar(['Mercado', CATEGORIA_SEM_CLASSIFICACAO], 'Pets');
    esperar(lista[lista.length - 1]).igual(CATEGORIA_SEM_CLASSIFICACAO);
  });

  isso('nao cria duas categorias que so diferem em acento, caixa ou espaco', () => {
    const lista = ['Educação', CATEGORIA_SEM_CLASSIFICACAO];
    esperar(acrescentar(lista, ' educacao ')).igual(lista);
    esperar(acrescentar(lista, 'EDUCAÇÃO')).igual(lista);
  });

  isso('nome vazio nao vira categoria', () => {
    const lista = ['Mercado', CATEGORIA_SEM_CLASSIFICACAO];
    esperar(acrescentar(lista, '   ')).igual(lista);
  });

  isso('guarda o nome do jeito que voce escreveu', () => {
    esperar(acrescentar([CATEGORIA_SEM_CLASSIFICACAO], '  Saúde do Pet ')[0]).igual('Saúde do Pet');
  });

  isso('renomeia mantendo a posicao', () => {
    const lista = renomear(['Mercado', 'Lazer', CATEGORIA_SEM_CLASSIFICACAO], 'Lazer', 'Diversão');
    esperar(lista).igual(['Mercado', 'Diversão', CATEGORIA_SEM_CLASSIFICACAO]);
  });

  isso('nao renomeia para um nome que ja existe', () => {
    const lista = ['Mercado', 'Lazer', CATEGORIA_SEM_CLASSIFICACAO];
    esperar(renomear(lista, 'Lazer', 'mercado')).igual(lista);
  });

  isso('remove categoria do catalogo', () => {
    esperar(remover(['Mercado', 'Lazer', CATEGORIA_SEM_CLASSIFICACAO], 'Lazer')).igual([
      'Mercado',
      CATEGORIA_SEM_CLASSIFICACAO
    ]);
  });

  isso('nao categorizado nao e renomeavel nem removivel', () => {
    const lista = ['Mercado', CATEGORIA_SEM_CLASSIFICACAO];
    esperar(ehEditavel(CATEGORIA_SEM_CLASSIFICACAO)).falso();
    esperar(remover(lista, CATEGORIA_SEM_CLASSIFICACAO)).igual(lista);
    esperar(renomear(lista, CATEGORIA_SEM_CLASSIFICACAO, 'Sem nada')).igual(lista);
  });

  isso('conta quantos lancamentos usam a categoria', () => {
    const lancamentos = [
      { categoria: 'Mercado' },
      { categoria: 'Mercado' },
      { categoria: 'Lazer' }
    ];
    esperar(contarUso(lancamentos, 'mercado')).igual(2);
  });

  isso('compara nomes ignorando acento e caixa', () => {
    esperar(mesmoNome('Educação e cursos', 'EDUCACAO E CURSOS')).verdadeiro();
    esperar(mesmoNome('Mercado', 'Mercadinho')).falso();
  });
});

descrever('Categorias no estado da aplicação', () => {
  isso('cria categoria e ela aparece no catalogo', () => {
    reiniciar();
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    esperar(existe(obter().categorias, 'Pets')).verdadeiro();
  });

  isso('categorizar com a categoria nova funciona como qualquer outra', () => {
    reiniciar();
    importar([lancamentoDe('PETSHOP AMIGO FIEL', '-90,00', 'p1')]);
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['p1'], categoria: 'Pets' });

    esperar(categoriaDe('p1')).igual('Pets');
  });

  isso('renomear muda nos lancamentos que usam', () => {
    reiniciar();
    importar([lancamentoDe('PETSHOP AMIGO FIEL', '-90,00', 'p2')]);
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['p2'], categoria: 'Pets' });
    despachar(ACOES.RENOMEAR_CATEGORIA, { de: 'Pets', para: 'Bichos' });

    esperar(categoriaDe('p2')).igual('Bichos');
    esperar(existe(obter().categorias, 'Pets')).falso();
  });

  isso('renomear muda nas regras que usam', () => {
    reiniciar();
    importar([lancamentoDe('PETSHOP AMIGO FIEL', '-90,00', 'p3')]);
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'PETSHOP', categoria: 'Pets' });
    despachar(ACOES.RENOMEAR_CATEGORIA, { de: 'Pets', para: 'Bichos' });

    const minhaRegra = obter().regras.find((regra) => regra.termo === 'PETSHOP');
    esperar(minhaRegra.categoria).igual('Bichos');
    esperar(categoriaDe('p3')).igual('Bichos');
  });

  isso('remover com destino move os lancamentos', () => {
    reiniciar();
    importar([lancamentoDe('PETSHOP AMIGO FIEL', '-90,00', 'p4')]);
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['p4'], categoria: 'Pets' });
    despachar(ACOES.REMOVER_CATEGORIA, { nome: 'Pets', destino: 'Outros' });

    esperar(categoriaDe('p4')).igual('Outros');
    esperar(existe(obter().categorias, 'Pets')).falso();
  });

  isso('remover para sem categoria devolve o lancamento para as regras', () => {
    reiniciar();
    importar([lancamentoDe('NETFLIX.COM', '-44,90', 'n1')]);
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.DEFINIR_CATEGORIA, { ids: ['n1'], categoria: 'Pets' });
    despachar(ACOES.REMOVER_CATEGORIA, { nome: 'Pets', destino: CATEGORIA_SEM_CLASSIFICACAO });

    esperar(categoriaDe('n1')).igual('Assinaturas');
  });

  isso('remover categoria usada por regra, mandando para sem categoria, tira a regra', () => {
    reiniciar();
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'PETSHOP', categoria: 'Pets' });
    despachar(ACOES.REMOVER_CATEGORIA, { nome: 'Pets', destino: CATEGORIA_SEM_CLASSIFICACAO });

    esperar(obter().regras.some((regra) => regra.categoria === 'Pets')).falso();
  });

  isso('categoria criada sobrevive a abrir o cofre de novo', () => {
    reiniciar();
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    const guardadas = obter().categorias;

    reiniciar();
    despachar(ACOES.CARREGAR_DADOS, { lancamentos: [], regras: [], categorias: guardadas });

    esperar(existe(obter().categorias, 'Pets')).verdadeiro();
  });

  isso('nao categorizado nao some do catalogo', () => {
    reiniciar();
    despachar(ACOES.CRIAR_CATEGORIA, 'Pets');
    despachar(ACOES.REMOVER_CATEGORIA, { nome: CATEGORIA_SEM_CLASSIFICACAO, destino: 'Outros' });

    esperar(existe(obter().categorias, CATEGORIA_SEM_CLASSIFICACAO)).verdadeiro();
  });
});

descrever('Ordenação da planilha', () => {
  const lancamentos = [
    { id: 'a', valor: -2000, categoria: 'Mercado', data: '2026-09-10' },
    { id: 'b', valor: 420000, categoria: 'Outros', data: '2026-09-05' },
    { id: 'c', valor: -15000, categoria: CATEGORIA_SEM_CLASSIFICACAO, data: '2026-09-20' },
    { id: 'd', valor: 1000, categoria: CATEGORIA_SEM_CLASSIFICACAO, data: '2026-09-01' }
  ];

  isso('do maior para o menor valor, a maior entrada vem primeiro mesmo com categoria', () => {
    const ordenados = ordenarLancamentos(lancamentos, { campo: 'valor', ascendente: false });
    esperar(ordenados.map((item) => item.id)).igual(['b', 'd', 'a', 'c']);
  });

  isso('do menor para o maior, a maior saida vem primeiro', () => {
    const ordenados = ordenarLancamentos(lancamentos, { campo: 'valor', ascendente: true });
    esperar(ordenados.map((item) => item.id)).igual(['c', 'a', 'd', 'b']);
  });

  isso('entradas e saidas nao se intercalam por acidente', () => {
    const valores = ordenarLancamentos(lancamentos, { campo: 'valor', ascendente: false }).map(
      (item) => item.valor
    );
    const positivos = valores.filter((valor) => valor > 0);
    esperar(valores.slice(0, positivos.length).every((valor) => valor > 0)).verdadeiro();
  });

  isso('ordenar por data nao reordena por categoria', () => {
    const ordenados = ordenarLancamentos(lancamentos, { campo: 'data', ascendente: true });
    esperar(ordenados.map((item) => item.id)).igual(['d', 'b', 'a', 'c']);
  });

  isso('ordenar nao muda quais lancamentos aparecem', () => {
    const ordenados = ordenarLancamentos(lancamentos, { campo: 'valor', ascendente: false });
    esperar(ordenados.length).igual(lancamentos.length);
    esperar([...ordenados].map((item) => item.id).sort()).igual(['a', 'b', 'c', 'd']);
  });

  isso('a lista original nao e alterada', () => {
    ordenarLancamentos(lancamentos, { campo: 'valor', ascendente: true });
    esperar(lancamentos.map((item) => item.id)).igual(['a', 'b', 'c', 'd']);
  });
});
