# Monitora IC

Protótipo client-only de uma central acadêmica para dúvidas e atendimentos de monitoria. Os dados são mantidos em memória e não há serviços externos nem persistência.

## Desenvolvimento

Use Node.js e pnpm:

```sh
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` inicia o servidor de desenvolvimento.
- `pnpm build` cria a versão de produção.
- `pnpm start` serve a versão de produção.
- `pnpm lint` executa o ESLint.

## Rotas

- `/login` — entrar (aluno, monitor ou administrador) ou criar conta com verificação de e-mail.
- `/aluno` — visão geral do aluno.
- `/aluno/acervo` — busca de respostas anteriores (disciplina, tópico e período).
- `/aluno/nova-duvida` — envio de uma dúvida, com sugestões do acervo e atribuição automática.
- `/aluno/duvidas` — acompanhamento das dúvidas e respostas recebidas.
- `/aluno/aulas` — aulas coletivas: convites, presença e sala.
- `/aluno/cargo` e `/monitor/cargo` — "Meu cargo": pedido de troca aluno ⇄ monitor.
- `/monitor` — visão geral do monitor (carga, novas atribuições, tópico frequente).
- `/monitor/fila` — fila "Atribuídas a mim" e "Fila geral", resposta e reatribuição.
- `/monitor/aulas` — criação de aulas coletivas com reserva de sala.
- `/admin` — usuários: alterar cargo, ativar/desativar contas, acesso de administrador.
- `/admin/solicitacoes` — validação dos pedidos de troca de cargo.

## Contas de demonstração

| Perfil | E-mail |
| --- | --- |
| Aluno | `aluno@ic.ufal.br` |
| Monitor | `monitor@ic.ufal.br` |
| Administrador | `admin@ufal.br` |

Qualquer e-mail `@ufal.br` (ou subdomínio, como `@ic.ufal.br`) pode criar conta; o código de verificação aparece na tela.

## Estrutura

- `src/domain` — tipos (uma interface por tabela) e utilitários de data/texto.
- `src/data/seed.ts` — dados iniciais em memória.
- `src/services` — regras de negócio (`monitoria.ts`, `usuarios.ts`) e consultas (`selectors.ts`).
- `src/store/monitoria-store.tsx` — estado, sessão e avisos (`useMonitoria`, `useSessaoAtiva`).
- `src/features` — telas por perfil (`student`, `monitor`, `admin`, `profile`).

O estado de sessão e os dados de demonstração permanecem apenas em memória; atualizar a página reinicia o protótipo.
