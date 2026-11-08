import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { Server } from 'node:http';
import { app } from './server';

let servidor: Server;
let url = '';
const operacao = () => crypto.randomUUID();
type Metodos = 'GET' | 'POST' | 'PATCH';

async function fazerRota(rota: string, { metodo = 'GET', cookie, corpo, headers = {} }: {
    metodo?: Metodos; cookie?: string; corpo?: unknown; headers?: Record<string, string>
} = {}) {
    const res = await fetch(`${url}${rota}`, {
        method: metodo,
        headers: {
            ...(cookie ? { cookie } : {}),
            ...(corpo ? { 'Content-Type': 'application/json' } : {}),
            ...headers
        },
        ...(corpo ? { body: JSON.stringify(corpo) } : {})
    });
    return { status: res.status, dados: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] || '' };
}
async function entrar(email = 'cliente@helpflow.local') {
    const r = await fazerRota('/api/auth/login', { metodo: 'POST', corpo: { email, senha: '123456' } });
    expect(r.status).toBe(200);
    expect(r.cookie).toContain('helpflow_sessao=');
    return r.cookie;
}

beforeAll(async () => {
    servidor = await new Promise<Server>((resolve) => {
        const http = app.listen(0, '127.0.0.1', () => resolve(http));
    });
    const address = servidor.address();
    if (!address || typeof address === 'string') throw Error('Servidor não iniciou');
    url = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve) => servidor.close(() => resolve())); });

describe('API HelpFlow - aceitação e segurança', () => {
    test('saúde, login, sessão e logout', async () => {
        expect((await fazerRota('/api/saude')).status).toBe(200);
        expect((await fazerRota('/api/auth/session')).status).toBe(401);
        expect((await fazerRota('/api/auth/login', { metodo: 'POST', corpo: { email: 'tecnico@helpflow.local', senha: 'incorreta' } })).status).toBe(401);
        const cookie = await entrar();
        const sessao = await fazerRota('/api/auth/session', { cookie });
        expect(sessao.dados.usuario.perfil).toBe('cliente');
        expect((await fazerRota('/api/auth/logout', { metodo: 'POST', cookie })).status).toBe(200);
    });

    test('cabeçalhos falsos de identidade não autorizam acesso', async () => {
        const r = await fazerRota('/api/chamados/fila', {
            headers: { 'x-usuario-id': 'TEC-01', 'x-usuario-perfil': 'tecnico', 'x-usuario-email': 'tecnico@helpflow.local' }
        });
        expect(r.status).toBe(401);
        expect((await fazerRota('/api/auth/session', { cookie: 'helpflow_sessao=forjado' })).status).toBe(401);
    });

    test('CA-01: novo chamado aparece aberto para técnico', async () => {
        const cookieCliente = await entrar();
        const cookieTecnico = await entrar('tecnico@helpflow.local');
        const novo = await fazerRota('/api/chamados', {
            metodo: 'POST', cookie: cookieCliente, corpo: {
                titulo: 'Notebook não liga', descricao: 'Equipamento sem sinal de energia.', categoria: 'Hardware', operacaoId: operacao()
            }
        });
        expect(novo.status).toBe(201);
        expect(novo.dados.status).toBe('Aberto');
        const fila = await fazerRota('/api/chamados/fila', { cookie: cookieTecnico });
        expect(fila.status).toBe(200);
        expect(fila.dados.some((c: { id: string }) => c.id === novo.dados.id)).toBe(true);
        const meus = await fazerRota('/api/chamados/meus', { cookie: cookieCliente });
        expect(meus.dados.some((c: { id: string }) => c.id === novo.dados.id)).toBe(true);
    });

    test('CA-02: cliente não altera status, nem com perfil forjado', async () => {
        const cookie = await entrar();
        const chamados = await fazerRota('/api/chamados/meus', { cookie });
        expect(chamados.dados.length).toBeGreaterThan(0);
        const id = chamados.dados[0].id;
        const res = await fazerRota(`/api/chamados/${id}/status`, {
            metodo: 'PATCH', cookie, corpo: { status: 'Resolvido' }, headers: { 'x-usuario-perfil': 'tecnico' }
        });
        expect(res.status).toBe(403);
    });

    test('CA-05: dois técnicos disputando o mesmo chamado; um vence', async () => {
        const cliente = await entrar();
        const t1 = await entrar('tecnico@helpflow.local');
        const t2 = await entrar('tecnico2@helpflow.local');
        const novo = await fazerRota('/api/chamados', {
            metodo: 'POST', cookie: cliente,
            corpo: { titulo: 'Rede intermitente', descricao: 'Conexão oscilando no escritório.', categoria: 'Rede', operacaoId: operacao() }
        });
        const id = novo.dados.id;
        const [a, b] = await Promise.all([
            fazerRota(`/api/chamados/${id}/atribuir`, { metodo: 'POST', cookie: t1 }),
            fazerRota(`/api/chamados/${id}/atribuir`, { metodo: 'POST', cookie: t2 })
        ]);
        expect([a.status, b.status].sort()).toEqual([200, 409]);
        expect((await fazerRota('/api/chamados/fila', { cookie: t1 })).dados.some((c: { id: string }) => c.id === id)).toBe(false);
        const tecnicoVencedor = a.status === 200 ? t1 : t2;
        const atendimento = await fazerRota('/api/chamados/atendimentos', { cookie: tecnicoVencedor });
        expect(atendimento.dados.some((c: { id: string }) => c.id === id)).toBe(true);
    });

    test('CA-04: mensagem tem autor e instante de envio; técnico resolve chamado', async () => {
        const cliente = await entrar();
        const tecnico = await entrar('tecnico@helpflow.local');
        const novo = await fazerRota('/api/chamados', { metodo: 'POST', cookie: cliente,
            corpo: { titulo: 'Erro no monitor', descricao: 'Tela fica preta depois de ligar.', categoria: 'Hardware', operacaoId: operacao() }
        });
        const id = novo.dados.id;
        const inicial = Date.now();
        const mensagem = await fazerRota(`/api/chamados/${id}/mensagens`, { metodo: 'POST', cookie: cliente,
            corpo: { conteudo: 'A tela começou a piscar hoje.', operacaoId: operacao() }
        });
        expect(mensagem.status).toBe(201);
        const data = Date.parse(mensagem.dados.dataEnvio);
        expect(data).toBeGreaterThanOrEqual(inicial - 1000);
        expect(data).toBeLessThanOrEqual(Date.now() + 1000);
        expect((await fazerRota(`/api/chamados/${id}/mensagens`, { metodo: 'POST', cookie: tecnico, corpo: { conteudo: 'Tentando sem atribuição.' } })).status).toBe(403);
        expect((await fazerRota(`/api/chamados/${id}/atribuir`, { metodo: 'POST', cookie: tecnico })).status).toBe(200);
        expect((await fazerRota(`/api/chamados/${id}/status`, { metodo: 'PATCH', cookie: tecnico, corpo: { status: 'Resolvido' } })).status).toBe(200);
        const detalhes = await fazerRota(`/api/chamados/${id}`, { cookie: cliente });
        expect(detalhes.dados.chamado.status).toBe('Resolvido');
        expect(detalhes.dados.mensagens.some((m: { id: string }) => m.id === mensagem.dados.id)).toBe(true);
    });

    test('offline: operações repetidas com mesmo id não criam duplicações', async () => {
        const cliente = await entrar();
        const op = operacao();
        const corpo = { titulo: 'Chamado enviado duas vezes', descricao: 'Operação repetida após reconectar.', categoria: 'Software', operacaoId: op };
        const a = await fazerRota('/api/chamados', { metodo: 'POST', cookie: cliente, corpo });
        const b = await fazerRota('/api/chamados', { metodo: 'POST', cookie: cliente, corpo });
        expect(a.dados.id).toBe(op);
        expect(b.dados.id).toBe(a.dados.id);
        const msg = operacao();
        const m1 = await fazerRota(`/api/chamados/${op}/mensagens`, { metodo: 'POST', cookie: cliente, corpo: { conteudo: 'Mensagem sem duplicar.', operacaoId: msg } });
        const m2 = await fazerRota(`/api/chamados/${op}/mensagens`, { metodo: 'POST', cookie: cliente, corpo: { conteudo: 'Mensagem sem duplicar.', operacaoId: msg } });
        expect(m1.status).toBe(201);
        expect(m2.status).toBe(201);
        const detalhes = await fazerRota(`/api/chamados/${op}`, { cookie: cliente });
        expect(detalhes.dados.mensagens.filter((m: { id: string }) => m.id === msg)).toHaveLength(1);
    });

    test('não permite outro cliente ler ou comentar chamados alheios', async () => {
        const cliente2 = await entrar('cliente2@helpflow.local');
        const cliente1 = await entrar();
        const meus = await fazerRota('/api/chamados/meus', { cookie: cliente1 });
        const id = meus.dados[0].id;
        expect((await fazerRota(`/api/chamados/${id}`, { cookie: cliente2 })).status).toBe(403);
        expect((await fazerRota(`/api/chamados/${id}/mensagens`, { metodo: 'POST', cookie: cliente2, corpo: { conteudo: 'Isso não deveria funcionar.' } })).status).toBe(403);
    });

    test('entradas inválidas não são aceitas', async () => {
        const cookie = await entrar();
        const r = await fazerRota('/api/chamados', { metodo: 'POST', cookie, corpo: { titulo: 'A', descricao: 'X', categoria: 'Outra' } });
        expect(r.status).toBe(400);
        const origem = await fazerRota('/api/chamados', { metodo: 'POST', cookie,
            headers: { Origin: 'https://site-malicioso.exemplo' }, corpo: { titulo: 'Teste inválido', descricao: 'Não pode ser aceito.', categoria: 'Hardware' }
        });
        expect(origem.status).toBe(403);
    });
});
