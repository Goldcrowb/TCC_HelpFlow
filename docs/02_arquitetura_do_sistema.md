# 02 — Arquitetura do HelpFlow

## 1. Organização em camadas

```text
┌──────────────────────────────────────────────────┐
│ Apresentação: React, CSS, Vite, PWA              │
│ main.tsx, api.ts, offline.ts                     │
└────────────────────────┬─────────────────────────┘
                         │ HTTPS /api, cookie HttpOnly
┌────────────────────────▼─────────────────────────┐
│ Entrada HTTP: Express (src/servicos/server.ts)   │
│ Autentica sessão, valida requisições             │
└────────────────────────┬─────────────────────────┘
                         │ serviços de aplicação
┌────────────────────────▼─────────────────────────┐
│ Aplicação: casos de uso                          │
│ AutenticacaoService, ChamadoService             │
└────────────────────────┬─────────────────────────┘
                         │ interfaces do domínio
┌────────────────────────▼─────────────────────────┐
│ Domínio: Chamado, Mensagem, Usuario, enums,      │
│ contratos RepositorioChamado/RepositorioUsuario │
└────────────────────────┬─────────────────────────┘
                         │ implementação injetada
┌────────────────────────▼─────────────────────────┐
│ Persistência: em memória ou Supabase PostgreSQL  │
│ chamados + mensagens + índices + coluna versao  │
└──────────────────────────────────────────────────┘
```

As regras de negócio não importam diretamente o Supabase. O contrato `RepositorioChamado` fica no domínio, enquanto as implementações são mantidas na camada de persistência. Dessa forma, os serviços também podem ser testados sem banco externo.

## 2. Entidades e dados

**Chamado:** `id`, `clienteId`, `titulo`, `descricao`, `categoria`, `dataAbertura`, `status`, `tecnicoResponsavelId`, `versao`. O construtor valida título (mínimo 5 caracteres), descrição (mínimo 10) e categoria válida. O chamado nasce em **Aberto**, com `versao = 1`, sem técnico. Ao atribuir, passa para **Em Andamento** e a versão aumenta.

**Mensagem:** `id`, `autorId`, `conteudo`, `dataEnvio`. O domínio rejeita texto vazio e horário futuro. O banco relaciona mensagens com o chamado (`chamado_id`).

**Usuário:** `id`, `nome`, `email`, `senha` e `perfil`. **Limitação:** as quatro contas do ambiente acadêmico permanecem pré-cadastradas no `Map` de memória. Em um sistema real, senhas deveriam ser armazenadas com hash por usuário, e o login integrado a um provedor de identidade.

## 3. Estruturas de dados utilizadas

- **Usuários:** `Map<string, Usuario>` para busca por e-mail em memória, estimativa de 63 usuários do documento original.
- **Fila:** `Array<Chamado>` ordenado por abertura; no Supabase a consulta filtra `status = 'Aberto'` e `tecnico_id IS NULL`, ordena `data_abertura ASC` e limita a 500. Índice `(status, data_abertura)`.
- **Histórico:** `Array<Mensagem>` cronológico; Supabase busca as 50 mensagens mais recentes em ordem descendente e inverte para exibição crescente. Índice `(chamado_id, data_envio DESC)`.
- **Atribuições:** persistência usa **controle otimista**: o cliente carrega versão `v`, modifica para `v+1`, e o SQL faz UPDATE somente `WHERE id = ? AND versao = v`. Se duas operações disputam, a segunda falha. A API devolve conflito **409**.

## 4. Autenticação e permissões

O navegador não pode escolher sua identidade enviando cabeçalhos. O Express autentica `email` e `senha`, emite token HMAC-SHA256 com identificação e expiração de 8h, e envia cookie `HttpOnly; SameSite=Strict; Secure` em produção. A API valida assinatura e prazo e recupera o usuário do repositório antes de cada operação. A API limita tentativas de login; rotas de alteração checam origem. **A senha acadêmica de teste 123456 é pública** e nunca deve ser reutilizada para dados reais.

O frontend não contém credenciais do Supabase. Apenas o servidor conhece `SUPABASE_SERVICE_ROLE_KEY`; as tabelas têm RLS habilitada e não concedem acesso a `anon` ou `authenticated`. Esta separação é essencial porque a service_role bypassa RLS e deve permanecer secreta.

## 5. Contrato HTTP e sincronização offline

A aplicação utiliza uma única origem: o Express serve `dist/web` e as rotas `/api`. Em desenvolvimento o Vite faz proxy. A interface tem um service worker que armazena apenas arquivos estáticos para permitir reabrir a interface sem internet. A API e dados privados **não são armazenados no cache do service worker**.

Chamados e mensagens enviados sem conexão são salvos em `localStorage` por usuário, mantendo ordem cronológica. Cada operação tem um UUID enviado como `operacaoId`; o domínio/persistência reconhece reenvio com o mesmo ID. Uma conexão que caiu depois da gravação pode reenviar sem criar registro duplicado. Erros de validação ficam marcados na fila até intervenção, e é possível descartar manualmente. Atribuição e status **não são enfileirados**, pois requerem concorrência consistente no servidor.

## 6. Tratamento de falhas e limitações

- **Conexão interrompida:** a interface mostra aviso e guarda apenas criação/mensagens pendentes; sincroniza ao reconectar.
- **Supabase indisponível:** chamada HTTP falha com mensagem amigável, logs de servidor preservam detalhe; cliente pode tentar novamente.
- **API lenta em hospedagem gratuita:** o cliente aguarda até 90s (acordar instância), banco tem timeout de 8s.
- **Banco ausente em produção:** aplicação recusa iniciar, salvo `DEMO_MEMORY_MODE=1` explicitamente, que não deve ser usado na apresentação.
- **Dados offline:** sujeitos à limpeza de armazenamento local; não substituem persistência do servidor.
- **Carga:** limites de 500/50 no código não comprovam por si os tempos do CA-03; exigem medição em ambiente real.

## 7. Alterações em relação à arquitetura inicial

O documento de arquitetura original foi preservado como referência. Durante a implementação foram acrescentados: hospedagem integrada da API e SPA, autenticação de sessão no servidor, proteção do banco com chave server-side, fila de sincronização local/idempotência, área de atendimentos assumidos e testes HTTP. Essas alterações devem constar na versão final do documento de arquitetura entregue à instituição.


## 8. Orientação a objetos e princípios SOLID

A implementação foi baseada em orientação a objetos. `Chamado`, `Usuario` e `Mensagem` representam os dados e as regras principais, enquanto os serviços de aplicação coordenam as operações. O acesso ao armazenamento utiliza o padrão **Repository**.

Dois princípios SOLID aparecem de forma mais evidente:

- **SRP (responsabilidade única):** as entidades concentram regras de negócio, `ChamadoService` coordena os casos de uso e os repositórios executam a leitura e a gravação. A separação não é absoluta, mas reduz o acoplamento entre essas partes.
- **DIP (inversão de dependência):** `ChamadoService` recebe a interface `RepositorioChamado` no construtor. Por isso, a implementação de persistência pode ser em memória ou no Supabase sem alterar o serviço.

A troca de implementações também favorece **OCP** e **LSP**, desde que ambas respeitem o mesmo contrato. Já o **ISP** foi aplicado de maneira parcial: há interfaces distintas para usuários e chamados, mas `RepositorioChamado` ainda reúne várias operações. Para uma evolução do projeto, essas interfaces poderiam ser revisadas conforme as necessidades reais.
