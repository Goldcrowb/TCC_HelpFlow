// Medição HTTP do CA-03. NÃO mede o tempo de renderização do browser.
const destino = process.argv[2];
if (!destino || !/^https?:\/\//.test(destino)) {
  console.error('Uso: node scripts/medir_desempenho.mjs https://SEU-PROJETO.onrender.com');
  process.exit(1);
}
const base = destino.replace(/\/$/, '');
const senha = process.env.HELPFLOW_TEST_PASSWORD || '123456';
async function obter(rota, opcoes = {}) {
  const resp = await fetch(base + rota, { ...opcoes, signal: AbortSignal.timeout(90000) });
  if (!resp.ok) throw Error(`${rota} retornou ${resp.status}: ${await resp.text()}`);
  return resp;
}
try {
  const login = await obter('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'tecnico@helpflow.local', senha }) });
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw Error('Cookie de login não retornado.');
  const relatorio = [];
  for (const [descricao,rota] of [['Fila com 500', '/api/chamados/fila'], ['Histórico com 50', '/api/chamados/PERF-0001']]) {
    const inicio = performance.now();
    const resp = await obter(rota, { headers: { Cookie: cookie } });
    const dados = await resp.json();
    const ms = Number((performance.now() - inicio).toFixed(2));
    const total = Array.isArray(dados) ? dados.length : dados.mensagens?.length ?? 0;
    relatorio.push({ teste: descricao, registros: total, duracao_ms: ms });
  }
  console.table(relatorio);
  if (relatorio[0].registros !== 500 || relatorio[1].registros !== 50) {
    console.warn('AVISO: a carga não corresponde a 500/50. Configure os dados antes de declarar o CA-03 aprovado.');
  }
  console.log('Esta medição cobre HTTP + interpretação JSON, não o tempo de exibição da interface.');
} catch (erro) { console.error('Medição falhou:', erro.message); process.exitCode = 1; }
