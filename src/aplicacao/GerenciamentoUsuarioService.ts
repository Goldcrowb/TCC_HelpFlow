import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { RepositorioChamado } from '../dominio/RepositorioChamado';
import { RepositorioUsuario } from '../dominio/RepositorioUsuario';
import { StatusChamado } from '../dominio/StatusChamado';
import { ehTecnicoInicial, ID_TECNICO_INICIAL } from '../dominio/TecnicoInicial';
import { Usuario } from '../dominio/Usuario';

export class GerenciamentoUsuarioService {
    constructor(private readonly usuarios: RepositorioUsuario, private readonly chamados: RepositorioChamado) {}

    async listar(responsavel: Usuario) {
        this.exigirResponsavel(responsavel);
        return this.usuarios.listarUsuarios();
    }

    async excluir(responsavel: Usuario, id: string) {
        this.exigirResponsavel(responsavel);
        if (!id || id.length > 100) throw new DadoInvalidoException('Identificador inválido.');
        if (id === ID_TECNICO_INICIAL) throw new DadoInvalidoException('A conta do primeiro técnico não pode ser excluída.');
        const atendimentos = await this.chamados.listarPorTecnico(id);
        if (atendimentos.some(c => c.getStatus() !== StatusChamado.RESOLVIDO)) {
            throw new DadoInvalidoException('Transfira ou resolva os atendimentos em aberto antes de excluir este técnico.');
        }
        // No Supabase, a função SQL repete a verificação sem limite de registros, na mesma transação da exclusão.
        const resultado = await this.usuarios.excluirUsuario(id);
        if (resultado === 'pendencias') throw new DadoInvalidoException('Transfira ou resolva os atendimentos em aberto antes de excluir este técnico.');
        if (resultado === 'protegido') throw new DadoInvalidoException('A conta do primeiro técnico não pode ser excluída.');
        if (resultado === 'ausente') throw new DadoInvalidoException('Usuário não encontrado.');
        return { ok: true };
    }

    private exigirResponsavel(usuario: Usuario) {
        if (!ehTecnicoInicial(usuario)) throw new DadoInvalidoException('Usuário sem permissão para gerenciar contas.');
    }
}
