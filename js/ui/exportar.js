import { ACOES, NIVEIS_AVISO, TELAS } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import { aplicar } from '../nucleo/filtrar.js';
import { montarAbas } from '../exportacao/abas.js';
import { exportarXlsx } from '../exportacao/xlsx.js';
import { exportarCsv } from '../exportacao/csv.js';
import { baixar } from '../exportacao/arquivo.js';
import {
  MENSAGENS_BACKUP,
  TIPO_BACKUP,
  abrirBackup,
  nomeDoBackup,
  restaurarMapeamentos,
  serializarCifrado
} from '../armazenamento/backup.js';
import { senhaForte, validarSenha } from '../cofre/cofre.js';
import { avisar, criarElemento, estadoVazio } from './componentes.js';
import { icone } from './icones.js';
import { formatarMesLongo } from './formato.js';

const FORMATOS = Object.freeze({ XLSX: 'xlsx', CSV: 'csv' });
const LINHAS_DE_CABECALHO = 1;

const TEXTOS = Object.freeze({
  TITULO: 'Exportar e backup',
  SUBTITULO: 'Leve seus dados para o Excel ou guarde uma cópia do seu cofre.',
  PLANILHA: 'Planilha para o Excel',
  BACKUP: 'Backup do cofre',
  BAIXAR: 'Baixar',
  BAIXAR_BACKUP: 'Baixar backup',
  RESTAURAR: 'Restaurar de um arquivo',
  EXPLICACAO:
    'Um arquivo com tudo: lançamentos, regras, categorias, tags e os formatos de coluna que você mapeou.',
  ALERTA: 'Se os dados deste navegador forem apagados, o backup é a única cópia que existe.',
  CIFRADO: 'O arquivo sai cifrado com a senha que você escolher aqui. Com ela, o backup abre em qualquer navegador.',
  SENHA_BACKUP: 'Senha para proteger o backup',
  SENHA_RESTAURAR: 'Senha do backup que vai restaurar',
  VAZIO_TITULO: 'Nada para exportar ainda',
  VAZIO_TEXTO: 'Importe um extrato e volte aqui para levar os dados para o Excel.',
  VAZIO_ACAO: 'Ir para importação',
  TODOS_BANCOS: 'todos os bancos',
  RESTAURADO: 'Backup restaurado.',
  EXPORTADO: 'Arquivo gerado.'
});

const ROTULOS_FORMATO = Object.freeze({
  [FORMATOS.XLSX]: '.xlsx',
  [FORMATOS.CSV]: '.csv'
});

export function telaExportar(estado) {
  if (estado.lancamentos.length === 0) {
    return vazio();
  }

  return criarElemento('div', { class: 'tela' }, [
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TEXTOS.TITULO }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: TEXTOS.SUBTITULO })
    ]),
    criarElemento('div', { class: 'cartoes' }, [cartaoPlanilha(estado), cartaoBackup(estado)])
  ]);
}

function vazio() {
  const tela = estadoVazio({ titulo: TEXTOS.VAZIO_TITULO, texto: TEXTOS.VAZIO_TEXTO });
  tela.append(
    criarElemento('button', {
      class: 'botao botao--principal',
      type: 'button',
      texto: TEXTOS.VAZIO_ACAO,
      onClick: () => despachar(ACOES.TROCAR_TELA, TELAS.IMPORTAR)
    })
  );
  return tela;
}

function cartaoPlanilha(estado) {
  const visiveis = aplicar(estado.lancamentos, estado.filtros, estado.competencia);
  const abas = montarAbas(visiveis, estado.regras, estado.competencia);

  return criarElemento('section', { class: 'cartao' }, [
    criarElemento('div', { class: 'cartao__cabecalho' }, [
      criarElemento('h2', { texto: TEXTOS.PLANILHA }),
      criarElemento('span', { class: 'fraco', texto: descricaoDoRecorte(estado, visiveis) })
    ]),
    seletorDeFormato(estado),
    criarElemento(
      'div',
      { class: 'cartao__lista' },
      abas.map((aba) =>
        criarElemento('div', { class: 'cartao__linha' }, [
          criarElemento('span', { texto: aba.nome }),
          criarElemento('span', { class: 'mono fraco', texto: contarLinhas(aba) })
        ])
      )
    ),
    criarElemento('button', {
      class: 'botao botao--principal',
      type: 'button',
      texto: `${TEXTOS.BAIXAR} ${ROTULOS_FORMATO[estado.formatoExportacao]}`,
      onClick: () => exportar(estado, visiveis)
    })
  ]);
}

function contarLinhas(aba) {
  const total = aba.linhas.length - LINHAS_DE_CABECALHO;
  return `${total} ${total === 1 ? 'linha' : 'linhas'}`;
}

function seletorDeFormato(estado) {
  return criarElemento(
    'div',
    { class: 'segmentado', role: 'group', 'aria-label': 'Formato' },
    Object.values(FORMATOS).map((formato) =>
      criarElemento('button', {
        class: estado.formatoExportacao === formato ? 'segmentado__item segmentado__item--ativo' : 'segmentado__item',
        type: 'button',
        'aria-pressed': String(estado.formatoExportacao === formato),
        texto: ROTULOS_FORMATO[formato],
        onClick: () => despachar(ACOES.DEFINIR_FORMATO_EXPORTACAO, formato)
      })
    )
  );
}

async function exportar(estado, visiveis) {
  try {
    if (estado.formatoExportacao === FORMATOS.CSV) {
      exportarCsv(visiveis, estado.regras, estado.competencia, estado.filtros.mes);
    } else {
      await exportarXlsx(visiveis, estado.regras, estado.competencia, estado.filtros.mes);
    }
    avisar(TEXTOS.EXPORTADO, NIVEIS_AVISO.SUCESSO);
  } catch (erro) {
    avisar(erro.message, NIVEIS_AVISO.ERRO);
  }
}

function cartaoBackup(estado) {
  const senhaBackup = criarElemento('input', {
    class: 'campo__entrada',
    id: 'senha-do-backup',
    type: 'password',
    autocomplete: 'off',
    'aria-label': TEXTOS.SENHA_BACKUP
  });

  const senhaRestauracao = criarElemento('input', {
    class: 'campo__entrada',
    id: 'senha-restauracao',
    type: 'password',
    autocomplete: 'off',
    'aria-label': TEXTOS.SENHA_RESTAURAR
  });

  const entrada = criarElemento('input', {
    class: 'entrada-arquivo',
    type: 'file',
    accept: '.json',
    'aria-label': TEXTOS.RESTAURAR,
    onChange: (evento) => restaurar(evento.target.files[0], senhaRestauracao.value)
  });

  return criarElemento('section', { class: 'cartao cartao--destaque' }, [
    criarElemento('div', { class: 'cartao__cabecalho' }, [
      criarElemento('h2', { texto: TEXTOS.BACKUP }),
      criarElemento('span', { class: 'fraco', texto: `${estado.lancamentos.length} lançamentos guardados` })
    ]),
    criarElemento('p', { texto: TEXTOS.EXPLICACAO }),
    criarElemento('p', { class: 'fraco', texto: TEXTOS.ALERTA }),
    criarElemento('p', { class: 'faixa-destaque', texto: TEXTOS.CIFRADO }),
    criarElemento('div', { class: 'campo' }, [
      criarElemento('label', { class: 'campo__rotulo', for: 'senha-do-backup', texto: TEXTOS.SENHA_BACKUP }),
      senhaBackup
    ]),
    criarElemento('div', { class: 'cartao__acoes' }, [
      criarElemento(
        'button',
        {
          class: 'botao botao--principal',
          type: 'button',
          onClick: () => gerarBackup(estado, senhaBackup.value)
        },
        [icone('travar', 16), criarElemento('span', { texto: TEXTOS.BAIXAR_BACKUP })]
      )
    ]),
    criarElemento('div', { class: 'campo' }, [
      criarElemento('label', { class: 'campo__rotulo', for: 'senha-restauracao', texto: TEXTOS.SENHA_RESTAURAR }),
      senhaRestauracao
    ]),
    criarElemento('div', { class: 'cartao__acoes' }, [
      criarElemento('label', { class: 'botao' }, [
        criarElemento('span', { texto: TEXTOS.RESTAURAR }),
        entrada
      ])
    ])
  ]);
}

async function gerarBackup(estado, senha) {
  if (!senhaForte(senha)) {
    avisar(validarSenha(senha), NIVEIS_AVISO.ATENCAO);
    return;
  }

  try {
    baixar(nomeDoBackup(), await serializarCifrado(estado, senha), TIPO_BACKUP);
  } catch (erro) {
    avisar(erro.message, NIVEIS_AVISO.ERRO);
  }
}

async function restaurar(arquivo, senha) {
  if (!arquivo) {
    return;
  }

  try {
    const conteudo = await abrirBackup(await arquivo.text(), senha);
    restaurarMapeamentos(conteudo);
    despachar(ACOES.RESTAURAR_BACKUP, conteudo);
    avisar(TEXTOS.RESTAURADO, NIVEIS_AVISO.SUCESSO);
  } catch (erro) {
    avisar(erro.message || MENSAGENS_BACKUP.CONTEUDO_INVALIDO, NIVEIS_AVISO.ERRO);
  }
}

function descricaoDoRecorte(estado, visiveis) {
  const periodo = estado.filtros.mes ? formatarMesLongo(estado.filtros.mes) : 'Todo o período';
  const banco = estado.filtros.banco || TEXTOS.TODOS_BANCOS;
  return `${periodo} · ${banco} · ${visiveis.length} lançamentos`;
}
