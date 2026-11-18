-- Atualização aditiva do HelpFlow: executar antes de publicar a nova API.
-- Não apaga dados, nem altera os identificadores dos usuários existentes.
begin;

-- Esta função só pode ser chamada pelo servidor (service_role).
-- O backend confere antes a sessão do primeiro técnico (TEC-01).
create or replace function public.excluir_usuario_helpflow(usuario_id text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
    perfil_conta text;
begin
    if usuario_id = 'TEC-01' then return 'protegido'; end if;
    select u.perfil into perfil_conta from public.usuarios u
        where u.id = usuario_id for update;
    if not found then return 'ausente'; end if;
    if perfil_conta = 'tecnico' and exists (
        select 1 from public.chamados c
        where c.tecnico_id = usuario_id and c.status <> 'Resolvido'
    ) then return 'pendencias'; end if;
    delete from public.usuarios u where u.id = usuario_id;
    return 'excluido';
end;
$$;
revoke all on function public.excluir_usuario_helpflow(text) from public, anon, authenticated;
grant execute on function public.excluir_usuario_helpflow(text) to service_role;

-- Evita que uma atribuição ou transferência concorrente deixe um chamado
-- em aberto com um técnico removido. O bloqueio da linha coordena as transações.
create or replace function public.validar_tecnico_chamado_helpflow()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
    if new.tecnico_id is null or new.status = 'Resolvido' then return new; end if;
    if tg_op = 'UPDATE' then
        if new.tecnico_id is not distinct from old.tecnico_id and old.status <> 'Resolvido' then
            return new;
        end if;
    end if;
    perform 1 from public.usuarios u where u.id = new.tecnico_id
        and u.perfil = 'tecnico' and u.situacao = 'ativo' for key share;
    if not found then
        raise exception 'O técnico selecionado não está mais ativo.';
    end if;
    return new;
end;
$$;
revoke all on function public.validar_tecnico_chamado_helpflow() from public, anon, authenticated;
grant execute on function public.validar_tecnico_chamado_helpflow() to service_role;
drop trigger if exists validar_tecnico_chamado_helpflow on public.chamados;
create trigger validar_tecnico_chamado_helpflow
before insert or update of tecnico_id, status on public.chamados
for each row execute function public.validar_tecnico_chamado_helpflow();
commit;
