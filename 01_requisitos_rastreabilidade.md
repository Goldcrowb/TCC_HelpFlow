# 01 — Especificação de requisitos e matriz de rastreabilidade

**Projeto:** HelpFlow — TCC · **Versão:** 2.0.0 · **Fonte primária:** Documento de Arquitetura HelpFlow, versão 1.3, fornecido pelo estudante. Os requisitos abaixo preservam os critérios do termo e mostram a implementação.

## 1. Objetivo e atores

Oferecer um sistema web centralizado de suporte técnico com dois perfis: **cliente** (abre e acompanha os próprios chamados) e **técnico** (acompanha fila, assume atendimento, responde e resolve).

## 2. Escopo funcional

| ID | Requisito funcional | Prioridade | Realização |
| --- | --- | --- | --- |
| RF-001 | Autenticar e-mail e senha e apresentar interface por perfil | Alta | `AutenticacaoService.ts`, API `/api/auth/*`, `main.tsx` |
| RF-002 | Abrir chamado com título, descrição, categoria, data/hora e status inicial Aberto | Alta | `Chamado.ts`, `ChamadoService.criarChamado`, POST `/api/chamados` |
| RF-003 | Cliente listar e acompanhar apenas os próprios chamados | Alta | `listarChamadosDoCliente`, GET `/api/chamados/meus` |
| RF-004 | Técnico acessar fila cronológica de chamados abertos | Alta | `listarFilaTecnico`, GET `/api/chamados/fila`; índice no PostgreSQL |
| RF-005 | Técnico assumir chamado; se houver disputa, apenas um consegue | Alta | `Chamado.atribuirTecnico`, coluna `versao`, atualização condicional no Supabase |
| RF-006 | Histórico assíncrono de mensagens, autor e data/hora | Alta | `Mensagem.ts`, POST `/api/chamados/:id/mensagens`, tela de detalhes |
| RF-007 | Alterar status para Aberto/Em Andamento/Resolvido, somente por técnico | Alta | `ChamadoService.alterarStatus` e PATCH `/api/chamados/:id/status` |
| RF-008 | Técnico continuar atendimento após assumir um chamado | Complemento | GET `/api/chamados/atendimentos`, aba Meus atendimentos |
| RF-009 | Guardar chamados/mensagens pendentes offline e sincronizar em ordem sem duplicar | Complemento da Fase 4 | `offline.ts`, IDs de operação; sincronização ao reconectar |

## 3. Requisitos não funcionais

| ID | Exigência | Como verificar / restrição |
| --- | --- | --- |
| RNF-001 | Fila de 500 chamados em até 2 segundos | CA-03: medição no sistema hospedado, banco carregado; **ainda não realizada** |
| RNF-002 | Histórico de 50 mensagens em até 3 segundos | CA-03: medição no sistema hospedado, banco carregado; **ainda não realizada** |
| RNF-003 | Responsividade e navegabilidade | Interface React com layouts para desktop e celular; revisão visual manual externa pendente |
| RNF-004 | Integridade em atribuições concorrentes | Atualização condicional por versão, erro HTTP 409 |
| RNF-005 | Serviço acessível por outras pessoas via internet | Exige deploy e verificação na Render; o arquivo `render.yaml` já está pronto |
| RNF-006 | Instalação reproduzível | Node 22, `npm ci`, `npm run build`, `npm start`, documentação e CA-06 |
| RNF-007 | Segurança de acesso por perfil | Cookie HttpOnly assinado, controles na API e banco sem permissões públicas |

## 4. Critérios de aceitação do termo original

| CA | Requisito do termo | Evidência disponível | Situação |
| --- | --- | --- | --- |
| CA-01 | Novo chamado aparece na fila com status **Aberto** | Teste da API em `server.test.ts` | Automatizado em memória; revalidar na nuvem |
| CA-02 | Cliente não altera status | Teste com PATCH e cabeçalho de perfil forjado | Automatizado em memória; revalidar na nuvem |
| CA-03 | Fila 500 em até 2s; histórico 50 em até 3s | `scripts/carga_teste.sql` e `scripts/medir_desempenho.mjs` | **Pendente medição hospedada** |
| CA-04 | Cada mensagem mostra o instante do envio | Teste de timestamp da API e interface com data/hora | Automatizado para API; validação visual pendente |
| CA-05 | Dois técnicos disputam um chamado e só um assume | `server.test.ts`: duas requisições paralelas (200 e 409) | Automatizado em memória; revalidar em Supabase |
| CA-06 | Pessoa externa instala apenas com manual | Manual em `docs/05...` | **Pendente execução por avaliador externo** |
| CA-07 | Requisitos de prioridade alta vinculados ao escopo | Matriz abaixo | Documentado |

## 5. Matriz escopo → camadas → testes

| Item do escopo original | Requisito | Camada principal | Verificação |
| --- | --- | --- | --- |
| 1. Login com perfis | RF-001 | Aplicação/API/Apresentação | Integração login + sessão; rejeição de acesso anônimo |
| 2. Criar chamado | RF-002 | Domínio/Aplicação | CA-01 e entradas inválidas |
| 3. Consultar chamados próprios | RF-003 | Persistência/Aplicação | Cliente1 não lê dados do Cliente2 |
| 4. Atribuir chamado com concorrência | RF-004, RF-005 | Domínio/Persistência | CA-05 e teste de versão |
| 5. Histórico de mensagens | RF-006 | Domínio/Persistência | CA-04, teste de gravação e reconsulta |
| 6. Alterar status apenas técnico | RF-007 | Domínio/Aplicação/API | CA-02 e resolução por técnico responsável |

## 6. Exclusões de escopo

Conforme o termo acadêmico: triagem com inteligência artificial, chat em tempo real e notificações por e-mail/WhatsApp não estão incluídos. Também não se afirma que a autenticação demonstrativa atual seja adequada a uma empresa real.
