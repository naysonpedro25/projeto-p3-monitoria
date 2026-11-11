const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function nomeCurto(nome: string): string {
  return nome.split(" ")[0] ?? nome;
}

/** Data local no formato AAAA-MM-DD. */
export function dataIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function adicionarDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

/** "30 set • 14h" ou "30 set • 14h30". */
export function formatarDataAula(data: string, hora: string): string {
  const [, mes, dia] = data.split("-");
  const nomeMes = MESES[Number(mes) - 1] ?? "";
  return `${Number(dia)} ${nomeMes} • ${formatarHora(hora)}`;
}

/** "16:00" -> "16h"; "16:30" -> "16h30". */
export function formatarHora(hora: string): string {
  const [h, m] = hora.split(":");
  return m && m !== "00" ? `${Number(h)}h${m}` : `${Number(h)}h`;
}

export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const minutos = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

/** Minúsculas e sem acentos, para buscas e similaridade. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Intervalos "HH:MM" se sobrepõem? (fim exclusivo) */
export function sobrepoe(iniA: string, fimA: string, iniB: string, fimB: string): boolean {
  return iniA < fimB && iniB < fimA;
}

/** Aceita @ufal.br e subdomínios institucionais (ex.: @ic.ufal.br); rejeita "@naoufal.br" e "@ufal.br.evil.com". */
const EMAIL_UFAL = /^[a-z0-9._%+-]+@([a-z0-9-]+\.)*ufal\.br$/;

export function emailInstitucional(email: string): boolean {
  return EMAIL_UFAL.test(email.trim().toLowerCase());
}
