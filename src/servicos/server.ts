import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { AutenticacaoService } from '../aplicacao/AutenticacaoService';
import { ChamadoService } from '../aplicacao/ChamadoService';
import { CategoriaChamado } from '../dominio/CategoriaChamado';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { StatusChamado } from '../dominio/StatusChamado';
import { RepositorioUsuarioMemoria } from '../persistencia/RepositorioUsuarioMemoria';
import { criarRepositorioChamado } from '../persistencia/indice';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const repositorioUsuario = new RepositorioUsuarioMemoria();
const autenticacaoService = new AutenticacaoService(repositorioUsuario);
const chamadoService = new ChamadoService(criarRepositorioChamado());

app.use(cors());
app.use(express.json());

app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok', projeto: 'HelpFlow' });
});

app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        const usuario = await autenticacaoService.autenticar(String(email ?? ''), String(senha ?? ''));
        if (!usuario) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        return res.json({
            usuario: {
                id: usuario.getId(),
                nome: usuario.getNome(),
                email: usuario.getEmail(),
                perfil: usuario.getPerfil()
            }
        });
    } catch (erro) {
        return next(erro);
    }
});

app.post('/api/chamados', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const chamado = await chamadoService.criarChamado(usuario, {
            titulo: String(req.body.titulo ?? ''),
            descricao: String(req.body.descricao ?? ''),
            categoria: req.body.categoria as CategoriaChamado
        });
        return res.status(201).json(serializarChamado(chamado));
    } catch (erro) {
        return next(erro);
    }
});

app.get('/api/chamados/meus', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const chamados = await chamadoService.listarChamadosDoCliente(usuario);
        return res.json(chamados.map(serializarChamado));
    } catch (erro) {
        return next(erro);
    }
});

app.get('/api/chamados/fila', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const chamados = await chamadoService.listarFilaTecnico(usuario);
        return res.json(chamados.map(serializarChamado));
    } catch (erro) {
        return next(erro);
    }
});

app.get('/api/chamados/:id', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const resultado = await chamadoService.buscarDetalhes(usuario, req.params.id);
        return res.json({
            chamado: serializarChamado(resultado.chamado),
            mensagens: resultado.mensagens.map((mensagem) => ({
                id: mensagem.getId(),
                autorId: mensagem.getAutorId(),
                conteudo: mensagem.getConteudo(),
                dataEnvio: mensagem.getDataEnvio().toISOString()
            }))
        });
    } catch (erro) {
        return next(erro);
    }
});

app.post('/api/chamados/:id/atribuir', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const chamado = await chamadoService.atribuirChamado(usuario, req.params.id);
        return res.json(serializarChamado(chamado));
    } catch (erro) {
        return next(erro);
    }
});

app.patch('/api/chamados/:id/status', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const chamado = await chamadoService.alterarStatus(usuario, req.params.id, req.body.status as StatusChamado);
        return res.json(serializarChamado(chamado));
    } catch (erro) {
        return next(erro);
    }
});

app.post('/api/chamados/:id/mensagens', async (req, res, next) => {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        const mensagem = await chamadoService.adicionarMensagem(usuario, req.params.id, String(req.body.conteudo ?? ''));
        return res.status(201).json({
            id: mensagem.getId(),
            autorId: mensagem.getAutorId(),
            conteudo: mensagem.getConteudo(),
            dataEnvio: mensagem.getDataEnvio().toISOString()
        });
    } catch (erro) {
        return next(erro);
    }
});

app.use((_req, res) => {
    res.status(404).json({ erro: 'Recurso não encontrado.' });
});

app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado.';
    const status = erro instanceof DadoInvalidoException ? 400 : 500;
    res.status(status).json({ erro: mensagem });
});

function obterUsuarioDaRequisicao(req: Request) {
    const id = String(req.header('x-usuario-id') ?? '');
    const perfil = String(req.header('x-usuario-perfil') ?? '');
    const email = String(req.header('x-usuario-email') ?? '');

    if (!id || !email || !Object.values(PerfilUsuario).includes(perfil as PerfilUsuario)) {
        throw new DadoInvalidoException('Usuário não autenticado.');
    }

    return repositorioUsuario.buscarPorEmail(email).then((usuario) => {
        if (!usuario || usuario.getId() !== id || usuario.getPerfil() !== perfil) {
            throw new DadoInvalidoException('Usuário não autenticado.');
        }
        return usuario;
    });
}

function serializarChamado(chamado: ReturnType<ChamadoService['criarChamado']> extends Promise<infer T> ? T : never) {
    return {
        id: chamado.getId(),
        clienteId: chamado.getClienteId(),
        titulo: chamado.getTitulo(),
        descricao: chamado.getDescricao(),
        categoria: chamado.getCategoria(),
        dataAbertura: chamado.getDataAbertura().toISOString(),
        status: chamado.getStatus(),
        tecnicoResponsavelId: chamado.getTecnicoResponsavelId(),
        versao: chamado.getVersao()
    };
}

app.listen(PORT, () => {
    console.log(`HelpFlow API executando em http://localhost:${PORT}`);
    console.log(process.env.SUPABASE_URL ? 'Persistência: Supabase' : 'Persistência: memória (modo desenvolvimento)');
});
