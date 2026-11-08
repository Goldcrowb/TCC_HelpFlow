# 07 — Roteiro de apresentação do TCC

A apresentação foi planejada para **12 minutos**, com mais **5 minutos para perguntas**. O roteiro prioriza uma demonstração do funcionamento e a explicação das principais decisões técnicas.

## 1. Distribuição do tempo

| Tempo | Slide | Fala/demonstração |
| --- | --- | --- |
| 00:00–00:50 | 1. Abertura | “O HelpFlow foi feito para organizar o atendimento de suporte técnico. O cliente registra o problema e acompanha as respostas, enquanto o técnico assume e resolve os chamados.” |
| 00:50–01:50 | 2. Problema | “Quando os pedidos chegam por canais diferentes, fica mais difícil saber quem está atendendo e em que situação cada chamado se encontra.” |
| 01:50–02:50 | 3. Escopo | Explicar RF-001 a RF-007, cliente/técnico, três status; sem IA/chat instantâneo/notificações externas. |
| 02:50–04:05 | 4. Arquitetura | Apontar quatro camadas, interface do repositório no domínio e troca memória ↔ Supabase sem alterar regras. |
| 04:05–05:00 | 5. Dados e concorrência | Mostrar `chamados.versao` e UPDATE condicional. Dois técnicos não podem assumir o mesmo chamado. |
| 05:00–07:40 | 6–7. Demonstração | **Duas janelas:** cliente cria chamado; técnico vê na fila, assume, envia mensagem e resolve; cliente atualiza e vê resultado. |
| 07:40–08:50 | 8. Offline e rede | Mostre fila local, reconexão e IDs de operação. Diga que status/atribuição exigem internet para manter consistência. |
| 08:50–09:50 | 9. Testes e critérios | Mostrar `npm test`: 26 automatizados; CA-03 só declarar aprovado com medição real; CA-06 apenas se pessoa externa executou. |
| 09:50–11:00 | 10. Hospedagem | Mostrar URL no Render, API `/api/saude` e Supabase. Explicar hibernação do gratuito e plano de contingência. |
| 11:00–12:00 | 11. Conclusão | Requisitos implementados, decisões justificadas, limites e próximos passos: autenticação corporativa e monitoramento. |

## 2. Demonstração prática

**Preparação (antes de começar):** Render e Supabase ativos; navegador A como cliente, navegador B anônimo como técnico; nenhum dado pessoal real; limpar filtros se necessário.

1. Cliente entra (`cliente@helpflow.local` / `123456`), abre “Impressora da sala não imprime”, descrição detalhada, categoria Hardware.
2. Técnico entra (`tecnico@helpflow.local` / `123456`), abre Fila geral, identifica chamado **Aberto** e clica **Assumir**.
3. Em Meus atendimentos, o técnico abre o registro, vê **Em Andamento**, responde e altera status para **Resolvido**.
4. Cliente atualiza a lista, abre o mesmo chamado e vê a resposta com data/hora.
5. Para demonstrar CA-05, repita com dois técnicos em janelas separadas e mostre que apenas o primeiro consegue assumir.
6. Se for demonstrar offline, use Chrome DevTools → Network → Offline, crie uma solicitação, volte Online e clique Sincronizar. Escolha um chamado de teste; não interrompa a conexão durante a gravação real sem testar antes.

## 3. Perguntas que podem surgir

**Por que quatro camadas?** Para isolar a regra do sistema da interface e do banco: `ChamadoService` depende de `RepositorioChamado` no domínio, implementado em memória ou Supabase.

**Como evita atribuição duplicada?** O chamado tem `versao`. A atualização no banco só acontece se a versão ainda for a esperada; o segundo técnico recebe 409.

**Por que Array e Map?** Map simplifica busca de usuário por e-mail; Array mantém fila e histórico em ordem. O PostgreSQL usa índices para consulta remota.

**Como evita duplicação offline?** A operação recebe UUID antes do envio. Se houver falha após a gravação, o reenvio preserva o mesmo UUID e o banco impede duas linhas com a mesma chave.

**Por que não IA, WhatsApp ou chat ao vivo?** São explicitamente excluídos do termo original, para respeitar prazo/escopo e entregar primeiro o fluxo de help desk.

**O sistema é seguro para uma empresa?** Não. Há controles básicos de sessão e permissão, mas a autenticação usa contas acadêmicas demonstrativas. Para produção seria necessário provedor de identidade real, hash de senhas, gestão de contas e auditoria.

**O site fica online 24 horas?** A URL pode ser pública, mas o plano gratuito do Render hiberna após inatividade e o Supabase gratuito pode ser pausado. Testar antes da aula e manter backup local.

**Qual foi o resultado de desempenho?** Mostre somente as medidas reais do CA-03 se tiver executado `docs/10_avaliacao_de_desempenho.md`. Não confunda limitar a 500/50 com comprovar 2s/3s.

**O que ainda melhoraria?** Cadastro/recuperação de conta, histórico auditável, notificações, anexos, métricas operacionais, paginação, testes com vários usuários e observabilidade.
