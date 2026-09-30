import { Chamado } from '../dominio/Chamado';
import { Mensagem } from '../dominio/Mensagem';
import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { StatusChamado } from '../dominio/StatusChamado';

export class RepositorioChamadoMemoria implements RepositorioChamado {
    private readonly dados: Chamado[] = [];
    private readonly mensagens = new Map<string, Mensagem[]>();

    async salvar(chamado: Chamado): Promise<boolean> {
        const index = this.dados.findIndex((item) => item.getId() === chamado.getId());

        if (index < 0) {
            this.dados.push(chamado);
            return true;
        }

        const atual = this.dados[index];
        const versaoEsperada = chamado.getVersao() - 1;
        if (atual.getVersao() !== versaoEsperada) {
            return false;
        }

        this.dados[index] = chamado;
        return true;
    }

    async buscarPorId(id: string): Promise<Chamado | null> {
        const chamado = this.dados.find((item) => item.getId() === id);
        return chamado ? this.clonarChamado(chamado) : null;
    }

    async listarTodosAbertos(): Promise<Chamado[]> {
        return this.dados
            .filter((chamado) => chamado.getStatus() === StatusChamado.ABERTO)
            .sort((a, b) => a.getDataAbertura().getTime() - b.getDataAbertura().getTime())
            .map((chamado) => this.clonarChamado(chamado));
    }

    async listarPorCliente(clienteId: string): Promise<Chamado[]> {
        return this.dados
            .filter((chamado) => chamado.getClienteId() === clienteId)
            .sort((a, b) => b.getDataAbertura().getTime() - a.getDataAbertura().getTime())
            .map((chamado) => this.clonarChamado(chamado));
    }

    async adicionarMensagem(chamadoId: string, mensagem: Mensagem): Promise<boolean> {
        const chamadoExiste = this.dados.some((chamado) => chamado.getId() === chamadoId);
        if (!chamadoExiste) {
            return false;
        }

        const lista = this.mensagens.get(chamadoId) ?? [];
        lista.push(mensagem);
        this.mensagens.set(chamadoId, lista);
        return true;
    }

    async listarMensagens(chamadoId: string): Promise<Mensagem[]> {
        return [...(this.mensagens.get(chamadoId) ?? [])]
            .sort((a, b) => a.getDataEnvio().getTime() - b.getDataEnvio().getTime())
            .map((mensagem) => Mensagem.reidratar({
                id: mensagem.getId(),
                autorId: mensagem.getAutorId(),
                conteudo: mensagem.getConteudo(),
                dataEnvio: mensagem.getDataEnvio()
            }));
    }

    private clonarChamado(chamado: Chamado): Chamado {
        return Chamado.reidratar({
            id: chamado.getId(),
            clienteId: chamado.getClienteId(),
            titulo: chamado.getTitulo(),
            descricao: chamado.getDescricao(),
            categoria: chamado.getCategoria(),
            dataAbertura: chamado.getDataAbertura(),
            status: chamado.getStatus(),
            tecnicoResponsavelId: chamado.getTecnicoResponsavelId(),
            versao: chamado.getVersao()
        });
    }
}
