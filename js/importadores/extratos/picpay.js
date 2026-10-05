import { deCentavos, paraCentavos } from '../../nucleo/dinheiro.js';
import { paraIso } from '../../nucleo/datas.js';
import { normalizarItens } from '../faturas/layout.js';
import { daColuna, descobrirColunas } from './colunas.js';

export const BANCO = 'PicPay';
export const CONTA = 'Conta';

const COLUNAS = Object.freeze({
  HORA: 'Hora',
  TIPO: 'Tipo',
  ORIGEM: 'Origem / Destino',
  FORMA: 'Forma de pagamento',
  VALOR: 'Valor'
});

const NOMES_DAS_COLUNAS = Object.freeze([
  COLUNAS.HORA,
  COLUNAS.TIPO,
  COLUNAS.ORIGEM,
  COLUNAS.FORMA,
  COLUNAS.VALOR
]);

const MESES = Object.freeze({
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
});

const PADRAO_HORA = /^\d{1,2}:\d{2}$/;
const PADRAO_DIA = /^(\d{1,2})\s+de\s+([a-zç]+)\s+(?:de\s+)?(\d{4})/i;
const MARCA_EXTRATO = 'extrato de conta';
const ACENTOS = /[̀-ͯ]/g;

const ALTURA_PADRAO_DA_LINHA = 36;
const TOLERANCIA_MESMA_LINHA = 3;
const METADE = 2;
const ESPACO = ' ';
const TEXTO_VAZIO = '';
const PRIMEIRA_PAGINA = 1;

export const MOTIVOS_PENDENCIA_EXTRATO = Object.freeze({
  SEM_CABECALHO: 'a página não traz o cabeçalho de colunas do extrato',
  SEM_DATA: 'o lançamento aparece antes de qualquer data de dia',
  SEM_VALOR: 'a linha não tem valor na coluna Valor',
  VALOR_ILEGIVEL: 'o valor não pôde ser interpretado',
  SEM_DESCRICAO: 'a linha não tem tipo nem contraparte'
});

export function ehExtratoPicpay(linhas) {
  const texto = semAcento(linhas.join(ESPACO));
  return texto.includes(semAcento(BANCO)) && texto.includes(MARCA_EXTRATO);
}

export function lerExtratoPicpay(paginas, contexto = {}) {
  const lancamentos = [];
  const pendencias = [];
  let diaAtual = null;

  paginas.forEach((pagina, indice) => {
    const itens = normalizarItens(pagina.itens);
    const colunas = descobrirColunas(itens, NOMES_DAS_COLUNAS);

    if (!colunas) {
      if (temLancamento(itens)) {
        pendencias.push({
          linha: indice + PRIMEIRA_PAGINA,
          texto: `página ${indice + PRIMEIRA_PAGINA}`,
          motivo: MOTIVOS_PENDENCIA_EXTRATO.SEM_CABECALHO
        });
      }
      return;
    }

    const naColunaHora = daColuna(colunas, COLUNAS.HORA, itens);
    const ancoras = naColunaHora.filter((item) => PADRAO_HORA.test(item.texto)).sort(deCimaParaBaixo);
    const dias = naColunaHora.filter((item) => PADRAO_DIA.test(item.texto)).sort(deCimaParaBaixo);

    ancoras.forEach((ancora, posicao) => {
      diaAtual = diaMaisProximoAcima(dias, ancora) || diaAtual;
      const resultado = montarLancamento(ancora, posicao, ancoras, itens, colunas, diaAtual, contexto);

      if (resultado.motivo) {
        pendencias.push({ linha: lancamentos.length + pendencias.length + PRIMEIRA_PAGINA, texto: resultado.texto, motivo: resultado.motivo });
        return;
      }
      lancamentos.push(resultado.bruto);
    });
  });

  return { lancamentos, pendencias };
}

function montarLancamento(ancora, posicao, ancoras, itens, colunas, dia, contexto) {
  const faixa = faixaDaLinha(ancora, posicao, ancoras);
  const naFaixa = itens.filter((item) => item.base <= faixa.topo && item.base >= faixa.base);
  const naLinha = naFaixa.filter((item) => Math.abs(item.base - ancora.base) <= TOLERANCIA_MESMA_LINHA);

  const tipo = juntar(daColuna(colunas, COLUNAS.TIPO, naLinha));
  const origem = juntar(daColuna(colunas, COLUNAS.ORIGEM, naFaixa));
  const valorTexto = juntar(daColuna(colunas, COLUNAS.VALOR, naLinha));
  const descricao = `${tipo} ${origem}`.trim();

  if (!dia) {
    return { texto: descricao || ancora.texto, motivo: MOTIVOS_PENDENCIA_EXTRATO.SEM_DATA };
  }
  if (valorTexto === TEXTO_VAZIO) {
    return { texto: descricao || ancora.texto, motivo: MOTIVOS_PENDENCIA_EXTRATO.SEM_VALOR };
  }
  if (descricao === TEXTO_VAZIO) {
    return { texto: `${ancora.texto} ${valorTexto}`, motivo: MOTIVOS_PENDENCIA_EXTRATO.SEM_DESCRICAO };
  }

  const centavos = paraCentavos(valorTexto);
  if (centavos === null) {
    return { texto: `${descricao} ${valorTexto}`, motivo: MOTIVOS_PENDENCIA_EXTRATO.VALOR_ILEGIVEL };
  }

  return {
    bruto: {
      ...contexto,
      data: dia,
      valor: deCentavos(centavos),
      descricaoOriginal: descricao,
      metodo: contexto.metodo
    }
  };
}

function faixaDaLinha(ancora, posicao, ancoras) {
  const acima = ancoras[posicao - 1];
  const abaixo = ancoras[posicao + 1];
  const folga = ALTURA_PADRAO_DA_LINHA / METADE;

  return {
    topo: acima ? (ancora.base + acima.base) / METADE : ancora.base + folga,
    base: abaixo ? (ancora.base + abaixo.base) / METADE : ancora.base - folga
  };
}

function diaMaisProximoAcima(dias, ancora) {
  const candidatos = dias.filter((dia) => dia.base > ancora.base);
  if (candidatos.length === 0) {
    return null;
  }
  return paraIsoDoDia(candidatos[candidatos.length - 1].texto);
}

function paraIsoDoDia(texto) {
  const achado = PADRAO_DIA.exec(texto);
  if (!achado) {
    return null;
  }
  const mes = MESES[semAcento(achado[2])];
  if (!mes) {
    return null;
  }
  return paraIso(`${achado[1]}/${mes}/${achado[3]}`);
}

function temLancamento(itens) {
  return itens.some((item) => PADRAO_HORA.test(item.texto));
}

function juntar(itens) {
  return [...itens]
    .sort(deCimaParaBaixo)
    .map((item) => item.texto)
    .join(ESPACO)
    .trim();
}

function deCimaParaBaixo(um, outro) {
  return outro.base - um.base;
}

function semAcento(texto) {
  return texto.normalize('NFD').replace(ACENTOS, TEXTO_VAZIO).toLowerCase();
}
