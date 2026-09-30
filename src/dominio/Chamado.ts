import { CategoriaChamado } from './CategoriaChamado';
import { DadoInvalidoException } from './DadoInvalidoException';
import { StatusChamado } from './StatusChamado';

export { StatusChamado } from './StatusChamado';

export interface DadosChamado {
    id: string;
    clienteId: string;
    titulo: string;
    descricao: string;
    categoria: CategoriaChamado;
    dataAbertura: Date;
    status: StatusChamado;
    tecnicoResponsavelId: string | null;
    versao: number;
}

export class Chamado {
    private readonly id: string;
    private readonly clienteId: string;
    private readonly titulo: string;
    private readonly descricao: string;
    private readonly categoria: CategoriaChamado;
    private readonly dataAbertura: Date;
    private status: StatusChamado;
    private tecnicoResponsavelId: string | null;
    private versao: number;

    constructor(id: string, clienteId: string, titulo: string, descricao: string, categoria: CategoriaChamado) {
        this.validarDadosBasicos(titulo, descricao);
        if (!Object.values(CategoriaChamado).includes(categoria)) {
            throw new DadoInvalidoException('Categoria do chamado inválida.');
        }

        this.id = id;
        this.clienteId = clienteId;
        this.titulo = titulo.trim();
        this.descricao = descricao.trim();
        this.categoria = categoria;
        this.dataAbertura = new Date();
        this.status = StatusChamado.ABERTO;
        this.tecnicoResponsavelId = null;
        this.versao = 1;
    }

    private validarDadosBasicos(titulo: string, descricao: string): void {
        if (!titulo || titulo.trim().length < 5) {
            throw new DadoInvalidoException('O título do chamado deve ter pelo menos 5 caracteres.');
        }
        if (!descricao || descricao.trim().length < 10) {
            throw new DadoInvalidoException('A descrição precisa ser mais detalhada.');
        }
    }

    public static reidratar(dados: DadosChamado): Chamado {
        const chamado = new Chamado(dados.id, dados.clienteId, dados.titulo, dados.descricao, dados.categoria);
        chamado.status = dados.status;
        chamado.tecnicoResponsavelId = dados.tecnicoResponsavelId;
        chamado.versao = dados.versao;
        Object.defineProperty(chamado, 'dataAbertura', { value: new Date(dados.dataAbertura), writable: false });
        return chamado;
    }

    public atribuirTecnico(tecnicoId: string): void {
        if (!tecnicoId.trim()) {
            throw new DadoInvalidoException('O técnico responsável é obrigatório.');
        }
        if (this.tecnicoResponsavelId !== null) {
            throw new DadoInvalidoException('O chamado já foi atribuído a outro técnico.');
        }

        this.tecnicoResponsavelId = tecnicoId;
        this.status = StatusChamado.EM_ANDAMENTO;
        this.versao += 1;
    }

    public alterarStatus(novoStatus: StatusChamado, isTecnico: boolean): void {
        if (!isTecnico) {
            throw new DadoInvalidoException('Apenas usuários técnicos podem alterar o status.');
        }
        if (!Object.values(StatusChamado).includes(novoStatus)) {
            throw new DadoInvalidoException('Status do chamado inválido.');
        }

        this.status = novoStatus;
        this.versao += 1;
    }

    public getId(): string {
        return this.id;
    }

    public getClienteId(): string {
        return this.clienteId;
    }

    public getTitulo(): string {
        return this.titulo;
    }

    public getDescricao(): string {
        return this.descricao;
    }

    public getCategoria(): CategoriaChamado {
        return this.categoria;
    }

    public getDataAbertura(): Date {
        return new Date(this.dataAbertura);
    }

    public getStatus(): StatusChamado {
        return this.status;
    }

    public getTecnicoResponsavelId(): string | null {
        return this.tecnicoResponsavelId;
    }

    public getVersao(): number {
        return this.versao;
    }
}
