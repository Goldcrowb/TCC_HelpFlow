# 08 — Validações pendentes

Esta lista reúne as verificações que ainda precisam ser realizadas no ambiente definitivo. O código e os arquivos de configuração estão organizados, mas a publicação do site ainda depende de uma conta de hospedagem e do banco de dados.

| Item | Motivo | Como concluir | Marcação |
| --- | --- | --- | --- |
| Link público da apresentação | Requer conta Render + GitHub e aprovação do estudante | Seguir `docs/05_manual_de_instalacao.md`; anotar URL e data de publicação | ☐ |
| Banco persistente compartilhado | Requer criação de projeto Supabase e chaves próprias | Executar `database.sql`, definir variáveis no Render, testar reinício | ☐ |
| CA-03: desempenho hospedado 500/50 | Não medido na infraestrutura final | Executar scripts e DevTools no link real, registrar máximos | ☐ |
| CA-05 em Supabase | Teste em memória passou, banco remoto não foi exercitado | Dois técnicos simultâneos no site hospedado, registrar HTTP 200/409 | ☐ |
| CA-06: instalação externa | Precisa de pessoa que não fez o projeto | Entregar manual e observar instalação limpa; registrar nome/data | ☐ |
| Offline no navegador real | Lógica da fila testada; falta simular queda de rede em um navegador | Testar em Chrome/Edge: visitar online, offline 3 operações, reconectar | ☐ |
| Revisão visual em desktop e celular | Falta conferir a interface em dispositivos diferentes | Abrir página em celular e desktop, capturar telas | ☐ |
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

> Esta lista é um controle de atividades. A aprovação dos critérios deve ser registrada com resultados, datas e evidências obtidas durante a execução dos testes.


## Após a atualização para versão 2.1

- Executar `scripts/migracao_cadastro.sql` no Supabase antes do novo deploy.
- Configurar as variáveis do primeiro técnico no Render, sem guardar credenciais no repositório.
- Testar no endereço público: cadastro de cliente, login, novo chamado, solicitação de técnico, aprovação, recusa e reinício do serviço preservando contas.
- Confirmar que os chamados antigos ainda estão no banco e decidir se há necessidade de migrar vínculos a contas novas.
- Revisar alertas de segurança do `npm audit` e planejar confirmação de e-mail, recuperação de senha e medidas anti-spam caso o site vá além da demonstração.
