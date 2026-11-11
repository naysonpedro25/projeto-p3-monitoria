import { CaretRight, Question, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { StudentView } from "@/lib/views";
import { EmptyState, PageHeader, StatCard, StatusMarker } from "@/components/shared-ui";
import { formatClassDate, formatClassTime } from "@/lib/class-format";
import { nomeCurto } from "@/domain/format";
import {
  duvidasDoAluno,
  nomeDisciplina,
  nomeUsuario,
  proximaMonitoria,
  rotuloSala,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export function StudentDashboard({ setView }: { setView: (view: StudentView) => void }) {
  const { db, usuario } = useSessaoAtiva();
  const mine = duvidasDoAluno(db, usuario.id);
  const open = mine.filter((question) => question.status !== "respondida").length;
  const next = proximaMonitoria(db, usuario.id, new Date());

  return (
    <>
      <PageHeader
        eyebrow="Área do aluno"
        title={`Olá, ${nomeCurto(usuario.nome)}!`}
        text="Acompanhe suas dúvidas e encontre respostas rapidamente."
        action={
          <Button onClick={() => setView("nova")}>
            <Question aria-hidden="true" />
            Nova dúvida
          </Button>
        }
      />
      <div className="mb-9 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatCard
          label="Dúvidas em aberto"
          value={String(open)}
          note="Acompanhamento em tempo real"
        />
        <StatCard label="Respondidas" value={String(mine.length - open)} note="No semestre atual" />
        <StatCard
          label="Próxima monitoria"
          value={
            next
              ? `${formatClassDate(next.aula.data)} · ${formatClassTime(next.aula.horaInicio)}`
              : "Nenhuma"
          }
          note={
            next
              ? next.sala
                ? rotuloSala(next.sala)
                : "Sala será confirmada"
              : "Confirme presença em uma aula coletiva"
          }
        />
      </div>
      <section className="grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Suas dúvidas recentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Últimas movimentações</p>
            </div>
            {mine.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setView("duvidas")}>
                Ver todas <CaretRight aria-hidden="true" />
              </Button>
            )}
          </div>
          {mine.length > 0 ? (
            <ul className="divide-y divide-border">
              {mine.slice(0, 4).map((question) => (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => setView("duvidas")}
                    className="group -mx-3 flex w-[calc(100%+1.5rem)] flex-col gap-3 rounded-md px-3 py-4 text-left transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold transition-colors group-hover:text-primary">
                        {question.titulo}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {nomeDisciplina(db, question.disciplinaId)} ·{" "}
                        {question.monitorId !== null
                          ? `Monitor ${nomeCurto(nomeUsuario(db, question.monitorId))}`
                          : "Aguardando monitor"}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-3">
                      <StatusMarker status={question.status} />
                      <CaretRight
                        aria-hidden="true"
                        className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block"
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pt-5">
              <EmptyState
                title="Ainda não há dúvidas enviadas"
                text="Descreva o ponto em que travou para receber ajuda da monitoria."
              />
              <Button className="mt-4" onClick={() => setView("nova")}>
                <Question aria-hidden="true" />
                Enviar primeira dúvida
              </Button>
            </div>
          )}
        </div>
        <aside className="self-start rounded-lg border border-border bg-card p-5 lg:mt-1">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary"
          >
            <MagnifyingGlass className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold">Já pesquisou no acervo?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Respostas de semestres anteriores podem resolver a dúvida sem esperar um atendimento.
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => setView("acervo")}>
            <MagnifyingGlass aria-hidden="true" />
            Buscar no acervo
          </Button>
        </aside>
      </section>
    </>
  );
}
