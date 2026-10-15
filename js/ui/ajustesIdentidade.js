import { ACOES, TIPOS_IDENTIDADE } from '../nucleo/constantes.js';
import { despachar } from '../estado/store.js';
import {
  acrescentarTermo,
  combina,
  identidadeVazia,
  removerTermo,
  temTermo
} from '../nucleo/identidadePessoal.js';
import { criarElemento } from './componentes.js';
import { icone } from './icones.js';

const TECLA_ENTRA = 'Enter';
const TEXTO_VAZIO = '';
const SINAL_REMOVER = '×';

const TEXTOS = Object.freeze({
  IDENTIDADE: 'Quem é você',
  IDENTIDADE_AJUDA:
    'Quando você manda dinheiro de uma conta sua para outra conta sua, o banco registra isso como transferência comum, e o sistema contaria como gasto de um lado e entrada do outro. Com seus dados aqui, esses lançamentos saem do total dos dois lados.',
  PRIVACIDADE: 'Isto fica cifrado no cofre deste navegador, como o resto. Nada é enviado para lugar nenhum.',
  ACRESCENTAR: 'Acrescentar',
  REMOVER: 'Remover',
  SEM_TERMO: 'Nada cadastrado ainda.',
  LANCAMENTO: 'lançamento',
  LANCAMENTOS: 'lançamentos',
  EFEITO_VAZIO: 'Nenhum lançamento sai do total por identidade.',
  FORA_DO_TOTAL: 'fora do total por serem transferência entre contas suas.'
});

const CAMPOS = Object.freeze([
  {
    tipo: TIPOS_IDENTIDADE.NOMES,
    rotulo: 'Seus nomes',
    ajuda: 'Como seu nome aparece no extrato. Escreva o nome inteiro, não só o primeiro.',
    exemplo: 'Maria Silva Souza'
  },
  {
    tipo: TIPOS_IDENTIDADE.DOCUMENTOS,
    rotulo: 'Seus documentos',
    ajuda: 'Cole o CPF inteiro. Funciona também se o extrato imprimir só parte dele, mascarado.',
    exemplo: '123.421.581-00'
  },
  {
    tipo: TIPOS_IDENTIDADE.CONTAS,
    rotulo: 'Suas contas em outros bancos',
    ajuda: 'O número da conta que aparece na descrição da transferência.',
    exemplo: '39293325-0'
  }
]);

export function secaoIdentidade(estado) {
  return criarElemento('section', { class: 'ajustes__secao' }, [
    criarElemento('h2', { texto: TEXTOS.IDENTIDADE }),
    criarElemento('p', { class: 'ajustes__ajuda', texto: TEXTOS.IDENTIDADE_AJUDA }),
    criarElemento('p', { class: 'privacidade' }, [
      icone('travar', 16),
      criarElemento('span', { texto: TEXTOS.PRIVACIDADE })
    ]),
    criarElemento('div', { class: 'ajustes__campos' }, CAMPOS.map((campo) => grupo(campo, estado))),
    criarElemento('p', { class: 'ajustes__efeito', texto: efeito(estado) })
  ]);
}

function grupo(campo, estado) {
  const termos = estado.identidade[campo.tipo] ?? [];

  return criarElemento('div', { class: 'ajustes__campo' }, [
    criarElemento('span', { class: 'campo__rotulo', texto: campo.rotulo }),
    criarElemento('span', { class: 'ajustes__ajuda', texto: campo.ajuda }),
    entrada(campo, estado),
    termos.length === 0
      ? criarElemento('span', { class: 'fraco', texto: TEXTOS.SEM_TERMO })
      : criarElemento('div', { class: 'ajustes__lista' }, termos.map((termo) => ficha(campo, termo, estado)))
  ]);
}

function entrada(campo, estado) {
  const texto = criarElemento('input', {
    class: 'campo__entrada',
    type: 'text',
    placeholder: campo.exemplo,
    'aria-label': campo.rotulo,
    onKeydown: (evento) => {
      if (evento.key === TECLA_ENTRA) {
        evento.preventDefault();
        acrescentar(campo, estado, texto);
      }
    }
  });

  return criarElemento('div', { class: 'ajustes__entrada' }, [
    texto,
    criarElemento('button', {
      class: 'botao',
      type: 'button',
      texto: TEXTOS.ACRESCENTAR,
      onClick: () => acrescentar(campo, estado, texto)
    })
  ]);
}

function acrescentar(campo, estado, entradaDeTexto) {
  despachar(ACOES.DEFINIR_IDENTIDADE, acrescentarTermo(estado.identidade, campo.tipo, entradaDeTexto.value));
  entradaDeTexto.value = TEXTO_VAZIO;
}

function ficha(campo, termo, estado) {
  const quantidade = alcanceDoTermo(estado.lancamentos, campo.tipo, termo);

  return criarElemento('span', { class: 'ajustes__ficha' }, [
    criarElemento('span', { texto: termo }),
    criarElemento('span', { class: 'fraco', texto: contarLancamentos(quantidade) }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      'aria-label': `${TEXTOS.REMOVER} ${termo}`,
      texto: SINAL_REMOVER,
      onClick: () => despachar(ACOES.DEFINIR_IDENTIDADE, removerTermo(estado.identidade, campo.tipo, termo))
    })
  ]);
}

function alcanceDoTermo(lancamentos, tipo, termo) {
  const sozinho = acrescentarTermo(identidadeVazia(), tipo, termo);
  return lancamentos.filter((lancamento) => combina(lancamento.descricaoOriginal, sozinho)).length;
}

function contarLancamentos(quantidade) {
  const palavra = quantidade === 1 ? TEXTOS.LANCAMENTO : TEXTOS.LANCAMENTOS;
  return `${quantidade} ${palavra}`;
}

function efeito(estado) {
  if (!temTermo(estado.identidade)) {
    return TEXTOS.EFEITO_VAZIO;
  }

  const quantidade = estado.lancamentos.filter((lancamento) =>
    combina(lancamento.descricaoOriginal, estado.identidade)
  ).length;

  return `${contarLancamentos(quantidade)} ${TEXTOS.FORA_DO_TOTAL}`;
}
