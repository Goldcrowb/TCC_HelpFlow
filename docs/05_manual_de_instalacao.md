# 05 — Manual de instalação e uso

**Para atualizar uma instalação que já está no Render, siga primeiro [11_cadastro_e_aprovacao.md](11_cadastro_e_aprovacao.md): SQL de migração → variáveis do primeiro técnico → commit/deploy.**

Este manual descreve a execução no computador, a configuração do PostgreSQL no Supabase e a publicação no Render. Recomenda-se testar cada etapa antes de passar à seguinte.

## 1. Execução local

1. Instale **Node.js 22 LTS** no Windows, Linux ou macOS. Confira no terminal: `node -v` e `npm -v`.
2. Extraia o ZIP da entrega. Entre na pasta `TCC_HelpFlow`, onde fica `package.json`.
3. Execute `npm ci`. A primeira instalação exige internet.
4. Execute `npm run dev`.
5. No navegador, abra `http://localhost:5173`.
6. Entre como cliente `cliente@helpflow.local`, senha `123456`. Crie um chamado com título (mínimo 5 letras), descrição (mínimo 10) e categoria.
7. Saia e entre como técnico `tecnico@helpflow.local`, mesma senha. Na **Fila geral**, clique em **Assumir**. Em **Meus atendimentos**, abra o chamado, envie uma resposta e marque **Resolvido**.
8. Entre novamente como cliente e confira o status e a conversa.
9. Para testar ou compilar: `npm run check`, `npm test`, `npm run build` e `npm start` (site em `http://localhost:3000`).

**Sem Supabase:** todas as operações de chamado ficam na memória do processo. O conteúdo se perde ao reiniciar. Isso é apenas um modo de desenvolvimento.

## 2. Configuração do banco de dados

1. Acesse **https://supabase.com/**, crie uma conta e um projeto Free.
2. Defina uma senha forte para o banco e guarde em gerenciador de senhas. Aguarde o banco ficar ativo.
3. Abra o **SQL Editor** do projeto e execute o arquivo `database.sql`. Ele cria `chamados`, `mensagens`, `usuarios`, índices e habilita RLS sem acesso público. Para banco existente, basta rodar `scripts/migracao_cadastro.sql` antes de publicar a versão 2.1.
4. Em **Project Settings / API** (a nomenclatura pode mudar), copie o **Project URL** e a **service_role key** ou a chave secreta com permissões equivalentes, conforme a interface do seu projeto. **O código está configurado para a service_role key.** Não copie a chave anônima no lugar dela.
5. Configure no backend as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Para testar localmente, crie um arquivo `.env` baseado em `.env.example`. **A aplicação Node não carrega `.env` automaticamente**: use variáveis exportadas pelo terminal, um gerenciador de processos ou `node --env-file=.env` para executar o backend compilado. No Render, o painel injeta as variáveis automaticamente.
6. Confirme que `SUPABASE_SERVICE_ROLE_KEY` **nunca** está dentro de `src/apresentacao`, `VITE_*`, HTML, README com valor real, commit ou ZIP entregue.

**Observação:** o plano Free do Supabase pode pausar projetos com pouca atividade ao longo de 7 dias. Verifique no painel antes da aula e retome o projeto se tiver sido pausado.

## 3. Publicação no Render

1. Crie ou acesse uma conta no **GitHub**.
2. Faça commit da pasta de código (contendo `package.json`, `src/`, `database.sql`, `render.yaml`, `docs/` etc.) no repositório **Goldcrowb/TCC_HelpFlow** ou num repositório novo. **Não envie `node_modules/`, `dist/` ou `.env`**: o `.gitignore` já exclui esses itens.
3. Acesse **https://render.com/** e conecte o GitHub.
4. Em **New → Blueprint**, selecione o repositório que contém `render.yaml`. O blueprint cria um **Web Service** no plano `free`.
5. Preencha as variáveis solicitadas pelo Render: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. `SESSION_SECRET` é gerado automaticamente pelo `render.yaml`. Nunca compartilhe esses valores por mensagem, slide ou repositório.
6. O Render executa `npm ci && npm run build` e depois `npm start`. O aplicativo Express serve o site compilado e a API no **mesmo endereço**.
7. Quando o deploy concluir, abra a URL fornecida pelo Render, geralmente `https://NOME.onrender.com`, e confira `https://NOME.onrender.com/api/saude` retornando `status: ok`.
8. Teste os dois logins, abra um chamado, assuma, responda, mude o status, reinicie a página e veja se os dados permanecem. Se falhar, leia **Logs** no painel Render.

**Alternativa sem Blueprint:** New → Web Service → GitHub → `Goldcrowb/TCC_HelpFlow`; plano Free; Build Command `npm ci && npm run build`; Start Command `npm start`; defina `NODE_ENV=production`, `SESSION_SECRET` (mínimo 32 caracteres), `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; Health Check Path `/api/saude`.

### Limitações reais do gratuito

- Render Free **hiberna após 15 min sem tráfego** e pode demorar cerca de um minuto para acordar. As cotas gratuitas e condições podem mudar.
- O disco local do Render é efêmero. Use Supabase para persistir chamados e mensagens; **não use** o modo memória em produção.
- Supabase Free **pode pausar por inatividade**. Uma vez pausado, um link aparentemente online pode exibir erros de banco.
- Não existe garantia de disponibilidade ininterrupta no plano gratuito. Tenha o projeto local pronto para demonstração se necessário.

## 4. Conferência antes da apresentação

- [ ] URL pública abre em aba anônima de outro dispositivo.
- [ ] `/api/saude` retorna `ok`.
- [ ] Cliente cria e consulta chamado depois de atualizar a página.
- [ ] Técnico vê o chamado, assume e o encontra em **Meus atendimentos**.
- [ ] Segundo técnico não consegue assumir o mesmo chamado.
- [ ] Cliente não altera status; técnico responsável consegue.
- [ ] Mensagem aparece com data/hora e continua após atualização.
- [ ] Criar operação offline e reconectar envia apenas uma vez.
- [ ] CA-03: 500/50 e limites de tempo medidos em banco real; anexar evidência.
- [ ] CA-06: instalação por pessoa que não criou o projeto; registrar resultado.
- [ ] Instância Render acordada e projeto Supabase ativo antes da apresentação.
- [ ] Slides `apresentacao/Apresentacao_HelpFlow_TCC.pptx` prontos, backup offline local testado.

## 5. Demonstração do sistema

Use **duas janelas separadas**: cliente em uma janela normal, técnico em janela anônima (para cookies diferentes). Isso permite demonstrar a simultaneidade do CA-05 sem trocar o login. Crie o chamado primeiro e copie seu título/identificador. Evite digitar informações pessoais reais, pois as contas demonstrativas são públicas.

Ao final, mostre a pasta `docs`, o arquivo `database.sql`, `src/dominio`, os testes e o resultado `npm test`. O avaliador deve ver código, rastreabilidade, execução e o link.

## 6. Solução de problemas

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| `npm` não reconhecido | Node não instalado | Instale Node 22 e reinicie o terminal |
| Falha de build de dependência | Node incompatível | Confira `.node-version` (22) e execute `npm ci` |
| API mostra memória | Faltam variáveis do Supabase | Configure as duas chaves no backend |
| Render não inicia | Falta `SESSION_SECRET` ou acesso ao Supabase | Revise Environment e Logs; nunca cole segredos em prints |
| Chamados somem após reiniciar | Estava em modo memória | Use Supabase corretamente em produção |
| Link demora | Render hibernado | Acesse antes da apresentação e aguarde inicializar |
| Login OK, mas banco falha | SQL não foi executado, RLS ou credenciais erradas | Revise `database.sql`, URL e chave service_role |
| Não atualiza a interface | Cache de service worker | Atualize forçadamente e confira a versão/deploy |
| Sincronização parada | Erro de validação ou sessão expirada | Abra pendências, leia o erro; entre novamente antes de sincronizar |

## Referências para configuração dos serviços

- Render Free: https://render.com/docs/free
- Render Blueprints: https://render.com/docs/blueprint-spec
- Supabase Free e pausa: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase planos: https://supabase.com/docs/guides/platform/billing-on-supabase
