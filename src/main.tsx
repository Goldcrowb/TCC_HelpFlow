import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    adicionarMensagem,
    alterarStatus,
    atribuirChamado,
    ChamadoView,
    criarChamado,
    detalhesChamado,
    listarFila,
    listarMeusChamados,
    login,
    UsuarioSessao
} from './api';
import './styles.css';

const categorias = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outros'];
const status = ['Aberto', 'Em Andamento', 'Resolvido'];

function App() {
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(() => {
        const salvo = localStorage.getItem('helpflow_usuario');
        return salvo ? JSON.parse(salvo) : null;
    });
    const [erro, setErro] = useState('');

    function entrar(novoUsuario: UsuarioSessao) {
        localStorage.setItem('helpflow_usuario', JSON.stringify(novoUsuario));
        setUsuario(novoUsuario);
        setErro('');
    }

    function sair() {
        localStorage.removeItem('helpflow_usuario');
        setUsuario(null);
    }

    if (!usuario) {
        return <Login onLogin={entrar} onError={setErro} erro={erro} />;
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div>
                    <strong>HelpFlow</strong>
                    <span>Central de Suporte Técnico</span>
                </div>
                <div className="user-area">
                    <span>{usuario.nome} · {usuario.perfil === 'cliente' ? 'Cliente' : 'Técnico'}</span>
                    <button className="secondary" onClick={sair}>Sair</button>
                </div>
            </header>
            {usuario.perfil === 'cliente'
                ? <ClienteDashboard usuario={usuario} onError={setErro} />
                : <TecnicoDashboard usuario={usuario} onError={setErro} />}
            {erro && <div className="toast error">{erro}<button onClick={() => setErro('')}>×</button></div>}
        </div>
    );
}

function Login({ onLogin, onError, erro }: { onLogin: (u: UsuarioSessao) => void; onError: (msg: string) => void; erro: string }) {
    const [email, setEmail] = useState('cliente@helpflow.local');
    const [senha, setSenha] = useState('123456');
    const [carregando, setCarregando] = useState(false);

    async function enviar(event: FormEvent) {
        event.preventDefault();
        setCarregando(true);
        onError('');
        try {
            onLogin(await login(email, senha));
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Falha no login.');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <h1>HelpFlow</h1>
                <p>Atendimento de suporte técnico centralizado.</p>
                <form onSubmit={enviar} className="form-grid">
                    <label>E-mail<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                    <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
                    <button disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
                </form>
                {erro && <p className="inline-error">{erro}</p>}
                <small>Demo: cliente@helpflow.local / 123456 · tecnico@helpflow.local / 123456</small>
            </section>
        </main>
    );
}

function ClienteDashboard({ usuario, onError }: { usuario: UsuarioSessao; onError: (msg: string) => void }) {
    const [chamados, setChamados] = useState<ChamadoView[]>([]);
    const [selecionado, setSelecionado] = useState<string | null>(null);

    async function carregar() {
        try {
            setChamados(await listarMeusChamados(usuario));
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Falha ao carregar chamados.');
        }
    }

    useEffect(() => { void carregar(); }, []);

    async function criar(titulo: string, descricao: string, categoria: string) {
        try {
            await criarChamado(usuario, titulo, descricao, categoria);
            await carregar();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Falha ao criar chamado.');
        }
    }

    return (
        <main className="content">
            <div className="page-heading"><div><h2>Meus chamados</h2><p>Acompanhe solicitações e converse com o suporte.</p></div><NovoChamadoForm onCreate={criar} /></div>
            <div className="cards">
                {chamados.length === 0 && <div className="empty">Nenhum chamado cadastrado ainda.</div>}
                {chamados.map((chamado) => <ChamadoCard key={chamado.id} chamado={chamado} onClick={() => setSelecionado(chamado.id)} />)}
            </div>
            {selecionado && <Detalhes usuario={usuario} id={selecionado} onClose={() => setSelecionado(null)} onError={onError} />}
        </main>
    );
}

function NovoChamadoForm({ onCreate }: { onCreate: (t: string, d: string, c: string) => Promise<void> }) {
    const [aberto, setAberto] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState(categorias[0]);

    async function enviar(event: FormEvent) {
        event.preventDefault();
        await onCreate(titulo, descricao, categoria);
        setTitulo(''); setDescricao(''); setCategoria(categorias[0]); setAberto(false);
    }

    if (!aberto) return <button onClick={() => setAberto(true)}>+ Novo chamado</button>;
    return <form className="new-ticket" onSubmit={enviar}>
        <input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>{categorias.map((c) => <option key={c}>{c}</option>)}</select>
        <textarea placeholder="Descreva o problema" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
        <div><button type="submit">Criar</button><button type="button" className="secondary" onClick={() => setAberto(false)}>Cancelar</button></div>
    </form>;
}

function TecnicoDashboard({ usuario, onError }: { usuario: UsuarioSessao; onError: (msg: string) => void }) {
    const [chamados, setChamados] = useState<ChamadoView[]>([]);
    const [selecionado, setSelecionado] = useState<string | null>(null);

    async function carregar() {
        try {
            setChamados(await listarFila(usuario));
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Falha ao carregar fila.');
        }
    }

    useEffect(() => { void carregar(); }, []);

    async function assumir(id: string) {
        try {
            await atribuirChamado(usuario, id);
            await carregar();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Falha ao atribuir chamado.');
        }
    }

    return <main className="content">
        <div className="page-heading"><div><h2>Fila geral</h2><p>Chamados abertos aguardando atendimento.</p></div><button className="secondary" onClick={() => void carregar()}>Atualizar</button></div>
        <div className="cards">
            {chamados.length === 0 && <div className="empty">Não há chamados abertos na fila.</div>}
            {chamados.map((chamado) => <ChamadoCard key={chamado.id} chamado={chamado} tecnico onClick={() => setSelecionado(chamado.id)} onAssumir={() => void assumir(chamado.id)} />)}
        </div>
        {selecionado && <Detalhes usuario={usuario} id={selecionado} onClose={() => setSelecionado(null)} onError={onError} onChanged={() => void carregar()} />}
    </main>;
}

function ChamadoCard({ chamado, onClick, tecnico, onAssumir }: { chamado: ChamadoView; onClick: () => void; tecnico?: boolean; onAssumir?: () => void }) {
    return <article className="ticket-card" onClick={onClick}>
        <div className="ticket-top"><span className="category">{chamado.categoria}</span><span className={`status status-${chamado.status.replaceAll(' ', '-').toLowerCase()}`}>{chamado.status}</span></div>
        <h3>{chamado.titulo}</h3><p>{chamado.descricao}</p>
        <small>{new Date(chamado.dataAbertura).toLocaleString('pt-BR')}</small>
        {tecnico && chamado.tecnicoResponsavelId === null && <button onClick={(e) => { e.stopPropagation(); onAssumir?.(); }}>Assumir</button>}
    </article>;
}

function Detalhes({ usuario, id, onClose, onError, onChanged }: { usuario: UsuarioSessao; id: string; onClose: () => void; onError: (msg: string) => void; onChanged?: () => void }) {
    const [dados, setDados] = useState<Awaited<ReturnType<typeof detalhesChamado>> | null>(null);
    const [texto, setTexto] = useState('');

    async function carregar() {
        try { setDados(await detalhesChamado(usuario, id)); } catch (e) { onError(e instanceof Error ? e.message : 'Falha ao carregar o chamado.'); }
    }
    useEffect(() => { void carregar(); }, [id]);

    async function enviarMensagem(event: FormEvent) {
        event.preventDefault();
        try { await adicionarMensagem(usuario, id, texto); setTexto(''); await carregar(); } catch (e) { onError(e instanceof Error ? e.message : 'Falha ao enviar mensagem.'); }
    }

    async function mudarStatus(novoStatus: string) {
        try { await alterarStatus(usuario, id, novoStatus); await carregar(); onChanged?.(); } catch (e) { onError(e instanceof Error ? e.message : 'Falha ao alterar status.'); }
    }

    const titulo = useMemo(() => dados?.chamado.titulo ?? 'Carregando...', [dados]);

    return <div className="modal-backdrop" onClick={onClose}><section className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        {!dados ? <p>Carregando...</p> : <>
            <div className="modal-heading"><div><span className="category">{dados.chamado.categoria}</span><h2>{titulo}</h2></div>
                {usuario.perfil === 'tecnico' && <select value={dados.chamado.status} onChange={(e) => void mudarStatus(e.target.value)}>{status.map((s) => <option key={s}>{s}</option>)}</select>}
            </div>
            <p>{dados.chamado.descricao}</p>
            <div className="messages">{dados.mensagens.length === 0 && <small>Nenhuma mensagem ainda.</small>}{dados.mensagens.map((m) => <div className="message" key={m.id}><b>{m.autorId}</b><span>{new Date(m.dataEnvio).toLocaleString('pt-BR')}</span><p>{m.conteudo}</p></div>)}</div>
            <form onSubmit={enviarMensagem} className="message-form"><textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Digite uma mensagem..." required /><button>Enviar</button></form>
        </>}
    </section></div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
