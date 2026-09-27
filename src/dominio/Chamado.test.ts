import { test, expect } from 'vitest';
import { Chamado, StatusChamado } from './Chamado';
import { DadoInvalidoException } from './DadoInvalidoException';

test('CA-05: Tentativa de atribuir um chamado já atribuído é rejeitada', () => {
    // 1. Preparação (Sem base de dados)
    const chamado = new Chamado("CH-001", "CLI-99", "Falha no ERP", "O sistema não abre a tela de vendas.");
    
    // 2. Ação - O primeiro técnico assume o chamado
    chamado.atribuirTecnico("TEC-01");

    // 3. Verificação - O segundo técnico tenta assumir e o sistema lança a exceção esperada
    expect(() => {
        chamado.atribuirTecnico("TEC-02");
    }).toThrow(DadoInvalidoException);
    
    expect(() => {
        chamado.atribuirTecnico("TEC-02");
    }).toThrowError("O chamado já foi atribuído a outro técnico.");
});

test('CA-02: Sistema impede que cliente altere o status do chamado', () => {
    const chamado = new Chamado("CH-002", "CLI-99", "Mouse quebrado", "Botão direito não funciona.");
    
    // Ação e Verificação: Cliente (isTecnico = false) tenta alterar status para Resolvido
    expect(() => {
        chamado.alterarStatus(StatusChamado.RESOLVIDO, false);
    }).toThrow(DadoInvalidoException);
});