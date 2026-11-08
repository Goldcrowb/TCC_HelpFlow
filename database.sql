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
