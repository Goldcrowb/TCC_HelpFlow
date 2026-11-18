import { Usuario } from './Usuario';

export interface SolicitacaoTecnico {
    id: string;
    nome: string;
    email: string;
    criadoEm: string;
}

export interface TecnicoAtivo {
    id: string;
    nome: string;
    email: string;
}

export type DecisaoTecnico = 'aprovar' | 'recusar';

export interface RepositorioUsuario {
    buscarPorEmail(email: string): Promise<Usuario | null>;
    listarTecnicosAtivos(): Promise<TecnicoAtivo[]>;
    buscarTecnicoAtivo(id: string): Promise<TecnicoAtivo | null>;
    cadastrar(usuario: Usuario): Promise<void>;
    listarSolicitacoesTecnicos(): Promise<SolicitacaoTecnico[]>;
    decidirSolicitacao(id: string, decisao: DecisaoTecnico, avaliadorId: string, motivo?: string): Promise<boolean>;
}
