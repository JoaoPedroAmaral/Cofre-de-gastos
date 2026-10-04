const CHAVE_ARMAZENAMENTO = 'gastos.mapeamentos';

export const TERMOS_COLUNA = Object.freeze({
  DATA: ['data', 'date', 'dt', 'datalancamento', 'datamovimento'],
  VALOR: ['valor', 'amount', 'montante', 'quantia'],
  DESCRICAO: ['descricao', 'historico', 'lancamento', 'memo', 'estabelecimento', 'detalhe'],
  DEBITO: ['debito', 'saida', 'pagamento'],
  CREDITO: ['credito', 'entrada', 'recebimento']
});

export function listar() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return salvo ? JSON.parse(salvo) : {};
  } catch {
    return {};
  }
}

export function obter(assinatura) {
  return listar()[assinatura] || null;
}

export function substituir(todos) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(todos));
  } catch {
    return todos;
  }
  return todos;
}

export function salvar(assinatura, mapeamento) {
  return substituir({ ...listar(), [assinatura]: mapeamento });
}

export function remover(assinatura) {
  const todos = listar();
  delete todos[assinatura];
  return substituir(todos);
}
