import { carregarSheetJs } from '../carregadores/sheetjs.js';

const TEXTO_VAZIO = '';

export async function analisar(bytes) {
  const biblioteca = await carregarSheetJs();
  const planilha = biblioteca.read(bytes, { type: 'array', cellDates: false, raw: false });
  const primeira = planilha.Sheets[planilha.SheetNames[0]];

  if (!primeira) {
    return { cabecalho: [], linhas: [] };
  }

  const matriz = biblioteca.utils.sheet_to_json(primeira, { header: 1, raw: false, defval: TEXTO_VAZIO });
  const preenchidas = matriz.filter((linha) => linha.some((celula) => String(celula).trim() !== TEXTO_VAZIO));

  if (preenchidas.length === 0) {
    return { cabecalho: [], linhas: [] };
  }

  return {
    cabecalho: preenchidas[0].map((celula) => String(celula).trim()),
    linhas: preenchidas.slice(1)
  };
}
