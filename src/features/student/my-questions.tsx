import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusMarker } from "@/components/shared-ui";
import { nomeCurto, tempoRelativo } from "@/domain/format";
import type { Id } from "@/domain/types";
import { cn } from "@/lib/utils";
import {
  duvidasDoAluno,
  nomeDisciplina,
  nomeTopico,
  nomeUsuario,
  respostaDaDuvida,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export function MyQuestions({ onCreate }: { onCreate: () => void }) {
  const { db, usuario } = useSessaoAtiva();
  const [open, setOpen] = useState<Id | null>(null);
  const questions = duvidasDoAluno(db, usuario.id);
  const now = new Date();

  return (
    <>
      <PageHeader
        eyebrow="Acompanhamento"
        title="Minhas dúvidas"
        text="Veja o andamento de todos os seus pedidos de ajuda."
      />
      {questions.length ? (
        <div className="divide-y divide-border border-y border-border">
          {questions.map((q) => {
            const answer = respostaDaDuvida(db, q.id);
            const isOpen = open === q.id;
            const answerId = `question-answer-${q.id}`;
            return (
              <article key={q.id} className="py-5">
                <button
                  type="button"
                  disabled={!answer}
                  aria-expanded={answer ? isOpen : undefined}
                  aria-controls={answer ? answerId : undefined}
                  onClick={() => setOpen(isOpen ? null : q.id)}
                  className="group -mx-3 -my-2 flex w-[calc(100%+1.5rem)] flex-col justify-between gap-4 rounded-md px-3 py-2 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-muted/60 sm:flex-row sm:items-start"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {nomeDisciplina(db, q.disciplinaId)} · {nomeTopico(db, q.topicoId)}
                    </p>
                    <h2 className="mt-2 font-semibold transition-colors group-enabled:group-hover:text-primary">
                      {q.titulo}
                    </h2>
                    {!answer && (
                      <p className="mt-1 line-clamp-2 max-w-prose text-sm text-muted-foreground">
                        {q.descricao}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Atualizada {tempoRelativo(q.atualizadaEm, now)}
                      {q.monitorId !== null &&
                        ` · Responsável: Monitor ${nomeCurto(nomeUsuario(db, q.monitorId))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusMarker status={q.status} />
                    {answer && (
                      <CaretRight
                        aria-hidden="true"
                        className={cn(
                          "size-5 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-90 text-primary",
                        )}
                      />
                    )}
                  </div>
                </button>
                {answer && (
                  <div
                    id={answerId}
                    hidden={!isOpen}
                    className={cn("mt-4 border-t border-border pt-4", isOpen && "answer-reveal")}
                  >
                    <p className="text-sm font-semibold text-primary">
                      Resposta do monitor · {nomeUsuario(db, answer.monitorId)}
                    </p>
                    <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed">
                      {answer.texto}
                    </p>
                    {answer.codigo && (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-code p-4 font-mono text-xs text-code-foreground">
                        {answer.codigo}
                      </pre>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div>
          <EmptyState
            title="Você ainda não enviou dúvidas"
            text="Quando enviar uma pergunta, ela aparecerá aqui."
          />
          <Button className="mt-4" onClick={onCreate}>
            Enviar uma dúvida
          </Button>
        </div>
      )}
    </>
  );
}
