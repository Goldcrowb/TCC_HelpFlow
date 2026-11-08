import { Usuario } from './Usuario';

export interface RepositorioUsuario {
    buscarPorEmail(email: string): Promise<Usuario | null>;
}
