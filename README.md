# HelpFlow — Central de suporte técnico

**Versão 2.2.0 | Engenharia de Software — UNIASSELVI | Novembro de 2026**

O HelpFlow é um sistema web para registrar e acompanhar solicitações de suporte técnico. Clientes abrem chamados e trocam mensagens com a equipe. Técnicos visualizam a fila, assumem ou transferem atendimentos e atualizam o status. O primeiro técnico autorizado também pode gerenciar usuários.

Este é um projeto acadêmico. Para a demonstração, utilize contas e dados fictícios.

## 1. Funcionalidades

- Cadastro de clientes e solicitação de cadastro como técnico, com aprovação ou recusa por um técnico ativo.
- Login com e-mail e senha; telas separadas por perfil.
- Abertura de chamados por título, categoria e descrição, com os estados **Aberto**, **Em Andamento** e **Resolvido**.
- Fila geral para técnicos, acompanhamento dos próprios chamados e pesquisa por palavras-chave.
- Botão **Assumir** na lista e na janela de detalhes.
- Transferência de chamados para outros técnicos aprovados, preservando as mensagens.
- Filtros **Em aberto**, **Resolvidos** e **Todos** nos atendimentos do técnico.
- Histórico de mensagens com identificação do autor e data/hora.
- Gerenciamento de clientes e técnicos pelo primeiro técnico (`TEC-01`), com proteção da própria conta e dos atendimentos em aberto.
- Fila temporária de operações offline para novos chamados e mensagens. As demais operações exigem conexão com a internet.

## 2. Requisitos para executar

- **Node.js 22** e npm instalados ([nodejs.org](https://nodejs.org/)). O projeto possui o arquivo `.node-version` com essa versão.
- Windows 10/11, Linux ou macOS; no Windows, os exemplos abaixo utilizam PowerShell no terminal do VS Code.
- Navegador atualizado, como Edge ou Chrome.
- Acesso à internet para instalar as dependências. Para usar Supabase ou Render, também é necessária uma conta nesses serviços.

Abra sempre o terminal **na pasta em que estão `package.json`, `database.sql` e `render.yaml`**. Para conferir as versões instaladas:

```powershell
node -v
npm -v
```

Se o PowerShell bloquear `npm`, utilize `npm.cmd` nos comandos (`npm.cmd ci --include=dev`, por exemplo).

## 3. Executar localmente, sem Supabase (modo demonstração)

Este é o modo mais fácil para testar o projeto no computador. Os dados ficam **em memória** e desaparecem ao reiniciar a API.

1. Baixe ou clone o repositório e abra sua pasta no VS Code.
2. Certifique-se de que não existe um arquivo `.env` preenchido com dados do Supabase e de que não há `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` definidas no terminal.
3. Execute:

```powershell
npm ci --include=dev
npm run dev
```

4. Abra **http://localhost:5173** no navegador. A API é iniciada na porta 3000; confira **http://localhost:3000/api/saude**.

O terminal do servidor deverá informar `Persistência: memória (não persistente)`.

| Perfil de demonstração | E-mail | Senha |
| --- | --- | --- |
| Cliente | `cliente@helpflow.local` | `123456` |
| Outro cliente | `cliente2@helpflow.local` | `123456` |
| Técnico inicial | `tecnico@helpflow.local` | `123456` |
| Outro técnico | `tecnico2@helpflow.local` | `123456` |

As contas acima **não são utilizadas no Supabase nem no Render**. Não use essas senhas em contas reais.

No Windows, o arquivo `INICIAR-LOCAL.bat` também instala as dependências e executa `npm run dev`.

Para parar o projeto, pressione **Ctrl + C** no terminal. Se abrir duas instâncias por engano, feche a anterior antes de iniciar outra, pois ambas usam a porta 3000.

### Executar a versão compilada localmente

Se quiser simular a execução que será usada na hospedagem:

```powershell
npm run build
npm start
```

Abra **http://localhost:3000**. Neste caso, o Express entrega a interface compilada e a API no mesmo endereço. **Pare `npm run dev` antes de usar `npm start`.**

## 4. Executar localmente com Supabase (banco persistente)

Use este modo para manter usuários, chamados e mensagens no PostgreSQL do Supabase. Para testes de carga, utilize um **projeto Supabase separado** do banco da apresentação.

### 4.1. Preparar o banco

1. Entre no [painel do Supabase](https://supabase.com/dashboard) e crie um projeto, se ainda não tiver um.
2. No projeto escolhido, abra **SQL Editor → New query**.
3. Copie o conteúdo de `database.sql`, execute e confira se as tabelas `usuarios`, `chamados` e `mensagens` foram criadas.
4. Para conferir as funções e permissões depois da inicialização, execute `scripts/verificar_banco.sql`.

**Cuidado:** antes de aplicar atualizações a um banco que já contém dados, faça um backup. **Não execute `scripts/carga_teste.sql` ou `scripts/remover_carga_teste.sql` no banco de produção.**

### 4.2. Configurar as variáveis locais

Na raiz do projeto, crie o arquivo `.env` a partir do modelo:

```powershell
Copy-Item .env.example .env
```

Abra `.env` no VS Code e preencha os valores correspondentes ao **mesmo projeto Supabase**. Exemplo de estrutura (não copie os valores ilustrativos como credenciais):

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SECRETA
TECNICO_INICIAL_EMAIL=tecnico-teste@exemplo.com
TECNICO_INICIAL_SENHA=SUA_SENHA_FORTE_COM_PELO_MENOS_12_CARACTERES
TECNICO_INICIAL_NOME=Tecnico de Testes
```

- A **Project URL** está nas configurações da API do Supabase. Utilize somente a URL base `https://...supabase.co`, sem `/rest/v1`.
- A chave usada pelo backend deve ser **secreta/privilegiada**, obtida em **Project Settings → API Keys**. O nome da variável no HelpFlow continua sendo `SUPABASE_SERVICE_ROLE_KEY` mesmo que a chave utilizada seja a nova chave secreta do Supabase.
- Nunca coloque essa chave em código do navegador, prints, mensagens públicas ou arquivos versionados.
- A senha do primeiro técnico deve ter **pelo menos 12 caracteres**. O primeiro técnico recebe o identificador protegido `TEC-01`.
- Se `TEC-01` já existir no banco, **reiniciar o servidor ou mudar a variável não redefine a senha antiga**.

O arquivo `.env` é ignorado pelo Git através do `.gitignore`. Confira essa proteção antes de fazer um commit.

### 4.3. Iniciar e testar

No terminal do VS Code, execute:

```powershell
npm ci --include=dev
npm run dev
```

Abra **http://localhost:5173**. O terminal deverá exibir `Persistência: Supabase`. O primeiro técnico será cadastrado na primeira inicialização quando as variáveis estiverem corretas e a conta `TEC-01` ainda não existir.

Entre com o e-mail e a senha configurados para o primeiro técnico. Cadastre um cliente pela interface, abra um chamado e confira se ele aparece na fila do técnico. Reinicie o servidor e verifique se os dados continuam salvos.

**Importante para `npm start`:** o comando `npm run dev` carrega `.env` pelo script `dev:api`, mas **`npm start` não carrega esse arquivo automaticamente**. Para iniciar a versão compilada com o `.env` no Node.js 22, use:

```powershell
npm run build
node --env-file=.env dist/server/servicos/server.js
```

Abra **http://localhost:3000**. Se preferir usar `npm start`, defina antes as variáveis de ambiente no próprio terminal. Não rode os dois servidores ao mesmo tempo.

### 4.4. Testar o CA-03 sem afetar a produção

Somente em um **banco de testes separado**, execute `scripts/carga_teste.sql`. O script cria 500 chamados fictícios e 50 mensagens no chamado `PERF-0001`.

Em um segundo terminal PowerShell, configure as credenciais de um técnico aprovado **nesse banco de testes**:

```powershell
$env:HELPFLOW_TEST_EMAIL = "tecnico-teste@exemplo.com"
$senha = Read-Host "Senha do tecnico de testes" -AsSecureString
$env:HELPFLOW_TEST_PASSWORD = [System.Net.NetworkCredential]::new("", $senha).Password
node scripts/medir_desempenho.mjs http://localhost:3000
```

Se o servidor foi iniciado com `npm run dev`, a API também estará em `http://localhost:3000`. O script mede o tempo HTTP e a leitura do JSON, **não o tempo de exibição dos dados no navegador**. Guarde as medições e as gravações de tela em `docs/evidencias/`. Ao terminar, limpe as variáveis temporárias do segundo terminal e use `scripts/remover_carga_teste.sql` **apenas no banco de testes**, caso deseje remover os registros.

## 5. Publicar na internet pelo Render

O Render executa a API Express e entrega a interface React compilada no mesmo endereço. O banco fica no Supabase; o Render **não substitui o Supabase**.

### 5.1. Preparar o GitHub e o Supabase

1. Atualize o repositório [Goldcrowb/TCC_HelpFlow](https://github.com/Goldcrowb/TCC_HelpFlow) com os arquivos do projeto e faça **Push origin**.
2. Confirme que o repositório tem `render.yaml`, `package.json`, `package-lock.json` e `.node-version` na raiz.
3. No Supabase escolhido para a hospedagem, execute `database.sql` se for um banco novo. Em banco existente, faça backup antes de qualquer atualização e confira a estrutura com `scripts/verificar_banco.sql`.
4. Nunca envie o arquivo `.env` ou chaves secretas para o GitHub.

### 5.2. Criar o serviço

Acesse [dashboard.render.com](https://dashboard.render.com/), conecte seu GitHub e siga **New → Blueprint** para criar um serviço usando `render.yaml`. Se o serviço `helpflow-tcc` **já existe**, apenas atualize o repositório e as variáveis do serviço existente: **não é necessário criar outro**.

O arquivo `render.yaml` define:

| Campo | Valor no projeto |
| --- | --- |
| Serviço | `helpflow-tcc` (Web Service) |
| Ambiente | Node.js 22, conforme `.node-version` |
| Plano | Free |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/saude` |

### 5.3. Variáveis de ambiente no Render

No serviço do Render, abra **Environment → Edit**. Preencha as variáveis abaixo; os nomes devem ser exatamente os definidos no projeto:

| Variável | O que informar |
| --- | --- |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | URL base do projeto Supabase utilizado pelo site |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada do **mesmo** projeto Supabase |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres; o Blueprint pode gerá-lo |
| `TECNICO_INICIAL_EMAIL` | E-mail do primeiro técnico autorizado |
| `TECNICO_INICIAL_SENHA` | Senha forte, com no mínimo 12 caracteres |
| `TECNICO_INICIAL_NOME` | Nome de exibição, opcional |

O arquivo `render.yaml` marca as chaves privadas com `sync: false` para serem preenchidas no painel, sem armazenar os valores no repositório. Se `SESSION_SECRET` já foi gerada automaticamente, mantenha-a. Não ative `DEMO_MEMORY_MODE` na apresentação online.

### 5.4. Fazer a implantação e conferir

1. Clique em **Save, deploy** ou faça **Manual Deploy → Deploy latest commit**, conforme o serviço.
2. Acompanhe **Logs**. A implantação precisa concluir o build e iniciar o servidor sem erros.
3. Verifique se o serviço está **Live** e abra a URL pública indicada pelo Render (o endereço real aparece no painel).
4. Confira a rota `https://SEU-SERVICO.onrender.com/api/saude`.
5. Faça login, crie um cliente fictício, abra um chamado e verifique o atendimento com o técnico.
6. Recarregue a página para confirmar a persistência no Supabase.

No plano gratuito, o serviço pode ficar inativo após um período sem acessos, e o projeto Supabase gratuito também pode ser pausado por inatividade. Reative e teste os dois antes da defesa. Se o serviço tiver sido suspenso manualmente, use a opção de retomada do Render.

## 6. Problemas comuns

| Problema | O que conferir |
| --- | --- |
| `npm` não reconhecido ou bloqueado | Instale Node.js 22, reabra o terminal; no PowerShell tente `npm.cmd` |
| Porta 3000 em uso | Pare outra instância do HelpFlow com `Ctrl + C` |
| `Persistência: memória` quando esperava Supabase | Confira `.env` ou as variáveis no **mesmo terminal** da API; reinicie o servidor |
| `401 — E-mail ou senha inválidos` | Verifique em qual banco o servidor está conectado e se a conta existe nele; contas locais não são contas do Supabase |
| Primeiro técnico não aparece | Configure `TECNICO_INICIAL_EMAIL` e `TECNICO_INICIAL_SENHA` antes da primeira inicialização e consulte `TEC-01` no banco |
| `PERF-0001` não encontrado | A carga de 500/50 não foi executada no banco de testes conectado à API |
| Build do Render falhou | Confira `.node-version` e o comando `npm ci --include=dev && npm run build` |
| Site abre, mas os dados falham | Confira URL e chave do mesmo projeto Supabase, tabelas, permissões e disponibilidade do banco |
| Não é possível excluir usuário | Execute `scripts/verificar_banco.sql` e confira a função `excluir_usuario_helpflow`; consulte os logs do Render |
| Alterou a senha do primeiro técnico no Render, mas o login não mudou | A senha da conta existente não é redefinida por essa variável |

Não apague tabelas nem desative a segurança RLS para corrigir um erro de configuração. Nunca publique o conteúdo do `.env`.

## 7. Verificar o código

```powershell
npm run check
npm test
npm run build
npm run test:build
```

Os comandos acima verificam tipos, executam testes automatizados, compilam o projeto e conferem o build. `npm run test:build` precisa que a pasta `dist` tenha sido criada pelo build. O comando `npm run check` não inspeciona todos os componentes JSX com as mesmas regras de tipos; o build do Vite complementa a verificação.

A última execução registrada no material entregue (18/11/2026) apresentou **40/40 testes aprovados**. Consulte os registros em `docs/evidencias/`; essa informação não substitui a execução dos comandos no computador do avaliador.

### Evidência de desempenho CA-03

No teste local de 22/11/2026, com banco Supabase separado, foram utilizados **500 chamados** e **50 mensagens**. O script HTTP registrou **934,23 ms** para a fila e **563,62 ms** para o histórico. Duas gravações do Edge indicaram aproximadamente **790 ms** até a pintura da fila e **1.090 ms** do clique até a pintura do histórico. São medições de execuções diferentes e não devem ser somadas. A primeira execução ficou abaixo dos limites locais de 2 s e 3 s, respectivamente; ainda faltam repetições e confirmação no Render. Veja [o registro do CA-03](docs/evidencias/ca03_resultados.md).

## 8. Como o projeto está organizado

```text
src/
  apresentacao/   telas React, chamadas à API e fila offline
  servicos/       rotas e inicialização do servidor Express
  aplicacao/      serviços e casos de uso
  dominio/        entidades, regras e interfaces
  persistencia/   repositórios em memória e Supabase
public/          recursos estáticos
scripts/         scripts SQL, medições e verificações
docs/            documentação D1–D9, diagramas e evidências
apresentacao/    slides e roteiro da defesa
referencias/     materiais originais do projeto e da disciplina
```

O domínio foi desenvolvido com modelagem orientada a objetos. As regras de negócio ficam separadas do armazenamento por interfaces de repositório (padrão Repository). A organização aplica princípios SOLID principalmente na separação de responsabilidades e na inversão de dependência, sem afirmar adesão integral a todos eles.

## 9. Documentação e entrega

- [Dossiê final D1–D9 em PDF](docs/HelpFlow_EntregaFinal_v2.2.pdf) e [versão Word](docs/HelpFlow_EntregaFinal_v2.2.docx).
- [Manual de uso](docs/manual.md), [documentação da API](docs/api.md) e [pendências](docs/pendencias.md).
- [Apresentação da defesa](apresentacao/HelpFlow_Defesa.pptx) e [roteiro](apresentacao/roteiro.md).
- [Registros de testes e medições](docs/evidencias/).
- [Repositório no GitHub](https://github.com/Goldcrowb/TCC_HelpFlow).

A documentação distingue o que foi implementado do que ainda precisa de evidência. O CA-06 (instalação por outra pessoa), parte da validação online e a auditoria atualizada de vulnerabilidades ainda precisam ser concluídos ou registrados. Não inclua senhas, chaves, `node_modules`, `dist` ou `.env` no commit.

**Observação:** o HelpFlow é uma aplicação web executada com Node.js; o ZIP do projeto e o repositório contêm código-fonte e instruções de instalação, não um executável autônomo.
