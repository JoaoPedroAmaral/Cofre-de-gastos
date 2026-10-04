const BLOCO = 0x8000;

export function paraBase64(bytes) {
  const partes = [];
  for (let inicio = 0; inicio < bytes.length; inicio += BLOCO) {
    partes.push(String.fromCharCode(...bytes.subarray(inicio, inicio + BLOCO)));
  }
  return btoa(partes.join(''));
}

export function deBase64(texto) {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let posicao = 0; posicao < binario.length; posicao += 1) {
    bytes[posicao] = binario.charCodeAt(posicao);
  }
  return bytes;
}

export function paraTexto(bytes) {
  return new TextDecoder().decode(bytes);
}

export function deTexto(texto) {
  return new TextEncoder().encode(texto);
}
