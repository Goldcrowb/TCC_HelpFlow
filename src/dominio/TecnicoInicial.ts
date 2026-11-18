import { PerfilUsuario } from './PerfilUsuario';
import { Usuario } from './Usuario';

// O identificador é reservado à conta criada na configuração inicial da aplicação.
export const ID_TECNICO_INICIAL = 'TEC-01';

export function ehTecnicoInicial(usuario: Usuario): boolean {
    return usuario.getId() === ID_TECNICO_INICIAL &&
        usuario.getPerfil() === PerfilUsuario.TECNICO && usuario.getSituacao() === 'ativo';
}
