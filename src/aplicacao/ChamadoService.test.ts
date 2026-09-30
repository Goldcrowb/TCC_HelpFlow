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
        const service = new ChamadoService(repositorio);
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
        const service = new ChamadoService(repositorio);
        const chamado = await service.criarChamado(cliente!, {
            titulo: 'Aplicativo com erro',
            descricao: 'O sistema apresenta erro ao abrir o cadastro.',
            categoria: CategoriaChamado.SOFTWARE
        });

        await service.atribuirChamado(tecnico!, chamado.getId());
        expect((await service.listarFilaTecnico(tecnico!)).length).toBe(0);
        expect(chamado.getTecnicoResponsavelId()).toBe(tecnico!.getId());
        expect(tecnico!.getPerfil()).toBe(PerfilUsuario.TECNICO);
    });
});
