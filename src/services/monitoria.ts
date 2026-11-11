/**
 * Regras de negócio do Monitora IC, em funções puras: recebem o estado (Db) e devolvem o novo estado.
 * Elas reproduzem as regras que o banco aplica (gatilhos e restrições), e lançam ServiceError
 * com mensagem em português quando uma regra é violada.
 *
 * Para trocar o mock por um back-end real, mantenha as assinaturas e implemente cada
 * função com uma chamada HTTP (veja o README).
 */
import { dataIso, emailInstitucional, normalizar, sobrepoe } from "@/domain/format";
import type {
  AcervoItem,
  AulaColetiva,
  Db,
  Duvida,
  Id,
  PerfilAcesso,
  Resposta,
  ReservaSala,
  SugestaoAcervo,
  Usuario,
} from "@/domain/types";
import {
  alunoConfirmou,
  cargaMonitor,
  confirmadosDaAula,
  disciplinaPorId,
  monitorAtivoNaDisciplina,
  monitoresDaDisciplina,
  reservaAtiva,
  salaPorId,
  topicoPorId,
  vinculosAtivos,
} from "./selectors";

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export interface Resultado<T> {
  db: Db;
  valor: T;
}

export const proximoId = (itens: { id: Id }[]): Id =>
  itens.reduce((max, i) => Math.max(max, i.id), 0) + 1;
export const exigir = (condicao: boolean, mensagem: string): void => {
  if (!condicao) throw new ServiceError(mensagem);
};

/* ------------------------------ autenticação ------------------------------ */

export const MSG_EMAIL_INSTITUCIONAL =
  "Use seu e-mail institucional da UFAL (final @ufal.br ou @ic.ufal.br).";

/** Login: e-mail institucional cadastrado e ativo; monitor exige vínculo ativo e administrador exige o acesso. */
export function autenticar(db: Db, email: string, perfil: PerfilAcesso): Usuario {
  const limpo = email.trim().toLowerCase();
  exigir(emailInstitucional(limpo), MSG_EMAIL_INSTITUCIONAL);
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === limpo);
  if (!usuario)
    throw new ServiceError("E-mail não cadastrado na central de monitoria. Crie sua conta.");
  exigir(usuario.ativo, "Esta conta está desativada. Procure a secretaria para reativá-la.");
  if (perfil === "monitor") {
    exigir(
      vinculosAtivos(db, usuario.id).length > 0,
      "Este e-mail não possui vínculo ativo de monitoria.",
    );
  }
  if (perfil === "admin") {
    exigir(usuario.admin, "Este e-mail não possui acesso de administrador.");
  }
  return usuario;
}

/* ------------------------------ sugestões do acervo ------------------------------ */

const PALAVRAS_VAZIAS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "uns",
  "umas",
  "para",
  "por",
  "com",
  "sem",
  "que",
  "como",
  "qual",
  "quais",
  "quando",
  "porque",
  "isso",
  "esse",
  "essa",
  "ser",
  "sao",
  "eu",
  "meu",
  "minha",
  "nao",
  "mas",
  "ou",
  "os",
  "as",
  "ao",
  "aos",
  "se",
  "mais",
]);

function palavras(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length > 2 && !PALAVRAS_VAZIAS.has(p)),
  );
}

export interface SugestaoCalculada {
  acervoItemId: Id;
  similaridade: number;
}

/**
 * Similaridade (0–100) entre o que o aluno digitou e os itens do acervo da mesma disciplina.
 * 75% vem das palavras em comum e 25% de o tópico coincidir (só conta se houver palavra em comum).
 */
export function sugerirAcervo(
  db: Db,
  entrada: { disciplinaId: Id; topicoId: Id; texto: string },
  limite = 3,
  minimo = 25,
): SugestaoCalculada[] {
  const digitadas = palavras(entrada.texto);
  if (digitadas.size === 0) return [];
  return db.acervo
    .filter((item) => item.disciplinaId === entrada.disciplinaId)
    .map((item) => {
      const doItem = palavras(`${item.titulo} ${item.conteudo}`);
      const comuns = [...digitadas].filter((p) => doItem.has(p)).length;
      const cobertura = comuns / digitadas.size;
      const mesmoTopico = item.topicoId === entrada.topicoId ? 1 : 0;
      const bruto = comuns > 0 ? 0.75 * cobertura + 0.25 * mesmoTopico : 0;
      return { acervoItemId: item.id, similaridade: Math.min(98, Math.round(bruto * 100)) };
    })
    .filter((s) => s.similaridade >= minimo)
    .sort((a, b) => b.similaridade - a.similaridade)
    .slice(0, limite);
}

/** "Isso resolveu minha dúvida": registra a sugestão como resolvida, sem abrir chamado. */
export function resolverPeloAcervo(
  db: Db,
  alunoId: Id,
  acervoItemId: Id,
  similaridade: number,
  agora: Date = new Date(),
): Resultado<SugestaoAcervo> {
  exigir(
    db.acervo.some((i) => i.id === acervoItemId),
    "Item do acervo não encontrado.",
  );
  const sugestao: SugestaoAcervo = {
    id: proximoId(db.sugestoes),
    alunoId,
    acervoItemId,
    duvidaId: null,
    similaridade,
    resolveu: true,
    sugeridaEm: agora.toISOString(),
  };
  return { db: { ...db, sugestoes: [...db.sugestoes, sugestao] }, valor: sugestao };
}

/* ------------------------------ dúvidas ------------------------------ */

export interface NovaDuvida {
  alunoId: Id;
  disciplinaId: Id;
  topicoId: Id;
  titulo: string;
  descricao: string;
  /** Sugestões que estavam na tela quando o aluno enviou (ficam ligadas à dúvida). */
  sugestoesExibidas: SugestaoCalculada[];
}

/** Escolhe o monitor ativo de menor carga (empate: o de menor id). Nunca o próprio aluno. */
export function escolherMonitorMenorCarga(
  db: Db,
  disciplinaId: Id,
  excluir: Id[] = [],
): Usuario | null {
  const candidatos = monitoresDaDisciplina(db, disciplinaId).filter((m) => !excluir.includes(m.id));
  const ordenados = [...candidatos].sort(
    (a, b) => cargaMonitor(db, a.id) - cargaMonitor(db, b.id) || a.id - b.id,
  );
  return ordenados[0] ?? null;
}

export function criarDuvida(
  db: Db,
  entrada: NovaDuvida,
  agora: Date = new Date(),
): Resultado<{ duvida: Duvida; monitor: Usuario | null }> {
  exigir(entrada.titulo.trim().length > 0, "Informe o título da dúvida.");
  exigir(entrada.descricao.trim().length > 0, "Descreva sua dúvida.");
  const disciplina = disciplinaPorId(db, entrada.disciplinaId);
  exigir(disciplina?.ativa === true, "Disciplina inválida ou inativa.");
  const topico = topicoPorId(db, entrada.topicoId);
  exigir(
    topico?.disciplinaId === entrada.disciplinaId,
    "O tópico não pertence à disciplina escolhida.",
  );

  const monitor = escolherMonitorMenorCarga(db, entrada.disciplinaId, [entrada.alunoId]);
  const instante = agora.toISOString();
  const duvida: Duvida = {
    id: proximoId(db.duvidas),
    alunoId: entrada.alunoId,
    disciplinaId: entrada.disciplinaId,
    topicoId: entrada.topicoId,
    monitorId: monitor?.id ?? null,
    titulo: entrada.titulo.trim(),
    descricao: entrada.descricao.trim(),
    status: "pendente",
    criadaEm: instante,
    atualizadaEm: instante,
  };
  const atribuicoes = monitor
    ? [
        ...db.atribuicoes,
        {
          id: proximoId(db.atribuicoes),
          duvidaId: duvida.id,
          monitorId: monitor.id,
          atribuidoPorId: null,
          tipo: "automatica" as const,
          atribuidaEm: instante,
        },
      ]
    : db.atribuicoes;

  let proxSugestao = proximoId(db.sugestoes);
  const sugestoes = [
    ...db.sugestoes,
    ...entrada.sugestoesExibidas.map((s) => ({
      id: proxSugestao++,
      alunoId: entrada.alunoId,
      acervoItemId: s.acervoItemId,
      duvidaId: duvida.id,
      similaridade: s.similaridade,
      resolveu: false,
      sugeridaEm: instante,
    })),
  ];
  return {
    db: { ...db, duvidas: [duvida, ...db.duvidas], atribuicoes, sugestoes },
    valor: { duvida, monitor },
  };
}

function buscarDuvida(db: Db, duvidaId: Id): Duvida {
  const duvida = db.duvidas.find((d) => d.id === duvidaId);
  if (!duvida) throw new ServiceError("Dúvida não encontrada.");
  return duvida;
}

const atualizarDuvida = (db: Db, nova: Duvida): Db => ({
  ...db,
  duvidas: db.duvidas.map((d) => (d.id === nova.id ? nova : d)),
});

/** Ao abrir um chamado pendente que é seu, ele passa a "em atendimento". */
export function iniciarAtendimento(
  db: Db,
  duvidaId: Id,
  monitorId: Id,
  agora: Date = new Date(),
): Db {
  const duvida = buscarDuvida(db, duvidaId);
  if (duvida.monitorId !== monitorId || duvida.status !== "pendente") return db;
  return atualizarDuvida(db, {
    ...duvida,
    status: "em_atendimento",
    atualizadaEm: agora.toISOString(),
  });
}

/** Reatribui o chamado. Sem destino informado, escolhe o monitor de menor carga. */
export function reatribuirDuvida(
  db: Db,
  duvidaId: Id,
  porMonitorId: Id,
  paraMonitorId: Id | null,
  agora: Date = new Date(),
): Resultado<Usuario> {
  const duvida = buscarDuvida(db, duvidaId);
  exigir(duvida.status !== "respondida", "Chamados respondidos não podem ser reatribuídos.");
  exigir(
    monitorAtivoNaDisciplina(db, porMonitorId, duvida.disciplinaId),
    "Só monitores ativos da disciplina podem reatribuir.",
  );
  const destino =
    paraMonitorId === null
      ? escolherMonitorMenorCarga(db, duvida.disciplinaId, [porMonitorId, duvida.alunoId])
      : (monitoresDaDisciplina(db, duvida.disciplinaId).find((m) => m.id === paraMonitorId) ??
        null);
  exigir(destino !== null, "Não há outro monitor ativo nesta disciplina.");
  if (!destino) throw new ServiceError("Não há outro monitor ativo nesta disciplina.");
  exigir(destino.id !== duvida.alunoId, "O autor da dúvida não pode atendê-la.");
  exigir(destino.id !== duvida.monitorId, "O chamado já está com esse monitor.");
  const instante = agora.toISOString();
  const atribuicao = {
    id: proximoId(db.atribuicoes),
    duvidaId,
    monitorId: destino.id,
    atribuidoPorId: porMonitorId,
    tipo: "reatribuicao" as const,
    atribuidaEm: instante,
  };
  const novo = atualizarDuvida(db, {
    ...duvida,
    monitorId: destino.id,
    status: "pendente",
    atualizadaEm: instante,
  });
  return { db: { ...novo, atribuicoes: [...db.atribuicoes, atribuicao] }, valor: destino };
}

export interface NovaResposta {
  duvidaId: Id;
  monitorId: Id;
  texto: string;
  codigo: string;
  publicarNoAcervo: boolean;
}

/** Responder conclui a dúvida e, se pedido, publica no acervo. */
export function responderDuvida(
  db: Db,
  entrada: NovaResposta,
  agora: Date = new Date(),
): Resultado<{ resposta: Resposta; itemAcervo: AcervoItem | null }> {
  const duvida = buscarDuvida(db, entrada.duvidaId);
  exigir(duvida.status !== "respondida", "Esta dúvida já foi respondida.");
  exigir(
    monitorAtivoNaDisciplina(db, entrada.monitorId, duvida.disciplinaId),
    "Só monitores ativos da disciplina podem responder.",
  );
  exigir(entrada.monitorId !== duvida.alunoId, "O autor da dúvida não pode respondê-la.");
  exigir(entrada.texto.trim().length > 0, "Digite uma resposta antes de concluir.");

  const instante = agora.toISOString();
  const codigo = entrada.codigo.trim() ? entrada.codigo.trim() : null;
  const resposta: Resposta = {
    id: proximoId(db.respostas),
    duvidaId: duvida.id,
    monitorId: entrada.monitorId,
    texto: entrada.texto.trim(),
    codigo,
    publicarNoAcervo: entrada.publicarNoAcervo,
    respondidaEm: instante,
  };
  const periodo =
    vinculosAtivos(db, entrada.monitorId).find((v) => v.disciplinaId === duvida.disciplinaId)
      ?.periodo ?? null;
  const item: AcervoItem | null = entrada.publicarNoAcervo
    ? {
        id: proximoId(db.acervo),
        disciplinaId: duvida.disciplinaId,
        topicoId: duvida.topicoId,
        respostaId: resposta.id,
        titulo: duvida.titulo,
        conteudo: resposta.texto,
        codigo,
        periodo,
        publicadoEm: instante,
      }
    : null;
  const atualizado = atualizarDuvida(db, {
    ...duvida,
    monitorId: entrada.monitorId,
    status: "respondida",
    atualizadaEm: instante,
  });
  return {
    db: {
      ...atualizado,
      respostas: [...db.respostas, resposta],
      acervo: item ? [item, ...db.acervo] : db.acervo,
    },
    valor: { resposta, itemAcervo: item },
  };
}

/* ------------------------------ aulas coletivas ------------------------------ */

export interface NovaAula {
  monitorId: Id;
  disciplinaId: Id;
  topicoId: Id;
  tema: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  minimoConfirmados: number;
  salaId: Id;
}

/** Cria a aula, reserva a sala (pendente) e convida os alunos que perguntaram sobre o tópico. */
export function criarAulaColetiva(
  db: Db,
  entrada: NovaAula,
  agora: Date = new Date(),
): Resultado<{ aula: AulaColetiva; reserva: ReservaSala; convidados: number }> {
  exigir(
    monitorAtivoNaDisciplina(db, entrada.monitorId, entrada.disciplinaId),
    "Só monitores ativos da disciplina podem organizar aulas.",
  );
  exigir(
    topicoPorId(db, entrada.topicoId)?.disciplinaId === entrada.disciplinaId,
    "O tópico não pertence à disciplina.",
  );
  exigir(entrada.tema.trim().length > 0, "Informe o tema da aula.");
  exigir(entrada.data >= dataIso(agora), "Escolha uma data a partir de hoje.");
  exigir(entrada.horaFim > entrada.horaInicio, "O horário de término deve ser depois do início.");
  exigir(entrada.minimoConfirmados > 0, "O mínimo de confirmados deve ser maior que zero.");
  const sala = salaPorId(db, entrada.salaId);
  exigir(sala?.ativa === true, "Escolha uma sala disponível.");
  if (!sala) throw new ServiceError("Escolha uma sala disponível.");
  exigir(
    sala.capacidade >= entrada.minimoConfirmados,
    `A ${sala.nome} comporta no máximo ${sala.capacidade} pessoas.`,
  );

  const conflitoMonitor = db.aulas.some(
    (a) =>
      a.monitorId === entrada.monitorId &&
      a.status !== "cancelada" &&
      a.data === entrada.data &&
      sobrepoe(a.horaInicio, a.horaFim, entrada.horaInicio, entrada.horaFim),
  );
  exigir(!conflitoMonitor, "Você já tem uma aula neste horário.");
  const conflitoSala = db.reservas.some(
    (r) =>
      r.salaId === entrada.salaId &&
      r.status !== "cancelada" &&
      r.data === entrada.data &&
      sobrepoe(r.horaInicio, r.horaFim, entrada.horaInicio, entrada.horaFim),
  );
  exigir(!conflitoSala, `A ${sala.nome} já está reservada neste horário.`);

  const instante = agora.toISOString();
  const aula: AulaColetiva = {
    id: proximoId(db.aulas),
    disciplinaId: entrada.disciplinaId,
    topicoId: entrada.topicoId,
    monitorId: entrada.monitorId,
    tema: entrada.tema.trim(),
    descricao: entrada.descricao.trim() || null,
    data: entrada.data,
    horaInicio: entrada.horaInicio,
    horaFim: entrada.horaFim,
    minimoConfirmados: entrada.minimoConfirmados,
    status: "aberta",
    criadaEm: instante,
  };
  const reserva: ReservaSala = {
    id: proximoId(db.reservas),
    salaId: entrada.salaId,
    aulaId: aula.id,
    data: aula.data,
    horaInicio: aula.horaInicio,
    horaFim: aula.horaFim,
    status: "pendente",
  };
  const interessados = [
    ...new Set(
      db.duvidas
        .filter((d) => d.topicoId === entrada.topicoId && d.alunoId !== entrada.monitorId)
        .map((d) => d.alunoId),
    ),
  ];
  let proxConvite = proximoId(db.convites);
  const convites = interessados.map((alunoId) => ({
    id: proxConvite++,
    aulaId: aula.id,
    alunoId,
    enviadoEm: instante,
  }));
  return {
    db: {
      ...db,
      aulas: [...db.aulas, aula],
      reservas: [...db.reservas, reserva],
      convites: [...db.convites, ...convites],
    },
    valor: { aula, reserva, convidados: convites.length },
  };
}

export function cancelarAula(db: Db, aulaId: Id, monitorId: Id): Db {
  const aula = db.aulas.find((a) => a.id === aulaId);
  exigir(aula !== undefined, "Aula não encontrada.");
  if (!aula) throw new ServiceError("Aula não encontrada.");
  exigir(aula.monitorId === monitorId, "Só o organizador pode cancelar a aula.");
  exigir(
    aula.status === "aberta" || aula.status === "confirmada",
    "Esta aula não pode mais ser cancelada.",
  );
  return {
    ...db,
    aulas: db.aulas.map((a) => (a.id === aulaId ? { ...a, status: "cancelada" as const } : a)),
    reservas: db.reservas.map((r) =>
      r.aulaId === aulaId ? { ...r, status: "cancelada" as const } : r,
    ),
  };
}

/** Sala confirmada ao atingir o mínimo; volta a pendente se cair abaixo. */
function sincronizarAula(db: Db, aulaId: Id): Db {
  const aula = db.aulas.find((a) => a.id === aulaId);
  if (!aula || (aula.status !== "aberta" && aula.status !== "confirmada")) return db;
  const atingiu = confirmadosDaAula(db, aulaId) >= aula.minimoConfirmados;
  return {
    ...db,
    aulas: db.aulas.map((a) =>
      a.id === aulaId
        ? { ...a, status: atingiu ? ("confirmada" as const) : ("aberta" as const) }
        : a,
    ),
    reservas: db.reservas.map((r) =>
      r.aulaId === aulaId && r.status !== "cancelada"
        ? { ...r, status: atingiu ? ("confirmada" as const) : ("pendente" as const) }
        : r,
    ),
  };
}

export function confirmarPresenca(
  db: Db,
  aulaId: Id,
  alunoId: Id,
  agora: Date = new Date(),
): Resultado<{ salaConfirmada: boolean }> {
  const aula = db.aulas.find((a) => a.id === aulaId);
  exigir(aula !== undefined, "Aula não encontrada.");
  if (!aula) throw new ServiceError("Aula não encontrada.");
  exigir(
    aula.status === "aberta" || aula.status === "confirmada",
    "Esta aula não aceita mais confirmações.",
  );
  exigir(aula.data >= dataIso(agora), "Esta aula já aconteceu.");
  exigir(aula.monitorId !== alunoId, "Você organiza esta aula.");
  exigir(!alunoConfirmou(db, aulaId, alunoId), "Você já confirmou presença nesta aula.");
  const reserva = reservaAtiva(db, aulaId);
  const sala = reserva ? salaPorId(db, reserva.salaId) : undefined;
  if (sala) exigir(confirmadosDaAula(db, aulaId) < sala.capacidade, `A ${sala.nome} está lotada.`);
  const presenca = {
    id: proximoId(db.presencas),
    aulaId,
    alunoId,
    confirmadaEm: agora.toISOString(),
  };
  const sincronizado = sincronizarAula({ ...db, presencas: [...db.presencas, presenca] }, aulaId);
  return {
    db: sincronizado,
    valor: { salaConfirmada: reservaAtiva(sincronizado, aulaId)?.status === "confirmada" },
  };
}

export function removerPresenca(db: Db, aulaId: Id, alunoId: Id): Db {
  exigir(alunoConfirmou(db, aulaId, alunoId), "Você não tinha confirmado presença.");
  return sincronizarAula(
    {
      ...db,
      presencas: db.presencas.filter((p) => !(p.aulaId === aulaId && p.alunoId === alunoId)),
    },
    aulaId,
  );
}
