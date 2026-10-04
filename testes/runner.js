const STATUS = Object.freeze({
  PASSOU: 'passou',
  FALHOU: 'falhou'
});

const suites = [];
let suiteAtual = null;

export function descrever(nome, definir) {
  suiteAtual = { nome, casos: [] };
  suites.push(suiteAtual);
  definir();
  suiteAtual = null;
}

export function isso(nome, verificar) {
  if (!suiteAtual) {
    throw new Error('isso() precisa ser chamado dentro de descrever()');
  }
  suiteAtual.casos.push({ nome, verificar });
}

export function esperar(valor) {
  return {
    igual(esperado) {
      if (!equivalente(valor, esperado)) {
        throw new Error(`esperava ${representar(esperado)}, recebeu ${representar(valor)}`);
      }
    },
    diferenteDe(esperado) {
      if (equivalente(valor, esperado)) {
        throw new Error(`esperava algo diferente de ${representar(esperado)}`);
      }
    },
    verdadeiro() {
      if (valor !== true) {
        throw new Error(`esperava true, recebeu ${representar(valor)}`);
      }
    },
    falso() {
      if (valor !== false) {
        throw new Error(`esperava false, recebeu ${representar(valor)}`);
      }
    },
    contem(trecho) {
      if (!String(valor).includes(trecho)) {
        throw new Error(`esperava que ${representar(valor)} contivesse ${representar(trecho)}`);
      }
    },
    lancaErro(trechoEsperado) {
      let lancou = false;
      let mensagem = '';
      try {
        valor();
      } catch (erro) {
        lancou = true;
        mensagem = erro.message;
      }
      if (!lancou) {
        throw new Error('esperava que a função lançasse erro');
      }
      if (trechoEsperado && !mensagem.includes(trechoEsperado)) {
        throw new Error(`esperava erro contendo ${representar(trechoEsperado)}, recebeu ${representar(mensagem)}`);
      }
    }
  };
}

export async function executar(destino) {
  const resultados = [];

  for (const suite of suites) {
    for (const caso of suite.casos) {
      resultados.push(await rodarCaso(suite.nome, caso));
    }
  }

  const resumo = {
    total: resultados.length,
    passou: resultados.filter((item) => item.status === STATUS.PASSOU).length,
    falhou: resultados.filter((item) => item.status === STATUS.FALHOU).length,
    casos: resultados
  };

  window.resultadoTestes = resumo;
  relatarNoConsole(resumo);

  if (destino) {
    renderizar(destino, resumo);
  }

  return resumo;
}

async function rodarCaso(suite, caso) {
  try {
    await caso.verificar();
    return { suite, nome: caso.nome, status: STATUS.PASSOU, erro: '' };
  } catch (erro) {
    return { suite, nome: caso.nome, status: STATUS.FALHOU, erro: erro.message };
  }
}

function renderizar(destino, resumo) {
  const linhas = resumo.casos
    .map(
      (caso) => `
        <tr class="linha linha--${caso.status}">
          <td>${escapar(caso.suite)}</td>
          <td>${escapar(caso.nome)}</td>
          <td class="status">${caso.status}</td>
          <td class="erro">${escapar(caso.erro)}</td>
        </tr>`
    )
    .join('');

  destino.innerHTML = `
    <p class="resumo resumo--${resumo.falhou === 0 ? STATUS.PASSOU : STATUS.FALHOU}">
      ${resumo.total} casos, ${resumo.passou} passaram, ${resumo.falhou} falharam
    </p>
    <table>
      <thead>
        <tr><th>Grupo</th><th>Caso</th><th>Status</th><th>Erro</th></tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

function relatarNoConsole(resumo) {
  resumo.casos
    .filter((caso) => caso.status === STATUS.FALHOU)
    .forEach((caso) => console.error(`[FALHOU] ${caso.suite} / ${caso.nome}: ${caso.erro}`));

  console.info(`[TESTES] ${resumo.total} casos, ${resumo.passou} passaram, ${resumo.falhou} falharam`);
}

function equivalente(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const chavesA = Object.keys(a);
  const chavesB = Object.keys(b);
  if (chavesA.length !== chavesB.length) {
    return false;
  }
  return chavesA.every((chave) => equivalente(a[chave], b[chave]));
}

function representar(valor) {
  if (typeof valor === 'string') {
    return `"${valor}"`;
  }
  if (typeof valor === 'object' && valor !== null) {
    return JSON.stringify(valor);
  }
  return String(valor);
}

function escapar(texto) {
  return String(texto).replace(/[&<>]/g, (caractere) => {
    if (caractere === '&') {
      return '&amp;';
    }
    if (caractere === '<') {
      return '&lt;';
    }
    return '&gt;';
  });
}
