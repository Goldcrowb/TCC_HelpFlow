# 11 — Cadastro de usuários e aprovação de técnicos

## Objetivo

A versão 2.1 permite que uma pessoa crie uma conta de cliente ou solicite acesso como técnico. Clientes entram logo após o cadastro; pedidos de técnico aguardam decisão de alguém que já tenha acesso técnico aprovado. Os registros de usuário são mantidos no Supabase quando o sistema está publicado.

## Antes de atualizar seu site que já está online

**Siga esta ordem para não interromper o HelpFlow:**

1. **Faça um backup** dos dados importantes do Supabase. O procedimento não apaga `chamados` nem `mensagens`, mas as contas antigas eram de demonstração e não estão automaticamente na nova tabela de usuários.
2. No Supabase, entre no **SQL Editor** do MESMO projeto usado pelo Render. Abra `scripts/migracao_cadastro.sql`, copie e execute o conteúdo. Na seção Table Editor deverá existir a tabela `usuarios`. Para uma instalação nova, `database.sql` já contém essa tabela.
3. No Render, abra o serviço `helpflow-tcc` → **Environment** e adicione as variáveis indicadas abaixo, mantendo as que já funcionam.
4. Salve as configurações. Se o serviço estiver suspenso, só retome após a configuração.
5. Copie os arquivos desta versão para a pasta local do GitHub (preservando `.git`), faça o commit na branch `main` e envie com **Push origin**. O Render poderá fazer deploy automaticamente.
6. Abra o site, entre com o primeiro técnico e teste cadastro de um cliente, solicitação de técnico, aprovação e acesso do aprovado.

## Variáveis do Render

| Chave | Valor |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase, no formato `https://...supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta do MESMO projeto, somente no Render |
| `SESSION_SECRET` | Segredo aleatório com no mínimo 32 caracteres (pode já estar configurado) |
| `NODE_ENV` | `production` |
| `TECNICO_INICIAL_EMAIL` | E-mail que você usará para o primeiro técnico |
| `TECNICO_INICIAL_SENHA` | Senha exclusiva com pelo menos 12 caracteres; não usar `123456` |
| `TECNICO_INICIAL_NOME` | Opcional; nome do técnico responsável |

O primeiro técnico é criado automaticamente no Supabase ao iniciar o servidor, caso ainda não exista cadastro com o e-mail informado. A senha da variável **não substitui** a senha de uma conta já existente; para recuperar acesso será necessária uma funcionalidade administrativa futura. Não utilize um e-mail já cadastrado como cliente ou técnico pendente para o técnico inicial.

**Não coloque as chaves ou senhas no ZIP, GitHub, README ou em mensagens.** O arquivo `.env.example` contém apenas nomes de variáveis, sem valores reais.

## Funcionamento e regras

- **Cliente:** escolhe Cliente no cadastro, informa nome, e-mail e senha (mínimo 10 caracteres), confirma a senha e pode fazer login após receber confirmação de cadastro.
- **Candidato a técnico:** escolhe Técnico e recebe aviso de solicitação pendente. A senha é validada, mas ele não pode acessar o painel antes da aprovação.
- **Técnico ativo:** encontra a caixa “Pedidos de acesso técnico” no painel, abre os pedidos e pode aprovar ou recusar uma inscrição. O sistema registra responsável e momento da decisão; a segunda decisão é recusada.
- **Recusa:** mantém a conta sem acesso técnico. O candidato recebe aviso ao tentar entrar com e-mail e senha corretos.
- **Segurança:** o perfil é conferido na API, não apenas pela interface. As senhas usam hash `scrypt` com sal único. A API retorna somente dados mínimos e usa sessão por cookie HttpOnly.

## Mudanças em relação à versão anterior

As contas antigas de demonstração (`cliente@helpflow.local`, `tecnico@helpflow.local`, ambas com senha pública) **não existem automaticamente na versão publicada** após a atualização, por segurança. Essas contas continuam disponíveis apenas no modo local **sem Supabase**.

Chamados e mensagens antigos continuam no banco, mas podem estar associados aos identificadores dos usuários anteriores (por exemplo, `CLI-01`). **O cadastro de um cliente novo terá outro identificador e não verá esses registros por padrão**. Para preservá-los com o mesmo cliente, será necessário planejar uma migração de vínculo após conferência da titularidade. Não execute `UPDATE` indiscriminado no banco. O técnico inicial utiliza `TEC-01`, para manter o vínculo dos atendimentos que eventualmente foram assumidos pelo técnico de demonstração.

## Teste recomendado no endereço público

1. Entre no site com o técnico inicial usando as credenciais que você definiu no Render.
2. Saia, crie conta de cliente e faça login. Abra um chamado e veja se ele aparece em “Meus chamados”.
3. Saia, crie uma conta de técnico com outro e-mail. Tente entrar; deverá aparecer “aguardando aprovação”.
4. Entre com o técnico inicial, abra “Pedidos de acesso técnico” e aprove a nova conta.
5. Entre com o técnico aprovado e confira se a fila de chamados está disponível.
6. Repita com outro pedido, escolhendo recusar. Confirme que ele permanece sem acesso.
7. Reinicie o serviço Render e confirme se os dois cadastros continuam existindo.

Os testes automatizados locais somam 32 casos aprovados. A integração real com Supabase e o fluxo completo no Render devem ser validados manualmente e registrados para o TCC.

## Limitações conhecidas

Esta é uma solução acadêmica. Ainda não possui recuperação de senha, confirmação de e-mail, CAPTCHA/antispam avançado, alteração administrativa de perfis ou notificação automática ao candidato. O candidato verifica a situação tentando entrar novamente com suas credenciais. Para disponibilização pública a longo prazo, recomenda-se acrescentar esses controles e revisar as dependências com `npm audit`.
