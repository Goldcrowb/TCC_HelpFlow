import { describe, expect, test } from 'vitest';
import { CategoriaChamado } from './CategoriaChamado';
import { Chamado } from './Chamado';
import { DadoInvalidoException } from './DadoInvalidoException';
import { StatusChamado } from './StatusChamado';

describe('Chamado', () => {
    test('CA-01: chamado recém-criado inicia como Aberto', () => {
        const chamado = new Chamado('CH-001', 'CLI-01', 'Falha no ERP', 'O sistema não abre a tela de vendas.', CategoriaChamado.SOFTWARE);
        expect(chamado.getStatus()).toBe(StatusChamado.ABERTO);
    });

    test('valida título e descrição mínimos', () => {
        expect(() => new Chamado('CH-002', 'CLI-01', 'Erro', 'Descrição válida aqui.', CategoriaChamado.OUTROS)).toThrow(DadoInvalidoException);
        expect(() => new Chamado('CH-003', 'CLI-01', 'Título válido', 'curto', CategoriaChamado.OUTROS)).toThrow(DadoInvalidoException);
    });

    test('CA-05: tentativa de atribuir um chamado já atribuído é rejeitada', () => {
        const chamado = new Chamado('CH-004', 'CLI-01', 'Falha no ERP', 'O sistema não abre a tela de vendas.', CategoriaChamado.SOFTWARE);
        chamado.atribuirTecnico('TEC-01');
        expect(() => chamado.atribuirTecnico('TEC-02')).toThrowError('O chamado já foi atribuído a outro técnico.');
        expect(chamado.getTecnicoResponsavelId()).toBe('TEC-01');
    });

    test('CA-02: sistema impede que cliente altere o status do chamado', () => {
        const chamado = new Chamado('CH-005', 'CLI-01', 'Mouse quebrado', 'Botão direito não funciona.', CategoriaChamado.HARDWARE);
        expect(() => chamado.alterarStatus(StatusChamado.RESOLVIDO, false)).toThrowError('Apenas usuários técnicos podem alterar o status.');
    });

    test('técnico pode alterar o status', () => {
        const chamado = new Chamado('CH-006', 'CLI-01', 'Internet lenta', 'Conexão com a rede está instável.', CategoriaChamado.REDE);
        chamado.alterarStatus(StatusChamado.EM_ANDAMENTO, true);
        expect(chamado.getStatus()).toBe(StatusChamado.EM_ANDAMENTO);
    });
});
