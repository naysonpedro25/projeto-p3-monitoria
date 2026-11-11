import { CaretRight, CheckCircle, Tray, TrendUp, Users } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Id } from "@/domain/types";
import type { MonitorView } from "@/lib/views";
import { EmptyState, PageHeader, StatCard } from "@/components/shared-ui";
import { nomeCurto, tempoRelativo } from "@/domain/format";
import {
  cargaMonitor,
  disciplinasDoMonitor,
  filaAtribuida,
  nivelCarga,
  nomeDisciplina,
  nomeUsuario,
  novasAtribuicoes,
  respondidasPorMonitor,
  topicosFrequentes,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export function MonitorDashboard({
  setView,
  createClassFromTopic,
}: {
  setView: (view: MonitorView) => void;
  createClassFromTopic: (topicId: Id) => void;
}) {
  const { db, usuario } = useSessaoAtiva();
  const now = new Date();
  const mine = filaAtribuida(db, usuario.id);
  const load = cargaMonitor(db, usuario.id);
  const fresh = novasAtribuicoes(db, usuario.id, 24, now);
  const frequent = topicosFrequentes(
    db,
    disciplinasDoMonitor(db, usuario.id).map((d) => d.id),
    now,
  )[0];

  return (
    <>
      <PageHeader
        eyebrow="Área do monitor"
        title={`Olá, ${nomeCurto(usuario.nome)}!`}
        text="Veja sua carga de atendimento e os itens que precisam de atenção."
        action={
          <Button onClick={() => setView("fila")}>
            <Tray aria-hidden="true" />
            Abrir fila
          </Button>
        }
      />
      <div className="mb-9 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatCard
          label="Atribuídas a você"
          value={String(mine.length)}
          note={fresh === 1 ? "1 nova nas últimas 24h" : `${fresh} novas nas últimas 24h`}
        />
        <StatCard
          label="Respondidas"
          value={String(respondidasPorMonitor(db, usuario.id))}
          note="Neste semestre"
        />
        <StatCard
          label="Carga atual"
          value={nivelCarga(load)}
          note={`${load} chamado${load === 1 ? "" : "s"} em aberto`}
        />
      </div>
      <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
        <section>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Próximos atendimentos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sua fila por ordem de chegada</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("fila")}>
              Ver fila <CaretRight aria-hidden="true" />
            </Button>
          </div>
          {mine.length ? (
            <ul className="divide-y divide-border">
              {mine.slice(0, 3).map((question) => (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => setView("fila")}
                    className="group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-md px-3 py-4 text-left transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"
                    >
                      {nomeUsuario(db, question.alunoId).charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold transition-colors group-hover:text-primary">
                        {question.titulo}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {nomeCurto(nomeUsuario(db, question.alunoId))} ·{" "}
                        {nomeDisciplina(db, question.disciplinaId)} ·{" "}
                        {tempoRelativo(question.criadaEm, now)}
                      </span>
                    </span>
                    <CaretRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pt-5">
              <EmptyState
                title="Sua fila está em dia"
                text="Novas dúvidas atribuídas a você aparecerão aqui."
              />
            </div>
          )}
        </section>
        {frequent ? (
          <aside className="self-start rounded-lg border border-border bg-card p-5 lg:mt-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
              <TrendUp aria-hidden="true" />
              Tema recorrente
            </p>
            <h2 className="mt-2 font-display text-xl font-bold">{frequent.topico.nome}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {frequent.quantidade} dúvidas de {frequent.alunosIds.length} aluno
              {frequent.alunosIds.length === 1 ? "" : "s"} sobre esse assunto nos últimos dias (
              {frequent.disciplina.nome}).
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => createClassFromTopic(frequent.topico.id)}
            >
              <Users aria-hidden="true" />
              Criar aula coletiva
            </Button>
            <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <CheckCircle aria-hidden="true" />
              Uma aula pode reunir dúvidas semelhantes
            </p>
          </aside>
        ) : (
          <aside className="self-start rounded-lg border border-border bg-card p-5 lg:mt-1">
            <p className="text-sm font-medium text-muted-foreground">Tema recorrente</p>
            <h2 className="mt-2 font-display text-xl font-bold">Sem tópicos recorrentes</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Quando muitos alunos perguntarem sobre o mesmo tema, sugerimos uma aula coletiva.
            </p>
          </aside>
        )}
      </div>
    </>
  );
}
