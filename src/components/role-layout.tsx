"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChatText,
  ArrowsLeftRight,
  ClipboardText,
  MagnifyingGlass,
  Question,
  SquaresFour,
  SignOut,
  Tray,
  UserGear,
  Users,
  UsersThree,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared-ui";
import type { PerfilAcesso } from "@/domain/types";
import { adminPaths, monitorPaths, studentPaths } from "@/lib/views";
import { cn } from "@/lib/utils";
import { disciplinasDoMonitor, perfisDoUsuario, solicitacoesPendentes } from "@/services/selectors";
import { useMonitoria } from "@/store/monitoria-store";

type NavItem = {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular. */
  short?: string;
  icon: typeof SquaresFour;
};

const navigation: Record<PerfilAcesso, NavItem[]> = {
  aluno: [
    { href: "/aluno", label: "Início", icon: SquaresFour },
    { href: "/aluno/acervo", label: "Acervo", icon: MagnifyingGlass },
    { href: "/aluno/nova-duvida", label: "Nova dúvida", short: "Nova", icon: Question },
    { href: "/aluno/duvidas", label: "Minhas dúvidas", short: "Dúvidas", icon: ChatText },
    { href: "/aluno/aulas", label: "Aulas", icon: Users },
    { href: "/aluno/cargo", label: "Meu cargo", short: "Cargo", icon: UserGear },
  ],
  monitor: [
    { href: "/monitor", label: "Início", icon: SquaresFour },
    { href: "/monitor/fila", label: "Fila", icon: Tray },
    { href: "/monitor/aulas", label: "Aulas", icon: Users },
    { href: "/monitor/cargo", label: "Meu cargo", short: "Cargo", icon: UserGear },
  ],
  admin: [
    { href: "/admin", label: "Usuários", icon: UsersThree },
    { href: "/admin/solicitacoes", label: "Solicitações", icon: ClipboardText },
  ],
};

const homeByProfile: Record<PerfilAcesso, string> = {
  aluno: studentPaths.inicio,
  monitor: monitorPaths.inicio,
  admin: adminPaths.usuarios,
};

export function RoleLayout({ role, children }: { role: PerfilAcesso; children: ReactNode }) {
  const { db, sessao, usuario, sair, trocarPerfil } = useMonitoria();
  const router = useRouter();
  const pathname = usePathname();
  const authorized = sessao?.perfil === role && usuario !== null;

  useEffect(() => {
    if (!authorized) router.replace("/login");
  }, [authorized, router]);

  const logout = () => {
    sair();
    router.replace("/login");
  };

  // Só quem tem os dois perfis (aluno e monitor) pode alternar sem sair da conta.
  const otherRole: "aluno" | "monitor" | null =
    usuario && role !== "admin"
      ? (() => {
          const next = role === "aluno" ? "monitor" : "aluno";
          return perfisDoUsuario(db, usuario.id).includes(next) ? next : null;
        })()
      : null;

  const changeRole = () => {
    if (!otherRole) return;
    if (trocarPerfil(otherRole)) router.replace(homeByProfile[otherRole]);
  };

  if (!authorized || !usuario) return null;

  const pendingRequests = role === "admin" ? solicitacoesPendentes(db).length : 0;
  const navItems = navigation[role];
  const name = usuario.nome;
  const description =
    role === "admin"
      ? "Administrador"
      : role === "aluno"
        ? `Aluno · ${usuario.curso ?? "IC"}`
        : `Monitor · ${disciplinasDoMonitor(db, usuario.id)
            .map((d) => d.nome)
            .join(", ")}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:text-foreground focus:shadow-elevated"
      >
        Ir para o conteúdo
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-md lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-1">
          {otherRole && (
            <Button
              variant="ghost"
              size="sm"
              onClick={changeRole}
              className="h-10 gap-2"
              aria-label={`Mudar para ${otherRole}`}
            >
              <ArrowsLeftRight aria-hidden="true" />
              {otherRole === "monitor" ? "Monitor" : "Aluno"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="h-10 gap-2">
            <SignOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
          <div className="px-2">
            <Brand />
          </div>
          <div className="mb-6 mt-8 flex items-center gap-3 rounded-lg bg-muted/70 p-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"
            >
              {name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground" title={description}>
                {description}
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-1" aria-label="Menu principal">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-start px-3 font-medium text-muted-foreground",
                    active &&
                      "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary",
                  )}
                >
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    <Icon size={19} weight={active ? "fill" : "regular"} aria-hidden="true" />
                    {item.label}
                    {item.href === "/admin/solicitacoes" && pendingRequests > 0 && (
                      <span
                        className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold tabular-nums text-primary-foreground"
                        aria-label={`${pendingRequests} pendentes`}
                      >
                        {pendingRequests}
                      </span>
                    )}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-border pt-4">
            {otherRole && (
              <Button
                variant="ghost"
                onClick={changeRole}
                className="h-10 w-full justify-start px-3 font-medium text-muted-foreground"
              >
                <ArrowsLeftRight size={19} weight="regular" aria-hidden="true" />
                Mudar para {otherRole}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={logout}
              className="h-10 w-full justify-start px-3 font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
            >
              <SignOut size={19} weight="regular" aria-hidden="true" />
              Sair da conta
            </Button>
          </div>
        </aside>
        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 pb-28 pt-7 lg:ml-64 lg:px-10 lg:py-9 lg:pb-9"
        >
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        aria-label="Navegação principal"
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.short ? item.label : undefined}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active && "font-semibold text-primary hover:text-primary",
              )}
            >
              <span
                className={cn(
                  "relative grid h-7 w-12 place-items-center rounded-full transition-colors",
                  active && "bg-primary-soft",
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden="true" />
                {item.href === "/admin/solicitacoes" && pendingRequests > 0 && (
                  <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold tabular-nums text-primary-foreground">
                    {pendingRequests}
                  </span>
                )}
              </span>
              <span className="block w-full truncate text-center">{item.short ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
