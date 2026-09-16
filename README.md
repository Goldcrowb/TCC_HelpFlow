# TCC_HelpFlow
Trabalho do TCC

# 1. Diretrizes do Repositório
Estrutura de Pastas: Os diretórios do projeto devem refletir diretamente as camadas arquiteturais que serão construídas (ex: dominio, infraestrutura, aplicacao).  
Documentação Inicial: A raiz do repositório contará com um arquivo de leiame (README.md) contendo as instruções exatas de compilação e execução.  
Preservação de Histórico: O progresso deve ser registrado com contribuições frequentes; é expressamente proibido realizar um único envio massivo de código no final do projeto.  

# 2. Padrões de Codificação e Arquitetura
Convenção de Nomes: Classes começarão com letra maiúscula (PascalCase), métodos e variáveis com minúscula (camelCase), e constantes serão escritas em letras maiúsculas separadas por sublinhado (SNAKE_CASE).  
Organização Visual: A indentação será mantida em 4 espaços, com um limite sugerido de 120 caracteres para o comprimento de linha.  
Critério de Divisão (Regra do "E"): O tamanho máximo de uma rotina deve ser curto. Se o nome ou a explicação de um método exigir o uso da conjunção "e" (por exemplo: validarEAtribuirChamado), é sinal de que ele fere o princípio de responsabilidade única e deve ser dividido em dois métodos distintos.  
Política de Comentários: Deve-se comentar o "porquê" (a justificativa de uma regra de negócio complexa) e saber o que não comentar (códigos óbvios que já se explicam pela própria nomenclatura).  
Tratamento de Falhas: As falhas serão sinalizadas por meio de exceções de domínio (ex: DadoInvalidoException ao tentar inserir uma data incorreta), garantindo que a classe já nasça válida. O tratamento e a conversão dessas exceções em mensagens amigáveis ocorrerão nas camadas superiores.  

## 🛠️ Stack Tecnológica
* **Linguagem:** TypeScript
* **Front-end:** React (com Vite)
* **Back-end:** Node.js (com Express/NestJS)
* **Banco de Dados:** PostgreSQL (Hospedado via Supabase)
* **Hospedagem (em Nuvem Gratuita):** Vercel (Front) e Render (Back)

## 📦 Pré-requisitos para Instalação Local
Para executar o projeto localmente para avaliação, certifique-se de que sua máquina possui:
1. **Node.js**: Versão 18.x ou superior.
2. **NPM (ou Yarn)**: Instalado junto ao Node.js.
3. **Git**: Para clonar este repositório.

