// Confere se a aplicação compilada entrega a página inicial e a rota de saúde.
// Usa banco em memória e não substitui os testes do Supabase ou da hospedagem.
import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pastaProjeto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arquivoServidor = path.join(pastaProjeto, 'dist', 'server', 'servicos', 'server.js');
const porta = randomInt(39000, 49000);
const endereco = `http://127.0.0.1:${porta}`;
const servidor = spawn(process.execPath, [arquivoServidor], {
  cwd: pastaProjeto,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(porta),
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: ''
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '';
servidor.stdout.on('data', (dados) => { logs += dados.toString(); });
servidor.stderr.on('data', (dados) => { logs += dados.toString(); });

async function iniciar() {
  for (let tentativa = 0; tentativa < 35; tentativa++) {
    if (servidor.exitCode !== null) throw new Error(`Servidor terminou antes dos testes: ${logs}`);
    try {
      const resposta = await fetch(`${endereco}/api/saude`, { signal: AbortSignal.timeout(750) });
      if (!resposta.ok) throw new Error(`Saúde: HTTP ${resposta.status}`);
      const dados = await resposta.json();
      if (dados.status !== 'ok') throw new Error('Resposta da API inesperada.');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`A API não iniciou. ${logs}`);
}

try {
  await iniciar();
  const pagina = await fetch(endereco, { signal: AbortSignal.timeout(2000) });
  const html = await pagina.text();
  if (pagina.status !== 200 || !html.includes('id="root"')) {
    throw new Error(`Página inicial não carregou corretamente (HTTP ${pagina.status}).`);
  }
  console.log('OK: /api/saude retornou HTTP 200.');
  console.log('OK: página inicial retornou HTTP 200 com a aplicação React.');
} catch (erro) {
  console.error('Falha na verificação do build:', erro.message);
  process.exitCode = 1;
} finally {
  servidor.kill('SIGTERM');
}
