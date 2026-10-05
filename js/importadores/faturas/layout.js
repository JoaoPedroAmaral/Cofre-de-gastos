const TOLERANCIA_MESMA_LINHA = 2;
const LARGURA_MINIMA_ESPACO = 1;
const ESPACOS_REPETIDOS = /\s+/g;
const ESPACO = ' ';
const TEXTO_VAZIO = '';

export function normalizarItens(itens) {
  return itens
    .filter((item) => String(item.str).trim() !== TEXTO_VAZIO)
    .map((item) => ({
      texto: String(item.str).trim(),
      esquerda: esquerdaDe(item),
      direita: esquerdaDe(item) + larguraDe(item),
      base: baseDe(item)
    }));
}

export function agruparEmLinhas(itens) {
  const comTexto = itens.filter((item) => String(item.str).trim() !== TEXTO_VAZIO);

  const agrupadas = comTexto.reduce((linhas, item) => {
    const existente = linhas.find((linha) => Math.abs(linha.base - baseDe(item)) <= TOLERANCIA_MESMA_LINHA);
    if (existente) {
      existente.itens.push(item);
      return linhas;
    }
    return [...linhas, { base: baseDe(item), itens: [item] }];
  }, []);

  return agrupadas
    .sort((uma, outra) => outra.base - uma.base)
    .map(montarTexto)
    .filter((linha) => linha !== TEXTO_VAZIO);
}

function montarTexto(linha) {
  const ordenados = [...linha.itens].sort((um, outro) => esquerdaDe(um) - esquerdaDe(outro));

  return ordenados
    .reduce((texto, item, indice) => {
      if (indice === 0) {
        return String(item.str);
      }
      const anterior = ordenados[indice - 1];
      const vao = esquerdaDe(item) - (esquerdaDe(anterior) + larguraDe(anterior));
      const separador = vao > LARGURA_MINIMA_ESPACO ? ESPACO : TEXTO_VAZIO;
      return `${texto}${separador}${item.str}`;
    }, TEXTO_VAZIO)
    .replace(ESPACOS_REPETIDOS, ESPACO)
    .trim();
}

function baseDe(item) {
  return item.transform[5];
}

function esquerdaDe(item) {
  return item.transform[4];
}

function larguraDe(item) {
  return item.width || 0;
}
