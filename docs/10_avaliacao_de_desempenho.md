# 10 — Avaliação de desempenho (CA-03)

O critério de aceitação **CA-03** do projeto original define: **fila com 500 chamados armazenados carregada e exibida em até 2 segundos** e **histórico de um chamado com 50 mensagens apresentado em até 3 segundos**.

## 1. Preparar dados no Supabase

1. Garanta que está em um **banco de teste** e que está autorizado a gravar 500 chamados fictícios.
2. No SQL Editor do Supabase, execute `scripts/carga_teste.sql`. O script usa IDs com prefixo `PERF-` e marca horários fictícios. Ele cria exatamente 500 chamados abertos sem técnico e 50 mensagens em `PERF-0001` caso não existam esses IDs.
3. A chave de acesso ao banco permanece no servidor; o script é executado no painel do administrador, **não** a partir da interface pública.
4. Confirme com consultas SQL: `select count(*) from chamados where id like 'PERF-%';` e `select count(*) from mensagens where chamado_id='PERF-0001';`.

## 2. Medição da API

Num computador conectado à internet e com `node` instalado:

```bash
node scripts/medir_desempenho.mjs https://SEU-PROJETO.onrender.com
```

O script usa a conta de técnico da demo, faz login, mede tempo de **GET `/api/chamados/fila`** e **GET `/api/chamados/PERF-0001`** usando relógio de alta resolução, e apresenta quantidade de registros e milissegundos. Faça no mínimo três medições depois de acordar o Render. Para a URL use o endereço real da sua hospedagem.

## 3. Medição da interface (necessária)

O script HTTP não mede o tempo do navegador transformar os dados em interface. Para comprovar “carregada e exibida”, use Chrome/Edge DevTools: abra a aba Network/Performance, entre como técnico, recarregue a fila de 500 itens e registre o tempo de renderização na tela. Abra `PERF-0001` (pode ser necessário localizá-lo), com 50 mensagens, e registre o tempo até a última mensagem ser visível. Faça a medição após aquecimento do servidor, preferencialmente com cronômetro e captura do painel.

| Medida | Repetição 1 | Repetição 2 | Repetição 3 | Maior | Aprovado? |
| --- | --- | --- | --- | --- | --- |
| HTTP fila com 500 | ____ | ____ | ____ | ____ | — |
| UI fila com 500 | ____ | ____ | ____ | ____ | ≤ 2 s |
| HTTP histórico com 50 | ____ | ____ | ____ | ____ | — |
| UI histórico com 50 | ____ | ____ | ____ | ____ | ≤ 3 s |

**Critério não foi medido automaticamente nesta versão.** O professor pode pedir comprovação da tela e da rede; não preencha resultados estimados.

## 4. Limpar dados de teste

Execute `scripts/remover_carga_teste.sql` no SQL Editor do Supabase somente após encerrar a medição. Ele remove mensagens de IDs `PERF-%` e em seguida os chamados de desempenho.
