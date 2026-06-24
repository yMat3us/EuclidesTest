import { v4 as uuid } from "uuid";
import { db } from "./db/index.js";
import { registrarEvento } from "./repository.js";

export interface RodadaAtiva {
  id: string;
  numero: number;
  titulo: string;
  inicio_em: string;
  minigames_permitidos?: string | null;
}

export function getRodadaAtiva(): RodadaAtiva | null {
  const row = db
    .prepare(
      `SELECT id, numero, titulo, inicio_em, minigames_permitidos FROM rodadas WHERE ativa = 1 LIMIT 1`,
    )
    .get() as RodadaAtiva | undefined;
  return row ?? null;
}

export function iniciarRodada(titulo?: string, minigamesPermitidos?: string[] | null): RodadaAtiva {
  db.prepare(
    `UPDATE rodadas SET ativa = 0, fim_em = datetime('now') WHERE ativa = 1`,
  ).run();

  const numeroRow = db
    .prepare(`SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM rodadas`)
    .get() as { n: number };

  const id = uuid();
  const tituloFinal =
    titulo?.trim() || `Apresentação ${numeroRow.n}`;

  const minigamesVal = minigamesPermitidos && minigamesPermitidos.length > 0 ? JSON.stringify(minigamesPermitidos) : null;

  db.prepare(
    `INSERT INTO rodadas (id, numero, titulo, ativa, minigames_permitidos) VALUES (?, ?, ?, 1, ?)`,
  ).run(id, numeroRow.n, tituloFinal, minigamesVal);

  registrarEvento("rodada_iniciada", { rodadaId: id, numero: numeroRow.n, titulo: tituloFinal, minigames: minigamesPermitidos });

  return {
    id,
    numero: numeroRow.n,
    titulo: tituloFinal,
    inicio_em: new Date().toISOString(),
    minigames_permitidos: minigamesVal,
  };
}

/** Encerra a rodada ativa e apaga o ranking temporário dessa apresentação */
export function encerrarRodadaAtiva(): { ok: boolean; mensagem: string } {
  const rodada = getRodadaAtiva();
  if (!rodada) {
    return { ok: false, mensagem: "Nenhuma apresentação ativa no momento" };
  }

  db.prepare(`DELETE FROM pontuacoes_rodada WHERE rodada_id = ?`).run(rodada.id);
  db.prepare(
    `UPDATE rodadas SET ativa = 0, fim_em = datetime('now') WHERE id = ?`,
  ).run(rodada.id);

  registrarEvento("rodada_encerrada", { rodadaId: rodada.id, numero: rodada.numero });

  return {
    ok: true,
    mensagem: `Apresentação #${rodada.numero} encerrada. Ranking temporário zerado.`,
  };
}

export function salvarPontuacaoRodada(
  rodadaId: string,
  jogadorId: string,
  minigameId: string,
  pontos: number,
  duracaoMs: number,
  metadata: string | null,
) {
  db.prepare(
    `INSERT INTO pontuacoes_rodada (rodada_id, jogador_id, minigame_id, pontos, duracao_ms, metadata)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(rodada_id, jogador_id, minigame_id) DO UPDATE SET
       pontos = excluded.pontos,
       duracao_ms = excluded.duracao_ms,
       metadata = excluded.metadata,
       atualizado_em = datetime('now')
     WHERE excluded.pontos > pontuacoes_rodada.pontos`,
  ).run(rodadaId, jogadorId, minigameId, pontos, duracaoMs, metadata);
}

export function rankingRodada(limite: number, rodadaId?: string) {
  const id = rodadaId ?? getRodadaAtiva()?.id;
  if (!id) return { rodada: null, ranking: [] as unknown[] };

  const rodada = db
    .prepare(`SELECT id, numero, titulo, inicio_em FROM rodadas WHERE id = ?`)
    .get(id) as RodadaAtiva | undefined;

  const ranking = db
    .prepare(
      `
    SELECT
      j.id,
      j.apelido,
      j.turma,
      j.avatar,
      COALESCE(SUM(pr.pontos), 0) AS total,
      COUNT(pr.id) AS minigames_jogados,
      MAX(pr.atualizado_em) AS ultima_partida
    FROM jogadores j
    INNER JOIN pontuacoes_rodada pr ON pr.jogador_id = j.id AND pr.rodada_id = ?
    WHERE j.banido = 0
    GROUP BY j.id
    HAVING total > 0
    ORDER BY total DESC, ultima_partida ASC
    LIMIT ?
  `,
    )
    .all(id, limite);

  return { rodada, ranking };
}

export function totalRodadaJogador(jogadorId: string, rodadaId?: string): number {
  const id = rodadaId ?? getRodadaAtiva()?.id;
  if (!id) return 0;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(pontos), 0) AS t FROM pontuacoes_rodada
       WHERE jogador_id = ? AND rodada_id = ?`,
    )
    .get(jogadorId, id) as { t: number };
  return row.t;
}

/** Zera só o ranking da apresentação ativa (mantém rodada aberta) */
export function zerarRankingRodadaAtiva(): { ok: boolean; mensagem: string } {
  const rodada = getRodadaAtiva();
  if (!rodada) {
    return { ok: false, mensagem: "Nenhuma apresentação ativa" };
  }
  db.prepare(`DELETE FROM pontuacoes_rodada WHERE rodada_id = ?`).run(rodada.id);
  registrarEvento("rodada_reset_pontos", { rodadaId: rodada.id });
  return {
    ok: true,
    mensagem: `Ranking temporário da apresentação #${rodada.numero} zerado.`,
  };
}

/** Zera todas as rodadas e pontuações temporárias */
export function zerarTodasRodadas() {
  db.exec(`DELETE FROM pontuacoes_rodada; DELETE FROM rodadas;`);
  registrarEvento("admin_reset_rodadas", {});
}