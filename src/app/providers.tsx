"use client";

import { CheckCircle as CheckCircle2, Warning } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { MonitoriaProvider, useMonitoria } from "@/store/monitoria-store";
import { cn } from "@/lib/utils";

function ToastNotice() {
  const { aviso } = useMonitoria();

  if (!aviso) return null;

  const Icon = aviso.tipo === "sucesso" ? CheckCircle2 : Warning;

  return (
    <div
      role="status"
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-sm items-center gap-2 rounded-md border bg-card px-4 py-3 text-sm font-medium shadow-elevated",
        aviso.tipo === "sucesso" ? "border-success/20" : "border-destructive/30",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          aviso.tipo === "sucesso" ? "text-success" : "text-destructive",
        )}
      />
      {aviso.mensagem}
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MonitoriaProvider>
      <ToastNotice />
      {children}
    </MonitoriaProvider>
  );
}
