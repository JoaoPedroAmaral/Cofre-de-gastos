import { ACOES, NIVEIS_AVISO } from '../../nucleo/constantes.js';
import { despachar } from '../../estado/store.js';
import { criarCofre, requisitosDaSenha, senhaForte, validarSenha } from '../../cofre/cofre.js';
import { formatarCodigo } from '../../cofre/recuperacao.js';
import { salvarPerfil } from '../../armazenamento/banco.js';
import { restaurarMapeamentos } from '../../armazenamento/backup.js';
import { baixar } from '../../exportacao/arquivo.js';
import { avisar, criarElemento } from '../componentes.js';
import { campoSecreto, moldura, passos, rotulado, trocarTela } from './moldura.js';
import { telaRestauracao } from './restauracao.js';
import { ARQUIVO_CODIGO, NOME_PADRAO, PASSOS, TEXTOS, TIPO_TEXTO } from './textos.js';

const SEM_NOME = '';
const SEPARADOR_DO_CODIGO = '-';
const PRIMEIRO_PERFIL = 0;

export function telaCriacao(estado, acoes, outroPerfil, restaurado = null) {
  const voltarParaCriacao = (conteudo = null) => trocarTela(telaCriacao(estado, acoes, false, conteudo));

  const nome = criarElemento('input', {
    class: 'campo__entrada',
    id: 'nome-perfil',
    type: 'text',
    value: outroPerfil ? SEM_NOME : NOME_PADRAO,
    'aria-label': TEXTOS.NOME
  });

  const senha = campoSecreto('nova-senha', TEXTOS.SENHA, 'password', 'new-password');
  const confirmacao = campoSecreto('confirmar-senha', TEXTOS.CONFIRMAR, 'password', 'new-password');
  const erro = criarElemento('p', { class: 'cofre__erro' });
  const lista = criarElemento('ul', { class: 'requisitos' });

  const criar = criarElemento('button', {
    class: 'botao botao--principal botao--largo',
    type: 'submit',
    texto: TEXTOS.CRIAR_ACAO
  });

  function atualizarRequisitos() {
    lista.replaceChildren(
      ...requisitosDaSenha(senha.value).map((requisito) =>
        criarElemento('li', { class: requisito.atendido ? 'requisito requisito--ok' : 'requisito' }, [
          criarElemento('span', { class: 'requisito__marca', 'aria-hidden': 'true' }),
          criarElemento('span', { texto: requisito.rotulo })
        ])
      )
    );
    criar.disabled = !senhaForte(senha.value);
  }

  senha.addEventListener('input', () => {
    atualizarRequisitos();
    erro.textContent = '';
  });

  const formulario = criarElemento('form', {
    class: 'cofre__formulario',
    onSubmit: async (evento) => {
      evento.preventDefault();
      const problema = validarSenha(senha.value, confirmacao.value);
      if (problema) {
        erro.textContent = problema;
        return;
      }

      const novo = await criarCofre(senha.value);
      mostrarCodigo(novo, nome.value.trim() || NOME_PADRAO, acoes, restaurado);
    }
  });

  formulario.append(
    criarElemento('div', { class: 'campo' }, [rotulado(nome, TEXTOS.NOME)]),
    criarElemento('div', { class: 'campo' }, [rotulado(senha, TEXTOS.SENHA)]),
    criarElemento('p', { class: 'requisitos__titulo fraco', texto: TEXTOS.REQUISITOS }),
    lista,
    criarElemento('div', { class: 'campo' }, [rotulado(confirmacao, TEXTOS.CONFIRMAR)]),
    erro,
    criar
  );

  atualizarRequisitos();

  const conteudo = [passos(PASSOS.SENHA), formulario];

  if (outroPerfil) {
    conteudo.push(
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.VOLTAR,
        onClick: () => despachar(ACOES.SELECIONAR_PERFIL, estado.cofre.perfis[PRIMEIRO_PERFIL].id)
      })
    );
  }

  if (!outroPerfil && !restaurado) {
    conteudo.push(
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.JA_TENHO,
        onClick: () => trocarTela(telaRestauracao(voltarParaCriacao))
      })
    );
  }

  return moldura(tituloDaCriacao(outroPerfil, restaurado), ajudaDaCriacao(outroPerfil, restaurado), conteudo);
}

function tituloDaCriacao(outroPerfil, restaurado) {
  if (restaurado) {
    return TEXTOS.RESTAURANDO;
  }
  return outroPerfil ? TEXTOS.CRIAR_OUTRO : TEXTOS.CRIAR;
}

function ajudaDaCriacao(outroPerfil, restaurado) {
  if (restaurado) {
    return TEXTOS.RESTAURANDO_AJUDA;
  }
  return outroPerfil ? TEXTOS.CRIAR_OUTRO_AJUDA : TEXTOS.CRIAR_AJUDA;
}

function mostrarCodigo(novo, nome, acoes, restaurado = null) {
  const grupos = novo.codigo.split(SEPARADOR_DO_CODIGO);

  const confirmar = criarElemento('button', {
    class: 'botao botao--principal botao--largo',
    type: 'button',
    texto: TEXTOS.ABRIR,
    onClick: async () => {
      const perfil = { id: crypto.randomUUID(), nome, criadoEm: new Date().toISOString(), ...novo.perfil };
      await salvarPerfil(perfil);

      if (restaurado) {
        restaurarMapeamentos(restaurado);
      }
      acoes.aoAbrir(perfil, novo.chave, restaurado);
    }
  });
  confirmar.disabled = true;

  const marcador = criarElemento('input', {
    type: 'checkbox',
    id: 'guardei',
    onChange: (evento) => {
      confirmar.disabled = !evento.target.checked;
    }
  });

  trocarTela(
    moldura(TEXTOS.TITULO_CODIGO, TEXTOS.AJUDA_CODIGO, [
      passos(PASSOS.CODIGO),
      criarElemento('div', { class: 'codigo' }, [
        criarElemento(
          'div',
          { class: 'codigo__grupos mono' },
          grupos.map((grupo) => criarElemento('span', { texto: grupo }))
        ),
        criarElemento('div', { class: 'codigo__acoes' }, [
          criarElemento('button', {
            class: 'botao',
            type: 'button',
            texto: TEXTOS.COPIAR,
            onClick: () => copiar(novo.codigo)
          }),
          criarElemento('button', {
            class: 'botao',
            type: 'button',
            texto: TEXTOS.BAIXAR,
            onClick: () => baixarCodigo(novo.codigo)
          })
        ])
      ]),
      criarElemento('p', { class: 'cofre__alerta', texto: TEXTOS.ALERTA_CODIGO }),
      criarElemento('label', { class: 'cofre__confirmacao', for: 'guardei' }, [
        marcador,
        criarElemento('span', { texto: TEXTOS.GUARDEI })
      ]),
      confirmar
    ])
  );
}

function copiar(codigo) {
  navigator.clipboard
    .writeText(codigo)
    .then(() => avisar(TEXTOS.COPIADO, NIVEIS_AVISO.SUCESSO))
    .catch(() => avisar(TEXTOS.ALERTA_CODIGO, NIVEIS_AVISO.ATENCAO));
}

function baixarCodigo(codigo) {
  baixar(ARQUIVO_CODIGO, `${formatarCodigo(codigo)}\n`, TIPO_TEXTO);
}
