import { CategoriaChamado } from '../dominio/CategoriaChamado';
import { Chamado } from '../dominio/Chamado';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { Mensagem } from '../dominio/Mensagem';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { StatusChamado } from '../dominio/StatusChamado';
import { Usuario } from '../dominio/Usuario';

export interface CriarChamadoInput {
    titulo: string;
    descricao: string;
    categoria: CategoriaChamado;
}

export class ChamadoService {
    constructor(private readonly repositorio: RepositorioChamado) {}

    public async criarChamado(usuario: Usuario, dados: CriarChamadoInput): Promise<Chamado> {
        this.exigirPerfil(usuario, PerfilUsuario.CLIENTE);
        const chamado = new Chamado(gerarId(), usuario.getId(), dados.titulo, dados.descricao, dados.categoria);
        await this.repositorio.salvar(chamado);
        return chamado;
    }

    public async listarChamadosDoCliente(usuario: Usuario): Promise<Chamado[]> {
        this.exigirPerfil(usuario, PerfilUsuario.CLIENTE);
        return this.repositorio.listarPorCliente(usuario.getId());
    }

    public async listarFilaTecnico(usuario: Usuario): Promise<Chamado[]> {
        this.exigirPerfil(usuario, PerfilUsuario.TECNICO);
        return this.repositorio.listarTodosAbertos();
    }

    public async buscarDetalhes(usuario: Usuario, chamadoId: string): Promise<{ chamado: Chamado; mensagens: Mensagem[] }> {
        const chamado = await this.repositorio.buscarPorId(chamadoId);
        if (!chamado) {
            throw new DadoInvalidoException('Chamado não encontrado.');
        }

        const podeVer = usuario.getPerfil() === PerfilUsuario.TECNICO || chamado.getClienteId() === usuario.getId();
        if (!podeVer) {
            throw new DadoInvalidoException('Usuário sem permissão para visualizar este chamado.');
        }

        const mensagens = await this.repositorio.listarMensagens(chamadoId);
        return { chamado, mensagens };
    }

    public async atribuirChamado(usuario: Usuario, chamadoId: string): Promise<Chamado> {
        this.exigirPerfil(usuario, PerfilUsuario.TECNICO);
        const chamado = await this.obterChamado(chamadoId);

        try {
            chamado.atribuirTecnico(usuario.getId());
        } catch (erro) {
            throw erro;
        }

        const salvo = await this.repositorio.salvar(chamado);
        if (!salvo) {
            throw new DadoInvalidoException('O chamado já foi modificado por outro técnico.');
        }
        return chamado;
    }

    public async alterarStatus(usuario: Usuario, chamadoId: string, novoStatus: StatusChamado): Promise<Chamado> {
        this.exigirPerfil(usuario, PerfilUsuario.TECNICO);
        const chamado = await this.obterChamado(chamadoId);
        chamado.alterarStatus(novoStatus, true);

        const salvo = await this.repositorio.salvar(chamado);
        if (!salvo) {
            throw new DadoInvalidoException('O chamado foi alterado por outro usuário.');
        }
        return chamado;
    }

    public async adicionarMensagem(usuario: Usuario, chamadoId: string, conteudo: string): Promise<Mensagem> {
        const chamado = await this.obterChamado(chamadoId);
        const podeEnviar = usuario.getPerfil() === PerfilUsuario.TECNICO || chamado.getClienteId() === usuario.getId();
        if (!podeEnviar) {
            throw new DadoInvalidoException('Usuário sem permissão para enviar mensagem neste chamado.');
        }

        const mensagem = new Mensagem(gerarId(), usuario.getId(), conteudo, new Date());
        const salvo = await this.repositorio.adicionarMensagem(chamadoId, mensagem);
        if (!salvo) {
            throw new DadoInvalidoException('Não foi possível salvar a mensagem.');
        }
        return mensagem;
    }

    private async obterChamado(chamadoId: string): Promise<Chamado> {
        const chamado = await this.repositorio.buscarPorId(chamadoId);
        if (!chamado) {
            throw new DadoInvalidoException('Chamado não encontrado.');
        }
        return chamado;
    }

    private exigirPerfil(usuario: Usuario, perfil: PerfilUsuario): void {
        if (usuario.getPerfil() !== perfil) {
            throw new DadoInvalidoException('Usuário sem permissão para executar esta operação.');
        }
    }
}



function gerarId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
