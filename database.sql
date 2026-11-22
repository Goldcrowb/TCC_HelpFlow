-- HelpFlow / Supabase PostgreSQL. Execute no SQL Editor, com uma conta administradora.
-- O navegador nunca acessa essas tabelas diretamente. Somente o backend Express usa
-- SUPABASE_SERVICE_ROLE_KEY, armazenada como segredo no servidor da hospedagem.
create table if not exists public.chamados (
    id text primary key,
    cliente_id text not null,
    titulo varchar(120) not null,
    descricao text not null,
    categoria varchar(32) not null,
    data_abertura timestamptz not null,
    status varchar(32) not null,
    tecnico_id text,
    versao integer not null default 1 check (versao > 0)
);

create table if not exists public.mensagens (
    id text primary key,
    chamado_id text not null references public.chamados(id) on delete cascade,
    autor_id text not null,
    conteudo text not null,
    data_envio timestamptz not null
);

create index if not exists idx_chamados_status_data on public.chamados(status, data_abertura);
create index if not exists idx_chamados_cliente_data on public.chamados(cliente_id, data_abertura desc);
create index if not exists idx_chamados_tecnico_data on public.chamados(tecnico_id, data_abertura desc);
create index if not exists idx_mensagens_chamado_data on public.mensagens(chamado_id, data_envio desc);

-- Sem políticas públicas: o usuário anônimo não pode acessar estas tabelas.
-- O backend autenticado usa service_role somente no servidor.
alter table public.chamados enable row level security;
alter table public.mensagens enable row level security;
revoke all on table public.chamados from anon, authenticated;
revoke all on table public.mensagens from anon, authenticated;
grant select, insert, update, delete on table public.chamados, public.mensagens to service_role;

-- Cadastro de usuários (migração aditiva: preserva os chamados já existentes).
-- Executar novamente o arquivo completo é seguro com as tabelas já criadas.
create table if not exists public.usuarios (
    id text primary key,
    nome varchar(100) not null,
    email varchar(254) not null unique,
    senha_hash text not null,
    perfil varchar(16) not null check (perfil in ('cliente', 'tecnico')),
    situacao varchar(16) not null check (situacao in ('ativo', 'pendente', 'recusado')),
    criado_em timestamptz not null default now(),
    avaliado_por text,
    avaliado_em timestamptz,
    motivo_recusa varchar(500)
);
create index if not exists idx_usuarios_fila on public.usuarios(perfil, situacao, criado_em);
alter table public.usuarios enable row level security;
revoke all on table public.usuarios from anon, authenticated;
grant select, insert, update, delete on table public.usuarios to service_role;

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
notify pgrst, 'reload schema';
