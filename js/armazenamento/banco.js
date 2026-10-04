import { NOME_BANCO, STORES, VERSAO_BANCO } from '../nucleo/constantes.js';

const CHAVE_PRIMARIA = 'id';
const SOMENTE_LEITURA = 'readonly';
const LEITURA_E_ESCRITA = 'readwrite';

let conexao = null;

function abrirBanco() {
  if (conexao) {
    return Promise.resolve(conexao);
  }

  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

    pedido.onupgradeneeded = () => criarEstrutura(pedido.result);
    pedido.onsuccess = () => {
      conexao = pedido.result;
      resolver(conexao);
    };
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

export async function listarPerfis() {
  return todos(STORES.PERFIS);
}

export async function salvarPerfil(perfil) {
  return gravar(STORES.PERFIS, perfil);
}

export async function removerPerfil(id) {
  const banco = await abrirBanco();
  await Promise.all([apagar(banco, STORES.PERFIS, id), apagarDoPerfil(banco, id)]);
}

export async function lerCofre(perfilId, colecao) {
  const banco = await abrirBanco();
  return new Promise((resolver, rejeitar) => {
    const pedido = banco
      .transaction(STORES.LANCAMENTOS, SOMENTE_LEITURA)
      .objectStore(STORES.LANCAMENTOS)
      .get(chaveDaColecao(perfilId, colecao));

    pedido.onsuccess = () => resolver(pedido.result ?? null);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

export async function gravarCofre(perfilId, colecao, registro) {
  return gravar(STORES.LANCAMENTOS, {
    id: chaveDaColecao(perfilId, colecao),
    perfil: perfilId,
    iv: registro.iv,
    dados: registro.dados
  });
}

function criarEstrutura(banco) {
  if (!banco.objectStoreNames.contains(STORES.PERFIS)) {
    banco.createObjectStore(STORES.PERFIS, { keyPath: CHAVE_PRIMARIA });
  }
  if (!banco.objectStoreNames.contains(STORES.LANCAMENTOS)) {
    banco.createObjectStore(STORES.LANCAMENTOS, { keyPath: CHAVE_PRIMARIA });
  }
}

function chaveDaColecao(perfilId, colecao) {
  return `${perfilId}:${colecao}`;
}

async function todos(nomeDaStore) {
  const banco = await abrirBanco();
  return new Promise((resolver, rejeitar) => {
    const pedido = banco.transaction(nomeDaStore, SOMENTE_LEITURA).objectStore(nomeDaStore).getAll();
    pedido.onsuccess = () => resolver(pedido.result ?? []);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

async function gravar(nomeDaStore, valor) {
  const banco = await abrirBanco();
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction(nomeDaStore, LEITURA_E_ESCRITA);
    transacao.objectStore(nomeDaStore).put(valor);
    transacao.oncomplete = () => resolver(valor);
    transacao.onerror = () => rejeitar(transacao.error);
  });
}

function apagar(banco, nomeDaStore, id) {
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction(nomeDaStore, LEITURA_E_ESCRITA);
    transacao.objectStore(nomeDaStore).delete(id);
    transacao.oncomplete = resolver;
    transacao.onerror = () => rejeitar(transacao.error);
  });
}

function apagarDoPerfil(banco, perfilId) {
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction(STORES.LANCAMENTOS, LEITURA_E_ESCRITA);
    const store = transacao.objectStore(STORES.LANCAMENTOS);
    const cursor = store.openCursor();

    cursor.onsuccess = () => {
      const atual = cursor.result;
      if (!atual) {
        return;
      }
      if (atual.value.perfil === perfilId) {
        store.delete(atual.key);
      }
      atual.continue();
    };

    transacao.oncomplete = resolver;
    transacao.onerror = () => rejeitar(transacao.error);
  });
}
