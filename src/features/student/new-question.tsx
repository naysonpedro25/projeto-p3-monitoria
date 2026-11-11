import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CaretRight,
  Check,
  MagnifyingGlass,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLASSE_SELECT } from "@/components/common/select-field";
import { EmptyState, PageHeader } from "@/components/shared-ui";
import { nomeCurto } from "@/domain/format";
import type { Id } from "@/domain/types";
import type { StudentView } from "@/lib/views";
import { criarDuvida, resolverPeloAcervo, sugerirAcervo } from "@/services/monitoria";
import { nomeDisciplina, nomeTopico, topicosDaDisciplina } from "@/services/selectors";
import { useSessaoAtiva } from "@/store/monitoria-store";

export function NewQuestion({ setView }: { setView: (view: StudentView) => void }) {
  const { db, usuario, executar, notificar } = useSessaoAtiva();
  const subjects = db.disciplinas.filter((d) => d.ativa);
  const [subjectId, setSubjectId] = useState<Id>(subjects[0]?.id ?? 0);
  const topics = topicosDaDisciplina(db, subjectId);
  const [topicId, setTopicId] = useState<Id>(topics[0]?.id ?? 0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewId, setPreviewId] = useState<Id | null>(null);
  const [solved, setSolved] = useState(false);

  const typedEnough = title.length > 8 || description.length > 15;
  const suggestions = useMemo(
    () =>
      typedEnough
        ? sugerirAcervo(db, {
            disciplinaId: subjectId,
            topicoId: topicId,
            texto: `${title} ${description}`,
          })
        : [],
    [db, subjectId, topicId, title, description, typedEnough],
  );

  const changeSubject = (id: Id) => {
    setSubjectId(id);
    setTopicId(topicosDaDisciplina(db, id)[0]?.id ?? 0);
  };

  const submit = () => {
    if (!title.trim() || !description.trim()) {
      notificar("Preencha o título e a descrição da dúvida.", "erro");
      return;
    }
    const result = executar(
      (state) =>
        criarDuvida(state, {
          alunoId: usuario.id,
          disciplinaId: subjectId,
          topicoId: topicId,
          titulo: title,
          descricao: description,
          sugestoesExibidas: suggestions,
        }),
      (v) =>
        v.monitor
          ? `Dúvida enviada e atribuída ao monitor ${nomeCurto(v.monitor.nome)}.`
          : "Dúvida enviada para a fila geral da disciplina.",
    );
    if (result) setView("duvidas");
  };

  const markSolved = (acervoItemId: Id, similarity: number) => {
    const ok = executar((state) => resolverPeloAcervo(state, usuario.id, acervoItemId, similarity));
    if (ok) setSolved(true);
  };

  if (previewId !== null) {
    const item = db.acervo.find((entry) => entry.id === previewId);
    const similarity = suggestions.find((s) => s.acervoItemId === previewId)?.similaridade ?? 0;
    return (
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-success">Resposta do acervo</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">
          {solved ? "Dúvida resolvida pelo acervo" : "Talvez isso resolva sua dúvida"}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {solved
            ? "Nenhum chamado foi aberto para a monitoria."
            : "Nenhum chamado foi criado. Você ainda pode voltar ao formulário se precisar de ajuda."}
        </p>
        {item && (
          <article className="mt-7 border-y border-border py-5">
            <p className="text-sm font-medium text-primary">
              {nomeDisciplina(db, item.disciplinaId)} · {nomeTopico(db, item.topicoId)}
            </p>
            <h2 className="mt-2 font-semibold">{item.titulo}</h2>
            <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed">
              {item.conteudo}
            </p>
            {item.codigo && (
              <pre className="mt-3 overflow-x-auto rounded-md bg-code p-4 font-mono text-xs text-code-foreground">
                {item.codigo}
              </pre>
            )}
          </article>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {solved ? (
            <Button onClick={() => setView("inicio")}>Voltar ao início</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPreviewId(null)}>
                <ArrowLeft aria-hidden="true" />
                Voltar à dúvida
              </Button>
              <Button onClick={() => markSolved(previewId, similarity)}>
                <Check aria-hidden="true" />
                Isso resolveu minha dúvida
              </Button>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Novo atendimento"
        title="Envie sua dúvida"
        text="Explique o que está tentando fazer e onde encontrou dificuldade."
        action={
          <Button variant="ghost" onClick={() => setView("inicio")}>
            <ArrowLeft aria-hidden="true" />
            Voltar ao início
          </Button>
        }
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_0.72fr]">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Disciplina
              <select
                value={subjectId}
                onChange={(event) => changeSubject(Number(event.target.value))}
                className={CLASSE_SELECT}
              >
                {subjects.map((d) => (
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
                onChange={(event) => setTopicId(Number(event.target.value))}
                className={CLASSE_SELECT}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Título da dúvida
            <Input
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-11 font-normal"
              placeholder="Resuma sua dúvida em uma frase"
            />
          </label>
          <label className="block text-sm font-semibold">
            Descrição
            <Textarea
              required
              maxLength={1500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-36 font-normal"
              placeholder="Conte o que tentou e em qual etapa teve dificuldade..."
            />
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Campos obrigatórios</p>
            <Button type="submit">
              <PaperPlaneTilt aria-hidden="true" />
              Enviar para monitoria
            </Button>
          </div>
        </form>
        <aside className="border-t-2 border-primary pt-4 lg:mt-1">
          <h2 className="font-display text-lg font-bold">Respostas que podem ajudar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As sugestões consideram o texto que você escreveu.
          </p>
          {suggestions.length ? (
            <div className="mt-4 divide-y divide-border border-y border-border">
              {suggestions.map((s) => {
                const item = db.acervo.find((a) => a.id === s.acervoItemId);
                if (!item) return null;
                return (
                  <article key={item.id} className="py-4">
                    <p className="flex items-center justify-between gap-3 text-sm font-medium text-primary">
                      <span>
                        {nomeDisciplina(db, item.disciplinaId)} · {nomeTopico(db, item.topicoId)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-success">
                        {s.similaridade}% similar
                      </span>
                    </p>
                    <h3 className="mt-1 font-semibold">{item.titulo}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {item.conteudo}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="mt-2 h-auto justify-start px-0 py-2"
                      onClick={() => setPreviewId(item.id)}
                    >
                      Ler resposta
                      <CaretRight aria-hidden="true" />
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border-y border-border py-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MagnifyingGlass aria-hidden="true" />
                {typedEnough
                  ? "Ainda não encontramos uma resposta próxima"
                  : "As sugestões aparecem enquanto você escreve"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {typedEnough
                  ? "Você pode enviar a dúvida para um monitor."
                  : "Descreva o assunto e consulte respostas relacionadas antes de enviar."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
