-- Esquema inicial do HelpFlow para Supabase/PostgreSQL.
-- Execute no SQL Editor do Supabase.

create table if not exists chamados (
    id text primary key,
    cliente_id text not null,
    titulo varchar(120) not null,
    descricao text not null,
    categoria text not null,
    data_abertura timestamptz not null,
    status text not null,
    tecnico_id text,
    versao integer not null default 1
);

create table if not exists mensagens (
    id text primary key,
    chamado_id text not null references chamados(id) on delete cascade,
    autor_id text not null,
    conteudo text not null,
    data_envio timestamptz not null
);

create index if not exists idx_chamados_status on chamados(status);
create index if not exists idx_chamados_cliente_id on chamados(cliente_id);
create index if not exists idx_mensagens_chamado_id on mensagens(chamado_id);
