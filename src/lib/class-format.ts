export function formatClassDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatClassTime(value: string) {
  return value.replace(/^(\d{2}):(\d{2})$/, "$1h$2").replace(/h00$/, "h");
}
