import { adicionarMensagem, criarChamado, ehFalhaDeRede, UsuarioSessao } from './api';

// Apenas operações sem conflitos são enfileiradas. Mudanças de status e atribuição
// exigem conexão para preservar o bloqueio otimista do banco compartilhado.
export type OperacaoPendente = (
    | { tipo: 'chamado'; titulo: string; descricao: string; categoria: string }
    | { tipo: 'mensagem'; chamadoId: string; conteudo: string }
) & { id: string; usuarioId: string; criadoEm: string; erro?: string };
const chave = 'helpflow_operacoes_pendentes_v1';
const evento = 'helpflow-fila-atualizada';

export function lerPendencias(usuarioId?: string): OperacaoPendente[] {
    try {
        const todos = JSON.parse(localStorage.getItem(chave) || '[]') as OperacaoPendente[];
        if (!Array.isArray(todos)) return [];
        const validos = todos.filter((item) => item && typeof item.id === 'string' && typeof item.usuarioId === 'string');
        return usuarioId ? validos.filter((item) => item.usuarioId === usuarioId) : validos;
    } catch { return []; }
}
function salvar(todos: OperacaoPendente[]) {
    localStorage.setItem(chave, JSON.stringify(todos));
    window.dispatchEvent(new Event(evento));
}
export function eventoPendencias() { return evento; }
export function adicionarPendente(operacao: OperacaoPendente) {
    const todos = lerPendencias();
    if (!todos.some((item) => item.id === operacao.id)) salvar([...todos, operacao]);
}
export function descartarPendente(id: string, usuarioId: string) {
    salvar(lerPendencias().filter((item) => item.id !== id || item.usuarioId !== usuarioId));
}
let sincronizacaoEmCurso: Promise<{ enviados: number; pendentes: number }> | null = null;
export function sincronizarPendencias(usuario: UsuarioSessao) {
    if (sincronizacaoEmCurso) return sincronizacaoEmCurso;
    sincronizacaoEmCurso = (async () => {
        let enviados = 0;
        for (const pendente of lerPendencias(usuario.id)) {
            if (pendente.erro) continue; // erro funcional: requer correção ou descarte manual
            try {
                if (pendente.tipo === 'chamado') {
                    await criarChamado(usuario, pendente.titulo, pendente.descricao, pendente.categoria, pendente.id);
                } else {
                    await adicionarMensagem(usuario, pendente.chamadoId, pendente.conteudo, pendente.id);
                }
                descartarPendente(pendente.id, usuario.id);
                enviados++;
            } catch (erro) {
                if (ehFalhaDeRede(erro)) break;
                const todos = lerPendencias();
                const item = todos.find((op) => op.id === pendente.id);
                if (item) {
                    item.erro = erro instanceof Error ? erro.message : 'Não foi possível enviar.';
                    salvar(todos);
                }
            }
        }
        return { enviados, pendentes: lerPendencias(usuario.id).length };
    })().finally(() => { sincronizacaoEmCurso = null; });
    return sincronizacaoEmCurso;
}
