const CHAVE = 'chave';
const ASSINATURA = 'assinatura';

export function reconciliarLista(recipiente, itens, { chaveDe, assinaturaDe, montar }) {
  const existentes = new Map();
  [...recipiente.children].forEach((filho) => {
    const chave = filho.dataset[CHAVE];
    if (chave === undefined) {
      filho.remove();
      return;
    }
    existentes.set(chave, filho);
  });

  let anterior = null;

  itens.forEach((item) => {
    const chave = String(chaveDe(item));
    const assinatura = String(assinaturaDe(item));
    const guardado = existentes.get(chave);
    existentes.delete(chave);

    if (reaproveitavel(guardado, assinatura)) {
      posicionar(recipiente, guardado, anterior);
      anterior = guardado;
      return;
    }

    const no = montado(montar, item, chave, assinatura);
    if (guardado) {
      guardado.remove();
    }
    posicionar(recipiente, no, anterior);
    anterior = no;
  });

  existentes.forEach((orfao) => orfao.remove());
  return recipiente;
}

function reaproveitavel(no, assinatura) {
  return Boolean(no) && no.dataset[ASSINATURA] === assinatura;
}

function montado(montar, item, chave, assinatura) {
  const no = montar(item);
  no.dataset[CHAVE] = chave;
  no.dataset[ASSINATURA] = assinatura;
  return no;
}

function posicionar(recipiente, no, anterior) {
  const esperado = anterior ? anterior.nextSibling : recipiente.firstChild;
  if (no === esperado) {
    return;
  }
  recipiente.insertBefore(no, esperado);
}
