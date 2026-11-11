import { adicionarDias, dataIso } from "@/domain/format";
import type { Db, StatusDuvida } from "@/domain/types";

export const PERIODO_ATUAL = "2026.2";

/** Contas de demonstração (clique rápido na tela de login). */
export const CONTAS_DEMO = {
  aluno: "aluno@ic.ufal.br",
  monitor: "monitor@ic.ufal.br",
  admin: "admin@ufal.br",
} as const;

/** Cursos oferecidos no cadastro. */
export const CURSOS = [
  "Computação",
  "Engenharia de Computação",
  "Sistemas de Informação",
  "Outro",
] as const;

/**
 * Dados iniciais simulados, no mesmo formato das linhas do banco.
 * Datas relativas ao momento em que o app abre, para as aulas sempre estarem no futuro.
 */
export function criarDadosIniciais(agora: Date = new Date()): Db {
  const atras = (minutos: number) => new Date(agora.getTime() - minutos * 60_000).toISOString();
  const dia = (delta: number) => dataIso(adicionarDias(agora, delta));
  const MIN = 1;
  const H = 60;
  const D = 24 * 60;

  const usuarios: Db["usuarios"] = [
    {
      id: 1,
      nome: "Gabriel Souza",
      email: "aluno@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 2,
      nome: "Marina Alves",
      email: "marina.alves@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 3,
      nome: "Pedro Santos",
      email: "pedro.santos@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 4,
      nome: "Lucas Ferreira",
      email: "lucas.ferreira@ic.ufal.br",
      curso: "Engenharia de Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 5,
      nome: "Bianca Costa",
      email: "bianca.costa@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 6,
      nome: "Carlos Lima",
      email: "monitor@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 7,
      nome: "Ana Ribeiro",
      email: "ana.ribeiro@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 8,
      nome: "Rafael Torres",
      email: "rafael.torres@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 9,
      nome: "Júlia Mendes",
      email: "julia.mendes@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 10,
      nome: "Thiago Rocha",
      email: "thiago.rocha@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 11,
      nome: "Camila Duarte",
      email: "camila.duarte@ic.ufal.br",
      curso: "Computação",
      ativo: true,
      admin: false,
    },
    {
      id: 12,
      nome: "Helena Barros",
      email: "admin@ufal.br",
      curso: null,
      ativo: true,
      admin: true,
    },
  ];

  const disciplinas: Db["disciplinas"] = [
    { id: 1, codigo: "IC101", nome: "Algoritmos", ativa: true },
    { id: 2, codigo: "IC102", nome: "Estrutura de Dados", ativa: true },
    { id: 3, codigo: "IC103", nome: "Banco de Dados", ativa: true },
  ];

  const topicos: Db["topicos"] = [
    { id: 1, disciplinaId: 1, nome: "Recursão" },
    { id: 2, disciplinaId: 1, nome: "Grafos" },
    { id: 3, disciplinaId: 1, nome: "Complexidade" },
    { id: 4, disciplinaId: 2, nome: "Estruturas lineares" },
    { id: 5, disciplinaId: 2, nome: "Árvores" },
    { id: 6, disciplinaId: 3, nome: "Modelagem" },
    { id: 7, disciplinaId: 3, nome: "SQL" },
    { id: 8, disciplinaId: 3, nome: "Normalização" },
  ];

  const monitoresDisciplina: Db["monitoresDisciplina"] = [
    { id: 1, monitorId: 6, disciplinaId: 1, periodo: PERIODO_ATUAL, ativo: true },
    { id: 2, monitorId: 8, disciplinaId: 1, periodo: PERIODO_ATUAL, ativo: true },
    { id: 3, monitorId: 7, disciplinaId: 2, periodo: PERIODO_ATUAL, ativo: true },
    { id: 4, monitorId: 7, disciplinaId: 3, periodo: PERIODO_ATUAL, ativo: true },
  ];

  const salas: Db["salas"] = [
    { id: 1, nome: "Sala 12", bloco: "Bloco B", capacidade: 40, ativa: true },
    { id: 2, nome: "Sala 08", bloco: "Bloco A", capacidade: 30, ativa: true },
    { id: 3, nome: "Laboratório 3", bloco: "Bloco C", capacidade: 24, ativa: true },
  ];

  type DuvidaRow = Db["duvidas"][number];
  const duvida = (
    id: number,
    alunoId: number,
    disciplinaId: number,
    topicoId: number,
    monitorId: number,
    status: StatusDuvida,
    titulo: string,
    descricao: string,
    minutosAtras: number,
  ): DuvidaRow => ({
    id,
    alunoId,
    disciplinaId,
    topicoId,
    monitorId,
    titulo,
    descricao,
    status,
    criadaEm: atras(minutosAtras),
    atualizadaEm: atras(minutosAtras),
  });

  const duvidas: Db["duvidas"] = [
    duvida(
    1,
    2,
      1,
      1,
      6,
      "em_atendimento",
      "Como funciona a recursão na busca binária?",
      "Entendi a ideia de dividir o vetor ao meio, mas não consigo visualizar como as chamadas recursivas se encerram.",
      18 * MIN,
    ),
    duvida(
    2,
    3,
    2,
    4,
    7,
    "pendente",
      "Diferença entre pilha e fila na prática",
      "Sei que pilha é LIFO e fila é FIFO, mas quando cada uma é mais adequada em um sistema real?",
      32 * MIN,
    ),
    duvida(
    3,
    1,
      3,
      6,
      7,
      "respondida",
      "Quando usar chave estrangeira?",
      "Em quais situações faz sentido criar uma chave estrangeira em vez de só guardar o identificador?",
      1 * D,
    ),
    duvida(
      4,
      4,
      1,
      2,
      6,
      "pendente",
      "Complexidade do algoritmo de Dijkstra",
      "Qual é a complexidade com fila de prioridade e por que ela muda com a estrutura usada?",
      1 * H,
    ),
    duvida(
    5,
      5,
      3,
      8,
      7,
      "pendente",
      "Normalização até a terceira forma normal",
      "Não entendi a diferença entre dependência parcial e dependência transitiva.",
      2 * H,
    ),
    duvida(
    6,
    3,
    1,
      1,
      8,
      "pendente",
      "Caso base em funções recursivas",
      "Como saber qual é o caso base certo? Às vezes minha função entra em loop infinito.",
      1 * D,
    ),
    duvida(
      7,
      5,
      1,
      1,
      6,
      "pendente",
      "Recursão com memoização",
      "Quando a memoização realmente compensa em uma função recursiva?",
      2 * D,
    ),
    duvida(
    8,
    4,
    1,
      1,
      6,
      "respondida",
      "Recursão de cauda existe em todas as linguagens?",
      "Vi que algumas linguagens otimizam a recursão de cauda. Como isso funciona?",
      3 * D,
    ),
    duvida(
      9,
      1,
      1,
      2,
      6,
      "em_atendimento",
      "BFS ou DFS para achar o menor caminho?",
      "Tenho um grafo sem pesos e preciso do menor caminho entre dois vértices. Qual busca devo usar?",
      3 * H,
    ),
    duvida(
      10,
      1,
      2,
      4,
      7,
      "pendente",
      "Pilha ou fila para desfazer ações?",
      "Estou implementando um desfazer/refazer. Qual estrutura devo escolher?",
      5 * H,
    ),
  ];
  const atribuicoes: Db["atribuicoes"] = duvidas.flatMap((d, i) =>
  d.monitorId === null
  ? []
      : [
          {
            id: i + 1,
            duvidaId: d.id,
            monitorId: d.monitorId,
            atribuidoPorId: null,
            tipo: "automatica" as const,
            atribuidaEm: d.criadaEm,
          },
        ],
      );
      
      const respostas: Db["respostas"] = [
      {
      id: 1,
      duvidaId: 3,
      monitorId: 7,
      publicarNoAcervo: true,
      respondidaEm: atras(20 * H),
      texto:
        "Use chave estrangeira sempre que uma coluna depender de um registro de outra tabela. Ela impede valores órfãos e mantém a integridade referencial.",
      codigo: "FOREIGN KEY (aluno_id) REFERENCES usuario (id)",
    },
    {
      id: 2,
      duvidaId: 8,
      monitorId: 6,
      publicarNoAcervo: false,
      respondidaEm: atras(2 * D),
      texto:
      "Depende do compilador ou do interpretador. Em linguagens como Scheme a otimização é garantida; em outras, como Python, não existe.",
      codigo: null,
    },
  ];
  
  const acervo: Db["acervo"] = [
  {
      id: 1,
      disciplinaId: 1,
      topicoId: 1,
      respostaId: null,
      periodo: "2026.1",
      publicadoEm: atras(60 * D),
      codigo: null,
      titulo: "Como identificar o caso base em uma função recursiva?",
      conteudo:
        "O caso base é a condição que pode ser resolvida diretamente, sem uma nova chamada recursiva. Comece identificando a menor entrada possível do problema e garanta que cada chamada se aproxime dela.",
    },
    {
      id: 2,
      disciplinaId: 2,
      topicoId: 5,
      respostaId: null,
      periodo: "2026.1",
      publicadoEm: atras(58 * D),
      codigo: null,
      titulo: "Qual a diferença entre árvore binária e AVL?",
      conteudo:
        "Uma árvore binária limita cada nó a dois filhos. A AVL adiciona uma regra de balanceamento: a diferença de altura entre as subárvores nunca pode ultrapassar 1.",
    },
    {
      id: 3,
      disciplinaId: 3,
      topicoId: 7,
      respostaId: null,
      periodo: "2026.1",
      publicadoEm: atras(55 * D),
      titulo: "INNER JOIN e LEFT JOIN retornam os mesmos dados?",
      conteudo:
        "Não. INNER JOIN mantém somente linhas com correspondência nas duas tabelas. LEFT JOIN mantém todas as linhas da tabela à esquerda, preenchendo ausências com NULL.",
      codigo: "SELECT a.nome, d.titulo\nFROM usuario a\nLEFT JOIN duvida d ON d.aluno_id = a.id;",
    },
    {
    id: 4,
    disciplinaId: 1,
    topicoId: 2,
    respostaId: null,
    periodo: "2026.1",
    publicadoEm: atras(50 * D),
      codigo: null,
      titulo: "Como escolher entre BFS e DFS?",
      conteudo:
        "Use BFS para explorar por níveis e encontrar menores caminhos em grafos sem peso. Use DFS para explorar profundamente, detectar ciclos e realizar ordenação topológica.",
    },
    {
      id: 5,
      disciplinaId: 3,
      topicoId: 6,
      respostaId: 1,
      periodo: PERIODO_ATUAL,
      publicadoEm: atras(20 * H),
      titulo: "Quando usar chave estrangeira?",
      conteudo:
        "Use chave estrangeira sempre que uma coluna depender de um registro de outra tabela. Ela impede valores órfãos e mantém a integridade referencial.",
      codigo: "FOREIGN KEY (aluno_id) REFERENCES usuario (id)",
    },
    {
      id: 6,
      disciplinaId: 2,
      topicoId: 4,
      respostaId: null,
      periodo: "2026.1",
      publicadoEm: atras(45 * D),
      codigo: null,
      titulo: "Quando usar pilha e quando usar fila?",
      conteudo:
        "Use pilha quando o último elemento inserido deve ser o primeiro a sair, como em desfazer ações. Use fila quando a ordem de chegada deve ser respeitada, como em atendimento.",
    },
  ];
  
  const aulas: Db["aulas"] = [
  {
      id: 1,
      disciplinaId: 1,
      topicoId: 1,
      monitorId: 6,
      tema: "Recursão e análise de complexidade",
      descricao: "Revisão dos casos base e da pilha de chamadas com exercícios guiados.",
      data: dia(2),
      horaInicio: "14:00",
      horaFim: "16:00",
      minimoConfirmados: 5,
      status: "confirmada",
      criadaEm: atras(2 * D),
    },
    {
      id: 2,
      disciplinaId: 3,
      topicoId: 8,
      monitorId: 7,
      tema: "Normalização e modelagem relacional",
      descricao: "Da primeira à terceira forma normal com exemplos de modelagem.",
      data: dia(4),
      horaInicio: "16:00",
      horaFim: "18:00",
      minimoConfirmados: 5,
      status: "aberta",
      criadaEm: atras(1 * D),
    },
  ];

  const reservas: Db["reservas"] = [
    {
      id: 1,
      salaId: 1,
      aulaId: 1,
      data: dia(2),
      horaInicio: "14:00",
      horaFim: "16:00",
      status: "confirmada",
    },
    {
      id: 2,
      salaId: 2,
      aulaId: 2,
      data: dia(4),
      horaInicio: "16:00",
      horaFim: "18:00",
      status: "pendente",
    },
  ];
  
  const presencas: Db["presencas"] = [
    ...[2, 3, 4, 5, 9, 10].map((alunoId, i) => ({
      id: i + 1,
      aulaId: 1,
      alunoId,
      confirmadaEm: atras(30 * H - i * H),
    })),
    ...[2, 5, 11].map((alunoId, i) => ({
      id: 7 + i,
      aulaId: 2,
      alunoId,
      confirmadaEm: atras(10 * H - i * H),
    })),
  ];

  const convites: Db["convites"] = [
    { id: 1, aulaId: 2, alunoId: 1, enviadoEm: atras(1 * D) },
    { id: 2, aulaId: 2, alunoId: 5, enviadoEm: atras(1 * D) },
  ];

  const solicitacoesCargo: Db["solicitacoesCargo"] = [
    {
      id: 1,
      usuarioId: 2,
      cargoSolicitado: "monitor",
      disciplinaIds: [3],
      justificativa:
      "Fui aprovada em Banco de Dados com nota 9,5 e já ajudo colegas nos grupos de estudo.",
      status: "pendente",
      criadaEm: atras(2 * D),
      decididaEm: null,
      decididaPorId: null,
      observacao: null,
    },
  ];

  return {
    usuarios,
    disciplinas,
    topicos,
    monitoresDisciplina,
    salas,
    duvidas,
    atribuicoes,
    respostas,
    acervo,
    sugestoes: [],
    aulas,
    reservas,
    presencas,
    convites,
    solicitacoesCargo,
  };
}
