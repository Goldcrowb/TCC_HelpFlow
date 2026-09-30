import { describe, expect, test } from 'vitest';
import { DadoInvalidoException } from './DadoInvalidoException';
import { Mensagem } from './Mensagem';

describe('Mensagem', () => {
    test('CA-04: conserva a data e hora informadas para o envio', () => {
        const agora = new Date();
        const mensagem = new Mensagem('MSG-001', 'CLI-01', 'Meu computador não liga.', agora);
        expect(mensagem.getDataEnvio().getTime()).toBe(agora.getTime());
    });

    test('rejeita conteúdo vazio', () => {
        expect(() => new Mensagem('MSG-002', 'CLI-01', '   ', new Date())).toThrow(DadoInvalidoException);
    });

    test('rejeita data futura', () => {
        const futuro = new Date(Date.now() + 60_000);
        expect(() => new Mensagem('MSG-003', 'CLI-01', 'Mensagem válida', futuro)).toThrow(DadoInvalidoException);
    });
});
