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
