import { criarElemento } from './componentes.js';
import { icone } from './icones.js';

const TITULO = 'Privacidade';
const RESUMO =
  'Este sistema não tem servidor. Seus extratos são lidos, categorizados e guardados dentro do seu próprio navegador, e nada é enviado para lugar nenhum.';

const SECOES = Object.freeze([
  {
    titulo: 'O que sai do seu dispositivo',
    paragrafos: [
      'Nada. Não existe conta, cadastro, login remoto, servidor de aplicação nem banco de dados nosso. Os arquivos que você importa são abertos pelo próprio navegador e processados em memória.',
      'A política de segurança da página proíbe qualquer conexão de saída. Mesmo que algum código tentasse enviar seus dados, o navegador bloquearia a tentativa.'
    ]
  },
  {
    titulo: 'Onde seus dados ficam',
    paragrafos: [
      'No armazenamento local deste navegador, cifrados com AES-256-GCM. A chave é derivada da sua senha e existe apenas enquanto o cofre está destravado; ela nunca é gravada em lugar nenhum.',
      'Quem abrir este site em outro navegador, em outro computador ou em janela anônima não vê nada do que está aqui. Cada cofre é independente.'
    ]
  },
  {
    titulo: 'O que isso custa a você',
    paragrafos: [
      'Não existe recuperação de senha por e-mail, porque não há ninguém do outro lado para provar quem você é. Perder a senha e o código de recuperação significa perder os dados.',
      'Limpar os dados do site pelo navegador apaga o cofre. Antes de fazer isso, ou antes de trocar de computador, exporte um backup.'
    ]
  },
  {
    titulo: 'Bibliotecas de terceiros',
    paragrafos: [
      'As bibliotecas usadas para ler planilhas e faturas são servidas junto com o sistema, em versão fixa e com hash registrado, nunca de CDN. Num sistema que decifra extrato bancário no navegador, um script de terceiro na mesma origem leria os dados já decifrados.',
      'As fontes também são servidas localmente, pelo mesmo motivo.'
    ]
  },
  {
    titulo: 'Rastreamento',
    paragrafos: [
      'Não há analytics, cookie de rastreamento, pixel, anúncio ou qualquer identificador. O sistema também não registra o que você faz: não existe log, porque não existe para onde mandá-lo.'
    ]
  },
  {
    titulo: 'Como apagar tudo',
    paragrafos: [
      'Na tela de desbloqueio, cada perfil tem a opção de apagar, que remove o registro do perfil e todos os dados cifrados dele. Também é possível limpar os dados do site pelas configurações do navegador.'
    ]
  }
]);

export function telaPrivacidade() {
  return criarElemento('div', { class: 'tela tela--texto' }, [
    criarElemento('div', { class: 'titulo-tela' }, [
      criarElemento('h1', { texto: TITULO }),
      criarElemento('p', { class: 'titulo-tela__texto', texto: RESUMO })
    ]),
    criarElemento('p', { class: 'privacidade' }, [
      icone('travar', 16),
      criarElemento('span', { texto: 'Esta página descreve como o sistema funciona hoje, não uma promessa comercial.' })
    ]),
    ...SECOES.map(secao)
  ]);
}

function secao({ titulo, paragrafos }) {
  return criarElemento('section', { class: 'secao-texto' }, [
    criarElemento('h2', { texto: titulo }),
    ...paragrafos.map((texto) => criarElemento('p', { texto }))
  ]);
}
