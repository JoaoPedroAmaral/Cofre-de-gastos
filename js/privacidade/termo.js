export const TERMO = Object.freeze({
  titulo: 'Privacidade',
  versao: '1',
  atualizadoEm: '2026-10-06',
  resumo:
    'Este sistema não tem servidor. Seus extratos são lidos, categorizados e guardados dentro do seu próprio navegador, e nada é enviado para lugar nenhum.',
  nota: 'Esta página descreve como o sistema funciona hoje, verificável no código, não uma promessa comercial.',
  secoes: Object.freeze([
    Object.freeze({
      titulo: 'O que sai do seu dispositivo',
      paragrafos: Object.freeze([
        'Nada. Não existe conta, cadastro, login remoto, servidor de aplicação nem banco de dados nosso. Os arquivos que você importa são abertos pelo próprio navegador e processados em memória.',
        'A política de segurança da página proíbe qualquer conexão de saída. Mesmo que algum código tentasse enviar seus dados, o navegador bloquearia a tentativa.'
      ])
    }),
    Object.freeze({
      titulo: 'Onde seus dados ficam',
      paragrafos: Object.freeze([
        'No armazenamento local deste navegador, cifrados com AES-256-GCM. A chave é derivada da sua senha e existe apenas enquanto o cofre está destravado; ela nunca é gravada em lugar nenhum.',
        'Quem abrir este site em outro navegador, em outro computador ou em janela anônima não vê nada do que está aqui. Cada cofre é independente.'
      ])
    }),
    Object.freeze({
      titulo: 'O que você cadastra sobre si',
      paragrafos: Object.freeze([
        'Para saber que uma transferência foi de uma conta sua para outra conta sua, o sistema precisa reconhecer você no extrato. Por isso existe um cadastro de nomes, fragmentos de documento e números de conta, na tela de Ajustes.',
        'Esse cadastro é dado como qualquer outro: fica cifrado dentro do cofre, no seu navegador, e some junto com ele. Nada disso é comparado com lista externa nem sai do dispositivo.'
      ])
    }),
    Object.freeze({
      titulo: 'O que isso custa a você',
      paragrafos: Object.freeze([
        'Não existe recuperação de senha por e-mail, porque não há ninguém do outro lado para provar quem você é. Perder a senha e o código de recuperação significa perder os dados.',
        'Limpar os dados do site pelo navegador apaga o cofre. Antes de fazer isso, ou antes de trocar de computador, exporte um backup.'
      ])
    }),
    Object.freeze({
      titulo: 'Bibliotecas de terceiros',
      paragrafos: Object.freeze([
        'As bibliotecas usadas para ler planilhas e faturas são servidas junto com o sistema, em versão fixa e com hash registrado, nunca de CDN. Num sistema que decifra extrato bancário no navegador, um script de terceiro na mesma origem leria os dados já decifrados.',
        'As fontes também são servidas localmente, pelo mesmo motivo.'
      ])
    }),
    Object.freeze({
      titulo: 'Rastreamento',
      paragrafos: Object.freeze([
        'Não há analytics, cookie de rastreamento, pixel, anúncio ou qualquer identificador. O sistema também não registra o que você faz: não existe log, porque não existe para onde mandá-lo.'
      ])
    }),
    Object.freeze({
      titulo: 'Como apagar tudo',
      paragrafos: Object.freeze([
        'Na tela de desbloqueio, cada perfil tem a opção de apagar, que remove o registro do perfil e todos os dados cifrados dele. Também é possível limpar os dados do site pelas configurações do navegador.'
      ])
    })
  ])
});

export const ENDERECO_DO_TERMO = '/privacidade.html';
