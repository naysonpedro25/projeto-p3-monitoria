import { dataIso, normalizar } from "@/domain/format";
import type {
  AulaColetiva,
  CargoUsuario,
  Db,
  Disciplina,
  Duvida,
  Id,
  PerfilAcesso,
  ReservaSala,
  Sala,
  SolicitacaoCargo,
  Topico,
  Usuario,
} from "@/domain/types";

export const usuarioPorId = (db: Db, id: Id): Usuario | undefined =>
  db.usuarios.find((u) => u.id === id);
export const disciplinaPorId = (db: Db, id: Id): Disciplina | undefined =>
  db.disciplinas.find((d) => d.id === id);
export const topicoPorId = (db: Db, id: Id): Topico | undefined =>
  db.topicos.find((t) => t.id === id);
export const salaPorId = (db: Db, id: Id): Sala | undefined => db.salas.find((s) => s.id === id);

export const nomeUsuario = (db: Db, id: Id | null): string =>
  id === null ? "—" : (usuarioPorId(db, id)?.nome ?? "—");
export const nomeDisciplina = (db: Db, id: Id): string => disciplinaPorId(db, id)?.nome ?? "—";
export const nomeTopico = (db: Db, id: Id): string => topicoPorId(db, id)?.nome ?? "—";
export const rotuloSala = (sala: Sala | undefined): string =>
  sala ? `${sala.nome} — ${sala.bloco}` : "A confirmar";

export const topicosDaDisciplina = (db: Db, disciplinaId: Id): Topico[] =>
  db.topicos.filter((t) => t.disciplinaId === disciplinaId);

/* ------------------------------ perfis ------------------------------ */

/** Vínculos ativos do usuário em disciplinas ativas (view vw_perfis_usuario). */
export function vinculosAtivos(db: Db, usuarioId: Id) {
  return db.monitoresDisciplina.filter(
    (v) =>
      v.monitorId === usuarioId && v.ativo && (disciplinaPorId(db, v.disciplinaId)?.ativa ?? false),
  );
}

export const disciplinasDoMonitor = (db: Db, monitorId: Id): Disciplina[] =>
  vinculosAtivos(db, monitorId).flatMap((v) => disciplinaPorId(db, v.disciplinaId) ?? []);

export const eMonitor = (db: Db, usuarioId: Id): boolean =>
  vinculosAtivos(db, usuarioId).length > 0;

export const monitorAtivoNaDisciplina = (db: Db, usuarioId: Id, disciplinaId: Id): boolean =>
  vinculosAtivos(db, usuarioId).some((v) => v.disciplinaId === disciplinaId);

export function monitoresDaDisciplina(db: Db, disciplinaId: Id): Usuario[] {
  return db.monitoresDisciplina
    .filter((v) => v.disciplinaId === disciplinaId && v.ativo)
    .flatMap((v) => usuarioPorId(db, v.monitorId) ?? [])
    .filter((u) => u.ativo);
}

export function perfisDoUsuario(db: Db, usuarioId: Id): PerfilAcesso[] {
  const perfis: PerfilAcesso[] = eMonitor(db, usuarioId) ? ["aluno", "monitor"] : ["aluno"];
  if (usuarioPorId(db, usuarioId)?.admin) perfis.push("admin");
  return perfis;
}

export const cargoDoUsuario = (db: Db, usuarioId: Id): CargoUsuario =>
  eMonitor(db, usuarioId) ? "monitor" : "aluno";

export const ehAdmin = (db: Db, usuarioId: Id): boolean => {
  const u = usuarioPorId(db, usuarioId);
  return u !== undefined && u.ativo && u.admin;
};

export const solicitacaoPendenteDoUsuario = (db: Db, usuarioId: Id): SolicitacaoCargo | undefined =>
  db.solicitacoesCargo.find((s) => s.usuarioId === usuarioId && s.status === "pendente");

export const solicitacoesPendentes = (db: Db): SolicitacaoCargo[] =>
  db.solicitacoesCargo
    .filter((s) => s.status === "pendente")
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));

export const solicitacoesDoUsuario = (db: Db, usuarioId: Id): SolicitacaoCargo[] =>
  db.solicitacoesCargo
    .filter((s) => s.usuarioId === usuarioId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

/* ------------------------------ dúvidas ------------------------------ */

const emAberto = (d: Duvida) => d.status !== "respondida";

export const duvidasDoAluno = (db: Db, alunoId: Id): Duvida[] =>
  db.duvidas
    .filter((d) => d.alunoId === alunoId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

/** "Atribuídas a mim". */
export const filaAtribuida = (db: Db, monitorId: Id): Duvida[] =>
  db.duvidas
    .filter((d) => d.monitorId === monitorId && emAberto(d))
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));

/** "Fila geral": todos os chamados em aberto das disciplinas em que o monitor atua. */
export function filaGeral(db: Db, monitorId: Id): Duvida[] {
  const ids = new Set(vinculosAtivos(db, monitorId).map((v) => v.disciplinaId));
  return db.duvidas
    .filter((d) => ids.has(d.disciplinaId) && emAberto(d))
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
}

/** Carga atual do monitor = chamados atribuídos e ainda não respondidos (view vw_monitor_carga). */
export const cargaMonitor = (db: Db, monitorId: Id): number => filaAtribuida(db, monitorId).length;

export const respondidasPorMonitor = (db: Db, monitorId: Id): number =>
  db.respostas.filter((r) => r.monitorId === monitorId).length;

export const nivelCarga = (carga: number): "Leve" | "Moderada" | "Alta" =>
  carga <= 3 ? "Leve" : carga <= 6 ? "Moderada" : "Alta";

export const novasAtribuicoes = (db: Db, monitorId: Id, horas: number, agora: Date): number =>
  db.atribuicoes.filter(
    (a) =>
      a.monitorId === monitorId &&
      agora.getTime() - new Date(a.atribuidaEm).getTime() <= horas * 3_600_000,
  ).length;

export const respostaDaDuvida = (db: Db, duvidaId: Id) =>
  db.respostas.find((r) => r.duvidaId === duvidaId);

/* ------------------------------ acervo ------------------------------ */

export interface FiltroAcervo {
  texto: string;
  disciplinaId: Id | null;
  topicoId: Id | null;
}

export function buscarAcervo(db: Db, filtro: FiltroAcervo) {
  const termo = normalizar(filtro.texto.trim());
  return db.acervo
    .filter((item) => filtro.disciplinaId === null || item.disciplinaId === filtro.disciplinaId)
    .filter((item) => filtro.topicoId === null || item.topicoId === filtro.topicoId)
    .filter((item) => {
      if (!termo) return true;
      const alvo = normalizar(`${item.titulo} ${item.conteudo} ${nomeTopico(db, item.topicoId)}`);
      return termo.split(/\s+/).every((palavra) => alvo.includes(palavra));
    })
    .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));
}

/* -------------------------- tópicos frequentes -------------------------- */

export interface TopicoFrequente {
  topico: Topico;
  disciplina: Disciplina;
  quantidade: number;
  alunosIds: Id[];
}

/** Tópicos com muitas dúvidas recentes e sem aula coletiva já marcada (função fn_topicos_frequentes). */
export function topicosFrequentes(
  db: Db,
  disciplinaIds: Id[],
  agora: Date,
  dias = 7,
  minimo = 3,
): TopicoFrequente[] {
  const limite = agora.getTime() - dias * 86_400_000;
  const hoje = dataIso(agora);
  const resultado: TopicoFrequente[] = [];
  for (const topico of db.topicos) {
    if (!disciplinaIds.includes(topico.disciplinaId)) continue;
    const recentes = db.duvidas.filter(
      (d) => d.topicoId === topico.id && new Date(d.criadaEm).getTime() >= limite,
    );
    const jaTemAula = db.aulas.some(
      (a) =>
        a.topicoId === topico.id &&
        (a.status === "aberta" || a.status === "confirmada") &&
        a.data >= hoje,
    );
    const disciplina = disciplinaPorId(db, topico.disciplinaId);
    if (recentes.length >= minimo && !jaTemAula && disciplina) {
      resultado.push({
        topico,
        disciplina,
        quantidade: recentes.length,
        alunosIds: [...new Set(recentes.map((d) => d.alunoId))],
      });
    }
  }
  return resultado.sort((a, b) => b.quantidade - a.quantidade);
}

/* ------------------------------ aulas coletivas ------------------------------ */

export const reservaAtiva = (db: Db, aulaId: Id): ReservaSala | undefined =>
  db.reservas.find((r) => r.aulaId === aulaId && r.status !== "cancelada");

export const confirmadosDaAula = (db: Db, aulaId: Id): number =>
  db.presencas.filter((p) => p.aulaId === aulaId).length;

export const alunoConfirmou = (db: Db, aulaId: Id, alunoId: Id): boolean =>
  db.presencas.some((p) => p.aulaId === aulaId && p.alunoId === alunoId);

export const alunoConvidado = (db: Db, aulaId: Id, alunoId: Id): boolean =>
  db.convites.some((c) => c.aulaId === aulaId && c.alunoId === alunoId);

const porDataHora = (a: AulaColetiva, b: AulaColetiva) =>
  `${a.data}${a.horaInicio}`.localeCompare(`${b.data}${b.horaInicio}`);

/** Aulas futuras que aceitam confirmação. */
export const aulasAbertas = (db: Db, agora: Date): AulaColetiva[] =>
  db.aulas
    .filter((a) => (a.status === "aberta" || a.status === "confirmada") && a.data >= dataIso(agora))
    .sort(porDataHora);

export const aulasDoMonitor = (db: Db, monitorId: Id): AulaColetiva[] =>
  db.aulas.filter((a) => a.monitorId === monitorId && a.status !== "cancelada").sort(porDataHora);

/** Próxima aula com presença confirmada do aluno (view vw_aulas_confirmadas_aluno). */
export function proximaMonitoria(db: Db, alunoId: Id, agora: Date) {
  const aula = aulasAbertas(db, agora).find((a) => alunoConfirmou(db, a.id, alunoId));
  if (!aula) return null;
  const reserva = reservaAtiva(db, aula.id);
  const sala = reserva?.status === "confirmada" ? salaPorId(db, reserva.salaId) : undefined;
  return { aula, sala };
}

/** Monitor ativo de menor carga em uma disciplina, ignorando os ids em `excluir` (mesma regra da atribuição automática). */
export function escolherMonitorDestino(
  db: Db,
  disciplinaId: Id,
  excluir: Id[] = [],
): Usuario | null {
  const candidatos = monitoresDaDisciplina(db, disciplinaId).filter((m) => !excluir.includes(m.id));
  return (
    [...candidatos].sort(
      (a, b) => cargaMonitor(db, a.id) - cargaMonitor(db, b.id) || a.id - b.id,
    )[0] ?? null
  );
}
