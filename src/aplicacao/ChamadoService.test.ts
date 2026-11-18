import { describe, expect, test } from 'vitest';
import { ChamadoService } from './ChamadoService';
import { RepositorioChamadoMemoria } from '../persistencia/RepositorioChamadoMemoria';
import { RepositorioUsuarioMemoria } from '../persistencia/RepositorioUsuarioMemoria';
import { AutenticacaoService } from './AutenticacaoService';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { CategoriaChamado } from '../dominio/CategoriaChamado';

describe('ChamadoService', () => {
    test('cliente consegue criar e listar seu chamado', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const usuarios = new RepositorioUsuarioMemoria();
        const auth = new AutenticacaoService(usuarios);
        const cliente = await auth.autenticar('cliente@helpflow.local', '123456');
        const service = new ChamadoService(repositorio, usuarios);
        const chamado = await service.criarChamado(cliente!, {
            titulo: 'Notebook sem acesso',
            descricao: 'O notebook não consegue acessar a rede interna.',
            categoria: CategoriaChamado.REDE
        });

        expect(chamado.getClienteId()).toBe(cliente!.getId());
        expect((await service.listarChamadosDoCliente(cliente!)).length).toBe(1);
    });

    test('técnico assume chamado e ele deixa de aparecer como aberto', async () => {
        const repositorio = new RepositorioChamadoMemoria();
        const usuarios = new RepositorioUsuarioMemoria();
        const auth = new AutenticacaoService(usuarios);
        const cliente = await auth.autenticar('cliente@helpflow.local', '123456');
        const tecnico = await auth.autenticar('tecnico@helpflow.local', '123456');
        const service = new ChamadoService(repositorio, usuarios);
        const chamado = await service.criarChamado(cliente!, {
            titulo: 'Aplicativo com erro',
            descricao: 'O sistema apresenta erro ao abrir o cadastro.',
            categoria: CategoriaChamado.SOFTWARE
        });

        const atribuido = await service.atribuirChamado(tecnico!, chamado.getId());
        expect((await service.listarFilaTecnico(tecnico!)).length).toBe(0);
        expect(atribuido.getTecnicoResponsavelId()).toBe(tecnico!.getId());
        expect((await service.listarAtendimentosDoTecnico(tecnico!)).length).toBe(1);
        expect(tecnico!.getPerfil()).toBe(PerfilUsuario.TECNICO);
    });
});

describe('Transferência de chamado', () => {
    test('ignora técnicos pendentes ou recusados e preserva versão em caso de recusa', async () => {
        const usuarios = new RepositorioUsuarioMemoria();
        const { Usuario } = await import('../dominio/Usuario');
        await usuarios.cadastrar(new Usuario('pendente', 'Técnico Pendente', 'pendente@example.test', 'senha-teste', PerfilUsuario.TECNICO, 'pendente'));
        await usuarios.cadastrar(new Usuario('recusado', 'Técnico Recusado', 'recusado@example.test', 'senha-teste', PerfilUsuario.TECNICO, 'recusado'));
        const repositorio = new RepositorioChamadoMemoria();
        const servico = new ChamadoService(repositorio, usuarios);
        const cliente = (await usuarios.buscarPorEmail('cliente@helpflow.local'))!;
        const tecnico = (await usuarios.buscarPorEmail('tecnico@helpflow.local'))!;
        const pendente = (await usuarios.buscarPorEmail('pendente@example.test'))!;
        const chamado = await servico.criarChamado(cliente, { titulo: 'Teste de transferência', descricao: 'Chamado usado para verificar as permissões.', categoria: CategoriaChamado.HARDWARE });
        const atribuido = await servico.atribuirChamado(tecnico, chamado.getId());
        const versao = atribuido.getVersao();
        expect((await servico.listarTecnicosParaTransferencia(tecnico)).map(t => t.id)).toEqual(['TEC-02']);
        await expect(servico.listarTecnicosParaTransferencia(pendente)).rejects.toThrow('Apenas técnicos aprovados');
        for (const id of ['pendente', 'recusado', 'inexistente']) {
            await expect(servico.transferirChamado(tecnico, chamado.getId(), id, versao)).rejects.toThrow('Selecione um técnico aprovado');
        }
        expect((await repositorio.buscarPorId(chamado.getId()))?.getVersao()).toBe(versao);
        expect((await repositorio.buscarPorId(chamado.getId()))?.getTecnicoResponsavelId()).toBe('TEC-01');
    });
});
