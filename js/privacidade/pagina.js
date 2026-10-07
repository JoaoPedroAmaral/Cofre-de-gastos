import { TERMO } from './termo.js';
import { CLASSE_DA_COLUNA, corpoDoTermo } from './corpo.js';

const ATRIBUTO_TEXTO = 'texto';
const ID_DO_CONTEUDO = 'termo';
const ENDERECO_DO_SISTEMA = '/';
const ESPACO_SVG = 'http://www.w3.org/2000/svg';

const TEXTOS = Object.freeze({
  SISTEMA: 'Gastos Controller',
  VOLTAR: 'Ir para o sistema',
  RODAPE: 'Este termo vale para a versão publicada neste endereço.'
});

function criar(etiqueta, atributos = {}, filhos = []) {
  const elemento = document.createElement(etiqueta);

  Object.entries(atributos).forEach(([nome, valor]) => {
    if (valor === null || valor === undefined) {
      return;
    }
    if (nome === ATRIBUTO_TEXTO) {
      elemento.textContent = valor;
      return;
    }
    elemento.setAttribute(nome, valor);
  });

  filhos.filter(Boolean).forEach((filho) => elemento.append(filho));
  return elemento;
}

function marca() {
  const svg = document.createElementNS(ESPACO_SVG, 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('viewBox', '0 0 44 44');
  svg.setAttribute('aria-hidden', 'true');

  const anel = document.createElementNS(ESPACO_SVG, 'circle');
  anel.setAttribute('cx', '22');
  anel.setAttribute('cy', '22');
  anel.setAttribute('r', '19');
  anel.setAttribute('fill', 'none');
  anel.setAttribute('stroke', 'currentColor');
  anel.setAttribute('stroke-width', '2');

  const centro = document.createElementNS(ESPACO_SVG, 'circle');
  centro.setAttribute('cx', '22');
  centro.setAttribute('cy', '22');
  centro.setAttribute('r', '9');
  centro.setAttribute('fill', 'currentColor');

  svg.append(anel, centro);
  return svg;
}

function cabecalho() {
  return criar('header', { class: 'pagina__cabecalho' }, [
    criar('a', { class: 'pagina__marca', href: ENDERECO_DO_SISTEMA, 'aria-label': TEXTOS.SISTEMA }, [
      marca(),
      criar('span', { texto: TEXTOS.SISTEMA })
    ]),
    criar('a', { class: 'botao', href: ENDERECO_DO_SISTEMA, texto: TEXTOS.VOLTAR })
  ]);
}

function rodape() {
  return criar('footer', { class: 'pagina__rodape' }, [
    criar('span', { class: 'fraco', texto: TEXTOS.RODAPE })
  ]);
}

function montar() {
  const destino = document.getElementById(ID_DO_CONTEUDO);
  if (!destino) {
    return;
  }

  destino.replaceChildren(
    cabecalho(),
    criar('main', { class: `pagina__conteudo ${CLASSE_DA_COLUNA}`, id: 'conteudo' }, corpoDoTermo(criar)),
    rodape()
  );

  document.title = `${TERMO.titulo} · ${TEXTOS.SISTEMA}`;
}

montar();
