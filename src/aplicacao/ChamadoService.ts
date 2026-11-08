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
    operacaoId?: string;
}

export class ChamadoService {
    constructor(private readonly repositorio: RepositorioChamado) {}

    public async criarChamado(usuario: Usuario, dados: CriarChamadoInput): Promise<Chamado> {
        this.exigirPerfil(usuario, PerfilUsuario.CLIENTE);
        const id = validarIdOperacao(dados.operacaoId) ?? gerarId();
        const existente = await this.repositorio.buscarPorId(id);
        if (existente) {
            if (existente.getClienteId() !== usuario.getId() || existente.getTitulo() !== dados.titulo.trim()
                || existente.getDescricao() !== dados.descricao.trim() || existente.getCategoria() !== dados.categoria) {
                throw new DadoInvalidoException('Identificador de operação já utilizado.');
            }
            return existente;
        }
        const chamado = new Chamado(id, usuario.getId(), dados.titulo, dados.descricao, dados.categoria);
        const salvo = await this.repositorio.salvar(chamado);
        if (!salvo) {
            const repetido = await this.repositorio.buscarPorId(id);
            if (repetido && repetido.getClienteId() === usuario.getId() && repetido.getTitulo() === dados.titulo.trim()
                && repetido.getDescricao() === dados.descricao.trim() && repetido.getCategoria() === dados.categoria) return repetido;
            throw new DadoInvalidoException('Não foi possível registrar o chamado.');
        }
        return chamado;
    }

    public async listarChamadosDoCliente(usuario: Usuario): Promise<Chamado[]> {
        this.exigirPerfil(usuario, PerfilUsuario.CLIENTE);
        return this.repositorio.listarPorCliente(usuario.getId());
    }

    public async listarAtendimentosDoTecnico(usuario: Usuario): Promise<Chamado[]> {
        this.exigirPerfil(usuario, PerfilUsuario.TECNICO);
        return this.repositorio.listarPorTecnico(usuario.getId());
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

        chamado.atribuirTecnico(usuario.getId());

        const salvo = await this.repositorio.salvar(chamado);
        if (!salvo) {
            throw new DadoInvalidoException('O chamado já foi modificado por outro técnico.');
        }
        return chamado;
    }

    public async alterarStatus(usuario: Usuario, chamadoId: string, novoStatus: StatusChamado): Promise<Chamado> {
        this.exigirPerfil(usuario, PerfilUsuario.TECNICO);
        const chamado = await this.obterChamado(chamadoId);
        if (chamado.getTecnicoResponsavelId() !== usuario.getId()) {
            throw new DadoInvalidoException('Assuma o chamado antes de alterar o status.');
        }
        chamado.alterarStatus(novoStatus, true);

        const salvo = await this.repositorio.salvar(chamado);
        if (!salvo) {
            throw new DadoInvalidoException('O chamado foi alterado por outro usuário.');
        }
        return chamado;
    }

    public async adicionarMensagem(usuario: Usuario, chamadoId: string, conteudo: string, operacaoId?: string): Promise<Mensagem> {
        const chamado = await this.obterChamado(chamadoId);
        const podeEnviar = usuario.getPerfil() === PerfilUsuario.TECNICO
            ? chamado.getTecnicoResponsavelId() === usuario.getId()
            : chamado.getClienteId() === usuario.getId();
        if (!podeEnviar) {
            throw new DadoInvalidoException('Usuário sem permissão para enviar mensagem neste chamado.');
        }

        const mensagem = new Mensagem(validarIdOperacao(operacaoId) ?? gerarId(), usuario.getId(), conteudo, new Date());
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



function validarIdOperacao(id?: string): string | undefined {
    if (id === undefined) return undefined;
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new DadoInvalidoException('Identificador de operação inválido.');
    }
    return id;
}

function gerarId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
