import { SupabaseClient } from '@supabase/supabase-js';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { DecisaoTecnico, RepositorioUsuario, SolicitacaoTecnico, TecnicoAtivo, UsuarioGerenciado, ResultadoExclusao } from '../dominio/RepositorioUsuario';
import { SituacaoCadastro } from '../dominio/SituacaoCadastro';
import { Usuario } from '../dominio/Usuario';
import { ID_TECNICO_INICIAL } from '../dominio/TecnicoInicial';

interface UsuarioRow {
    id: string; nome: string; email: string; senha_hash: string;
    perfil: PerfilUsuario; situacao: SituacaoCadastro;
    criado_em: string;
}

export class RepositorioUsuarioSupabase implements RepositorioUsuario {
    constructor(private readonly cliente: SupabaseClient) {}

    async buscarPorEmail(email: string): Promise<Usuario | null> {
        const { data, error } = await this.cliente.from('usuarios').select('*')
            .eq('email', email.trim().toLowerCase()).maybeSingle<UsuarioRow>();
        if (error) throw new Error(`Não foi possível consultar usuários: ${error.message}`);
        return data ? new Usuario(data.id, data.nome, data.email, data.senha_hash, data.perfil, data.situacao) : null;
    }

    async listarUsuarios(): Promise<UsuarioGerenciado[]> {
        const usuarios: UsuarioGerenciado[] = [];
        const tamanhoPagina = 500;
        for (let inicio = 0; ; inicio += tamanhoPagina) {
            const { data, error } = await this.cliente.from('usuarios')
                .select('id,nome,email,perfil,situacao').order('id')
                .range(inicio, inicio + tamanhoPagina - 1);
            if (error) throw new Error(`Não foi possível consultar usuários: ${error.message}`);
            usuarios.push(...(data ?? []));
            if (!data || data.length < tamanhoPagina) break;
        }
        return usuarios.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    async excluirUsuario(id: string): Promise<ResultadoExclusao> {
        if (id === ID_TECNICO_INICIAL) return 'protegido';
        const { data, error } = await this.cliente.rpc('excluir_usuario_helpflow', { usuario_id: id });
        if (error) throw new Error(`Não foi possível excluir o usuário: ${error.message}`);
        if (data !== 'excluido' && data !== 'ausente' && data !== 'protegido' && data !== 'pendencias') {
            throw new Error('Resposta inesperada ao excluir usuário.');
        }
        return data;
    }

    async listarTecnicosAtivos(): Promise<TecnicoAtivo[]> {
        const tecnicos: TecnicoAtivo[] = [];
        const tamanhoPagina = 500;
        for (let inicio = 0; ; inicio += tamanhoPagina) {
            const { data, error } = await this.cliente.from('usuarios').select('id,nome,email')
                .eq('perfil', 'tecnico').eq('situacao', 'ativo').order('id')
                .range(inicio, inicio + tamanhoPagina - 1);
            if (error) throw new Error(`Não foi possível consultar técnicos: ${error.message}`);
            tecnicos.push(...(data ?? []));
            if (!data || data.length < tamanhoPagina) break;
        }
        return tecnicos.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    async buscarTecnicoAtivo(id: string): Promise<TecnicoAtivo | null> {
        const { data, error } = await this.cliente.from('usuarios').select('id,nome,email')
            .eq('perfil', 'tecnico').eq('situacao', 'ativo').eq('id', id).maybeSingle<TecnicoAtivo>();
        if (error) throw new Error(`Não foi possível consultar o técnico: ${error.message}`);
        return data;
    }

    async cadastrar(usuario: Usuario): Promise<void> {
        const { error } = await this.cliente.from('usuarios').insert({
            id: usuario.getId(), nome: usuario.getNome(), email: usuario.getEmail(), senha_hash: usuario.getSenha(),
            perfil: usuario.getPerfil(), situacao: usuario.getSituacao()
        });
        if (error?.code === '23505') throw new DadoInvalidoException('Este e-mail já está cadastrado.');
        if (error) throw new Error(`Não foi possível salvar o cadastro: ${error.message}`);
    }

    async listarSolicitacoesTecnicos(): Promise<SolicitacaoTecnico[]> {
        const { data, error } = await this.cliente.from('usuarios')
            .select('id,nome,email,criado_em').eq('perfil', 'tecnico').eq('situacao', 'pendente')
            .order('criado_em', { ascending: true }).limit(100);
        if (error) throw new Error(`Não foi possível consultar solicitações: ${error.message}`);
        return (data || []).map((r) => ({ id: r.id, nome: r.nome, email: r.email, criadoEm: r.criado_em }));
    }

    async decidirSolicitacao(id: string, decisao: DecisaoTecnico, avaliadorId: string, motivo?: string): Promise<boolean> {
        // Apenas a primeira decisão é aceita; evita aprovação concorrente de um mesmo pedido.
        const { data, error } = await this.cliente.from('usuarios').update({
            situacao: decisao === 'aprovar' ? 'ativo' : 'recusado', avaliado_por: avaliadorId,
            avaliado_em: new Date().toISOString(), motivo_recusa: decisao === 'recusar' ? (motivo || null) : null
        }).eq('id', id).eq('perfil', 'tecnico').eq('situacao', 'pendente').select('id');
        if (error) throw new Error(`Não foi possível registrar decisão: ${error.message}`);
        return data?.length === 1;
    }
}
