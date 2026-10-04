import { descrever, esperar, isso } from '../runner.js';
import { NOMES_ABAS, montarAbas } from '../../js/exportacao/abas.js';
import { montarCsv } from '../../js/exportacao/csv.js';
import { nomeDoArquivo } from '../../js/exportacao/arquivo.js';
import {
  FORMATO_BACKUP,
  MENSAGENS_BACKUP,
  VERSAO_BACKUP,
  interpretar,
  montarBackup
} from '../../js/armazenamento/backup.js';

import { criarRegra } from '../../js/nucleo/regras.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { COMPETENCIA, MOTIVOS_NAO_GASTO, OPERADORES_REGRA, ORIGENS_REGRA } from '../../js/nucleo/constantes.js';

function lancamento(descricao, valor, data, campos = {}) {
  return {
    ...preparar({
      data,
      valor,
      descricaoOriginal: descricao,
      banco: 'Itau',
      arquivo: 'extrato.ofx'
    }),
    id: descricao,
    categoria: campos.categoria ?? 'Mercado',
    ...campos
  };
}

const regraDoDicionario = criarRegra({
  operador: OPERADORES_REGRA.CONTEM,
  termo: 'UBER',
  categoria: 'Transporte',
  origem: ORIGENS_REGRA.SEMENTE
});

const lancamentos = [
  lancamento('ASSAI ATACADISTA', '-312,70', '12/09/2026'),
  lancamento('UBER *TRIP', '-23,45', '08/09/2026', {
    categoria: 'Transporte',
    tags: ['trabalho'],
    regra: regraDoDicionario.id
  }),
  lancamento('PAG FATURA', '-842,60', '29/09/2026', { naoGasto: MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA }),
  lancamento('SALARIO', '4200,00', '05/09/2026', { categoria: 'Outros' })
];

const regraDoUsuario = criarRegra({ operador: OPERADORES_REGRA.CONTEM, termo: 'ASSAI', categoria: 'Mercado' });

const regraNuncaUsada = criarRegra({
  operador: OPERADORES_REGRA.CONTEM,
  termo: 'NETFLIX',
  categoria: 'Assinaturas',
  origem: ORIGENS_REGRA.SEMENTE
});

const regras = [regraDoUsuario, regraDoDicionario, regraNuncaUsada];

const abas = montarAbas(lancamentos, regras, COMPETENCIA.COMPRA);
const porNome = (nome) => abas.find((aba) => aba.nome === nome);

descrever('Abas do export', () => {
  isso('gera as quatro abas previstas', () => {
    esperar(abas.map((aba) => aba.nome)).igual([
      NOMES_ABAS.TRANSACOES,
      NOMES_ABAS.CATEGORIAS,
      NOMES_ABAS.MESES,
      NOMES_ABAS.REGRAS
    ]);
  });

  isso('a aba de transacoes tem cabecalho e uma linha por lancamento', () => {
    esperar(porNome(NOMES_ABAS.TRANSACOES).linhas.length).igual(lancamentos.length + 1);
  });

  isso('exporta valor como numero, nao como texto', () => {
    const linha = porNome(NOMES_ABAS.TRANSACOES).linhas[1];
    esperar(typeof linha[linha.length - 3]).igual('number');
    esperar(linha[linha.length - 3]).igual(-312.7);
  });

  isso('marca o que nao conta no total e o motivo', () => {
    const linhas = porNome(NOMES_ABAS.TRANSACOES).linhas;
    const fatura = linhas.find((linha) => linha[2] === 'PAG FATURA');
    esperar(fatura[fatura.length - 2]).igual('não');
    esperar(fatura[fatura.length - 1]).contem('fatura');
  });

  isso('a soma da aba de categorias bate com a aba de transacoes', () => {
    const categorias = porNome(NOMES_ABAS.CATEGORIAS).linhas.slice(1);
    const somaCategorias = categorias.reduce((total, linha) => total + linha[1], 0);

    const transacoes = porNome(NOMES_ABAS.TRANSACOES).linhas.slice(1);
    const somaGastos = transacoes
      .filter((linha) => linha[linha.length - 2] === 'sim')
      .map((linha) => linha[linha.length - 3])
      .filter((valor) => valor < 0)
      .reduce((total, valor) => total + valor, 0);

    esperar(Math.round(somaCategorias * 100)).igual(Math.round(somaGastos * 100));
  });

  isso('a aba de meses lista um mes', () => {
    esperar(porNome(NOMES_ABAS.MESES).linhas.length).igual(2);
  });

  isso('a aba de regras identifica a origem de cada uma', () => {
    const linhas = porNome(NOMES_ABAS.REGRAS).linhas;
    esperar(linhas[1][1]).igual('sua regra');
    esperar(linhas[2][1]).igual('dicionário');
  });

  isso('leva do dicionario apenas as regras que foram aplicadas', () => {
    const termos = porNome(NOMES_ABAS.REGRAS)
      .linhas.slice(1)
      .map((linha) => linha[3]);
    esperar(termos.includes('UBER')).verdadeiro();
    esperar(termos.includes('NETFLIX')).falso();
  });

  isso('exporta apenas o que foi passado, respeitando o filtro', () => {
    const recorte = montarAbas([lancamentos[0]], regras, COMPETENCIA.COMPRA);
    esperar(recorte[0].linhas.length).igual(2);
  });
});

descrever('Export em CSV', () => {
  const csv = montarCsv(lancamentos, regras, COMPETENCIA.COMPRA);

  isso('comeca com a marca UTF-8 para o Excel nao quebrar acento', () => {
    esperar(csv.charCodeAt(0)).igual(0xfeff);
  });

  isso('usa ponto e virgula como separador', () => {
    esperar(csv.split('\r\n')[0]).contem('Data;Competência');
  });

  isso('usa virgula decimal no valor', () => {
    esperar(csv).contem('-312,70');
  });

  isso('tem uma linha por lancamento mais o cabecalho', () => {
    const linhas = csv.trim().split('\r\n');
    esperar(linhas.length).igual(lancamentos.length + 1);
  });

  isso('protege com aspas o texto que contem o separador', () => {
    const comSeparador = [lancamento('LOJA; FILIAL 2', '-10,00', '05/09/2026')];
    esperar(montarCsv(comSeparador, [], COMPETENCIA.COMPRA)).contem('"LOJA; FILIAL 2"');
  });
});

descrever('Nome do arquivo', () => {
  isso('usa o mes filtrado', () => {
    esperar(nomeDoArquivo('gastos', '2026-09', 'xlsx')).igual('gastos-2026-09.xlsx');
  });

  isso('marca como completo quando nao ha mes', () => {
    esperar(nomeDoArquivo('gastos', '', 'csv')).igual('gastos-completo.csv');
  });
});

function comEnvelope(conteudo, extras = {}) {
  return JSON.stringify({ formato: FORMATO_BACKUP, versao: VERSAO_BACKUP, ...conteudo, ...extras });
}

descrever('Backup', () => {
  const estado = {
    lancamentos,
    regras,
    categorias: ['Mercado', 'Transporte', 'Outros']
  };

  isso('guarda lancamentos, regras do usuario e categorias', () => {
    const backup = montarBackup(estado);
    esperar(backup.lancamentos.length).igual(lancamentos.length);
    esperar(backup.regras.length).igual(1);
    esperar(backup.categorias.length).igual(3);
  });

  isso('nao guarda o dicionario semente', () => {
    esperar(montarBackup(estado).regras.every((regra) => regra.origem === ORIGENS_REGRA.USUARIO)).verdadeiro();
  });

  isso('ainda abre backup em texto claro gerado por versao anterior', () => {
    const restaurado = interpretar(comEnvelope(montarBackup(estado)));
    esperar(restaurado.lancamentos.length).igual(lancamentos.length);
    esperar(restaurado.lancamentos[0].descricaoOriginal).igual(lancamentos[0].descricaoOriginal);
    esperar(restaurado.regras[0].termo).igual('ASSAI');
  });

  isso('recusa arquivo que nao e backup', () => {
    esperar(() => interpretar('{"alguma":"coisa"}')).lancaErro(MENSAGENS_BACKUP.FORMATO_INVALIDO);
  });

  isso('recusa arquivo corrompido', () => {
    esperar(() => interpretar('nao e json')).lancaErro(MENSAGENS_BACKUP.FORMATO_INVALIDO);
  });

  isso('recusa backup de versao mais nova', () => {
    const futuro = comEnvelope(montarBackup(estado), { versao: 99 });
    esperar(() => interpretar(futuro)).lancaErro(MENSAGENS_BACKUP.VERSAO_INCOMPATIVEL);
  });

  isso('preserva categoria e marcação manual de cada lançamento', () => {
    const editado = { ...lancamentos[0], categoria: 'Lazer', revisadoManual: true };
    const restaurado = interpretar(
      comEnvelope(montarBackup({ ...estado, lancamentos: [editado, lancamentos[1]] }))
    );

    esperar(restaurado.lancamentos[0].categoria).igual('Lazer');
    esperar(restaurado.lancamentos[0].revisadoManual).verdadeiro();
    esperar(restaurado.lancamentos[1].revisadoManual).falso();
  });

  isso('nao inventa marcação manual em lançamento que nunca foi editado', () => {
    const restaurado = interpretar(comEnvelope(montarBackup(estado)));
    esperar(restaurado.lancamentos.every((lancamento) => lancamento.revisadoManual === false)).verdadeiro();
  });

  isso('recusa backup sem lancamentos', () => {
    const quebrado = comEnvelope({ ...montarBackup(estado), lancamentos: null });
    esperar(() => interpretar(quebrado)).lancaErro(MENSAGENS_BACKUP.CONTEUDO_INVALIDO);
  });
});
