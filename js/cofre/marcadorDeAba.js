const CHAVE_DO_MARCADOR = 'gastos-controller:aba';
const SEM_MARCADOR = '';

export function marcadorDaAba() {
  const guardado = ler();
  if (guardado) {
    return guardado;
  }

  const novo = crypto.randomUUID();
  return escrever(novo) ? novo : SEM_MARCADOR;
}

export function esquecerMarcador() {
  try {
    sessionStorage.removeItem(CHAVE_DO_MARCADOR);
  } catch {
    return;
  }
}

function ler() {
  try {
    return sessionStorage.getItem(CHAVE_DO_MARCADOR) ?? SEM_MARCADOR;
  } catch {
    return SEM_MARCADOR;
  }
}

function escrever(marcador) {
  try {
    sessionStorage.setItem(CHAVE_DO_MARCADOR, marcador);
    return true;
  } catch {
    return false;
  }
}
