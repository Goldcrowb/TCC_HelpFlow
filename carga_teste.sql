-- TESTE ACADÊMICO CA-03: execute APENAS no banco de teste.
-- Insere 500 chamados abertos fictícios e 50 mensagens de PERF-0001.
insert into public.chamados (id, cliente_id, titulo, descricao, categoria, data_abertura, status, tecnico_id, versao)
select 'PERF-' || lpad(g::text,4,'0'), 'CLI-01',
       'Chamado de desempenho ' || g,
       'Registro fictício para avaliar o tempo de exibição da fila do HelpFlow.',
       'Software', now() - make_interval(mins => 500-g), 'Aberto', null, 1
from generate_series(1, 500) as g
on conflict (id) do nothing;

insert into public.mensagens (id, chamado_id, autor_id, conteudo, data_envio)
select 'PERF-MSG-' || lpad(g::text,3,'0'), 'PERF-0001',
       case when g % 2 = 0 then 'TEC-01' else 'CLI-01' end,
       'Mensagem fictícia número ' || g || ' para medição acadêmica.',
       now() - make_interval(mins => 51-g)
from generate_series(1, 50) as g
on conflict (id) do nothing;

select (select count(*) from public.chamados where id like 'PERF-%') as chamados_teste,
       (select count(*) from public.mensagens where chamado_id = 'PERF-0001') as mensagens_teste;
