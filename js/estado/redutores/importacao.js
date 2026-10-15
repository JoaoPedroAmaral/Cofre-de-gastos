import { migrar } from '../../nucleo/modelo.js';
import { reclassificar } from '../../nucleo/classificar.js';
import { mesesDisponiveis } from '../../nucleo/agregar.js';
import { paginasIniciais } from '../inicial.js';
import { tagsQueChegaram } from './catalogos.js';

const TEXTO_VAZIO = '';

export function registrarImportacao(atual, relatorio) {
  if (!relatorio) {
    return atual;
  }

  const recebidos = (relatorio.lancamentos || []).map(migrar);
  const lancamentos = reclassificar([...atual.lancamentos, ...recebidos], atual.regras);

  return {
    ...atual,
    lancamentos,
    tags: tagsQueChegaram(atual.tags, recebidos),
    filtros: { ...atual.filtros, mes: mesDaImportacao(atual, recebidos, lancamentos) },
    paginas: paginasIniciais,
    importacao: { arquivos: mesclarArquivos(atual.importacao.arquivos, relatorio.arquivos || []) }
  };
}

function mesDaImportacao(atual, recebidos, lancamentos) {
  const mesesQueEntraram = mesesDisponiveis(recebidos, atual.competencia);
  if (mesesQueEntraram.length > 0) {
    return mesesQueEntraram[mesesQueEntraram.length - 1];
  }

  const meses = mesesDisponiveis(lancamentos, atual.competencia);
  return atual.filtros.mes || meses[meses.length - 1] || TEXTO_VAZIO;
}

function mesclarArquivos(atuais, novos) {
  const mesclados = [...atuais];

  novos.forEach((arquivo) => {
    const posicao = mesclados.findIndex((existente) => existente.nome === arquivo.nome);
    if (posicao === -1) {
      mesclados.push(arquivo);
      return;
    }
    mesclados[posicao] = arquivo;
  });

  return mesclados;
}
