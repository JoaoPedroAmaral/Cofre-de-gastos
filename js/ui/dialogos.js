import { abrirModal, criarElemento } from './componentes.js';

const TEXTO_VAZIO = '';
const TECLA_ENTRA = 'Enter';
const IDENTIFICADOR_DAS_SUGESTOES = 'sugestoes-do-dialogo';

const TEXTOS = Object.freeze({
  CANCELAR: 'Cancelar'
});

export function pedirTexto({ titulo, rotulo, valor = TEXTO_VAZIO, exemplo, sugestoes = [], acao, aoConfirmar }) {
  const lista = criarElemento(
    'datalist',
    { id: IDENTIFICADOR_DAS_SUGESTOES },
    sugestoes.map((sugestao) => criarElemento('option', { value: sugestao }))
  );

  const entrada = criarElemento('input', {
    class: 'campo__entrada',
    type: 'text',
    value: valor,
    placeholder: exemplo,
    list: sugestoes.length > 0 ? IDENTIFICADOR_DAS_SUGESTOES : null,
    'aria-label': rotulo
  });

  const aviso = criarElemento('p', { class: 'cofre__erro' });

  const corpo = criarElemento('div', { class: 'campo' }, [
    criarElemento('span', { class: 'campo__rotulo', texto: rotulo }),
    entrada,
    lista,
    aviso
  ]);

  const modal = abrirModal({
    titulo,
    corpo,
    acoes: [
      { rotulo: TEXTOS.CANCELAR, aoClicar: () => modal.fechar() },
      { rotulo: acao, principal: true, aoClicar: confirmar }
    ]
  });

  entrada.addEventListener('keydown', (evento) => {
    if (evento.key === TECLA_ENTRA) {
      evento.preventDefault();
      confirmar();
    }
  });

  function confirmar() {
    const recusa = aoConfirmar(entrada.value);
    if (recusa) {
      aviso.textContent = recusa;
      return;
    }
    modal.fechar();
  }

  return modal;
}

export function pedirEscolha({ titulo, texto, rotulo, opcoes, acao, aoConfirmar }) {
  const seletor = criarElemento(
    'select',
    { class: 'campo__entrada', 'aria-label': rotulo },
    opcoes.map((opcao) => criarElemento('option', { value: opcao, texto: opcao }))
  );

  const corpo = criarElemento('div', { class: 'campo' }, [
    criarElemento('p', { class: 'ajustes__ajuda', texto }),
    criarElemento('span', { class: 'campo__rotulo', texto: rotulo }),
    seletor
  ]);

  const modal = abrirModal({
    titulo,
    corpo,
    acoes: [
      { rotulo: TEXTOS.CANCELAR, aoClicar: () => modal.fechar() },
      {
        rotulo: acao,
        principal: true,
        aoClicar: () => {
          aoConfirmar(seletor.value);
          modal.fechar();
        }
      }
    ]
  });

  return modal;
}
