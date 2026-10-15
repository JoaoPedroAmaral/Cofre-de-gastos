import { descrever, esperar, isso } from '../runner.js';
import {
  ACOES,
  COMPETENCIA,
  MOTIVOS_NAO_GASTO,
  OPERADORES_REGRA,
  TIPOS_IDENTIDADE,
  TIPOS_SUGESTAO
} from '../../js/nucleo/constantes.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import {
  acrescentarTermo,
  candidatosDe,
  combina,
  identidadeVazia,
  removerTermo
} from '../../js/nucleo/identidadePessoal.js';
import {
  ehEntrada,
  ehGasto,
  estaForaDoTotal,
  motivoDe,
  motivoForaDoTotal,
  reavaliar,
  rotuloForaDoTotal
} from '../../js/nucleo/naoGasto.js';
import { migrar } from '../../js/nucleo/modelo.js';
import { metricas } from '../../js/nucleo/agregar.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { mesclar } from '../../js/nucleo/deduplicar.js';
import { montarAbas } from '../../js/exportacao/abas.js';

const NOME = 'Joao Pedro Amaral Rosa';
const DOCUMENTO = '•••.421.581-••';
const CONTA = '39293325-0';

const RECEBIDO_DE_SI =
  'Transferência recebida pelo Pix - JOAO PEDRO AMARAL ROSA - •••.421.581-•• - PICPAY (0380) Agência: 1 Conta: 39293325-0';
const ENVIADO_PARA_SI =
  'Transferência enviada pelo Pix - Joao Pedro Amaral Rosa - •••.421.581-•• - PICPAY (0380) Agência: 1 Conta: 39293325-0';
const ENVIADO_PARA_TERCEIRO =
  'Transferência enviada pelo Pix - Ester da Silva Freitas - •••.666.061-•• - PICPAY (0380) Agência: 1 Conta: 62981737-5';

function comNome() {
  return acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, NOME);
}

function lancamento(descricao, valor, extras = {}) {
  return {
    ...preparar(
      {
        data: '04/09/2026',
        valor,
        descricaoOriginal: descricao,
        banco: 'Nubank',
        arquivo: 'extrato.ofx'
      },
      extras.identidade
    ),
    id: extras.id ?? descricao,
    ...(extras.campos ?? {})
  };
}

const GRUPOS_DE_SETEMBRO = Object.freeze([
  { descricao: RECEBIDO_DE_SI, valor: '1424,43' },
  { descricao: 'Resgate RDB', valor: '800,00' },
  { descricao: 'Crédito em conta', valor: '14,10' },
  { descricao: 'Aplicação RDB', valor: '-1014,00' },
  { descricao: 'Pagamento de fatura', valor: '-526,56' },
  { descricao: ENVIADO_PARA_TERCEIRO, valor: '-360,00' },
  { descricao: 'Transferência enviada pelo Pix - IFOOD.COM AGENCIA - 14.380.200/0001-21', valor: '-168,35' },
  { descricao: 'Transferência enviada pelo Pix - FLAVIO PEREIRA DE SOUSA - •••.893.821-••', valor: '-100,00' },
  { descricao: 'Transferência enviada pelo Pix - PAGSEGURO INTERNATIONAL - 06.375.668/0003-61', valor: '-36,81' },
  { descricao: 'Transferência enviada pelo Pix - MINI KALZONE - 09.375.421/0001-71', valor: '-12,90' },
  { descricao: ENVIADO_PARA_SI, valor: '-11,00' },
  { descricao: 'Dinheiro guardado com resgate planejado', valor: '-10,00' }
]);

function setembro(identidade) {
  return GRUPOS_DE_SETEMBRO.map((grupo, posicao) =>
    lancamento(grupo.descricao, grupo.valor, { identidade, id: `s${posicao}` })
  );
}

descrever('Identidade do titular', () => {
  isso('casa o nome cadastrado em caixa alta', () => {
    esperar(combina(RECEBIDO_DE_SI, comNome())).verdadeiro();
  });

  isso('casa o mesmo nome escrito com capitalizacao normal', () => {
    esperar(combina(ENVIADO_PARA_SI, comNome())).verdadeiro();
  });

  isso('casa nome cadastrado com acento contra descricao sem acento', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, 'João Pedro Amaral Rosa');
    esperar(combina(RECEBIDO_DE_SI, identidade)).verdadeiro();
  });

  isso('casa documento mascarado pelos digitos visiveis', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, DOCUMENTO);
    esperar(combina(RECEBIDO_DE_SI, identidade)).verdadeiro();
  });

  isso('casa documento inteiro cadastrado contra extrato que imprime mascarado', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '709.666.061-59');
    esperar(combina('Pix enviado JOAO PEDRO AMARAL ROSA •••.666.061-••', identidade)).verdadeiro();
  });

  isso('casa documento inteiro cadastrado sem pontuacao contra extrato mascarado', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '70966606159');
    esperar(combina('Pix enviado JOAO PEDRO AMARAL ROSA •••.666.061-••', identidade)).verdadeiro();
  });

  isso('nao casa documento mascarado de outra pessoa', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '709.666.061-59');
    esperar(combina('Pix recebido MARIA SOUZA •••.123.456-••', identidade)).falso();
  });

  isso('nao casa descricao com digitos de menos para ser documento', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '709.666.061-59');
    esperar(combina('Pix enviado LOJA 123', identidade)).falso();
  });

  isso('nao casa descricao sem digito nenhum', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '709.666.061-59');
    esperar(combina("Pix enviado MCDONALD'S", identidade)).falso();
  });

  isso('casa a conta propria pelo numero', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.CONTAS, CONTA);
    esperar(combina(RECEBIDO_DE_SI, identidade)).verdadeiro();
  });

  isso('nao casa termo que aparece so no meio de outra palavra', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, 'Ester');
    esperar(combina('Compra em ESTERILIZADORA CENTRAL', identidade)).falso();
  });

  isso('nao casa terceiro com nome parecido', () => {
    esperar(combina(ENVIADO_PARA_TERCEIRO, comNome())).falso();
  });

  isso('identidade vazia nao casa nada', () => {
    esperar(combina(RECEBIDO_DE_SI, identidadeVazia())).falso();
  });

  isso('documento curto demais nao casa, para nao pegar numero solto', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.DOCUMENTOS, '38');
    esperar(combina('Pix enviado 380 reais', identidade)).falso();
  });

  isso('termo repetido nao entra duas vezes', () => {
    const identidade = acrescentarTermo(comNome(), TIPOS_IDENTIDADE.NOMES, ' joao pedro amaral rosa ');
    esperar(identidade[TIPOS_IDENTIDADE.NOMES].length).igual(1);
  });

  isso('termo vazio nao entra', () => {
    const identidade = acrescentarTermo(identidadeVazia(), TIPOS_IDENTIDADE.NOMES, '   ');
    esperar(identidade[TIPOS_IDENTIDADE.NOMES].length).igual(0);
  });

  isso('remover termo tira da identidade', () => {
    const identidade = removerTermo(comNome(), TIPOS_IDENTIDADE.NOMES, NOME);
    esperar(identidade[TIPOS_IDENTIDADE.NOMES].length).igual(0);
  });

  isso('acha o nome e o documento dentro da descricao do banco', () => {
    const candidatos = candidatosDe(RECEBIDO_DE_SI);
    esperar(candidatos.nome).igual('JOAO PEDRO AMARAL ROSA');
    esperar(candidatos.documento).igual(DOCUMENTO);
  });
});

descrever('A identidade vence a marcação manual', () => {
  isso('lançamento de conta própria incluído no total à mão continua fora do total', () => {
    const lancamento = { naoGasto: MOTIVOS_NAO_GASTO.CONTA_PROPRIA, foraDoTotalManual: false };
    esperar(estaForaDoTotal(lancamento)).verdadeiro();
  });

  isso('lançamento de conta própria sem marcação fica fora do total', () => {
    esperar(estaForaDoTotal({ naoGasto: MOTIVOS_NAO_GASTO.CONTA_PROPRIA, foraDoTotalManual: null })).verdadeiro();
  });

  isso('motivo automático que não é identidade continua podendo ser revertido', () => {
    const lancamento = { naoGasto: MOTIVOS_NAO_GASTO.APLICACAO, foraDoTotalManual: false };
    esperar(estaForaDoTotal(lancamento)).falso();
  });

  isso('gasto comum tirado do total à mão continua fora', () => {
    esperar(estaForaDoTotal({ naoGasto: false, foraDoTotalManual: true })).verdadeiro();
  });

  isso('gasto comum sem marcação continua no total', () => {
    esperar(estaForaDoTotal({ naoGasto: false, foraDoTotalManual: null })).falso();
  });
});

descrever('O que conta no total', () => {
  isso('transferencia para a identidade cadastrada e conta propria', () => {
    esperar(motivoDe(RECEBIDO_DE_SI, comNome())).igual(MOTIVOS_NAO_GASTO.CONTA_PROPRIA);
  });

  isso('sem identidade cadastrada o mesmo lancamento conta', () => {
    esperar(motivoDe(RECEBIDO_DE_SI, identidadeVazia())).falso();
  });

  isso('o vocabulario de fatura e reserva continua valendo', () => {
    esperar(motivoDe('Pagamento de fatura', comNome())).igual(MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA);
    esperar(motivoDe('Resgate RDB', comNome())).igual(MOTIVOS_NAO_GASTO.APLICACAO);
  });

  isso('decisao manual de tirar vence a deducao do sistema', () => {
    const alvo = lancamento('PADARIA DO ZE', '-20,00', { campos: { foraDoTotalManual: true } });
    esperar(estaForaDoTotal(alvo)).verdadeiro();
    esperar(motivoForaDoTotal(alvo)).igual(MOTIVOS_NAO_GASTO.MANUAL);
  });

  isso('decisao manual de incluir vence a deducao do sistema', () => {
    const alvo = lancamento('Pagamento de fatura', '-100,00', { campos: { foraDoTotalManual: false } });
    esperar(estaForaDoTotal(alvo)).falso();
    esperar(ehGasto(alvo)).verdadeiro();
  });

  isso('o motivo distingue decisao sua de deducao do sistema', () => {
    const deduzido = lancamento(RECEBIDO_DE_SI, '10,00', { identidade: comNome() });
    const seu = lancamento('PADARIA DO ZE', '-20,00', { campos: { foraDoTotalManual: true } });
    esperar(rotuloForaDoTotal(deduzido)).igual('transferência entre contas suas');
    esperar(rotuloForaDoTotal(seu)).igual('marcado por você');
  });

  isso('lancamento fora do total nao e gasto nem entrada', () => {
    const saida = lancamento(ENVIADO_PARA_SI, '-11,00', { identidade: comNome() });
    const entrada = lancamento(RECEBIDO_DE_SI, '11,00', { identidade: comNome() });
    esperar(ehGasto(saida)).falso();
    esperar(ehEntrada(entrada)).falso();
  });

  isso('o export diz que o lancamento nao conta e por que', () => {
    const alvo = lancamento(RECEBIDO_DE_SI, '10,00', { identidade: comNome() });
    const [cabecalho, linha] = montarAbas([alvo], [], COMPETENCIA.COMPRA)[0].linhas;

    esperar(linha[cabecalho.indexOf('Conta no total')]).igual('não');
    esperar(linha[cabecalho.indexOf('Motivo fora do total')]).igual('transferência entre contas suas');
  });
});

descrever('Formato antigo do cofre', () => {
  isso('marcacao manual gravada no campo do motivo vira decisao manual', () => {
    const antigo = { descricaoOriginal: 'PADARIA DO ZE', valor: -2000, naoGasto: MOTIVOS_NAO_GASTO.MANUAL };
    const migrado = migrar(antigo);

    esperar(migrado.foraDoTotalManual).verdadeiro();
    esperar(migrado.naoGasto).falso();
    esperar(estaForaDoTotal(migrado)).verdadeiro();
  });

  isso('motivo automatico antigo continua automatico, sem decisao manual', () => {
    const migrado = migrar({ descricaoOriginal: 'PAG FATURA', valor: -100, naoGasto: MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA });

    esperar(migrado.foraDoTotalManual).igual(null);
    esperar(migrado.naoGasto).igual(MOTIVOS_NAO_GASTO.PAGAMENTO_FATURA);
  });

  isso('lancamento ja no formato novo nao e alterado', () => {
    const novo = {
      descricaoOriginal: 'PADARIA',
      valor: -100,
      naoGasto: false,
      foraDoTotalManual: false,
      tagsManuais: []
    };
    esperar(migrar(novo)).igual(novo);
  });
});

descrever('Reavaliar depois de mudar a identidade', () => {
  isso('reavaliar tira do total o que passou a casar', () => {
    const antes = [lancamento(RECEBIDO_DE_SI, '10,00')];
    esperar(estaForaDoTotal(antes[0])).falso();

    const depois = reavaliar(antes, comNome());
    esperar(estaForaDoTotal(depois[0])).verdadeiro();
  });

  isso('reavaliar devolve ao total quem deixou de casar', () => {
    const antes = reavaliar([lancamento(RECEBIDO_DE_SI, '10,00')], comNome());
    const depois = reavaliar(antes, identidadeVazia());
    esperar(estaForaDoTotal(depois[0])).falso();
  });

  isso('reavaliar nao apaga a decisao manual', () => {
    const marcado = [lancamento('PADARIA DO ZE', '-20,00', { campos: { foraDoTotalManual: true } })];
    const depois = reavaliar(marcado, comNome());

    esperar(depois[0].foraDoTotalManual).verdadeiro();
    esperar(estaForaDoTotal(depois[0])).verdadeiro();
  });
});

descrever('Totais do extrato de setembro de 2026', () => {
  isso('sem identidade cadastrada o Entrou infla com o proprio dinheiro', () => {
    const resumo = metricas(setembro(identidadeVazia()));
    esperar(resumo.entradas).igual(143853);
  });

  isso('com a identidade cadastrada o Entrou mostra so o credito de terceiro', () => {
    const resumo = metricas(setembro(comNome()));
    esperar(resumo.entradas).igual(1410);
  });

  isso('o Gastou mostra so as saidas reais', () => {
    const resumo = metricas(setembro(comNome()));
    esperar(resumo.gasto).igual(67806);
  });

  isso('as transferencias proprias aparecem fora do total, nao desaparecem', () => {
    const resumo = metricas(setembro(comNome()));
    esperar(resumo.foraDoTotal).igual(6);
  });
});

descrever('Identidade no estado da aplicação', () => {
  isso('cadastrar identidade reavalia os lancamentos ja guardados', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: setembro(identidadeVazia()), arquivos: [] });
    esperar(metricas(obter().lancamentos).entradas).igual(143853);

    despachar(ACOES.DEFINIR_IDENTIDADE, comNome());
    esperar(metricas(obter().lancamentos).entradas).igual(1410);
  });

  isso('apagar o termo devolve os lancamentos ao total', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: setembro(comNome()), arquivos: [] });
    despachar(ACOES.DEFINIR_IDENTIDADE, comNome());
    despachar(ACOES.DEFINIR_IDENTIDADE, removerTermo(obter().identidade, TIPOS_IDENTIDADE.NOMES, NOME));

    esperar(metricas(obter().lancamentos).entradas).igual(143853);
  });

  isso('decisao manual sobrevive a mudanca de identidade', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamento('PADARIA DO ZE', '-20,00', { id: 'p1' })],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['p1'], fora: true });
    despachar(ACOES.DEFINIR_IDENTIDADE, comNome());

    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
  });

  isso('decisao manual sobrevive a criacao de regra', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamento('PADARIA DO ZE', '-20,00', { id: 'p2' })],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['p2'], fora: true });
    despachar(ACOES.CRIAR_REGRA, { operador: OPERADORES_REGRA.CONTEM, termo: 'PADARIA', categoria: 'Mercado' });

    esperar(obter().lancamentos[0].categoria).igual('Mercado');
    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
  });

  isso('decisao manual sobrevive a reimportacao do mesmo arquivo', () => {
    reiniciar();
    const arquivo = [lancamento('PADARIA DO ZE', '-20,00')];
    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: arquivo, arquivos: [] });

    const alvo = obter().lancamentos[0].id;
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: [alvo], fora: true });

    const mesclagem = mesclar(obter().lancamentos, arquivo);
    despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: mesclagem.inseridos, arquivos: [] });

    esperar(obter().lancamentos.length).igual(1);
    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
  });

  isso('tirar do total a mao oferece cadastrar a contraparte', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamento(RECEBIDO_DE_SI, '10,00', { id: 'r1' })],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['r1'], fora: true });

    esperar(obter().sugestao.tipo).igual(TIPOS_SUGESTAO.IDENTIDADE);
    esperar(obter().sugestao.termo).igual('JOAO PEDRO AMARAL ROSA');
    esperar(obter().sugestao.campo).igual(TIPOS_IDENTIDADE.NOMES);
  });

  isso('nao oferece cadastro de quem ja esta na identidade', () => {
    reiniciar();
    despachar(ACOES.DEFINIR_IDENTIDADE, comNome());
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamento(RECEBIDO_DE_SI, '10,00', { id: 'r2', identidade: comNome() })],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['r2'], fora: true });

    esperar(obter().sugestao).igual(null);
  });

  isso('nao oferece cadastro de loja que so recebeu dinheiro seu', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [
        lancamento('Transferência enviada pelo Pix - MINI KALZONE - 09.375.421/0001-71', '-12,90', { id: 'k1' })
      ],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['k1'], fora: true });

    esperar(obter().sugestao).igual(null);
  });

  isso('oferece cadastro de quem tambem manda dinheiro para voce', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [
        lancamento(RECEBIDO_DE_SI, '200,00', { id: 'm1' }),
        lancamento(ENVIADO_PARA_SI, '-11,00', { id: 'm2' })
      ],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['m2'], fora: true });

    esperar(obter().sugestao.termo).igual(NOME);
  });

  isso('nao oferece cadastro quando a descricao nao tem contraparte legivel', () => {
    reiniciar();
    despachar(ACOES.REGISTRAR_IMPORTACAO, {
      lancamentos: [lancamento('COMPRA DEBITO 4477', '-30,00', { id: 'r3' })],
      arquivos: []
    });
    despachar(ACOES.DEFINIR_FORA_DO_TOTAL, { ids: ['r3'], fora: true });

    esperar(obter().sugestao).igual(null);
  });

  isso('abrir o cofre carrega a identidade e migra o formato antigo', () => {
    reiniciar();
    despachar(ACOES.CARREGAR_DADOS, {
      lancamentos: [{ id: 'v1', descricaoOriginal: 'PADARIA DO ZE', valor: -2000, naoGasto: MOTIVOS_NAO_GASTO.MANUAL }],
      regras: [],
      identidade: comNome()
    });

    esperar(obter().identidade[TIPOS_IDENTIDADE.NOMES]).igual([NOME]);
    esperar(estaForaDoTotal(obter().lancamentos[0])).verdadeiro();
    esperar(motivoForaDoTotal(obter().lancamentos[0])).igual(MOTIVOS_NAO_GASTO.MANUAL);
  });
});
