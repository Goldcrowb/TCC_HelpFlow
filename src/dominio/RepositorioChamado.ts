// Camada de domínio: declaração do contrato de persistência
import { Chamado } from './Chamado';
import { Mensagem } from './Mensagem';

export interface RepositorioChamado {
    // Gravação e recuperação
    salvar(chamado: Chamado): Promise<boolean>;
    buscarPorId(id: string): Promise<Chamado | null>;
    
    // Consultas específicas para as regras de negócio
    listarTodosAbertos(): Promise<Chamado[]>;
    listarPorCliente(clienteId: string): Promise<Chamado[]>;
    
    // Histórico
    adicionarMensagem(chamadoId: string, mensagem: Mensagem): Promise<boolean>;
}
