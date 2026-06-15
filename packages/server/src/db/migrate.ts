import type { DatabaseSync } from "node:sqlite";

export function runMigrations(db: DatabaseSync) {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id TEXT PRIMARY KEY,
      apelido TEXT NOT NULL UNIQUE COLLATE NOCASE,
      turma TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      banido INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      ultimo_acesso TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessoes (
      id TEXT PRIMARY KEY,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      inicio_em TEXT NOT NULL DEFAULT (datetime('now')),
      fim_em TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS pontuacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      minigame_id TEXT NOT NULL,
      pontos INTEGER NOT NULL,
      duracao_ms INTEGER NOT NULL,
      metadata TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (jogador_id, minigame_id)
    );

    CREATE TABLE IF NOT EXISTS historico_partidas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      minigame_id TEXT NOT NULL,
      pontos INTEGER NOT NULL,
      duracao_ms INTEGER NOT NULL,
      metadata TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      jogador_id TEXT,
      detalhes TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rodadas (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      inicio_em TEXT NOT NULL DEFAULT (datetime('now')),
      fim_em TEXT,
      ativa INTEGER NOT NULL DEFAULT 0,
      minigames_permitidos TEXT
    );

    CREATE TABLE IF NOT EXISTS pontuacoes_rodada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rodada_id TEXT NOT NULL REFERENCES rodadas(id) ON DELETE CASCADE,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      minigame_id TEXT NOT NULL,
      pontos INTEGER NOT NULL,
      duracao_ms INTEGER NOT NULL,
      metadata TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (rodada_id, jogador_id, minigame_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessoes_jogador ON sessoes(jogador_id);
    CREATE INDEX IF NOT EXISTS idx_pontuacoes_jogador ON pontuacoes(jogador_id);
    CREATE INDEX IF NOT EXISTS idx_historico_jogador ON historico_partidas(jogador_id);
    CREATE INDEX IF NOT EXISTS idx_historico_minigame ON historico_partidas(minigame_id);
    CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
    CREATE INDEX IF NOT EXISTS idx_rodadas_ativa ON rodadas(ativa);
    CREATE INDEX IF NOT EXISTS idx_pontuacoes_rodada ON pontuacoes_rodada(rodada_id, jogador_id);

    CREATE TABLE IF NOT EXISTS cadastro_pessoas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
      turma TEXT,
      eh_professor INTEGER NOT NULL DEFAULT 0,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cadastro_nome ON cadastro_pessoas(nome);

    CREATE TABLE IF NOT EXISTS partidas_ativas (
      id TEXT PRIMARY KEY,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      minigame_id TEXT NOT NULL,
      inicio_ms INTEGER NOT NULL,
      token_seguranca TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_partidas_ativas ON partidas_ativas(id);
  `);

  db.prepare(
    `INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('restricao_cadastro_ativa', '0')`,
  ).run();

  migrarRankingAntigo(db);
}

/** Copia dados do ranking.db legado, se existir */
function migrarRankingAntigo(db: DatabaseSync) {
  const legado = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='pontuacoes'`,
    )
    .get();

  if (!legado) return;

  const cols = db.prepare(`PRAGMA table_info(jogadores)`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === "ativo")) {
    db.exec(`ALTER TABLE jogadores ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1`);
  }
  if (!cols.some((c) => c.name === "banido")) {
    db.exec(`ALTER TABLE jogadores ADD COLUMN banido INTEGER NOT NULL DEFAULT 0`);
  }
  if (!cols.some((c) => c.name === "ultimo_acesso")) {
    db.exec(
      `ALTER TABLE jogadores ADD COLUMN ultimo_acesso TEXT NOT NULL DEFAULT (datetime('now'))`,
    );
  }

  const rcols = db.prepare(`PRAGMA table_info(rodadas)`).all() as {
    name: string;
  }[];
  if (rcols.length && !rcols.some((c) => c.name === "minigames_permitidos")) {
    db.exec(`ALTER TABLE rodadas ADD COLUMN minigames_permitidos TEXT`);
  }

  const pcols = db.prepare(`PRAGMA table_info(pontuacoes)`).all() as {
    name: string;
  }[];
  if (pcols.length && !pcols.some((c) => c.name === "atualizado_em")) {
    db.exec(
      `ALTER TABLE pontuacoes ADD COLUMN atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))`,
    );
  }
}