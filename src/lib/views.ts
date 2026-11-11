/** Telas navegáveis de cada perfil e as rotas correspondentes. */
export type StudentView = "inicio" | "acervo" | "nova" | "duvidas" | "aulas" | "cargo";
export type MonitorView = "inicio" | "fila" | "aulas" | "cargo";
export type AdminView = "usuarios" | "solicitacoes";

export const studentPaths: Record<StudentView, string> = {
  inicio: "/aluno",
  acervo: "/aluno/acervo",
  nova: "/aluno/nova-duvida",
  duvidas: "/aluno/duvidas",
  aulas: "/aluno/aulas",
  cargo: "/aluno/cargo",
};

export const monitorPaths: Record<MonitorView, string> = {
  inicio: "/monitor",
  fila: "/monitor/fila",
  aulas: "/monitor/aulas",
  cargo: "/monitor/cargo",
};

export const adminPaths: Record<AdminView, string> = {
  usuarios: "/admin",
  solicitacoes: "/admin/solicitacoes",
};
