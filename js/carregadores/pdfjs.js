const CAMINHO_BIBLIOTECA = '/vendor/pdfjs/pdf.min.mjs';
const CAMINHO_WORKER = '/vendor/pdfjs/pdf.worker.min.mjs';
const FALHA = `Não foi possível carregar a biblioteca de PDF em ${CAMINHO_BIBLIOTECA}`;

let carregamento = null;

export function carregarPdfJs() {
  if (!carregamento) {
    carregamento = import(CAMINHO_BIBLIOTECA)
      .then((biblioteca) => {
        biblioteca.GlobalWorkerOptions.workerSrc = CAMINHO_WORKER;
        return biblioteca;
      })
      .catch(() => {
        carregamento = null;
        throw new Error(FALHA);
      });
  }
  return carregamento;
}
