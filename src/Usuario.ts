import { DadoInvalidoException } from './DadoInvalidoException';
import { PerfilUsuario } from './PerfilUsuario';

export class Usuario {
    private readonly id: string;
    private readonly nome: string;
    private readonly email: string;
    private readonly senha: string;
    private readonly perfil: PerfilUsuario;

    constructor(id: string, nome: string, email: string, senha: string, perfil: PerfilUsuario) {
        if (!nome.trim()) {
            throw new DadoInvalidoException('O nome do usuário é obrigatório.');
        }
        if (!email.includes('@')) {
            throw new DadoInvalidoException('O e-mail do usuário é inválido.');
        }
        if (!senha || senha.length < 6) {
            throw new DadoInvalidoException('A senha deve ter pelo menos 6 caracteres.');
        }

        this.id = id;
        this.nome = nome.trim();
        this.email = email.trim().toLowerCase();
        this.senha = senha;
        this.perfil = perfil;
    }

    public getId(): string {
        return this.id;
    }

    public getNome(): string {
        return this.nome;
    }

    public getEmail(): string {
        return this.email;
    }

    public getSenha(): string {
        return this.senha;
    }

    public getPerfil(): PerfilUsuario {
        return this.perfil;
    }
}
