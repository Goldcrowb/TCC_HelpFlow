import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);

// Sal e hash independentes por usuário. Senhas nunca são armazenadas em texto puro.
export async function criarHashSenha(senha: string): Promise<string> {
    const sal = randomBytes(16).toString('hex');
    const derivada = await scrypt(senha, sal, 64) as Buffer;
    return `scrypt:${sal}:${derivada.toString('hex')}`;
}

export async function verificarSenha(senha: string, armazenada: string): Promise<boolean> {
    if (!armazenada.startsWith('scrypt:')) {
        // Compatibilidade APENAS com contas de demonstração no servidor local.
        return process.env.NODE_ENV !== 'production' && senha === armazenada;
    }
    const partes = armazenada.split(':');
    if (partes.length !== 3 || !/^[a-f0-9]{32}$/.test(partes[1]) || !/^[a-f0-9]{128}$/.test(partes[2])) return false;
    const esperado = Buffer.from(partes[2], 'hex');
    const recebido = await scrypt(senha, partes[1], 64) as Buffer;
    return timingSafeEqual(esperado, recebido);
}
