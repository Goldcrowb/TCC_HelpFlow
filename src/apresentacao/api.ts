export interface UsuarioSessao {
    id: string;
    nome: string;
    email: string;
    perfil: 'cliente' | 'tecnico';
}
export interface ChamadoView {
    id: string;
    clienteId: string;
    titulo: string;
    descricao: string;
    categoria: string;
    dataAbertura: string;
    status: string;
    tecnicoResponsavelId: string | null;
    versao: number;
}
export interface MensagemView { id: string; autorId: string; conteudo: string; dataEnvio: string }
export interface DetalhesChamado { chamado: ChamadoView; mensagens: MensagemView[] }

export class ErroApi extends Error {
    constructor(mensagem: string, public readonly status: number) { super(mensagem); }
}

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
    let resposta: Response;
    try {
        resposta = await fetch(url, {
            credentials: 'same-origin',
            ...init,
            headers: { ...(!['GET', 'HEAD'].includes(init?.method ?? 'GET') ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
            signal: AbortSignal.timeout(90_000) // o plano gratuito pode demorar a iniciar
        });
    } catch {
        throw new ErroApi('Sem conexão com o servidor. Tente novamente quando estiver online.', 0);
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new ErroApi(dados.erro ?? 'Não foi possível concluir a operação.', resposta.status);
    return dados as T;
}

export function ehFalhaDeRede(erro: unknown): boolean { return erro instanceof ErroApi && erro.status === 0; }
export async function login(email: string, senha: string) {
    return (await requisicao<{ usuario: UsuarioSessao }>('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email, senha })
    })).usuario;
}
export async function consultarSessao() {
    return (await requisicao<{ usuario: UsuarioSessao }>('/api/auth/session')).usuario;
}
export async function logout() { await requisicao('/api/auth/logout', { method: 'POST' }); }
export async function criarChamado(_usuario: UsuarioSessao, titulo: string, descricao: string, categoria: string, operacaoId: string = crypto.randomUUID()) {
    return requisicao<ChamadoView>('/api/chamados', {
        method: 'POST', body: JSON.stringify({ titulo, descricao, categoria, operacaoId })
    });
}
export async function listarMeusChamados(_usuario: UsuarioSessao) { return requisicao<ChamadoView[]>('/api/chamados/meus'); }
export async function listarFila(_usuario: UsuarioSessao) { return requisicao<ChamadoView[]>('/api/chamados/fila'); }
export async function listarAtendimentos(_usuario: UsuarioSessao) { return requisicao<ChamadoView[]>('/api/chamados/atendimentos'); }
export async function detalhesChamado(_usuario: UsuarioSessao, id: string) {
    return requisicao<DetalhesChamado>(`/api/chamados/${encodeURIComponent(id)}`);
}
export async function atribuirChamado(_usuario: UsuarioSessao, id: string) {
    return requisicao<ChamadoView>(`/api/chamados/${encodeURIComponent(id)}/atribuir`, { method: 'POST' });
}
export async function alterarStatus(_usuario: UsuarioSessao, id: string, status: string) {
    return requisicao<ChamadoView>(`/api/chamados/${encodeURIComponent(id)}/status`, {
        method: 'PATCH', body: JSON.stringify({ status })
    });
}
export async function adicionarMensagem(_usuario: UsuarioSessao, id: string, conteudo: string, operacaoId: string = crypto.randomUUID()) {
    return requisicao<MensagemView>(`/api/chamados/${encodeURIComponent(id)}/mensagens`, {
        method: 'POST', body: JSON.stringify({ conteudo, operacaoId })
    });
}
