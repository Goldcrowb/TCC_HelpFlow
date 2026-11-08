import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import express, { NextFunction, Request, Response } from 'express';
import { AutenticacaoService } from '../aplicacao/AutenticacaoService';
import { ChamadoService } from '../aplicacao/ChamadoService';
import { CategoriaChamado } from '../dominio/CategoriaChamado';
import { DadoInvalidoException } from '../dominio/DadoInvalidoException';
import { PerfilUsuario } from '../dominio/PerfilUsuario';
import { StatusChamado } from '../dominio/StatusChamado';
import { Usuario } from '../dominio/Usuario';
import { RepositorioUsuarioMemoria } from '../persistencia/RepositorioUsuarioMemoria';
import { criarRepositorioChamado } from '../persistencia/indice';

// Aplicação demonstrativa: contas cadastradas previamente; os chamados e as mensagens
// ficam no banco compartilhado quando as credenciais do Supabase estão configuradas.
const producao = process.env.NODE_ENV === 'production';
if (producao && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    throw new Error('Defina SESSION_SECRET com pelo menos 32 caracteres na hospedagem.');
}
const chaveSessao = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const cookieNome = 'helpflow_sessao';
const validadeSessaoMs = 8 * 60 * 60 * 1000;
const PORT = Number(process.env.PORT ?? 3000);
const app = express();
const repositorioUsuario = new RepositorioUsuarioMemoria();
const autenticacaoService = new AutenticacaoService(repositorioUsuario);
const chamadoService = new ChamadoService(criarRepositorioChamado());

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Defesa CSRF: cookies SameSite=Strict + validação de origem em alterações.
app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origem = req.get('origin');
    if (!origem) return next(); // clientes sem Origin (ex.: curl); continuam precisando da sessão.
    try {
        const url = new URL(origem);
        const host = req.get('host')?.split(':')[0];
        const ehMesmoHost = url.hostname === host;
        const ehDev = !producao && url.hostname === 'localhost' && url.port === '5173';
        if (ehMesmoHost || ehDev) return next();
    } catch { /* Origem malformada */ }
    return res.status(403).json({ erro: 'Origem da requisição não autorizada.' });
});

interface DadosSessao { id: string; email: string; exp: number }
function emitirToken(usuario: Usuario): string {
    const conteudo = Buffer.from(JSON.stringify({
        id: usuario.getId(), email: usuario.getEmail(), exp: Date.now() + validadeSessaoMs
    } satisfies DadosSessao)).toString('base64url');
    const assinatura = createHmac('sha256', chaveSessao).update(conteudo).digest('base64url');
    return `${conteudo}.${assinatura}`;
}

export function validarToken(token: string): DadosSessao | null {
    const partes = token.split('.');
    if (partes.length !== 2 || partes[0].length > 2048 || partes[1].length > 256) return null;
    const assinaturaEsperada = createHmac('sha256', chaveSessao).update(partes[0]).digest();
    let assinaturaRecebida: Buffer;
    try { assinaturaRecebida = Buffer.from(partes[1], 'base64url'); } catch { return null; }
    if (assinaturaRecebida.length !== assinaturaEsperada.length ||
        !timingSafeEqual(assinaturaRecebida, assinaturaEsperada)) return null;
    try {
        const dados = JSON.parse(Buffer.from(partes[0], 'base64url').toString('utf8')) as DadosSessao;
        return typeof dados.id === 'string' && typeof dados.email === 'string' &&
            typeof dados.exp === 'number' && dados.exp > Date.now() ? dados : null;
    } catch { return null; }
}

function obterCookie(req: Request): string | undefined {
    const cabecalho = req.get('cookie') ?? '';
    const par = cabecalho.split(';').map((s) => s.trim())
        .find((s) => s.startsWith(`${cookieNome}=`));
    return par ? par.slice(cookieNome.length + 1) : undefined;
}

async function exigirUsuario(req: Request): Promise<Usuario> {
    const token = obterCookie(req);
    const dados = token ? validarToken(token) : null;
    if (!dados) throw new ErroHttp(401, 'Faça login para continuar.');
    const usuario = await repositorioUsuario.buscarPorEmail(dados.email);
    if (!usuario || usuario.getId() !== dados.id) throw new ErroHttp(401, 'Sessão inválida. Faça login novamente.');
    return usuario;
}

function resumoUsuario(usuario: Usuario) {
    return { id: usuario.getId(), nome: usuario.getNome(), email: usuario.getEmail(), perfil: usuario.getPerfil() };
}

class ErroHttp extends Error {
    constructor(public readonly status: number, mensagem: string) { super(mensagem); }
}
const tentativasLogin = new Map<string, { inicio: number; contador: number }>();
function limitarLogin(req: Request): void {
    const chave = req.ip || 'desconhecido';
    const agora = Date.now();
    if (tentativasLogin.size > 500) tentativasLogin.clear();
    const anterior = tentativasLogin.get(chave);
    const atual = !anterior || agora - anterior.inicio > 5 * 60_000
        ? { inicio: agora, contador: 0 } : anterior;
    atual.contador++;
    tentativasLogin.set(chave, atual);
    if (atual.contador > 30) throw new ErroHttp(429, 'Muitas tentativas de acesso. Tente novamente mais tarde.');
}

app.get('/api/saude', (_req, res) => res.json({ status: 'ok', projeto: 'HelpFlow', versao: '2.0.0' }));

app.post('/api/auth/login', async (req, res, next) => {
    try {
        limitarLogin(req);
        const usuario = await autenticacaoService.autenticar(String(req.body?.email ?? ''), String(req.body?.senha ?? ''));
        if (!usuario) throw new ErroHttp(401, 'E-mail ou senha inválidos.');
        res.cookie(cookieNome, emitirToken(usuario), {
            httpOnly: true, secure: producao, sameSite: 'strict', maxAge: validadeSessaoMs, path: '/'
        });
        return res.json({ usuario: resumoUsuario(usuario) });
    } catch (erro) { return next(erro); }
});

app.get('/api/auth/session', async (req, res, next) => {
    try { return res.json({ usuario: resumoUsuario(await exigirUsuario(req)) }); }
    catch (erro) { return next(erro); }
});

app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(cookieNome, { httpOnly: true, secure: producao, sameSite: 'strict', path: '/' });
    res.json({ ok: true });
});

app.post('/api/chamados', async (req, res, next) => {
    try {
        const usuario = await exigirUsuario(req);
        const chamado = await chamadoService.criarChamado(usuario, {
            titulo: String(req.body?.titulo ?? ''), descricao: String(req.body?.descricao ?? ''),
            categoria: req.body?.categoria as CategoriaChamado,
            operacaoId: req.body?.operacaoId
        });
        return res.status(201).json(serializarChamado(chamado));
    } catch (erro) { return next(erro); }
});

app.get('/api/chamados/meus', async (req, res, next) => {
    try { res.json((await chamadoService.listarChamadosDoCliente(await exigirUsuario(req))).map(serializarChamado)); }
    catch (erro) { next(erro); }
});

app.get('/api/chamados/fila', async (req, res, next) => {
    try { res.json((await chamadoService.listarFilaTecnico(await exigirUsuario(req))).map(serializarChamado)); }
    catch (erro) { next(erro); }
});

app.get('/api/chamados/atendimentos', async (req, res, next) => {
    try { res.json((await chamadoService.listarAtendimentosDoTecnico(await exigirUsuario(req))).map(serializarChamado)); }
    catch (erro) { next(erro); }
});

app.get('/api/chamados/:id', async (req, res, next) => {
    try {
        const usuario = await exigirUsuario(req);
        const resultado = await chamadoService.buscarDetalhes(usuario, String(req.params.id));
        res.json({ chamado: serializarChamado(resultado.chamado), mensagens: resultado.mensagens.map(serializarMensagem) });
    } catch (erro) { next(erro); }
});

app.post('/api/chamados/:id/atribuir', async (req, res, next) => {
    try { res.json(serializarChamado(await chamadoService.atribuirChamado(await exigirUsuario(req), String(req.params.id)))); }
    catch (erro) { next(erro); }
});

app.patch('/api/chamados/:id/status', async (req, res, next) => {
    try {
        res.json(serializarChamado(await chamadoService.alterarStatus(
            await exigirUsuario(req), String(req.params.id), req.body?.status as StatusChamado
        )));
    } catch (erro) { next(erro); }
});

app.post('/api/chamados/:id/mensagens', async (req, res, next) => {
    try {
        const usuario = await exigirUsuario(req);
        const mensagem = await chamadoService.adicionarMensagem(usuario, String(req.params.id),
            String(req.body?.conteudo ?? ''), req.body?.operacaoId);
        res.status(201).json(serializarMensagem(mensagem));
    } catch (erro) { next(erro); }
});

function serializarMensagem(mensagem: Awaited<ReturnType<ChamadoService['adicionarMensagem']>>) {
    return { id: mensagem.getId(), autorId: mensagem.getAutorId(), conteudo: mensagem.getConteudo(), dataEnvio: mensagem.getDataEnvio().toISOString() };
}

function serializarChamado(chamado: Awaited<ReturnType<ChamadoService['criarChamado']>>) {
    return {
        id: chamado.getId(), clienteId: chamado.getClienteId(), titulo: chamado.getTitulo(),
        descricao: chamado.getDescricao(), categoria: chamado.getCategoria(),
        dataAbertura: chamado.getDataAbertura().toISOString(), status: chamado.getStatus(),
        tecnicoResponsavelId: chamado.getTecnicoResponsavelId(), versao: chamado.getVersao()
    };
}

app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota da API não encontrada.' }));

const caminhoWeb = path.resolve(__dirname, '../../web');
if (fs.existsSync(path.join(caminhoWeb, 'index.html'))) {
    app.use(express.static(caminhoWeb));
    app.get(/.*/, (req, res, next) => {
        if (!req.accepts('html')) return next();
        return res.sendFile(path.join(caminhoWeb, 'index.html'));
    });
}

app.use((_req, res) => res.status(404).json({ erro: 'Página não encontrada.' }));
app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof ErroHttp) return res.status(erro.status).json({ erro: erro.message });
    if (erro instanceof SyntaxError && 'body' in erro) {
        return res.status(400).json({ erro: 'Corpo JSON inválido.' });
    }
    if (erro instanceof DadoInvalidoException) {
        const mensagem = erro.message;
        const status = /já foi (modificado|alterado|atribuído)|outro técnico/i.test(mensagem) ? 409
            : /sem permissão|assuma o chamado|apenas usuários técnicos/i.test(mensagem) ? 403
            : /não encontrado/i.test(mensagem) ? 404 : 400;
        return res.status(status).json({ erro: mensagem });
    }
    console.error('Erro interno na API:', erro);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente ou consulte o responsável pela demonstração.' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`HelpFlow iniciado na porta ${PORT}`);
        console.log(process.env.SUPABASE_URL ? 'Persistência: Supabase' : 'Persistência: memória (não persistente)');
    });
}
export { app };
