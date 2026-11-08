# 08 — Itens que precisam ser concluídos/validados fora do pacote

Este relatório separa **código pronto** de **evidência de operação real**. A entrega inclui toda a configuração, mas não foi publicado um site na conta do estudante.

| Item | Motivo | Como concluir | Marcação |
| --- | --- | --- | --- |
| Link público da apresentação | Requer conta Render + GitHub e aprovação do estudante | Seguir `docs/05...`; anotar URL e data de deploy | ☐ |
| Banco persistente compartilhado | Requer criação de projeto Supabase e chaves próprias | Executar `database.sql`, definir variáveis no Render, testar reinício | ☐ |
| CA-03: desempenho hospedado 500/50 | Não medido na infraestrutura final | Executar scripts e DevTools no link real, registrar máximos | ☐ |
| CA-05 em Supabase | Teste em memória passou, banco remoto não foi exercitado | Dois técnicos simultâneos no site hospedado, registrar HTTP 200/409 | ☐ |
| CA-06: instalação externa | Precisa de pessoa que não fez o projeto | Entregar manual e observar instalação limpa; registrar nome/data | ☐ |
| Offline no navegador real | Lógica de fila passou, navegador automatizado não pôde ser acessado no ambiente de geração | Testar em Chrome/Edge: visitar online, offline 3 operações, reconectar | ☐ |
| Revisão visual em desktop e celular | Ambiente de geração limitou o acesso do navegador ao localhost | Abrir página em celular e desktop, capturar telas | ☐ |
| Site acordado no dia da aula | Limitação do plano gratuito | Abrir Render 10 min antes; verificar Supabase ativo | ☐ |
| Slides com dados específicos da turma | Identificadores e horários da defesa não foram informados | Revisar capa, nomes, disciplina, professor, URL real | ☐ |

## Checklist rápido para finalizar

**URL pública:** __________________________________

**Data do deploy:** __________________  **Hash do commit:** __________________

**Supabase ativo no dia:** ☐ Sim  ☐ Não

**CA-03 (500):** ______ ms / ______ ms / ______ ms

**CA-03 (50):** ______ ms / ______ ms / ______ ms

**Pessoa que executou CA-06:** __________________  **Resultado:** ☐ Passou  ☐ Falhou

**CA-05 com banco remoto:** ☐ Passou  ☐ Falhou

**Cache offline e 3 operações:** ☐ Passou  ☐ Falhou

**Dispositivos testados:** __________________________________

**Observações e defeitos identificados:**

__________________________________________________

> Não deixe esta página como prova de aceitação: ela é uma lista de pendências. Preencha os resultados observados, com data e evidência, depois dos testes no ambiente real.
