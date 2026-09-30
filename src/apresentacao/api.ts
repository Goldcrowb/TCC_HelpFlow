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

const sessaoHeaders = (usuario: UsuarioSessao) => ({
    'Content-Type': 'application/json',
    'x-usuario-id': usuario.id,
    'x-usuario-perfil': usuario.perfil,
    'x-usuario-email': usuario.email
});

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
    const resposta = await fetch(url, init);
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
        throw new Error(dados.erro ?? 'Não foi possível concluir a operação.');
    }
    return dados as T;
}

export async function login(email: string, senha: string): Promise<UsuarioSessao> {
    const dados = await requisicao<{ usuario: UsuarioSessao }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });
    return dados.usuario;
}

export async function criarChamado(usuario: UsuarioSessao, titulo: string, descricao: string, categoria: string) {
    return requisicao<ChamadoView>('/api/chamados', {
        method: 'POST',
        headers: sessaoHeaders(usuario),
        body: JSON.stringify({ titulo, descricao, categoria })
    });
}

export async function listarMeusChamados(usuario: UsuarioSessao) {
    return requisicao<ChamadoView[]>('/api/chamados/meus', { headers: sessaoHeaders(usuario) });
}

export async function listarFila(usuario: UsuarioSessao) {
    return requisicao<ChamadoView[]>('/api/chamados/fila', { headers: sessaoHeaders(usuario) });
}

export async function detalhesChamado(usuario: UsuarioSessao, id: string) {
    return requisicao<{ chamado: ChamadoView; mensagens: { id: string; autorId: string; conteudo: string; dataEnvio: string }[] }>(
        `/api/chamados/${id}`,
        { headers: sessaoHeaders(usuario) }
    );
}

export async function atribuirChamado(usuario: UsuarioSessao, id: string) {
    return requisicao<ChamadoView>(`/api/chamados/${id}/atribuir`, {
        method: 'POST',
        headers: sessaoHeaders(usuario)
    });
}

export async function alterarStatus(usuario: UsuarioSessao, id: string, status: string) {
    return requisicao<ChamadoView>(`/api/chamados/${id}/status`, {
        method: 'PATCH',
        headers: sessaoHeaders(usuario),
        body: JSON.stringify({ status })
    });
}

export async function adicionarMensagem(usuario: UsuarioSessao, id: string, conteudo: string) {
    return requisicao(`/api/chamados/${id}/mensagens`, {
        method: 'POST',
        headers: sessaoHeaders(usuario),
        body: JSON.stringify({ conteudo })
    });
}
