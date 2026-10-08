import { descrever, esperar, isso } from '../runner.js';
import { atualizarTelaCofre, telaCofre } from '../../js/ui/cadeado.js';
import { ESTADOS_COFRE } from '../../js/nucleo/constantes.js';
import {
  MENSAGENS_COFRE,
  TAMANHO_MINIMO_SENHA,
  requisitosDaSenha,
  senhaForte,
  abrirComCodigo,
  abrirComSenha,
  cifrar,
  criarCofre,
  decifrar,
  trocarSenha,
  validarSenha
} from '../../js/cofre/cofre.js';
import { codigoCompleto, formatarCodigo, gerarCodigo, normalizarCodigo } from '../../js/cofre/recuperacao.js';
import { deBase64, paraBase64, paraTexto } from '../../js/cofre/bytes.js';
import {
  MENSAGENS_BACKUP,
  abrirBackup,
  abrirCifrado,
  interpretar,
  serializarCifrado
} from '../../js/armazenamento/backup.js';

const SENHA = 'Senha#Forte2026';
const OUTRA_SENHA = 'Outra#Senha2026';

descrever('Força da senha', () => {
  isso('aceita senha que cumpre todos os requisitos', () => {
    esperar(validarSenha('Senha#2026')).igual('');
    esperar(senhaForte('Senha#2026')).verdadeiro();
  });

  isso('recusa senha curta mesmo com todos os tipos de caractere', () => {
    esperar(senhaForte('Aa1#aa')).falso();
    esperar(validarSenha('Aa1#aa')).contem(`pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`);
  });

  isso('recusa senha sem letra maiuscula', () => {
    esperar(validarSenha('senha#2026')).contem('uma letra maiúscula');
  });

  isso('recusa senha sem letra minuscula', () => {
    esperar(validarSenha('SENHA#2026')).contem('uma letra minúscula');
  });

  isso('recusa senha sem numero', () => {
    esperar(validarSenha('SenhaForte#')).contem('um número');
  });

  isso('recusa senha sem caractere especial', () => {
    esperar(validarSenha('SenhaForte2026')).contem('um caractere especial');
  });

  isso('nao aceita espaco como caractere especial', () => {
    esperar(validarSenha('Senha Forte 2026')).contem('um caractere especial');
  });

  isso('lista tudo que falta de uma vez', () => {
    const mensagem = validarSenha('aaaaaaaa');
    esperar(mensagem).contem('uma letra maiúscula');
    esperar(mensagem).contem('um número');
    esperar(mensagem).contem('um caractere especial');
  });

  isso('aceita acento como letra maiuscula e minuscula', () => {
    esperar(senhaForte('Avó#Querida9')).verdadeiro();
  });

  isso('devolve o estado de cada requisito para a tela', () => {
    const requisitos = requisitosDaSenha('abc');
    esperar(requisitos.length).igual(5);
    esperar(requisitos[1].atendido).falso();
    esperar(requisitos[2].atendido).verdadeiro();
  });

  isso('trata senha ausente sem quebrar', () => {
    esperar(senhaForte(undefined)).falso();
  });

  isso('recusa confirmacao diferente', () => {
    esperar(validarSenha(SENHA, 'Outra#Coisa9')).igual(MENSAGENS_COFRE.SENHAS_DIFERENTES);
  });
});

descrever('Código de recuperação', () => {
  isso('gera codigo com seis grupos de quatro', () => {
    esperar(gerarCodigo().split('-').length).igual(6);
    esperar(normalizarCodigo(gerarCodigo()).length).igual(24);
  });

  isso('gera codigos diferentes a cada chamada', () => {
    esperar(gerarCodigo()).diferenteDe(gerarCodigo());
  });

  isso('normaliza o codigo digitado com espaco e minuscula', () => {
    esperar(normalizarCodigo('k7qf 29xm')).igual('K7QF29XM');
  });

  isso('formata de volta em grupos', () => {
    esperar(formatarCodigo('K7QF29XMPL4D8WRNT3HV6YBC')).igual('K7QF-29XM-PL4D-8WRN-T3HV-6YBC');
  });

  isso('reconhece codigo completo e incompleto', () => {
    esperar(codigoCompleto(gerarCodigo())).verdadeiro();
    esperar(codigoCompleto('K7QF')).falso();
  });
});

descrever('Cofre criptográfico', () => {
  isso('abre com a senha correta', async () => {
    const novo = await criarCofre(SENHA);
    const chave = await abrirComSenha(novo.perfil, SENHA);
    esperar(Boolean(chave)).verdadeiro();
  });

  isso('recusa a senha errada', async () => {
    const novo = await criarCofre(SENHA);
    let mensagem = '';
    try {
      await abrirComSenha(novo.perfil, OUTRA_SENHA);
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_COFRE.SENHA_INCORRETA);
  });

  isso('abre com o codigo de recuperacao, sem a senha', async () => {
    const novo = await criarCofre(SENHA);
    const chave = await abrirComCodigo(novo.perfil, novo.codigo);
    const registro = await cifrar(chave, { valor: 42 });
    esperar((await decifrar(await abrirComSenha(novo.perfil, SENHA), registro)).valor).igual(42);
  });

  isso('aceita o codigo digitado sem hifen e em minuscula', async () => {
    const novo = await criarCofre(SENHA);
    const chave = await abrirComCodigo(novo.perfil, novo.codigo.replace(/-/g, '').toLowerCase());
    esperar(Boolean(chave)).verdadeiro();
  });

  isso('recusa codigo errado', async () => {
    const novo = await criarCofre(SENHA);
    let mensagem = '';
    try {
      await abrirComCodigo(novo.perfil, 'AAAA-BBBB-CCCC-DDDD-EEEE-FFFF');
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_COFRE.CODIGO_INCORRETO);
  });

  isso('a senha e o codigo abrem a mesma chave de dados', async () => {
    const novo = await criarCofre(SENHA);
    const porSenha = await abrirComSenha(novo.perfil, SENHA);
    const porCodigo = await abrirComCodigo(novo.perfil, novo.codigo);

    const registro = await cifrar(porSenha, { segredo: 'extrato' });
    esperar((await decifrar(porCodigo, registro)).segredo).igual('extrato');
  });

  isso('dois cofres com a mesma senha geram envelopes diferentes', async () => {
    const um = await criarCofre(SENHA);
    const outro = await criarCofre(SENHA);
    esperar(paraBase64(um.perfil.envelopeSenha.salt)).diferenteDe(paraBase64(outro.perfil.envelopeSenha.salt));
  });

  isso('cifra e decifra preservando o conteudo', async () => {
    const novo = await criarCofre(SENHA);
    const valor = { lancamentos: [{ descricaoOriginal: 'PADARIA SÃO JOÃO', valor: -1250 }] };
    const registro = await cifrar(novo.chave, valor);
    esperar(await decifrar(novo.chave, registro)).igual(valor);
  });

  isso('usa IV diferente a cada gravacao', async () => {
    const novo = await criarCofre(SENHA);
    const um = await cifrar(novo.chave, { a: 1 });
    const outro = await cifrar(novo.chave, { a: 1 });

    esperar(paraBase64(um.iv)).diferenteDe(paraBase64(outro.iv));
    esperar(paraBase64(um.dados)).diferenteDe(paraBase64(outro.dados));
  });

  isso('o conteudo cifrado nao deixa o texto legivel', async () => {
    const novo = await criarCofre(SENHA);
    const registro = await cifrar(novo.chave, { descricaoOriginal: 'PAGBANK*JL ALIMENTOS' });
    esperar(paraTexto(registro.dados).includes('ALIMENTOS')).falso();
  });

  isso('a chave de dados nao pode ser exportada', async () => {
    const novo = await criarCofre(SENHA);
    let falhou = false;
    try {
      await crypto.subtle.exportKey('raw', novo.chave);
    } catch {
      falhou = true;
    }
    esperar(falhou).verdadeiro();
  });

  isso('troca de senha mantem os dados acessiveis', async () => {
    const novo = await criarCofre(SENHA);
    const registro = await cifrar(novo.chave, { valor: 7 });

    const perfil = await trocarSenha(novo.perfil, SENHA, OUTRA_SENHA);
    const chave = await abrirComSenha(perfil, OUTRA_SENHA);

    esperar((await decifrar(chave, registro)).valor).igual(7);
  });

  isso('a senha antiga deixa de abrir depois da troca', async () => {
    const novo = await criarCofre(SENHA);
    const perfil = await trocarSenha(novo.perfil, SENHA, OUTRA_SENHA);

    let mensagem = '';
    try {
      await abrirComSenha(perfil, SENHA);
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_COFRE.SENHA_INCORRETA);
  });

  isso('o codigo continua valendo depois da troca de senha', async () => {
    const novo = await criarCofre(SENHA);
    const perfil = await trocarSenha(novo.perfil, SENHA, OUTRA_SENHA);
    esperar(Boolean(await abrirComCodigo(perfil, novo.codigo))).verdadeiro();
  });
});

descrever('Perfis isolados', () => {
  isso('a senha de um perfil nao abre o cofre do outro', async () => {
    const pessoal = await criarCofre(SENHA);
    const casa = await criarCofre(OUTRA_SENHA);

    let mensagem = '';
    try {
      await abrirComSenha(casa.perfil, SENHA);
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_COFRE.SENHA_INCORRETA);
  });

  isso('o codigo de um perfil nao abre o cofre do outro', async () => {
    const pessoal = await criarCofre(SENHA);
    const casa = await criarCofre(OUTRA_SENHA);

    let mensagem = '';
    try {
      await abrirComCodigo(casa.perfil, pessoal.codigo);
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_COFRE.CODIGO_INCORRETO);
  });

  isso('dados de um perfil nao abrem com a chave do outro', async () => {
    const pessoal = await criarCofre(SENHA);
    const casa = await criarCofre(OUTRA_SENHA);
    const registro = await cifrar(pessoal.chave, { descricaoOriginal: 'EXTRATO PESSOAL' });

    let falhou = false;
    try {
      await decifrar(casa.chave, registro);
    } catch {
      falhou = true;
    }
    esperar(falhou).verdadeiro();
  });

  isso('dois perfis com a mesma senha continuam separados', async () => {
    const um = await criarCofre(SENHA);
    const outro = await criarCofre(SENHA);
    const registro = await cifrar(um.chave, { valor: 1 });

    let falhou = false;
    try {
      await decifrar(outro.chave, registro);
    } catch {
      falhou = true;
    }
    esperar(falhou).verdadeiro();
  });
});

descrever('Backup cifrado', () => {
  const estado = {
    lancamentos: [{ id: 'a', descricaoOriginal: 'PADARIA SÃO JOÃO', valor: -1250, categoria: 'Alimentação' }],
    regras: [],
    categorias: ['Alimentação']
  };

  isso('gera arquivo sem nada legivel', async () => {
    const texto = await serializarCifrado(estado, SENHA);

    esperar(texto.includes('PADARIA')).falso();
    esperar(texto.includes('Alimentação')).falso();
  });

  isso('volta igual quando aberto com a senha do backup', async () => {
    const aberto = await abrirBackup(await serializarCifrado(estado, SENHA), SENHA);
    esperar(aberto.lancamentos[0].descricaoOriginal).igual('PADARIA SÃO JOÃO');
  });

  isso('abre em qualquer navegador, sem depender do cofre de origem', async () => {
    const texto = await serializarCifrado(estado, SENHA);
    const conteudo = interpretar(texto);

    esperar(Boolean(conteudo.salt)).verdadeiro();
    esperar((await abrirCifrado(conteudo, SENHA)).lancamentos.length).igual(1);
  });

  isso('recusa a senha errada', async () => {
    const conteudo = interpretar(await serializarCifrado(estado, SENHA));

    let mensagem = '';
    try {
      await abrirCifrado(conteudo, OUTRA_SENHA);
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_BACKUP.SENHA_INCORRETA);
  });

  isso('exige senha para gerar o backup', async () => {
    let mensagem = '';
    try {
      await serializarCifrado(estado, '');
    } catch (erro) {
      mensagem = erro.message;
    }
    esperar(mensagem).igual(MENSAGENS_BACKUP.SEM_SENHA);
  });

  isso('dois backups da mesma senha usam salt diferente', async () => {
    const um = interpretar(await serializarCifrado(estado, SENHA));
    const outro = interpretar(await serializarCifrado(estado, SENHA));
    esperar(um.salt).diferenteDe(outro.salt);
  });

  isso('recusa backup do formato antigo, preso ao cofre de origem', () => {
    const antigo = JSON.stringify({
      formato: 'gastos-controller/backup',
      versao: 2,
      cifrado: true,
      iv: 'AAAA',
      dados: 'BBBB'
    });
    esperar(() => interpretar(antigo)).lancaErro(MENSAGENS_BACKUP.FORMATO_ANTIGO);
  });

  isso('marca o arquivo como cifrado', async () => {
    esperar(interpretar(await serializarCifrado(estado, SENHA)).cifrado).verdadeiro();
  });

  isso('converte bytes para base64 e de volta sem perder nada', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    esperar([...deBase64(paraBase64(bytes))]).igual([...bytes]);
  });
});

descrever('Trocar de perfil na tela de entrada', () => {
  const PERFIS = [
    { id: 'p1', nome: 'Pessoal' },
    { id: 'p2', nome: 'Trabalho' }
  ];

  function estadoTravado(escolhido) {
    return {
      cofre: {
        situacao: ESTADOS_COFRE.TRAVADO,
        perfil: PERFIS.find((perfil) => perfil.id === escolhido),
        perfis: PERFIS,
        erro: ''
      }
    };
  }

  function montar(escolhido) {
    return telaCofre(estadoTravado(escolhido), { aoAbrir() {}, aoApagar() {} });
  }

  function botoesDePerfil(tela) {
    return [...tela.querySelectorAll('.perfis .perfil')];
  }

  function marcado(tela) {
    return tela.querySelector('.perfil--ativo')?.textContent ?? null;
  }

  isso('a ajuda da tela aparece como texto, nunca como objeto estringificado', () => {
    const tela = montar('p1');

    esperar(tela.textContent.includes('[object')).falso();
  });

  isso('com mais de um perfil, a ajuda manda escolher o perfil', () => {
    const tela = montar('p1');
    const ajuda = tela.querySelector('.cofre__titulo p');

    esperar(ajuda.textContent.length > 0).verdadeiro();
    esperar(ajuda.textContent).contem('perfil');
  });

  isso('comeca com o perfil escolhido marcado', () => {
    esperar(marcado(montar('p1'))).contem('Pessoal');
  });

  isso('trocar de perfil muda a marcacao', () => {
    const tela = montar('p1');
    atualizarTelaCofre(estadoTravado('p2'));

    esperar(marcado(tela)).contem('Trabalho');
  });

  isso('trocar de perfil nao remonta a tela inteira', () => {
    const tela = montar('p1');
    const formulario = tela.querySelector('.cofre__formulario');
    const caixaDePerfis = tela.querySelector('.perfis');

    atualizarTelaCofre(estadoTravado('p2'));

    esperar(tela.querySelector('.cofre__formulario') === formulario).verdadeiro();
    esperar(tela.querySelector('.perfis') === caixaDePerfis).verdadeiro();
  });

  isso('o perfil que nao mudou mantem o proprio no', () => {
    const tela = montar('p1');
    const naoEscolhido = botoesDePerfil(tela).find((botao) => botao.textContent.includes('Trabalho'));

    atualizarTelaCofre(estadoTravado('p1'));

    esperar(botoesDePerfil(tela).includes(naoEscolhido)).verdadeiro();
  });

  isso('trocar de perfil muitas vezes nao faz a lista crescer', () => {
    const tela = montar('p1');
    const antes = botoesDePerfil(tela).length;

    for (let volta = 0; volta < 10; volta += 1) {
      atualizarTelaCofre(estadoTravado(volta % 2 === 0 ? 'p2' : 'p1'));
    }

    esperar(botoesDePerfil(tela).length).igual(antes);
    esperar(tela.querySelectorAll('.perfil--ativo').length).igual(1);
  });

  isso('o rotulo da senha acompanha o perfil escolhido', () => {
    const tela = montar('p1');
    const rotuloDe = () => tela.querySelector('.campo .campo__rotulo').textContent;

    esperar(rotuloDe()).contem('Pessoal');
    atualizarTelaCofre(estadoTravado('p2'));
    esperar(rotuloDe()).contem('Trabalho');
  });

  isso('a senha digitada nao vaza de um perfil para o outro', () => {
    const tela = montar('p1');
    const senha = tela.querySelector('#senha-cofre');
    senha.value = 'segredo-do-pessoal';

    atualizarTelaCofre(estadoTravado('p2'));

    esperar(tela.querySelector('#senha-cofre').value).igual('');
  });
});
