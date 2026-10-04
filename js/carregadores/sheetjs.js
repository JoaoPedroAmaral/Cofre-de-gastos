const CAMINHO = '/vendor/sheetjs/xlsx.mini.min.js';

let carregamento = null;

export function carregarSheetJs() {
  if (window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  if (carregamento) {
    return carregamento;
  }

  carregamento = new Promise((resolver, rejeitar) => {
    const script = document.createElement('script');
    script.src = CAMINHO;
    script.addEventListener('load', () => resolver(window.XLSX));
    script.addEventListener('error', () =>
      rejeitar(new Error(`Não foi possível carregar a biblioteca de planilhas em ${CAMINHO}`))
    );
    document.head.append(script);
  });

  return carregamento;
}
