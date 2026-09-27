import { RepositorioChamado } from './RepositorioChamado';
import { Chamado } from './Chamado';
import { Mensagem } from './Mensagem';

export class RepositorioChamadoMemoria implements RepositorioChamado {
    private dados: Chamado[] = [];
    private mensagens: Mensagem[] = [];

    async salvar(chamado: Chamado): Promise<boolean> {
        const index = this.dados.findIndex(c => c.getId() === chamado.getId());
        if (index >= 0) {
            this.dados[index] = chamado;
        } else {
            this.dados.push(chamado);
        }
        return true;
    }

    async buscarPorId(id: string): Promise<Chamado | null> {
        return this.dados.find(c => c.getId() === id) || null;
    }

    async listarTodosAbertos(): Promise<Chamado[]> { 
        return []; 
    }
    
    async listarPorCliente(clienteId: string): Promise<Chamado[]> { 
        return []; 
    }
    
    async adicionarMensagem(chamadoId: string, mensagem: Mensagem): Promise<boolean> { 
        return true; 
    }
}