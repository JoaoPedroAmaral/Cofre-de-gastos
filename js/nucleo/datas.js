const PADRAO_ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const PADRAO_BR = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;
const PADRAO_COMPACTO_ANO_INICIO = /^(\d{4})(\d{2})(\d{2})/;
const PADRAO_COMPACTO_DIA_INICIO = /^(\d{2})(\d{2})(\d{4})/;

const LIMITE_ANO_CURTO = 100;
const SECULO_ATUAL = 2000;
const MESES_NO_ANO = 12;
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FEVEREIRO = 2;
const DIAS_FEVEREIRO_BISSEXTO = 29;
const TAMANHO_MES = 7;
const TEXTO_VAZIO = '';

export function paraIso(valor) {
  if (typeof valor !== 'string') {
    return null;
  }

  const texto = valor.trim();
  if (texto === TEXTO_VAZIO) {
    return null;
  }

  const valida = candidatos(texto).find(({ ano, mes, dia }) => ehDataValida(ano, mes, dia));
  if (!valida) {
    return null;
  }

  return `${valida.ano}-${preencher(valida.mes)}-${preencher(valida.dia)}`;
}

export function mesDe(iso) {
  return typeof iso === 'string' ? iso.slice(0, TAMANHO_MES) : TEXTO_VAZIO;
}

function candidatos(texto) {
  const iso = PADRAO_ISO.exec(texto);
  const br = PADRAO_BR.exec(texto);
  const compactoAno = PADRAO_COMPACTO_ANO_INICIO.exec(texto);
  const compactoDia = PADRAO_COMPACTO_DIA_INICIO.exec(texto);

  const achados = [
    iso && { ano: Number(iso[1]), mes: Number(iso[2]), dia: Number(iso[3]) },
    br && { ano: normalizarAno(Number(br[3])), mes: Number(br[2]), dia: Number(br[1]) },
    compactoAno && {
      ano: Number(compactoAno[1]),
      mes: Number(compactoAno[2]),
      dia: Number(compactoAno[3])
    },
    compactoDia && {
      ano: Number(compactoDia[3]),
      mes: Number(compactoDia[2]),
      dia: Number(compactoDia[1])
    }
  ];

  return achados.filter(Boolean);
}

function normalizarAno(ano) {
  return ano < LIMITE_ANO_CURTO ? SECULO_ATUAL + ano : ano;
}

function ehDataValida(ano, mes, dia) {
  if (mes < 1 || mes > MESES_NO_ANO || dia < 1) {
    return false;
  }
  return dia <= diasNoMes(ano, mes);
}

function diasNoMes(ano, mes) {
  if (mes === FEVEREIRO && ehBissexto(ano)) {
    return DIAS_FEVEREIRO_BISSEXTO;
  }
  return DIAS_POR_MES[mes - 1];
}

function ehBissexto(ano) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

function preencher(numero) {
  return String(numero).padStart(2, '0');
}
