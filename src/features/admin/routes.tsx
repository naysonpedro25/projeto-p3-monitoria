"use client";

import { RequestsView } from "./requests";
import { UsersView } from "./users";

export function AdminUsersRoute() {
  return <UsersView />;
}

export function AdminRequestsRoute() {
  return <RequestsView />;
}
