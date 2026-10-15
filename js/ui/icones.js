const ESPACO_SVG = 'http://www.w3.org/2000/svg';

const TRACOS = Object.freeze({
  painel: ['M12 12l4-3'],
  planilha: ['M4 6h16M4 12h16M4 18h16'],
  importar: ['M12 4v11M7 10l5 5 5-5M5 20h14'],
  regras: ['M4 12h5M9 12l5-5M9 12l5 5'],
  exportar: ['M12 15V4M7 9l5-5 5 5M5 20h14'],
  ajustes: ['M5 8h8M17 8h2M5 16h2M11 16h8'],
  travar: ['M8 11V7a4 4 0 0 1 8 0v4'],
  privacidade: ['M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z'],
  tema: ['M12 4a8 8 0 0 0 0 16z'],
  anterior: ['M15 6l-6 6 6 6'],
  proximo: ['M9 6l6 6-6 6'],
  busca: ['M20 20l-3.5-3.5'],
  confirmado: ['M5 12l5 5 9-10'],
  falhou: ['M7 7l10 10M17 7L7 17'],
  subir: ['M36 46V27M28 34l8-8 8 8']
});

const CIRCULOS = Object.freeze({
  painel: [{ cx: 12, cy: 12, r: 8 }],
  regras: [
    { cx: 16, cy: 7, r: 2 },
    { cx: 16, cy: 17, r: 2 }
  ],
  tema: [{ cx: 12, cy: 12, r: 8 }],
  busca: [{ cx: 11, cy: 11, r: 7 }],
  ajustes: [
    { cx: 15, cy: 8, r: 2 },
    { cx: 9, cy: 16, r: 2 }
  ]
});

const RETANGULOS = Object.freeze({
  travar: [{ x: 5, y: 11, width: 14, height: 10, rx: 2 }]
});

const MARCA = Object.freeze({
  centro: 22,
  raioDoAnel: 14,
  larguraDoAnel: 3.5,
  raioDoMiolo: 5.2,
  inicioDaTrava: 8.8,
  fimDaTrava: 11.5,
  larguraDaTrava: 2.7
});

const DIRECOES_DAS_TRAVAS = Object.freeze([
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
]);

export function icone(nome, tamanho = 22) {
  const svg = elementoSvg('svg', {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true'
  });

  (RETANGULOS[nome] || []).forEach((atributos) => svg.append(elementoSvg('rect', atributos)));
  (CIRCULOS[nome] || []).forEach((atributos) => svg.append(elementoSvg('circle', atributos)));
  (TRACOS[nome] || []).forEach((desenho) => svg.append(elementoSvg('path', { d: desenho })));

  return svg;
}

export function marca(tamanho = 40) {
  const svg = elementoSvg('svg', {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 44 44',
    'aria-hidden': 'true'
  });

  svg.append(
    elementoSvg('circle', {
      cx: MARCA.centro,
      cy: MARCA.centro,
      r: MARCA.raioDoAnel,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': MARCA.larguraDoAnel
    }),
    elementoSvg('circle', {
      cx: MARCA.centro,
      cy: MARCA.centro,
      r: MARCA.raioDoMiolo,
      fill: 'currentColor'
    }),
    ...DIRECOES_DAS_TRAVAS.map(travaDaMarca)
  );

  return svg;
}

function travaDaMarca([direcaoX, direcaoY]) {
  return elementoSvg('line', {
    x1: MARCA.centro + MARCA.inicioDaTrava * direcaoX,
    y1: MARCA.centro + MARCA.inicioDaTrava * direcaoY,
    x2: MARCA.centro + MARCA.fimDaTrava * direcaoX,
    y2: MARCA.centro + MARCA.fimDaTrava * direcaoY,
    stroke: 'currentColor',
    'stroke-width': MARCA.larguraDaTrava,
    'stroke-linecap': 'round'
  });
}

export function alvoUpload(tamanho = 72) {
  const svg = elementoSvg('svg', {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 72 72',
    'aria-hidden': 'true'
  });

  svg.append(
    elementoSvg('circle', {
      cx: 36,
      cy: 36,
      r: 34,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-dasharray': '1.5 7.4',
      opacity: '0.35'
    }),
    elementoSvg('circle', { cx: 36, cy: 36, r: 24, fill: 'currentColor', opacity: '0.1' }),
    elementoSvg('path', {
      d: TRACOS.subir[0],
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2.4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    })
  );

  return svg;
}

function elementoSvg(etiqueta, atributos) {
  const elemento = document.createElementNS(ESPACO_SVG, etiqueta);
  Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, String(valor)));
  return elemento;
}
