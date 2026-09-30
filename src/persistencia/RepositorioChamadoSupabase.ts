import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CategoriaChamado } from '../dominio/CategoriaChamado';
import { Chamado } from '../dominio/Chamado';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { Mensagem } from '../dominio/Mensagem';
import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { StatusChamado } from '../dominio/StatusChamado';

interface ChamadoRow {
    id: string;
    cliente_id: string;
    titulo: string;
    descricao: string;
    categoria: CategoriaChamado;
    data_abertura: string;
    status: StatusChamado;
    tecnico_id: string | null;
    versao: number;
}

interface MensagemRow {
    id: string;
    chamado_id: string;
    autor_id: string;
    conteudo: string;
    data_envio: string;
}

export class RepositorioChamadoSupabase implements RepositorioChamado {
    constructor(private readonly cliente: SupabaseClient) {}

    async salvar(chamado: Chamado): Promise<boolean> {
        const payload = {
            id: chamado.getId(),
            cliente_id: chamado.getClienteId(),
            titulo: chamado.getTitulo(),
            descricao: chamado.getDescricao(),
            categoria: chamado.getCategoria(),
            data_abertura: chamado.getDataAbertura().toISOString(),
            status: chamado.getStatus(),
            tecnico_id: chamado.getTecnicoResponsavelId(),
            versao: chamado.getVersao()
        };

        if (chamado.getVersao() === 1) {
            const { error } = await this.cliente.from('chamados').insert(payload);
            if (error) {
                throw new DadoInvalidoException(`Erro ao criar chamado: ${error.message}`);
            }
            return true;
        }

        const versaoAnterior = chamado.getVersao() - 1;
        const { data, error } = await this.cliente
            .from('chamados')
            .update(payload)
            .eq('id', chamado.getId())
            .eq('versao', versaoAnterior)
            .select('id');

        if (error) {
            throw new DadoInvalidoException(`Erro ao atualizar chamado: ${error.message}`);
        }

        return Array.isArray(data) && data.length === 1;
    }

    async buscarPorId(id: string): Promise<Chamado | null> {
        const { data, error } = await this.cliente.from('chamados').select('*').eq('id', id).maybeSingle<ChamadoRow>();
        if (error) {
            throw new DadoInvalidoException(`Erro ao buscar chamado: ${error.message}`);
        }
        return data ? this.converterChamado(data) : null;
    }

    async listarTodosAbertos(): Promise<Chamado[]> {
        const { data, error } = await this.cliente
            .from('chamados')
            .select('*')
            .eq('status', StatusChamado.ABERTO)
            .order('data_abertura', { ascending: true })
            .limit(500);

        if (error) {
            throw new DadoInvalidoException(`Erro ao listar fila: ${error.message}`);
        }
        return (data as ChamadoRow[]).map((row) => this.converterChamado(row));
    }

    async listarPorCliente(clienteId: string): Promise<Chamado[]> {
        const { data, error } = await this.cliente
            .from('chamados')
            .select('*')
            .eq('cliente_id', clienteId)
            .order('data_abertura', { ascending: false });

        if (error) {
            throw new DadoInvalidoException(`Erro ao listar chamados do cliente: ${error.message}`);
        }
        return (data as ChamadoRow[]).map((row) => this.converterChamado(row));
    }

    async adicionarMensagem(chamadoId: string, mensagem: Mensagem): Promise<boolean> {
        const payload = {
            id: mensagem.getId(),
            chamado_id: chamadoId,
            autor_id: mensagem.getAutorId(),
            conteudo: mensagem.getConteudo(),
            data_envio: mensagem.getDataEnvio().toISOString()
        };
        const { error } = await this.cliente.from('mensagens').insert(payload);
        if (error) {
            throw new DadoInvalidoException(`Erro ao salvar mensagem: ${error.message}`);
        }
        return true;
    }

    async listarMensagens(chamadoId: string): Promise<Mensagem[]> {
        const { data, error } = await this.cliente
            .from('mensagens')
            .select('*')
            .eq('chamado_id', chamadoId)
            .order('data_envio', { ascending: true })
            .limit(50);

        if (error) {
            throw new DadoInvalidoException(`Erro ao listar mensagens: ${error.message}`);
        }
        return (data as MensagemRow[]).map((row) => Mensagem.reidratar({
            id: row.id,
            autorId: row.autor_id,
            conteudo: row.conteudo,
            dataEnvio: new Date(row.data_envio)
        }));
    }

    private converterChamado(row: ChamadoRow): Chamado {
        return Chamado.reidratar({
            id: row.id,
            clienteId: row.cliente_id,
            titulo: row.titulo,
            descricao: row.descricao,
            categoria: row.categoria,
            dataAbertura: new Date(row.data_abertura),
            status: row.status,
            tecnicoResponsavelId: row.tecnico_id,
            versao: row.versao
        });
    }
}

export function criarClienteSupabase(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_ANON_KEY;

    if (!url || !chave) {
        throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem ser configuradas.');
    }

    return createClient(url, chave);
}
