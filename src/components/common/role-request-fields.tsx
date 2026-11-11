import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Disciplina, Id } from "@/domain/types";

interface Props {
  disciplinas: Disciplina[];
  selecionadas: Id[];
  aoAlternar: (id: Id) => void;
  /** Quando omitido, o campo de justificativa não é exibido (uso no painel do administrador). */
  justificativa?: string;
  aoMudarJustificativa?: (texto: string) => void;
}

/** Campos para pedir/atribuir a monitoria: disciplinas desejadas e justificativa. */
export function RoleRequestFields({
  disciplinas,
  selecionadas,
  aoAlternar,
  justificativa,
  aoMudarJustificativa,
}: Props) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Disciplinas da monitoria</legend>
        <div className="divide-y divide-border border-y border-border">
          {disciplinas.map((d) => (
            <label
              key={d.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 px-2 text-sm"
            >
              <Checkbox
                checked={selecionadas.includes(d.id)}
                onCheckedChange={() => aoAlternar(d.id)}
              />
              <span>
                <strong className="font-semibold">{d.nome}</strong>
                {d.codigo && <small className="ml-2 text-muted-foreground">{d.codigo}</small>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {aoMudarJustificativa && (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="justificativa">
            Por que você quer ser monitor?
          </label>
          <Textarea
            id="justificativa"
            value={justificativa ?? ""}
            onChange={(e) => aoMudarJustificativa(e.target.value)}
            placeholder="Conte sua experiência na disciplina (mínimo de 10 caracteres)."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

/** Alterna um id em uma lista (marcar/desmarcar disciplina). */
export const alternarId = (lista: Id[], id: Id): Id[] =>
  lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
