import { descrever, esperar, isso } from '../runner.js';
import {
  ACOES,
  DESCRICOES_TEMA,
  ORDEM_TEMAS,
  ROTULOS_TEMA,
  TEMAS
} from '../../js/nucleo/constantes.js';
import { abrirMenuDeTemas } from '../../js/ui/temas.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';

const TEMAS_ESCOLHIVEIS = Object.values(TEMAS).filter((tema) => tema !== TEMAS.SISTEMA);

function opcoes(modal) {
  return [...modal.elemento.querySelectorAll('.tema')];
}

function nomes(modal) {
  return opcoes(modal).map((opcao) => opcao.querySelector('.tema__nome').textContent);
}

function ativa(modal) {
  return modal.elemento.querySelector('.tema--ativo')?.querySelector('.tema__nome')?.textContent ?? null;
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

descrever('Escolha de tema por menu', () => {
  isso('o menu mostra todos os temas, com nome e descricao', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();

    esperar(opcoes(modal).length).igual(ORDEM_TEMAS.length);
    esperar(nomes(modal)).igual(ORDEM_TEMAS.map((tema) => ROTULOS_TEMA[tema]));
    modal.fechar();
  });

  isso('o tema em uso aparece marcado', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_TEMA, TEMAS.PAPEL);
    const modal = abrirMenuDeTemas();

    esperar(ativa(modal)).igual(ROTULOS_TEMA[TEMAS.PAPEL]);
    modal.fechar();
  });

  isso('so um tema fica marcado por vez', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();

    esperar(modal.elemento.querySelectorAll('.tema--ativo').length).igual(1);
    modal.fechar();
  });

  isso('escolher um tema troca o tema na hora, sem fechar o menu', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();
    const alvo = opcoes(modal).find((opcao) => opcao.textContent.includes(ROTULOS_TEMA[TEMAS.NOITE]));

    alvo.click();

    esperar(obter().tema).igual(TEMAS.NOITE);
    esperar(ativa(modal)).igual(ROTULOS_TEMA[TEMAS.NOITE]);
    modal.fechar();
  });

  isso('qualquer tema do catalogo pode ser escolhido direto, sem passar pelos outros', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();

    ORDEM_TEMAS.forEach((tema) => {
      const alvo = opcoes(modal).find((opcao) => opcao.querySelector('.tema__nome').textContent === ROTULOS_TEMA[tema]);
      alvo.click();
      esperar(obter().tema).igual(tema);
    });

    modal.fechar();
  });

  isso('cada opcao se anuncia como escolha unica', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();
    const papeis = opcoes(modal).map((opcao) => opcao.getAttribute('role'));
    const marcados = opcoes(modal).map((opcao) => opcao.getAttribute('aria-checked'));

    esperar(papeis.every((papel) => papel === 'radio')).verdadeiro();
    esperar(marcados.filter((valor) => valor === 'true').length).igual(1);
    modal.fechar();
  });

  isso('o menu fecha e some da tela', () => {
    reiniciar();
    const modal = abrirMenuDeTemas();
    modal.fechar();

    esperar(document.querySelectorAll('.temas__lista').length).igual(0);
  });
});
