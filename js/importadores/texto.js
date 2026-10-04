const CODIFICACAO_PADRAO = 'utf-8';
const CODIFICACAO_ALTERNATIVA = 'windows-1252';
const CARACTERE_SUBSTITUTO = '�';

export function decodificar(bytes) {
  const utf8 = new TextDecoder(CODIFICACAO_PADRAO).decode(bytes);
  if (!utf8.includes(CARACTERE_SUBSTITUTO)) {
    return utf8;
  }
  return new TextDecoder(CODIFICACAO_ALTERNATIVA).decode(bytes);
}
