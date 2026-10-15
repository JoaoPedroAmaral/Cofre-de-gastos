import { descrever, esperar, isso } from '../runner.js';
import {
  LARGURAS_DE_REFERENCIA,
  LARGURA_DE_CELULAR,
  LARGURA_ESTREITA,
  LARGURA_MINIMA,
  medirElemento,
  medirTela
} from '../medidor.js';
import { alvosDeToque, folhasComConsultaDeLargura, pontosDeQuebra } from '../folhas.js';
import { arquivoDeMuitasColunas, comDados, comSelecao, estadoDoPainel } from '../cenarios.js';
import {
  ACOES,
  CATEGORIAS_PADRAO,
  COLUNAS_PLANILHA,
  ESTADOS_COFRE,
  ORDEM_TELAS,
  PAPEIS_COLUNA_PLANILHA,
  TELAS
} from '../../js/nucleo/constantes.js';
import { despachar, obter, reiniciar } from '../../js/estado/store.js';
import { telaCofre } from '../../js/ui/cadeado.js';
import { abrirMapeador } from '../../js/ui/mapeador.js';
import { avisar } from '../../js/ui/componentes.js';
import { telaPainel } from '../../js/ui/painel.js';

const TOLERANCIA = 1;
const SEM_ESTOURO = 0;
const UM = 1;
const TERCO = 3;
const UMA_FOLHA = 1;
const ALTURA_MINIMA_DE_ALVO = 40;
const CRESCIMENTO_MAXIMO = 1.4;
const ALTURA_MINIMA_DA_BARRA = 6;
const COLUNAS_DO_ARQUIVO = 12;
const MESES_CURTOS = 12;
const MESES_LONGOS = 24;
const ITENS_POR_MES = 2;
const SELECIONADOS = 10;
const PERCENTUAL_CHEIO = 100;
const SELETOR_DE_ACIONAVEIS = 'button, select, input, a';
const ARQUIVO_RESPONSIVO = 'responsivo.css';

function sobreposicao(caixas) {
  return caixas.some((caixa, indice) => indice > 0 && caixa.top < caixas[indice - 1].bottom - TOLERANCIA);
}

function centro(caixa) {
  return caixa.left + caixa.width / 2;
}

function papeis() {
  return [PAPEIS_COLUNA_PLANILHA.SELECAO, ...COLUNAS_PLANILHA.map((coluna) => coluna.papel)];
}

descrever('Responsivo: nenhuma tela estoura na horizontal', () => {
  const telasDoSistema = [TELAS.PAINEL, TELAS.PLANILHA, TELAS.IMPORTAR, TELAS.REGRAS, TELAS.EXPORTAR, TELAS.AJUSTES];

  telasDoSistema.forEach((tela) => {
    isso(`a tela ${tela} cabe em todas as larguras de referencia`, async () => {
      comDados()();

      for (const largura of LARGURAS_DE_REFERENCIA) {
        await medirTela(largura, tela, (medida) => {
          esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
        });
      }
    });
  });

  isso('a tela de privacidade cabe em todas as larguras de referencia', async () => {
    for (const largura of LARGURAS_DE_REFERENCIA) {
      await medirTela(largura, TELAS.PRIVACIDADE, (medida) => {
        esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
      });
    }
  });

  isso('a tela do cofre cabe em todas as larguras de referencia', async () => {
    reiniciar();
    despachar(ACOES.DEFINIR_ESTADO_DO_COFRE, { situacao: ESTADOS_COFRE.SEM_COFRE, perfis: [] });

    for (const largura of LARGURAS_DE_REFERENCIA) {
      await medirElemento(
        largura,
        () => telaCofre(obter(), { aoAbrir: () => {}, aoApagar: () => {} }),
        (medida) => {
          esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
        }
      );
    }
  });

  isso('o mapeamento de colunas cabe em todas as larguras de referencia', async () => {
    for (const largura of LARGURAS_DE_REFERENCIA) {
      await medirElemento(
        largura,
        () => {
          abrirMapeador(arquivoDeMuitasColunas(COLUNAS_DO_ARQUIVO), () => {});
          return document.querySelector('.modal');
        },
        (medida) => {
          esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
        }
      );
    }
  });
});

descrever('Responsivo: filtro sempre alcancavel', () => {
  const seletoresDeFiltro = ['.busca', '.filtros select'];

  isso('busca e seletores ficam dentro da janela no celular estreito', async () => {
    await medirTela(
      LARGURA_ESTREITA,
      TELAS.PLANILHA,
      (medida) => {
        seletoresDeFiltro.forEach((seletor) => {
          const caixas = medida.caixas(seletor);
          esperar(caixas.length).aoMenos(UM);
          caixas.forEach((caixa) => {
            esperar(caixa.width).aoMenos(UM);
            esperar(caixa.height).aoMenos(UM);
            esperar(medida.cabeNaLargura(caixa)).verdadeiro();
          });
        });
      },
      comDados()
    );
  });

  isso('limpar filtros fica dentro da janela quando ha filtro ativo', async () => {
    await medirTela(
      LARGURA_ESTREITA,
      TELAS.PLANILHA,
      (medida) => {
        const limpar = medida.caixa('.filtros .botao--discreto');
        esperar(medida.cabeNaLargura(limpar)).verdadeiro();
      },
      () => {
        comDados()();
        despachar(ACOES.DEFINIR_FILTROS, { categoria: CATEGORIAS_PADRAO[0] });
      }
    );
  });

  isso('a faixa de filtros nao se sobrepoe a faixa de abas', async () => {
    await medirTela(
      LARGURA_ESTREITA,
      TELAS.PLANILHA,
      (medida) => {
        const abas = medida.caixa('.abas');
        const filtros = medida.caixa('.filtros');
        esperar(filtros.top).aoMenos(abas.bottom - TOLERANCIA);
      },
      comDados()
    );
  });
});

descrever('Responsivo: navegacao inteira a vista', () => {
  isso('a trilha expoe uma entrada por tela mais a de travar', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        esperar(medida.elementos('.rail__item').length).igual(ORDEM_TELAS.length + 1);
      },
      comDados()
    );
  });

  isso('toda entrada da trilha tem rotulo textual', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        const semRotulo = medida
          .elementos('.rail__item')
          .filter((item) => (item.querySelector('span')?.textContent ?? '').trim() === '');
        esperar(semRotulo.length).igual(0);
      },
      comDados()
    );
  });

  isso('a trilha cabe sem rolagem propria no celular estreito', async () => {
    await medirTela(
      LARGURA_ESTREITA,
      TELAS.PAINEL,
      (medida) => {
        const trilha = medida.elemento('.rail');
        esperar(trilha.scrollWidth - trilha.clientWidth).naoPassaDe(SEM_ESTOURO);

        medida.caixas('.rail__item').forEach((caixa) => {
          esperar(medida.cabeNaLargura(caixa)).verdadeiro();
        });
      },
      comDados()
    );
  });
});

descrever('Responsivo: cartao da planilha por papel de coluna', () => {
  isso('toda coluna declara papel, e os papeis nao se repetem', () => {
    const declarados = COLUNAS_PLANILHA.map((coluna) => coluna.papel);

    esperar(declarados.filter(Boolean).length).igual(COLUNAS_PLANILHA.length);
    esperar(new Set(papeis()).size).igual(papeis().length);
  });

  isso('a linha expoe exatamente uma celula por papel', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const linha = medida.elemento('.tabela tbody tr');

        papeis().forEach((papel) => {
          esperar(linha.querySelectorAll(`td.${papel}`).length).igual(UM);
        });
        esperar(linha.querySelectorAll('td').length).igual(papeis().length);
      },
      comDados()
    );
  });

  isso('o cabecalho usa o mesmo papel da celula da coluna', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        papeis().forEach((papel) => {
          esperar(medida.elementos(`.tabela thead th.${papel}`).length).igual(UM);
        });
      },
      comDados()
    );
  });

  isso('o valor fica a direita da descricao no cartao', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const descricao = medida.caixa(`td.${PAPEIS_COLUNA_PLANILHA.DESCRICAO}`);
        const valor = medida.caixa(`td.${PAPEIS_COLUNA_PLANILHA.VALOR}`);

        esperar(valor.left).aoMenos(descricao.right - TOLERANCIA);
        esperar(medida.cabeNaLargura(valor)).verdadeiro();
      },
      comDados()
    );
  });

  isso('os cartoes nao se sobrepoem', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        esperar(sobreposicao(medida.caixas('.tabela tbody tr'))).falso();
      },
      comDados()
    );
  });
});

descrever('Responsivo: graficos do painel', () => {
  isso('o anel nao declara tamanho em pixel e mantem a proporcao', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        const grafico = medida.elemento('.anel svg');

        esperar(grafico.hasAttribute('width')).falso();
        esperar(grafico.hasAttribute('height')).falso();
        esperar(grafico.hasAttribute('viewBox')).verdadeiro();
      },
      comDados()
    );
  });

  isso('o anel cabe na largura disponivel na tela mais estreita', async () => {
    await medirTela(
      LARGURA_MINIMA,
      TELAS.PAINEL,
      (medida) => {
        const anel = medida.caixa('.anel');
        const grafico = medida.caixa('.anel svg');

        esperar(medida.cabeNaLargura(anel)).verdadeiro();
        esperar(grafico.width).naoPassaDe(anel.width + TOLERANCIA);
      },
      comDados()
    );
  });

  isso('a evolucao entrega uma barra e um rotulo por mes, alternados', async () => {
    await medirElemento(
      LARGURA_DE_CELULAR,
      () => {
        comDados()();
        return telaPainel(estadoDoPainel(MESES_CURTOS));
      },
      (medida) => {
        const filhos = medida.elementos('.barras > *');

        esperar(filhos.length).igual(MESES_CURTOS * ITENS_POR_MES);
        filhos.forEach((filho, indice) => {
          const esperada = indice % 2 === 0 ? 'barra-mes' : 'barras__rotulo';
          esperar(filho.classList.contains(esperada)).verdadeiro();
        });
      }
    );
  });

  isso('cada rotulo fica centrado na mesma coluna da sua barra', async () => {
    await medirElemento(
      LARGURA_DE_CELULAR,
      () => {
        comDados()();
        return telaPainel(estadoDoPainel(MESES_CURTOS));
      },
      (medida) => {
        const barras = medida.caixas('.barras .barra-mes');
        const rotulos = medida.caixas('.barras .barras__rotulo');

        esperar(barras.length).igual(rotulos.length);
        barras.forEach((barra, indice) => {
          esperar(Math.abs(centro(barra) - centro(rotulos[indice]))).naoPassaDe(TOLERANCIA);
        });
      }
    );
  });

  isso('o grafico cabe com muitos meses', async () => {
    await medirElemento(
      LARGURA_DE_CELULAR,
      () => {
        comDados()();
        return telaPainel(estadoDoPainel(MESES_LONGOS));
      },
      (medida) => {
        esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
        esperar(medida.caixas('.barras .barra-mes').length).igual(MESES_LONGOS);
      }
    );
  });

  isso('a barra e o rotulo do mes filtrado sao os unicos ativos', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        esperar(medida.elementos('.barra-mes--ativa').length).igual(UM);
        esperar(medida.elementos('.barras__rotulo--ativo').length).igual(UM);

        const barra = medida.caixa('.barra-mes--ativa');
        const rotulo = medida.caixa('.barras__rotulo--ativo');
        esperar(Math.abs(centro(barra) - centro(rotulo))).naoPassaDe(TOLERANCIA);
      },
      () => {
        comDados()();
        despachar(ACOES.DEFINIR_FILTROS, { mes: '2026-03' });
      }
    );
  });

  isso('sem gasto nenhum, toda barra fica na altura minima', async () => {
    await medirElemento(
      LARGURA_DE_CELULAR,
      () => {
        comDados()();
        const semValor = estadoDoPainel(6);
        return telaPainel({
          ...semValor,
          lancamentos: semValor.lancamentos.map((item) => ({ ...item, valor: 0 }))
        });
      },
      (medida) => {
        const trilho = medida.caixa('.barras');
        medida.caixas('.barras .barra-mes').forEach((barra) => {
          esperar(barra.height).aoMenos(UM);
          esperar(barra.height).naoPassaDe((trilho.height * ALTURA_MINIMA_DA_BARRA) / PERCENTUAL_CHEIO + TOLERANCIA);
        });
      }
    );
  });
});

descrever('Responsivo: camadas flutuantes acima da trilha', () => {
  isso('a selecao em lote nao passa de um terco da altura visivel', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const barra = medida.caixa('.barra-selecao');
        esperar(barra.height).naoPassaDe(medida.altura / TERCO + TOLERANCIA);
      },
      comSelecao(SELECIONADOS)
    );
  });

  isso('a selecao em lote fica acima da trilha quando esta a vista', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      async (medida) => {
        await medida.aoFimDaRolagem();

        const barra = medida.caixa('.barra-selecao');
        const trilha = medida.caixa('.rail');

        esperar(barra.bottom).naoPassaDe(trilha.top + TOLERANCIA);
        esperar(medida.cabeNaLargura(barra)).verdadeiro();
      },
      comSelecao(SELECIONADOS)
    );
  });

  isso('a faixa de avisos fica acima da trilha', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        avisar('Aviso de medicao');
        const faixa = document.querySelector('.avisos');
        medida.elemento('#app').append(faixa);

        const caixa = faixa.getBoundingClientRect();
        const trilha = medida.caixa('.rail');
        esperar(caixa.bottom).naoPassaDe(trilha.top + TOLERANCIA);
        esperar(medida.cabeNaLargura(caixa)).verdadeiro();
      },
      comDados()
    );
  });

  isso('o conteudo reserva o rodape da trilha', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const reserva = Number.parseFloat(medida.estilo('.conteudo').paddingBottom);
        esperar(reserva).aoMenos(medida.caixa('.rail').height);
      },
      comDados()
    );
  });
});

descrever('Responsivo: altura visivel e escala fluida', () => {
  isso('a altura de moldura usa a altura visivel da janela', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        const token = medida.estilo(':root').getPropertyValue('--altura-tela').trim();
        const esperado = CSS.supports('height', '100dvh') ? '100dvh' : '100vh';
        esperar(token).igual(esperado);
      },
      comDados()
    );
  });

  isso('o valor em destaque cresce sem salto entre larguras vizinhas', async () => {
    const tamanhos = [];
    comDados()();

    for (const largura of LARGURAS_DE_REFERENCIA) {
      await medirTela(largura, TELAS.PAINEL, (medida) => {
        tamanhos.push(Number.parseFloat(medida.estilo('.destaque__valor').fontSize));
      });
    }

    tamanhos.forEach((tamanho, indice) => {
      if (indice === 0) {
        return;
      }
      esperar(tamanho).aoMenos(tamanhos[indice - 1]);
      esperar(tamanho / tamanhos[indice - 1]).naoPassaDe(CRESCIMENTO_MAXIMO);
    });
  });
});

descrever('Responsivo: previa do arquivo e alvo de toque', () => {
  isso('a previa do arquivo rola por dentro, sem arrastar a pagina', async () => {
    await medirElemento(
      LARGURA_DE_CELULAR,
      () => {
        abrirMapeador(arquivoDeMuitasColunas(COLUNAS_DO_ARQUIVO), () => {});
        return document.querySelector('.modal');
      },
      (medida) => {
        const rolagem = medida.elemento('.tabela-rolagem');

        esperar(rolagem.scrollWidth - rolagem.clientWidth).aoMenos(UM);
        esperar(medida.estouro).naoPassaDe(SEM_ESTOURO);
      }
    );
  });

  isso('a regra de ponteiro grosso nao deixa alvo abaixo do minimo', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const alvos = alvosDeToque(medida.documento);

        esperar(alvos.length).aoMenos(UM);
        alvos.forEach((alvo) => {
          esperar(alvo.medida).aoMenos(ALTURA_MINIMA_DE_ALVO);
        });
      },
      comDados()
    );
  });

  isso('todo acionavel da planilha e alcancavel sem rolagem de pagina', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PLANILHA,
      (medida) => {
        const inalcancaveis = medida
          .elementos(SELETOR_DE_ACIONAVEIS)
          .filter((elemento) => {
            const caixa = elemento.getBoundingClientRect();
            if (caixa.width === 0) {
              return false;
            }
            return !medida.cabeNaLargura(caixa) && !medida.rolaNaHorizontal(elemento);
          });

        esperar(inalcancaveis.length).igual(0);
      },
      comDados()
    );
  });
});

descrever('Responsivo: a regra de largura mora num lugar so', () => {
  isso('so uma folha de estilo declara consulta de largura', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        const comLargura = folhasComConsultaDeLargura(medida.documento);

        esperar(comLargura.length).igual(UMA_FOLHA);
        esperar(comLargura[0].href).contem(ARQUIVO_RESPONSIVO);
      },
      comDados()
    );
  });

  isso('nenhum ponto de quebra aparece repetido', async () => {
    await medirTela(
      LARGURA_DE_CELULAR,
      TELAS.PAINEL,
      (medida) => {
        const pontos = pontosDeQuebra(medida.documento);
        esperar(new Set(pontos).size).igual(pontos.length);
      },
      comDados()
    );
  });
});
