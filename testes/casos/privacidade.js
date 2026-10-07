import { descrever, esperar, isso } from '../runner.js';
import { ENDERECO_DO_TERMO, TERMO } from '../../js/privacidade/termo.js';
import { secoesDoTermo, versaoDoTermo } from '../../js/privacidade/conteudo.js';
import { CLASSE_DA_COLUNA, corpoDoTermo } from '../../js/privacidade/corpo.js';
import { telaPrivacidade } from '../../js/ui/privacidade.js';

const PADRAO_DE_DATA = /^\d{4}-\d{2}-\d{2}$/;

function textoDe(elemento) {
  return elemento.textContent ?? '';
}

function titulosDas(secoes) {
  return secoes.map((secao) => secao.querySelector('h2').textContent);
}

function criarSimples(etiqueta, atributos = {}, filhos = []) {
  const elemento = document.createElement(etiqueta);
  Object.entries(atributos).forEach(([nome, valor]) => {
    if (nome === 'texto') {
      elemento.textContent = valor;
      return;
    }
    elemento.setAttribute(nome, valor);
  });
  filhos.filter(Boolean).forEach((filho) => elemento.append(filho));
  return elemento;
}

function paginaPublica() {
  return criarSimples('main', { class: CLASSE_DA_COLUNA }, corpoDoTermo(criarSimples));
}

function colunaDaTelaInterna() {
  return telaPrivacidade().querySelector(`.${CLASSE_DA_COLUNA}`);
}

function esqueletoDe(raiz) {
  return [...raiz.querySelectorAll('h1, h2, p')]
    .map((no) => `${no.tagName}:${no.className}`)
    .join(' | ');
}

descrever('Termo de privacidade', () => {
  isso('tem versao e data de atualizacao', () => {
    esperar(TERMO.versao.length > 0).verdadeiro();
    esperar(PADRAO_DE_DATA.test(TERMO.atualizadoEm)).verdadeiro();
  });

  isso('a versao aparece escrita para quem le', () => {
    esperar(versaoDoTermo()).contem(TERMO.versao);
    esperar(versaoDoTermo()).contem('atualizado em');
  });

  isso('diz o que o sistema faz, onde os dados ficam, o custo e como apagar', () => {
    const titulos = TERMO.secoes.map((secao) => secao.titulo).join(' | ');
    esperar(titulos).contem('O que sai do seu dispositivo');
    esperar(titulos).contem('Onde seus dados ficam');
    esperar(titulos).contem('O que isso custa a você');
    esperar(titulos).contem('Como apagar tudo');
  });

  isso('fala do que voce cadastra sobre si, que a fase 1 acrescentou', () => {
    const corpo = TERMO.secoes.flatMap((secao) => secao.paragrafos).join(' ');
    esperar(corpo).contem('cifrado dentro do cofre');
  });

  isso('nenhuma secao fica sem texto', () => {
    const vazias = TERMO.secoes.filter((secao) => secao.paragrafos.length === 0);
    esperar(vazias.length).igual(0);
  });

  isso('a pagina publica tem endereco proprio', () => {
    esperar(ENDERECO_DO_TERMO).igual('/privacidade.html');
  });

  isso('a tela interna mostra as mesmas secoes do termo, na mesma ordem', () => {
    const daTela = titulosDas([...telaPrivacidade().querySelectorAll('.secao-texto')]);
    const doTermo = TERMO.secoes.map((secao) => secao.titulo);

    esperar(daTela).igual(doTermo);
  });

  isso('a tela interna leva para a pagina publica', () => {
    const link = telaPrivacidade().querySelector(`a[href="${ENDERECO_DO_TERMO}"]`);
    esperar(Boolean(link)).verdadeiro();
  });

  isso('o corpo e o mesmo dentro e fora do cofre, no mesmo esqueleto', () => {
    const dentro = colunaDaTelaInterna();
    const fora = paginaPublica();
    const soDoTermo = (raiz) => {
      const copia = raiz.cloneNode(true);
      copia.querySelectorAll('.faixa-publica').forEach((faixa) => faixa.remove());
      return esqueletoDe(copia);
    };

    esperar(soDoTermo(dentro)).igual(soDoTermo(fora));
  });

  isso('o texto do termo e identico nos dois lugares', () => {
    const limpar = (raiz) => {
      const copia = raiz.cloneNode(true);
      copia.querySelectorAll('.faixa-publica').forEach((faixa) => faixa.remove());
      return copia.textContent;
    };

    esperar(limpar(colunaDaTelaInterna())).igual(limpar(paginaPublica()));
  });

  isso('os dois lugares usam a mesma coluna de leitura', () => {
    esperar(Boolean(colunaDaTelaInterna())).verdadeiro();
    esperar(paginaPublica().classList.contains(CLASSE_DA_COLUNA)).verdadeiro();
  });

  isso('acrescentar uma secao ao termo aparece nos dois sem tocar nos montadores', () => {
    const dentro = titulosDas([...colunaDaTelaInterna().querySelectorAll('.secao-texto')]);
    const fora = titulosDas([...paginaPublica().querySelectorAll('.secao-texto')]);

    esperar(dentro).igual(fora);
    esperar(dentro.length).igual(TERMO.secoes.length);
  });

  isso('a faixa do endereco publico so existe na tela interna', () => {
    esperar(Boolean(colunaDaTelaInterna().querySelector('.faixa-publica'))).verdadeiro();
    esperar(Boolean(paginaPublica().querySelector('.faixa-publica'))).falso();
  });

  isso('a pagina publica nao tem campo nenhum', () => {
    esperar(paginaPublica().querySelectorAll('input, select, textarea').length).igual(0);
  });

  isso('o montador de secoes devolve uma secao por assunto', () => {
    const secoes = secoesDoTermo((etiqueta, atributos = {}, filhos = []) => {
      const elemento = document.createElement(etiqueta);
      if (atributos.texto) {
        elemento.textContent = atributos.texto;
      }
      filhos.filter(Boolean).forEach((filho) => elemento.append(filho));
      return elemento;
    });

    esperar(secoes.length).igual(TERMO.secoes.length);
    esperar(textoDe(secoes[0])).contem(TERMO.secoes[0].titulo);
  });
});
