const TEXTO_VAZIO = '';
const CAMPOS_COM_CURSOR = ['text', 'search', 'password', 'tel', 'url', 'email'];

export function preservarFoco(atualizar) {
  const lembrado = lembrar();
  atualizar();
  devolver(lembrado);
}

function lembrar() {
  const ativo = document.activeElement;
  const rolagem = window.scrollY;

  if (!ativo || !ativo.id) {
    return { id: TEXTO_VAZIO, rolagem };
  }

  return {
    id: ativo.id,
    rolagem,
    inicio: temCursor(ativo) ? ativo.selectionStart : null,
    fim: temCursor(ativo) ? ativo.selectionEnd : null
  };
}

function devolver({ id, rolagem, inicio, fim }) {
  if (rolagem !== window.scrollY) {
    window.scrollTo({ top: rolagem });
  }
  if (id === TEXTO_VAZIO) {
    return;
  }

  const alvo = document.getElementById(id);
  if (!alvo || alvo === document.activeElement) {
    return;
  }

  alvo.focus();
  if (inicio !== null && temCursor(alvo)) {
    alvo.setSelectionRange(inicio, fim);
  }
}

function temCursor(elemento) {
  return elemento.tagName === 'INPUT' && CAMPOS_COM_CURSOR.includes(elemento.type);
}
