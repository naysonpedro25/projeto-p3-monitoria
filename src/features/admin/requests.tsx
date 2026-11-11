import { useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import { EmptyState, PageHeader } from "@/components/shared-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tempoRelativo } from "@/domain/format";
import type { SolicitacaoCargo } from "@/domain/types";
import { ROTULO_SOLICITACAO } from "@/features/profile/role";
import {
  cargoDoUsuario,
  nomeDisciplina,
  nomeUsuario,
  solicitacoesPendentes,
  usuarioPorId,
} from "@/services/selectors";
import { decidirSolicitacao } from "@/services/usuarios";
import { useSessaoAtiva } from "@/store/monitoria-store";

/** Fila de validação: o administrador aprova ou rejeita pedidos de troca de cargo. */
export function RequestsView() {
  const { db } = useSessaoAtiva();
  const pending = solicitacoesPendentes(db);
  const history = db.solicitacoesCargo
    .filter((s) => s.status !== "pendente")
    .sort((a, b) => (b.decididaEm ?? "").localeCompare(a.decididaEm ?? ""));

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Solicitações de cargo"
        text="Valide ou rejeite os pedidos de troca entre aluno e monitor."
      />

      {pending.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação pendente"
          text="Quando alguém pedir para mudar de cargo, o pedido aparece aqui."
        />
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {pending.map((s) => (
            <RequestCard key={s.id} s={s} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 font-display text-lg font-bold">Decididas recentemente</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há decisões registradas.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {history.map((s) => (
            <li key={s.id} className="py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>
                  {nomeUsuario(db, s.usuarioId)} → {s.cargoSolicitado}
                </strong>
                <span
                  className={
                    s.status === "aprovada"
                      ? "font-semibold text-success"
                      : "font-medium text-muted-foreground"
                  }
                >
                  {ROTULO_SOLICITACAO[s.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.decididaEm ? tempoRelativo(s.decididaEm) : ""}
                {s.decididaPorId !== null ? ` · por ${nomeUsuario(db, s.decididaPorId)}` : ""}
              </p>
              {s.observacao && <p className="mt-2">Observação: {s.observacao}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function RequestCard({ s }: { s: SolicitacaoCargo }) {
  const { db, usuario: me, executar } = useSessaoAtiva();
  const [note, setNote] = useState("");
  const requester = usuarioPorId(db, s.usuarioId);
  const own = s.usuarioId === me.id;
  const decide = (approve: boolean) =>
    executar(
      (state) => decidirSolicitacao(state, me.id, s.id, approve, note),
      approve ? "Solicitação aprovada. O cargo foi alterado." : "Solicitação rejeitada.",
    );

  return (
    <article className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{requester?.nome ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {requester?.email}
            {requester?.curso ? ` · ${requester.curso}` : ""}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{tempoRelativo(s.criadaEm)}</span>
      </div>
      <p className="mt-3 text-sm">
        <span className="capitalize">{cargoDoUsuario(db, s.usuarioId)}</span> →{" "}
        <strong className="capitalize">{s.cargoSolicitado}</strong>
      </p>
      {s.cargoSolicitado === "monitor" && (
        <p className="mt-2 text-sm font-medium text-primary">
          {s.disciplinaIds.map((id) => nomeDisciplina(db, id)).join(" · ")}
        </p>
      )}
      {s.justificativa && (
        <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed">
          {s.justificativa}
        </p>
      )}
      <Textarea
        className="mt-4"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Observação para o solicitante (opcional)"
      />
      {own && (
        <p className="mt-2 text-xs text-warning">
          Esta é a sua própria solicitação: outro administrador precisa validá-la.
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button disabled={own} onClick={() => decide(true)}>
          <Check aria-hidden="true" />
          Aprovar
        </Button>
        <Button variant="outline" disabled={own} onClick={() => decide(false)}>
          <X aria-hidden="true" />
          Rejeitar
        </Button>
      </div>
    </article>
  );
}
