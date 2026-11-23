# Roteiro de defesa — 12 minutos + 5 de arguição

0:00–2:00 | Slides 1–2. Contextualize o problema e diga que volumes são estimativas, não uma pesquisa empresarial confirmada.

2:00–4:00 | Slides 3–4. Explique objetivo, oito capacidades principais e três exclusões. Mencione o CA-01 e CA-05; informe que o CA-03 teve uma medição local favorável, mas ainda precisa de repetições e validação no Render.

4:00–6:00 | Slides 5–7. Mostre o caminho interface → API → casos de uso → domínio, e o Repository. Explique versão do chamado como controle de atualização. Compare inserção manual com sort nativo usando a tabela medida; diferencie memória e SQL.

6:00–10:00 | Slides 8–9. Prepare duas contas técnicas aprovadas e uma cliente em janelas/perfis de navegador separados. Abra um chamado Rede, assuma pela tela de detalhes, responda, transfira, resolva no novo técnico e mostre o filtro. Mostre o cliente conferindo o histórico. Provoque uma falha de conexão com uma sessão já aberta, registre um chamado, reconecte e confirme que há um registro. Se a rede estiver indisponível, mostre a versão local e um vídeo gravado previamente (ainda não incluído). Evite excluir usuários reais ao demonstrar.

10:00–12:00 | Slides 10–12. Declare 40 casos locais aprovados, 2,14 s, e mostre o registro. Explique a medição local CA-03 de 22/11, suas limitações (sem repetição/Render), além de CA-06, exclusão no banco online e auditoria. Mencione o dossiê e o pacote; abra para perguntas.

Perguntas prováveis: por que Repository? O serviço depende de interfaces, permitindo troca de banco. Por que controle de versão? Evita que duas atualizações aceitem a mesma versão. Por que banco relacional? A relação entre chamado e mensagens, chaves e índices favorece consistência. Qual princípio SOLID? SRP e DIP; não há aplicação perfeita de todo SOLID. E offline? Só operações específicas entram na fila; a confirmação exige rede. Como proteger o técnico inicial? ID reservado e verificação no servidor, repetida na função SQL.
