import { carregarSheetJs } from '../carregadores/sheetjs.js';
import { baixar, nomeDoArquivo } from './arquivo.js';
import { montarAbas } from './abas.js';

const TIPO = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PREFIXO = 'gastos';
const EXTENSAO = 'xlsx';
const LARGURA_MINIMA = 10;
const LARGURA_MAXIMA = 48;
const FOLGA = 2;

export async function exportarXlsx(lancamentos, regras, competencia, mes) {
  const biblioteca = await carregarSheetJs();
  const livro = biblioteca.utils.book_new();

  montarAbas(lancamentos, regras, competencia).forEach((aba) => {
    const planilha = biblioteca.utils.aoa_to_sheet(aba.linhas);
    planilha['!cols'] = larguras(aba.linhas);
    biblioteca.utils.book_append_sheet(livro, planilha, aba.nome);
  });

  const bytes = biblioteca.write(livro, { bookType: EXTENSAO, type: 'array' });
  baixar(nomeDoArquivo(PREFIXO, mes, EXTENSAO), new Blob([bytes], { type: TIPO }), TIPO);
}

function larguras(linhas) {
  const cabecalho = linhas[0] ?? [];

  return cabecalho.map((_, coluna) => {
    const maior = linhas.reduce((tamanho, linha) => Math.max(tamanho, String(linha[coluna] ?? '').length), 0);
    return { wch: Math.min(LARGURA_MAXIMA, Math.max(LARGURA_MINIMA, maior + FOLGA)) };
  });
}
