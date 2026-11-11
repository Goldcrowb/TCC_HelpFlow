import { SupabaseClient } from '@supabase/supabase-js';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { DecisaoTecnico, RepositorioUsuario, SolicitacaoTecnico } from '../dominio/RepositorioUsuario';
import { SituacaoCadastro } from '../dominio/SituacaoCadastro';
import { Usuario } from '../dominio/Usuario';

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
