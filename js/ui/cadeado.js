import { ACOES, ESTADOS_COFRE, LIMITE_DE_PERFIS, NIVEIS_AVISO } from '../nucleo/constantes.js';
import { ENDERECO_DO_TERMO } from '../privacidade/termo.js';
import { despachar } from '../estado/store.js';
import {
  abrirComCodigo,
  abrirComSenha,
  criarCofre,
  requisitosDaSenha,
  senhaForte,
  validarSenha
} from '../cofre/cofre.js';
import { codigoCompleto, formatarCodigo } from '../cofre/recuperacao.js';
import { removerPerfil, salvarPerfil } from '../armazenamento/banco.js';
import { MENSAGENS_BACKUP, abrirBackup, restaurarMapeamentos } from '../armazenamento/backup.js';
import { baixar } from '../exportacao/arquivo.js';
import { avisar, criarElemento } from './componentes.js';
import { marca } from './icones.js';

const PASSOS = Object.freeze({ SENHA: 1, CODIGO: 2 });
const NOME_PADRAO = 'Pessoal';
const TIPO_TEXTO = 'text/plain';
const ARQUIVO_CODIGO = 'codigo-de-recuperacao-gastos-controller.txt';
const NOVO_PERFIL = 'novo';

const TEXTOS = Object.freeze({
  TRANCADO: 'Cofre trancado',
  TRANCADO_AJUDA: 'Digite a senha do seu cofre.',
  ESCOLHA_PERFIL: 'Escolha o perfil e digite a senha.',
  CRIAR: 'Criar seu cofre',
  CRIAR_AJUDA:
    'Seus extratos ficam cifrados neste navegador. A senha nunca sai daqui, e é ela que abre o cofre.',
  CRIAR_OUTRO: 'Criar outro perfil',
  CRIAR_OUTRO_AJUDA: 'Cada perfil tem a própria senha e o próprio cofre. Um não enxerga os dados do outro.',
  NOME: 'Nome do perfil',
  SENHA: 'Senha',
  CONFIRMAR: 'Repita a senha',
  REQUISITOS: 'A senha precisa ter',
  CRIAR_ACAO: 'Criar cofre',
  DESTRAVAR: 'Destravar',
  USAR_CODIGO: 'Esqueci a senha — usar o código de recuperação',
  USAR_SENHA: 'Voltar para a senha',
  CODIGO: 'Código de recuperação',
  CODIGO_INCOMPLETO: 'O código tem 24 caracteres, em seis grupos de quatro.',
  TITULO_CODIGO: 'Guarde seu código de recuperação',
  AJUDA_CODIGO: 'Se um dia você esquecer a senha, é ele que abre o cofre. Ele aparece só agora, uma única vez.',
  ALERTA_CODIGO:
    'Guarde fora deste navegador: num gerenciador de senhas ou num papel. Sem a senha e sem este código, os dados ficam inacessíveis para sempre. Não existe recuperação por e-mail.',
  COPIAR: 'Copiar',
  BAIXAR: 'Baixar .txt',
  GUARDEI: 'Guardei o código num lugar seguro',
  ABRIR: 'Abrir meu cofre',
  NOVO: 'Novo',
  VOLTAR: 'Voltar',
  APAGAR: 'Apagar este perfil',
  APAGAR_CONFIRMAR: 'Apagar mesmo? Não tem volta',
  APAGADO: 'Perfil apagado.',
  JA_TENHO: 'Já tenho um cofre — restaurar de um backup',
  RESTAURAR_TITULO: 'Restaurar de um backup',
  RESTAURAR_AJUDA:
    'Escolha o arquivo de backup e digite a senha que você usou para protegê-lo. Em seguida você cria o cofre deste navegador.',
  ARQUIVO: 'Arquivo de backup',
  SENHA_BACKUP: 'Senha do backup',
  ABRIR_BACKUP: 'Abrir backup',
  SEM_ARQUIVO: 'Escolha o arquivo de backup.',
  BACKUP_ABERTO: 'Backup aberto. Agora crie a senha deste navegador.',
  RESTAURANDO: 'Restaurando do backup',
  RESTAURANDO_AJUDA:
    'O backup foi aberto. Crie a senha que vai proteger este cofre no navegador atual: ela pode ser diferente da senha do arquivo.',
  RODAPE: 'Seus dados ficam cifrados neste navegador. Sem a senha ou o código, ninguém abre, nem nós.',
  LER_TERMO: 'Ler o termo de privacidade',
  COPIADO: 'Código copiado.',
  PASSOS: Object.freeze(['Senha', 'Código', 'Pronto'])
});

export function telaMensagem(titulo, texto, detalhe) {
  const conteudo = detalhe ? [criarElemento('p', { class: 'cofre__erro mono', texto: detalhe })] : [];
  return moldura(titulo, texto, conteudo);
}

export function telaCofre(estado, acoes) {
  if (estado.cofre.situacao === ESTADOS_COFRE.SEM_COFRE) {
    return telaCriacao(estado, acoes, false);
  }
  if (estado.cofre.perfil === null) {
    return telaCriacao(estado, acoes, true);
  }
  return telaDesbloqueio(estado, acoes);
}

function telaRestauracao(estado, acoes) {
  const arquivo = criarElemento('input', {
    class: 'campo__entrada',
    id: 'arquivo-backup',
    type: 'file',
    accept: '.json',
    'aria-label': TEXTOS.ARQUIVO
  });

  const senha = campoSecreto('senha-backup', TEXTOS.SENHA_BACKUP, 'password', 'off');
  const erro = criarElemento('p', { class: 'cofre__erro' });

  const formulario = criarElemento('form', {
    class: 'cofre__formulario',
    onSubmit: async (evento) => {
      evento.preventDefault();
      const escolhido = arquivo.files[0];

      if (!escolhido) {
        erro.textContent = TEXTOS.SEM_ARQUIVO;
        return;
      }

      try {
        const conteudo = await abrirBackup(await escolhido.text(), senha.value);
        avisar(TEXTOS.BACKUP_ABERTO, NIVEIS_AVISO.SUCESSO);
        trocarTela(telaCriacao(estado, acoes, false, conteudo));
      } catch (falha) {
        erro.textContent = falha.message || MENSAGENS_BACKUP.CONTEUDO_INVALIDO;
      }
    }
  });

  formulario.append(
    criarElemento('div', { class: 'campo' }, [rotulado(arquivo, TEXTOS.ARQUIVO)]),
    criarElemento('div', { class: 'campo' }, [rotulado(senha, TEXTOS.SENHA_BACKUP)]),
    erro,
    criarElemento('button', {
      class: 'botao botao--principal botao--largo',
      type: 'submit',
      texto: TEXTOS.ABRIR_BACKUP
    }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.VOLTAR,
      onClick: () => trocarTela(telaCriacao(estado, acoes, false))
    })
  );

  return moldura(TEXTOS.RESTAURAR_TITULO, TEXTOS.RESTAURAR_AJUDA, [formulario]);
}

function trocarTela(conteudo) {
  document.getElementById('app').replaceChildren(conteudo);
}

function telaDesbloqueio(estado, acoes) {
  const senha = campoSecreto('senha-cofre', TEXTOS.SENHA);
  const codigo = campoSecreto('codigo-cofre', TEXTOS.CODIGO, 'text');
  const erro = criarElemento('p', { class: 'cofre__erro', texto: estado.cofre.erro });

  let comCodigo = false;

  const campo = criarElemento('div', { class: 'campo' }, [rotulado(senha, rotuloDaSenha(estado))]);

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
          ? await abrirComCodigo(estado.cofre.perfil, codigo.value)
          : await abrirComSenha(estado.cofre.perfil, senha.value);
        acoes.aoAbrir(estado.cofre.perfil, chave);
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
      campo.replaceChildren(comCodigo ? rotulado(codigo, TEXTOS.CODIGO) : rotulado(senha, rotuloDaSenha(estado)));
      erro.textContent = '';
      (comCodigo ? codigo : senha).focus();
    }
  });

  formulario.append(
    campo,
    erro,
    criarElemento('button', { class: 'botao botao--principal botao--largo', type: 'submit', texto: TEXTOS.DESTRAVAR }),
    alternar
  );

  const ajuda = estado.cofre.perfis.length > 1 ? TEXTOS.ESCOLHA_PERFIL : TEXTOS.TRANCADO_AJUDA;

  return moldura(TEXTOS.TRANCADO, ajuda, [escolhaDePerfis(estado), formulario, apagarPerfil(estado, acoes)]);
}

function escolhaDePerfis(estado) {
  const botoes = estado.cofre.perfis.map((perfil) =>
    criarElemento(
      'button',
      {
        class: perfil.id === estado.cofre.perfil?.id ? 'perfil perfil--ativo' : 'perfil',
        type: 'button',
        role: 'radio',
        'aria-checked': String(perfil.id === estado.cofre.perfil?.id),
        onClick: () => despachar(ACOES.SELECIONAR_PERFIL, perfil.id)
      },
      [
        criarElemento('span', { class: 'perfil__inicial', texto: inicialDe(perfil.nome) }),
        criarElemento('span', { texto: perfil.nome })
      ]
    )
  );

  if (estado.cofre.perfis.length < LIMITE_DE_PERFIS) {
    botoes.push(
      criarElemento(
        'button',
        {
          class: 'perfil',
          type: 'button',
          onClick: () => despachar(ACOES.SELECIONAR_PERFIL, NOVO_PERFIL)
        },
        [
          criarElemento('span', { class: 'perfil__inicial perfil__inicial--novo', texto: '+' }),
          criarElemento('span', { texto: TEXTOS.NOVO })
        ]
      )
    );
  }

  return criarElemento('div', { class: 'perfis', role: 'radiogroup', 'aria-label': TEXTOS.NOME }, botoes);
}

function apagarPerfil(estado, acoes) {
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

function telaCriacao(estado, acoes, outroPerfil, restaurado = null) {
  const nome = criarElemento('input', {
    class: 'campo__entrada',
    id: 'nome-perfil',
    type: 'text',
    value: outroPerfil ? '' : NOME_PADRAO,
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
        onClick: () => despachar(ACOES.SELECIONAR_PERFIL, estado.cofre.perfis[0].id)
      })
    );
  }

  if (!outroPerfil && !restaurado) {
    conteudo.push(
      criarElemento('button', {
        class: 'botao botao--discreto',
        type: 'button',
        texto: TEXTOS.JA_TENHO,
        onClick: () => trocarTela(telaRestauracao(estado, acoes))
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
  const grupos = novo.codigo.split('-');

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

function moldura(titulo, ajuda, conteudo) {
  return criarElemento('div', { class: 'cofre' }, [
    criarElemento('div', { class: 'cofre__caixa' }, [
      criarElemento('span', { class: 'cofre__marca' }, [marca(64)]),
      criarElemento('div', { class: 'cofre__titulo' }, [
        criarElemento('h1', { texto: titulo }),
        criarElemento('p', { class: 'fraco', texto: ajuda })
      ]),
      ...conteudo
    ]),
    criarElemento('p', { class: 'cofre__rodape fraco' }, [
      criarElemento('span', { texto: `${TEXTOS.RODAPE} ` }),
      criarElemento('a', { href: ENDERECO_DO_TERMO, texto: TEXTOS.LER_TERMO })
    ])
  ]);
}

function passos(ativo) {
  return criarElemento(
    'div',
    { class: 'passos' },
    TEXTOS.PASSOS.map((rotulo, indice) =>
      criarElemento('span', { class: indice + 1 === ativo ? 'passo passo--ativo' : 'passo' }, [
        criarElemento('b', { texto: String(indice + 1) }),
        criarElemento('span', { texto: rotulo })
      ])
    )
  );
}

function campoSecreto(id, rotulo, tipo = 'password', preenchimento = 'current-password') {
  return criarElemento('input', {
    class: 'campo__entrada campo__entrada--grande',
    id,
    type: tipo,
    'aria-label': rotulo,
    autocomplete: tipo === 'password' ? preenchimento : 'off'
  });
}

function rotulado(entrada, rotulo) {
  return criarElemento('span', { class: 'campo' }, [
    criarElemento('label', { class: 'campo__rotulo', for: entrada.id, texto: rotulo }),
    entrada
  ]);
}

function rotuloDaSenha(estado) {
  if (estado.cofre.perfis.length <= 1) {
    return TEXTOS.SENHA;
  }
  return `${TEXTOS.SENHA} do perfil ${estado.cofre.perfil.nome}`;
}

function inicialDe(nome) {
  return String(nome ?? '').trim().charAt(0).toUpperCase() || '?';
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
