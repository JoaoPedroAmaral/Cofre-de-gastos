const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';
const SEM_CANCELAMENTO = () => {};
const INICIO = 0;
const FIM = 1;
const EXPOENTE = 3;

export const DURACAO_DA_CONTAGEM = 600;

export function valorNoAndamento(centavos, andamento) {
  return Math.round(centavos * desacelerar(limitar(andamento)));
}

export function devoAnimar(centavos, prefereMenosMovimento) {
  return centavos !== INICIO && !prefereMenosMovimento;
}

export function animarAte(elemento, centavos, formatar) {
  elemento.textContent = formatar(centavos);

  if (!navegadorAnima() || !devoAnimar(centavos, prefereMenosMovimento())) {
    return SEM_CANCELAMENTO;
  }

  const comeco = performance.now();
  let quadro = requestAnimationFrame(function passo(agora) {
    const andamento = (agora - comeco) / DURACAO_DA_CONTAGEM;
    elemento.textContent = formatar(valorNoAndamento(centavos, andamento));

    if (andamento < FIM) {
      quadro = requestAnimationFrame(passo);
    }
  });

  return () => cancelAnimationFrame(quadro);
}

function desacelerar(andamento) {
  return FIM - (FIM - andamento) ** EXPOENTE;
}

function limitar(andamento) {
  if (!Number.isFinite(andamento) || andamento < INICIO) {
    return INICIO;
  }
  return Math.min(FIM, andamento);
}

function navegadorAnima() {
  return typeof requestAnimationFrame === 'function' && typeof performance === 'object';
}

function prefereMenosMovimento() {
  if (typeof matchMedia !== 'function') {
    return true;
  }
  return matchMedia(CONSULTA_MOVIMENTO_REDUZIDO).matches;
}
