"use client";

import { useRouter } from "next/navigation";
import { StudentDashboard } from "./dashboard";
import { ArchiveView } from "./archive";
import { NewQuestion } from "./new-question";
import { MyQuestions } from "./my-questions";
import { CollectiveClasses } from "./classes";
import { RoleView } from "@/features/profile/role";
import { studentPaths, type StudentView } from "@/lib/views";

function useStudentNavigation() {
  const router = useRouter();
  return (view: StudentView) => router.push(studentPaths[view]);
}

export function StudentDashboardRoute() {
  return <StudentDashboard setView={useStudentNavigation()} />;
}

export function StudentArchiveRoute() {
  return <ArchiveView />;
}

export function NewQuestionRoute() {
  return <NewQuestion setView={useStudentNavigation()} />;
}

export function MyQuestionsRoute() {
  const setView = useStudentNavigation();
  return <MyQuestions onCreate={() => setView("nova")} />;
}

export function StudentClassesRoute() {
  return <CollectiveClasses />;
}

export function StudentRoleRoute() {
  return <RoleView />;
}
