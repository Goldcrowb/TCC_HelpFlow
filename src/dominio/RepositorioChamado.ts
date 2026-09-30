import { Chamado } from './Chamado';
import { Mensagem } from './Mensagem';

export interface RepositorioChamado {
    salvar(chamado: Chamado): Promise<boolean>;
    buscarPorId(id: string): Promise<Chamado | null>;
    listarTodosAbertos(): Promise<Chamado[]>;
    listarPorCliente(clienteId: string): Promise<Chamado[]>;
    adicionarMensagem(chamadoId: string, mensagem: Mensagem): Promise<boolean>;
    listarMensagens(chamadoId: string): Promise<Mensagem[]>;
}
