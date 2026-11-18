# Gerenciamento de usuários

O painel do primeiro técnico passa a oferecer a opção **Gerenciar usuários**. É possível pesquisar por nome ou e-mail e filtrar por perfil. A lista inclui clientes, técnicos ativos e solicitações pendentes ou recusadas.

## Regras

- Apenas o técnico inicial, identificado pelo ID reservado `TEC-01` e com cadastro ativo, pode listar e excluir contas. A permissão é verificada no servidor a cada requisição, não apenas na interface.
- A própria conta do técnico inicial não pode ser excluída.
- A exclusão exige confirmação e remove a conta do banco, inclusive o hash da senha. O usuário perde a possibilidade de entrar e a sessão anterior deixa de autorizar novas requisições.
- Chamados e mensagens não são apagados. Os identificadores históricos permanecem; novo cadastro com o mesmo e-mail recebe outro identificador e não recupera os chamados da conta anterior. Chamados em aberto de clientes excluídos podem continuar sendo atendidos pelos técnicos, mas não haverá acesso do antigo cliente.
- Antes de excluir um técnico com chamados não resolvidos atribuídos a ele, é preciso resolver ou transferir esses atendimentos.
- A exclusão não inclui bloqueio permanente do e-mail nem auditoria específica de exclusões. Uma pessoa pode solicitar novo cadastro depois da exclusão.

## Implementação

`GerenciamentoUsuarioService` concentra a regra de autorização e consulta os repositórios. `GET /api/usuarios` lista contas sem informações de senha e `DELETE /api/usuarios/:id` exclui a conta. `podeGerenciarUsuarios` é retornado no resumo de sessão para exibir o painel. No Supabase, a função `excluir_usuario_helpflow` verifica os atendimentos em uma transação e a proteção de atribuição impede que uma nova transferência seja direcionada a um técnico removido. O script da migração não exclui registros ao ser executado.

## Atualização

Faça backup antes de excluir contas reais. No SQL Editor do Supabase, execute `scripts/migracao_gerenciamento_usuarios.sql` antes de publicar os arquivos no GitHub. Não é necessário alterar as variáveis do Render nem criar outro técnico inicial. Após a implantação, saia e entre novamente com a conta inicial. Se a opção não aparecer, confira se a conta possui o ID `TEC-01` na tabela `usuarios` (não altere IDs manualmente).

## Validação

Verificações locais: 37 testes automatizados passaram, checagens de tipos do servidor e cliente aprovadas, build de produção e teste de inicialização aprovados. Os testes da API usam os repositórios em memória e cobrem autorização, proteção da conta inicial, preservação do histórico, invalidação de sessão e exclusão de técnico após transferência de atendimento. A execução da migração no Supabase, a concorrência real no PostgreSQL e a conferência visual do painel online ainda devem ser realizadas. Não foram testadas nesta atualização.
