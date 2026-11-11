import { useRef, useState } from "react";
import { ArrowsLeftRight, Code, PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CLASSE_SELECT } from "@/components/common/select-field";
import { EmptyState, PageHeader, StatusMarker } from "@/components/shared-ui";

import { nomeCurto, tempoRelativo } from "@/domain/format";
import type { Duvida, Id } from "@/domain/types";
import { iniciarAtendimento, reatribuirDuvida, responderDuvida } from "@/services/monitoria";
import {
  filaAtribuida,
  filaGeral,
  monitoresDaDisciplina,
  nomeDisciplina,
  nomeTopico,
  nomeUsuario,
} from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

type Tab = "mine" | "all";

export function QueueView() {
  const { db, usuario, executarSimples } = useSessaoAtiva();
  const [tab, setTab] = useState<Tab>("mine");
  const [selected, setSelected] = useState<Id | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  const mine = filaAtribuida(db, usuario.id);
  const all = filaGeral(db, usuario.id);
  const list = tab === "mine" ? mine : all;
  const current = db.duvidas.find((q) => q.id === selected && q.status !== "respondida") ?? null;

  const open = (question: Duvida) => {
    setSelected(question.id);
    executarSimples((state) => iniciarAtendimento(state, question.id, usuario.id));
    // No celular o detalhe fica abaixo da lista: leva o usuário até ele.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };

  const tabClass = (active: boolean) =>
    cn(
      "-mb-px h-11 rounded-none border-b-2 border-transparent px-0 text-muted-foreground hover:bg-transparent hover:text-foreground",
      active && "border-primary text-primary hover:text-primary",
    );
  const countClass = (active: boolean) =>
    cn(
      "rounded-full px-2 py-0.5 text-xs tabular-nums",
      active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
    );

  return (
    <>
      <PageHeader
        eyebrow="Atendimentos"
        title="Fila de dúvidas"
        text="Priorize, responda ou reatribua os chamados da disciplina."
      />
      <div
        className="mb-5 flex gap-6 border-b border-border"
        role="group"
        aria-label="Filtrar fila"
      >
        <Button
          aria-pressed={tab === "mine"}
          className={tabClass(tab === "mine")}
          variant="ghost"
          onClick={() => setTab("mine")}
        >
          Atribuídas a mim <span className={countClass(tab === "mine")}>{mine.length}</span>
        </Button>
        <Button
          aria-pressed={tab === "all"}
          className={tabClass(tab === "all")}
          variant="ghost"
          onClick={() => setTab("all")}
        >
          Fila geral <span className={countClass(tab === "all")}>{all.length}</span>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-8">
        <div className={cn("space-y-1", list.length > 0 && "self-start")}>
          {list.map((q) => (
            <button
              type="button"
              key={q.id}
              aria-pressed={selected === q.id}
              onClick={() => open(q)}
              className={cn(
                "w-full rounded-md border border-transparent px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                selected === q.id &&
                  "border-primary/25 bg-primary-soft shadow-[inset_3px_0_0_var(--color-primary)] hover:bg-primary-soft",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-primary">
                  {nomeDisciplina(db, q.disciplinaId)} · {nomeTopico(db, q.topicoId)}
                </span>
                <StatusMarker status={q.status} />
              </div>
              <p className="mt-1.5 font-semibold leading-snug">{q.titulo}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {nomeCurto(nomeUsuario(db, q.alunoId))} · {tempoRelativo(q.criadaEm, now)}
                {tab === "all" &&
                  ` · ${q.monitorId === null ? "Sem monitor" : `Monitor ${nomeCurto(nomeUsuario(db, q.monitorId))}`}`}
              </p>
            </button>
          ))}
          {list.length === 0 && (
            <EmptyState
              title="Fila em dia"
              text={
                tab === "mine"
                  ? "Você não tem dúvidas aguardando atendimento."
                  : "Não há chamados aguardando atendimento."
              }
            />
          )}
        </div>
        <div ref={detailRef} className="scroll-mt-20">
          {current ? (
            <TicketDetail key={current.id} question={current} onDone={() => setSelected(null)} />
          ) : (
            <EmptyState
              title="Escolha uma dúvida"
              text="Selecione um chamado na fila para ler a descrição e escrever uma resposta."
            />
          )}
        </div>
      </div>
    </>
  );
}

function TicketDetail({ question, onDone }: { question: Duvida; onDone: () => void }) {
  const { db, usuario, executar, notificar } = useSessaoAtiva();
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [publish, setPublish] = useState(true);
  const [target, setTarget] = useState<Id | null>(null);

  const colleagues = monitoresDaDisciplina(db, question.disciplinaId).filter(
    (m) => m.id !== usuario.id && m.id !== question.alunoId,
  );
  const withAnother = question.monitorId !== null && question.monitorId !== usuario.id;

  const respond = () => {
    if (!answer.trim()) {
      notificar("Digite uma resposta antes de concluir.", "erro");
      return;
    }
    const ok = executar(
      (state) =>
        responderDuvida(state, {
          duvidaId: question.id,
          monitorId: usuario.id,
          texto: answer,
          codigo: code,
          publicarNoAcervo: publish,
        }),
      publish ? "Resposta enviada e publicada no acervo." : "Resposta enviada ao aluno.",
    );
    if (ok) onDone();
  };

  const reassign = () => {
    const next = executar(
      (state) => reatribuirDuvida(state, question.id, usuario.id, target),
      (monitor) => `Chamado reatribuído para ${nomeCurto(monitor.nome)}.`,
    );
    if (next) onDone();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-8">
      <div className="border-b border-border pb-5">
        <p className="text-sm font-medium text-primary">
          {nomeDisciplina(db, question.disciplinaId)} · {nomeTopico(db, question.topicoId)}
        </p>
        <h2 className="mt-2 font-display text-xl font-bold">{question.titulo}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviada por {nomeUsuario(db, question.alunoId)} · {tempoRelativo(question.criadaEm)}
        </p>
      </div>
      <div className="py-5">
        <p className="mb-5 max-w-prose whitespace-pre-line text-sm leading-relaxed">
          {question.descricao}
        </p>
        {withAnother && (
          <p className="mb-5 rounded-md bg-warning-soft px-3 py-2.5 text-xs font-medium text-warning">
            Este chamado está com {nomeUsuario(db, question.monitorId)}. Ao responder, ele passa a
            ser seu.
          </p>
        )}
        <label className="text-sm font-semibold">
          Sua resposta
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-2 min-h-32 font-normal"
            placeholder="Explique o raciocínio passo a passo..."
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Code aria-hidden="true" />
            Bloco de código (opcional)
          </span>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 min-h-24 bg-code font-mono text-code-foreground"
            placeholder="// Insira um exemplo"
          />
        </label>
        <label className="mt-5 flex cursor-pointer items-start gap-3 border-y border-border py-3">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <strong className="block text-sm">Publicar no acervo geral</strong>
            <small className="text-muted-foreground">Outros alunos poderão consultar.</small>
          </span>
        </label>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-xs font-semibold">
              Reatribuir para
              <select
                value={target ?? ""}
                onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : null)}
                className={cn(CLASSE_SELECT, "mt-1 h-10 min-w-52")}
              >
                <option value="">Menor carga (automático)</option>
                {colleagues.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" onClick={reassign} disabled={colleagues.length === 0}>
              <ArrowsLeftRight aria-hidden="true" />
              Reatribuir
            </Button>
          </div>
          <Button onClick={respond}>
            <PaperPlaneTilt aria-hidden="true" />
            Enviar resposta
          </Button>
        </div>
        {colleagues.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Não há outro monitor ativo nesta disciplina para receber o chamado.
          </p>
        )}
      </div>
    </div>
  );
}
