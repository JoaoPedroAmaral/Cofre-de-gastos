import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const PASTAS = ['css', 'js', 'vendor/fontes', 'icones'];
const AVULSOS = ['/', '/index.html', '/manifest.webmanifest', '/vendor/fontes.css'];
const PADRAO_LISTA = /const ESSENCIAIS = \[([\s\S]*?)\];/;
const PADRAO_CAMINHO = /'([^']+)'/g;

function arquivosDoDisco() {
  const encontrados = [];
  PASTAS.forEach((pasta) => {
    const completo = path.join(RAIZ, pasta);
    if (!fs.existsSync(completo)) {
      return;
    }
    fs.readdirSync(completo, { recursive: true, withFileTypes: true })
      .filter((item) => item.isFile())
      .forEach((item) => {
        const relativo = path.relative(RAIZ, path.join(item.parentPath, item.name));
        encontrados.push('/' + relativo.split(path.sep).join('/'));
      });
  });
  return [...AVULSOS, ...encontrados];
}

function listaDoServiceWorker() {
  const fonte = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  const bloco = PADRAO_LISTA.exec(fonte);
  if (!bloco) {
    throw new Error('Não encontrei a lista ESSENCIAIS em sw.js');
  }
  return [...bloco[1].matchAll(PADRAO_CAMINHO)].map(([, caminho]) => caminho);
}

const noDisco = arquivosDoDisco();
const noServiceWorker = listaDoServiceWorker();

const faltando = noDisco.filter((caminho) => !noServiceWorker.includes(caminho));
const sobrando = noServiceWorker.filter((caminho) => !noDisco.includes(caminho));

faltando.forEach((caminho) => console.log(`faltando no precache  ${caminho}`));
sobrando.forEach((caminho) => console.log(`não existe mais       ${caminho}`));

const total = faltando.length + sobrando.length;
console.log(`[PRECACHE] ${noDisco.length} arquivos, ${total} divergências`);

if (total > 0) {
  process.exitCode = 1;
}
