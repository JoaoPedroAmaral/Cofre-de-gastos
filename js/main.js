import { ACOES, ESTADOS_COFRE, NIVEIS_AVISO, TELAS } from './nucleo/constantes.js';
import { despachar, observar, obter } from './estado/store.js';
import { aplicarTemaSalvo, montarLayout, registrarTela } from './ui/layout.js';
import { avisar } from './ui/componentes.js';
import { telaImportar } from './ui/upload.js';
import { telaPlanilha } from './ui/planilha.js';
import { telaRegras } from './ui/regras.js';
import { telaPainel } from './ui/painel.js';
import { telaExportar } from './ui/exportar.js';
import { telaPrivacidade } from './ui/privacidade.js';
import { telaCofre, telaMensagem } from './ui/cadeado.js';
import { listarPerfis } from './armazenamento/banco.js';
import { agendarGravacao, cancelarGravacao, carregarDoCofre } from './armazenamento/cofreDeDados.js';
import { abrirSessao } from './cofre/sessao.js';
import { registrarServicoOffline } from './carregadores/servicoOffline.js';

const MENSAGENS = Object.freeze({
  VERIFICANDO: 'Abrindo o cofre',
  VERIFICANDO_AJUDA: 'Procurando o cofre guardado neste navegador.',
  SEM_ARMAZENAMENTO: 'O cofre não pôde ser aberto',
  SEM_ARMAZENAMENTO_AJUDA:
    'Este navegador bloqueou o armazenamento local, que é onde o cofre vive. Costuma acontecer quando os dados de site estão bloqueados nas configurações, ou numa janela anônima com restrição extra. Libere os dados deste site e recarregue.',
  FALHA_AO_GRAVAR: 'Não foi possível gravar no cofre deste navegador.',
  TRANCADO: 'Cofre trancado.'
});

let raiz = null;
let cancelarPersistencia = null;
let situacaoDesenhada = null;

async function iniciar() {
  raiz = document.getElementById('app');
  if (!raiz) {
    throw new Error('Elemento raiz da aplicação não encontrado');
  }

  registrarTela(TELAS.IMPORTAR, telaImportar);
  registrarTela(TELAS.PLANILHA, telaPlanilha);
  registrarTela(TELAS.REGRAS, telaRegras);
  registrarTela(TELAS.PAINEL, telaPainel);
  registrarTela(TELAS.EXPORTAR, telaExportar);
  registrarTela(TELAS.PRIVACIDADE, telaPrivacidade);

  aplicarTemaSalvo();
  registrarServicoOffline();
  observar(desenhar);
  raiz.replaceChildren(telaMensagem(MENSAGENS.VERIFICANDO, MENSAGENS.VERIFICANDO_AJUDA));

  await verificarPerfis();
}

async function verificarPerfis() {
  try {
    const perfis = await listarPerfis();
    despachar(ACOES.DEFINIR_ESTADO_DO_COFRE, {
      situacao: perfis.length === 0 ? ESTADOS_COFRE.SEM_COFRE : ESTADOS_COFRE.TRAVADO,
      perfil: perfis[0] ?? null,
      perfis
    });
  } catch (falha) {
    raiz.replaceChildren(
      telaMensagem(MENSAGENS.SEM_ARMAZENAMENTO, MENSAGENS.SEM_ARMAZENAMENTO_AJUDA, descreverFalha(falha))
    );
  }
}

function descreverFalha(falha) {
  if (!falha) {
    return 'Motivo não informado pelo navegador.';
  }
  return `${falha.name ?? 'Erro'}: ${falha.message ?? falha}`;
}

function desenhar(estado) {
  const marcador = `${estado.cofre.situacao}:${estado.cofre.perfil?.id ?? ''}:${estado.cofre.perfis.length}`;
  if (marcador === situacaoDesenhada) {
    return;
  }
  situacaoDesenhada = marcador;

  if (estado.cofre.situacao === ESTADOS_COFRE.ABERTO) {
    montarLayout(raiz);
    return;
  }
  if (estado.cofre.situacao !== ESTADOS_COFRE.VERIFICANDO) {
    raiz.classList.remove('app');
    raiz.replaceChildren(telaCofre(estado, { aoAbrir, aoApagar: verificarPerfis }));
  }
}

async function aoAbrir(perfil, chave, restaurado = null) {
  const perfis = await listarPerfis();
  abrirSessao(perfil, chave, aoTravar);
  despachar(ACOES.DEFINIR_ESTADO_DO_COFRE, { situacao: ESTADOS_COFRE.ABERTO, perfil, perfis });

  const dados = restaurado ?? (await carregarDoCofre(perfil.id, chave));
  despachar(ACOES.CARREGAR_DADOS, dados);

  cancelarPersistencia = observar((estado) => {
    if (estado.cofre.situacao !== ESTADOS_COFRE.ABERTO) {
      return;
    }
    agendarGravacao(perfil.id, chave, estado, () => avisar(MENSAGENS.FALHA_AO_GRAVAR, NIVEIS_AVISO.ERRO));
  });
}

function aoTravar() {
  if (cancelarPersistencia) {
    cancelarPersistencia();
    cancelarPersistencia = null;
  }
  cancelarGravacao();

  const perfil = obter().cofre.perfil;
  despachar(ACOES.DEFINIR_ESTADO_DO_COFRE, { situacao: ESTADOS_COFRE.TRAVADO, perfil });
  avisar(MENSAGENS.TRANCADO);
}

window.addEventListener('error', (evento) => {
  avisar(`Falha inesperada: ${evento.message}`, NIVEIS_AVISO.ERRO);
});

window.addEventListener('unhandledrejection', (evento) => {
  avisar(`Falha inesperada: ${evento.reason}`, NIVEIS_AVISO.ERRO);
});

iniciar();
