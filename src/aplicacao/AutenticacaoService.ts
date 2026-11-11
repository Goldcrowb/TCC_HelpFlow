import { RepositorioUsuario } from '../dominio/RepositorioUsuario';
import { Usuario } from '../dominio/Usuario';
import { verificarSenha } from './Senhas';

export class AutenticacaoService {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) {}

    public async autenticar(email: string, senha: string): Promise<Usuario | null> {
        const usuario = await this.repositorioUsuario.buscarPorEmail(email);
        if (!usuario || !(await verificarSenha(senha, usuario.getSenha()))) {
            return null;
        }
        return usuario;
    }
}
