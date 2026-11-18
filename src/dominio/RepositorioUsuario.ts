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

export interface UsuarioGerenciado {
    id: string;
    nome: string;
    email: string;
    perfil: 'cliente' | 'tecnico';
    situacao: 'ativo' | 'pendente' | 'recusado';
}

export type ResultadoExclusao = 'excluido' | 'ausente' | 'protegido' | 'pendencias';

export type DecisaoTecnico = 'aprovar' | 'recusar';

export interface RepositorioUsuario {
    listarUsuarios(): Promise<UsuarioGerenciado[]>;
    excluirUsuario(id: string): Promise<ResultadoExclusao>;
    buscarPorEmail(email: string): Promise<Usuario | null>;
    listarTecnicosAtivos(): Promise<TecnicoAtivo[]>;
    buscarTecnicoAtivo(id: string): Promise<TecnicoAtivo | null>;
    cadastrar(usuario: Usuario): Promise<void>;
    listarSolicitacoesTecnicos(): Promise<SolicitacaoTecnico[]>;
    decidirSolicitacao(id: string, decisao: DecisaoTecnico, avaliadorId: string, motivo?: string): Promise<boolean>;
}
