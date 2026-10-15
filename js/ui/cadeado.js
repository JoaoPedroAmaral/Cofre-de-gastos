import { ESTADOS_COFRE } from '../nucleo/constantes.js';
import { criarElemento } from './componentes.js';
import { moldura } from './cofre/moldura.js';
import { telaCriacao } from './cofre/criacao.js';
import { aplicarAtualizacao, esquecerAtualizacao, telaDesbloqueio } from './cofre/desbloqueio.js';

const SEM_PERFIL = null;

export function telaMensagem(titulo, texto, detalhe) {
  const conteudo = detalhe ? [criarElemento('p', { class: 'cofre__erro mono', texto: detalhe })] : [];
  return moldura(titulo, texto, conteudo);
}

export function atualizarTelaCofre(estado) {
  return aplicarAtualizacao(estado);
}

export function telaCofre(estado, acoes) {
  esquecerAtualizacao();
  if (estado.cofre.situacao === ESTADOS_COFRE.SEM_COFRE) {
    return telaCriacao(estado, acoes, false);
  }
  if (estado.cofre.perfil === SEM_PERFIL) {
    return telaCriacao(estado, acoes, true);
  }
  return telaDesbloqueio(estado, acoes);
}
