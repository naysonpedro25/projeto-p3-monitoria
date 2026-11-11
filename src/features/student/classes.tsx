import {
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle as CheckCircle2,
  Envelope,
  Users,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatClassDate, formatClassTime } from "@/lib/class-format";
import { EmptyState, PageHeader } from "@/components/shared-ui";
import { nomeCurto } from "@/domain/format";
import { confirmarPresenca, removerPresenca } from "@/services/monitoria";
import {
  alunoConfirmou,
  alunoConvidado,
  aulasAbertas,
  confirmadosDaAula,
  nomeDisciplina,
  nomeUsuario,
  reservaAtiva,
  rotuloSala,
  salaPorId,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export function CollectiveClasses() {
  const { db, usuario, executar, executarSimples } = useSessaoAtiva();
  const classes = aulasAbertas(db, new Date());

  return (
    <>
      <PageHeader
        eyebrow="Aprendizado em grupo"
        title="Aulas coletivas"
        text="Confirme presença nos encontros organizados pelos monitores."
      />
      <div className="divide-y divide-border border-y border-border">
        {classes.map((item) => {
          const joined = alunoConfirmou(db, item.id, usuario.id);
          const invited = alunoConvidado(db, item.id, usuario.id);
          const count = confirmadosDaAula(db, item.id);
          const ready = count >= item.minimoConfirmados;
          const booking = reservaAtiva(db, item.id);
          const room = booking ? salaPorId(db, booking.salaId) : undefined;
          const roomConfirmed = booking?.status === "confirmada";
          const toggle = () => {
            if (joined) {
              executarSimples(
                (state) => removerPresenca(state, item.id, usuario.id),
                "Presença removida.",
              );
            } else {
              executar(
                (state) => confirmarPresenca(state, item.id, usuario.id),
                (v) =>
                  v.salaConfirmada
                    ? "Presença confirmada! A sala está reservada."
                    : "Presença confirmada.",
              );
            }
          };
          return (
            <article
              key={item.id}
              className="grid gap-5 py-5 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center"
            >
              <div>
                <p className="flex flex-wrap items-center gap-x-3 text-sm font-semibold text-primary">
                  {nomeDisciplina(db, item.disciplinaId)}
                  {invited && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-info">
                      <Envelope aria-hidden="true" />
                      Convidado
                    </span>
                  )}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">{item.tema}</h2>
                {item.descricao && (
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {item.descricao}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CalendarCheck aria-hidden="true" />
                    {formatClassDate(item.data)} · {formatClassTime(item.horaInicio)}–
                    {formatClassTime(item.horaFim)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen aria-hidden="true" />
                    {roomConfirmed ? rotuloSala(room) : "Sala reservada ao atingir o mínimo"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users aria-hidden="true" />
                    {count} confirmados · mínimo {item.minimoConfirmados} · Monitor{" "}
                    {nomeCurto(nomeUsuario(db, item.monitorId))}
                  </span>
                </div>
                <div
                  className="mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`Confirmações para ${item.tema}`}
                  aria-valuemin={0}
                  aria-valuemax={item.minimoConfirmados}
                  aria-valuenow={Math.min(count, item.minimoConfirmados)}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ease-out ${ready ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, (count / item.minimoConfirmados) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                {ready && (
                  <span className="flex items-center gap-2 text-sm font-semibold text-success">
                    <CheckCircle2 aria-hidden="true" />
                    {roomConfirmed ? "Sala reservada" : "Mínimo atingido"}
                  </span>
                )}
                <Button
                  type="button"
                  variant={joined ? "secondary" : "default"}
                  aria-pressed={joined}
                  className="w-full md:w-auto"
                  onClick={toggle}
                >
                  {joined ? (
                    <>
                      <Check aria-hidden="true" />
                      Presença confirmada
                    </>
                  ) : (
                    "Confirmar presença"
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      {classes.length === 0 && (
        <EmptyState
          title="Nenhuma aula agendada"
          text="Quando um monitor criar uma aula coletiva, ela aparecerá aqui."
        />
      )}
    </>
  );
}
