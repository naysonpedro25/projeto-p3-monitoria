import type { ReactNode } from "react";

/** Estilo único dos <select> nativos: mesma borda, foco e seta dos campos de texto. */
export const CLASSE_SELECT_BASE =
  "select-chevron h-11 w-full cursor-pointer rounded-md border border-input bg-card pl-3 pr-10 text-sm font-normal shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

/** Variante com espaço para o rótulo acima (uso dentro de <label>). */
export const CLASSE_SELECT = `mt-2 ${CLASSE_SELECT_BASE}`;

export function Selecao({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="text-sm font-semibold">
      {rotulo}
      {children}
    </label>
  );
}
