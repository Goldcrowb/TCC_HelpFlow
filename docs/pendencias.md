# O que precisa ser confirmado antes da defesa

| Item | Evidência disponível | Ação necessária |
| --- | --- | --- |
| D1/D2 — levantamento | Termo v1.3; sem solicitante formal; estimativas de cenário | Localizar registro original de entrevista, fonte, data, respostas e vínculos. Não inventar respostas. |
| CA-03 — desempenho | Medição de algoritmos real; script HTTP e carga 500/50 | Usar banco de teste, medir HTTP e exibição no navegador; guardar registros e resultados. |
| CA-06 — instalação | Manual; teste do build local nesta revisão | Outra pessoa instala a partir do ZIP em computador sem o projeto e registra nome, data, ambiente, dificuldades e resultado. |
| DF-01 — exclusão online | Erro relatado; correção de configuração e mensagem incluída; testes em memória | Executar SQL e verificar função, permissões e trigger; excluir conta fictícia e comprovar preservação do histórico. |
| DF-02 — vulnerabilidades | Aviso anterior de 8 (2 moderadas, 2 altas, 4 críticas); auditoria atual falhou por rede | Rodar npm audit e npm audit --omit=dev; revisar versões, corrigir e retestar. |
| Validação do navegador | Build e HTTP 200, não teste visual automatizado | Testar login, cadastro, aprovação, assumir nas duas telas, mensagens, transferência, filtros e offline, desktop/celular. |
| Produto | Repositório informado; ZIP fonte instalável | Confirmar acesso do professor, URL pública real, arquivo ZIP e data da defesa. |
| Histórico | Autor registrado no termo: Gabriel Krause | Confirmar contribuições reais e período na instituição (termo original diz 5º, guia 7º). |

## CA-03 — como medir com segurança
Use apenas um projeto Supabase de teste, sem dados reais. Inicie o servidor já conectado a esse banco; crie o técnico de teste e confirme o ambiente. Rode scripts/carga_teste.sql no SQL Editor e verifique os 500 chamados e 50 mensagens. O identificador fictício CLI-01 é utilizado apenas para massa de desempenho; o técnico pode ver o chamado PERF-0001.

No PowerShell, defina HELPFLOW_TEST_EMAIL e HELPFLOW_TEST_PASSWORD na sessão (prefira ler a senha com Read-Host; não registre segredos em logs). Execute `node scripts/medir_desempenho.mjs https://ENDERECO-REAL-DO-AMBIENTE` ou localhost:3000 com esquema http. Repita três vezes; o script mede HTTP + JSON e avisa se os volumes estiverem incorretos. Exclua as variáveis após testar. No navegador, use DevTools Performance e cronômetro do clique em Atualizar até lista visível; abra PERF-0001 e cronometre até histórico renderizado; registre ambiente, método, três medições, maior valor, capturas. Critério: fila até 2 s, histórico até 3 s; resultado ainda pendente. Remova a massa de teste apenas desse banco com scripts/remover_carga_teste.sql.

As medições de ordenação estão em docs/evidencias/medicao_ordenacao.txt; execute npm run medir:algoritmos para repetir. Não confunda essa medida de CPU com CA-03.
