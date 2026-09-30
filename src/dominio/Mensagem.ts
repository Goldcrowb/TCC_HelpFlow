import { DadoInvalidoException } from './DadoInvalidoException';

export interface DadosMensagem {
    id: string;
    autorId: string;
    conteudo: string;
    dataEnvio: Date;
}

export class Mensagem {
    private readonly id: string;
    private readonly autorId: string;
    private readonly conteudo: string;
    private readonly dataEnvio: Date;

    constructor(id: string, autorId: string, conteudo: string, dataEnvio: Date) {
        if (!conteudo || conteudo.trim().length === 0) {
            throw new DadoInvalidoException('O conteúdo da mensagem não pode estar vazio.');
        }
        if (!dataEnvio || Number.isNaN(dataEnvio.getTime()) || dataEnvio.getTime() > Date.now()) {
            throw new DadoInvalidoException('A data de envio é inválida ou está no futuro.');
        }

        this.id = id;
        this.autorId = autorId;
        this.conteudo = conteudo.trim();
        this.dataEnvio = new Date(dataEnvio);
    }

    public static reidratar(dados: DadosMensagem): Mensagem {
        return new Mensagem(dados.id, dados.autorId, dados.conteudo, new Date(dados.dataEnvio));
    }

    public getId(): string {
        return this.id;
    }

    public getConteudo(): string {
        return this.conteudo;
    }

    public getDataEnvio(): Date {
        return new Date(this.dataEnvio);
    }

    public getAutorId(): string {
        return this.autorId;
    }
}
