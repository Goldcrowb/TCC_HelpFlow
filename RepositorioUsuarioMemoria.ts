import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { RepositorioUsuario } from '../dominio/RepositorioUsuario';
import { Usuario } from '../dominio/Usuario';

export class RepositorioUsuarioMemoria implements RepositorioUsuario {
    private readonly usuarios = new Map<string, Usuario>();

    constructor() {
        this.adicionarUsuario(new Usuario('CLI-01', 'Cliente Demonstração', 'cliente@helpflow.local', '123456', PerfilUsuario.CLIENTE));
        this.adicionarUsuario(new Usuario('CLI-02', 'Cliente Teste', 'cliente2@helpflow.local', '123456', PerfilUsuario.CLIENTE));
        this.adicionarUsuario(new Usuario('TEC-01', 'Técnico Demonstração', 'tecnico@helpflow.local', '123456', PerfilUsuario.TECNICO));
        this.adicionarUsuario(new Usuario('TEC-02', 'Técnico Teste', 'tecnico2@helpflow.local', '123456', PerfilUsuario.TECNICO));
    }

    private adicionarUsuario(usuario: Usuario): void {
        this.usuarios.set(usuario.getEmail(), usuario);
    }

    async buscarPorEmail(email: string): Promise<Usuario | null> {
        return this.usuarios.get(email.trim().toLowerCase()) ?? null;
    }
}
