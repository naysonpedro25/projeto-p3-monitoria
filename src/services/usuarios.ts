/**
 * Cadastro, cargos e administração de usuários.
 * Toda ação administrativa confere, aqui na camada de serviço, se quem executa é um administrador ativo
 * (a interface esconde o painel, mas a regra de verdade fica nestas funções, como ficará no back-end).
 */
import { PERIODO_ATUAL } from "@/data/seed";
import { dataIso, emailInstitucional } from "@/domain/format";
import type { CargoUsuario, Db, Id, SolicitacaoCargo, Usuario } from "@/domain/types";
import {
  MSG_EMAIL_INSTITUCIONAL,
  ServiceError,
  cancelarAula,
  exigir,
  proximoId,
  type Resultado,
} from "./monitoria";
import {
  cargoDoUsuario,
  disciplinaPorId,
  ehAdmin,
  escolherMonitorDestino,
  solicitacaoPendenteDoUsuario,
  usuarioPorId,
} from "./selectors";

/* ------------------------------ cadastro com verificação de e-mail ------------------------------ */

export const VALIDADE_CODIGO_MIN = 10;
export const MAX_TENTATIVAS_CODIGO = 5;

export interface DadosCadastro {
  nome: string;
  email: string;
  curso: string;
}

/** Código enviado ao e-mail institucional. No front-end mockado ele fica em memória; no back-end, só o servidor o conhece. */
export interface VerificacaoEmail {
  dados: DadosCadastro;
  codigo: string;
  expiraEm: number;
  tentativas: number;
}

const normalizarDados = (d: DadosCadastro): DadosCadastro => ({
  nome: d.nome.trim().replace(/\s+/g, " "),
  email: d.email.trim().toLowerCase(),
  curso: d.curso.trim(),
});

/** Valida os dados e gera o código de 6 dígitos. Só e-mails @ufal.br (ou subdomínios) passam. */
export function iniciarVerificacao(
  db: Db,
  dados: DadosCadastro,
  agora: Date = new Date(),
  sorteio: () => number = Math.random,
): VerificacaoEmail {
  const limpos = normalizarDados(dados);
  exigir(limpos.nome.length >= 3, "Informe seu nome completo.");
  exigir(emailInstitucional(limpos.email), MSG_EMAIL_INSTITUCIONAL);
  exigir(
    !db.usuarios.some((u) => u.email.toLowerCase() === limpos.email),
    "Este e-mail já possui cadastro. Use a opção de entrar.",
  );
  const codigo = String(Math.floor(sorteio() * 1_000_000)).padStart(6, "0");
  return {
    dados: limpos,
    codigo,
    expiraEm: agora.getTime() + VALIDADE_CODIGO_MIN * 60_000,
    tentativas: 0,
  };
}

export type ResultadoCodigo =
  { ok: true } | { ok: false; erro: string; verificacao: VerificacaoEmail; bloqueado: boolean };

export function conferirCodigo(
  v: VerificacaoEmail,
  digitado: string,
  agora: Date = new Date(),
): ResultadoCodigo {
  if (v.tentativas >= MAX_TENTATIVAS_CODIGO) {
    return {
      ok: false,
      erro: "Muitas tentativas. Peça um novo código.",
      verificacao: v,
      bloqueado: true,
    };
  }
  if (agora.getTime() > v.expiraEm) {
    return {
      ok: false,
      erro: "O código expirou. Peça um novo código.",
      verificacao: v,
      bloqueado: true,
    };
  }
  if (digitado.trim() === v.codigo) return { ok: true };
  const novo = { ...v, tentativas: v.tentativas + 1 };
  const restantes = MAX_TENTATIVAS_CODIGO - novo.tentativas;
  return {
    ok: false,
    verificacao: novo,
    bloqueado: restantes <= 0,
    erro:
      restantes > 0
        ? `Código incorreto. Restam ${restantes} tentativa(s).`
        : "Muitas tentativas. Peça um novo código.",
  };
}

export interface PedidoMonitoria {
  disciplinaIds: Id[];
  justificativa: string;
}

/**
 * Cria a conta (sempre como aluno, ativa e sem acesso de administrador) depois que o código foi conferido.
 * Quem quer ser monitor entra como aluno e deixa uma solicitação pendente para o administrador validar.
 */
export function concluirCadastro(
  db: Db,
  verificacao: VerificacaoEmail,
  pedido: PedidoMonitoria | null,
  agora: Date = new Date(),
): Resultado<Usuario> {
  const { dados } = verificacao;
  exigir(emailInstitucional(dados.email), MSG_EMAIL_INSTITUCIONAL);
  exigir(
    !db.usuarios.some((u) => u.email.toLowerCase() === dados.email),
    "Este e-mail já possui cadastro.",
  );
  if (pedido) validarPedidoMonitoria(db, pedido);
  const usuario: Usuario = {
    id: proximoId(db.usuarios),
    nome: dados.nome,
    email: dados.email,
    curso: dados.curso || null,
    ativo: true,
    admin: false,
  };
  const comUsuario: Db = { ...db, usuarios: [...db.usuarios, usuario] };
  if (!pedido) return { db: comUsuario, valor: usuario };
  return {
    db: adicionarSolicitacao(comUsuario, usuario.id, "monitor", pedido, agora),
    valor: usuario,
  };
}

/* ------------------------------ solicitações de cargo ------------------------------ */

function validarPedidoMonitoria(db: Db, pedido: PedidoMonitoria): void {
  exigir(pedido.disciplinaIds.length > 0, "Escolha ao menos uma disciplina para a monitoria.");
  exigir(
    pedido.disciplinaIds.every((id) => disciplinaPorId(db, id)?.ativa === true),
    "Há disciplina inválida ou inativa na solicitação.",
  );
  exigir(
    pedido.justificativa.trim().length >= 10,
    "Explique em pelo menos 10 caracteres por que você quer ser monitor.",
  );
}

function adicionarSolicitacao(
  db: Db,
  usuarioId: Id,
  cargo: CargoUsuario,
  pedido: PedidoMonitoria,
  agora: Date,
): Db {
  const solicitacao: SolicitacaoCargo = {
    id: proximoId(db.solicitacoesCargo),
    usuarioId,
    cargoSolicitado: cargo,
    disciplinaIds: cargo === "monitor" ? [...new Set(pedido.disciplinaIds)] : [],
    justificativa: pedido.justificativa.trim(),
    status: "pendente",
    criadaEm: agora.toISOString(),
    decididaEm: null,
    decididaPorId: null,
    observacao: null,
  };
  return { ...db, solicitacoesCargo: [...db.solicitacoesCargo, solicitacao] };
}

/** O próprio usuário pede a troca de cargo. Nada muda até um administrador aprovar. */
export function solicitarMudancaCargo(
  db: Db,
  usuarioId: Id,
  cargo: CargoUsuario,
  pedido: PedidoMonitoria,
  agora: Date = new Date(),
): Resultado<SolicitacaoCargo> {
  const usuario = usuarioPorId(db, usuarioId);
  exigir(usuario?.ativo === true, "Conta inativa ou inexistente.");
  exigir(cargoDoUsuario(db, usuarioId) !== cargo, `Você já é ${cargo}.`);
  exigir(
    solicitacaoPendenteDoUsuario(db, usuarioId) === undefined,
    "Você já tem uma solicitação aguardando análise.",
  );
  if (cargo === "monitor") validarPedidoMonitoria(db, pedido);
  const novo = adicionarSolicitacao(db, usuarioId, cargo, pedido, agora);
  return {
    db: novo,
    valor: novo.solicitacoesCargo[novo.solicitacoesCargo.length - 1] as SolicitacaoCargo,
  };
}

export function cancelarSolicitacao(
  db: Db,
  usuarioId: Id,
  solicitacaoId: Id,
  agora: Date = new Date(),
): Db {
  const sol = db.solicitacoesCargo.find((s) => s.id === solicitacaoId);
  exigir(sol !== undefined && sol.usuarioId === usuarioId, "Solicitação não encontrada.");
  exigir(sol?.status === "pendente", "Esta solicitação já foi decidida.");
  return fecharSolicitacao(
    db,
    solicitacaoId,
    "cancelada",
    null,
    "Cancelada pelo solicitante.",
    agora,
  );
}

function fecharSolicitacao(
  db: Db,
  id: Id,
  status: SolicitacaoCargo["status"],
  porId: Id | null,
  observacao: string | null,
  agora: Date,
): Db {
  return {
    ...db,
    solicitacoesCargo: db.solicitacoesCargo.map((s) =>
      s.id === id
        ? { ...s, status, decididaEm: agora.toISOString(), decididaPorId: porId, observacao }
        : s,
    ),
  };
}

/* ------------------------------ ações de administrador ------------------------------ */

export function exigirAdmin(db: Db, atorId: Id): void {
  exigir(ehAdmin(db, atorId), "Apenas administradores podem executar esta ação.");
}

/** Valida (aprova) ou rejeita uma solicitação. Ninguém valida a própria solicitação. */
export function decidirSolicitacao(
  db: Db,
  adminId: Id,
  solicitacaoId: Id,
  aprovar: boolean,
  observacao: string,
  agora: Date = new Date(),
): Resultado<SolicitacaoCargo> {
  exigirAdmin(db, adminId);
  const sol = db.solicitacoesCargo.find((s) => s.id === solicitacaoId);
  exigir(sol !== undefined, "Solicitação não encontrada.");
  if (!sol) throw new ServiceError("Solicitação não encontrada.");
  exigir(sol.status === "pendente", "Esta solicitação já foi decidida.");
  exigir(
    sol.usuarioId !== adminId,
    "Você não pode validar a sua própria solicitação. Peça a outro administrador.",
  );
  const obs = observacao.trim() || null;
  if (!aprovar) {
    const novo = fecharSolicitacao(db, sol.id, "rejeitada", adminId, obs, agora);
    return {
      db: novo,
      valor: novo.solicitacoesCargo.find((s) => s.id === sol.id) as SolicitacaoCargo,
    };
  }
  const alvo = usuarioPorId(db, sol.usuarioId);
  exigir(alvo?.ativo === true, "O usuário desta solicitação está inativo.");
  if (sol.cargoSolicitado === "monitor") {
    validarPedidoMonitoria(db, {
      disciplinaIds: sol.disciplinaIds,
      justificativa: sol.justificativa,
    });
  }
  const aplicado = aplicarCargo(
    db,
    sol.usuarioId,
    sol.cargoSolicitado,
    sol.disciplinaIds,
    adminId,
    agora,
  );
  const novo = fecharSolicitacao(aplicado, sol.id, "aprovada", adminId, obs, agora);
  return {
    db: novo,
    valor: novo.solicitacoesCargo.find((s) => s.id === sol.id) as SolicitacaoCargo,
  };
}

/** O administrador altera o cargo diretamente (a própria ação já é a validação). Não vale para o próprio administrador. */
export function alterarCargoDireto(
  db: Db,
  adminId: Id,
  usuarioId: Id,
  cargo: CargoUsuario,
  disciplinaIds: Id[],
  agora: Date = new Date(),
): Resultado<Usuario> {
  exigirAdmin(db, adminId);
  const alvo = usuarioPorId(db, usuarioId);
  exigir(alvo !== undefined, "Usuário não encontrado.");
  if (!alvo) throw new ServiceError("Usuário não encontrado.");
  exigir(alvo.ativo, "Reative a conta antes de alterar o cargo.");
  exigir(
    alvo.id !== adminId,
    "Você não pode alterar o seu próprio cargo. Peça a outro administrador.",
  );
  const atual = new Set(
    db.monitoresDisciplina
      .filter((v) => v.monitorId === alvo.id && v.ativo)
      .map((v) => v.disciplinaId),
  );
  if (cargo === "monitor") {
    validarPedidoMonitoria(db, { disciplinaIds, justificativa: "ajuste feito pelo administrador" });
    const igual = disciplinaIds.length === atual.size && disciplinaIds.every((id) => atual.has(id));
    exigir(!igual, "Nenhuma alteração: o usuário já é monitor dessas disciplinas.");
  } else {
    exigir(atual.size > 0, "Este usuário já é aluno.");
  }
  let novo = aplicarCargo(db, alvo.id, cargo, disciplinaIds, adminId, agora);
  // O pedido em aberto deste usuário fica resolvido pela decisão do administrador.
  const pendente = solicitacaoPendenteDoUsuario(db, alvo.id);
  if (pendente) {
    const mesmo = pendente.cargoSolicitado === cargo;
    novo = fecharSolicitacao(
      novo,
      pendente.id,
      mesmo ? "aprovada" : "rejeitada",
      adminId,
      mesmo
        ? "Cargo alterado diretamente pelo administrador."
        : "Substituída por alteração direta do administrador.",
      agora,
    );
  }
  return { db: novo, valor: alvo };
}

/** Desativa ou reativa a conta. Desativar um monitor libera os chamados e cancela as aulas futuras dele. */
export function definirUsuarioAtivo(
  db: Db,
  adminId: Id,
  usuarioId: Id,
  ativo: boolean,
  agora: Date = new Date(),
): Resultado<Usuario> {
  exigirAdmin(db, adminId);
  const alvo = usuarioPorId(db, usuarioId);
  if (!alvo) throw new ServiceError("Usuário não encontrado.");
  exigir(alvo.id !== adminId, "Você não pode desativar a sua própria conta.");
  exigir(alvo.ativo !== ativo, ativo ? "A conta já está ativa." : "A conta já está desativada.");
  let novo: Db = {
    ...db,
    usuarios: db.usuarios.map((u) => (u.id === alvo.id ? { ...u, ativo } : u)),
  };
  if (!ativo) {
    novo = aplicarCargo(novo, alvo.id, "aluno", [], adminId, agora);
    const pendente = solicitacaoPendenteDoUsuario(novo, alvo.id);
    if (pendente)
      novo = fecharSolicitacao(novo, pendente.id, "cancelada", adminId, "Conta desativada.", agora);
  }
  return { db: novo, valor: { ...alvo, ativo } };
}

/** Concede ou retira o acesso de administrador. Sempre deve restar ao menos um administrador ativo. */
export function definirAdmin(
  db: Db,
  adminId: Id,
  usuarioId: Id,
  admin: boolean,
): Resultado<Usuario> {
  exigirAdmin(db, adminId);
  const alvo = usuarioPorId(db, usuarioId);
  if (!alvo) throw new ServiceError("Usuário não encontrado.");
  exigir(
    alvo.admin !== admin,
    admin ? "Este usuário já é administrador." : "Este usuário não é administrador.",
  );
  if (admin) {
    exigir(alvo.ativo, "Reative a conta antes de torná-la administradora.");
  } else {
    exigir(alvo.id !== adminId, "Você não pode retirar o seu próprio acesso de administrador.");
    exigir(
      db.usuarios.some((u) => u.id !== alvo.id && u.admin && u.ativo),
      "Deve existir ao menos um administrador ativo.",
    );
  }
  return {
    db: { ...db, usuarios: db.usuarios.map((u) => (u.id === alvo.id ? { ...u, admin } : u)) },
    valor: { ...alvo, admin },
  };
}

/* ------------------------------ efeitos da troca de cargo ------------------------------ */

/**
 * Deixa os vínculos do usuário exatamente nas disciplinas pedidas (cargo aluno = nenhuma).
 * Quem sai de uma disciplina tem os chamados abertos repassados ao monitor de menor carga
 * (ou devolvidos à fila geral, se não houver outro) e as aulas futuras canceladas.
 */
function aplicarCargo(
  db: Db,
  usuarioId: Id,
  cargo: CargoUsuario,
  disciplinaIds: Id[],
  porId: Id,
  agora: Date,
): Db {
  const alvo = new Set<Id>(cargo === "monitor" ? disciplinaIds : []);
  const eramAtivas = new Set(
    db.monitoresDisciplina
      .filter((v) => v.monitorId === usuarioId && v.ativo)
      .map((v) => v.disciplinaId),
  );
  const perdidas = [...eramAtivas].filter((id) => !alvo.has(id));

  let vinculos = db.monitoresDisciplina.map((v) =>
    v.monitorId === usuarioId && !alvo.has(v.disciplinaId) ? { ...v, ativo: false } : v,
  );
  let proximo = proximoId(vinculos);
  for (const disciplinaId of alvo) {
    const existente = vinculos.find(
      (v) =>
        v.monitorId === usuarioId && v.disciplinaId === disciplinaId && v.periodo === PERIODO_ATUAL,
    );
    if (existente) {
      vinculos = vinculos.map((v) => (v.id === existente.id ? { ...v, ativo: true } : v));
    } else {
      vinculos = [
        ...vinculos,
        { id: proximo++, monitorId: usuarioId, disciplinaId, periodo: PERIODO_ATUAL, ativo: true },
      ];
    }
  }
  let novo: Db = { ...db, monitoresDisciplina: vinculos };
  if (perdidas.length === 0) return novo;

  // 1) chamados em aberto das disciplinas que ele deixou
  const instante = agora.toISOString();
  const abertos = novo.duvidas.filter(
    (d) =>
      d.monitorId === usuarioId && d.status !== "respondida" && perdidas.includes(d.disciplinaId),
  );
  for (const duvida of abertos) {
    const destino = escolherMonitorDestino(novo, duvida.disciplinaId, [usuarioId, duvida.alunoId]);
    const atualizada = {
      ...duvida,
      monitorId: destino?.id ?? null,
      status: "pendente" as const,
      atualizadaEm: instante,
    };
    novo = {
      ...novo,
      duvidas: novo.duvidas.map((d) => (d.id === duvida.id ? atualizada : d)),
      atribuicoes: destino
        ? [
            ...novo.atribuicoes,
            {
              id: proximoId(novo.atribuicoes),
              duvidaId: duvida.id,
              monitorId: destino.id,
              atribuidoPorId: porId,
              tipo: "reatribuicao" as const,
              atribuidaEm: instante,
            },
          ]
        : novo.atribuicoes,
    };
  }
  // 2) aulas futuras ainda abertas ou confirmadas
  const hoje = dataIso(agora);
  const aulas = novo.aulas.filter(
    (a) =>
      a.monitorId === usuarioId &&
      perdidas.includes(a.disciplinaId) &&
      a.data >= hoje &&
      (a.status === "aberta" || a.status === "confirmada"),
  );
  for (const aula of aulas) novo = cancelarAula(novo, aula.id, usuarioId);
  return novo;
}
