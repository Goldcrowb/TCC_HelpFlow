import { randomUUID } from 'node:crypto';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { DecisaoTecnico, RepositorioUsuario } from '../dominio/RepositorioUsuario';
import { Usuario } from '../dominio/Usuario';
import { criarHashSenha } from './Senhas';

export class CadastroService {
    constructor(private readonly repositorio: RepositorioUsuario) {}

    async cadastrar(dados: { nome: string; email: string; senha: string; perfil: string }) {
        const nome = dados.nome.trim();
        const email = dados.email.trim().toLowerCase();
        if (nome.length < 3 || nome.length > 100) throw new DadoInvalidoException('Informe um nome entre 3 e 100 caracteres.');
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DadoInvalidoException('Informe um e-mail válido.');
        if (dados.senha.length < 10 || dados.senha.length > 128) throw new DadoInvalidoException('A senha deve ter entre 10 e 128 caracteres.');
        if (dados.perfil !== PerfilUsuario.CLIENTE && dados.perfil !== PerfilUsuario.TECNICO) {
            throw new DadoInvalidoException('Perfil inválido.');
        }
        const existente = await this.repositorio.buscarPorEmail(email);
        if (existente) throw new DadoInvalidoException('Este e-mail já está cadastrado.');
        const situacao = dados.perfil === PerfilUsuario.TECNICO ? 'pendente' : 'ativo';
        const usuario = new Usuario(randomUUID(), nome, email, await criarHashSenha(dados.senha), dados.perfil, situacao);
        await this.repositorio.cadastrar(usuario);
        return { perfil: usuario.getPerfil(), situacao: usuario.getSituacao() };
    }

    async listarSolicitacoes(avaliador: Usuario) {
        this.exigirTecnico(avaliador);
        return this.repositorio.listarSolicitacoesTecnicos();
    }

    async decidir(avaliador: Usuario, id: string, decisao: DecisaoTecnico, motivo?: string) {
        this.exigirTecnico(avaliador);
        if (decisao !== 'aprovar' && decisao !== 'recusar') throw new DadoInvalidoException('Decisão inválida.');
        if (id === avaliador.getId()) throw new DadoInvalidoException('Você não pode analisar seu próprio cadastro.');
        if (!id || id.length > 100) throw new DadoInvalidoException('Identificador inválido.');
        if (motivo && motivo.length > 500) throw new DadoInvalidoException('A justificativa deve ter até 500 caracteres.');
        const atualizado = await this.repositorio.decidirSolicitacao(id, decisao, avaliador.getId(), motivo?.trim());
        if (!atualizado) throw new DadoInvalidoException('Solicitação não encontrada ou já analisada.');
        return { situacao: decisao === 'aprovar' ? 'ativo' : 'recusado' };
    }

    private exigirTecnico(usuario: Usuario) {
        if (usuario.getPerfil() !== PerfilUsuario.TECNICO || usuario.getSituacao() !== 'ativo') {
            throw new DadoInvalidoException('Apenas técnicos aprovados podem analisar solicitações.');
        }
    }
}
