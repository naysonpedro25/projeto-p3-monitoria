"use client";

import { useRouter } from "next/navigation";
import { MonitorDashboard } from "./dashboard";
import { QueueView } from "./queue";
import { MonitorClasses } from "./classes";
import { useSuggestedTopic } from "./suggested-topic";
import { RoleView } from "@/features/profile/role";
import { monitorPaths, type MonitorView } from "@/lib/views";

export function MonitorDashboardRoute() {
  const router = useRouter();
  const { sugerirTopico } = useSuggestedTopic();

  return (
    <MonitorDashboard
      setView={(view: MonitorView) => router.push(monitorPaths[view])}
      createClassFromTopic={(topicId) => {
        sugerirTopico(topicId);
        router.push(monitorPaths.aulas);
      }}
    />
  );
}

export function MonitorQueueRoute() {
  return <QueueView />;
}

export function MonitorClassesRoute() {
  const { topicoSugerido, sugerirTopico } = useSuggestedTopic();
  return (
    <MonitorClasses
      key={topicoSugerido ?? "livre"}
      suggestedTopicId={topicoSugerido}
      createClassFromTopic={sugerirTopico}
    />
  );
}

export function MonitorRoleRoute() {
  return <RoleView />;
}
