# Transferência de chamados entre técnicos

Atualização incremental do HelpFlow 2.1, baseada nos arquivos da branch main conferidos antes da alteração. Preserva a funcionalidade de assumir chamados também na janela de detalhes.

## Instalação

1. Extraia a pasta `src` deste ZIP sobre a pasta `src` do repositório local. Confirme a substituição dos 11 arquivos. Copie também este documento para `docs/transferencia_chamados.md`, se desejar manter o registro da atualização no GitHub.
2. Não apague a pasta `.git`, não substitua o projeto inteiro e não publique `node_modules`, `dist` ou chaves de acesso.
3. No terminal, a partir da raiz do projeto, execute `npm ci --include=dev`, `npm test`, `npm run check` e `npm run build`.
4. Faça o commit `Adiciona transferencia de chamados entre tecnicos` e o Push origin. Acompanhe o deploy no Render. Se o serviço estiver suspenso, reative-o.
5. Não é necessária migração SQL ou alteração de variáveis de ambiente: o recurso usa `usuarios.perfil`, `usuarios.situacao`, `chamados.tecnico_id` e `chamados.versao` existentes na versão 2.1.

## Uso

- Entre como técnico aprovado. Abra um chamado de sua responsabilidade que não esteja resolvido.
- Clique em **Transferir chamado**, escolha outro técnico aprovado na lista e confirme.
- O chamado mantém o status, o cliente, a descrição e todas as mensagens existentes. O responsável muda e o contador de versão é incrementado.
- O chamado sai de Meus atendimentos do técnico anterior. O destinatário poderá visualizá-lo em Meus atendimentos ao abrir ou atualizar o painel.
- O antigo responsável perde a autorização de responder ou alterar o status. Pode consultar detalhes, de acordo com a regra de leitura de técnicos já existente.
- Não é feita transferência offline. O destinatário não precisa aceitar o chamado, não recebe notificação automática e não há tabela separada de auditoria de transferências; apenas o responsável atual e o histórico de mensagens são mantidos.
- Se não houver nenhum outro técnico aprovado, cadastre e aprove um segundo técnico primeiro.

## Regras da API

`GET /api/tecnicos/ativos`: sessão de técnico aprovado obrigatória; lista outros técnicos ativos com id, nome e e-mail, sem senhas.

`PATCH /api/chamados/:id/transferir`: sessão de técnico aprovado obrigatória. Corpo JSON: `{"tecnicoId":"id-do-destinatario","versao":2}` (versão obtida nos detalhes). Somente o responsável atual pode transferir; o destinatário precisa ser outro técnico ativo; chamados resolvidos não são transferidos. O controle otimista de versão existente rejeita conflitos. Retorna o chamado atualizado.

## Verificação local

- 34 testes automatizados aprovados (7 arquivos de teste). Novos cenários abrangem permissões, técnico pendente/recusado, concorrência, preservação do histórico e troca de responsável.
- Checagem TypeScript e build concluídos.
- Servidor compilado devolveu HTTP 200 na rota de saúde e página inicial.
- O teste no Supabase real, a publicação no Render e a conferência visual da interface no navegador ainda precisam ser feitos.

## Teste no site publicado

1. Entre com duas contas aprovadas, em navegadores ou perfis distintos.
2. Abra um chamado como cliente, assuma-o com o técnico A e envie uma mensagem.
3. Em Meus atendimentos, transfira o chamado para o técnico B.
4. Atualize o painel de B e confirme que o chamado e a mensagem aparecem; verifique que B consegue responder e que A não consegue mais alterar o atendimento.
5. Confira se o botão Assumir nos detalhes e na fila continua disponível para chamados novos.
