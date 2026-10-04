export function baixar(nome, conteudo, tipo) {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
  const endereco = URL.createObjectURL(blob);
  const ancora = document.createElement('a');

  ancora.href = endereco;
  ancora.download = nome;
  document.body.append(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(endereco);
}

export function nomeDoArquivo(prefixo, mes, extensao) {
  const periodo = mes || 'completo';
  return `${prefixo}-${periodo}.${extensao}`;
}
