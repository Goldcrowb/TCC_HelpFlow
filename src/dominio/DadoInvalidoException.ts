// Classe base para erros de regras de negócio
export class DadoInvalidoException extends Error {
    constructor(mensagem: string) {
        super(mensagem);
        this.name = "DadoInvalidoException";
    }
}