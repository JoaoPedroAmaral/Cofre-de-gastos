import { ACOES, LIMITE_DE_PERFIS, NIVEIS_AVISO } from '../../nucleo/constantes.js';
import { despachar } from '../../estado/store.js';
import { removerPerfil } from '../../armazenamento/banco.js';
import { avisar, criarElemento } from '../componentes.js';
import { reconciliarLista } from '../reconciliar.js';
import { inicialDe } from './moldura.js';
import { NOVO_PERFIL, TEXTOS } from './textos.js';

const SEPARADOR_DE_ASSINATURA = '~';
const SINAL_DE_NOVO = '+';

export function escolhaDePerfis(estado) {
  const caixa = criarElemento('div', { class: 'perfis', role: 'radiogroup', 'aria-label': TEXTOS.NOME });
  atualizarPerfis(caixa, estado);
  return caixa;
}

export function atualizarPerfis(caixa, estado) {
  reconciliarLista(caixa, itensDePerfil(estado), {
    chaveDe: (item) => item.chave,
    assinaturaDe: (item) => item.assinatura,
    montar: (item) => item.montar()
  });
}

function itensDePerfil(estado) {
  const escolhido = estado.cofre.perfil?.id;

  const itens = estado.cofre.perfis.map((perfil) => ({
    chave: perfil.id,
    assinatura: [perfil.nome, perfil.id === escolhido].join(SEPARADOR_DE_ASSINATURA),
    montar: () => botaoDePerfil(perfil, perfil.id === escolhido)
  }));

  if (estado.cofre.perfis.length < LIMITE_DE_PERFIS) {
    itens.push({ chave: NOVO_PERFIL, assinatura: NOVO_PERFIL, montar: botaoDeNovoPerfil });
  }

  return itens;
}

function botaoDePerfil(perfil, escolhido) {
  return criarElemento(
    'button',
    {
      class: escolhido ? 'perfil perfil--ativo' : 'perfil',
      type: 'button',
      role: 'radio',
      'aria-checked': String(escolhido),
      onClick: () => despachar(ACOES.SELECIONAR_PERFIL, perfil.id)
    },
    [
      criarElemento('span', { class: 'perfil__inicial', texto: inicialDe(perfil.nome) }),
      criarElemento('span', { class: 'perfil__nome', title: perfil.nome, texto: perfil.nome })
    ]
  );
}

function botaoDeNovoPerfil() {
  return criarElemento(
    'button',
    {
      class: 'perfil',
      type: 'button',
      onClick: () => despachar(ACOES.SELECIONAR_PERFIL, NOVO_PERFIL)
    },
    [
      criarElemento('span', { class: 'perfil__inicial perfil__inicial--novo', texto: SINAL_DE_NOVO }),
      criarElemento('span', { class: 'perfil__nome', texto: TEXTOS.NOVO })
    ]
  );
}

export function apagarPerfil(estado, acoes) {
  let confirmando = false;

  const botao = criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.APAGAR,
    onClick: async () => {
      if (!confirmando) {
        confirmando = true;
        botao.textContent = TEXTOS.APAGAR_CONFIRMAR;
        botao.classList.add('botao--perigo');
        return;
      }

      await removerPerfil(estado.cofre.perfil.id);
      avisar(TEXTOS.APAGADO, NIVEIS_AVISO.ATENCAO);
      acoes.aoApagar();
    }
  });

  return botao;
}
