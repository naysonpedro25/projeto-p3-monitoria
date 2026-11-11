import { useMemo, useState } from "react";
import { DotsThree, UserGear } from "@phosphor-icons/react";
import { RoleRequestFields, alternarId } from "@/components/common/role-request-fields";
import { CLASSE_SELECT, Selecao } from "@/components/common/select-field";
import { EmptyState, PageHeader, StatCard } from "@/components/shared-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { normalizar } from "@/domain/format";
import type { CargoUsuario, Id, Usuario } from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  cargoDoUsuario,
  disciplinasDoMonitor,
  solicitacaoPendenteDoUsuario,
  usuarioPorId,
} from "@/services/selectors";
import { alterarCargoDireto, definirAdmin, definirUsuarioAtivo } from "@/services/usuarios";
import { useSessaoAtiva } from "@/store/monitoria-store";

type RoleFilter = "todos" | CargoUsuario | "admin";
type StatusFilter = "todos" | "ativo" | "inativo";

/** Painel de administração: lista de usuários, cargos, ativação de contas e acesso de administrador. */
export function UsersView() {
  const { db, usuario: me, executar } = useSessaoAtiva();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [editing, setEditing] = useState<Id | null>(null);

  const total = db.usuarios.length;
  const active = db.usuarios.filter((u) => u.ativo).length;
  const monitors = db.usuarios.filter(
    (u) => u.ativo && cargoDoUsuario(db, u.id) === "monitor",
  ).length;
  const admins = db.usuarios.filter((u) => u.ativo && u.admin).length;

  const list = useMemo(() => {
    const term = normalizar(search.trim());
    return [...db.usuarios]
      .filter((u) => !term || normalizar(`${u.nome} ${u.email}`).includes(term))
      .filter((u) => {
        if (roleFilter === "admin") return u.admin;
        return roleFilter === "todos" || cargoDoUsuario(db, u.id) === roleFilter;
      })
      .filter((u) => statusFilter === "todos" || (statusFilter === "ativo") === u.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [db, search, roleFilter, statusFilter]);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        text="Gerencie contas, cargos e acessos da central de monitoria."
      />

      <div className="mb-9 grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <StatCard label="Usuários" value={String(total)} note={`${active} com conta ativa`} />
        <StatCard
          label="Alunos"
          value={String(active - monitors)}
          note="Sem vínculo de monitoria"
        />
        <StatCard label="Monitores" value={String(monitors)} note="Com vínculo ativo" />
        <StatCard label="Administradores" value={String(admins)} note="Com acesso a este painel" />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_11rem_11rem]">
        <Selecao rotulo="Buscar">
          <Input
            className="mt-2 h-11 font-normal"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou e-mail"
          />
        </Selecao>
        <Selecao rotulo="Cargo">
          <select
            className={CLASSE_SELECT}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          >
            <option value="todos">Todos</option>
            <option value="aluno">Aluno</option>
            <option value="monitor">Monitor</option>
            <option value="admin">Administrador</option>
          </select>
        </Selecao>
        <Selecao rotulo="Situação">
          <select
            className={CLASSE_SELECT}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="todos">Todas</option>
            <option value="ativo">Ativas</option>
            <option value="inativo">Desativadas</option>
          </select>
        </Selecao>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" text="Ajuste a busca ou os filtros." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((u) => {
            const role = cargoDoUsuario(db, u.id);
            const isMe = u.id === me.id;
            const pending = solicitacaoPendenteDoUsuario(db, u.id);
            return (
              <li
                key={u.id}
                className={cn(
                  "flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between",
                  !u.ativo && "opacity-60",
                )}
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.nome}
                    {isMe && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email}
                    {u.curso ? ` · ${u.curso}` : ""}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-semibold",
                        role === "monitor"
                          ? "bg-primary-soft text-primary"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {role === "monitor" ? "Monitor" : "Aluno"}
                    </span>
                    {u.admin && (
                      <span className="rounded-full bg-info-soft px-2 py-0.5 font-semibold text-info">
                        Administrador
                      </span>
                    )}
                    {pending && (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 font-semibold text-warning">
                        Pedido pendente
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        u.ativo ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {u.ativo ? "Ativa" : "Desativada"}
                    </span>
                    {role === "monitor" && (
                      <span className="ml-1 text-muted-foreground">
                        {disciplinasDoMonitor(db, u.id)
                          .map((d) => d.nome)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!u.ativo || isMe}
                    onClick={() => setEditing(u.id)}
                  >
                    <UserGear aria-hidden="true" />
                    Alterar cargo
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Mais ações para ${u.nome}`}>
                        <DotsThree size={20} weight="bold" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={isMe}
                        onSelect={() =>
                          executar(
                            (state) => definirUsuarioAtivo(state, me.id, u.id, !u.ativo),
                            u.ativo
                              ? `Conta de ${u.nome} desativada.`
                              : `Conta de ${u.nome} reativada.`,
                          )
                        }
                      >
                        {u.ativo ? "Desativar conta" : "Reativar conta"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isMe && u.admin}
                        onSelect={() =>
                          executar(
                            (state) => definirAdmin(state, me.id, u.id, !u.admin),
                            u.admin
                              ? `${u.nome} não é mais administrador.`
                              : `${u.nome} agora é administrador.`,
                          )
                        }
                      >
                        {u.admin ? "Retirar acesso de administrador" : "Tornar administrador"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing !== null && <ChangeRoleDialog userId={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ChangeRoleDialog({ userId, onClose }: { userId: Id; onClose: () => void }) {
  const { db, usuario: me, executar } = useSessaoAtiva();
  const target: Usuario | undefined = usuarioPorId(db, userId);
  const currentRole = cargoDoUsuario(db, userId);
  const [role, setRole] = useState<CargoUsuario>(currentRole === "aluno" ? "monitor" : "aluno");
  const [subjectIds, setSubjectIds] = useState<Id[]>(() =>
    disciplinasDoMonitor(db, userId).map((d) => d.id),
  );
  if (!target) return null;
  const pending = solicitacaoPendenteDoUsuario(db, userId);

  const confirm = () => {
    const ok = executar(
      (state) => alterarCargoDireto(state, me.id, userId, role, subjectIds),
      `${target.nome} agora é ${role}.`,
    );
    if (ok) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar cargo de {target.nome}</DialogTitle>
          <DialogDescription>
            Cargo atual: <strong>{currentRole}</strong>. Como administrador, a sua confirmação
            valida a mudança imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {(["aluno", "monitor"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              aria-pressed={role === option}
              className={cn(
                "h-12 rounded-md border bg-background text-sm font-semibold capitalize transition-colors",
                role === option
                  ? "border-primary text-primary"
                  : "text-foreground hover:border-primary/40",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {role === "monitor" && (
          <RoleRequestFields
            disciplinas={db.disciplinas.filter((d) => d.ativa)}
            selecionadas={subjectIds}
            aoAlternar={(id) => setSubjectIds((l) => alternarId(l, id))}
          />
        )}
        {role === "aluno" && currentRole === "monitor" && (
          <p className="text-sm text-muted-foreground">
            Os chamados em aberto deste monitor serão repassados a outro monitor da disciplina (ou
            voltam à fila geral) e as aulas futuras serão canceladas.
          </p>
        )}
        {pending && (
          <p className="text-sm text-warning">
            Há uma solicitação pendente deste usuário; ela será encerrada por esta alteração.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirm}>Confirmar alteração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
