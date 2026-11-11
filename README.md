# HelpFlow — Sistema de chamados de suporte técnico

**Versão:** 2.1.0  
**Situação:** cadastro e aprovação implementados; 32 testes automatizados executados localmente. A migração do banco e a verificação completa no serviço publicado ainda precisam ser realizadas.

O HelpFlow foi desenvolvido para registrar e acompanhar solicitações de suporte técnico. O cliente pode abrir chamados e acompanhar as respostas. O técnico consulta a fila, assume solicitações e registra o atendimento. A interface utiliza **React, TypeScript e Vite**; a API foi feita com **Node.js e Express**. O armazenamento pode ser realizado no **PostgreSQL do Supabase**.

## Funcionalidades implementadas

- Cadastro público para **cliente** (ativo imediatamente) e solicitação de **técnico** (aguarda aprovação). Conta de técnico já autorizado pode aprovar ou recusar pedidos. Sessão assinada em cookie HttpOnly.
- Cliente abre chamados com título, descrição, categoria e data/hora automáticas, consulta somente os próprios chamados e conversa no histórico.
- Técnico visualiza a fila geral de chamados abertos e sem responsável, assume um chamado com controle de versão, acessa **Meus atendimentos**, responde mensagens e altera o status para **Aberto**, **Em Andamento** ou **Resolvido**.
- Chamados, mensagens e contas cadastradas persistem no PostgreSQL quando o servidor recebe a configuração do Supabase. Senhas novas são armazenadas com hash `scrypt` e sal individual.
- Funcionamento offline limitado: o aplicativo instalado/visitado pode abrir a interface em cache; criação de chamados e envio de mensagens ficam em fila local e são enviados na volta da conexão, em ordem, com IDs que evitam duplicação. **Atribuição e mudança de status exigem internet.**
- Interface responsiva, pesquisa e filtros, indicadores, tela de detalhes e mensagens datadas.
- API integrada a testes automatizados: valida autenticação, autorização, idempotência, concorrência e regras de negócio.

> **Ambiente local:** as quatro contas antigas de demonstração com senha `123456` só existem quando se utiliza o repositório em memória. **No Render, a versão 2.1 usa usuários salvos no Supabase**, sem manter essas senhas públicas. Antes de publicar, configure o primeiro técnico aprovado conforme `docs/11_cadastro_e_aprovacao.md`.

## Como executar no computador

1. Instale **Node.js 22** e npm.
2. Abra a pasta `TCC_HelpFlow` no VS Code/terminal.
3. Execute:

```bash
npm ci
npm run dev
```

4. Acesse **http://localhost:5173**. O Vite encaminha `/api` para **http://localhost:3000**.
5. Contas de demonstração:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `cliente@helpflow.local` | `123456` |
| Cliente 2 | `cliente2@helpflow.local` | `123456` |
| Técnico | `tecnico@helpflow.local` | `123456` |
| Técnico 2 | `tecnico2@helpflow.local` | `123456` |

**Sem Supabase, contas e chamados são temporários.** Em banco novo execute `database.sql`; para atualizar o banco que já está funcionando, execute `scripts/migracao_cadastro.sql` antes do deploy. Configure as variáveis em um ambiente seguro no servidor.

## Comandos

```bash
npm ci                  # instalar dependências conforme package-lock
npm run dev             # API (3000) e site (5173)
npm run check           # checar TypeScript do servidor e dos módulos de API/filas
npm test                # testes unitários e integração HTTP
npm run build           # gera dist/server e dist/web
npm start               # hospeda API e site juntos em http://localhost:3000
npm run test:build      # confere a API e a página após compilar
```

**Para testar a versão de produção localmente:** `npm run build` seguido de `npm start`, sem configurar `NODE_ENV=production` se estiver sem banco. Em produção real, o servidor exige Supabase configurado e `SESSION_SECRET` com 32 caracteres ou mais.

## Publicação gratuita

Arquivos preparados para **Render Free + Supabase Free**: `render.yaml`, `database.sql`, `scripts/migracao_cadastro.sql`, `.node-version` e `.env.example`. **Execute a migração SQL e configure o técnico inicial no Render antes do commit.**

**Não basta enviar este ZIP para o Render:** publique os arquivos do projeto em um repositório GitHub e conecte-o no Render. Instruções passo a passo em [docs/05_manual_de_instalacao.md](docs/05_manual_de_instalacao.md).

A Render hiberna a instância gratuita após 15 minutos sem acesso; ela pode levar cerca de um minuto para iniciar novamente. O Supabase gratuito pode pausar projetos por baixa atividade ao longo de 7 dias. **Teste e acorde o sistema antes da apresentação**, mantendo uma cópia local demonstrável como contingência.

## Arquitetura

```text
Browser React / PWA (src/apresentacao)
         | HTTP /api, cookie de sessão
Express + serviços (src/servicos + src/aplicacao)
         | RepositorioChamado (interface em src/dominio)
Repositorio em memória / Supabase (src/persistencia)
         | REST segura com chave no servidor
PostgreSQL: usuarios, chamados, mensagens e coluna versao
```

`dist/`, `node_modules/` e `.env` não devem ser enviados ao GitHub nem incluídos no ZIP final. O `npm ci` instala dependências, e `npm run build` as compila a partir do código-fonte.

## Organização da documentação

| Arquivo | Conteúdo |
| --- | --- |
| `docs/01_requisitos_e_rastreabilidade.md` | RF, RNF, CA-01 a CA-07 e matriz de vinculação |
| `docs/02_arquitetura_do_sistema.md` | camadas, domínio, persistência, concorrência e segurança |
| `docs/Documento_de_Arquitetura_HelpFlow_v2_1.docx` | versão atual da arquitetura com cadastro e aprovação, em Word |
| `docs/Documento_de_Arquitetura_HelpFlow_v2.docx` | documento anterior, preservado para histórico |
| `docs/03_api_e_sincronizacao.md` | rotas HTTP, mensagens, falhas e protocolo de sincronização |
| `docs/04_plano_de_testes.md` | casos executados, resultados e medições pendentes |
| `docs/05_manual_de_instalacao.md` | uso, instalação, Render, Supabase e apresentação |
| `docs/06_acompanhamento_das_fases.md` | aderência às orientações das três fases |
| `docs/07_roteiro_da_apresentacao.md` | apresentação de 12 minutos e perguntas |
| `docs/08_validacoes_pendentes.md` | o que precisa ser verificado fora deste ambiente |
| `docs/09_registro_de_alteracoes.md` | melhorias e justificativas |
| `docs/10_avaliacao_de_desempenho.md` | CA-03: preparação de 500 chamados/50 mensagens |
| `docs/11_cadastro_e_aprovacao.md` | implantação e testes do cadastro de clientes e aprovação de técnicos |
| `referencias/` | documento de arquitetura v1.3 e materiais de orientação originais |
| `apresentacao/Apresentacao_HelpFlow_TCC.pptx` | slides editáveis para a defesa |

## Limitações da versão

Esta versão foi desenvolvida para a apresentação do TCC e não está pronta para uso comercial. Inclui cadastro público e senhas individualizadas com hash, mas ainda não dispõe de recuperação de senha por e-mail, confirmação automática de e-mail, notificações, IA, chat em tempo real, anexos ou auditoria corporativa. O aplicativo continua exigindo conexão para login e para confirmar no banco as operações em fila. O CA-03 só será comprovado com medição no ambiente online com a carga exigida; o CA-06 só será comprovado quando uma pessoa externa instalar seguindo o manual.

## Atualização para o cadastro de usuários

No Supabase já em uso, rode **`scripts/migracao_cadastro.sql`**. No Render, inclua as variáveis `TECNICO_INICIAL_EMAIL` e `TECNICO_INICIAL_SENHA` (senha exclusiva com pelo menos 12 caracteres), além das variáveis existentes. O técnico inicial é criado no primeiro início com essas configurações. O procedimento detalhado está em [docs/11_cadastro_e_aprovacao.md](docs/11_cadastro_e_aprovacao.md).

Se houver chamados antigos de contas demonstrativas, os registros continuam no banco, mas a associação ao cliente antigo não é transferida automaticamente para um cadastro novo. Mantenha cópia do banco antes de migrar.

## Dados e segurança

- Nunca coloque `TECNICO_INICIAL_SENHA`, `SESSION_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY` no navegador, HTML, código de interface, arquivo enviado ao GitHub ou `VITE_*`.
- API e SPA devem ficar no **mesmo domínio**, para cookie HttpOnly funcionar com SameSite Strict.
- As tabelas PostgreSQL usam RLS habilitada sem acesso público, e o backend usa chave server-side.
- Faça uma cópia dos dados de demonstração se forem necessários posteriormente; operações offline ainda não enviadas existem apenas no navegador.

Os dados de autoria e identificação do trabalho devem ser preenchidos de acordo com as orientações da instituição. O documento de arquitetura original foi mantido na pasta `referencias/`.
