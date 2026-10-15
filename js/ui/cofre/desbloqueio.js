import { abrirComCodigo, abrirComSenha } from '../../cofre/cofre.js';
import { codigoCompleto } from '../../cofre/recuperacao.js';
import { criarElemento } from '../componentes.js';
import { campoSecreto, moldura, rotulado } from './moldura.js';
import { apagarPerfil, atualizarPerfis, escolhaDePerfis } from './perfis.js';
import { TEXTOS } from './textos.js';

const TEXTO_LIMPO = '';

let atualizarDesbloqueio = null;

export function esquecerAtualizacao() {
  atualizarDesbloqueio = null;
}

export function aplicarAtualizacao(estado) {
  if (!atualizarDesbloqueio) {
    return false;
  }
  atualizarDesbloqueio(estado);
  return true;
}

export function telaDesbloqueio(estado, acoes) {
  const senha = campoSecreto('senha-cofre', TEXTOS.SENHA);
  const codigo = campoSecreto('codigo-cofre', TEXTOS.CODIGO, 'text');
  const erro = criarElemento('p', { class: 'cofre__erro', texto: estado.cofre.erro });

  let atual = estado;
  let comCodigo = false;

  const campo = criarElemento('div', { class: 'campo' }, [rotulado(senha, rotuloDaSenha(estado))]);
  const perfis = escolhaDePerfis(estado);
  const ajuda = criarElemento('p', { class: 'fraco', texto: ajudaDoDesbloqueio(estado) });

  const formulario = criarElemento('form', {
    class: 'cofre__formulario',
    onSubmit: async (evento) => {
      evento.preventDefault();

      if (comCodigo && !codigoCompleto(codigo.value)) {
        erro.textContent = TEXTOS.CODIGO_INCOMPLETO;
        return;
      }

      try {
        const chave = comCodigo
          ? await abrirComCodigo(atual.cofre.perfil, codigo.value)
          : await abrirComSenha(atual.cofre.perfil, senha.value);
        acoes.aoAbrir(atual.cofre.perfil, chave);
      } catch (falha) {
        erro.textContent = falha.message;
      }
    }
  });

  const alternar = criarElemento('button', {
    class: 'botao botao--discreto',
    type: 'button',
    texto: TEXTOS.USAR_CODIGO,
    onClick: () => {
      comCodigo = !comCodigo;
      alternar.textContent = comCodigo ? TEXTOS.USAR_SENHA : TEXTOS.USAR_CODIGO;
      campo.replaceChildren(comCodigo ? rotulado(codigo, TEXTOS.CODIGO) : rotulado(senha, rotuloDaSenha(atual)));
      erro.textContent = TEXTO_LIMPO;
      (comCodigo ? codigo : senha).focus();
    }
  });

  formulario.append(
    campo,
    erro,
    criarElemento('button', { class: 'botao botao--principal botao--largo', type: 'submit', texto: TEXTOS.DESTRAVAR }),
    alternar
  );

  atualizarDesbloqueio = (novo) => {
    atual = novo;
    atualizarPerfis(perfis, novo);
    ajuda.textContent = ajudaDoDesbloqueio(novo);
    erro.textContent = novo.cofre.erro;
    senha.value = TEXTO_LIMPO;
    codigo.value = TEXTO_LIMPO;
    if (!comCodigo) {
      campo.querySelector('.campo__rotulo').textContent = rotuloDaSenha(novo);
    }
  };

  return moldura(TEXTOS.TRANCADO, ajuda, [perfis, formulario, apagarPerfil(estado, acoes)]);
}

function ajudaDoDesbloqueio(estado) {
  return estado.cofre.perfis.length > 1 ? TEXTOS.ESCOLHA_PERFIL : TEXTOS.TRANCADO_AJUDA;
}

function rotuloDaSenha(estado) {
  if (estado.cofre.perfis.length <= 1) {
    return TEXTOS.SENHA;
  }
  return `${TEXTOS.SENHA} do perfil ${estado.cofre.perfil.nome}`;
}
