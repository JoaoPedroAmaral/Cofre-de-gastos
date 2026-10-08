import { descrever, esperar, isso } from '../runner.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import {
  ABAS_PLANILHA,
  ACOES,
  CATEGORIA_SEM_CLASSIFICACAO,
  CONTEXTOS_DE_PAGINA,
  TELAS
} from '../../js/nucleo/constantes.js';
import { preparar } from '../../js/nucleo/preparar.js';
import { telaPainel } from '../../js/ui/painel.js';

const PLANILHA = CONTEXTOS_DE_PAGINA.PLANILHA;

function lancamento(descricao, valor, categoria, posicao) {
  return {
    ...preparar({
      data: '05/09/2026',
      valor,
      descricaoOriginal: descricao,
      banco: 'Itau',
      arquivo: 'extrato.ofx'
    }),
    categoria,
    id: `l${posicao}`
  };
}

const CONJUNTO = [
  lancamento('MERCADO A', '-100,00', 'Mercado', 1),
  lancamento('MERCADO B', '-200,00', 'Mercado', 2),
  lancamento('UBER X', '-50,00', 'Transporte', 3),
  lancamento('SALARIO', '3000,00', 'Outros', 4),
  lancamento('DESCONHECIDO', '-10,00', CATEGORIA_SEM_CLASSIFICACAO, 5)
];

function comDados() {
  reiniciar();
  despachar(ACOES.REGISTRAR_IMPORTACAO, { lancamentos: CONJUNTO, arquivos: [] });
  return obter();
}

function categoriasDoPainel(estado) {
  return [...telaPainel(estado).querySelectorAll('.categoria')];
}

descrever('Ir para a planilha levando o contexto', () => {
  isso('leva para a planilha', () => {
    comDados();
    despachar(ACOES.IR_PARA_PLANILHA, {});

    esperar(obter().tela).igual(TELAS.PLANILHA);
  });

  isso('aplica o filtro de categoria na mesma transicao', () => {
    comDados();
    despachar(ACOES.IR_PARA_PLANILHA, { filtros: { categoria: 'Mercado' } });

    esperar(obter().tela).igual(TELAS.PLANILHA);
    esperar(obter().filtros.categoria).igual('Mercado');
  });

  isso('cai na aba certa, nao numa aba qualquer', () => {
    comDados();
    despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.SEM_CATEGORIA);
    despachar(ACOES.IR_PARA_PLANILHA, {});

    esperar(obter().aba).igual(ABAS_PLANILHA.TODOS);
  });

  isso('aba pedida e respeitada', () => {
    comDados();
    despachar(ACOES.IR_PARA_PLANILHA, { aba: ABAS_PLANILHA.FORA_DO_TOTAL });

    esperar(obter().aba).igual(ABAS_PLANILHA.FORA_DO_TOTAL);
  });

  isso('aba desconhecida cai em todos', () => {
    comDados();
    despachar(ACOES.IR_PARA_PLANILHA, { aba: 'inventada' });

    esperar(obter().aba).igual(ABAS_PLANILHA.TODOS);
  });

  isso('volta para a primeira pagina', () => {
    comDados();
    despachar(ACOES.DEFINIR_PAGINA, { contexto: PLANILHA, pagina: 3 });
    despachar(ACOES.IR_PARA_PLANILHA, {});

    esperar(obter().paginas[PLANILHA]).igual(1);
  });

  isso('limpa a selecao, que era de outra tela', () => {
    comDados();
    despachar(ACOES.DEFINIR_SELECAO, ['l1', 'l2']);
    despachar(ACOES.IR_PARA_PLANILHA, {});

    esperar(obter().selecao.length).igual(0);
  });

  isso('preserva os filtros que nao foram pedidos', () => {
    comDados();
    despachar(ACOES.DEFINIR_FILTROS, { banco: 'Itau' });
    despachar(ACOES.IR_PARA_PLANILHA, { filtros: { categoria: 'Mercado' } });

    esperar(obter().filtros.banco).igual('Itau');
    esperar(obter().filtros.categoria).igual('Mercado');
  });
});

descrever('A pilha de categorias do painel é navegável', () => {
  isso('cada categoria e um botao, nao um texto', () => {
    const linhas = categoriasDoPainel(comDados());

    esperar(linhas.length > 0).verdadeiro();
    esperar(linhas.every((linha) => linha.tagName === 'BUTTON')).verdadeiro();
  });

  isso('clicar numa categoria leva para a planilha filtrada por ela', () => {
    const estado = comDados();
    const alvo = categoriasDoPainel(estado).find((linha) => linha.textContent.includes('Mercado'));

    alvo.click();

    esperar(obter().tela).igual(TELAS.PLANILHA);
    esperar(obter().filtros.categoria).igual('Mercado');
  });

  isso('a categoria que esta filtrada aparece marcada', () => {
    comDados();
    despachar(ACOES.IR_PARA_PLANILHA, { filtros: { categoria: 'Mercado' } });
    const marcadas = categoriasDoPainel(obter()).filter(
      (linha) => linha.getAttribute('aria-pressed') === 'true'
    );

    esperar(marcadas.length).igual(1);
    esperar(marcadas[0].textContent).contem('Mercado');
  });

  isso('sem filtro, nenhuma categoria aparece marcada', () => {
    const marcadas = categoriasDoPainel(comDados()).filter(
      (linha) => linha.getAttribute('aria-pressed') === 'true'
    );

    esperar(marcadas.length).igual(0);
  });

  isso('ver todas leva para a planilha sem categoria filtrada', () => {
    const estado = comDados();
    despachar(ACOES.DEFINIR_FILTROS, { categoria: 'Mercado' });
    const botao = [...telaPainel(obter()).querySelectorAll('button')].find((b) =>
      b.textContent.includes('Ver todas')
    );

    botao.click();

    esperar(obter().tela).igual(TELAS.PLANILHA);
    esperar(obter().filtros.categoria).igual('');
    esperar(estado.lancamentos.length).igual(CONJUNTO.length);
  });
});

descrever('Os atalhos do painel caem na aba certa', () => {
  isso('revisar sem categoria cai na aba sem categoria', () => {
    const estado = comDados();
    const atalho = [...telaPainel(estado).querySelectorAll('button')].find((b) =>
      b.textContent.includes('sem categoria')
    );

    atalho.click();

    esperar(obter().tela).igual(TELAS.PLANILHA);
    esperar(obter().aba).igual(ABAS_PLANILHA.SEM_CATEGORIA);
  });

  isso('nenhum atalho do painel troca de tela sem levar o recorte', () => {
    comDados();
    despachar(ACOES.DEFINIR_ABA, ABAS_PLANILHA.FORA_DO_TOTAL);
    const atalho = [...telaPainel(obter()).querySelectorAll('button')].find((b) =>
      b.textContent.includes('sem categoria')
    );

    atalho.click();

    esperar(obter().aba).igual(ABAS_PLANILHA.SEM_CATEGORIA);
  });
});
