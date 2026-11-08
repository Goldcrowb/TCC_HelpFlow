# 09 — Registro de alterações

## Versão 2.0.0 — 08/11/2026

Esta versão foi organizada a partir do repositório `Goldcrowb/TCC_HelpFlow` e acrescentou ajustes de código, testes e arquivos de implantação.

1. **Build de produção:** pasta do backend separada da pasta do Vite (`dist/server` e `dist/web`), execução da SPA e API num único host.
2. **Autenticação:** migração do envio de identidade por cabeçalhos controlados pelo navegador para sessão assinada HMAC no cookie HttpOnly, com expiração e verificação de perfil na API.
3. **Segurança do banco:** chave `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor; SQL com RLS e bloqueio de leitura/escrita anônima.
4. **Visão técnica:** adicionada consulta por técnico e aba Meus atendimentos, permitindo continuar atendimento após atribuição.
5. **Permissões:** cliente só acessa próprios dados; técnico precisa assumir chamado para responder ou alterar status; conflitos retornam HTTP 409.
6. **Offline e idempotência:** fila local em ordem para novos chamados e mensagens, service worker do app shell e UUID persistente por operação para reenvio seguro.
7. **Interface:** layout responsivo, login, estatísticas, filtros, cards, histórico e feedback visual.
8. **Verificação:** ajuste do teste original de clone, testes de integração HTTP e fila offline (26 casos no total), compilação local.
9. **Implantação:** Blueprint `render.yaml`, `.env.example`, `.gitignore`, `.node-version`, instruções para Render/Supabase.
10. **Documentação:** requisitos, arquitetura complementar, contrato, testes, instalação, checklist das Fases 4–6 e roteiro de defesa.

## Revisão da documentação e organização — 08/11/2026

- Os componentes internos de tela receberam nomes em português, como `PainelCliente`, `PainelTecnico` e `FormularioChamado`. Foram preservados os nomes das classes de domínio e dos contratos já utilizados pelos serviços.
- Os arquivos de documentação passaram a ter nomes descritivos e a arquitetura atual foi consolidada em um documento Word próprio. O documento 1.3 permanece na pasta de referências.
- Foi corrigido o uso de `express.static` na versão compilada. A verificação local confirmou as respostas HTTP 200 da rota de saúde e da página inicial; foi incluído `npm run test:build` para repetir essa conferência.
- Foi realizada revisão de linguagem para manter o texto objetivo e adequado ao contexto do TCC, sem alterar requisitos ou registrar resultados ainda não medidos.

## Pontos que ainda precisam de melhoria

- Contas de demonstração continuam em memória, com senha pública, conforme projeto acadêmico. Não use dados reais.
- A interface em JSX é transformada/compilada pelo Vite; `npm run check` faz verificação de tipos do servidor e dos módulos TypeScript de requisições/fila. Não há dependências `@types/react` adicionais no pacote original, portanto não se afirma tipagem estática completa dos componentes React.
- Não se mediu CA-03 na nuvem; instalação externa CA-06 e teste visual manual ainda devem ser realizados.
- PWA e armazenamento local dependem do navegador e disponibilidade de cache; não são uma solução offline corporativa.
- A hospedagem depende da criação de contas e da configuração das variáveis de ambiente no Render e no Supabase.
