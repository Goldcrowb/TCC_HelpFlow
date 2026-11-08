import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    adicionarMensagem, alterarStatus, atribuirChamado, ChamadoView, consultarSessao,
    criarChamado, detalhesChamado, ehFalhaDeRede, ErroApi, listarAtendimentos,
    listarFila, listarMeusChamados, login, logout, UsuarioSessao
} from './api';
import {
    adicionarPendente, descartarPendente, eventoPendencias, lerPendencias,
    OperacaoPendente, sincronizarPendencias
} from './offline';
import './styles.css';

const categorias = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outros'];
const status = ['Aberto', 'Em Andamento', 'Resolvido'];
const chaveCache = 'helpflow_usuario_ultimo';
function mensagemErro(erro: unknown) { return erro instanceof Error ? erro.message : 'Ocorreu uma falha inesperada.'; }
function formatarData(data: string) { return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function statusClasse(nome: string) { return `status status-${nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`; }

function App() {
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [online, setOnline] = useState(navigator.onLine);
    const [versaoFila, setVersaoFila] = useState(0);
    const [sincronizando, setSincronizando] = useState(false);
    const [atualizacao, setAtualizacao] = useState(0);

    const sincronizar = useCallback(async (atual: UsuarioSessao) => {
        if (!navigator.onLine || lerPendencias(atual.id).length === 0) return;
        setSincronizando(true);
        try {
            const resultado = await sincronizarPendencias(atual);
            if (resultado.enviados) setAtualizacao((n) => n + 1);
        } finally { setSincronizando(false); }
    }, []);

    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                const sessao = await consultarSessao();
                if (ativo) { setUsuario(sessao); sessionStorage.setItem(chaveCache, JSON.stringify(sessao)); void sincronizar(sessao); }
            } catch (erro) {
                // O cache é usado apenas para rascunhos offline; o servidor valida a sessão
                // antes de aceitar qualquer operação enviada após a reconexão.
                if (ativo && ehFalhaDeRede(erro)) {
                    try { setUsuario(JSON.parse(sessionStorage.getItem(chaveCache) || 'null')); } catch { /* Sem cache */ }
                } else if (ativo) sessionStorage.removeItem(chaveCache);
            } finally { if (ativo) setCarregando(false); }
        })();
        return () => { ativo = false; };
    }, [sincronizar]);

    useEffect(() => {
        const atualizaOnline = () => setOnline(navigator.onLine);
        const atualizarFila = () => setVersaoFila((n) => n + 1);
        window.addEventListener('online', atualizaOnline);
        window.addEventListener('offline', atualizaOnline);
        window.addEventListener(eventoPendencias(), atualizarFila);
        return () => {
            window.removeEventListener('online', atualizaOnline);
            window.removeEventListener('offline', atualizaOnline);
            window.removeEventListener(eventoPendencias(), atualizarFila);
        };
    }, []);
    useEffect(() => { if (online && usuario) void sincronizar(usuario); }, [online, usuario, sincronizar]);
    const pendencias = useMemo(() => usuario ? lerPendencias(usuario.id) : [], [usuario, versaoFila]);

    async function sair() {
        try { await logout(); } catch { /* Cookie expira naturalmente; limpar apenas a visão local. */ }
        sessionStorage.removeItem(chaveCache);
        setUsuario(null);
        setErro('');
    }
    function entrar(novo: UsuarioSessao) {
        sessionStorage.setItem(chaveCache, JSON.stringify(novo));
        setUsuario(novo);
        setErro('');
    }
    if (carregando) return <main className="loading-page"><div className="loading-mark">H</div><h2>Carregando HelpFlow</h2><p>Verificando a conexão...</p></main>;
    if (!usuario) return <Login onLogin={entrar} onError={setErro} erro={erro} />;

    return <div className="app-shell">
        <header className="topbar">
            <div className="brand"><span className="brand-icon">H</span><div><strong>HelpFlow</strong><small>Central de suporte</small></div></div>
            <div className="topbar-right"><span className="user-pill"><span className="avatar">{usuario.nome.charAt(0)}</span><span><b>{usuario.nome}</b><small>{usuario.perfil === 'cliente' ? 'Cliente' : 'Técnico'}</small></span></span><button className="button-ghost" onClick={sair}>Sair</button></div>
        </header>
        <div className="hero-band"><div className="hero-inner"><span className="eyebrow">PAINEL DE ATENDIMENTO</span><h1>{usuario.perfil === 'cliente' ? 'Como podemos ajudar?' : 'Área do técnico'}</h1><p>{usuario.perfil === 'cliente' ? 'Abra chamados e acompanhe as respostas da equipe de suporte.' : 'Acompanhe solicitações, assuma chamados e registre as soluções.'}</p></div></div>
        <main className="content">
            {!online && <div className="alert warning" role="status">Você está offline. Novos chamados e mensagens ficam neste navegador até a reconexão. Atribuição e status exigem internet.</div>}
            {pendencias.length > 0 && <section className="pending-panel" aria-label="Fila de sincronização"><div className="pending-heading"><div><b>{pendencias.length} operação(ões) aguardando envio</b><p>Os registros são enviados em ordem quando a conexão voltar. Não limpe os dados deste navegador antes de sincronizar.</p></div><button className="button-outline" disabled={!online || sincronizando} onClick={() => void sincronizar(usuario)}>{sincronizando ? 'Enviando...' : 'Sincronizar'}</button></div>
                {pendencias.map((p) => <div className="pending-item" key={p.id}><span>{p.tipo === 'chamado' ? 'Chamado' : 'Mensagem'} · {formatarData(p.criadoEm)}</span><span className="pending-title">{p.tipo === 'chamado' ? p.titulo : p.conteudo.slice(0, 55)}</span>{p.erro && <small className="inline-error">{p.erro}</small>}<button className="button-link" onClick={() => { if (confirm('Descartar esta operação que ainda não foi enviada?')) descartarPendente(p.id, usuario.id); }}>Descartar</button></div>)}
            </section>}
            {usuario.perfil === 'cliente' ? <PainelCliente usuario={usuario} onError={setErro} atualizacao={atualizacao} /> : <PainelTecnico usuario={usuario} onError={setErro} atualizacao={atualizacao} />}
        </main>
        {erro && <div className="toast error" role="alert">{erro}<button aria-label="Fechar aviso" onClick={() => setErro('')}>×</button></div>}
        <footer className="footer">HelpFlow · Projeto acadêmico de Engenharia de Software · Versão 2.0</footer>
    </div>;
}

function Login({ onLogin, onError, erro }: { onLogin: (u: UsuarioSessao) => void; onError: (msg: string) => void; erro: string }) {
    const [email, setEmail] = useState('cliente@helpflow.local');
    const [senha, setSenha] = useState('123456');
    const [carregando, setCarregando] = useState(false);
    async function enviar(event: FormEvent) {
        event.preventDefault(); setCarregando(true); onError('');
        try { onLogin(await login(email, senha)); }
        catch (e) { onError(mensagemErro(e)); }
        finally { setCarregando(false); }
    }
    return <main className="login-page"><div className="login-layout">
        <section className="login-intro"><span className="brand-icon big">H</span><span className="eyebrow">SISTEMA DE ATENDIMENTO</span><h1>Solicitações de suporte <em>em um só lugar.</em></h1><p>Registre chamados, acompanhe o andamento e consulte as respostas da equipe.</p><div className="intro-points"><span>✓ Chamados organizados</span><span>✓ Histórico de mensagens</span><span>✓ Cliente e técnico</span></div></section>
        <section className="login-card"><span className="login-step">ACESSAR O HELPFLOW</span><h2>Acesso ao sistema</h2><p>Entre com sua conta para acessar os chamados.</p><form onSubmit={enviar} className="form-grid"><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></label><button className="primary-btn" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar no HelpFlow'}</button></form>
        {erro && <p role="alert" className="inline-error">{erro}</p>}
        <div className="demo-access"><strong>Contas para demonstração</strong><button type="button" onClick={() => { setEmail('cliente@helpflow.local'); setSenha('123456'); }}>Acessar como cliente</button><button type="button" onClick={() => { setEmail('tecnico@helpflow.local'); setSenha('123456'); }}>Acessar como técnico</button><small>Ambiente acadêmico público. Não insira dados pessoais reais.</small></div></section>
    </div></main>;
}

function PainelCliente({ usuario, onError, atualizacao }: { usuario: UsuarioSessao; onError: (msg: string) => void; atualizacao: number }) {
    const [chamados, setChamados] = useState<ChamadoView[]>([]);
    const [selecionado, setSelecionado] = useState<string | null>(null);
    const [filtro, setFiltro] = useState('Todos');
    const [pesquisa, setPesquisa] = useState('');
    const [carregando, setCarregando] = useState(true);
    const carregar = useCallback(async () => {
        try { setChamados(await listarMeusChamados(usuario)); }
        catch (e) { if (navigator.onLine) onError(mensagemErro(e)); }
        finally { setCarregando(false); }
    }, [usuario, onError]);
    useEffect(() => { void carregar(); }, [carregar, atualizacao]);
    const filtrados = chamados.filter((c) => (filtro === 'Todos' || c.status === filtro) && `${c.titulo} ${c.descricao}`.toLowerCase().includes(pesquisa.toLowerCase()));
    return <><div className="section-heading"><div><span className="eyebrow dark">MINHA ÁREA</span><h2>Meus chamados</h2><p>Acompanhe o andamento e converse com o suporte.</p></div><FormularioChamado usuario={usuario} onError={onError} onChanged={carregar} /></div>
        <div className="stats"><IndicadorResumo label="Total de chamados" valor={chamados.length} icon="▤"/><IndicadorResumo label="Em andamento" valor={chamados.filter((c) => c.status === 'Em Andamento').length} icon="◷"/><IndicadorResumo label="Resolvidos" valor={chamados.filter((c) => c.status === 'Resolvido').length} icon="✓"/></div>
        <div className="toolbar"><div className="filter-tabs">{['Todos', ...status].map((s) => <button key={s} className={s === filtro ? 'active' : ''} onClick={() => setFiltro(s)}>{s}</button>)}</div><input aria-label="Pesquisar chamados" className="search" placeholder="Pesquisar chamados..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} /></div>
        <div className="cards">{carregando ? <MensagemListaVazia titulo="Carregando chamados..." /> : filtrados.length === 0 ? <MensagemListaVazia titulo="Nenhum chamado encontrado" texto="Abra um chamado ou altere os filtros para ver solicitações." /> : filtrados.map((c) => <ChamadoCard key={c.id} chamado={c} onClick={() => setSelecionado(c.id)} />)}</div>
        {selecionado && <Detalhes usuario={usuario} id={selecionado} onClose={() => setSelecionado(null)} onError={onError} onChanged={carregar} />}
    </>;
}

function FormularioChamado({ usuario, onError, onChanged }: { usuario: UsuarioSessao; onError: (msg: string) => void; onChanged: () => Promise<void> }) {
    const [aberto, setAberto] = useState(false), [titulo, setTitulo] = useState(''), [descricao, setDescricao] = useState(''), [categoria, setCategoria] = useState(categorias[0]), [enviando, setEnviando] = useState(false);
    async function enviar(event: FormEvent) {
        event.preventDefault(); setEnviando(true);
        const id = crypto.randomUUID();
        try {
            if (!navigator.onLine) throw new ErroApi('Sem internet', 0);
            await criarChamado(usuario, titulo, descricao, categoria, id);
            await onChanged();
            setTitulo(''); setDescricao(''); setCategoria(categorias[0]); setAberto(false);
        } catch (e) {
            if (ehFalhaDeRede(e)) {
                adicionarPendente({ id, usuarioId: usuario.id, criadoEm: new Date().toISOString(), tipo: 'chamado', titulo, descricao, categoria });
                setTitulo(''); setDescricao(''); setAberto(false);
            } else onError(mensagemErro(e));
        } finally { setEnviando(false); }
    }
    return <><button className="primary-btn" onClick={() => setAberto(true)}>+ Novo chamado</button>{aberto && <div className="modal-backdrop" onMouseDown={() => setAberto(false)}><section className="modal" role="dialog" aria-modal="true" aria-label="Criar chamado" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setAberto(false)} aria-label="Fechar">×</button><span className="eyebrow dark">NOVA SOLICITAÇÃO</span><h2>Abrir chamado</h2><p className="muted">Conte o que aconteceu para que a equipe possa ajudar.</p><form onSubmit={enviar} className="form-grid"><label>Título<input maxLength={120} minLength={5} required placeholder="Ex.: Não consigo acessar o sistema" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label><label>Categoria<select value={categoria} onChange={(e) => setCategoria(e.target.value)}>{categorias.map((c) => <option key={c}>{c}</option>)}</select></label><label>Descrição<textarea minLength={10} required placeholder="Descreva o problema com detalhes..." value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label><div className="form-actions"><button type="button" className="button-outline" onClick={() => setAberto(false)}>Cancelar</button><button className="primary-btn" disabled={enviando}>{enviando ? 'Salvando...' : 'Abrir chamado'}</button></div></form></section></div>}</>;
}

function PainelTecnico({ usuario, onError, atualizacao }: { usuario: UsuarioSessao; onError: (msg: string) => void; atualizacao: number }) {
    const [fila, setFila] = useState<ChamadoView[]>([]), [atendimentos, setAtendimentos] = useState<ChamadoView[]>([]), [aba, setAba] = useState<'fila' | 'meus'>('fila');
    const [selecionado, setSelecionado] = useState<string | null>(null), [pesquisa, setPesquisa] = useState(''), [carregando, setCarregando] = useState(true), [ocupado, setOcupado] = useState('');
    const carregar = useCallback(async () => {
        try {
            const [abertos, meus] = await Promise.all([listarFila(usuario), listarAtendimentos(usuario)]);
            setFila(abertos); setAtendimentos(meus);
        } catch (e) { if (navigator.onLine) onError(mensagemErro(e)); }
        finally { setCarregando(false); }
    }, [usuario, onError]);
    useEffect(() => { void carregar(); }, [carregar, atualizacao]);
    async function assumir(id: string) {
        setOcupado(id);
        try { await atribuirChamado(usuario, id); await carregar(); setAba('meus'); setSelecionado(id); }
        catch (e) { onError(mensagemErro(e)); await carregar(); }
        finally { setOcupado(''); }
    }
    const lista = aba === 'fila' ? fila : atendimentos;
    const filtrados = lista.filter((c) => `${c.titulo} ${c.descricao} ${c.categoria}`.toLowerCase().includes(pesquisa.toLowerCase()));
    return <><div className="section-heading"><div><span className="eyebrow dark">VISÃO DO SUPORTE</span><h2>Gerenciar atendimentos</h2><p>Organize os chamados e acompanhe cada atendimento.</p></div><button className="button-outline" onClick={() => void carregar()}>↻ Atualizar</button></div>
        <div className="stats"><IndicadorResumo label="Na fila" valor={fila.length} icon="▤"/><IndicadorResumo label="Meus atendimentos" valor={atendimentos.length} icon="◷"/><IndicadorResumo label="Resolvidos por mim" valor={atendimentos.filter((c) => c.status === 'Resolvido').length} icon="✓"/></div>
        <div className="toolbar"><div className="filter-tabs"><button className={aba === 'fila' ? 'active' : ''} onClick={() => setAba('fila')}>Fila geral <span>{fila.length}</span></button><button className={aba === 'meus' ? 'active' : ''} onClick={() => setAba('meus')}>Meus atendimentos <span>{atendimentos.length}</span></button></div><input className="search" aria-label="Pesquisar chamados" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar chamados..." /></div>
        <div className="cards">{carregando ? <MensagemListaVazia titulo="Carregando atendimentos..." /> : filtrados.length === 0 ? <MensagemListaVazia titulo={aba === 'fila' ? 'Fila vazia' : 'Nenhum atendimento encontrado'} texto={aba === 'fila' ? 'Não há chamados aguardando atendimento.' : 'Assuma um chamado na fila geral para começar.'} /> : filtrados.map((c) => <ChamadoCard key={c.id} chamado={c} onClick={() => setSelecionado(c.id)} onAssumir={aba === 'fila' ? () => void assumir(c.id) : undefined} ocupado={ocupado === c.id} />)}</div>
        {selecionado && <Detalhes usuario={usuario} id={selecionado} onClose={() => setSelecionado(null)} onError={onError} onChanged={carregar} />}
    </>;
}

function IndicadorResumo({ label, valor, icon }: { label: string; valor: number; icon: string }) { return <div className="stat-card"><span className="stat-icon">{icon}</span><div><small>{label}</small><strong>{valor}</strong></div></div>; }
function MensagemListaVazia({ titulo, texto }: { titulo: string; texto?: string }) { return <div className="empty"><span className="empty-icon">▤</span><h3>{titulo}</h3>{texto && <p>{texto}</p>}</div>; }
function ChamadoCard({ chamado, onClick, onAssumir, ocupado }: { chamado: ChamadoView; onClick: () => void; onAssumir?: () => void; ocupado?: boolean }) {
    return <article className="ticket-card"><div className="ticket-top"><span className="category">{chamado.categoria}</span><span className={statusClasse(chamado.status)}>{chamado.status}</span></div><h3><button className="ticket-title" onClick={onClick}>{chamado.titulo}</button></h3><p>{chamado.descricao}</p><div className="ticket-bottom"><small>◷ {formatarData(chamado.dataAbertura)}</small>{onAssumir && chamado.tecnicoResponsavelId === null ? <button className="button-small" disabled={ocupado} onClick={onAssumir}>{ocupado ? 'Aguarde...' : 'Assumir →'}</button> : <button className="button-link" onClick={onClick}>Ver detalhes →</button>}</div></article>;
}

function Detalhes({ usuario, id, onClose, onError, onChanged }: { usuario: UsuarioSessao; id: string; onClose: () => void; onError: (msg: string) => void; onChanged?: () => Promise<void> }) {
    const [dados, setDados] = useState<Awaited<ReturnType<typeof detalhesChamado>> | null>(null), [texto, setTexto] = useState(''), [enviando, setEnviando] = useState(false), [alterando, setAlterando] = useState(false);
    const carregar = useCallback(async () => { try { setDados(await detalhesChamado(usuario, id)); } catch (e) { if (navigator.onLine) onError(mensagemErro(e)); } }, [usuario, id, onError]);
    useEffect(() => { void carregar(); }, [carregar]);
    async function enviarMensagem(event: FormEvent) {
        event.preventDefault(); if (!texto.trim()) return;
        setEnviando(true); const opId = crypto.randomUUID();
        try {
            if (!navigator.onLine) throw new ErroApi('Sem internet', 0);
            await adicionarMensagem(usuario, id, texto, opId); setTexto(''); await carregar();
        } catch (e) {
            if (ehFalhaDeRede(e)) {
                adicionarPendente({ id: opId, usuarioId: usuario.id, criadoEm: new Date().toISOString(), tipo: 'mensagem', chamadoId: id, conteudo: texto });
                setTexto('');
            } else onError(mensagemErro(e));
        } finally { setEnviando(false); }
    }
    async function mudarStatus(novoStatus: string) {
        if (!navigator.onLine) return onError('Conecte-se à internet para alterar o status.');
        setAlterando(true);
        try { await alterarStatus(usuario, id, novoStatus); await carregar(); await onChanged?.(); }
        catch (e) { onError(mensagemErro(e)); await carregar(); }
        finally { setAlterando(false); }
    }
    const responsavel = dados?.chamado.tecnicoResponsavelId === usuario.id;
    return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal ticket-modal" role="dialog" aria-modal="true" aria-label="Detalhes do chamado" onMouseDown={(e) => e.stopPropagation()}><button className="close" aria-label="Fechar detalhes" onClick={onClose}>×</button>{!dados ? <p>Carregando detalhes...</p> : <><div className="modal-heading"><div><span className="category">{dados.chamado.categoria}</span><h2>{dados.chamado.titulo}</h2><small>Aberto em {formatarData(dados.chamado.dataAbertura)}</small></div><span className={statusClasse(dados.chamado.status)}>{dados.chamado.status}</span></div><p className="ticket-description">{dados.chamado.descricao}</p>
        {usuario.perfil === 'tecnico' && <div className="status-panel"><div><b>{responsavel ? 'Este chamado está com você' : 'Acompanhamento técnico'}</b><small>{responsavel ? 'Atualize o status conforme o progresso.' : 'Para alterar o status, assuma o chamado na fila geral.'}</small></div><select aria-label="Status do chamado" disabled={!responsavel || alterando} value={dados.chamado.status} onChange={(e) => void mudarStatus(e.target.value)}>{status.map((s) => <option key={s}>{s}</option>)}</select></div>}
        <h3 className="subheading">Histórico de mensagens <span>{dados.mensagens.length}</span></h3><div className="messages">{dados.mensagens.length === 0 && <div className="message-empty">Ainda não há mensagens. Inicie a conversa abaixo.</div>}{dados.mensagens.map((m) => <div className={`message ${m.autorId === usuario.id ? 'mine' : ''}`} key={m.id}><div className="message-meta"><b>{m.autorId === usuario.id ? 'Você' : m.autorId.startsWith('TEC-') ? 'Técnico' : 'Cliente'}</b><time dateTime={m.dataEnvio}>{formatarData(m.dataEnvio)}</time></div><p>{m.conteudo}</p></div>)}</div>
        <form onSubmit={enviarMensagem} className="message-form"><label htmlFor="nova-mensagem">Enviar mensagem</label><textarea id="nova-mensagem" value={texto} maxLength={4000} disabled={usuario.perfil === 'tecnico' && !responsavel} onChange={(e) => setTexto(e.target.value)} placeholder={usuario.perfil === 'tecnico' && !responsavel ? 'Assuma o chamado na fila antes de responder.' : 'Escreva uma mensagem para registrar no histórico...'} required /><div className="form-actions"><small>Histórico com data e hora do envio</small><button className="primary-btn" disabled={enviando || (usuario.perfil === 'tecnico' && !responsavel)}>{enviando ? 'Enviando...' : 'Enviar mensagem'}</button></div></form>
        </>}</section></div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js').catch(() => { /* O site continua funcionando online */ });
    });
}
