import { chaveDe, chavesDe, idDe } from './identidade.js';

export function mesclar(existentes, novos) {
  const jaGuardados = contarOcorrencias(existentes);
  const vistosNoLote = new Map();

  const inseridos = [];
  let ignorados = 0;

  novos.forEach((lancamento) => {
    const chave = chaveDe(lancamento);
    const ocorrencia = vistosNoLote.get(chave) ?? 0;
    vistosNoLote.set(chave, ocorrencia + 1);

    if (ocorrencia < guardadas(jaGuardados, lancamento)) {
      ignorados += 1;
      return;
    }

    inseridos.push({ ...lancamento, id: idDe(lancamento, ocorrencia) });
  });

  return { inseridos, ignorados };
}

function guardadas(contagem, lancamento) {
  return chavesDe(lancamento).reduce((maior, chave) => Math.max(maior, contagem.get(chave) ?? 0), 0);
}

function contarOcorrencias(lancamentos) {
  const contagem = new Map();

  lancamentos.forEach((lancamento) => {
    chavesDe(lancamento).forEach((chave) => {
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    });
  });

  return contagem;
}
