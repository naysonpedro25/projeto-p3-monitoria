import { useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle,
  Envelope,
  Sparkle,
  Users,
  X,
} from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLASSE_SELECT } from "@/components/common/select-field";
import { formatClassDate, formatClassTime } from "@/lib/class-format";
import { AulaStatusMarker, EmptyState, PageHeader } from "@/components/shared-ui";
import { adicionarDias, dataIso } from "@/domain/format";
import type { Id } from "@/domain/types";
import { cancelarAula, criarAulaColetiva } from "@/services/monitoria";
import {
  aulasDoMonitor,
  confirmadosDaAula,
  disciplinasDoMonitor,
  nomeDisciplina,
  nomeTopico,
  reservaAtiva,
  rotuloSala,
  salaPorId,
  topicoPorId,
  topicosDaDisciplina,
  topicosFrequentes,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

interface Props {
  suggestedTopicId: Id | null;
  createClassFromTopic: (topicId: Id) => void;
}

export function MonitorClasses({ suggestedTopicId, createClassFromTopic }: Props) {
  const { db, usuario, executar, executarSimples } = useSessaoAtiva();
  const now = new Date();
  const mySubjects = disciplinasDoMonitor(db, usuario.id);
  const rooms = db.salas.filter((s) => s.ativa);

  const initialTopic = suggestedTopicId !== null ? topicoPorId(db, suggestedTopicId) : undefined;
  const initialSubject = initialTopic?.disciplinaId ?? mySubjects[0]?.id ?? 0;
  const [subjectId, setSubjectId] = useState<Id>(initialSubject);
  const [topicId, setTopicId] = useState<Id>(
    initialTopic?.id ?? topicosDaDisciplina(db, initialSubject)[0]?.id ?? 0,
  );
  const [theme, setTheme] = useState(
    initialTopic ? `${initialTopic.nome}: revisão e exercícios` : "",
  );
  const [date, setDate] = useState(dataIso(adicionarDias(now, 1)));
  const [start, setStart] = useState("14:00");
  const [end, setEnd] = useState("16:00");
  const [roomId, setRoomId] = useState<Id>(rooms[0]?.id ?? 0);
  const [description, setDescription] = useState("");
  const [min, setMin] = useState("5");

  const topics = topicosDaDisciplina(db, subjectId);
  const recurring = topicosFrequentes(
    db,
    mySubjects.map((d) => d.id),
    now,
  );
  const mine = aulasDoMonitor(db, usuario.id);

  const changeSubject = (id: Id) => {
    setSubjectId(id);
    setTopicId(topicosDaDisciplina(db, id)[0]?.id ?? 0);
  };
  const changeTopic = (id: Id) => {
    setTopicId(id);
    if (!theme.trim()) setTheme(`${nomeTopico(db, id)}: revisão e exercícios`);
  };

  const create = () => {
    const created = executar(
      (state) =>
        criarAulaColetiva(state, {
          monitorId: usuario.id,
          disciplinaId: subjectId,
          topicoId: topicId,
          tema: theme,
          descricao: description,
          data: date,
          horaInicio: start,
          horaFim: end,
          minimoConfirmados: Math.max(0, Number(min) || 0),
          salaId: roomId,
        }),
      (v) =>
        `Aula criada e ${rotuloSala(salaPorId(db, roomId))} reservada! ${v.convidados} convite${v.convidados === 1 ? "" : "s"} enviado${v.convidados === 1 ? "" : "s"}.`,
    );
    if (created) {
      setTheme("");
      setDescription("");
      setMin("5");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Ensino em grupo"
        title="Aulas coletivas"
        text="Organize um encontro aberto e convide alunos com dúvidas parecidas."
      />
      {recurring.map((item) => (
        <aside
          key={item.topico.id}
          className="mb-6 rounded-lg border border-warning/30 bg-warning-soft/60 p-5"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <Sparkle aria-hidden="true" />
            Tópico frequente detectado
          </p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl font-bold">{item.topico.nome}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.quantidade} dúvidas relacionadas nos últimos 7 dias · {item.disciplina.nome}
              </p>
            </div>
            <Button variant="outline" onClick={() => createClassFromTopic(item.topico.id)}>
              <Users aria-hidden="true" />
              Converter em aula coletiva
            </Button>
          </div>
        </aside>
      ))}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_0.85fr]">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
        >
          <div>
            <h2 className="font-display text-lg font-bold">Nova aula coletiva</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A reserva da sala é feita no sistema próprio do instituto.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Disciplina
              <select
                value={subjectId}
                onChange={(event) => changeSubject(Number(event.target.value))}
                className={CLASSE_SELECT}
              >
                {mySubjects.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Tópico
              <select
                value={topicId}
                onChange={(event) => changeTopic(Number(event.target.value))}
                className={CLASSE_SELECT}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Tema da aula
              <Input
                required
                maxLength={120}
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="mt-2 h-11 font-normal"
                placeholder="Ex.: Recursão e casos base"
              />
            </label>
            <label className="text-sm font-semibold">
              Data
              <Input
                required
                type="date"
                min={dataIso(now)}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 h-11 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Mínimo de alunos
              <Input
                required
                type="number"
                min={1}
                step={1}
                value={min}
                onChange={(event) => setMin(event.target.value)}
                className="mt-2 h-11 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Início
              <Input
                required
                type="time"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="mt-2 h-11 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Término
              <Input
                required
                type="time"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="mt-2 h-11 font-normal"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Sala
              <select
                value={roomId}
                onChange={(event) => setRoomId(Number(event.target.value))}
                className={CLASSE_SELECT}
              >
                {rooms.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {s.bloco} · {s.capacidade} lugares
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Descrição (opcional)
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-24 font-normal"
              placeholder="O que será abordado no encontro?"
            />
          </label>
          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit">
              <CalendarCheck aria-hidden="true" />
              Agendar aula e reservar sala
            </Button>
          </div>
        </form>
        <aside>
          <h2 className="mb-3 font-display text-lg font-bold">Aulas que você criou</h2>
          {mine.length ? (
            <div className="divide-y divide-border border-y border-border">
              {mine.map((item) => {
                const booking = reservaAtiva(db, item.id);
                const confirmed = confirmadosDaAula(db, item.id);
                const invites = db.convites.filter((c) => c.aulaId === item.id).length;
                const ready = confirmed >= item.minimoConfirmados;
                return (
                  <article key={item.id} className="py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-primary">
                        {nomeDisciplina(db, item.disciplinaId)}
                      </p>
                      <AulaStatusMarker status={item.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{item.tema}</h3>
                      {ready && (
                        <span className="flex items-center gap-2 text-xs font-semibold text-success">
                          <CheckCircle aria-hidden="true" />
                          Mínimo atingido
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <CalendarCheck aria-hidden="true" />
                        {formatClassDate(item.data)} · {formatClassTime(item.horaInicio)}–
                        {formatClassTime(item.horaFim)}
                      </p>
                      <p className="flex items-center gap-2">
                        <BookOpen aria-hidden="true" />
                        {booking
                          ? `${rotuloSala(salaPorId(db, booking.salaId))}${booking.status === "pendente" ? " (pendente)" : ""}`
                          : "—"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users aria-hidden="true" />
                        {confirmed} confirmados · mínimo {item.minimoConfirmados}
                      </p>
                      <p className="flex items-center gap-2">
                        <Envelope aria-hidden="true" />
                        {invites} convite{invites === 1 ? "" : "s"} enviado
                        {invites === 1 ? "" : "s"}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 mt-2 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                        >
                          <X aria-hidden="true" />
                          Cancelar aula
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar “{item.tema}”?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A reserva da sala será liberada e os {confirmed} aluno
                            {confirmed === 1 ? "" : "s"} confirmado{confirmed === 1 ? "" : "s"}{" "}
                            perderão a vaga. Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Manter aula</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={() =>
                              executarSimples(
                                (state) => cancelarAula(state, item.id, usuario.id),
                                "Aula cancelada e reserva liberada.",
                              )
                            }
                          >
                            Cancelar aula
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma aula criada"
              text="Use o formulário para publicar seu primeiro encontro."
            />
          )}
        </aside>
      </div>
    </>
  );
}
