import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { DecisaoTecnico, RepositorioUsuario, SolicitacaoTecnico } from '../dominio/RepositorioUsuario';
import { Usuario } from '../dominio/Usuario';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';

// Repositório local para testes e execução sem Supabase. Não serve para contas reais.
export class RepositorioUsuarioMemoria implements RepositorioUsuario {
    private readonly usuarios = new Map<string, Usuario>();
    private readonly datas = new Map<string, string>();

    constructor() {
        this.inserirDemo(new Usuario('CLI-01', 'Cliente Demonstração', 'cliente@helpflow.local', '123456', PerfilUsuario.CLIENTE));
        this.inserirDemo(new Usuario('CLI-02', 'Cliente Teste', 'cliente2@helpflow.local', '123456', PerfilUsuario.CLIENTE));
        this.inserirDemo(new Usuario('TEC-01', 'Técnico Demonstração', 'tecnico@helpflow.local', '123456', PerfilUsuario.TECNICO));
        this.inserirDemo(new Usuario('TEC-02', 'Técnico Teste', 'tecnico2@helpflow.local', '123456', PerfilUsuario.TECNICO));
    }

    private inserirDemo(usuario: Usuario) { this.usuarios.set(usuario.getEmail(), usuario); this.datas.set(usuario.getId(), new Date().toISOString()); }
    async buscarPorEmail(email: string): Promise<Usuario | null> { return this.usuarios.get(email.trim().toLowerCase()) ?? null; }
    async cadastrar(usuario: Usuario): Promise<void> {
        if (this.usuarios.has(usuario.getEmail())) throw new DadoInvalidoException('Este e-mail já está cadastrado.');
        this.inserirDemo(usuario);
    }
    async listarSolicitacoesTecnicos(): Promise<SolicitacaoTecnico[]> {
        return [...this.usuarios.values()].filter(u => u.getPerfil() === 'tecnico' && u.getSituacao() === 'pendente')
            .map(u => ({ id: u.getId(), nome: u.getNome(), email: u.getEmail(), criadoEm: this.datas.get(u.getId()) || '' }));
    }
    async decidirSolicitacao(id: string, decisao: DecisaoTecnico, _avaliadorId: string, _motivo?: string): Promise<boolean> {
        const atual = [...this.usuarios.values()].find(u => u.getId() === id && u.getPerfil() === 'tecnico' && u.getSituacao() === 'pendente');
        if (!atual) return false;
        this.usuarios.set(atual.getEmail(), new Usuario(atual.getId(), atual.getNome(), atual.getEmail(), atual.getSenha(), atual.getPerfil(), decisao === 'aprovar' ? 'ativo' : 'recusado'));
        return true;
    }
}
