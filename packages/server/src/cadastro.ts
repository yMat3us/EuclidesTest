import { v4 as uuid } from "uuid";
import { db } from "./db/index.js";
import { registrarEvento } from "./repository.js";

const CHAVE_RESTRICAO = "restricao_cadastro_ativa";

export function restricaoCadastroAtiva(): boolean {
  const row = db
    .prepare(`SELECT valor FROM configuracoes WHERE chave = ?`)
    .get(CHAVE_RESTRICAO) as { valor: string } | undefined;
  return row?.valor === "1";
}

export function setRestricaoCadastro(ativa: boolean) {
  db.prepare(
    `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES (?, ?, datetime('now'))
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = datetime('now')`,
  ).run(CHAVE_RESTRICAO, ativa ? "1" : "0");
  registrarEvento("restricao_cadastro_alterada", { ativa });
}

export function listarCadastro() {
  return db
    .prepare(
      `SELECT id, nome, turma, eh_professor, ativo, criado_em FROM cadastro_pessoas ORDER BY nome COLLATE NOCASE`,
    )
    .all() as {
    id: string;
    nome: string;
    turma: string | null;
    eh_professor: number;
    ativo: number;
    criado_em: string;
  }[];
}

export function adicionarCadastro(
  nome: string,
  turma: string | null,
  ehProfessor: boolean,
) {
  const id = uuid();
  db.prepare(
    `INSERT INTO cadastro_pessoas (id, nome, turma, eh_professor) VALUES (?, ?, ?, ?)`,
  ).run(id, nome, turma, ehProfessor ? 1 : 0);
  registrarEvento("cadastro_adicionado", { nome, turma, ehProfessor });
  return id;
}

export function removerCadastro(id: string) {
  db.prepare(`DELETE FROM cadastro_pessoas WHERE id = ?`).run(id);
  registrarEvento("cadastro_removido", { id });
}

export function toggleCadastroAtivo(id: string, ativo: boolean) {
  db.prepare(`UPDATE cadastro_pessoas SET ativo = ? WHERE id = ?`).run(
    ativo ? 1 : 0,
    id,
  );
}

export function validarLoginCadastro(
  apelido: string,
  souProfessor: boolean,
): { ok: true } | { ok: false; motivo: string } {
  if (!restricaoCadastroAtiva()) return { ok: true };

  const row = db
    .prepare(
      `SELECT eh_professor, ativo FROM cadastro_pessoas WHERE nome = ? COLLATE NOCASE`,
    )
    .get(apelido) as { eh_professor: number; ativo: number } | undefined;

  if (!row) {
    return {
      ok: false,
      motivo: "Nome não cadastrado. Peça ao professor para liberar seu acesso.",
    };
  }
  if (!row.ativo) {
    return { ok: false, motivo: "Cadastro desativado. Fale com o professor." };
  }
  if (souProfessor && !row.eh_professor) {
    return {
      ok: false,
      motivo: "Este nome não está cadastrado como professor.",
    };
  }
  if (!souProfessor && row.eh_professor) {
    return {
      ok: false,
      motivo: "Use a opção Sou professor ou cadastre-se como aluno.",
    };
  }

  return { ok: true };
}