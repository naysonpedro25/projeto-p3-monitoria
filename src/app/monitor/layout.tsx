import type { ReactNode } from "react";
import { RoleLayout } from "@/components/role-layout";
import { SuggestedTopicProvider } from "@/features/monitor/suggested-topic";

export default function MonitorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout role="monitor">
      <SuggestedTopicProvider>{children}</SuggestedTopicProvider>
    </RoleLayout>
  );
}
