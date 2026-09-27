import { DadoInvalidoException } from './DadoInvalidoException';

export class Mensagem {
    private readonly id: string;
    private readonly autorId: string;
    private readonly conteudo: string;
    private readonly dataEnvio: Date;

    constructor(id: string, autorId: string, conteudo: string, dataEnvio: Date) {
        // A classe nasce válida: validações no construtor
        if (!conteudo || conteudo.trim().length === 0) {
            throw new DadoInvalidoException("O conteúdo da mensagem não pode estar vazio.");
        }
        if (!dataEnvio || dataEnvio.getTime() > new Date().getTime()) {
            throw new DadoInvalidoException("A data de envio é inválida ou está no futuro.");
        }

        this.id = id;
        this.autorId = autorId;
        this.conteudo = conteudo.trim();
        this.dataEnvio = dataEnvio;
    }

    // Métodos de acesso (Getters)
    public getConteudo(): string { return this.conteudo; }
    public getDataEnvio(): Date { return this.dataEnvio; }
    public getAutorId(): string { return this.autorId; }
}