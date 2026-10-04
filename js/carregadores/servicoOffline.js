const CAMINHO_SERVICE_WORKER = '/sw.js';
const ESCOPO = '/';

export function registrarServicoOffline() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  return navigator.serviceWorker
    .register(CAMINHO_SERVICE_WORKER, { scope: ESCOPO })
    .catch(() => null);
}
