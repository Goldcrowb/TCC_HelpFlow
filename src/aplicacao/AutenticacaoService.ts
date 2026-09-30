import { RepositorioUsuario } from '../dominio/RepositorioUsuario';
import { Usuario } from '../dominio/Usuario';

export class AutenticacaoService {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) {}

    public async autenticar(email: string, senha: string): Promise<Usuario | null> {
        const usuario = await this.repositorioUsuario.buscarPorEmail(email);
        if (!usuario || usuario.getSenha() !== senha) {
            return null;
        }
        return usuario;
    }
}
