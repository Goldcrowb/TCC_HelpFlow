# 09 — Histórico de alterações

## Versão 2.0.0 — 08/11/2026

**Origem:** código original do repositório `Goldcrowb/TCC_HelpFlow`, atualizado sobre ZIP fornecido pelo estudante.

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

## Limites e débitos técnicos

- Contas de demonstração continuam em memória, com senha pública, conforme projeto acadêmico. Não use dados reais.
- A interface em JSX é transformada/compilada pelo Vite; `npm run check` faz verificação de tipos do servidor e dos módulos TypeScript de requisições/fila. Não há dependências `@types/react` adicionais no pacote original, portanto não se afirma tipagem estática completa dos componentes React.
- Não se mediu CA-03 na nuvem; instalação externa CA-06 e teste visual manual ainda devem ser realizados.
- PWA e armazenamento local dependem do navegador e disponibilidade de cache; não são uma solução offline corporativa.
- Não há hospedagem provisionada automaticamente: depende do usuário fornecer as próprias credenciais em Render/Supabase.
