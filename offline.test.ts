import { beforeEach, describe, expect, test, vi } from 'vitest';
import { adicionarPendente, descartarPendente, lerPendencias, sincronizarPendencias } from './offline';
import type { UsuarioSessao } from './api';

const usuario: UsuarioSessao = { id: 'CLI-01', nome: 'Cliente', email: 'cliente@helpflow.local', perfil: 'cliente' };
let storage: Map<string, string>;
let ordens: string[];

beforeEach(() => {
    storage = new Map(); ordens = [];
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, valor: string) => storage.set(key, valor),
    });
    vi.stubGlobal('window', { dispatchEvent: () => true });
});

function filaDeExemplo() {
    const id1 = crypto.randomUUID(), id2 = crypto.randomUUID(), id3 = crypto.randomUUID();
    adicionarPendente({ id: id1, usuarioId: usuario.id, criadoEm: '2026-11-08T12:00:00Z', tipo: 'chamado', titulo: 'Notebook sem acesso', descricao: 'Não consegue conectar ao Wi-Fi.', categoria: 'Rede' });
    adicionarPendente({ id: id2, usuarioId: usuario.id, criadoEm: '2026-11-08T12:01:00Z', tipo: 'mensagem', chamadoId: id1, conteudo: 'Registro a mensagem.' });
    adicionarPendente({ id: id3, usuarioId: 'CLI-02', criadoEm: '2026-11-08T12:02:00Z', tipo: 'chamado', titulo: 'Outro cliente', descricao: 'Chamado de outra conta.', categoria: 'Software' });
    return { id1, id2, id3 };
}

describe('Fila offline do navegador', () => {
    test('mantém ordem, identifica usuário e não insere operação duplicada', () => {
        const { id1, id2 } = filaDeExemplo();
        expect(lerPendencias(usuario.id).map((p) => p.id)).toEqual([id1, id2]);
        expect(lerPendencias()).toHaveLength(3);
        adicionarPendente({ id: id1, usuarioId: usuario.id, criadoEm: '2026-11-08T12:00:00Z', tipo: 'chamado', titulo: 'Repetido', descricao: 'Repetido', categoria: 'Rede' });
        expect(lerPendencias()).toHaveLength(3);
        descartarPendente(id1, 'CLI-02');
        expect(lerPendencias(usuario.id)).toHaveLength(2);
    });

    test('rede indisponível mantém fila; após reconexão envia em ordem apenas seu usuário', async () => {
        const { id1, id2 } = filaDeExemplo();
        vi.stubGlobal('fetch', vi.fn(async () => { throw Error('offline'); }));
        expect((await sincronizarPendencias(usuario)).pendentes).toBe(2);
        expect(lerPendencias()).toHaveLength(3);
        vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
            const corpo = JSON.parse(init.body as string);
            ordens.push(corpo.operacaoId);
            return new Response(JSON.stringify({ id: corpo.operacaoId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }));
        const resultado = await sincronizarPendencias(usuario);
        expect(resultado).toEqual({ enviados: 2, pendentes: 0 });
        expect(ordens).toEqual([id1, id2]);
        expect(lerPendencias()).toHaveLength(1); // CLI-02 fica isolado
    });
});
