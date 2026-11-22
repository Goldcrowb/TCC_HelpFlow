-- Conferência sem alterar nem excluir dados. Use no SQL Editor do Supabase.
select to_regclass('public.usuarios') as tabela_usuarios,
       to_regprocedure('public.excluir_usuario_helpflow(text)') as funcao_exclusao;
select has_function_privilege('service_role', to_regprocedure('public.excluir_usuario_helpflow(text)'), 'EXECUTE') as servidor_pode_executar,
       has_function_privilege('anon', to_regprocedure('public.excluir_usuario_helpflow(text)'), 'EXECUTE') as anonimo_pode_executar;
select id, perfil, situacao from public.usuarios where id = 'TEC-01';
select tgname from pg_trigger where tgrelid = 'public.chamados'::regclass and not tgisinternal;
-- Esperado: função existente, servidor true, anônimo false, TEC-01 ativo e trigger presente.
