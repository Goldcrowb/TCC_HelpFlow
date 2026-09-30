# HelpFlow — TCC

Sistema centralizado de atendimento de suporte técnico desenvolvido para a disciplina de Engenharia de Software.

## Arquitetura

O projeto foi organizado em quatro camadas, conforme o Documento de Arquitetura:

```text
Apresentação (React/Vite)
        ↓ HTTP
Serviços (Node.js/Express)
        ↓ contratos
Domínio (TypeScript)
        ↓ interfaces
Persistência (Memória / Supabase PostgreSQL)
```

### Pastas principais

```text
src/
├── apresentacao/   # React + Vite
├── aplicacao/      # Casos de uso e serviços
├── dominio/        # Entidades, regras e contratos
├── persistencia/   # Repositórios em memória e Supabase
└── servicos/       # API HTTP com Express
```

## Requisitos

- Node.js 20 ou superior
- npm
- Para persistência real: projeto Supabase com PostgreSQL

## Instalação

```bash
npm install
```

## Execução em desenvolvimento

O comando abaixo inicia API e front-end ao mesmo tempo:

```bash
npm run dev
```

- Front-end: http://localhost:5173
- API: http://localhost:3000
- Saúde da API: http://localhost:3000/api/saude

Também é possível executar separadamente:

```bash
npm run dev:api
npm run dev:web
```

Sem variáveis do Supabase, a API usa `RepositorioChamadoMemoria`, permitindo executar e testar o projeto sem banco externo.

## Persistência Supabase

1. Crie um projeto no Supabase.
2. Execute o conteúdo de `database.sql` no SQL Editor.
3. Copie `.env.example` para `.env`.
4. Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
5. Execute `npm run dev`.

Quando as duas variáveis estiverem preenchidas, a API passa a usar `RepositorioChamadoSupabase`.

O índice crítico para a fila está criado em `chamados.status`, conforme definido na arquitetura.

## Usuários de demonstração

No modo sem Supabase existem usuários pré-cadastrados:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | cliente@helpflow.local | 123456 |
| Técnico | tecnico@helpflow.local | 123456 |

Também existem usuários `cliente2@helpflow.local` e `tecnico2@helpflow.local` para demonstração de cenários com dois usuários.

> A autenticação nesta etapa é uma autenticação acadêmica simplificada para demonstração. Para produção, deve-se substituir por autenticação segura e sessão/token.

## Testes

```bash
npm test
```

Para acompanhar os testes durante o desenvolvimento:

```bash
npm run test:watch
```

## Verificação de tipos

```bash
npm run check
```

## Build

```bash
npm run build
```

## Critérios cobertos nesta base

- CA-01: chamado novo inicia como `Aberto` e aparece na fila.
- CA-02: cliente não pode alterar o status.
- CA-03: estruturas e consultas estão preparadas para fila e histórico com limite de 500/50 registros.
- CA-04: mensagens preservam data e hora do envio.
- CA-05: atribuição utiliza controle de versão para bloquear conflito entre técnicos.
- CA-06: instruções de instalação e execução estão registradas neste README.
- CA-07: a matriz de rastreabilidade permanece no Documento de Arquitetura.

## Observação sobre CA-03

A validação final de tempo (até 2 segundos para 500 chamados e até 3 segundos para 50 mensagens) deve ser demonstrada em ambiente carregado com dados. O código contém limite de 500 chamados na fila e 50 mensagens por histórico para manter o cenário alinhado ao critério de aceitação.
