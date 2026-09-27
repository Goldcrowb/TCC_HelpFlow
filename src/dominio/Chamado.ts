import { DadoInvalidoException } from './DadoInvalidoException';

// Enums para limitar as opções de status e categoria
export enum StatusChamado {
    ABERTO = "Aberto",
    EM_ANDAMENTO = "Em Andamento",
    RESOLVIDO = "Resolvido"
}

export class Chamado {
    private readonly id: string;
    private readonly clienteId: string;
    private readonly titulo: string;
    private readonly descricao: string;
    private readonly dataAbertura: Date;
    private status: StatusChamado;
    private tecnicoResponsavelId: string | null;
    private versao: number; // Suporte ao bloqueio otimista (RF-005)

    constructor(id: string, clienteId: string, titulo: string, descricao: string) {
        if (!titulo || titulo.length < 5) {
            throw new DadoInvalidoException("O título do chamado deve ter pelo menos 5 caracteres.");
        }
        if (!descricao || descricao.length < 10) {
            throw new DadoInvalidoException("A descrição precisa ser mais detalhada.");
        }

        this.id = id;
        this.clienteId = clienteId;
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataAbertura = new Date(); // Data automática de abertura (RF-002)
        this.status = StatusChamado.ABERTO; // CA-01: Chamado recém-criado exibe status Aberto
        this.tecnicoResponsavelId = null;
        this.versao = 1;
    }

    // Método para o RF-005: Atribuir técnico
    public atribuirTecnico(tecnicoId: string): void {
        if (this.tecnicoResponsavelId !== null) {
            throw new DadoInvalidoException("O chamado já foi atribuído a outro técnico."); // Garante o CA-05
        }
        this.tecnicoResponsavelId = tecnicoId;
        this.status = StatusChamado.EM_ANDAMENTO;
        this.versao += 1;
    }

    // Método para o RF-007: Alterar status
    public alterarStatus(novoStatus: StatusChamado, isTecnico: boolean): void {
        if (!isTecnico) {
            throw new DadoInvalidoException("Apenas usuários técnicos podem alterar o status."); // Garante o CA-02
        }
        this.status = novoStatus;
        this.versao += 1;
    }

    // Getters
    public getId(): string { return this.id; }
    public getStatus(): StatusChamado { return this.status; }
}