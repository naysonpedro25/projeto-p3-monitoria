import { cn } from "@/lib/utils";
import type { StatusAula, StatusDuvida } from "@/domain/types";

const ROTULO_STATUS: Record<StatusDuvida, string> = {
  pendente: "Pendente",
  em_atendimento: "Em atendimento",
  respondida: "Respondida",
};

const ROTULO_AULA: Record<StatusAula, string> = {
  aberta: "Aberta",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export function StatusMarker({ status }: { status: StatusDuvida }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === "respondida" && "bg-success",
          status === "em_atendimento" && "bg-info",
          status === "pendente" && "bg-warning",
        )}
      />
      <span>{ROTULO_STATUS[status]}</span>
    </span>
  );
}

/** Mesmo marcador do status das dúvidas, aplicado ao status da aula coletiva. */
export function AulaStatusMarker({ status }: { status: StatusAula }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === "confirmada" && "bg-success",
          status === "aberta" && "bg-warning",
          (status === "realizada" || status === "cancelada") && "bg-muted-foreground",
        )}
      />
      <span>{ROTULO_AULA[status]}</span>
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/60 px-5 py-8">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function Brand({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md text-xs font-bold tracking-wide",
          inverted ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        IC
      </span>
      <div className="leading-none">
        <p className="font-display text-lg font-bold leading-none">
          Monitora <span className={inverted ? "text-primary-foreground" : "text-primary"}>IC</span>
        </p>
        {!compact && (
          <p
            className={cn(
              "mt-1 text-xs",
              inverted ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            Monitoria acadêmica
          </p>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.03em]">{title}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 sm:block sm:px-5 sm:py-4 sm:first:pl-0 sm:last:pr-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{note}</p>
      </div>
      <p className="shrink-0 text-right font-display text-2xl font-bold tabular-nums tracking-[-0.03em] sm:mt-1 sm:text-left sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{note}</p>
    </div>
  );
}
