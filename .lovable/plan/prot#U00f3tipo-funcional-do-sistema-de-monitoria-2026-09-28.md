# Protótipo funcional do sistema de monitoria

## Objetivo
Criar uma demonstração navegável em português, com dados simulados, que permita testar o fluxo completo de aluno e monitor sem depender de servidor ou cadastro real.

## Experiência visual
- Usar azul-claro, branco e cinzas suaves para transmitir calma e clareza.
- Criar uma interface acadêmica limpa, com boa leitura, menus laterais e estados bem diferenciados.
- Garantir adaptação para celular e computador.

## Login e isolamento
- Exibir obrigatoriamente a tela de login ao abrir.
- Aceitar apenas e-mails `@ic.ufal.br` e permitir escolher Aluno ou Monitor antes de entrar.
- Facilitar os testes com `aluno@ic.ufal.br` e `monitor@ic.ufal.br` preenchíveis com um clique.
- Manter menus e telas dos dois perfis totalmente separados; a troca exige sair da conta.

## Fluxo do aluno
- Painel inicial com visão geral e situação das dúvidas.
- Acervo pesquisável por texto, disciplina e tópico.
- Formulário de nova dúvida com disciplina, tópico, título e descrição.
- Sugestões semelhantes surgem durante a digitação, com porcentagem de similaridade e resposta existente.
- Permitir resolver pela sugestão ou enviar a pergunta para a fila simulada.
- Área “Minhas dúvidas” com estados pendente, em atendimento e respondida.
- Lista de aulas coletivas com confirmação de presença e indicação da reserva da sala ao atingir o mínimo.

## Fluxo do monitor
- Painel com métricas de chamados atribuídos, respostas concluídas e carga atual.
- Fila em abas: “Atribuídas a mim” e “Fila geral da disciplina”.
- Seleção de um chamado para responder com texto e bloco de código.
- Opção de publicar a resposta no acervo e opção de reatribuir para outro monitor.
- Alerta de tópico frequente e ação para converter o tema em aula coletiva, simulando agendamento e reserva de sala.

## Comportamento simulado
- Manter os dados durante a sessão atual do navegador.
- Atualizar contadores, filas, estados e confirmações imediatamente após cada ação.
- Ao criar uma dúvida, simular a escolha automática do monitor com menor carga.
- Incluir mensagens claras de sucesso e feedback visual para todas as ações importantes.

## Detalhes técnicos
- Implementar tudo na página inicial como uma demonstração autocontida em React, com estados locais e dados iniciais mockados.
- Usar os componentes e ícones já disponíveis no projeto, mantendo as cores em tokens do sistema visual.
- Incluir metadados próprios do sistema e validar o resultado no navegador em telas grandes e pequenas.
