const CAMINHO_SERVICE_WORKER = '/sw.js';
const ESCOPO = '/';
const TROCA_DE_CONTROLE = 'controllerchange';

export function registrarServicoOffline(aoAtualizar) {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  avisarQuandoAtualizar(aoAtualizar);

  return navigator.serviceWorker
    .register(CAMINHO_SERVICE_WORKER, { scope: ESCOPO })
    .catch(() => null);
}

function avisarQuandoAtualizar(aoAtualizar) {
  if (typeof aoAtualizar !== 'function') {
    return;
  }

  const jaControlado = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener(TROCA_DE_CONTROLE, () => {
    if (jaControlado) {
      aoAtualizar();
    }
  });
}
