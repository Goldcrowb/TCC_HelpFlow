# 03 — API e sincronização dos dados

A interface utiliza a API Express, acessada pelo prefixo `/api` no mesmo endereço do site. As solicitações enviam e recebem JSON. A identificação do usuário é confirmada pelo cookie de sessão; o navegador não define livremente o perfil de acesso. Esta descrição corresponde à API da versão 2.0.

## 1. Rotas disponíveis

| Método | Rota | Quem acessa | Corpo / resposta principal |
| --- | --- | --- | --- |
| GET | `/api/saude` | Todos | `{ "status": "ok", "projeto": "HelpFlow", "versao": "2.0.0" }` |
| POST | `/api/auth/login` | Público | `{ "email", "senha" }` → `{ "usuario": {...} }` + cookie |
| GET | `/api/auth/session` | Logado | `{ "usuario": { "id", "nome", "email", "perfil" } }` |
| POST | `/api/auth/logout` | Todos | `{ "ok": true }` e limpeza do cookie |
| POST | `/api/chamados` | Cliente | `{ "titulo", "descricao", "categoria", "operacaoId" }` → chamado, 201 |
| GET | `/api/chamados/meus` | Cliente | lista de chamados do próprio usuário |
| GET | `/api/chamados/fila` | Técnico | lista cronológica dos abertos sem técnico, até 500 |
| GET | `/api/chamados/atendimentos` | Técnico | lista de chamados atribuídos ao técnico, até 500 |
| GET | `/api/chamados/:id` | Cliente dono ou técnico | `{ "chamado": {...}, "mensagens": [...] }` |
| POST | `/api/chamados/:id/atribuir` | Técnico | `{}` → chamado atribuído, ou 409 por concorrência |
| PATCH | `/api/chamados/:id/status` | Técnico responsável | `{ "status": "Resolvido" }` → chamado atualizado |
| POST | `/api/chamados/:id/mensagens` | Cliente dono ou técnico responsável | `{ "conteudo", "operacaoId" }` → mensagem, 201 |

## 2. Exemplo de chamado

```json
{
  "id": "ecf092ff-67c5-4874-8e0f-8538c24ad077",
  "clienteId": "CLI-01",
  "titulo": "Notebook não liga",
  "descricao": "O notebook não apresenta sinal de energia.",
  "categoria": "Hardware",
  "dataAbertura": "2026-11-08T12:00:00.000Z",
  "status": "Aberto",
  "tecnicoResponsavelId": null,
  "versao": 1
}
```

O exemplo mostra a estrutura de uma resposta da API e não corresponde a um chamado real. A mensagem responde com `id`, `autorId`, `conteudo`, `dataEnvio` (data ISO UTC, exibida em `pt-BR` no navegador). Status válidos: `Aberto`, `Em Andamento`, `Resolvido`. Categorias válidas: `Hardware`, `Software`, `Rede`, `Acesso`, `Outros`.

## 3. Respostas de erro

| HTTP | Situação | Tratamento |
| --- | --- | --- |
| 400 | Campos, categoria, status ou identificador de operação inválidos | Exibir motivo; não criar registro |
| 401 | Sem sessão, token alterado ou expirado | Solicitar novo login |
| 403 | Perfil sem permissão, técnico não responsável, cliente de outro chamado | Negar; manter dados |
| 404 | Chamado/rota não encontrado | Aviso ao usuário |
| 409 | Chamado já assumido ou versão alterada | Recarregar a fila, informar conflito |
| 429 | Limite de tentativas de login | Aguardar antes de tentar novamente |
| 500 | Erro interno de infraestrutura | Mensagem genérica na UI, detalhe no log do servidor |
| Rede | Sem conexão ou tempo de espera excedido | Criar/mensagens entram na fila local; outras operações mostram erro |

### Exemplo de operação idempotente

```http
POST /api/chamados
Content-Type: application/json
Cookie: helpflow_sessao=<token-assinado>

{"titulo":"Impressora não imprime","descricao":"A impressora não responde aos trabalhos enviados.","categoria":"Hardware","operacaoId":"35e30f31-5370-4f95-8b1c-9261081e768a"}
```

O cliente repete a **mesma** `operacaoId` se não recebeu a confirmação. A API retorna o mesmo chamado caso os dados e o proprietário coincidam. Para mensagens vale a mesma regra do identificador; o banco tem `id` como chave primária.

## 4. Fluxo das requisições e modo offline

```text
USUÁRIO → React valida formulário → api.ts → Express
→ Serviço de aplicação → Entidade/validação → Repositório → PostgreSQL
                                                   ↑
                                              commit/erro
                                                   │
                    React ← JSON/resposta ← Express ┘

OFFLINE: React → offline.ts (localStorage, UUID, ordem)
                ↓ conexão restabelecida
          sincronizarPendencias (sequencial)
                ↓ mesmas operações / mesmos IDs
          Express → PostgreSQL → remoção da fila local
```

O service worker atende apenas requisições GET de arquivos estáticos. As rotas `/api` não são cacheadas, protegendo a integridade da sessão e do banco.

## 5. Situações previstas para teste

1. Desconectar rede após abrir a tela; criar um chamado. Verificar fila local e reconectar. Conferir criação única no banco.
2. Registrar três operações sequenciais em modo offline; reconectar e observar a ordem de sincronização.
3. Enviar JSON/categoria inválida e confirmar erro 400, sem gravação.
4. Duas sessões técnicas tentando atribuir o mesmo chamado: a primeira recebe sucesso, a outra erro 409.
5. Reiniciar a API em modo memória: os registros somem; em Supabase, permanecem.
6. Recarregar a interface offline após visitá-la com internet: service worker entrega o app shell, sujeito ao cache prévio.
7. Suspender/pausar o banco por ambiente de teste e verificar a mensagem de erro sem travar a interface.

O funcionamento offline depende do armazenamento anterior dos arquivos. Ele não pode ser garantido após limpar o cache, em navegação privada ou no primeiro acesso sem internet. É necessário confirmar esse comportamento em um navegador durante os testes.


## Rotas de cadastro e aprovação (versão 2.1)

| Método | Rota | Permissão | Função |
| --- | --- | --- | --- |
| POST | `/api/auth/cadastro` | Visitante | Cadastra cliente ativo ou solicita perfil técnico pendente. Recebe nome, email, senha e perfil. |
| GET | `/api/tecnicos/solicitacoes` | Técnico ativo | Lista até 100 pedidos técnicos pendentes (sem retornar hash da senha). |
| PATCH | `/api/tecnicos/solicitacoes/:id` | Técnico ativo | Decide com `{ "decisao": "aprovar" }` ou `{ "decisao": "recusar", "motivo": "..." }`. |

Cadastro duplicado retorna 409; entradas inválidas retornam 400; tentativas não autorizadas retornam 401/403. Contas técnicas pendentes ou recusadas não recebem cookie de sessão. Uma solicitação já analisada retorna 409. Senha não é retornada em respostas HTTP.
