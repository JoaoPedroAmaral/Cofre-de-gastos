import { descrever, esperar, isso } from '../runner.js';
import { reconciliarLista } from '../../js/ui/reconciliar.js';
import { preservarFoco } from '../../js/ui/foco.js';

function recipiente() {
  return document.createElement('div');
}

function montarItem(item) {
  const no = document.createElement('p');
  no.textContent = item.texto;
  return no;
}

function reconciliar(destino, itens) {
  return reconciliarLista(destino, itens, {
    chaveDe: (item) => item.id,
    assinaturaDe: (item) => item.texto,
    montar: montarItem
  });
}

function textos(destino) {
  return [...destino.children].map((filho) => filho.textContent);
}

function chaves(destino) {
  return [...destino.children].map((filho) => filho.dataset.chave);
}

descrever('Reconciliação de lista', () => {
  isso('monta a lista na primeira vez', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);

    esperar(textos(destino)).igual(['um', 'dois']);
    esperar(chaves(destino)).igual(['a', 'b']);
  });

  isso('mantem o mesmo no quando nada mudou', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);
    const antes = [...destino.children];

    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);

    esperar(destino.children.length).igual(2);
    esperar(destino.children[0] === antes[0]).verdadeiro();
    esperar(destino.children[1] === antes[1]).verdadeiro();
  });

  isso('troca so o item que mudou, e nao duplica', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);
    const antes = [...destino.children];

    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'DOIS' }]);

    esperar(destino.children.length).igual(2);
    esperar(textos(destino)).igual(['um', 'DOIS']);
    esperar(destino.children[0] === antes[0]).verdadeiro();
    esperar(destino.children[1] === antes[1]).falso();
  });

  isso('mudar o mesmo item muitas vezes nao acumula no', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);

    for (let volta = 0; volta < 10; volta += 1) {
      reconciliar(destino, [{ id: 'a', texto: `um ${volta}` }, { id: 'b', texto: 'dois' }]);
    }

    esperar(destino.children.length).igual(2);
    esperar(chaves(destino)).igual(['a', 'b']);
  });

  isso('item removido sai da lista', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);
    reconciliar(destino, [{ id: 'a', texto: 'um' }]);

    esperar(textos(destino)).igual(['um']);
  });

  isso('item novo entra na posicao certa', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'c', texto: 'tres' }]);
    reconciliar(destino, [
      { id: 'a', texto: 'um' },
      { id: 'b', texto: 'dois' },
      { id: 'c', texto: 'tres' }
    ]);

    esperar(textos(destino)).igual(['um', 'dois', 'tres']);
  });

  isso('lista reordenada reaproveita os nos, sem recriar', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);
    const [noDoA, noDoB] = [...destino.children];

    reconciliar(destino, [{ id: 'b', texto: 'dois' }, { id: 'a', texto: 'um' }]);

    esperar(destino.children[0] === noDoB).verdadeiro();
    esperar(destino.children[1] === noDoA).verdadeiro();
  });

  isso('dois itens trocados de lugar continuam com o proprio conteudo', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }, { id: 'b', texto: 'dois' }]);
    reconciliar(destino, [{ id: 'b', texto: 'dois' }, { id: 'a', texto: 'um' }]);

    esperar(textos(destino)).igual(['dois', 'um']);
    esperar(chaves(destino)).igual(['b', 'a']);
  });

  isso('lista vazia limpa o recipiente', () => {
    const destino = recipiente();
    reconciliar(destino, [{ id: 'a', texto: 'um' }]);
    reconciliar(destino, []);

    esperar(destino.children.length).igual(0);
  });

  isso('no que nao veio da reconciliacao e descartado', () => {
    const destino = recipiente();
    destino.append(document.createElement('span'));
    reconciliar(destino, [{ id: 'a', texto: 'um' }]);

    esperar(destino.children.length).igual(1);
    esperar(textos(destino)).igual(['um']);
  });
});

descrever('Foco e rolagem durante a atualização', () => {
  isso('devolve o foco ao campo que tinha foco', () => {
    const campo = document.createElement('input');
    campo.id = 'campo-de-teste';
    campo.type = 'text';
    campo.value = 'abc';
    document.body.append(campo);
    campo.focus();

    preservarFoco(() => {
      const novo = document.createElement('input');
      novo.id = 'campo-de-teste';
      novo.type = 'text';
      novo.value = 'abc';
      campo.replaceWith(novo);
    });

    esperar(document.activeElement.id).igual('campo-de-teste');
    document.getElementById('campo-de-teste').remove();
  });

  isso('devolve a posicao do cursor', () => {
    const campo = document.createElement('input');
    campo.id = 'campo-com-cursor';
    campo.type = 'text';
    campo.value = 'abcdef';
    document.body.append(campo);
    campo.focus();
    campo.setSelectionRange(3, 3);

    preservarFoco(() => {
      const novo = document.createElement('input');
      novo.id = 'campo-com-cursor';
      novo.type = 'text';
      novo.value = 'abcdef';
      campo.replaceWith(novo);
    });

    esperar(document.activeElement.selectionStart).igual(3);
    document.getElementById('campo-com-cursor').remove();
  });

  isso('sem foco em nada, nao inventa foco', () => {
    document.activeElement?.blur();
    preservarFoco(() => {});

    esperar(document.activeElement === document.body).verdadeiro();
  });
});
