import { Usuario } from './Usuario';

export interface SolicitacaoTecnico {
    id: string;
    nome: string;
    email: string;
    criadoEm: string;
}

export type DecisaoTecnico = 'aprovar' | 'recusar';

export interface RepositorioUsuario {
    buscarPorEmail(email: string): Promise<Usuario | null>;
    cadastrar(usuario: Usuario): Promise<void>;
    listarSolicitacoesTecnicos(): Promise<SolicitacaoTecnico[]>;
    decidirSolicitacao(id: string, decisao: DecisaoTecnico, avaliadorId: string, motivo?: string): Promise<boolean>;
}
