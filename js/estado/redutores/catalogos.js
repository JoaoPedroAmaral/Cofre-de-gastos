import { CATEGORIA_SEM_CLASSIFICACAO } from '../../nucleo/constantes.js';
import { reclassificar } from '../../nucleo/classificar.js';
import * as catalogo from '../../nucleo/catalogo.js';
import * as tags from '../../nucleo/tags.js';

const TEXTO_VAZIO = '';

export function criarCategoria(atual, nome) {
  const categorias = catalogo.acrescentar(atual.categorias, nome);
  return categorias === atual.categorias ? atual : { ...atual, categorias };
}

export function renomearCategoria(atual, { de, para }) {
  const categorias = catalogo.renomear(atual.categorias, de, para);
  if (categorias === atual.categorias) {
    return atual;
  }

  const nome = categorias.find((item) => catalogo.mesmoNome(item, para));
  const lancamentos = atual.lancamentos.map((lancamento) =>
    catalogo.mesmoNome(lancamento.categoria, de) ? { ...lancamento, categoria: nome } : lancamento
  );
  const regras = atual.regras.map((regra) =>
    catalogo.mesmoNome(regra.categoria, de) ? { ...regra, categoria: nome } : regra
  );

  return { ...atual, categorias, regras, lancamentos: reclassificar(lancamentos, regras) };
}

export function removerCategoria(atual, { nome, destino = CATEGORIA_SEM_CLASSIFICACAO }) {
  const categorias = catalogo.remover(atual.categorias, nome);
  if (categorias === atual.categorias) {
    return atual;
  }

  const paraSemCategoria = catalogo.mesmoNome(destino, CATEGORIA_SEM_CLASSIFICACAO);
  const regras = paraSemCategoria
    ? atual.regras.filter((regra) => !catalogo.mesmoNome(regra.categoria, nome))
    : atual.regras.map((regra) =>
        catalogo.mesmoNome(regra.categoria, nome) ? { ...regra, categoria: destino } : regra
      );

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!catalogo.mesmoNome(lancamento.categoria, nome)) {
      return lancamento;
    }
    return { ...lancamento, categoria: destino, revisadoManual: !paraSemCategoria, regra: null };
  });

  return { ...atual, categorias, regras, lancamentos: reclassificar(lancamentos, regras) };
}

export function criarTag(atual, tag) {
  const catalogoNovo = tags.acrescentar(atual.tags, tag);
  return catalogoNovo === atual.tags ? atual : { ...atual, tags: catalogoNovo };
}

export function acrescentarTag(atual, { ids, tag }) {
  const limpa = tags.normalizarTag(tag);
  const alvos = new Set(ids);

  if (limpa === TEXTO_VAZIO || alvos.size === 0) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, tagsManuais: tags.acrescentar(lancamento.tagsManuais ?? [], limpa) };
  });

  return { ...atual, lancamentos, tags: tags.acrescentar(atual.tags, limpa) };
}

export function removerTag(atual, { ids, tag }) {
  const limpa = tags.normalizarTag(tag);
  const alvos = new Set(ids);

  if (limpa === TEXTO_VAZIO || alvos.size === 0) {
    return atual;
  }

  const lancamentos = atual.lancamentos.map((lancamento) => {
    if (!alvos.has(lancamento.id)) {
      return lancamento;
    }
    return { ...lancamento, tagsManuais: tags.remover(lancamento.tagsManuais ?? [], limpa) };
  });

  return { ...atual, lancamentos };
}

export function renomearTag(atual, { de, para }) {
  const catalogoNovo = tags.renomear(atual.tags, de, para);
  if (catalogoNovo === atual.tags) {
    return atual;
  }

  const antiga = tags.normalizarTag(de);
  const nova = tags.normalizarTag(para);
  const trocar = (lista) => (lista.includes(antiga) ? tags.acrescentar(tags.remover(lista, antiga), nova) : lista);

  const lancamentos = atual.lancamentos.map((lancamento) => ({
    ...lancamento,
    tagsManuais: trocar(lancamento.tagsManuais ?? [])
  }));
  const regras = atual.regras.map((regra) => ({ ...regra, tags: trocar(regra.tags) }));

  return { ...atual, tags: catalogoNovo, regras, lancamentos: reclassificar(lancamentos, regras) };
}

export function removerTagDoCatalogo(atual, tag) {
  const catalogoNovo = tags.remover(atual.tags, tag);
  if (catalogoNovo === atual.tags) {
    return atual;
  }

  const limpa = tags.normalizarTag(tag);
  const lancamentos = atual.lancamentos.map((lancamento) => ({
    ...lancamento,
    tagsManuais: tags.remover(lancamento.tagsManuais ?? [], limpa)
  }));
  const regras = atual.regras.map((regra) => ({ ...regra, tags: tags.remover(regra.tags, limpa) }));

  return { ...atual, tags: catalogoNovo, regras, lancamentos: reclassificar(lancamentos, regras) };
}

export function tagsQueChegaram(catalogoAtual, recebidos) {
  return recebidos
    .flatMap((lancamento) => lancamento.tagsManuais ?? [])
    .reduce((lista, tag) => tags.acrescentar(lista, tag), catalogoAtual);
}
