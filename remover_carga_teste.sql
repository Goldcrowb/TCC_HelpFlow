-- Use apenas para limpar a massa de testes CA-03 que usa prefixo PERF-.
delete from public.mensagens where chamado_id like 'PERF-%';
delete from public.chamados where id like 'PERF-%';
