import { TERMO } from './termo.js';

const TEXTOS = Object.freeze({
  VERSAO: 'Versão',
  ATUALIZADO: 'atualizado em'
});

export function versaoDoTermo() {
  return `${TEXTOS.VERSAO} ${TERMO.versao} · ${TEXTOS.ATUALIZADO} ${formatarData(TERMO.atualizadoEm)}`;
}

export function secoesDoTermo(criar) {
  return TERMO.secoes.map((secao) =>
    criar('section', { class: 'secao-texto' }, [
      criar('h2', { texto: secao.titulo }),
      ...secao.paragrafos.map((paragrafo) => criar('p', { texto: paragrafo }))
    ])
  );
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
