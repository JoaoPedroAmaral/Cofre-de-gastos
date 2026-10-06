import { DERIVACAO, ORIGENS_REGRA } from '../nucleo/constantes.js';
import { listar as listarMapeamentos, substituir as substituirMapeamentos } from '../importadores/mapeamentos.js';
import { deBase64, deTexto, paraBase64, paraTexto } from '../cofre/bytes.js';
import { derivarChave, gerarIv, gerarSalt } from '../cofre/derivacao.js';

export const FORMATO_BACKUP = 'gastos-controller/backup';
export const VERSAO_BACKUP = 5;

const TIPO = 'application/json';
const PREFIXO = 'backup-gastos';
const EXTENSAO = 'json';
const RECUO = 2;

export const MENSAGENS_BACKUP = Object.freeze({
  FORMATO_INVALIDO: 'Este arquivo não é um backup do Gastos Controller.',
  VERSAO_INCOMPATIVEL: 'Este backup foi gerado por uma versão mais nova do sistema.',
  CONTEUDO_INVALIDO: 'O backup está incompleto ou corrompido.',
  SENHA_INCORRETA: 'Senha do backup incorreta.',
  SEM_SENHA: 'Escolha a senha que vai proteger o backup.',
  FORMATO_ANTIGO: 'Este backup foi gerado por uma versão que só abria no cofre de origem.'
});

export function montarBackup(estado) {
  return {
    lancamentos: estado.lancamentos,
    regras: estado.regras.filter((regra) => regra.origem === ORIGENS_REGRA.USUARIO),
    categorias: estado.categorias,
    tags: estado.tags,
    identidade: estado.identidade,
    mapeamentos: listarMapeamentos()
  };
}

export async function serializarCifrado(estado, senha) {
  if (!senha) {
    throw new Error(MENSAGENS_BACKUP.SEM_SENHA);
  }

  const salt = gerarSalt();
  const iv = gerarIv();
  const chave = await derivarChave(senha, salt);
  const dados = await crypto.subtle.encrypt(
    { name: DERIVACAO.ALGORITMO_CIFRA, iv },
    chave,
    deTexto(JSON.stringify(montarBackup(estado)))
  );

  return JSON.stringify(
    {
      formato: FORMATO_BACKUP,
      versao: VERSAO_BACKUP,
      geradoEm: new Date().toISOString(),
      cifrado: true,
      salt: paraBase64(salt),
      iv: paraBase64(iv),
      dados: paraBase64(new Uint8Array(dados))
    },
    null,
    RECUO
  );
}

export function interpretar(texto) {
  const conteudo = analisar(texto);

  if (!conteudo || conteudo.formato !== FORMATO_BACKUP) {
    throw new Error(MENSAGENS_BACKUP.FORMATO_INVALIDO);
  }
  if (conteudo.versao > VERSAO_BACKUP) {
    throw new Error(MENSAGENS_BACKUP.VERSAO_INCOMPATIVEL);
  }
  if (conteudo.cifrado && !conteudo.salt) {
    throw new Error(MENSAGENS_BACKUP.FORMATO_ANTIGO);
  }
  if (conteudo.cifrado) {
    return conteudo;
  }
  if (!Array.isArray(conteudo.lancamentos) || !Array.isArray(conteudo.regras)) {
    throw new Error(MENSAGENS_BACKUP.CONTEUDO_INVALIDO);
  }

  return conteudo;
}

export async function abrirCifrado(conteudo, senha) {
  const chave = await derivarChave(senha, deBase64(conteudo.salt));

  try {
    const aberto = await crypto.subtle.decrypt(
      { name: DERIVACAO.ALGORITMO_CIFRA, iv: deBase64(conteudo.iv) },
      chave,
      deBase64(conteudo.dados)
    );
    return JSON.parse(paraTexto(new Uint8Array(aberto)));
  } catch {
    throw new Error(MENSAGENS_BACKUP.SENHA_INCORRETA);
  }
}

export async function abrirBackup(texto, senha) {
  const conteudo = interpretar(texto);
  return conteudo.cifrado ? abrirCifrado(conteudo, senha) : conteudo;
}

export function restaurarMapeamentos(conteudo) {
  substituirMapeamentos(conteudo.mapeamentos ?? {});
}

export function nomeDoBackup() {
  const agora = new Date().toISOString().slice(0, 10);
  return `${PREFIXO}-${agora}.${EXTENSAO}`;
}

export const TIPO_BACKUP = TIPO;

function analisar(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
