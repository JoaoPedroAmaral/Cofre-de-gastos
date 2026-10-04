import { DERIVACAO } from '../nucleo/constantes.js';
import { deTexto, paraTexto } from './bytes.js';
import { derivarChave, gerarBytes, gerarIv, gerarSalt, importarChaveDeDados } from './derivacao.js';
import { gerarCodigo, normalizarCodigo } from './recuperacao.js';

const BYTES_DA_CHAVE = DERIVACAO.TAMANHO_CHAVE_BITS / 8;

export const MENSAGENS_COFRE = Object.freeze({
  SENHA_INCORRETA: 'Senha incorreta.',
  CODIGO_INCORRETO: 'Código de recuperação incorreto.',
  SENHA_FRACA: 'A senha ainda precisa de:',
  SENHAS_DIFERENTES: 'As duas senhas não são iguais.'
});

export const TAMANHO_MINIMO_SENHA = 8;

const SEPARADOR_REQUISITOS = ', ';

const REQUISITOS_DA_SENHA = Object.freeze([
  {
    rotulo: `pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`,
    atende: (senha) => senha.length >= TAMANHO_MINIMO_SENHA
  },
  { rotulo: 'uma letra maiúscula', atende: (senha) => /\p{Lu}/u.test(senha) },
  { rotulo: 'uma letra minúscula', atende: (senha) => /\p{Ll}/u.test(senha) },
  { rotulo: 'um número', atende: (senha) => /\p{Nd}/u.test(senha) },
  { rotulo: 'um caractere especial', atende: (senha) => /[^\p{L}\p{N}\s]/u.test(senha) }
]);

export function requisitosDaSenha(senha) {
  const texto = String(senha ?? '');
  return REQUISITOS_DA_SENHA.map((requisito) => ({
    rotulo: requisito.rotulo,
    atendido: requisito.atende(texto)
  }));
}

export function senhaForte(senha) {
  return requisitosDaSenha(senha).every((requisito) => requisito.atendido);
}

export function validarSenha(senha, confirmacao) {
  const faltando = requisitosDaSenha(senha)
    .filter((requisito) => !requisito.atendido)
    .map((requisito) => requisito.rotulo);

  if (faltando.length > 0) {
    return `${MENSAGENS_COFRE.SENHA_FRACA} ${faltando.join(SEPARADOR_REQUISITOS)}.`;
  }
  if (confirmacao !== undefined && senha !== confirmacao) {
    return MENSAGENS_COFRE.SENHAS_DIFERENTES;
  }
  return '';
}

export async function criarCofre(senha) {
  const chaveDeDados = gerarBytes(BYTES_DA_CHAVE);
  const codigo = gerarCodigo();

  const porSenha = await envelopar(chaveDeDados, senha);
  const porCodigo = await envelopar(chaveDeDados, normalizarCodigo(codigo));

  return {
    codigo,
    perfil: { envelopeSenha: porSenha, envelopeRecuperacao: porCodigo },
    chave: await importarChaveDeDados(chaveDeDados)
  };
}

export async function abrirComSenha(perfil, senha) {
  return abrir(perfil.envelopeSenha, senha, MENSAGENS_COFRE.SENHA_INCORRETA);
}

export async function abrirComCodigo(perfil, codigo) {
  return abrir(perfil.envelopeRecuperacao, normalizarCodigo(codigo), MENSAGENS_COFRE.CODIGO_INCORRETO);
}

export async function trocarSenha(perfil, senhaAtual, novaSenha) {
  const bytes = await desenvelopar(perfil.envelopeSenha, senhaAtual, MENSAGENS_COFRE.SENHA_INCORRETA);
  return { ...perfil, envelopeSenha: await envelopar(bytes, novaSenha) };
}

export async function cifrar(chave, valor) {
  const iv = gerarIv();
  const dados = await crypto.subtle.encrypt(
    { name: DERIVACAO.ALGORITMO_CIFRA, iv },
    chave,
    deTexto(JSON.stringify(valor))
  );

  return { iv, dados: new Uint8Array(dados) };
}

export async function decifrar(chave, registro) {
  const aberto = await crypto.subtle.decrypt(
    { name: DERIVACAO.ALGORITMO_CIFRA, iv: registro.iv },
    chave,
    registro.dados
  );

  return JSON.parse(paraTexto(new Uint8Array(aberto)));
}

async function envelopar(chaveDeDados, segredo) {
  const salt = gerarSalt();
  const iv = gerarIv();
  const kek = await derivarChave(segredo, salt);
  const dados = await crypto.subtle.encrypt({ name: DERIVACAO.ALGORITMO_CIFRA, iv }, kek, chaveDeDados);

  return { salt, iv, dados: new Uint8Array(dados) };
}

async function desenvelopar(envelope, segredo, mensagemDeErro) {
  const kek = await derivarChave(segredo, envelope.salt);

  try {
    const aberto = await crypto.subtle.decrypt(
      { name: DERIVACAO.ALGORITMO_CIFRA, iv: envelope.iv },
      kek,
      envelope.dados
    );
    return new Uint8Array(aberto);
  } catch {
    throw new Error(mensagemDeErro);
  }
}

async function abrir(envelope, segredo, mensagemDeErro) {
  const bytes = await desenvelopar(envelope, segredo, mensagemDeErro);
  return importarChaveDeDados(bytes);
}
