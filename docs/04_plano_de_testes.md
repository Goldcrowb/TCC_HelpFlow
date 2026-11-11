# 04 — Plano de testes e resultados

**Data da última execução automatizada:** 08/11/2026. **Ambiente:** Node.js 22, Vitest 3, API Express em memória, sem internet. **Comandos:** `npm run check`, `npm test`, `npm run build`.

## 1. Tipos de teste

- **Unidade:** criação e validação de entidades, fluxo de serviço, repositório em memória, concorrência por versão.
- **Integração HTTP:** login, sessão, permissões, inclusão, listagem, histórico, conflito de atribuição, reenvio idempotente, dados inválidos e isolamento entre clientes.
- **Fila offline:** fila por usuário, ordem cronológica, indisponibilidade de rede e reenvio sem duplicação de IDs.
- **E2E manual / hospedagem:** abrir página, testar dois perfis no navegador, 500/50 registros no Supabase, offline/online com DevTools, instalação por pessoa externa, apresentação.

## 2. Resultados dos testes automatizados

| Verificação | Resultado observado | Evidência |
| --- | --- | --- |
| TypeScript backend + módulos HTTP/offline | **Passou** | `npm run check` |
| Compilação do backend + SPA/PWA | **Passou** | `npm run build` |
| Testes unitários originais | **15/15 passaram**, após ajuste da asserção de atribuição | `src/dominio/*.test.ts`, `src/aplicacao/ChamadoService.test.ts`, `src/persistencia/*.test.ts` |
| Integração da API (9 casos) | **9/9 passaram** | `src/servicos/server.test.ts` |
| Fila offline (2 casos) | **2/2 passaram** | `src/apresentacao/offline.test.ts` |
| **Total automatizado** | **26/26 passaram; 6 arquivos de teste** | Execução local de 08/11/2026 |
| Verificação do servidor compilado | **Passou**: `/api/saude` e `/` com HTTP 200 | `npm run test:build`, após `npm run build` |

Os resultados acima são de testes locais, principalmente com o repositório em memória. Eles não comprovam, por si só, o funcionamento do banco remoto, o desempenho no Render ou a sincronização em navegadores diferentes. Essas verificações estão listadas abaixo.

## 3. Verificação dos critérios de aceitação

| Caso | Preparação | Passos | Esperado | Status |
| --- | --- | --- | --- | --- |
| T-01 / CA-01 | Login cliente/técnico | Cliente abre chamado; técnico acessa fila | Status Aberto e registro visível | **Automatizado** |
| T-02 / CA-02 | Login cliente | Enviar PATCH status indevidamente | HTTP 403, status preservado | **Automatizado** |
| T-03 / CA-03a | Supabase com 500 abertos | Carregar fila real; medir tempo na rede/browser | ≤ 2000 ms | **Pendente** |
| T-04 / CA-03b | Chamado com 50 mensagens | Abrir detalhes; medir tempo de histórico | ≤ 3000 ms | **Pendente** |
| T-05 / CA-04 | Cliente autenticado | Criar mensagem; ler data/hora | Registro ISO próximo ao envio, exibição local correta | **API automatizada; visual pendente** |
| T-06 / CA-05 | Dois técnicos autenticados | Atribuir o mesmo ID concorrentemente | Um 200 e outro 409 | **Automatizado em memória; repetir no banco** |
| T-07 / CA-06 | Computador novo, Node 22, manual | Pessoa externa instala e executa sem orientação do autor | Instalação bem-sucedida | **Pendente** |
| T-08 / CA-07 | Requisitos e termo de abertura | Conferir matriz RF/escopo/arquitetura/teste | Todos os RF prioritários com vinculação | **Documentado** |
| T-09 / Offline | Interface já visitada e conectada | Desconectar; criar 3 operações; reconectar | Fila FIFO, sem duplicatas | **Lógica automatizada; navegador pendente** |
| T-10 / Falha | Credenciais incorretas e JSON inválido | Enviar login errado, campos inválidos, identidade forjada | 401/400, sem acesso indevido | **Automatizado** |
| T-11 / Persistência | Supabase configurado | Criar chamado, reiniciar serviço, consultar de outra sessão | Registro mantido | **Pendente** |
| T-12 / PWA | Acesso inicial online | Instalar app, desligar rede, atualizar | Interface em cache; fila local | **Pendente** |

## 4. Procedimento da medição CA-03

1. Publicar banco e aplicação, confirmar que as credenciais no Render estão corretas.
2. Rodar `scripts/carga_teste.sql` **somente no banco de teste** (cria até 500 chamados e 50 mensagens).
3. Executar `node scripts/medir_desempenho.mjs https://SEU-ENDERECO.onrender.com` para medir requisição + interpretação JSON.
4. Também registrar o tempo de carregamento **na interface** usando Chrome DevTools (Performance/Network), pois o critério usa a expressão “carregada e exibida”.
5. Executar pelo menos 3 vezes com a instância Render já acordada; registrar tempos, máximo, dispositivo, conexão e data. **Não substitua esses campos por valores inventados.**

| Medição | Rodada 1 | Rodada 2 | Rodada 3 | Máximo | Critério |
| --- | --- | --- | --- | --- | --- |
| Fila 500 | — | — | — | — | 2000 ms |
| Histórico 50 | — | — | — | — | 3000 ms |

## 5. Problemas encontrados e correções

| Código | Defeito constatado | Tratamento | Situação |
| --- | --- | --- | --- |
| D-01 | Teste original esperava mudança do objeto antigo, mesmo com repositório clonando | Asserção passou a ler o objeto retornado e repositório persistido | Corrigido |
| D-02 | Build do backend e do Vite compartilhavam a pasta `dist`; Vite apagava backend | Saídas separadas `dist/server` e `dist/web` | Corrigido |
| D-03 | Usuário/perfil eram informados pelo navegador via headers | Sessão assinada no servidor, cookie HttpOnly e checagem API | Corrigido |
| D-04 | Técnico perdia o chamado da visualização ao assumir | Criada aba Meus atendimentos e consulta de chamados atribuídos | Corrigido |
| D-05 | Reenvio de chamado/mensagem após queda de conexão podia duplicar | UUID de operação e idempotência na persistência | Corrigido |
| D-06 | Falta de segregação de credenciais do banco | Somente `SUPABASE_SERVICE_ROLE_KEY` no backend e RLS sem políticas públicas | Configurado; validar no Supabase |

**Verificação adicional do build:** após compilar, execute `npm run test:build`. O comando inicia temporariamente a aplicação usando memória, confere a página inicial e a rota de saúde e encerra o processo. Esse teste não acessa o Supabase.

## 6. Registro dos testes em ambiente online

Preencher depois da implantação: URL pública, commit, data/hora, nome do avaliador externo, capturas de tela sem segredos, tempos medidos, erros encontrados e correções. A publicação e os testes em uma hospedagem pública ainda não foram realizados nesta etapa.


## Novos testes — cadastro e aprovação (versão 2.1)

Foram acrescentados 6 testes automatizados, totalizando **32 testes locais aprovados**: cadastro e abertura de chamado por cliente, bloqueio de técnico pendente, aprovação por técnico autorizado, recusa, e-mail duplicado, perfil inválido, senha curta e verificação de hash `scrypt`. O teste do fluxo de aprovação também confirma que uma segunda decisão falha com HTTP 409.

**Ainda não executado:** teste ponta a ponta com Supabase real e cadastro no Render, teste externo de interface em celular e auditoria de segurança. Os testes locais usam repositório em memória e não comprovam a configuração de RLS no ambiente publicado.
