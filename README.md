# HelpFlow — Central de suporte técnico

**Versão 2.2.0 | Engenharia de Software — UNIASSELVI | Novembro de 2026**

O HelpFlow organiza solicitações de suporte em um único sistema. Clientes registram problemas; técnicos acompanham a fila, assumem chamados, registram mensagens, transferem atendimentos e alteram o status. O primeiro técnico pode gerenciar contas. O projeto foi desenvolvido para avaliação acadêmica, não para uso comercial com dados reais.

## Funcionalidades

- Cadastro de cliente com acesso imediato e cadastro de técnico sujeito a aprovação ou recusa por técnico ativo.
- Login por e-mail e senha, sessão assinada e painéis separados por perfil.
- Chamados com título, descrição, categoria, horário de abertura e status (Aberto, Em Andamento, Resolvido).
- Cliente consulta os próprios chamados; técnicos consultam fila e seus atendimentos. É possível assumir pela fila ou pelos detalhes.
- Transferência direta para outro técnico aprovado, sem apagar o histórico. Apenas o responsável pode transferir; chamado resolvido não pode ser transferido.
- Filtros de situação e pesquisa. Em Meus atendimentos, o filtro inicial mostra os chamados em aberto (inclui Em Andamento); há também Resolvidos e Todos.
- Histórico de mensagens, com autor identificado pelo papel na conversa e data/hora registrada pelo servidor.
- Primeiro técnico (`TEC-01`) lista e exclui outros clientes e técnicos. Sua própria conta é protegida; técnicos com atendimentos em aberto precisam transferi-los ou resolvê-los. Chamados e mensagens permanecem no banco.
- Fila offline limitada a novos chamados e mensagens, usando armazenamento do navegador. Atribuição, transferência, status, cadastro e gestão de usuários exigem conexão. A confirmação no banco ocorre após sincronização; o horário de envio é o do servidor.

## Executar localmente

1. Instale Node.js 22 com npm e extraia o projeto em uma pasta gravável.
2. Abra a pasta que contém `package.json` no VS Code. Sem `.env` e sem variáveis de banco, o projeto usa memória para demonstração.
3. Rode no terminal:

```bash
npm ci --include=dev
npm run dev
```

Acesse http://localhost:5173. API: http://localhost:3000/api/saude. No Windows, `iniciar-local.bat` executa a instalação e inicia o projeto. Em PowerShell com scripts bloqueados, use `npm.cmd` em vez de `npm`.

| Conta local | E-mail | Senha de demonstração |
| --- | --- | --- |
| Cliente 1 | cliente@helpflow.local | 123456 |
| Cliente 2 | cliente2@helpflow.local | 123456 |
| Técnico inicial | tecnico@helpflow.local | 123456 |
| Técnico 2 | tecnico2@helpflow.local | 123456 |

Essas contas existem somente em modo memória, sem banco. O servidor perde os dados de memória ao reiniciar. Não use essas credenciais na hospedagem; crie contas fictícias próprias para avaliar o sistema online.

## Verificar o projeto

```bash
npm run check       # servidor e módulos API/fila do navegador
npm test            # testes de unidade e integração HTTP em memória
npm run build       # compila servidor + interface
npm run test:build  # verifica página inicial e rota de saúde após build
npm start           # inicia a versão compilada: http://localhost:3000
npm run medir:algoritmos # comparação da ordenação em memória
```

Feche o `npm run dev` antes de rodar `npm start` (mesma porta 3000). `npm run check` não verifica estaticamente todos os componentes JSX; eles são compilados pelo Vite. Os testes usam memória mesmo que variáveis Supabase estejam definidas. Resultado local de 18/11/2026: 40/40 testes, 7 arquivos, 2,14 s; checagens e build aprovados. Registros em `docs/evidencias/`.

## Evidência de desempenho CA-03 (22/11/2026)

Foi utilizada uma instância local do HelpFlow conectada a um projeto Supabase **separado para testes**, com 500 chamados e 50 mensagens. O script HTTP verificou os volumes e registrou 934,23 ms para a fila e 563,62 ms para o histórico. As gravações do Edge indicaram aproximadamente 790 ms até o evento de pintura da fila e 1.090 ms do clique até a pintura do histórico. Esses números são de execuções distintas, não devem ser somados e **não comprovam o desempenho no Render**. A primeira verificação local ficou abaixo das metas; a repetição e validação online continuam pendentes. Consulte `docs/evidencias/ca03_resultados.md`.

## Banco Supabase e Render

O sistema usa PostgreSQL através do Supabase; a chave privilegiada fica apenas no servidor Express. Para instalar em banco novo, execute `database.sql` no SQL Editor. Para o banco HelpFlow existente, faça backup, execute `database.sql` (estrutura aditiva) e depois `scripts/verificar_banco.sql`. O arquivo completo inclui as migrações de cadastro e gerenciamento; as versões separadas permanecem em `scripts/` para referência. Não execute scripts de carga/limpeza em produção.

No Render, mantenha o Web Service existente conectado à branch `main` do GitHub. Configuração indicada:

| Configuração | Valor |
| --- | --- |
| Node | 22 (`.node-version`) |
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm start` |
| Health check | `/api/saude` |
| Plano | Free (sujeito aos limites do serviço) |

Variáveis em Environment (não enviar segredos ao GitHub):

| Nome | Valor |
| --- | --- |
| `NODE_ENV` | production |
| `SUPABASE_URL` | URL base do projeto, sem `/rest/v1` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave privilegiada do mesmo projeto, mantida no backend |
| `SESSION_SECRET` | segredo aleatório de pelo menos 32 caracteres |
| `TECNICO_INICIAL_EMAIL` | e-mail da conta técnica inicial |
| `TECNICO_INICIAL_SENHA` | senha exclusiva de pelo menos 12 caracteres |
| `TECNICO_INICIAL_NOME` | nome de exibição (opcional) |

O técnico inicial recebe o ID reservado `TEC-01`. Se a conta já existe, o servidor não redefine a senha. Alterar a variável de senha não é recuperação de senha. Não modifique o ID ou o e-mail do administrador sem planejamento. Para teste local com Supabase, copie `.env.example` para `.env`, preencha os valores e use `npm run dev`; esse arquivo é ignorado pelo Git. Em produção, use Environment do Render.

Após o commit e push, acompanhe o deploy, confirme `/api/saude` e teste com contas fictícias de cliente e técnico. Se estiver suspenso, retome o serviço. Serviços gratuitos podem hibernar ou pausar; teste no dia anterior e novamente antes da defesa. O link público real está no painel do Render.

Se excluir usuário retornar erro, rode `scripts/verificar_banco.sql` e confira a função `excluir_usuario_helpflow`, a permissão de execução do `service_role`, a conta inicial e o trigger. Se continuar, consulte os logs do Render. A exclusão em Supabase online ainda precisa ser confirmada após a correção; não delete tabelas nem desative RLS.

## Estrutura do repositório

```text
src/
  apresentacao/   telas React, chamadas à API e fila offline
  servicos/       rotas HTTP e composição do servidor
  aplicacao/      casos de uso e controle de permissões
  dominio/        entidades, regras e interfaces dos repositórios
  persistencia/   repositórios em memória e Supabase
public/          arquivos estáticos e service worker
scripts/         migrações e verificações reproduzíveis
docs/            dossiê D1–D9, manual, API, evidências e diagramas
apresentacao/    slides e roteiro da defesa
referencias/     termo de referência original e materiais do professor
```

A apresentação e os serviços chamam o domínio através dos casos de uso. A persistência implementa as interfaces do domínio. O domínio não depende de React, Express ou Supabase. O padrão Repository permite testar o sistema sem banco. Os princípios SOLID aparecem principalmente na responsabilidade única e inversão de dependência; não se afirma adesão integral a todos eles.

## Documentação e entrega

- [Dossiê único D1–D9 (PDF)](docs/HelpFlow_EntregaFinal_v2.2.pdf) — índice e páginas numeradas.
- [Versão editável (Word)](docs/HelpFlow_EntregaFinal_v2.2.docx).
- [Manual rápido](docs/manual.md), [API](docs/api.md), [pendências e evidências](docs/pendencias.md).
- [Apresentação da defesa](apresentacao/HelpFlow_Defesa.pptx) e [roteiro](apresentacao/roteiro.md).
- Código original: https://github.com/Goldcrowb/TCC_HelpFlow. Confirmar acesso do professor e atualizar este repositório com a versão final.

O termo inicial é preservado em `referencias/`. Dados de entrevista, teste por terceiro e validações na nuvem não foram inventados. A comparação local de algoritmos, isoladamente, não prova o CA-03. Em 22/11/2026 foram obtidas medições adicionais em Supabase de teste: 500 chamados (HTTP + JSON 934,23 ms; pintura estimada ~790 ms) e 50 mensagens (HTTP + JSON 563,62 ms; pintura estimada ~1.090 ms), ambas abaixo dos limites nas execuções locais. Os rastros e ressalvas estão em [evidência CA-03](docs/evidencias/ca03_resultados.md). Ainda faltam repetições e validação no ambiente online. O CA-06 exige instalação por outra pessoa. O alerta anterior de oito vulnerabilidades do npm ainda exige diagnóstico atualizado e correção quando aplicável; `npm audit` não consultou o registro nesta revisão por falha de rede. Evite `npm audit fix --force` sem avaliar mudanças de versão.

Não envie `node_modules/`, `dist/`, `.env`, dados reais, senhas ou chaves. O pacote entregue contém código-fonte instalável por npm, não um executável autônomo. Não foram alteradas contas nem dados do Supabase nesta revisão.
