import { describe, expect, test } from 'vitest';
import { CadastroService } from './CadastroService';
import { verificarSenha } from './Senhas';
import { RepositorioUsuarioMemoria } from '../persistencia/RepositorioUsuarioMemoria';

describe('CadastroService - regras de cadastro', () => {
    test('guarda hash em vez de senha e marca técnico como pendente', async () => {
        const repositorio = new RepositorioUsuarioMemoria();
        const service = new CadastroService(repositorio);
        const senha = 'MinhaSenha#Nova2026';
        expect((await service.cadastrar({ nome: 'Novo Tecnico', email: 'novotec@example.test', senha, perfil: 'tecnico' })).situacao).toBe('pendente');
        const usuario = await repositorio.buscarPorEmail('novotec@example.test');
        expect(usuario?.getSenha()).not.toBe(senha);
        expect(usuario?.getSenha().startsWith('scrypt:')).toBe(true);
        expect(await verificarSenha(senha, usuario!.getSenha())).toBe(true);
        expect(await verificarSenha('outra-senha', usuario!.getSenha())).toBe(false);
    });

    test('não permite que cliente aprove solicitações nem que técnico aprove a si próprio', async () => {
        const repo = new RepositorioUsuarioMemoria();
        const service = new CadastroService(repo);
        await service.cadastrar({ nome: 'Novo Tecnico', email: 'autorizacao@example.test', senha: 'SenhaForte#123', perfil: 'tecnico' });
        const pendente = (await repo.buscarPorEmail('autorizacao@example.test'))!;
        const cliente = (await repo.buscarPorEmail('cliente@helpflow.local'))!;
        await expect(service.listarSolicitacoes(cliente)).rejects.toThrow(/aprovados/);
        await expect(service.decidir(pendente, pendente.getId(), 'aprovar')).rejects.toThrow(/aprovados|próprio/);
    });
});
