"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { criarDadosIniciais } from "@/data/seed";
import type { Db, Id, PerfilAcesso, Usuario } from "@/domain/types";
import { ServiceError, autenticar, type Resultado } from "@/services/monitoria";
import { concluirCadastro, type PedidoMonitoria, type VerificacaoEmail } from "@/services/usuarios";
import { eMonitor, perfisDoUsuario, usuarioPorId } from "@/services/selectors";

interface Sessao {
  usuarioId: Id;
  perfil: PerfilAcesso;
}

export interface AvisoTela {
  id: number;
  mensagem: string;
  tipo: "sucesso" | "erro";
}

interface MonitoriaContexto {
  db: Db;
  sessao: Sessao | null;
  usuario: Usuario | null;
  aviso: AvisoTela | null;
  /** Devolve a mensagem de erro, ou null se o login funcionou. */
  entrar: (email: string, perfil: PerfilAcesso) => string | null;
  /** Cria a conta (e-mail já verificado) e entra como aluno. Devolve a mensagem de erro, ou null se deu certo. */
  cadastrar: (verificacao: VerificacaoEmail, pedido: PedidoMonitoria | null) => string | null;
  sair: () => void;
  /** Troca entre aluno e monitor sem novo login (só se o usuário tiver os dois perfis). */
  trocarPerfil: (perfil: Exclude<PerfilAcesso, "admin">) => boolean;
  notificar: (mensagem: string, tipo?: AvisoTela["tipo"]) => void;
  /**
   * Executa uma operação de serviço sobre o estado atual. Em caso de violação de regra,
   * mostra o erro na tela e devolve undefined; em caso de sucesso, devolve o valor.
   */
  executar: <T>(
    operacao: (db: Db) => Resultado<T>,
    sucesso?: string | ((valor: T) => string),
  ) => T | undefined;
  /** Variante para operações que só devolvem o novo estado. */
  executarSimples: (operacao: (db: Db) => Db, sucesso?: string) => boolean;
}

const Contexto = createContext<MonitoriaContexto | null>(null);

export function MonitoriaProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(() => criarDadosIniciais());
  const dbRef = useRef(db);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const sessaoRef = useRef(sessao);
  sessaoRef.current = sessao;
  const [aviso, setAviso] = useState<AvisoTela | null>(null);
  const contador = useRef(0);

  const notificar = useCallback((mensagem: string, tipo: AvisoTela["tipo"] = "sucesso") => {
    contador.current += 1;
    const id = contador.current;
    setAviso({ id, mensagem, tipo });
    window.setTimeout(() => setAviso((atual) => (atual?.id === id ? null : atual)), 3200);
  }, []);

  const confirmarEstado = useCallback((novo: Db) => {
    dbRef.current = novo;
    setDb(novo);
  }, []);

  const executar = useCallback<MonitoriaContexto["executar"]>(
    (operacao, sucesso) => {
      try {
        const { db: novo, valor } = operacao(dbRef.current);
        confirmarEstado(novo);
        if (sucesso) notificar(typeof sucesso === "function" ? sucesso(valor) : sucesso);
        return valor;
      } catch (erro) {
        if (erro instanceof ServiceError) {
          notificar(erro.message, "erro");
          return undefined;
        }
        throw erro;
      }
    },
    [confirmarEstado, notificar],
  );

  const executarSimples = useCallback<MonitoriaContexto["executarSimples"]>(
    (operacao, sucesso) => {
      try {
        confirmarEstado(operacao(dbRef.current));
        if (sucesso) notificar(sucesso);
        return true;
      } catch (erro) {
        if (erro instanceof ServiceError) {
          notificar(erro.message, "erro");
          return false;
        }
        throw erro;
      }
    },
    [confirmarEstado, notificar],
  );

  const entrar = useCallback<MonitoriaContexto["entrar"]>((email, perfil) => {
    try {
      const usuario = autenticar(dbRef.current, email, perfil);
      setSessao({ usuarioId: usuario.id, perfil });
      return null;
    } catch (erro) {
      if (erro instanceof ServiceError) return erro.message;
      throw erro;
    }
  }, []);

  const cadastrar = useCallback<MonitoriaContexto["cadastrar"]>(
    (verificacao, pedido) => {
      try {
        const { db: novo, valor: criado } = concluirCadastro(dbRef.current, verificacao, pedido);
        confirmarEstado(novo);
        setSessao({ usuarioId: criado.id, perfil: "aluno" });
        notificar(
          pedido
            ? "Conta criada! Sua solicitação de monitoria aguarda a análise de um administrador."
            : "Conta criada! Bem-vindo(a) ao Monitora IC.",
        );
        return null;
      } catch (erro) {
        if (erro instanceof ServiceError) return erro.message;
        throw erro;
      }
    },
    [confirmarEstado, notificar],
  );

  const sair = useCallback(() => setSessao(null), []);

  const trocarPerfil = useCallback<MonitoriaContexto["trocarPerfil"]>((perfil) => {
    const atual = sessaoRef.current;
    if (!atual || !perfisDoUsuario(dbRef.current, atual.usuarioId).includes(perfil)) return false;
    setSessao({ usuarioId: atual.usuarioId, perfil });
    return true;
  }, []);

  // A sessão só vale enquanto a conta estiver ativa e o perfil escolhido ainda for permitido
  // (ex.: um monitor que perdeu o vínculo, ou um administrador que perdeu o acesso, volta ao login).
  const candidato = sessao ? (usuarioPorId(db, sessao.usuarioId) ?? null) : null;
  const sessaoValida =
    sessao !== null &&
    candidato !== null &&
    candidato.ativo &&
    (sessao.perfil === "aluno" ||
      (sessao.perfil === "monitor" && eMonitor(db, candidato.id)) ||
      (sessao.perfil === "admin" && candidato.admin));
  const sessaoEfetiva = sessaoValida ? sessao : null;
  const usuario = sessaoValida ? candidato : null;
  const valor = useMemo<MonitoriaContexto>(
    () => ({
      db,
      sessao: sessaoEfetiva,
      usuario,
      aviso,
      entrar,
      cadastrar,
      sair,
      trocarPerfil,
      notificar,
      executar,
      executarSimples,
    }),
    [
      db,
      sessaoEfetiva,
      usuario,
      aviso,
      entrar,
      cadastrar,
      sair,
      trocarPerfil,
      notificar,
      executar,
      executarSimples,
    ],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMonitoria(): MonitoriaContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useMonitoria deve ser usado dentro de <MonitoriaProvider>.");
  return contexto;
}

/** Atalho para telas que só existem com sessão ativa. */
export function useSessaoAtiva(): MonitoriaContexto & { usuario: Usuario } {
  const contexto = useMonitoria();
  if (!contexto.usuario) throw new Error("Sessão não iniciada.");
  return { ...contexto, usuario: contexto.usuario };
}
