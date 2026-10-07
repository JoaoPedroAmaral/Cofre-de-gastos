import { TERMO } from './termo.js';
import { secoesDoTermo, versaoDoTermo } from './conteudo.js';

export const CLASSE_DA_COLUNA = 'coluna-de-leitura';

export function corpoDoTermo(criar, complemento = null) {
  return [
    criar('h1', { class: 'pagina__titulo', texto: TERMO.titulo }),
    criar('p', { class: 'pagina__resumo', texto: TERMO.resumo }),
    criar('p', { class: 'pagina__nota', texto: TERMO.nota }),
    criar('p', { class: 'fraco', texto: versaoDoTermo() }),
    complemento,
    ...secoesDoTermo(criar)
  ].filter(Boolean);
}
