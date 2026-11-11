"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Id } from "@/domain/types";

interface TopicoSugeridoContexto {
  /** Tópico recorrente escolhido no alerta, usado para pré-preencher a nova aula. */
  topicoSugerido: Id | null;
  sugerirTopico: (topicoId: Id | null) => void;
}

const Contexto = createContext<TopicoSugeridoContexto | null>(null);

export function SuggestedTopicProvider({ children }: { children: ReactNode }) {
  const [topicoSugerido, setTopicoSugerido] = useState<Id | null>(null);
  const valor = useMemo(
    () => ({ topicoSugerido, sugerirTopico: setTopicoSugerido }),
    [topicoSugerido],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSuggestedTopic(): TopicoSugeridoContexto {
  const contexto = useContext(Contexto);
  if (!contexto)
    throw new Error("useSuggestedTopic deve ser usado dentro de <SuggestedTopicProvider>.");
  return contexto;
}
