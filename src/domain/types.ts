/**
 * Modelo de domínio do Monitora IC.
 * Cada interface corresponde a uma tabela do banco (monitora_ic), em camelCase.
 * Datas: "AAAA-MM-DD". Horas: "HH:MM". Timestamps: ISO 8601.
 */

export type Id = number;

export type PerfilAcesso = "aluno" | "monitor" | "admin";

/** Cargo acadêmico do usuário. Monitor = tem vínculo ativo em MONITOR_DISCIPLINA. Administrador é um acesso à parte. */
export type CargoUsuario = "aluno" | "monitor";
export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada" | "cancelada";

export type StatusDuvida = "pendente" | "em_atendimento" | "respondida";
export type TipoAtribuicao = "automatica" | "reatribuicao";
export type StatusAula = "aberta" | "confirmada" | "realizada" | "cancelada";
export type StatusReserva = "pendente" | "confirmada" | "cancelada";

export interface Usuario {
  id: Id;
  nome: string;
  email: string;
  curso: string | null;
  ativo: boolean;
  /** Acesso ao painel de administração (secretaria, gestão). */
  admin: boolean;
}

export interface Disciplina {
  id: Id;
  codigo: string | null;
  nome: string;
  ativa: boolean;
}

export interface Topico {
  id: Id;
  disciplinaId: Id;
  nome: string;
}

/** Vínculo de monitoria: quem tem vínculo ativo também acessa o perfil de monitor. */
export interface MonitorDisciplina {
  id: Id;
  monitorId: Id;
  disciplinaId: Id;
  periodo: string;
  ativo: boolean;
}

export interface Sala {
  id: Id;
  nome: string;
  bloco: string;
  capacidade: number;
  ativa: boolean;
}

export interface Duvida {
  id: Id;
  alunoId: Id;
  disciplinaId: Id;
  topicoId: Id;
  /** Responsável atual. Nulo = só aparece na fila geral. */
  monitorId: Id | null;
  titulo: string;
  descricao: string;
  status: StatusDuvida;
  criadaEm: string;
  atualizadaEm: string;
}

export interface AtribuicaoDuvida {
  id: Id;
  duvidaId: Id;
  monitorId: Id;
  /** Nulo quando a atribuição foi automática. */
  atribuidoPorId: Id | null;
  tipo: TipoAtribuicao;
  atribuidaEm: string;
}

export interface Resposta {
  id: Id;
  duvidaId: Id;
  monitorId: Id;
  texto: string;
  codigo: string | null;
  publicarNoAcervo: boolean;
  respondidaEm: string;
}

export interface AcervoItem {
  id: Id;
  disciplinaId: Id;
  topicoId: Id;
  /** Nulo em itens herdados de semestres anteriores. */
  respostaId: Id | null;
  titulo: string;
  conteudo: string;
  codigo: string | null;
  periodo: string | null;
  publicadoEm: string;
}

export interface SugestaoAcervo {
  id: Id;
  alunoId: Id;
  acervoItemId: Id;
  /** Nulo = o aluno resolveu pelo acervo, sem abrir chamado. */
  duvidaId: Id | null;
  /** Porcentagem de 0 a 100. */
  similaridade: number;
  resolveu: boolean;
  sugeridaEm: string;
}

export interface AulaColetiva {
  id: Id;
  disciplinaId: Id;
  topicoId: Id;
  monitorId: Id;
  tema: string;
  /** Texto opcional exibido no card da aula. */
  descricao: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  minimoConfirmados: number;
  status: StatusAula;
  criadaEm: string;
}

export interface ReservaSala {
  id: Id;
  salaId: Id;
  aulaId: Id;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReserva;
}

export interface ConfirmacaoPresenca {
  id: Id;
  aulaId: Id;
  alunoId: Id;
  confirmadaEm: string;
}

export interface ConviteAula {
  id: Id;
  aulaId: Id;
  alunoId: Id;
  enviadoEm: string;
}

/** Pedido de troca de cargo (aluno <-> monitor). Só vale depois de validado por um administrador. */
export interface SolicitacaoCargo {
  id: Id;
  usuarioId: Id;
  cargoSolicitado: CargoUsuario;
  /** Disciplinas pretendidas (só para cargoSolicitado = "monitor"). */
  disciplinaIds: Id[];
  justificativa: string;
  status: StatusSolicitacao;
  criadaEm: string;
  decididaEm: string | null;
  decididaPorId: Id | null;
  observacao: string | null;
}

/** Estado completo do "banco" em memória (uma lista por tabela). */
export interface Db {
  usuarios: Usuario[];
  disciplinas: Disciplina[];
  topicos: Topico[];
  monitoresDisciplina: MonitorDisciplina[];
  salas: Sala[];
  duvidas: Duvida[];
  atribuicoes: AtribuicaoDuvida[];
  respostas: Resposta[];
  acervo: AcervoItem[];
  sugestoes: SugestaoAcervo[];
  aulas: AulaColetiva[];
  reservas: ReservaSala[];
  presencas: ConfirmacaoPresenca[];
  convites: ConviteAula[];
  solicitacoesCargo: SolicitacaoCargo[];
}
