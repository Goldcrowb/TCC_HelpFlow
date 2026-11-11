-- HelpFlow 2.1 — executar no SQL Editor do seu projeto Supabase ANTES do deploy.
-- NÃO apaga registros nem altera chamados/mensagens já existentes.
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
