export const PERFIS_NUBANK = Object.freeze([
  Object.freeze({
    id: 'nubank-cartao-csv',
    banco: 'Nubank',
    conta: 'Cartão de crédito',
    descricao: 'Fatura do cartão exportada em CSV',
    exige: ['date', 'title', 'amount'],
    colunas: { data: 'date', descricao: 'title', valor: 'amount' },
    inverterSinal: true
  }),
  Object.freeze({
    id: 'nubank-conta-csv',
    banco: 'Nubank',
    conta: 'Conta',
    descricao: 'Extrato da conta exportado em CSV',
    exige: ['Data', 'Valor', 'Identificador', 'Descrição'],
    colunas: { data: 'Data', valor: 'Valor', descricao: 'Descrição' }
  })
]);
