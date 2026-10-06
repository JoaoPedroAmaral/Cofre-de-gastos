const CRESCENTE = 1;
const DECRESCENTE = -1;

export function ordenarLancamentos(lancamentos, ordenacao) {
  const direcao = ordenacao.ascendente ? CRESCENTE : DECRESCENTE;

  return [...lancamentos].sort((um, outro) => comparar(um, outro, ordenacao.campo) * direcao);
}

function comparar(um, outro, campo) {
  const valorDeUm = um[campo];
  const valorDoOutro = outro[campo];

  if (typeof valorDeUm === 'number' && typeof valorDoOutro === 'number') {
    return valorDeUm - valorDoOutro;
  }
  return String(valorDeUm).localeCompare(String(valorDoOutro));
}
