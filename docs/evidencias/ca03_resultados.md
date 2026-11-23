# CA-03 - Medição de desempenho em ambiente local

**Projeto:** HelpFlow 2.2.0  
**Data da coleta:** 22/11/2026  
**Ambiente:** navegador Edge em computador do desenvolvedor, servidor Express `http://localhost:3000` conectado a projeto Supabase exclusivo de testes.  
**Massa de dados:** 500 chamados abertos (`PERF-0001` a `PERF-0500`) e 50 mensagens no histórico de `PERF-0001`.  
**Limites definidos:** fila visível em até 2.000 ms; histórico de 50 mensagens visível em até 3.000 ms.

## Procedimentos e resultados

Os dados fictícios foram carregados com `scripts/carga_teste.sql` no **Supabase de testes**, sem modificar o banco da apresentação. A contagem foi confirmada pelo script `scripts/medir_desempenho.mjs`, que obteve 500 registros na fila e 50 mensagens no histórico.

| Cenário | HTTP + leitura de JSON (script) | Gravação do navegador | Limite | Resultado local |
|---|---:|---:|---:|---|
| Fila com 500 chamados | 934,23 ms | cerca de 790 ms da solicitação à pintura | 2.000 ms | Abaixo do limite na execução |
| Histórico com 50 mensagens | 563,62 ms | cerca de 1.090 ms do clique à pintura | 3.000 ms | Abaixo do limite na execução |

As **medições do script HTTP e as do navegador são execuções diferentes**; por isso, não devem ser somadas nem comparadas como se fossem uma única medição. As capturas de tela documentam os tempos HTTP e o painel do técnico indicando 500 chamados.

### Como os rastros do navegador foram interpretados

- **Fila de 500:** em `Trace-20261122T205054.json.gz`, a solicitação `/api/chamados/fila` foi seguida pela finalização do recurso em cerca de **686,5 ms**, pela atualização do layout por volta de **750,9 ms** e pelo evento de pintura por volta de **788,4 ms**. O resultado foi arredondado para **790 ms**. Esta gravação inclui recarga da página; não é um cronômetro isolado do botão **Atualizar**.
- **Histórico de 50:** em `Trace-20261122T205654.json.gz`, a abertura de `/api/chamados/PERF-0001` foi seguida pela finalização da resposta em cerca de **1.040,9 ms** e por evento de pintura cerca de **1.055,1 ms** após o envio da solicitação. Como o evento de clique ocorreu cerca de **35 ms antes** dessa solicitação, o intervalo estimado clique-pintura é de **1.090 ms**.
- O rastreamento do navegador **não comprova sozinho** que cada um dos 500 cartões ou cada uma das 50 mensagens estava efetivamente visível. A quantidade foi confirmada na resposta HTTP e no cenário preparado; a pintura é um indicador aproximado do término da atualização visual.

## Avaliação

Nas execuções locais analisadas, os dois cenários ficaram **abaixo dos limites do CA-03**. Esta conclusão vale para o ambiente e as execuções descritas. O requisito não deve ser apresentado como aprovado em qualquer dispositivo ou hospedagem sem repetir a medição nessas condições.

### Evidências utilizadas

1. Captura do terminal `image(20261122-234203).png`: medição do script com os volumes 500 e 50.
2. Captura do navegador `image(20261122-235009).png`: painel mostrando 500 chamados na fila.
3. `Trace-20261122T205054.json.gz`: rastreamento da fila.
4. `Trace-20261122T205654.json.gz`: rastreamento do histórico.

As capturas e rastros foram fornecidos pelo responsável pelo projeto e guardados na pasta `docs/evidencias/ca03/` deste pacote. Antes de publicar gravações no repositório, confira se não contêm informações privadas do navegador.

## Repetições e validações ainda pendentes

- Executar **mais duas rodadas completas** (HTTP e navegador), anotando todas as medições e a maior duração observada.
- Medir o mesmo fluxo na **versão publicada no Render**, com banco de teste isolado e serviço já ativo, sem executar a massa de 500 registros no banco da apresentação.
- Registrar computador, memória, navegador/versão, conexão de rede e condições da medição, se houver exigência de caracterização do ambiente.
- Não confundir **LCP/CLS/INP** com o tempo total de consulta e renderização da fila/histórico.

## Referência no dossiê

Este registro complementa **D6 - Plano e resultado dos testes** e atualiza a pendência CA-03 descrita no **D8 - Relatório de encerramento**. Os resultados de desempenho da versão 2.2.0 em 18/11/2026 referem-se à suíte automatizada; os dados aqui apresentados são uma medição posterior, em 22/11/2026.
