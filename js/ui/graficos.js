import { criarElemento } from './componentes.js';
import { formatarMesCurto } from './formato.js';

const ESPACO_SVG = 'http://www.w3.org/2000/svg';
const PERCENTUAL_CHEIO = 100;

const ANEL = Object.freeze({
  CENTRO: 200,
  CAIXA: 400,
  RAIO_EXTERNO: 164,
  PASSO: 22,
  ESPESSURA: 10,
  FAIXAS: 4,
  RAIO_PONTILHADO: 194,
  TRACEJADO: '1.5 8.66'
});

const ALTURA_MINIMA_DA_BARRA = 6;

const CIRCUNFERENCIA = 2 * Math.PI;
const SERIES = ['--serie-1', '--serie-2', '--serie-3', '--serie-4'];

export function anelCategorias(categorias) {
  const svg = elemento('svg', {
    viewBox: `0 0 ${ANEL.CAIXA} ${ANEL.CAIXA}`,
    preserveAspectRatio: 'xMidYMid meet',
    class: 'anel__grafico',
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

  return meses.flatMap((item) => [barraDoMes(item, maior, mesAtivo), rotuloDoMes(item, mesAtivo)]);
}

function barraDoMes(item, maior, mesAtivo) {
  const barra = criarElemento('span', {
    class: item.mes === mesAtivo ? 'barra-mes barra-mes--ativa' : 'barra-mes'
  });

  barra.style.height = `${alturaDaBarra(item.total, maior)}%`;
  return barra;
}

function rotuloDoMes(item, mesAtivo) {
  return criarElemento('span', {
    class: item.mes === mesAtivo ? 'barras__rotulo barras__rotulo--ativo' : 'barras__rotulo',
    texto: formatarMesCurto(item.mes)
  });
}

function alturaDaBarra(valor, maior) {
  if (maior === 0) {
    return ALTURA_MINIMA_DA_BARRA;
  }
  return Math.max(ALTURA_MINIMA_DA_BARRA, Math.round((valor / maior) * PERCENTUAL_CHEIO));
}

function rotuloDoAnel(categorias) {
  if (categorias.length === 0) {
    return 'Sem gastos no período';
  }
  return categorias
    .slice(0, ANEL.FAIXAS)
    .map((fatia) => `${fatia.categoria}: ${Math.round(fatia.participacao * PERCENTUAL_CHEIO)}%`)
    .join(', ');
}

function elemento(etiqueta, atributos) {
  const criado = document.createElementNS(ESPACO_SVG, etiqueta);
  Object.entries(atributos).forEach(([nome, valor]) => criado.setAttribute(nome, String(valor)));
  return criado;
}
