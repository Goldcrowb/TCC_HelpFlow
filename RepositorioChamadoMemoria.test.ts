import { describe, expect, test } from 'vitest';
import { CategoriaChamado } from '../dominio/CategoriaChamado';
import { Chamado } from '../dominio/Chamado';
import { Mensagem } from '../dominio/Mensagem';
import { RepositorioChamadoMemoria } from './RepositorioChamadoMemoria';

describe('RepositorioChamadoMemoria', () => {
    test('salva e busca um chamado', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const chamado = new Chamado('CH-100', 'CLI-01', 'Impressora parada', 'A impressora não imprime documentos.', CategoriaChamado.HARDWARE);
        await repositorio.salvar(chamado);
        expect((await repositorio.buscarPorId('CH-100'))?.getId()).toBe('CH-100');
    });

    test('lista chamados abertos por ordem cronológica', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const primeiro = new Chamado('CH-101', 'CLI-01', 'Primeiro chamado', 'Problema de rede no escritório.', CategoriaChamado.REDE);
        const segundo = new Chamado('CH-102', 'CLI-01', 'Segundo chamado', 'Erro em aplicação interna.', CategoriaChamado.SOFTWARE);
        await repositorio.salvar(primeiro);
        await repositorio.salvar(segundo);
        expect((await repositorio.listarTodosAbertos()).map((item) => item.getId())).toEqual(['CH-101', 'CH-102']);
    });

    test('lista chamados do cliente', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        await repositorio.salvar(new Chamado('CH-103', 'CLI-01', 'Chamado do cliente 1', 'Descrição suficiente para teste.', CategoriaChamado.OUTROS));
        await repositorio.salvar(new Chamado('CH-104', 'CLI-02', 'Chamado do cliente 2', 'Descrição suficiente para teste.', CategoriaChamado.OUTROS));
        expect((await repositorio.listarPorCliente('CLI-01')).map((item) => item.getId())).toEqual(['CH-103']);
    });

    test('salva e lista mensagens do chamado', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const chamado = new Chamado('CH-105', 'CLI-01', 'Chamado com histórico', 'Problema de teste no sistema.', CategoriaChamado.SOFTWARE);
        const mensagem = new Mensagem('MSG-105', 'CLI-01', 'Envio uma mensagem de teste.', new Date());
        await repositorio.salvar(chamado);
        expect(await repositorio.adicionarMensagem(chamado.getId(), mensagem)).toBe(true);
        expect((await repositorio.listarMensagens(chamado.getId())).length).toBe(1);
    });

    test('detecta conflito de versão durante atualização', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const original = new Chamado('CH-106', 'CLI-01', 'Chamado concorrente', 'Teste do bloqueio otimista.', CategoriaChamado.OUTROS);
        await repositorio.salvar(original);

        const tecnicoA = await repositorio.buscarPorId('CH-106');
        const tecnicoB = await repositorio.buscarPorId('CH-106');
        tecnicoA!.atribuirTecnico('TEC-01');
        await repositorio.salvar(tecnicoA!);
        tecnicoB!.atribuirTecnico('TEC-02');

        expect(await repositorio.salvar(tecnicoB!)).toBe(false);
    });
});
