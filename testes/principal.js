import { executar } from './runner.js';
import './casos/formato.js';
import './casos/estado.js';
import './casos/dinheiro.js';
import './casos/datas.js';
import './casos/importacao.js';
import './casos/bancos.js';
import './casos/fatura.js';
import './casos/normalizacao.js';
import './casos/integridade.js';
import './casos/classificacao.js';
import './casos/painel.js';
import './casos/exportacao.js';
import './casos/cofre.js';

executar(document.getElementById('relatorio'));
