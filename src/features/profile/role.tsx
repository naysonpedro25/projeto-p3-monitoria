import { useState } from "react";
import { PaperPlaneTilt, X } from "@phosphor-icons/react";
import { RoleRequestFields, alternarId } from "@/components/common/role-request-fields";
import { EmptyState, PageHeader } from "@/components/shared-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tempoRelativo } from "@/domain/format";
import type { Id, SolicitacaoCargo, StatusSolicitacao } from "@/domain/types";
import { cancelarSolicitacao, solicitarMudancaCargo } from "@/services/usuarios";
import {
  cargoDoUsuario,
  disciplinasDoMonitor,
  nomeDisciplina,
  nomeUsuario,
  solicitacaoPendenteDoUsuario,
  solicitacoesDoUsuario,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export const ROTULO_SOLICITACAO: Record<StatusSolicitacao, string> = {
  pendente: "Aguardando análise",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

/** Tela "Meu cargo": mostra o cargo atual e permite pedir a troca aluno ⇄ monitor (validada por um administrador). */
export function RoleView() {
  const { db, usuario, executar, executarSimples } = useSessaoAtiva();
  const role = cargoDoUsuario(db, usuario.id);
  const pending = solicitacaoPendenteDoUsuario(db, usuario.id);
  const history = solicitacoesDoUsuario(db, usuario.id).filter((s) => s.status !== "pendente");
  const activeSubjects = db.disciplinas.filter((d) => d.ativa);

  const [subjectIds, setSubjectIds] = useState<Id[]>([]);
  const [justification, setJustification] = useState("");

  const send = () => {
    const target = role === "aluno" ? "monitor" : "aluno";
    const ok = executar(
      (state) =>
        solicitarMudancaCargo(state, usuario.id, target, {
          disciplinaIds: subjectIds,
          justificativa: justification,
        }),
      "Solicitação enviada! Um administrador vai analisar o seu pedido.",
    );
    if (ok) {
      setSubjectIds([]);
      setJustification("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Perfil"
        title="Meu cargo"
        text="A troca entre aluno e monitor só vale depois de validada por um administrador."
      />

      <section className="border-y border-border py-5">
        <p className="text-sm text-muted-foreground">Cargo atual</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <strong className="font-display text-2xl font-bold capitalize">{role}</strong>
          {role === "monitor" && (
            <span className="text-sm font-medium text-primary">
              {disciplinasDoMonitor(db, usuario.id)
                .map((d) => d.nome)
                .join(" · ")}
            </span>
          )}
        </div>
      </section>

      {pending ? (
        <section className="mt-8 border-t-2 border-warning pt-4">
          <p className="font-semibold text-warning">Solicitação aguardando análise</p>
          <p className="mt-2 text-sm">
            {pending.cargoSolicitado === "monitor"
              ? `Você pediu para ser monitor de: ${pending.disciplinaIds.map((id) => nomeDisciplina(db, id)).join(", ")}.`
              : "Você pediu para voltar ao cargo de aluno."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enviada {tempoRelativo(pending.criadaEm)}. Até a decisão, seu cargo continua o mesmo.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() =>
              executarSimples(
                (state) => cancelarSolicitacao(state, usuario.id, pending.id),
                "Solicitação cancelada.",
              )
            }
          >
            <X aria-hidden="true" />
            Cancelar solicitação
          </Button>
        </section>
      ) : (
        <form
          className="mt-8 border-t-2 border-primary pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <h2 className="font-display text-lg font-bold">
            {role === "aluno" ? "Quero ser monitor" : "Quero deixar a monitoria"}
          </h2>
          <div className="mt-4">
            {role === "aluno" ? (
              <RoleRequestFields
                disciplinas={activeSubjects}
                selecionadas={subjectIds}
                aoAlternar={(id) => setSubjectIds((l) => alternarId(l, id))}
                justificativa={justification}
                aoMudarJustificativa={setJustification}
              />
            ) : (
              <>
                <label className="mb-2 block text-sm font-semibold" htmlFor="motivo">
                  Motivo (opcional)
                </label>
                <Textarea
                  id="motivo"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Ao ser aprovado, seus chamados em aberto serão repassados a outro monitor e suas
                  aulas futuras serão canceladas.
                </p>
              </>
            )}
          </div>
          <Button type="submit" className="mt-5">
            <PaperPlaneTilt aria-hidden="true" />
            Enviar solicitação
          </Button>
        </form>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold">Histórico de solicitações</h2>
        {history.length === 0 ? (
          <EmptyState
            title="Nenhuma solicitação anterior"
            text="Quando você pedir uma troca de cargo, o resultado aparece aqui."
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {history.map((s) => (
              <HistoryItem key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function HistoryItem({ s }: { s: SolicitacaoCargo }) {
  const { db } = useSessaoAtiva();
  return (
    <li className="py-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>Pedido para ser {s.cargoSolicitado}</strong>
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
        {s.decididaEm ? `Decidida ${tempoRelativo(s.decididaEm)}` : ""}
        {s.decididaPorId !== null ? ` por ${nomeUsuario(db, s.decididaPorId)}` : ""}
      </p>
      {s.observacao && <p className="mt-2">Observação: {s.observacao}</p>}
    </li>
  );
}
