import { useState } from "react";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Id } from "@/domain/types";
import { EmptyState, PageHeader } from "@/components/shared-ui";
import {
  buscarAcervo,
  nomeDisciplina,
  nomeTopico,
  topicosDaDisciplina,
} from "@/services/selectors";
import { useMonitoria } from "@/store/monitoria-store";
import { CLASSE_SELECT_BASE as CLASSE_SELECT } from "@/components/common/select-field";

export function ArchiveView() {
  const { db } = useMonitoria();
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<Id | null>(null);
  const [topicId, setTopicId] = useState<Id | null>(null);
  const [open, setOpen] = useState<Id | null>(null);
  const results = buscarAcervo(db, { texto: query, disciplinaId: subjectId, topicoId: topicId });
  const topics = subjectId === null ? [] : topicosDaDisciplina(db, subjectId);

  return (
    <>
      <PageHeader
        eyebrow="Conhecimento compartilhado"
        title="Acervo de dúvidas"
        text="Encontre respostas revisadas por monitores. Pesquise pelo assunto, pela pergunta ou por uma palavra da explicação."
      />
      <div className="grid gap-3 border-y border-border py-4 md:grid-cols-[minmax(0,1fr)_14rem_14rem]">
        <label className="relative block">
          <span className="sr-only">Buscar no acervo</span>
          <MagnifyingGlass
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pergunta ou palavra-chave"
            className="h-11 pl-10"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por disciplina</span>
          <select
            value={subjectId ?? ""}
            onChange={(event) => {
              setSubjectId(event.target.value ? Number(event.target.value) : null);
              setTopicId(null);
            }}
            className={CLASSE_SELECT}
          >
            <option value="">Todas as disciplinas</option>
            {db.disciplinas
              .filter((d) => d.ativa)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por tópico</span>
          <select
            value={topicId ?? ""}
            disabled={subjectId === null}
            onChange={(event) => setTopicId(event.target.value ? Number(event.target.value) : null)}
            className={CLASSE_SELECT}
          >
            <option value="">Todos os tópicos</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="my-5 text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "resposta encontrada" : "respostas encontradas"}
      </p>
      {results.length ? (
        <div className="divide-y divide-border border-y border-border">
          {results.map((item) => {
            const isOpen = open === item.id;
            const answerId = `archive-answer-${item.id}`;
            return (
              <article key={item.id} className="py-1">
                <button
                  type="button"
                  className="group -mx-3 flex min-h-20 w-[calc(100%+1.5rem)] items-center justify-between gap-5 rounded-md px-3 py-4 text-left transition-colors hover:bg-muted/60"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span>
                    <span className="text-sm font-medium text-primary">
                      {nomeDisciplina(db, item.disciplinaId)}
                    </span>
                    <span className="mx-2 text-muted-foreground" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {nomeTopico(db, item.topicoId)}
                    </span>
                    {item.periodo && (
                      <>
                        <span className="mx-2 text-muted-foreground" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-sm text-muted-foreground">{item.periodo}</span>
                      </>
                    )}
                    <span className="mt-2 block font-semibold transition-colors group-hover:text-primary">
                      {item.titulo}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-sm leading-relaxed text-muted-foreground">
                      {item.conteudo}
                    </span>
                  </span>
                  <CaretRight
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-90 text-primary",
                    )}
                  />
                </button>
                <div
                  id={answerId}
                  hidden={!isOpen}
                  className={cn(
                    "border-t border-border py-5 pl-0 sm:pl-4",
                    isOpen && "answer-reveal",
                  )}
                >
                  <p className="text-sm font-semibold text-primary">Resposta do monitor</p>
                  <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed">
                    {item.conteudo}
                  </p>
                  {item.codigo && (
                    <pre className="mt-3 overflow-x-auto rounded-md bg-code p-4 font-mono text-xs text-code-foreground">
                      {item.codigo}
                    </pre>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma resposta com esses termos"
          text="Tente outra palavra ou selecione Todas as disciplinas."
        />
      )}
    </>
  );
}
