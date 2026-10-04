const ACENTOS = /[\u0300-\u036f]/g;
const TEXTO_VAZIO = '';

const EMISSOR_DESCONHECIDO = TEXTO_VAZIO;

const EMISSORES = Object.freeze([
  Object.freeze({ banco: 'Nubank', marcas: ['nubank', 'nu pagamentos'] }),
  Object.freeze({ banco: 'Itaú', marcas: ['itaucard', 'itau unibanco', 'banco itau'] }),
  Object.freeze({ banco: 'Bradesco', marcas: ['bradesco'] }),
  Object.freeze({ banco: 'Santander', marcas: ['santander'] }),
  Object.freeze({ banco: 'Banco do Brasil', marcas: ['banco do brasil', 'ourocard'] }),
  Object.freeze({ banco: 'Caixa', marcas: ['caixa economica federal'] }),
  Object.freeze({ banco: 'Inter', marcas: ['banco inter'] }),
  Object.freeze({ banco: 'C6 Bank', marcas: ['c6 bank', 'banco c6'] }),
  Object.freeze({ banco: 'BTG Pactual', marcas: ['btg pactual'] }),
  Object.freeze({ banco: 'PicPay', marcas: ['picpay'] }),
  Object.freeze({ banco: 'Mercado Pago', marcas: ['mercado pago'] })
]);

export function emissorDe(linhas) {
  const texto = normalizar(linhas.join(' '));
  const encontrado = EMISSORES.find((emissor) =>
    emissor.marcas.some((marca) => texto.includes(marca))
  );
  return encontrado ? encontrado.banco : EMISSOR_DESCONHECIDO;
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(ACENTOS, TEXTO_VAZIO).toLowerCase();
}
