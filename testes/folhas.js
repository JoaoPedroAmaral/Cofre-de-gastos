const PADRAO_DE_LARGURA = /width/;
const CONSULTA_DE_TOQUE = 'hover: none';
const PADRAO_DE_VARIAVEL = /var\((--[a-z-]+)\)/;

export function folhasComConsultaDeLargura(documento) {
  return [...documento.styleSheets].filter((folha) => contarConsultasDeLargura(folha) > 0);
}

export function pontosDeQuebra(documento) {
  return consultasDeLargura(folhaResponsiva(documento));
}

export function alvosDeToque(documento) {
  return [...folhaResponsiva(documento).cssRules]
    .filter((regra) => regra.media && regra.conditionText.includes(CONSULTA_DE_TOQUE))
    .flatMap((consulta) => [...consulta.cssRules])
    .filter((regra) => regra.style.minHeight)
    .map((regra) => ({
      seletor: regra.selectorText,
      medida: medidaEmPixel(documento, regra.style.minHeight)
    }));
}

function folhaResponsiva(documento) {
  const folha = folhasComConsultaDeLargura(documento)[0];
  if (!folha) {
    throw new Error('nenhuma folha de estilo declara consulta de largura');
  }
  return folha;
}

function consultasDeLargura(folha) {
  return [...folha.cssRules]
    .filter((regra) => regra.media && PADRAO_DE_LARGURA.test(regra.conditionText))
    .map((regra) => regra.conditionText);
}

function contarConsultasDeLargura(folha) {
  try {
    return consultasDeLargura(folha).length;
  } catch {
    return 0;
  }
}

function medidaEmPixel(documento, valor) {
  const direto = Number.parseFloat(valor);
  if (!Number.isNaN(direto)) {
    return direto;
  }

  const referencia = PADRAO_DE_VARIAVEL.exec(valor);
  if (!referencia) {
    return Number.NaN;
  }

  const raiz = documento.defaultView.getComputedStyle(documento.documentElement);
  return Number.parseFloat(raiz.getPropertyValue(referencia[1]));
}
