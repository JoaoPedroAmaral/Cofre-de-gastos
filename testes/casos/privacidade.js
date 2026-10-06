import { descrever, esperar, isso } from '../runner.js';
import { ENDERECO_DO_TERMO, TERMO } from '../../js/privacidade/termo.js';
import { secoesDoTermo, versaoDoTermo } from '../../js/privacidade/conteudo.js';
import { telaPrivacidade } from '../../js/ui/privacidade.js';

const PADRAO_DE_DATA = /^\d{4}-\d{2}-\d{2}$/;

function textoDe(elemento) {
  return elemento.textContent ?? '';
}

function titulosDas(secoes) {
  return secoes.map((secao) => secao.querySelector('h2').textContent);
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
