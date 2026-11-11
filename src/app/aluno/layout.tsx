import type { ReactNode } from "react";
import { RoleLayout } from "@/components/role-layout";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RoleLayout role="aluno">{children}</RoleLayout>;
}
