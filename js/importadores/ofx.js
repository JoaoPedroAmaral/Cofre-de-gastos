import { METODOS } from '../nucleo/constantes.js';
import { paraIso } from '../nucleo/datas.js';
import { ORIGENS_PERIODO } from './periodo.js';

const BLOCO_TRANSACAO = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
const BLOCO_TRANSACAO_ABERTO = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>|<\/STMTRS>|$)/gi;
const MARCA_CARTAO = /<CCACCTFROM>/i;
const TEXTO_VAZIO = '';

const CAMPOS = Object.freeze({
  DATA: 'DTPOSTED',
  VALOR: 'TRNAMT',
  MEMO: 'MEMO',
  NOME: 'NAME',
  TIPO: 'TRNTYPE',
  IDENTIFICADOR: 'FITID'
});

const CAMPOS_CONTA = Object.freeze({
  BANCO: 'BANKID',
  CONTA: 'ACCTID',
  ORGANIZACAO: 'ORG'
});

const CAMPOS_PERIODO = Object.freeze({
  INICIO: 'DTSTART',
  FIM: 'DTEND'
});

export function analisar(texto, arquivo) {
  const cartao = MARCA_CARTAO.test(texto);
  const banco = valorDaTag(texto, CAMPOS_CONTA.ORGANIZACAO) || valorDaTag(texto, CAMPOS_CONTA.BANCO);
  const conta = valorDaTag(texto, CAMPOS_CONTA.CONTA);
  const blocos = extrairBlocos(texto);

  return blocos.map((bloco, indice) => ({
    data: valorDaTag(bloco, CAMPOS.DATA),
    valor: valorDaTag(bloco, CAMPOS.VALOR),
    descricaoOriginal: descricaoDe(bloco),
    banco,
    conta,
    metodo: cartao ? METODOS.CARTAO_CREDITO : METODOS.OUTROS,
    tipoOriginal: valorDaTag(bloco, CAMPOS.TIPO),
    identificadorBanco: valorDaTag(bloco, CAMPOS.IDENTIFICADOR),
    arquivo,
    linha: indice + 1
  }));
}

export function periodoDe(texto) {
  const inicio = paraIso(valorDaTag(texto, CAMPOS_PERIODO.INICIO));
  const fim = paraIso(valorDaTag(texto, CAMPOS_PERIODO.FIM));

  if (!inicio || !fim) {
    return null;
  }
  return { inicio, fim, origem: ORIGENS_PERIODO.CONTEUDO };
}

function extrairBlocos(texto) {
  const fechados = [...texto.matchAll(BLOCO_TRANSACAO)].map((achado) => achado[1]);
  if (fechados.length > 0) {
    return fechados;
  }
  return [...texto.matchAll(BLOCO_TRANSACAO_ABERTO)].map((achado) => achado[1]);
}

function descricaoDe(bloco) {
  const memo = valorDaTag(bloco, CAMPOS.MEMO);
  const nome = valorDaTag(bloco, CAMPOS.NOME);
  if (memo && nome && memo !== nome) {
    return `${nome} ${memo}`;
  }
  return memo || nome;
}

function valorDaTag(texto, tag) {
  const padrao = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i');
  const achado = padrao.exec(texto);
  return achado ? achado[1].trim() : TEXTO_VAZIO;
}
