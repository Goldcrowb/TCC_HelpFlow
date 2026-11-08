# HelpFlow — TCC de Engenharia de Software

**Versão:** 2.0.0 · **Situação:** código implementado, compilado e testado localmente; publicação online depende das contas de hospedagem e banco.

O HelpFlow é uma central web de chamados de suporte técnico. A aplicação utiliza **React + TypeScript + Vite** na interface, **Node.js + Express** na API e **Supabase/PostgreSQL** como banco compartilhado. O projeto preserva a arquitetura em camadas definida no documento acadêmico original.

## O que o sistema faz

- Login de demonstração com papéis de **cliente** e **técnico**, sessão assinada em cookie HttpOnly.
- Cliente abre chamados com título, descrição, categoria e data/hora automáticas, consulta somente os próprios chamados e conversa no histórico.
- Técnico visualiza a fila geral de chamados abertos e sem responsável, assume um chamado com controle de versão, acessa **Meus atendimentos**, responde mensagens e altera o status para **Aberto**, **Em Andamento** ou **Resolvido**.
- Chamados e mensagens persistem no PostgreSQL quando o servidor recebe a configuração do Supabase.
- Funcionamento offline limitado: o aplicativo instalado/visitado pode abrir a interface em cache; criação de chamados e envio de mensagens ficam em fila local e são enviados na volta da conexão, em ordem, com IDs que evitam duplicação. **Atribuição e mudança de status exigem internet.**
- Interface responsiva, pesquisa e filtros, indicadores, tela de detalhes e mensagens datadas.
- API integrada a testes automatizados: valida autenticação, autorização, idempotência, concorrência e regras de negócio.

> **Importante:** as senhas fixas são de contas públicas acadêmicas e não servem para ambientes reais. Não registre informações pessoais/sensíveis no demo. O banco em memória serve apenas para desenvolvimento e perde os dados ao reiniciar.

## Instalação rápida — computador

1. Instale **Node.js 22** e npm.
2. Abra a pasta `TCC_HelpFlow-main` no VS Code/terminal.
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

**Sem Supabase, os chamados são temporários.** Com banco, execute `database.sql` no SQL Editor do Supabase, copie `.env.example` para `.env` e configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.

## Comandos

```bash
npm ci                  # instalar dependências conforme package-lock
npm run dev             # API (3000) e site (5173)
npm run check           # checar TypeScript do servidor e dos módulos de API/filas
npm test                # testes unitários e integração HTTP
npm run build           # gera dist/server e dist/web
npm start               # hospeda API e site juntos em http://localhost:3000
```

**Para testar a versão de produção localmente:** `npm run build` seguido de `npm start`, sem configurar `NODE_ENV=production` se estiver sem banco. Em produção real, o servidor exige Supabase configurado e `SESSION_SECRET` com 32 caracteres ou mais.

## Hospedagem gratuita — apresentação

Arquivos preparados para **Render Free + Supabase Free**: `render.yaml`, `database.sql`, `.node-version` e `.env.example`.

**Não basta enviar este ZIP para o Render:** publique os arquivos do projeto em um repositório GitHub e conecte-o no Render. Instruções passo a passo em [docs/05_manual_instalacao_uso_publicacao.md](docs/05_manual_instalacao_uso_publicacao.md).

A Render hiberna a instância gratuita após 15 minutos sem acesso; ela pode levar cerca de um minuto para iniciar novamente. O Supabase gratuito pode pausar projetos por baixa atividade ao longo de 7 dias. **Teste e acorde o sistema antes da apresentação**, mantendo uma cópia local demonstrável como contingência.

## Arquitetura

```text
Browser React / PWA (src/apresentacao)
         | HTTP /api, cookie de sessão
Express + serviços (src/servicos + src/aplicacao)
         | RepositorioChamado (interface em src/dominio)
Repositorio em memória / Supabase (src/persistencia)
         | REST segura com chave no servidor
PostgreSQL: chamados, mensagens e coluna versao
```

`dist/`, `node_modules/` e `.env` não devem ser enviados ao GitHub nem incluídos no ZIP final. O `npm ci` instala dependências, e `npm run build` as compila a partir do código-fonte.

## Documentação e apresentação

| Arquivo | Conteúdo |
| --- | --- |
| `docs/01_requisitos_rastreabilidade.md` | RF, RNF, CA-01 a CA-07 e matriz de vinculação |
| `docs/02_arquitetura_decisoes.md` | camadas, domínio, persistência, concorrência e segurança |
| `docs/03_contrato_integracao.md` | rotas HTTP, mensagens, falhas e protocolo de sincronização |
| `docs/04_plano_resultados_testes.md` | casos executados, resultados e medições pendentes |
| `docs/05_manual_instalacao_uso_publicacao.md` | uso, instalação, Render, Supabase e apresentação |
| `docs/06_fases_4_5_6.md` | aderência às orientações das três fases |
| `docs/07_roteiro_defesa.md` | apresentação de 12 minutos e perguntas |
| `docs/08_pendencias_validacao_externa.md` | o que precisa ser verificado fora deste ambiente |
| `docs/09_historico_alteracoes.md` | melhorias e justificativas |
| `docs/10_teste_desempenho.md` | CA-03: preparação de 500 chamados/50 mensagens |
| `referencias/` | documento de arquitetura e slides de orientação fornecidos |
| `apresentacao/HelpFlow_Defesa_12_Minutos.pptx` | slides editáveis para a defesa |

## Limitações assumidas

Esta é uma implementação para **apresentação acadêmica**, não um help desk comercial. Não inclui cadastro público, autenticação com senhas individualizadas e recuperação de conta, notificações, IA, chat em tempo real, anexos ou auditoria corporativa. O aplicativo continua exigindo conexão para login e para confirmar no banco as operações em fila. O CA-03 só será comprovado com medição no ambiente online com a carga exigida; o CA-06 só será comprovado quando uma pessoa externa instalar seguindo o manual.

## Dados e segurança

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no navegador, HTML, código de interface, arquivo enviado ao GitHub ou `VITE_*`.
- API e SPA devem ficar no **mesmo domínio**, para cookie HttpOnly funcionar com SameSite Strict.
- As tabelas PostgreSQL usam RLS habilitada sem acesso público, e o backend usa chave server-side.
- Faça uma cópia dos dados de demonstração se forem necessários posteriormente; operações offline ainda não enviadas existem apenas no navegador.

**Autor do projeto:** manter os dados de identificação e a autoria do documento acadêmico original. A versão 2.0 acrescenta a implementação e os materiais de defesa e validação.
