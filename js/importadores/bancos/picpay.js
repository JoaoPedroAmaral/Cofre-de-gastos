export const PERFIS_PICPAY = Object.freeze([
  Object.freeze({
    id: 'picpay-conta-csv',
    banco: 'PicPay',
    conta: 'Conta',
    descricao: 'Extrato da conta exportado em CSV',
    exige: ['data', 'tipo', 'origem / destino', 'valor'],
    colunas: {
      data: 'data',
      valor: 'valor',
      descricao: ['tipo', 'origem / destino']
    }
  })
]);
