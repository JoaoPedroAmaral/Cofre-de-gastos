import { NIVEIS_AVISO } from '../../nucleo/constantes.js';
import { MENSAGENS_BACKUP, abrirBackup } from '../../armazenamento/backup.js';
import { avisar, campoDeArquivo, criarElemento } from '../componentes.js';
import { campoSecreto, moldura, rotulado } from './moldura.js';
import { TEXTOS } from './textos.js';

const ARQUIVO_DE_BACKUP = 'arquivo-backup';
const ACEITA_BACKUP = '.json';

export function telaRestauracao(aoSair) {
  const arquivo = campoDeArquivo({
    id: ARQUIVO_DE_BACKUP,
    rotulo: TEXTOS.ARQUIVO,
    aceita: ACEITA_BACKUP
  });

  const senha = campoSecreto('senha-backup', TEXTOS.SENHA_BACKUP, 'password', 'off');
  const erro = criarElemento('p', { class: 'cofre__erro' });

  const formulario = criarElemento('form', {
    class: 'cofre__formulario',
    onSubmit: async (evento) => {
      evento.preventDefault();
      const escolhido = arquivo.entrada.files[0];

      if (!escolhido) {
        erro.textContent = TEXTOS.SEM_ARQUIVO;
        return;
      }

      try {
        const conteudo = await abrirBackup(await escolhido.text(), senha.value);
        avisar(TEXTOS.BACKUP_ABERTO, NIVEIS_AVISO.SUCESSO);
        aoSair(conteudo);
      } catch (falha) {
        erro.textContent = falha.message || MENSAGENS_BACKUP.CONTEUDO_INVALIDO;
      }
    }
  });

  formulario.append(
    criarElemento('div', { class: 'campo' }, [
      criarElemento('span', { class: 'campo__rotulo', texto: TEXTOS.ARQUIVO }),
      arquivo.elemento
    ]),
    criarElemento('div', { class: 'campo' }, [rotulado(senha, TEXTOS.SENHA_BACKUP)]),
    erro,
    criarElemento('button', {
      class: 'botao botao--principal botao--largo',
      type: 'submit',
      texto: TEXTOS.ABRIR_BACKUP
    }),
    criarElemento('button', {
      class: 'botao botao--discreto',
      type: 'button',
      texto: TEXTOS.VOLTAR,
      onClick: () => aoSair()
    })
  );

  return moldura(TEXTOS.RESTAURAR_TITULO, TEXTOS.RESTAURAR_AJUDA, [formulario]);
}
