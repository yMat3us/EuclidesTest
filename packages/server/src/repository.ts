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

export const CONQUISTAS_DEFINICAO = [
  { id: "aprendiz", nome: "Aprendiz", categoria: "Iniciante", nivel: 1 },
  { id: "estudante", nome: "Estudante", categoria: "Iniciante", nivel: 2 },
  { id: "novato-numeros", nome: "Novato dos Números", categoria: "Iniciante", nivel: 3 },
  { id: "explorador-numeros", nome: "Explorador dos Números", categoria: "Iniciante", nivel: 4 },

  { id: "matematico", nome: "Matemático", categoria: "Intermediário", nivel: 5 },
  { id: "analista", nome: "Analista", categoria: "Intermediário", nivel: 6 },
  { id: "mestre-contas", nome: "Mestre das Contas", categoria: "Intermediário", nivel: 7 },
  { id: "resolutor-problemas", nome: "Resolutor de Problemas", categoria: "Intermediário", nivel: 8 },

  { id: "estrategista-matematico", nome: "Estrategista Matemático", categoria: "Avançado", nivel: 9 },
  { id: "genio-numeros", nome: "Gênio dos Números", categoria: "Avançado", nivel: 10 },
  { id: "mestre-algebra", nome: "Mestre da Álgebra", categoria: "Avançado", nivel: 11 },
  { id: "arquiteto-logica", nome: "Arquiteto da Lógica", categoria: "Avançado", nivel: 12 },

  { id: "lenda-matematica", nome: "Lenda Matemática", categoria: "Elite", nivel: 13 },
  { id: "supremo-calculista", nome: "Supremo Calculista", categoria: "Elite", nivel: 14 },
  { id: "guardiao-numeros", nome: "Guardião dos Números", categoria: "Elite", nivel: 15 },
  { id: "mestre-supremo", nome: "Mestre Supremo", categoria: "Elite", nivel: 16 },

  { id: "einstein-supremo", nome: "Einstein Supremo", categoria: "Especial", nivel: 17 },
  { id: "deus-numeros", nome: "Deus dos Números", categoria: "Especial", nivel: 18 },
  { id: "hacker-matematica", nome: "Hacker da Matemática", categoria: "Especial", nivel: 19 },
  { id: "lenda-viva", nome: "Lenda Viva", categoria: "Especial", nivel: 20 },
];

export function obterNivelPorXp(xp: number): number {
  let level = 1;
  while (true) {
    const xpReq = Math.round(100 * Math.pow(level + 1, 2.2));
    if (xp >= xpReq) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

export function obterXpNecessarioParaNivel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 2.2));
}

export function buscarJogadorPorApelido(apelido: string) {
  return db
    .prepare(
      `SELECT id, apelido, turma, ativo, banido, xp, conquistas, avatar FROM jogadores WHERE apelido = ? COLLATE NOCASE`,
    )
    .get(apelido) as
    | {
        id: string;
        apelido: string;
        turma: string | null;
        ativo: number;
        banido: number;
        xp: number;
        conquistas: string;
        avatar: string | null;
      }
    | undefined;
}

export function buscarJogadorPorId(id: string) {
  return db
    .prepare(`SELECT id, apelido, turma, ativo, banido, xp, conquistas, avatar FROM jogadores WHERE id = ?`)
    .get(id) as
    | {
        id: string;
        apelido: string;
        turma: string | null;
        ativo: number;
        banido: number;
        xp: number;
        conquistas: string;
        avatar: string | null;
      }
    | undefined;
}

export function criarJogador(apelido: string, turma: string | null) {
  const id = uuid();
  db.prepare(
    `INSERT INTO jogadores (id, apelido, turma, xp, conquistas, avatar) VALUES (?, ?, ?, 0, '[]', NULL)`,
  ).run(id, apelido, turma);
  registrarEvento("jogador_criado", { apelido, turma }, id);
  return { id, apelido, turma: turma ?? undefined, xp: 0, conquistas: "[]", avatar: null };
}

export function adicionarXpJogador(
  jogadorId: string,
  xpGanha: number,
): {
  novoXp: number;
  novoNivel: number;
  conquistasDesbloqueadas: string[];
} {
  const jogador = buscarJogadorPorId(jogadorId);
  if (!jogador) {
    throw new Error("Jogador não encontrado");
  }

  const novoXp = jogador.xp + xpGanha;
  const novoNivel = obterNivelPorXp(novoXp);

  let conquistasAtuais: string[] = [];
  try {
    conquistasAtuais = JSON.parse(jogador.conquistas || "[]");
  } catch (e) {
    conquistasAtuais = [];
  }

  const conquistasDesbloqueadas: string[] = [];

  for (const c of CONQUISTAS_DEFINICAO) {
    if (novoNivel >= c.nivel && !conquistasAtuais.includes(c.id)) {
      conquistasAtuais.push(c.id);
      conquistasDesbloqueadas.push(c.nome);
    }
  }

  db.prepare(`UPDATE jogadores SET xp = ?, conquistas = ? WHERE id = ?`).run(
    novoXp,
    JSON.stringify(conquistasAtuais),
    jogadorId,
  );

  return { novoXp, novoNivel, conquistasDesbloqueadas };
}

export function atualizarXpJogador(jogadorId: string, novoXp: number) {
  const jogador = buscarJogadorPorId(jogadorId);
  if (!jogador) {
    throw new Error("Jogador não encontrado");
  }

  const novoNivel = obterNivelPorXp(novoXp);
  let conquistasAtuais: string[] = [];
  try {
    conquistasAtuais = JSON.parse(jogador.conquistas || "[]");
  } catch (e) {
    conquistasAtuais = [];
  }

  for (const c of CONQUISTAS_DEFINICAO) {
    if (novoNivel >= c.nivel && !conquistasAtuais.includes(c.id)) {
      conquistasAtuais.push(c.id);
    }
  }

  db.prepare(`UPDATE jogadores SET xp = ?, conquistas = ? WHERE id = ?`).run(
    novoXp,
    JSON.stringify(conquistasAtuais),
    jogadorId,
  );
}

export function atualizarConquistasJogador(jogadorId: string, conquistas: string[]) {
  db.prepare(`UPDATE jogadores SET conquistas = ? WHERE id = ?`).run(
    JSON.stringify(conquistas),
    jogadorId,
  );
}

export function atualizarAvatarJogador(jogadorId: string, avatar: string | null) {
  db.prepare(`UPDATE jogadores SET avatar = ? WHERE id = ?`).run(avatar, jogadorId);
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
      j.avatar,
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