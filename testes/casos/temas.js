import { descrever, esperar, isso } from '../runner.js';
import {
  ACOES,
  DESCRICOES_TEMA,
  ORDEM_TEMAS,
  ROTULOS_TEMA,
  TEMAS
} from '../../js/nucleo/constantes.js';
import { secaoTemas } from '../../js/ui/temas.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';

const TEMAS_ESCOLHIVEIS = Object.values(TEMAS).filter((tema) => tema !== TEMAS.SISTEMA);

function escolhaDeTema() {
  return secaoTemas(obter());
}

function opcoes(secao) {
  return [...secao.querySelectorAll('.tema')];
}

function nomes(secao) {
  return opcoes(secao).map((opcao) => opcao.querySelector('.tema__nome').textContent);
}

function ativa(secao) {
  return secao.querySelector('.tema--ativo')?.querySelector('.tema__nome')?.textContent ?? null;
}

descrever('Catálogo de temas', () => {
  isso('existe mais de um escuro e mais de um claro para escolher', () => {
    esperar(TEMAS_ESCOLHIVEIS.length).igual(5);
  });

  isso('seguir o sistema continua existindo, e nao e um tema de pintura', () => {
    esperar(Object.values(TEMAS).includes(TEMAS.SISTEMA)).verdadeiro();
    esperar(TEMAS_ESCOLHIVEIS.includes(TEMAS.SISTEMA)).falso();
  });

  isso('todo tema tem rotulo e descricao', () => {
    const semRotulo = Object.values(TEMAS).filter((tema) => !ROTULOS_TEMA[tema]);
    const semDescricao = Object.values(TEMAS).filter((tema) => !DESCRICOES_TEMA[tema]);

    esperar(semRotulo.length).igual(0);
    esperar(semDescricao.length).igual(0);
  });

  isso('a ordem de exibicao traz todos, sem repetir', () => {
    esperar(ORDEM_TEMAS.length).igual(Object.values(TEMAS).length);
    esperar(new Set(ORDEM_TEMAS).size).igual(ORDEM_TEMAS.length);
  });

  isso('seguir o sistema vem primeiro na lista', () => {
    esperar(ORDEM_TEMAS[0]).igual(TEMAS.SISTEMA);
  });
});

descrever('Escolha de tema em Ajustes', () => {
  isso('a escolha mostra todos os temas, com nome e descricao', () => {
    reiniciar();
    const secao = escolhaDeTema();

    esperar(opcoes(secao).length).igual(ORDEM_TEMAS.length);
    esperar(nomes(secao)).igual(ORDEM_TEMAS.map((tema) => ROTULOS_TEMA[tema]));
  });

  isso('cada opcao traz a descricao do tema', () => {
    reiniciar();
    const descricoes = opcoes(escolhaDeTema()).map((opcao) => opcao.querySelector('.tema__descricao').textContent);

    esperar(descricoes).igual(ORDEM_TEMAS.map((tema) => DESCRICOES_TEMA[tema]));
  });

  isso('o tema em uso aparece marcado', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_TEMA, TEMAS.PAPEL);

    esperar(ativa(escolhaDeTema())).igual(ROTULOS_TEMA[TEMAS.PAPEL]);
  });

  isso('so um tema fica marcado por vez', () => {
    reiniciar();

    esperar(escolhaDeTema().querySelectorAll('.tema--ativo').length).igual(1);
  });

  isso('escolher um tema troca o tema na hora', () => {
    reiniciar();
    const secao = escolhaDeTema();
    const alvo = opcoes(secao).find((opcao) => opcao.textContent.includes(ROTULOS_TEMA[TEMAS.NOITE]));

    alvo.click();

    esperar(obter().tema).igual(TEMAS.NOITE);
    esperar(ativa(escolhaDeTema())).igual(ROTULOS_TEMA[TEMAS.NOITE]);
  });

  isso('qualquer tema do catalogo pode ser escolhido direto, sem passar pelos outros', () => {
    reiniciar();

    ORDEM_TEMAS.forEach((tema) => {
      const alvo = opcoes(escolhaDeTema()).find(
        (opcao) => opcao.querySelector('.tema__nome').textContent === ROTULOS_TEMA[tema]
      );
      alvo.click();
      esperar(obter().tema).igual(tema);
    });
  });

  isso('cada opcao se anuncia como escolha unica', () => {
    reiniciar();
    const secao = escolhaDeTema();
    const papeis = opcoes(secao).map((opcao) => opcao.getAttribute('role'));
    const marcados = opcoes(secao).map((opcao) => opcao.getAttribute('aria-checked'));

    esperar(papeis.every((papel) => papel === 'radio')).verdadeiro();
    esperar(marcados.filter((valor) => valor === 'true').length).igual(1);
  });

  isso('a escolha nao abre modal nenhum', () => {
    reiniciar();
    escolhaDeTema();

    esperar(document.querySelectorAll('.modal').length).igual(0);
  });
});
