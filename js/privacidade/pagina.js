import { TERMO } from './termo.js';
import { secoesDoTermo, versaoDoTermo } from './conteudo.js';

const TEXTO_VAZIO = '';
const ATRIBUTO_TEXTO = 'texto';
const ID_DO_CONTEUDO = 'termo';

const TEXTOS = Object.freeze({
  VOLTAR: 'Ir para o sistema'
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

function montar() {
  const destino = document.getElementById(ID_DO_CONTEUDO);
  if (!destino) {
    return;
  }

  destino.replaceChildren(
    criar('div', { class: 'titulo-tela' }, [
      criar('h1', { texto: TERMO.titulo }),
      criar('p', { class: 'titulo-tela__texto', texto: TERMO.resumo })
    ]),
    criar('p', { class: 'privacidade', texto: TERMO.nota }),
    criar('p', { class: 'fraco', texto: versaoDoTermo() }),
    ...secoesDoTermo(criar),
    criar('p', {}, [criar('a', { class: 'botao botao--discreto', href: '/', texto: TEXTOS.VOLTAR })])
  );

  document.title = `${TERMO.titulo} · Gastos Controller`;
}

montar();

export const CONTEUDO_MONTADO = TEXTO_VAZIO;
