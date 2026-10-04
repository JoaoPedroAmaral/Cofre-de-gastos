import { criarElemento } from './componentes.js';

const ESPACO_SVG = 'http://www.w3.org/2000/svg';

const ANEL = Object.freeze({
  TAMANHO: 320,
  CENTRO: 200,
  CAIXA: 400,
  RAIO_EXTERNO: 164,
  PASSO: 22,
  ESPESSURA: 10,
  FAIXAS: 4,
  RAIO_PONTILHADO: 194,
  TRACEJADO: '1.5 8.66'
});

const BARRA_MES = Object.freeze({
  ALTURA: 96,
  LARGURA: 36,
  MINIMA: 6,
  RAIO: 6
});

const CIRCUNFERENCIA = 2 * Math.PI;
const SERIES = ['--serie-1', '--serie-2', '--serie-3', '--serie-4'];

export function anelCategorias(categorias) {
  const svg = elemento('svg', {
    width: ANEL.TAMANHO,
    height: ANEL.TAMANHO,
    viewBox: `0 0 ${ANEL.CAIXA} ${ANEL.CAIXA}`,
    role: 'img',
    'aria-label': rotuloDoAnel(categorias)
  });

  svg.append(
    elemento('circle', {
      cx: ANEL.CENTRO,
      cy: ANEL.CENTRO,
      r: ANEL.RAIO_PONTILHADO,
      fill: 'none',
      stroke: 'var(--cor-linha-forte)',
      'stroke-width': 4,
      'stroke-dasharray': ANEL.TRACEJADO
    })
  );

  categorias.slice(0, ANEL.FAIXAS).forEach((fatia, indice) => {
    const raio = ANEL.RAIO_EXTERNO - indice * ANEL.PASSO;
    const perimetro = CIRCUNFERENCIA * raio;

    svg.append(
      elemento('circle', {
        cx: ANEL.CENTRO,
        cy: ANEL.CENTRO,
        r: raio,
        fill: 'none',
        stroke: 'var(--cor-superficie-alta)',
        'stroke-width': ANEL.ESPESSURA
      }),
      elemento('circle', {
        cx: ANEL.CENTRO,
        cy: ANEL.CENTRO,
        r: raio,
        fill: 'none',
        stroke: `var(${SERIES[indice]})`,
        'stroke-width': ANEL.ESPESSURA,
        'stroke-linecap': 'round',
        'stroke-dasharray': `${perimetro * fatia.participacao} ${perimetro}`,
        transform: `rotate(-90 ${ANEL.CENTRO} ${ANEL.CENTRO})`,
        class: 'anel__fatia'
      })
    );
  });

  return svg;
}

export function barrasMensais(meses, mesAtivo) {
  const maior = meses.reduce((maximo, item) => Math.max(maximo, item.total), 0);

  return meses.map((item) => {
    const barra = criarElemento('span', {
      class: item.mes === mesAtivo ? 'barra-mes barra-mes--ativa' : 'barra-mes'
    });

    barra.style.height = `${alturaDaBarra(item.total, maior)}px`;
    barra.style.width = `${BARRA_MES.LARGURA}px`;
    barra.style.borderRadius = `${BARRA_MES.RAIO}px`;

    return barra;
  });
}

function alturaDaBarra(valor, maior) {
  if (maior === 0) {
    return BARRA_MES.MINIMA;
  }
  return Math.max(BARRA_MES.MINIMA, Math.round((valor / maior) * BARRA_MES.ALTURA));
}

function rotuloDoAnel(categorias) {
  if (categorias.length === 0) {
    return 'Sem gastos no período';
  }
  return categorias
    .slice(0, ANEL.FAIXAS)
    .map((fatia) => `${fatia.categoria}: ${Math.round(fatia.participacao * 100)}%`)
    .join(', ');
}

function elemento(etiqueta, atributos) {
  const criado = document.createElementNS(ESPACO_SVG, etiqueta);
  Object.entries(atributos).forEach(([nome, valor]) => criado.setAttribute(nome, String(valor)));
  return criado;
}
