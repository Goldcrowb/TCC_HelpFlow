# Manual rápido — HelpFlow 2.2

Use o README para requisitos, instalação e publicação; o D7 do dossiê apresenta a operação completa. O ambiente recomendado é Windows 10/11 ou Linux com Node.js 22, npm, navegador atualizado, internet para primeira instalação e uma pasta gravável. Não há equipamento externo. O pacote depende do npm; não é um executável independente.

## Cliente
1. Crie uma conta escolhendo Cliente. Use e-mail fictício válido e senha de 10 a 128 caracteres. Faça login.
2. Clique em **Novo chamado**. Preencha título (5 a 120 caracteres), categoria e descrição (mínimo 10 caracteres). Confirme.
3. Confira o estado Aberto e use os filtros/pesquisa. Abra os detalhes para consultar e enviar mensagens.
4. Use uma sessão de navegador separada para o técnico.

## Técnico
1. Solicite cadastro como Técnico; enquanto pendente, o login é recusado. Entre com um técnico já ativo para aprovar ou recusar em Pedidos de acesso técnico. Após aprovação, entre com a nova conta.
2. Em Fila geral, abra um chamado ou clique em Assumir. Nos detalhes, o botão também permite assumir. O chamado vai para Meus atendimentos.
3. Responda no histórico e altere status. Em Meus atendimentos, filtre Em aberto, Resolvidos ou Todos.
4. Se necessário, clique em Transferir chamado nos detalhes, escolha outro técnico ativo e confirme. O novo técnico encontrará o chamado ao atualizar sua lista. O anterior não pode editar ou responder depois da transferência.
5. Primeiro técnico: abra Gerenciar usuários, filtre ou pesquise e confirme a exclusão. Não é possível excluir a conta inicial ou um técnico com chamados não resolvidos. Atendimento e mensagens permanecem no histórico; recriar uma conta não recupera seus chamados.

## Sem conexão
Com sessão previamente aberta, desconecte a rede e crie um chamado. A fila de operações pendentes aparecerá. Reconecte e clique Sincronizar se necessário; confirme um único registro. Mensagens podem ser enfileiradas quando o detalhe já está disponível. Não limpe armazenamento do navegador antes de sincronizar. Erros de validação exigem descarte/correção manual. Não use um computador compartilhado para dados sensíveis, pois a fila local não é criptografada.

## Problemas comuns
- npm não reconhecido: instale Node 22, feche e reabra terminal. PowerShell com execução bloqueada: tente npm.cmd.
- Render não compila: confira Node 22 e npm ci --include=dev; use os logs.
- Site carrega, mas banco falha: confira URL base Supabase, chave, restauração e scripts SQL; não compartilhe segredos.
- Conta inicial não aparece: verifique TEC-01 com scripts/verificar_banco.sql. Não altere IDs manualmente.
- Exclusão indisponível: execute a migração e verifique privilégios; se persistir, consulte erros do Render. Faça teste com conta fictícia.
- Site lento ao primeiro acesso: aguarde a reativação dos serviços gratuitos e teste antes da banca.

Validação por terceiro (CA-06): pendente. Use docs/evidencias/registro_instalacao.md para registrar nome, data, ambiente, comandos executados e resultado sem ajuda. Não assine nem marque como aprovado antes do teste.
