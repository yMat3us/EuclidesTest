import { v4 as uuid } from "uuid";
import { db } from "./db/index.js";
import { TURMAS_OPCOES } from "@ddm/shared";

export function registrarEvento(
  tipo: string,
  detalhes?: Record<string, unknown>,
  jogadorId?: string,
) {
  db.prepare(
    `INSERT INTO eventos (tipo, jogador_id, detalhes) VALUES (?, ?, ?)`,
  ).run(tipo, jogadorId ?? null, detalhes ? JSON.stringify(detalhes) : null);
}

export function buscarJogadorPorApelido(apelido: string) {
  return db
    .prepare(
      `SELECT id, apelido, turma, ativo, banido FROM jogadores WHERE apelido = ? COLLATE NOCASE`,
    )
    .get(apelido) as
    | { id: string; apelido: string; turma: string | null; ativo: number; banido: number }
    | undefined;
}

export function buscarJogadorPorId(id: string) {
  return db
    .prepare(`SELECT id, apelido, turma, ativo, banido FROM jogadores WHERE id = ?`)
    .get(id) as
    | { id: string; apelido: string; turma: string | null; ativo: number; banido: number }
    | undefined;
}

export function criarJogador(apelido: string, turma: string | null) {
  const id = uuid();
  db.prepare(
    `INSERT INTO jogadores (id, apelido, turma) VALUES (?, ?, ?)`,
  ).run(id, apelido, turma);
  registrarEvento("jogador_criado", { apelido, turma }, id);
  return { id, apelido, turma: turma ?? undefined };
}

export function atualizarAcessoJogador(id: string) {
  db.prepare(
    `UPDATE jogadores SET ultimo_acesso = datetime('now'), ativo = 1 WHERE id = ?`,
  ).run(id);
}

export function atualizarTurmaJogador(id: string, turma: string | null) {
  db.prepare(`UPDATE jogadores SET turma = ? WHERE id = ?`).run(turma, id);
}

export function iniciarSessao(jogadorId: string, userAgent?: string) {
  const id = uuid();
  db.prepare(
    `INSERT INTO sessoes (id, jogador_id, user_agent) VALUES (?, ?, ?)`,
  ).run(id, jogadorId, userAgent ?? null);
  registrarEvento("sessao_inicio", { sessaoId: id }, jogadorId);
  return id;
}

export function encerrarSessoesAbertas(jogadorId: string) {
  const r = db
    .prepare(
      `UPDATE sessoes SET fim_em = datetime('now') WHERE jogador_id = ? AND fim_em IS NULL`,
    )
    .run(jogadorId);
  if (r.changes > 0) {
    registrarEvento("sessao_fim", { quantidade: r.changes }, jogadorId);
  }
}

export function inserirHistoricoPartida(
  jogadorId: string,
  minigameId: string,
  pontos: number,
  duracaoMs: number,
  metadata: string | null,
) {
  db.prepare(
    `INSERT INTO historico_partidas (jogador_id, minigame_id, pontos, duracao_ms, metadata)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(jogadorId, minigameId, pontos, duracaoMs, metadata);
}

export function salvarPartidaGlobal(
  jogadorId: string,
  minigameId: string,
  pontos: number,
  duracaoMs: number,
  metadata: string | null,
) {
  db.prepare(
    `INSERT INTO pontuacoes (jogador_id, minigame_id, pontos, duracao_ms, metadata)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(jogador_id, minigame_id) DO UPDATE SET
       pontos = excluded.pontos,
       duracao_ms = excluded.duracao_ms,
       metadata = excluded.metadata,
       atualizado_em = datetime('now')
     WHERE excluded.pontos > pontuacoes.pontos`,
  ).run(jogadorId, minigameId, pontos, duracaoMs, metadata);

  registrarEvento(
    "partida_registrada",
    { minigameId, pontos, duracaoMs },
    jogadorId,
  );
}

export function rankingGlobal(limite: number) {
  return db
    .prepare(
      `
    SELECT
      j.id,
      j.apelido,
      j.turma,
      COALESCE(SUM(p.pontos), 0) AS total,
      COUNT(p.id) AS minigames_jogados,
      MAX(p.atualizado_em) AS ultima_partida
    FROM jogadores j
    LEFT JOIN pontuacoes p ON p.jogador_id = j.id
    WHERE j.ativo = 1 AND j.banido = 0
    GROUP BY j.id
    ORDER BY total DESC, ultima_partida ASC
    LIMIT ?
  `,
    )
    .all(limite);
}

export function pontuacoesDoJogador(jogadorId: string) {
  return db
    .prepare(
      `SELECT minigame_id, pontos, duracao_ms, atualizado_em AS criado_em
       FROM pontuacoes WHERE jogador_id = ? ORDER BY atualizado_em DESC`,
    )
    .all(jogadorId);
}

export function totalDoJogador(jogadorId: string) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(pontos), 0) AS t FROM pontuacoes WHERE jogador_id = ?`,
    )
    .get(jogadorId) as { t: number };
  return row.t;
}

export function zerarRankingGlobal() {
  db.exec(`DELETE FROM pontuacoes;`);
  registrarEvento("admin_reset_global", {});
}

export function zerarBancoEvento() {
  db.exec(`
    DELETE FROM pontuacoes_rodada;
    DELETE FROM rodadas;
    DELETE FROM historico_partidas;
    DELETE FROM pontuacoes;
    DELETE FROM sessoes;
    DELETE FROM eventos;
    DELETE FROM jogadores;
  `);
  registrarEvento("admin_reset_total", {});
}

export function marcarJogadorInativo(jogadorId: string) {
  db.prepare(`UPDATE jogadores SET ativo = 0 WHERE id = ?`).run(jogadorId);
  encerrarSessoesAbertas(jogadorId);
  registrarEvento("jogador_logout", {}, jogadorId);
}

export function iniciarPartidaAtiva(
  jogadorId: string,
  minigameId: string,
  tokenSeguranca: string,
): string {
  const id = uuid();
  const agoraMs = Date.now();
  db.prepare(
    `INSERT INTO partidas_ativas (id, jogador_id, minigame_id, inicio_ms, token_seguranca) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, jogadorId, minigameId, agoraMs, tokenSeguranca);
  return id;
}

export function buscarPartidaAtiva(id: string) {
  return db
    .prepare(
      `SELECT id, jogador_id, minigame_id, inicio_ms, token_seguranca FROM partidas_ativas WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        jogador_id: string;
        minigame_id: string;
        inicio_ms: number;
        token_seguranca: string;
      }
    | undefined;
}

export function removerPartidaAtiva(id: string) {
  db.prepare(`DELETE FROM partidas_ativas WHERE id = ?`).run(id);
}

export function rankingTurmas() {
  const rows = db
    .prepare(
      `
    SELECT
      j.turma,
      COALESCE(SUM(p.pontos), 0) AS total,
      COUNT(DISTINCT j.id) AS total_jogadores
    FROM jogadores j
    LEFT JOIN pontuacoes p ON p.jogador_id = j.id
    WHERE j.ativo = 1 AND j.banido = 0 AND j.turma IS NOT NULL AND j.turma != 'Professor'
    GROUP BY j.turma
  `,
    )
    .all() as { turma: string; total: number; total_jogadores: number }[];

  const mapa = new Map(
    TURMAS_OPCOES.map((t) => [t, { turma: t, total: 0, total_jogadores: 0 }]),
  );

  for (const r of rows) {
    if (mapa.has(r.turma as any)) {
      mapa.set(r.turma as any, {
        turma: r.turma as any,
        total: r.total,
        total_jogadores: r.total_jogadores,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}