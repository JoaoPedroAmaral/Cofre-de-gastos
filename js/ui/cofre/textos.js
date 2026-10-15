export const PASSOS = Object.freeze({ SENHA: 1, CODIGO: 2 });
export const NOME_PADRAO = 'Pessoal';
export const TIPO_TEXTO = 'text/plain';
export const ARQUIVO_CODIGO = 'codigo-de-recuperacao-gastos-controller.txt';
export const NOVO_PERFIL = 'novo';

export const TEXTOS = Object.freeze({
  TRANCADO: 'Cofre trancado',
  TRANCADO_AJUDA: 'Digite a senha do seu cofre.',
  ESCOLHA_PERFIL: 'Escolha o perfil e digite a senha.',
  CRIAR: 'Criar seu cofre',
  CRIAR_AJUDA:
    'Seus extratos ficam cifrados neste navegador. A senha nunca sai daqui, e é ela que abre o cofre.',
  CRIAR_OUTRO: 'Criar outro perfil',
  CRIAR_OUTRO_AJUDA: 'Cada perfil tem a própria senha e o próprio cofre. Um não enxerga os dados do outro.',
  NOME: 'Nome do perfil',
  SENHA: 'Senha',
  CONFIRMAR: 'Repita a senha',
  REQUISITOS: 'A senha precisa ter',
  CRIAR_ACAO: 'Criar cofre',
  DESTRAVAR: 'Destravar',
  USAR_CODIGO: 'Esqueci a senha — usar o código de recuperação',
  USAR_SENHA: 'Voltar para a senha',
  CODIGO: 'Código de recuperação',
  CODIGO_INCOMPLETO: 'O código tem 24 caracteres, em seis grupos de quatro.',
  TITULO_CODIGO: 'Guarde seu código de recuperação',
  AJUDA_CODIGO: 'Se um dia você esquecer a senha, é ele que abre o cofre. Ele aparece só agora, uma única vez.',
  ALERTA_CODIGO:
    'Guarde fora deste navegador: num gerenciador de senhas ou num papel. Sem a senha e sem este código, os dados ficam inacessíveis para sempre. Não existe recuperação por e-mail.',
  COPIAR: 'Copiar',
  BAIXAR: 'Baixar .txt',
  GUARDEI: 'Guardei o código num lugar seguro',
  ABRIR: 'Abrir meu cofre',
  NOVO: 'Novo',
  VOLTAR: 'Voltar',
  APAGAR: 'Apagar este perfil',
  APAGAR_CONFIRMAR: 'Apagar mesmo? Não tem volta',
  APAGADO: 'Perfil apagado.',
  JA_TENHO: 'Já tenho um cofre — restaurar de um backup',
  RESTAURAR_TITULO: 'Restaurar de um backup',
  RESTAURAR_AJUDA:
    'Escolha o arquivo de backup e digite a senha que você usou para protegê-lo. Em seguida você cria o cofre deste navegador.',
  ARQUIVO: 'Arquivo de backup',
  SENHA_BACKUP: 'Senha do backup',
  ABRIR_BACKUP: 'Abrir backup',
  SEM_ARQUIVO: 'Escolha o arquivo de backup.',
  BACKUP_ABERTO: 'Backup aberto. Agora crie a senha deste navegador.',
  RESTAURANDO: 'Restaurando do backup',
  RESTAURANDO_AJUDA:
    'O backup foi aberto. Crie a senha que vai proteger este cofre no navegador atual: ela pode ser diferente da senha do arquivo.',
  RODAPE: 'Seus dados ficam cifrados neste navegador. Sem a senha ou o código, ninguém abre, nem nós.',
  LER_TERMO: 'Ler o termo de privacidade',
  COPIADO: 'Código copiado.',
  PASSOS: Object.freeze(['Senha', 'Código', 'Pronto'])
});
