const PADRAO_DATA_COMPLETA = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
const MARCAS_VENCIMENTO = ['vencimento', 'vence em'];
const PARTES_ISO = 3;

export function descobrirReferencia(linhas) {
  return porVencimento(linhas) || primeiraDataCompleta(linhas);
}

export function dataDoLancamento(dia, mes, referencia) {
  const { ano: anoReferencia, mes: mesReferencia, dia: diaReferencia } = partesDe(referencia);
  const anterior = mes > mesReferencia || (mes === mesReferencia && dia > diaReferencia);
  const ano = anterior ? anoReferencia - 1 : anoReferencia;
  return `${ano}-${preencher(mes)}-${preencher(dia)}`;
}

function porVencimento(linhas) {
  const linha = linhas.find(
    (texto) => contemMarca(texto) && PADRAO_DATA_COMPLETA.test(texto)
  );
  return linha ? normalizar(linha) : null;
}

function primeiraDataCompleta(linhas) {
  const linha = linhas.find((texto) => PADRAO_DATA_COMPLETA.test(texto));
  return linha ? normalizar(linha) : null;
}

function contemMarca(texto) {
  const minusculo = texto.toLowerCase();
  return MARCAS_VENCIMENTO.some((marca) => minusculo.includes(marca));
}

function normalizar(texto) {
  const [, dia, mes, ano] = PADRAO_DATA_COMPLETA.exec(texto);
  return `${ano}-${preencher(Number(mes))}-${preencher(Number(dia))}`;
}

function partesDe(referencia) {
  const partes = String(referencia).split('-');
  if (partes.length < PARTES_ISO) {
    return { ano: 0, mes: 0, dia: 0 };
  }
  return { ano: Number(partes[0]), mes: Number(partes[1]), dia: Number(partes[2]) };
}

function preencher(numero) {
  return String(numero).padStart(2, '0');
}
