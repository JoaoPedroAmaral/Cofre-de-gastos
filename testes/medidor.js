import { ACOES, TELAS } from '../js/nucleo/constantes.js';
import { despachar } from '../js/estado/store.js';
import { desmontarLayout, montarLayout, registrarTela } from '../js/ui/layout.js';
import { telaImportar } from '../js/ui/upload.js';
import { atualizarPlanilha, telaPlanilha } from '../js/ui/planilha.js';
import { telaRegras } from '../js/ui/regras.js';
import { atualizarPainel, telaPainel } from '../js/ui/painel.js';
import { telaExportar } from '../js/ui/exportar.js';
import { telaAjustes } from '../js/ui/ajustes.js';
import { telaPrivacidade } from '../js/ui/privacidade.js';

const FOLHAS_DE_ESTILO = Object.freeze([
  '../css/base.css',
  '../css/tema.css',
  '../css/componentes.css',
  '../css/responsivo.css'
]);
const ID_DA_RAIZ = 'app';
const ALTURA_DA_JANELA = 780;
const ALTURA_DEITADA = 400;
const TOLERANCIA = 1;
const ESTILO_DA_MOLDURA =
  'position: fixed; top: 0; left: 0; z-index: -1; border: 0; opacity: 0; pointer-events: none;';

export const LARGURAS_DE_REFERENCIA = Object.freeze([320, 360, 390, 414, 480, 768, 1024, 1280, 1440]);
export const LARGURA_MINIMA = LARGURAS_DE_REFERENCIA[0];
export const LARGURA_ESTREITA = 360;
export const LARGURA_DE_CELULAR = 390;

let promessaDaMoldura = null;
let telasRegistradas = false;

export async function medirTela(largura, tela, verificar, preparar = null) {
  registrarTelas();

  const quadro = await moldura();
  dimensionar(quadro, largura, ALTURA_DA_JANELA);

  const raiz = raizDa(quadro);

  if (preparar) {
    preparar();
  }
  despachar(ACOES.TROCAR_TELA, tela);
  montarLayout(raiz);

  try {
    await proximoDesenho(quadro.contentWindow);
    return await verificar(contexto(quadro));
  } finally {
    desmontarLayout(raiz);
  }
}

export async function medirElemento(largura, construir, verificar, altura = ALTURA_DA_JANELA) {
  const quadro = await moldura();
  dimensionar(quadro, largura, altura);

  const raiz = raizDa(quadro);
  raiz.append(construir());

  try {
    await proximoDesenho(quadro.contentWindow);
    return await verificar(contexto(quadro));
  } finally {
    raiz.replaceChildren();
  }
}

export function medirDeitado(largura, construir, verificar) {
  return medirElemento(largura, construir, verificar, ALTURA_DEITADA);
}

function contexto(quadro) {
  const documento = quadro.contentDocument;
  const rolagem = documento.scrollingElement;
  const largura = rolagem.clientWidth;

  return {
    documento,
    largura,
    altura: quadro.contentWindow.innerHeight,
    estouro: rolagem.scrollWidth - rolagem.clientWidth,
    estilo: (seletor) => quadro.contentWindow.getComputedStyle(exigir(documento, seletor)),
    elemento: (seletor) => documento.querySelector(seletor),
    elementos: (seletor) => [...documento.querySelectorAll(seletor)],
    caixa: (seletor) => exigir(documento, seletor).getBoundingClientRect(),
    caixas: (seletor) => [...documento.querySelectorAll(seletor)].map((no) => no.getBoundingClientRect()),
    cabeNaLargura: (caixa) => caixa.left >= -TOLERANCIA && caixa.right <= largura + TOLERANCIA,
    rolaNaHorizontal: (elemento) => temTrilhaDeRolagem(quadro.contentWindow, elemento),
    aoFimDaRolagem: () => rolarAteOFim(quadro.contentWindow, rolagem)
  };
}

function temTrilhaDeRolagem(janela, elemento) {
  for (let atual = elemento.parentElement; atual; atual = atual.parentElement) {
    const transbordo = janela.getComputedStyle(atual).overflowX;
    if (transbordo === 'auto' || transbordo === 'scroll') {
      return true;
    }
  }
  return false;
}

function rolarAteOFim(janela, rolagem) {
  janela.scrollTo(0, rolagem.scrollHeight);
  return proximoDesenho(janela);
}

function exigir(documento, seletor) {
  const encontrado = documento.querySelector(seletor);
  if (!encontrado) {
    throw new Error(`nenhum elemento casa com ${seletor} na moldura`);
  }
  return encontrado;
}

function moldura() {
  if (promessaDaMoldura) {
    return promessaDaMoldura;
  }

  promessaDaMoldura = montarMoldura();
  return promessaDaMoldura;
}

async function montarMoldura() {
  const quadro = document.createElement('iframe');
  quadro.setAttribute('title', 'Moldura de medição');
  quadro.setAttribute('style', ESTILO_DA_MOLDURA);
  document.body.append(quadro);

  const documento = quadro.contentDocument;
  if (!documento) {
    throw new Error('a moldura de medição não abriu');
  }

  const raiz = documento.createElement('div');
  raiz.id = ID_DA_RAIZ;
  documento.body.append(raiz);

  await Promise.all(FOLHAS_DE_ESTILO.map((caminho) => ligarFolha(documento, caminho)));
  return quadro;
}

function ligarFolha(documento, caminho) {
  return new Promise((resolver, rejeitar) => {
    const folha = documento.createElement('link');
    folha.rel = 'stylesheet';
    folha.href = new URL(caminho, document.baseURI).href;
    folha.addEventListener('load', () => resolver(), { once: true });
    folha.addEventListener('error', () => rejeitar(new Error(`a folha ${caminho} não carregou`)), {
      once: true
    });
    documento.head.append(folha);
  });
}

function dimensionar(quadro, largura, altura) {
  quadro.style.width = `${largura}px`;
  quadro.style.height = `${altura}px`;
}

function raizDa(quadro) {
  const raiz = quadro.contentDocument.getElementById(ID_DA_RAIZ);
  if (!raiz) {
    throw new Error('a moldura de medição não tem elemento raiz');
  }
  return raiz;
}

function proximoDesenho(janela) {
  return new Promise((resolver) => {
    janela.requestAnimationFrame(() => janela.requestAnimationFrame(() => resolver()));
  });
}

function registrarTelas() {
  if (telasRegistradas) {
    return;
  }

  registrarTela(TELAS.IMPORTAR, telaImportar);
  registrarTela(TELAS.PLANILHA, { montar: telaPlanilha, atualizar: atualizarPlanilha });
  registrarTela(TELAS.REGRAS, telaRegras);
  registrarTela(TELAS.PAINEL, { montar: telaPainel, atualizar: atualizarPainel });
  registrarTela(TELAS.EXPORTAR, telaExportar);
  registrarTela(TELAS.AJUSTES, telaAjustes);
  registrarTela(TELAS.PRIVACIDADE, telaPrivacidade);

  telasRegistradas = true;
}
