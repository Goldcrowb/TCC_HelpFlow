# Rotas da API — versão 2.2.0

As rotas utilizam JSON; o navegador envia o cookie `helpflow_sessao` HttpOnly. O servidor confirma a assinatura, expiração, ID e situação ativa. A API e a interface ficam no mesmo host em produção; o Vite redireciona `/api` localmente. Dados de senha/hash não retornam nas listagens.

| Método e rota | Acesso | Entrada / retorno |
| --- | --- | --- |
| GET `/api/saude` | público | status, projeto, versão |
| POST `/api/auth/cadastro` | público | nome, email, senha, perfil; perfil/situação (201) |
| POST `/api/auth/login` | público | email, senha; resumo de usuário + cookie |
| GET `/api/auth/session` | sessão | resumo do usuário (inclui podeGerenciarUsuarios) |
| POST `/api/auth/logout` | público | limpa cookie; ok |
| GET `/api/tecnicos/solicitacoes` | técnico ativo | pedidos pendentes (até 100) |
| PATCH `/api/tecnicos/solicitacoes/:id` | técnico ativo | decisao aprovar/recusar, motivo opcional |
| GET `/api/tecnicos/ativos` | técnico ativo | id, nome, email; exclui o próprio |
| GET `/api/usuarios` | TEC-01 ativo | id, nome, email, perfil, situação |
| DELETE `/api/usuarios/:id` | TEC-01 ativo | ok; protege TEC-01 e técnicos com pendências |
| POST `/api/chamados` | cliente | titulo, descricao, categoria, operacaoId opcional; chamado (201) |
| GET `/api/chamados/meus` | cliente | próprios chamados |
| GET `/api/chamados/fila` | técnico ativo | abertos sem responsável, até 500 no Supabase |
| GET `/api/chamados/atendimentos` | técnico ativo | próprios atendimentos, até 500 no Supabase |
| GET `/api/chamados/:id` | cliente dono ou técnico ativo | chamado e até 50 mensagens recentes em ordem cronológica |
| POST `/api/chamados/:id/atribuir` | técnico ativo | atribui e atualiza a versão |
| PATCH `/api/chamados/:id/transferir` | técnico responsável | tecnicoId, versao; chamado atualizado |
| PATCH `/api/chamados/:id/status` | técnico responsável | status; chamado atualizado |
| POST `/api/chamados/:id/mensagens` | cliente dono ou técnico responsável | conteudo, operacaoId opcional; mensagem (201) |

Chamado: id, clienteId, titulo, descricao, categoria, dataAbertura, status, tecnicoResponsavelId, versao. Mensagem: id, autorId, conteudo, dataEnvio. Datas ISO UTC são formatadas no navegador com segundos, no fuso local. Status: Aberto, Em Andamento, Resolvido. Categorias: Hardware, Software, Rede, Acesso, Outros.

Erros esperados: 400 dados inválidos/regra de negócio; 401 sessão/login; 403 permissão; 404 registro/rota; 409 conflito de versão ou e-mail duplicado; 429 limite de tentativas; 500 falha inesperada. A configuração de exclusão ausente ou restrição de vínculo recebe mensagem específica, com detalhe técnico em logs do servidor. A rota saúde não testa todas as funções do banco.

A sincronização repete o identificador de operação (UUID) para evitar novas gravações duplicadas. O primeiro envio cria o registro; reenvio com mesmo chamado/conteúdo/autor deve ser idempotente. A fila do navegador usa localStorage, associada ao identificador do usuário e enviada sequencialmente; falha de rede interrompe o envio, erro funcional requer ação manual. O service worker armazena a interface (cache estático), não as respostas API.
