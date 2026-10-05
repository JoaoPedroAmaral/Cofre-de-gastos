const TOLERANCIA_MESMA_LINHA = 3;
const SEM_LIMITE = Infinity;
const METADE = 2;

export function descobrirColunas(itens, nomes) {
  const cabecalho = acharCabecalho(itens, nomes);
  if (!cabecalho) {
    return null;
  }

  const ordenados = [...cabecalho].sort((um, outro) => um.esquerda - outro.esquerda);

  return ordenados.map((item, indice) => ({
    nome: item.texto,
    inicio: indice === 0 ? -SEM_LIMITE : fronteira(ordenados[indice - 1], item),
    fim: indice === ordenados.length - 1 ? SEM_LIMITE : fronteira(item, ordenados[indice + 1])
  }));
}

export function daColuna(colunas, nome, itens) {
  const coluna = colunas.find((candidata) => candidata.nome === nome);
  if (!coluna) {
    return [];
  }
  return itens.filter((item) => item.esquerda >= coluna.inicio && item.esquerda < coluna.fim);
}

function acharCabecalho(itens, nomes) {
  const linhas = agruparPorAltura(itens);
  const completa = linhas.find((linha) =>
    nomes.every((nome) => linha.some((item) => item.texto === nome))
  );
  if (!completa) {
    return null;
  }
  return nomes.map((nome) => completa.find((item) => item.texto === nome));
}

function agruparPorAltura(itens) {
  return itens.reduce((linhas, item) => {
    const existente = linhas.find((linha) => Math.abs(linha[0].base - item.base) <= TOLERANCIA_MESMA_LINHA);
    if (existente) {
      existente.push(item);
      return linhas;
    }
    return [...linhas, [item]];
  }, []);
}

function fronteira(um, outro) {
  return (um.esquerda + outro.esquerda) / METADE;
}
