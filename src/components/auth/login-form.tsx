"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  BookOpen,
  CaretRight,
  CheckCircle,
  GraduationCap,
  ShieldCheck,
} from "@phosphor-icons/react";
import { CLASSE_SELECT_BASE } from "@/components/common/select-field";
import { Brand } from "@/components/shared-ui";
import { RoleRequestFields, alternarId } from "@/components/common/role-request-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CONTAS_DEMO, CURSOS } from "@/data/seed";
import type { Id, PerfilAcesso } from "@/domain/types";
import { adminPaths, monitorPaths, studentPaths } from "@/lib/views";
import { cn } from "@/lib/utils";
import { ServiceError } from "@/services/monitoria";
import { conferirCodigo, iniciarVerificacao, type VerificacaoEmail } from "@/services/usuarios";
import { useMonitoria } from "@/store/monitoria-store";

const PERFIS: {
  id: PerfilAcesso;
  titulo: string;
  subtitulo: string;
  icone: typeof GraduationCap;
}[] = [
  { id: "aluno", titulo: "Aluno", subtitulo: "Tirar dúvidas", icone: GraduationCap },
  { id: "monitor", titulo: "Monitor", subtitulo: "Atender alunos", icone: BookOpen },
  { id: "admin", titulo: "Administrador", subtitulo: "Gerir usuários", icone: ShieldCheck },
];

const CAMINHO_INICIAL: Record<PerfilAcesso, string> = {
  aluno: studentPaths.inicio,
  monitor: monitorPaths.inicio,
  admin: adminPaths.usuarios,
};

const CLASSE_SELECT_LOGIN = cn(CLASSE_SELECT_BASE, "mt-2 h-12 text-base md:text-sm");

export function LoginForm() {
  const { sessao } = useMonitoria();
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "cadastro">("entrar");

  useEffect(() => {
    if (sessao) router.replace(CAMINHO_INICIAL[sessao.perfil]);
  }, [sessao, router]);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <PainelInstitucional />
      <section className="flex items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <Brand />
          </div>
          {modo === "entrar" ? (
            <FormularioEntrar irParaCadastro={() => setModo("cadastro")} />
          ) : (
            <FormularioCadastro irParaLogin={() => setModo("entrar")} />
          )}
        </div>
      </section>
    </main>
  );
}
function PainelInstitucional() {
  /*    aqui podemos colocar estatísticas do sistema, como número de dúvidas resolvidas, monitores ativos e disciplinas ativas
  
  const { db } = useMonitoria();
  const resolvidas = db.duvidas.filter((d) => d.status === "respondida").length;
  const monitoresAtivos = new Set(
  db.monitoresDisciplina.filter((v) => v.ativo).map((v) => v.monitorId),
  ).size;
  const disciplinasAtivas = db.disciplinas.filter((d) => d.ativa).length;
  */

  return (
    <section className="relative hidden overflow-hidden bg-primary px-14 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <Brand inverted />
      <div className="relative z-10 max-w-xl">
        <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-[-0.035em]">
          Aprender também é saber perguntar.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-foreground/85">
          Um espaço comum para alunos e monitores transformarem dúvidas em respostas que ficam.
        </p>
        <div className="mt-16 border-t border-primary-foreground/25 pt-5">
          <p className="text-sm font-medium text-primary-foreground/75">
            Da dúvida ao próximo passo
          </p>
          <div className="mt-5 flex items-center gap-3 text-sm font-semibold">
            <span>Pergunta</span>
            <span aria-hidden="true" className="h-px flex-1 bg-primary-foreground/40" />
            <span>Monitoria</span>
            <span aria-hidden="true" className="h-px flex-1 bg-primary-foreground/40" />
            <span>Resposta</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-primary-foreground/65">Instituto de Computação · UFAL</p>
    </section>
  );
}

/*      contador de estatísticas do sistema, como número de dúvidas resolvidas, monitores ativos e disciplinas ativas
            
            <dl className="mt-8 grid grid-cols-3 gap-6">
              <Indicador valor={resolvidas} rotulo="dúvidas resolvidas" />
              <Indicador valor={monitoresAtivos} rotulo="monitores ativos" />
              <Indicador valor={disciplinasAtivas} rotulo="disciplinas" />
            </dl>
*/

function Indicador({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <dd className="font-display text-2xl font-bold tabular-nums">{valor}</dd>
      <dt className="text-xs text-primary-foreground/75">{rotulo}</dt>
    </div>
  );
}

function FormularioEntrar({ irParaCadastro }: { irParaCadastro: () => void }) {
  const { entrar } = useMonitoria();
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilAcesso>("aluno");
  const [erro, setErro] = useState("");

  const usarDemo = (p: PerfilAcesso) => {
    setPerfil(p);
    setEmail(CONTAS_DEMO[p]);
    setErro("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setErro(entrar(email, perfil) ?? "");
      }}
    >
      <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">Acesse sua conta</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre com seu e-mail institucional para continuar.
      </p>
      <div className="mt-8">
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">
          E-mail institucional
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (erro) setErro("");
          }}
          placeholder="seu.nome@ufal.br"
          aria-invalid={erro ? true : undefined}
          className="h-12 aria-invalid:border-destructive"
        />
        {erro && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {erro}
          </p>
        )}
      </div>
      <fieldset className="mt-7">
        <legend className="mb-2 text-sm font-semibold">Como você deseja entrar?</legend>
        <div className="space-y-2" role="radiogroup" aria-label="Perfil de acesso">
          {PERFIS.map((opcao) => {
            const ativo = perfil === opcao.id;
            return (
              <button
                key={opcao.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setPerfil(opcao.id)}
                className={cn(
                  "flex min-h-16 w-full items-center gap-3 rounded-lg border bg-card px-4 text-left transition-[border-color,background-color,box-shadow]",
                  ativo
                    ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md transition-colors",
                    ativo ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  <opcao.icone className="size-5" weight={ativo ? "fill" : "regular"} />
                </span>
                <span className="flex-1">
                  <strong className={cn("block text-sm", ativo && "text-primary")}>
                    {opcao.titulo}
                  </strong>
                  <small className="text-muted-foreground">{opcao.subtitulo}</small>
                </span>
                <CheckCircle
                  aria-hidden="true"
                  weight="fill"
                  className={cn(
                    "size-5 text-primary transition-opacity",
                    ativo ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" className="mt-7 h-12 w-full">
        Entrar como {PERFIS.find((p) => p.id === perfil)?.titulo.toLowerCase()}
        <CaretRight aria-hidden="true" />
      </Button>
      <p className="mt-6 text-sm text-muted-foreground text-center">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={irParaCadastro}
          className="font-semibold text-primary hover:underline"
        >
          Criar conta
        </button>
      </p>
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preencher com uma conta de demonstração
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PERFIS.map((opcao) => (
            <Button
              key={opcao.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => usarDemo(opcao.id)}
            >
              {opcao.id === "admin" ? "Admin" : opcao.titulo}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}

function FormularioCadastro({ irParaLogin }: { irParaLogin: () => void }) {
  const { db, cadastrar } = useMonitoria();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [curso, setCurso] = useState<string>(CURSOS[0]);
  const [querMonitoria, setQuerMonitoria] = useState(false);
  const [disciplinaIds, setDisciplinaIds] = useState<Id[]>([]);
  const [justificativa, setJustificativa] = useState("");
  const [verificacao, setVerificacao] = useState<VerificacaoEmail | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");

  const enviarCodigo = () => {
    try {
      setVerificacao(iniciarVerificacao(db, { nome, email, curso }));
      setCodigo("");
      setErro("");
    } catch (e) {
      if (!(e instanceof ServiceError)) throw e;
      setErro(e.message);
    }
  };

  const confirmar = () => {
    if (!verificacao) return;
    const resultado = conferirCodigo(verificacao, codigo);
    if (!resultado.ok) {
      setVerificacao(resultado.verificacao);
      setCodigo("");
      setErro(resultado.erro);
      return;
    }
    setErro(cadastrar(verificacao, querMonitoria ? { disciplinaIds, justificativa } : null) ?? "");
  };

  if (verificacao) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (codigo.length === 6) confirmar();
        }}
      >
        <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">Digite o código</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para <strong>{verificacao.dados.email}</strong>. Ele vale
          por 10 minutos.
        </p>
        <div className="mt-6 border-y border-dashed border-border py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Modo de demonstração
          </p>
          <p className="mt-1">
            Este protótipo não tem servidor de e-mail. Seu código é{" "}
            <strong className="tracking-widest">{verificacao.codigo}</strong>.
          </p>
        </div>
        <div className="mt-6">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={codigo}
            onChange={setCodigo}
            aria-label="Código de verificação"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {erro && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
        </div>
        <Button type="submit" disabled={codigo.length < 6} className="mt-6 h-12 w-full">
          Confirmar e criar conta
        </Button>
        <div className="mt-4 flex justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setVerificacao(null);
              setErro("");
            }}
            className="text-muted-foreground hover:underline"
          >
            Corrigir dados
          </button>
          <button
            type="button"
            onClick={enviarCodigo}
            className="font-semibold text-primary hover:underline"
          >
            Reenviar código
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        enviarCodigo();
      }}
    >
      <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">Crie sua conta</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Só e-mails institucionais da UFAL (@ufal.br) podem se cadastrar. Vamos confirmar o seu por
        um código.
      </p>
      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="nome">
            Nome completo
          </label>
          <Input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-12 bg-card"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="email-cadastro">
            E-mail institucional
          </label>
          <Input
            id="email-cadastro"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.nome@ufal.br"
            className="h-12 bg-card"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="curso">
            Curso
          </label>
          <select
            id="curso"
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className={CLASSE_SELECT_LOGIN}
          >
            {CURSOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-start gap-3 border-y border-border py-3 text-sm">
          <input
            type="checkbox"
            checked={querMonitoria}
            onChange={(e) => setQuerMonitoria(e.target.checked)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            <strong className="block">Quero ser monitor</strong>
            <small className="text-muted-foreground">
              Você entra como aluno e um administrador analisa o seu pedido.
            </small>
          </span>
        </label>
        {querMonitoria && (
          <RoleRequestFields
            disciplinas={db.disciplinas.filter((d) => d.ativa)}
            selecionadas={disciplinaIds}
            aoAlternar={(id) => setDisciplinaIds((l) => alternarId(l, id))}
            justificativa={justificativa}
            aoMudarJustificativa={setJustificativa}
          />
        )}
        {erro && (
          <p className="text-sm text-destructive" role="alert">
            {erro}
          </p>
        )}
      </div>
      <Button type="submit" className="mt-7 h-12 w-full">
        Enviar código
        <CaretRight aria-hidden="true" />
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={irParaLogin}
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </button>
      </p>
    </form>
  );
}
