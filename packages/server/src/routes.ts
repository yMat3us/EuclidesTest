import {
  MINIGAMES,
  TURMAS_OPCOES,
  cadastroPessoaSchema,
  enviarPontuacaoSchema,
  registrarJogadorSchema,
} from "@ddm/shared";
import {
  adicionarCadastro,
  listarCadastro,
  removerCadastro,
  restricaoCadastroAtiva,
  setRestricaoCadastro,
  toggleCadastroAtivo,
  validarLoginCadastro,
} from "./cadastro.js";
import type { FastifyInstance } from "fastify";
import { getDbInfo, db } from "./db/index.js";
import { getAdminToken, isAdminRequest } from "./admin-auth.js";
import {
  atualizarAcessoJogador,
  atualizarTurmaJogador,
  buscarJogadorPorApelido,
  buscarJogadorPorId,
  criarJogador,
  iniciarSessao,
  inserirHistoricoPartida,
  marcarJogadorInativo,
  pontuacoesDoJogador,
  rankingGlobal,
  registrarEvento,
  salvarPartidaGlobal,
  totalDoJogador,
  zerarBancoEvento,
  zerarRankingGlobal,
  iniciarPartidaAtiva,
  buscarPartidaAtiva,
  removerPartidaAtiva,
  rankingTurmas,
  encerrarSessoesAbertas,
  adicionarXpJogador,
  atualizarXpJogador,
  atualizarConquistasJogador,
  atualizarAvatarJogador,
} from "./repository.js";
import {
  encerrarRodadaAtiva,
  getRodadaAtiva,
  iniciarRodada,
  rankingRodada,
  salvarPontuacaoRodada,
  totalRodadaJogador,
  zerarRankingRodadaAtiva,
  zerarTodasRodadas,
} from "./rodadas.js";
import { validarPontuacao } from "./scoring.js";
import crypto from "node:crypto";

const sseConexoes = new Set<any>();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function extrairJsonLimpo(texto: string): string {
  let limpo = texto.trim();
  if (limpo.startsWith("```json")) {
    limpo = limpo.slice(7);
  } else if (limpo.startsWith("```")) {
    limpo = limpo.slice(3);
  }
  if (limpo.endsWith("```")) {
    limpo = limpo.slice(0, -3);
  }
  return limpo.trim();
}

function compararNumerosWhatsApp(num1: string, num2: string): boolean {
  const n1 = num1.replace(/\D/g, "");
  const n2 = num2.replace(/\D/g, "");
  if (n1 === n2) return true;

  const limparBR = (num: string) => {
    let s = num;
    if (s.startsWith("55") && s.length >= 10) {
      s = s.substring(2);
    }
    if (s.length === 11 && s[2] === "9") {
      s = s.substring(0, 2) + s.substring(3);
    }
    return s;
  };

  return limparBR(n1) === limparBR(n2);
}

const solicitacoesProfessores = new Map<string, {
  id: string;
  apelido: string;
  userAgent: string | undefined;
  status: "pendente" | "aprovado" | "rejeitado";
  criadoEm: number;
  loginData?: any;
}>();

export function emitirEventoRealtime(tipo: string, dados: any = {}) {
  const payload = `data: ${JSON.stringify({ tipo, dados })}\n\n`;
  for (const reply of sseConexoes) {
    try {
      reply.raw.write(payload);
    } catch {
      sseConexoes.delete(reply);
    }
  }
}

/**
 * Registra todas as rotas da API REST da aplicação no servidor Fastify.
 * Inclui endpoints públicos para registro de jogadores, inicialização de partidas,
 * envio de pontuações, streaming em tempo real via SSE (Server-Sent Events) de rankings,
 * e painel administrativo protegido para o professor gerenciar turmas e rodadas.
 * @param app Instância do servidor Fastify.
 */
export async function registerRoutes(app: FastifyInstance) {
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, function (req, body, done) {
    try {
      const parsed = Object.fromEntries(new URLSearchParams(body as string));
      done(null, parsed);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  app.get("/api/realtime/eventos", (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    sseConexoes.add(reply);

    req.raw.on("close", () => {
      sseConexoes.delete(reply);
    });
  });

  app.get("/api/health", async () => ({
    status: "ok",
    banco: getDbInfo().caminho,
  }));

  app.get("/api/turmas", async () => ({ turmas: TURMAS_OPCOES }));

  app.get("/api/config", async () => ({
    restricaoCadastroAtiva: restricaoCadastroAtiva(),
    turmas: TURMAS_OPCOES,
  }));

  app.get<{ Querystring: { all?: string } }>("/api/minigames", async (req) => {
    const rodada = getRodadaAtiva();
    const showAll = req.query.all === "true";
    let minigames = MINIGAMES;
    if (!showAll && rodada && rodada.minigames_permitidos) {
      try {
        const permitidos = JSON.parse(rodada.minigames_permitidos) as string[];
        if (Array.isArray(permitidos) && permitidos.length > 0) {
          minigames = MINIGAMES.filter((m) => permitidos.includes(m.id));
        }
      } catch {}
    }
    return {
      minigames,
      pontuacaoTotalPossivel: minigames.reduce((s, m) => s + m.pontuacaoMaxima, 0),
      apresentacaoAtiva: !!rodada,
      podeJogar: !!rodada,
    };
  });

  app.get("/api/rodada/atual", async () => {
    const rodada = getRodadaAtiva();
    return {
      ativa: !!rodada,
      rodada: rodada ?? null,
    };
  });

  app.post<{ Body: unknown }>("/api/jogadores", async (req, reply) => {
    const parsed = registrarJogadorSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: parsed.error.flatten() });
    }

    const validacaoCadastro = validarLoginCadastro(
      parsed.data.apelido,
      parsed.data.souProfessor,
    );
    if (!validacaoCadastro.ok) {
      return reply.status(403).send({ erro: validacaoCadastro.motivo });
    }

    const ua = req.headers["user-agent"];

    // Se for Professor, entra na fila de aprovação do Administrador
    if (parsed.data.souProfessor) {
      const solicitacaoId = crypto.randomUUID();
      solicitacoesProfessores.set(solicitacaoId, {
        id: solicitacaoId,
        apelido: parsed.data.apelido,
        userAgent: ua,
        status: "pendente",
        criadoEm: Date.now(),
      });
      emitirEventoRealtime("solicitacao_professor", { id: solicitacaoId, apelido: parsed.data.apelido });

      // Notificar administrador via WhatsApp se configurado
      const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
      if (adminNumber) {
        enviarMensagemWhatsApp(
          adminNumber,
          `📢 *Nova solicitação de Professor!*\n\nApelido: *${parsed.data.apelido}*\n\nPara decidir, responda com:\n- *aprovar ${parsed.data.apelido}*\n- *rejeitar ${parsed.data.apelido}*`
        ).catch((err) => console.error("Erro ao notificar admin via WhatsApp:", err));
      }

      return {
        status: "aguardando_aprovacao",
        solicitacaoId,
      };
    }

    const turmaLogin = parsed.data.turma ?? null;
    let jogador = buscarJogadorPorApelido(parsed.data.apelido);

    if (jogador) {
      if (jogador.banido === 1) {
        return reply.status(403).send({ erro: "Você está banido desta arena." });
      }
      atualizarAcessoJogador(jogador.id);
      atualizarTurmaJogador(jogador.id, turmaLogin);
      registrarEvento("jogador_login", { apelido: parsed.data.apelido }, jogador.id);
    } else {
      try {
        const criado = criarJogador(parsed.data.apelido, turmaLogin);
        jogador = {
          id: criado.id,
          apelido: criado.apelido,
          turma: criado.turma ?? null,
          ativo: 1,
          banido: 0,
          xp: 0,
          conquistas: "[]",
          avatar: null,
        };
      } catch {
        return reply.status(409).send({ erro: "Não foi possível criar jogador" });
      }
    }

    if (!jogador) {
      return reply.status(500).send({ erro: "Erro ao criar jogador" });
    }

    const sessaoId = iniciarSessao(jogador.id, ua);
    const rodada = getRodadaAtiva();

    return {
      jogador: {
        id: jogador.id,
        apelido: jogador.apelido,
        turma: jogador.turma ?? undefined,
        souProfessor: false,
        xp: jogador.xp,
        conquistas: JSON.parse(jogador.conquistas || "[]"),
        avatar: jogador.avatar,
      },
      sessaoId,
      rodadaAtiva: rodada,
      podeJogar: !!rodada,
      restricaoCadastroAtiva: restricaoCadastroAtiva(),
    };
  });

  app.post<{ Params: { id: string } }>(
    "/api/jogadores/:id/logout",
    async (req, reply) => {
      const jogador = buscarJogadorPorId(req.params.id);
      if (!jogador) {
        return reply.status(404).send({ erro: "Jogador não encontrado" });
      }
      marcarJogadorInativo(jogador.id);
      return { ok: true };
    },
  );

  app.get<{ Params: { id: string } }>("/api/jogadores/:id", async (req, reply) => {
    const row = buscarJogadorPorId(req.params.id);
    if (!row) return reply.status(404).send({ erro: "Jogador não encontrado" });

    const pontuacoes = pontuacoesDoJogador(req.params.id);
    const totalGlobal = totalDoJogador(req.params.id);
    const totalRodada = totalRodadaJogador(req.params.id);
    const rodada = getRodadaAtiva();

    return {
      jogador: {
        ...row,
        conquistas: JSON.parse(row.conquistas || "[]"),
      },
      pontuacoes,
      total: totalGlobal,
      totalGlobal,
      totalRodada,
      rodadaAtiva: rodada,
    };
  });

  app.post<{ Params: { id: string }; Body: { avatar: string | null } }>(
    "/api/jogadores/:id/avatar",
    async (req, reply) => {
      const jogador = buscarJogadorPorId(req.params.id);
      if (!jogador) {
        return reply.status(404).send({ erro: "Jogador não encontrado" });
      }
      atualizarAvatarJogador(jogador.id, req.body.avatar);
      return { ok: true, avatar: req.body.avatar };
    }
  );

  app.post<{ Body: { jogadorId: string; minigameId: string } }>(
    "/api/partidas/iniciar",
    async (req, reply) => {
      const { jogadorId, minigameId } = req.body;
      if (!jogadorId || !minigameId) {
        return reply.status(400).send({ erro: "jogadorId e minigameId são obrigatórios" });
      }

      const rodada = getRodadaAtiva();
      if (!rodada) {
        return reply.status(403).send({
          erro: "Apresentação não iniciada. Aguarde o professor liberar os desafios.",
        });
      }

      if (rodada.minigames_permitidos) {
        try {
          const permitidos = JSON.parse(rodada.minigames_permitidos) as string[];
          if (Array.isArray(permitidos) && permitidos.length > 0 && !permitidos.includes(minigameId)) {
            return reply.status(403).send({
              erro: "Este minigame não está permitido nesta rodada.",
            });
          }
        } catch {}
      }

      const jogador = buscarJogadorPorId(jogadorId);
      if (!jogador) {
        return reply.status(404).send({ erro: "Jogador não encontrado" });
      }

      const tokenSeguranca = crypto.randomBytes(32).toString("hex");
      const partidaId = iniciarPartidaAtiva(jogadorId, minigameId, tokenSeguranca);

      return {
        ok: true,
        partidaId,
        tokenSeguranca,
      };
    }
  );

  app.post<{ Body: unknown }>("/api/pontuacoes", async (req, reply) => {
    const parsed = enviarPontuacaoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: parsed.error.flatten() });
    }

    const rodada = getRodadaAtiva();
    if (!rodada) {
      return reply.status(403).send({
        erro: "Apresentação não iniciada. Aguarde o professor liberar os desafios.",
      });
    }

    const jogador = buscarJogadorPorId(parsed.data.jogadorId);
    if (!jogador) {
      return reply.status(404).send({ erro: "Jogador não encontrado" });
    }

    // Validação da Sessão de Partida ativa no Servidor
    const partida = buscarPartidaAtiva(parsed.data.partidaId);
    if (!partida) {
      return reply.status(400).send({ erro: "Sessão de partida inválida ou já finalizada." });
    }

    if (
      partida.jogador_id !== parsed.data.jogadorId ||
      partida.minigame_id !== parsed.data.minigameId
    ) {
      removerPartidaAtiva(parsed.data.partidaId);
      return reply.status(400).send({ erro: "Inconsistência nos dados da sessão de partida." });
    }

    if (partida.token_seguranca !== parsed.data.tokenSeguranca) {
      removerPartidaAtiva(parsed.data.partidaId);
      return reply.status(400).send({ erro: "Token de segurança inválido." });
    }

    const tempoRealMs = Date.now() - partida.inicio_ms;
    removerPartidaAtiva(parsed.data.partidaId);

    if (parsed.data.anulado) {
      registrarEvento(
        "partida_anulada",
        { minigameId: parsed.data.minigameId, motivo: "anti_trapaca" },
        parsed.data.jogadorId,
      );
      return {
        aceito: false,
        anulado: true,
        mensagem: "Desafio anulado por sair da página ou trocar de aba.",
        totalGlobal: totalDoJogador(parsed.data.jogadorId),
        totalRodada: totalRodadaJogador(parsed.data.jogadorId),
      };
    }

    // Anti-trapaça por tempo de jogo forjado
    if (tempoRealMs < parsed.data.duracaoMs - 5000) {
      return reply.status(400).send({
        erro: "Trapaça detectada: tempo de jogo no servidor menor do que o enviado.",
      });
    }

    const validacao = validarPontuacao(parsed.data);
    if (!validacao.ok) {
      return reply.status(400).send({ erro: validacao.motivo });
    }

    const metadata = parsed.data.metadata
      ? JSON.stringify(parsed.data.metadata)
      : null;

    inserirHistoricoPartida(
      parsed.data.jogadorId,
      parsed.data.minigameId,
      validacao.pontos,
      parsed.data.duracaoMs,
      metadata,
    );

    salvarPartidaGlobal(
      parsed.data.jogadorId,
      parsed.data.minigameId,
      validacao.pontos,
      parsed.data.duracaoMs,
      metadata,
    );

    let contabilizadoRodada = false;
    if (rodada) {
      salvarPontuacaoRodada(
        rodada.id,
        parsed.data.jogadorId,
        parsed.data.minigameId,
        validacao.pontos,
        parsed.data.duracaoMs,
        metadata,
      );
      contabilizadoRodada = true;
    }

    const temBonus = Math.random() < 0.25;
    const xpBase = validacao.pontos;
    const xpGanha = temBonus ? xpBase * 2 : xpBase;
    const xpResult = adicionarXpJogador(parsed.data.jogadorId, xpGanha);

    atualizarAcessoJogador(parsed.data.jogadorId);

    emitirEventoRealtime("ranking_atualizado");

    return {
      aceito: true,
      pontos: validacao.pontos,
      totalGlobal: totalDoJogador(parsed.data.jogadorId),
      totalRodada: totalRodadaJogador(parsed.data.jogadorId),
      contabilizadoRodada,
      rodadaAtiva: rodada,
      xpGanha,
      temBonus,
      novoXp: xpResult.novoXp,
      novoNivel: xpResult.novoNivel,
      conquistasDesbloqueadas: xpResult.conquistasDesbloqueadas,
    };
  });

  app.get<{ Querystring: { limite?: string } }>("/api/ranking/global", async (req) => {
    const limite = Math.min(100, Math.max(3, Number(req.query.limite) || 20));
    const ranking = rankingGlobal(limite);
    return { tipo: "global", ranking, atualizadoEm: new Date().toISOString() };
  });

  app.get<{ Querystring: { limite?: string } }>("/api/ranking/rodada", async (req) => {
    const limite = Math.min(100, Math.max(3, Number(req.query.limite) || 20));
    const { rodada, ranking } = rankingRodada(limite);
    return {
      tipo: "rodada",
      rodada,
      ranking,
      ativa: !!rodada && getRodadaAtiva()?.id === rodada?.id,
      atualizadoEm: new Date().toISOString(),
    };
  });

  app.get("/api/ranking/turmas", async () => {
    const ranking = rankingTurmas();
    return { tipo: "turmas", ranking, atualizadoEm: new Date().toISOString() };
  });

  /** Compatibilidade */
  app.get<{ Querystring: { limite?: string } }>("/api/ranking", async (req) => {
    const limite = Math.min(100, Math.max(3, Number(req.query.limite) || 20));
    const ranking = rankingGlobal(limite);
    return { ranking, atualizadoEm: new Date().toISOString() };
  });

  app.get("/api/admin/status", async (req) => ({
    adminAtivo: true,
    autenticado: isAdminRequest(req),
    senhaPadraoLocal: !process.env.DDM_ADMIN_TOKEN,
    rodadaAtiva: getRodadaAtiva(),
  }));

  app.get("/api/admin/stats", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }

    const info = getDbInfo();
    const rankingGlobalTop = rankingGlobal(10);
    const { rodada, ranking: rankingRodadaTop } = rankingRodada(10);
    const rankingTurmasTop = rankingTurmas();

    const ativosRow = db.prepare(`SELECT COUNT(*) AS n FROM jogadores WHERE ativo = 1`).get() as { n: number };

    return {
      banco: info.caminho,
      jogadores: info.contagens.jogadores,
      jogadoresAtivos: ativosRow.n,
      partidas: info.contagens.historico_partidas,
      sessoes: info.contagens.sessoes,
      eventos: info.contagens.eventos,
      rodadas: info.contagens.rodadas,
      rodadaAtiva: getRodadaAtiva(),
      rankingGlobal: rankingGlobalTop,
      rankingRodada: rankingRodadaTop,
      rankingTurmas: rankingTurmasTop,
      rodada,
      atualizadoEm: new Date().toISOString(),
    };
  });

  app.get("/api/admin/jogadores", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const rodada = getRodadaAtiva();
    const rodadaId = rodada ? rodada.id : "";
    const query = `
      SELECT
        j.id,
        j.apelido,
        j.turma,
        j.ativo,
        j.banido,
        j.xp,
        j.conquistas,
        j.avatar,
        COALESCE((SELECT SUM(pontos) FROM pontuacoes WHERE jogador_id = j.id), 0) AS total_global,
        COALESCE((SELECT SUM(pontos) FROM pontuacoes_rodada WHERE jogador_id = j.id AND rodada_id = ?), 0) AS total_rodada
      FROM jogadores j
      ORDER BY j.apelido COLLATE NOCASE
    `;
    const rows = db.prepare(query).all(rodadaId);
    return { jogadores: rows };
  });

  app.post<{ Params: { id: string }; Body: { banido: boolean } }>(
    "/api/admin/jogadores/:id/banir",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      const { banido } = req.body;
      const banValue = banido ? 1 : 0;
      
      db.prepare(`UPDATE jogadores SET banido = ?, ativo = 0 WHERE id = ?`).run(banValue, req.params.id);
      
      if (banValue === 1) {
        encerrarSessoesAbertas(req.params.id);
        db.prepare(`DELETE FROM partidas_ativas WHERE jogador_id = ?`).run(req.params.id);
        emitirEventoRealtime("jogador_desconectado", { jogadorId: req.params.id });
      }

      registrarEvento(banido ? "admin_banir_jogador" : "admin_desbanir_jogador", {}, req.params.id);
      
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      
      return { ok: true, banido };
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/jogadores/:id/expulsar",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      db.prepare(`UPDATE jogadores SET ativo = 0 WHERE id = ?`).run(req.params.id);
      encerrarSessoesAbertas(req.params.id);
      db.prepare(`DELETE FROM partidas_ativas WHERE jogador_id = ?`).run(req.params.id);
      registrarEvento("admin_expulsar_jogador", {}, req.params.id);
      
      emitirEventoRealtime("jogador_desconectado", { jogadorId: req.params.id });
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      
      return { ok: true };
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/api/admin/jogadores/:id",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      
      emitirEventoRealtime("jogador_desconectado", { jogadorId: req.params.id });
      
      db.prepare(`DELETE FROM jogadores WHERE id = ?`).run(req.params.id);
      db.prepare(`DELETE FROM eventos WHERE jogador_id = ?`).run(req.params.id);
      
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      
      return { ok: true, mensagem: "Jogador e todos os seus dados foram excluídos." };
    }
  );

  app.post<{
    Params: { id: string };
    Body: {
      operacao: "adicionar" | "subtrair" | "definir";
      minigameId: string;
      pontos: number;
    };
  }>(
    "/api/admin/jogadores/:id/pontos",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      const { operacao, minigameId, pontos } = req.body;
      const jogadorId = req.params.id;
      const minigame = minigameId || "admin-ajuste";

      if (typeof pontos !== "number" || pontos < 0) {
        return reply.status(400).send({ erro: "pontos deve ser um número positivo" });
      }

      const rowGlobal = db.prepare(`SELECT pontos FROM pontuacoes WHERE jogador_id = ? AND minigame_id = ?`).get(jogadorId, minigame) as { pontos: number } | undefined;
      const currentGlobal = rowGlobal ? rowGlobal.pontos : 0;
      let newGlobal = 0;
      if (operacao === "adicionar") {
        newGlobal = currentGlobal + pontos;
      } else if (operacao === "subtrair") {
        newGlobal = Math.max(0, currentGlobal - pontos);
      } else if (operacao === "definir") {
        newGlobal = pontos;
      }

      db.prepare(`
        INSERT INTO pontuacoes (jogador_id, minigame_id, pontos, duracao_ms, metadata, atualizado_em)
        VALUES (?, ?, ?, 0, 'Ajuste administrativo', datetime('now'))
        ON CONFLICT(jogador_id, minigame_id) DO UPDATE SET
          pontos = excluded.pontos,
          atualizado_em = datetime('now')
      `).run(jogadorId, minigame, newGlobal);

      const rodada = getRodadaAtiva();
      let newRodada: number | null = null;
      if (rodada) {
        const rowRodada = db.prepare(`SELECT pontos FROM pontuacoes_rodada WHERE rodada_id = ? AND jogador_id = ? AND minigame_id = ?`).get(rodada.id, jogadorId, minigame) as { pontos: number } | undefined;
        const currentRodada = rowRodada ? rowRodada.pontos : 0;
        if (operacao === "adicionar") {
          newRodada = currentRodada + pontos;
        } else if (operacao === "subtrair") {
          newRodada = Math.max(0, currentRodada - pontos);
        } else if (operacao === "definir") {
          newRodada = pontos;
        }

        db.prepare(`
          INSERT INTO pontuacoes_rodada (rodada_id, jogador_id, minigame_id, pontos, duracao_ms, metadata, atualizado_em)
          VALUES (?, ?, ?, ?, 0, 'Ajuste administrativo', datetime('now'))
          ON CONFLICT(rodada_id, jogador_id, minigame_id) DO UPDATE SET
            pontos = excluded.pontos,
            atualizado_em = datetime('now')
        `).run(rodada.id, jogadorId, minigame, newRodada);
      }

      registrarEvento("admin_ajuste_pontos", {
        jogadorId,
        minigameId: minigame,
        operacao,
        pontos,
        novoValorGlobal: newGlobal,
        novoValorRodada: newRodada
      }, jogadorId);

      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      
      return { ok: true, novoValorGlobal: newGlobal, novoValorRodada: newRodada };
    }
  );

  app.post<{ Params: { id: string }; Body: { xp: number } }>(
    "/api/admin/jogadores/:id/xp",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      const { xp } = req.body;
      if (typeof xp !== "number" || xp < 0) {
        return reply.status(400).send({ erro: "XP deve ser um número positivo" });
      }
      atualizarXpJogador(req.params.id, xp);
      const jogador = buscarJogadorPorId(req.params.id)!;
      emitirEventoRealtime("ranking_atualizado");
      return { ok: true, xp, conquistas: JSON.parse(jogador.conquistas || "[]") };
    }
  );

  app.post<{ Params: { id: string }; Body: { conquistas: string[] } }>(
    "/api/admin/jogadores/:id/conquistas",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      const { conquistas } = req.body;
      if (!Array.isArray(conquistas)) {
        return reply.status(400).send({ erro: "Conquistas deve ser um array de strings" });
      }
      atualizarConquistasJogador(req.params.id, conquistas);
      emitirEventoRealtime("ranking_atualizado");
      return { ok: true, conquistas };
    }
  );

  app.post<{ Body: { titulo?: string; minigames?: string[] } }>("/api/admin/rodada/iniciar", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const rodada = iniciarRodada(req.body?.titulo, req.body?.minigames);
    emitirEventoRealtime("rodada_atualizada");
    emitirEventoRealtime("ranking_atualizado");
    return {
      ok: true,
      mensagem: `Apresentação #${rodada.numero} iniciada. Pontos vão para o ranking temporário.`,
      rodada,
    };
  });

  app.post("/api/admin/rodada/encerrar", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const res = encerrarRodadaAtiva();
    if (!res.ok) return reply.status(400).send({ erro: res.mensagem });
    emitirEventoRealtime("rodada_atualizada");
    emitirEventoRealtime("ranking_atualizado");
    return res;
  });

  app.post("/api/admin/reset/global", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    zerarRankingGlobal();
    emitirEventoRealtime("ranking_atualizado");
    return { ok: true, mensagem: "Ranking global zerado (jogadores mantidos)" };
  });

  app.post("/api/admin/reset/rodada", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const res = zerarRankingRodadaAtiva();
    if (!res.ok) return reply.status(400).send({ erro: res.mensagem });
    emitirEventoRealtime("ranking_atualizado");
    emitirEventoRealtime("rodada_atualizada");
    return res;
  });

  app.post("/api/admin/reset", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    zerarBancoEvento();
    emitirEventoRealtime("ranking_atualizado");
    emitirEventoRealtime("rodada_atualizada");
    return { ok: true, mensagem: "Todos os dados foram apagados (global + temporário)" };
  });

  app.post("/api/admin/reset/contadores", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    
    db.exec(`
      DELETE FROM pontuacoes_rodada;
      DELETE FROM rodadas;
      DELETE FROM historico_partidas;
      DELETE FROM partidas_ativas;
      DELETE FROM pontuacoes;
      DELETE FROM sessoes;
      DELETE FROM eventos;
      UPDATE jogadores SET ativo = 0;
    `);
    
    registrarEvento("admin_reset_contadores", {});
    
    emitirEventoRealtime("jogador_desconectado", { jogadorId: "all" });
    emitirEventoRealtime("ranking_atualizado");
    emitirEventoRealtime("rodada_atualizada");
    
    return { ok: true, mensagem: "Contadores, histórico, pontuações e eventos foram zerados. Todos os jogadores deslogados." };
  });

  app.get("/api/admin/export", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }

    const { db } = await import("./db/index.js");
    const rankingG = rankingGlobal(500);
    const { rodada, ranking: rankingR } = rankingRodada(500);
    const historico = db
      .prepare(
        `SELECT h.id, h.minigame_id, h.pontos, h.duracao_ms, h.criado_em,
                j.apelido, j.turma
         FROM historico_partidas h
         JOIN jogadores j ON j.id = h.jogador_id
         ORDER BY h.criado_em DESC LIMIT 1000`,
      )
      .all();
    const rodadas = db.prepare(`SELECT * FROM rodadas ORDER BY numero DESC`).all();
    const eventos = db
      .prepare(`SELECT id, tipo, jogador_id, detalhes, criado_em FROM eventos ORDER BY criado_em DESC LIMIT 500`)
      .all();

    return {
      exportadoEm: new Date().toISOString(),
      banco: getDbInfo().caminho,
      rankingGlobal: rankingG,
      rankingRodada: rankingR,
      rodadaAtiva: rodada,
      rodadas,
      historico,
      eventos,
      cadastro: listarCadastro(),
      restricaoCadastroAtiva: restricaoCadastroAtiva(),
    };
  });

  app.get("/api/admin/cadastro", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    return {
      restricaoAtiva: restricaoCadastroAtiva(),
      pessoas: listarCadastro(),
    };
  });

  app.post<{ Body: unknown }>("/api/admin/cadastro", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const parsed = cadastroPessoaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: parsed.error.flatten() });
    }
    try {
      const id = adicionarCadastro(
        parsed.data.nome,
        parsed.data.ehProfessor ? null : (parsed.data.turma ?? null),
        parsed.data.ehProfessor ?? false,
      );
      emitirEventoRealtime("cadastro_atualizado");
      return { ok: true, id };
    } catch {
      return reply.status(409).send({ erro: "Nome já cadastrado" });
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/api/admin/cadastro/:id",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      removerCadastro(req.params.id);
      emitirEventoRealtime("cadastro_atualizado");
      return { ok: true };
    },
  );

  app.patch<{ Params: { id: string }; Body: { ativo?: boolean } }>(
    "/api/admin/cadastro/:id",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      if (typeof req.body?.ativo === "boolean") {
        toggleCadastroAtivo(req.params.id, req.body.ativo);
      }
      emitirEventoRealtime("cadastro_atualizado");
      return { ok: true };
    },
  );

  app.post<{ Body: { ativa?: boolean } }>(
    "/api/admin/cadastro/restricao",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }
      setRestricaoCadastro(!!req.body?.ativa);
      emitirEventoRealtime("cadastro_atualizado");
      return {
        ok: true,
        restricaoAtiva: restricaoCadastroAtiva(),
      };
    },
  );

  app.post<{ Body: { mensagem: string; adminName: string } }>(
    "/api/admin/chatbot/conversar",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }

      const { mensagem, adminName } = req.body;
      if (!mensagem || !adminName) {
        return reply.status(400).send({ erro: "mensagem e adminName são obrigatórios" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        let fallbackMsg = "Chave GEMINI_API_KEY não configurada no arquivo .env. ";
        let cmd: string | null = null;
        const msgLower = mensagem.toLowerCase().trim();

        if (msgLower.includes("iniciar") || msgLower.includes("começar")) {
          fallbackMsg += "Mas identifiquei que você quer iniciar a rodada. Executando comando...";
          cmd = "iniciar rodada";
        } else if (msgLower.includes("encerrar") || msgLower.includes("parar")) {
          fallbackMsg += "Mas identifiquei que você quer encerrar a rodada. Executando comando...";
          cmd = "encerrar rodada";
        } else if (msgLower.includes("limpar") || msgLower.includes("reset")) {
          fallbackMsg += "Mas identifiquei que você quer resetar a rodada. Executando comando...";
          cmd = "limpar rodada";
        } else if (msgLower.includes("status")) {
          fallbackMsg += "Mas identifiquei que você quer ver o status. Executando comando...";
          cmd = "status";
        } else if (msgLower.includes("backup") || msgLower.includes("exportar")) {
          fallbackMsg += "Mas identifiquei que você quer fazer backup. Executando comando...";
          cmd = "exportar";
        } else if (msgLower.includes("zerar tudo") || msgLower.includes("reset total")) {
          fallbackMsg += "Mas identifiquei que você quer apagar tudo. Executando comando...";
          cmd = "zerar tudo";
        } else if (msgLower.startsWith("banir ")) {
          const target = mensagem.substring(6).trim();
          cmd = `banir: ${target}`;
          fallbackMsg += `Mas identifiquei que você quer banir o jogador "${target}". Executando...`;
        } else if (msgLower.startsWith("desbanir ")) {
          const target = mensagem.substring(9).trim();
          cmd = `desbanir: ${target}`;
          fallbackMsg += `Mas identifiquei que você quer desbanir o jogador "${target}". Executando...`;
        } else if (msgLower.startsWith("expulsar ")) {
          const target = mensagem.substring(9).trim();
          cmd = `expulsar: ${target}`;
          fallbackMsg += `Mas identifiquei que você quer expulsar o jogador "${target}". Executando...`;
        } else if (msgLower.includes("ponto") || msgLower.includes("pontos") || msgLower.includes("pontuação")) {
          const matchAdd = msgLower.match(/(?:dar|adicionar|soma[r]?)\s+(\d+)\s+ponto[s]?\s+(?:para|a[o]?)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)/i);
          const matchSub = msgLower.match(/(?:tirar|remover|subtrair|retirar)\s+(\d+)\s+ponto[s]?\s+(?:de|do|da)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)/i);
          const matchDef = msgLower.match(/(?:definir|setar)\s+ponto[s]?\s+(?:de|do|da)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)\s+(?:para|em)\s+(\d+)/i);
          if (matchAdd) {
            cmd = `pontos: ${matchAdd[2].trim()} | adicionar | ${matchAdd[1]} | admin-ajuste`;
            fallbackMsg += `Mas identifiquei que você quer adicionar ${matchAdd[1]} pontos para ${matchAdd[2].trim()}. Executando...`;
          } else if (matchSub) {
            cmd = `pontos: ${matchSub[2].trim()} | subtrair | ${matchSub[1]} | admin-ajuste`;
            fallbackMsg += `Mas identifiquei que você quer subtrair ${matchSub[1]} pontos de ${matchSub[2].trim()}. Executando...`;
          } else if (matchDef) {
            cmd = `pontos: ${matchDef[1].trim()} | definir | ${matchDef[2]} | admin-ajuste`;
            fallbackMsg += `Mas identifiquei que você quer definir os pontos de ${matchDef[1].trim()} para ${matchDef[2]}. Executando...`;
          } else {
            fallbackMsg += "Dica: adicione GEMINI_API_KEY=sua_chave no arquivo .env para habilitar a conversa livre com o assistente!";
          }
        } else {
          fallbackMsg += "Dica: adicione GEMINI_API_KEY=sua_chave no arquivo .env para habilitar a conversa livre com o assistente!";
        }

        if (cmd) {
          await executarComandoAdministrativo(cmd);
        }

        return {
          resposta: fallbackMsg,
          comando: cmd,
        };
      }

      try {
        const systemInstruction = `
          Você é o assistente administrativo inteligente EuclidesAI do site 'Euclides Test' (uma arena de minigames de matemática escolar).
          Você está conversando com o administrador ${adminName}. A senha de segurança admin foi fornecida com sucesso.
          
          Você deve responder em formato JSON estrito, contendo exatamente dois campos: "resposta" (string) e "comando" (string ou null).
          
          Seu objetivo é:
          1. Conversar de forma inteligente, responder a dúvidas gerais, piadas, matemática, etc. mantendo a personalidade de ${adminName} de forma carismática.
          2. Controlar o site traduzindo a intenção do usuário em um comando específico no campo "comando" quando apropriado.
          
          Personalidades dos administradores para você emular/adicionar no diálogo:
          - Plinyl: Desenvolvedor, focado em código, backend, latência de rede e status da API. Gosta de piadas de programador.
          - Alisson: Organizador de eventos, focado no público, no projetor, engajamento e nos 20 PCs dos alunos.
          - Rikelmy: Game designer, focado no equilíbrio matemático, pontuações dos minigames (como Geometry Memory) e diversão.
          - Lucas: Focado na secretaria do evento, controle de cadastros, apelidos de alunos na arena e turmas.
          - Marcelo: Focado em infraestrutura, integridade do banco SQLite, logs e prevenção de trapaça (anti-cheat).
          
          Mapeamento de Comandos (campo "comando"):
          - "iniciar rodada": se o usuário pedir para iniciar a rodada, começar a apresentação, abrir arena, liberar jogos, etc.
          - "encerrar rodada": se pedir para encerrar rodada, parar apresentação, fechar a arena, etc.
          - "limpar rodada": se pedir para zerar o ranking temporário, limpar rodada atual, resetar apresentação, etc.
          - "status": se pedir status do servidor, estatísticas, como os alunos estão indo, etc.
          - "exportar": se pedir backup, exportar dados, baixar banco de dados, etc.
          - "zerar tudo": se pedir para zerar tudo, reset total, apagar banco de dados, limpar histórico total.
          - "banir: <nome_ou_id>": se pedir para banir um jogador (ex: "banir joao" -> "banir: joao").
          - "desbanir: <nome_ou_id>": se pedir para desbanir um jogador (ex: "desbanir mateus" -> "desbanir: mateus").
          - "expulsar: <nome_ou_id>": se pedir para expulsar ou deslogar um jogador (ex: "expulsar pedro" -> "expulsar: pedro").
          - "pontos: <nome_ou_id> | <operacao> | <pontos_number> | <minigame_id>": se pedir para dar, tirar ou definir pontos de um jogador.
             Onde <operacao> deve ser: "adicionar", "subtrair" ou "definir".
             Onde <pontos_number> deve ser um número inteiro positivo.
             Onde <minigame_id> deve ser um ID de minigame do catálogo (ex: "operacoes-rapidas", "quiz-euclides", "fracoes-puzzle", "geometria-memoria", "sequencia-logica", "graficos-coordenadas", "probabilidade-sorteador") ou "admin-ajuste" se não for especificado nenhum minigame.
             Exemplo 1: "dar 50 pontos para joao" -> "pontos: joao | adicionar | 50 | admin-ajuste"
             Exemplo 2: "retirar 20 pontos de maria no quiz de euclides" -> "pontos: maria | subtrair | 20 | quiz-euclides"
             Exemplo 3: "definir a pontuação de pedro para 100 no Quebra-Cabeça de Frações" -> "pontos: pedro | definir | 100 | fracoes-puzzle"
          - null: para qualquer conversa amigável, explicação matemática, ajuda, piadas ou dúvidas sem intenção clara de controle.
          
          Exemplo de resposta JSON:
          {
            "resposta": "Entendido Plinyl! O código está pronto e vou iniciar a rodada agora mesmo.",
            "comando": "iniciar rodada"
          }
          Importante: Retorne APENAS o JSON, sem blocos de código markdown (\`\`\`json ... \`\`\`).
        `;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemInstruction },
                    { text: `Mensagem do Administrador ${adminName}: "${mensagem}"` }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API retornou HTTP ${response.status}`);
        }

        const data: any = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
          throw new Error("Resposta da API do Gemini vazia");
        }

        const parsed = JSON.parse(extrairJsonLimpo(textResponse));
        
        let respostaExecucao = "";
        if (parsed.comando) {
          const resCmd = await executarComandoAdministrativo(parsed.comando);
          respostaExecucao = `\n\n🤖 [Ação Executada] ${resCmd.mensagem}`;
        }

        return {
          resposta: (parsed.resposta || "Desculpe, não entendi.") + respostaExecucao,
          comando: parsed.comando || null,
        };
      } catch (err: any) {
        return {
          resposta: `Erro ao chamar o Gemini: ${err.message}. Verifique sua conexão ou se a chave GEMINI_API_KEY no .env é válida.`,
          comando: null,
        };
      }
    }
  );

  app.get<{ Params: { id: string } }>("/api/jogadores/solicitacao/:id/status", async (req, reply) => {
    const sol = solicitacoesProfessores.get(req.params.id);
    if (!sol) {
      return reply.status(404).send({ erro: "Solicitação não encontrada" });
    }
    return {
      status: sol.status,
      loginData: sol.loginData ?? null,
    };
  });

  app.get("/api/admin/professores/pendentes", async (req, reply) => {
    if (!isAdminRequest(req)) {
      return reply.status(401).send({ erro: "Senha de professor incorreta" });
    }
    const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
    return { solicitacoes: list };
  });

  async function decidirSolicitacaoProfessor(solicitacaoId: string, aprovar: boolean) {
    const sol = solicitacoesProfessores.get(solicitacaoId);
    if (!sol) {
      throw new Error("Solicitação não encontrada");
    }

    if (aprovar) {
      let jogador = buscarJogadorPorApelido(sol.apelido);
      if (jogador) {
        atualizarAcessoJogador(jogador.id);
        atualizarTurmaJogador(jogador.id, "Professor");
        registrarEvento("jogador_login", { apelido: sol.apelido }, jogador.id);
      } else {
        try {
          const criado = criarJogador(sol.apelido, "Professor");
          jogador = {
            id: criado.id,
            apelido: criado.apelido,
            turma: criado.turma ?? null,
            ativo: 1,
            banido: 0,
            xp: 0,
            conquistas: "[]",
            avatar: null,
          };
        } catch {
          throw new Error("Não foi possível criar o jogador professor");
        }
      }

      if (!jogador) {
        throw new Error("Erro ao inicializar o jogador professor");
      }

      const sessaoId = iniciarSessao(jogador.id, sol.userAgent);
      const rodada = getRodadaAtiva();

      sol.status = "aprovado";
      sol.loginData = {
        jogador: {
          id: jogador.id,
          apelido: jogador.apelido,
          turma: "Professor",
          souProfessor: true,
        },
        sessaoId,
        rodadaAtiva: rodada,
        podeJogar: !!rodada,
        restricaoCadastroAtiva: restricaoCadastroAtiva(),
      };
    } else {
      sol.status = "rejeitado";
    }

    emitirEventoRealtime("solicitacao_decidida", { id: sol.id, status: sol.status });
    return sol;
  }

  app.post<{ Params: { id: string }; Body: { aprovar: boolean } }>(
    "/api/admin/professores/:id/decidir",
    async (req, reply) => {
      if (!isAdminRequest(req)) {
        return reply.status(401).send({ erro: "Senha de professor incorreta" });
      }

      try {
        const { aprovar } = req.body;
        await decidirSolicitacaoProfessor(req.params.id, aprovar);
        return { ok: true };
      } catch (err: any) {
        const status = err.message.includes("Não foi possível") ? 409 : 404;
        return reply.status(status).send({ erro: err.message });
      }
    }
  );

  // Helper para enviar mensagens via WhatsApp
  async function enviarMensagemWhatsApp(numero: string, texto: string) {
    const provider = process.env.WHATSAPP_PROVIDER;
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN;

    if (!provider || (provider !== "twilio" && !apiUrl)) {
      console.log(`[WhatsApp Mock] Para: ${numero} | Mensagem: ${texto}`);
      return;
    }

    try {
      if (provider === "evolution") {
        await fetch(apiUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": token || ""
          },
          body: JSON.stringify({
            number: numero,
            text: texto
          })
        });
      } else if (provider === "twilio") {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        if (accountSid && authToken && twilioNumber) {
          const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const bodyParams = new URLSearchParams();
          bodyParams.append("To", `whatsapp:${numero}`);
          bodyParams.append("From", twilioNumber);
          bodyParams.append("Body", texto);

          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: bodyParams
          });
          const resJson = await res.json().catch(() => ({}));
          console.log(`[Twilio API Response] Status: ${res.status}`, resJson);
        }
      } else if (provider === "zapi") {
        await fetch(apiUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Client-Token": token || ""
          },
          body: JSON.stringify({
            phone: numero,
            message: texto
          })
        });
      } else {
        await fetch(apiUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            to: numero,
            message: texto
          })
        });
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem via WhatsApp:", err);
    }
  }

  function encontrarJogadorPorApelidoOuId(target: string) {
    let jogador = buscarJogadorPorId(target);
    if (!jogador) {
      jogador = buscarJogadorPorApelido(target);
    }
    if (!jogador) {
      jogador = db.prepare(`SELECT id, apelido, turma, ativo, banido FROM jogadores WHERE id = ? OR apelido = ? COLLATE NOCASE`).get(target, target) as any;
    }
    return jogador;
  }

  async function executarComandoAdministrativo(cmd: string): Promise<{ ok: boolean; mensagem: string }> {
    const cmdLower = cmd.toLowerCase().trim();
    
    if (cmdLower === "iniciar rodada") {
      const res = iniciarRodada("Apresentação via IA");
      emitirEventoRealtime("rodada_atualizada");
      emitirEventoRealtime("ranking_atualizado");
      return { ok: true, mensagem: `Apresentação #${res.numero} iniciada com sucesso!` };
    }
    
    if (cmdLower === "encerrar rodada") {
      const res = encerrarRodadaAtiva();
      if (!res.ok) return { ok: false, mensagem: res.mensagem };
      emitirEventoRealtime("rodada_atualizada");
      emitirEventoRealtime("ranking_atualizado");
      return { ok: true, mensagem: "Rodada encerrada e ranking temporário zerado!" };
    }
    
    if (cmdLower === "limpar rodada") {
      const res = zerarRankingRodadaAtiva();
      if (!res.ok) return { ok: false, mensagem: res.mensagem };
      emitirEventoRealtime("ranking_atualizado");
      return { ok: true, mensagem: "Ranking da rodada ativa zerado!" };
    }
    
    if (cmdLower === "zerar tudo") {
      zerarBancoEvento();
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      return { ok: true, mensagem: "Banco de dados totalmente resetado!" };
    }
    
    if (cmdLower.startsWith("banir:")) {
      const target = cmd.substring(6).trim();
      const jogador = encontrarJogadorPorApelidoOuId(target);
      if (!jogador) {
        return { ok: false, mensagem: `Jogador "${target}" não encontrado.` };
      }
      db.prepare(`UPDATE jogadores SET banido = 1, ativo = 0 WHERE id = ?`).run(jogador.id);
      encerrarSessoesAbertas(jogador.id);
      db.prepare(`DELETE FROM partidas_ativas WHERE jogador_id = ?`).run(jogador.id);
      emitirEventoRealtime("jogador_desconectado", { jogadorId: jogador.id });
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      registrarEvento("admin_banir_jogador", {}, jogador.id);
      return { ok: true, mensagem: `Jogador ${jogador.apelido} banido com sucesso!` };
    }
    
    if (cmdLower.startsWith("desbanir:")) {
      const target = cmd.substring(9).trim();
      const jogador = encontrarJogadorPorApelidoOuId(target);
      if (!jogador) {
        return { ok: false, mensagem: `Jogador "${target}" não encontrado.` };
      }
      db.prepare(`UPDATE jogadores SET banido = 0 WHERE id = ?`).run(jogador.id);
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      registrarEvento("admin_desbanir_jogador", {}, jogador.id);
      return { ok: true, mensagem: `Jogador ${jogador.apelido} desbanido com sucesso!` };
    }
    
    if (cmdLower.startsWith("expulsar:")) {
      const target = cmd.substring(9).trim();
      const jogador = encontrarJogadorPorApelidoOuId(target);
      if (!jogador) {
        return { ok: false, mensagem: `Jogador "${target}" não encontrado.` };
      }
      db.prepare(`UPDATE jogadores SET ativo = 0 WHERE id = ?`).run(jogador.id);
      encerrarSessoesAbertas(jogador.id);
      db.prepare(`DELETE FROM partidas_ativas WHERE jogador_id = ?`).run(jogador.id);
      emitirEventoRealtime("jogador_desconectado", { jogadorId: jogador.id });
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      registrarEvento("admin_expulsar_jogador", {}, jogador.id);
      return { ok: true, mensagem: `Jogador ${jogador.apelido} expulso com sucesso!` };
    }
    
    if (cmdLower.startsWith("pontos:")) {
      const parts = cmd.substring(7).split("|").map(p => p.trim());
      if (parts.length < 3) {
        return { ok: false, mensagem: "Formato de pontos inválido. Use: pontos: jogador | operacao | pontos | [minigame_id]" };
      }
      const target = parts[0];
      const operacao = parts[1].toLowerCase() as "adicionar" | "subtrair" | "definir";
      const valor = parseInt(parts[2], 10);
      const minigameId = parts[3] || "admin-ajuste";
      
      if (!["adicionar", "subtrair", "definir"].includes(operacao)) {
        return { ok: false, mensagem: "Operação inválida. Use adicionar, subtrair ou definir." };
      }
      if (isNaN(valor) || valor < 0) {
        return { ok: false, mensagem: "Valor de pontos deve ser um número positivo." };
      }
      
      const jogador = encontrarJogadorPorApelidoOuId(target);
      if (!jogador) {
        return { ok: false, mensagem: `Jogador "${target}" não encontrado.` };
      }
      
      const rowGlobal = db.prepare(`SELECT pontos FROM pontuacoes WHERE jogador_id = ? AND minigame_id = ?`).get(jogador.id, minigameId) as { pontos: number } | undefined;
      const currentGlobal = rowGlobal ? rowGlobal.pontos : 0;
      let newGlobal = 0;
      if (operacao === "adicionar") {
        newGlobal = currentGlobal + valor;
      } else if (operacao === "subtrair") {
        newGlobal = Math.max(0, currentGlobal - valor);
      } else if (operacao === "definir") {
        newGlobal = valor;
      }
      
      db.prepare(`
        INSERT INTO pontuacoes (jogador_id, minigame_id, pontos, duracao_ms, metadata, atualizado_em)
        VALUES (?, ?, ?, 0, 'Ajuste administrativo via chat', datetime('now'))
        ON CONFLICT(jogador_id, minigame_id) DO UPDATE SET
          pontos = excluded.pontos,
          atualizado_em = datetime('now')
      `).run(jogador.id, minigameId, newGlobal);
      
      const rodada = getRodadaAtiva();
      let newRodada: number | null = null;
      if (rodada) {
        const rowRodada = db.prepare(`SELECT pontos FROM pontuacoes_rodada WHERE rodada_id = ? AND jogador_id = ? AND minigame_id = ?`).get(rodada.id, jogador.id, minigameId) as { pontos: number } | undefined;
        const currentRodada = rowRodada ? rowRodada.pontos : 0;
        if (operacao === "adicionar") {
          newRodada = currentRodada + valor;
        } else if (operacao === "subtrair") {
          newRodada = Math.max(0, currentRodada - valor);
        } else if (operacao === "definir") {
          newRodada = valor;
        }
        
        db.prepare(`
          INSERT INTO pontuacoes_rodada (rodada_id, jogador_id, minigame_id, pontos, duracao_ms, metadata, atualizado_em)
          VALUES (?, ?, ?, ?, 0, 'Ajuste administrativo via chat', datetime('now'))
          ON CONFLICT(rodada_id, jogador_id, minigame_id) DO UPDATE SET
            pontos = excluded.pontos,
            atualizado_em = datetime('now')
        `).run(rodada.id, jogador.id, minigameId, newRodada);
      }
      
      registrarEvento("admin_ajuste_pontos", {
        jogadorId: jogador.id,
        minigameId,
        operacao,
        pontos: valor,
        novoValorGlobal: newGlobal,
        novoValorRodada: newRodada
      }, jogador.id);
      
      emitirEventoRealtime("ranking_atualizado");
      emitirEventoRealtime("rodada_atualizada");
      
      return { 
        ok: true, 
        mensagem: `Pontuação de ${jogador.apelido} ajustada! Novo global: ${newGlobal} pontos.` 
      };
    }
    
    return { ok: false, mensagem: "Comando não reconhecido" };
  }

  async function processarMensagemWhatsApp(from: string, body: string) {
    const textLower = body.toLowerCase().trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const systemInstruction = `
          Você é o assistente administrativo inteligente EuclidesAI do site 'Euclides Test' (uma arena de minigames de matemática escolar).
          Você está conversando no WhatsApp com um dos administradores autorizados (Plinyl, Alisson, Rikelmy, Lucas ou Marcelo).
          
          Você deve responder em formato JSON estrito, contendo exatamente dois campos: "resposta" (string) e "comando" (string ou null).
          
          Seu objetivo é:
          1. Conversar de forma inteligente, responder a dúvidas gerais, piadas, matemática, etc. de forma muito interativa, carismática e prestativa.
          2. Você conhece as personalidades dos criadores e pode fazer referências amigáveis a eles dependendo do assunto:
             - Plinyl: Programador nerd, focado em código, backend e latência.
             - Alisson: Focado no show, projetor, engajamento e organização física dos PCs.
             - Rikelmy: Focado em game design, pontuações, matemática e diversão.
             - Lucas: Focado em cadastros, apelidos e controle das turmas.
             - Marcelo: Focado em infraestrutura, integridade do banco de dados e prevenção de trapaças.
          3. Controlar o site traduzindo a intenção do usuário no WhatsApp em um comando específico no campo "comando" quando apropriado.
          
          Mapeamento de Comandos (campo "comando"):
          - "iniciar rodada": se o usuário pedir para iniciar a rodada, liberar jogos, abrir a arena, começar apresentação, etc.
          - "encerrar rodada": se pedir para encerrar a rodada, fechar a arena, parar apresentação, etc.
          - "limpar rodada": se pedir para zerar o ranking temporário, limpar rodada, resetar rodada, etc.
          - "status": se pedir status do servidor, estatísticas, como os alunos estão indo, etc.
          - "exportar": se pedir backup, exportar dados, salvar dados, etc.
          - "zerar tudo": se pedir reset total, apagar banco, deletar tudo.
          - "listar pendentes": se pedir para ver os professores pendentes, listar quem quer entrar, ver solicitações, etc.
          - "aprovar: <nome_ou_id>": se pedir para aprovar a entrada do professor (ex: "aprovar Mateus").
          - "rejeitar: <nome_ou_id>": se pedir para rejeitar a entrada do professor (ex: "rejeitar Mateus").
          - "banir: <nome_ou_id>": se pedir para banir um jogador (ex: "banir joao" -> "banir: joao").
          - "desbanir: <nome_ou_id>": se pedir para desbanir um jogador (ex: "desbanir mateus" -> "desbanir: mateus").
          - "expulsar: <nome_ou_id>": se pedir para expulsar ou deslogar um jogador (ex: "expulsar pedro" -> "expulsar: pedro").
          - "pontos: <nome_ou_id> | <operacao> | <pontos_number> | <minigame_id>": se pedir para dar, tirar ou definir pontos de um jogador.
             Onde <operacao> deve ser: "adicionar", "subtrair" ou "definir".
             Onde <pontos_number> deve ser um número inteiro positivo.
             Onde <minigame_id> deve ser um ID de minigame do catálogo (ex: "operacoes-rapidas", "quiz-euclides", "fracoes-puzzle", "geometria-memoria", "sequencia-logica", "graficos-coordenadas", "probabilidade-sorteador") ou "admin-ajuste" se não for especificado nenhum minigame.
             Exemplo 1: "dar 50 pontos para joao" -> "pontos: joao | adicionar | 50 | admin-ajuste"
             Exemplo 2: "retirar 20 pontos de maria no quiz de euclides" -> "pontos: maria | subtrair | 20 | quiz-euclides"
             Exemplo 3: "definir a pontuação de pedro para 100 no Quebra-Cabeça de Frações" -> "pontos: pedro | definir | 100 | fracoes-puzzle"
          - null: para qualquer conversa, dúvida de matemática, piadas ou papo amigável sem intenção clara de comando direto.
          
          Importante: Retorne APENAS o JSON, sem blocos de código markdown (\`\`\`json ... \`\`\`).
        `;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemInstruction },
                    { text: `Mensagem no WhatsApp: "${body}"` }
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const parsed = JSON.parse(extrairJsonLimpo(textResponse));
            await enviarMensagemWhatsApp(from, parsed.resposta);
            if (parsed.comando) {
              await executarComandoWhatsAppLocal(parsed.comando, from);
            }
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao chamar o Gemini no WhatsApp webhook:", err);
      }
    }

    if (textLower === "comandos" || textLower === "ajuda" || textLower === "help") {
      const helpText = `Olá! Sou o assistente EuclidesAI. Comandos de controle do site:
• *iniciar rodada*: Começar apresentação
• *encerrar rodada*: Finalizar apresentação
• *limpar rodada*: Zerar pontos da rodada
• *status*: Status do servidor e do banco
• *backup*: Informações do banco
• *zerar tudo*: Limpar base total (CUIDADO)
• *pendentes*: Listar professores aguardando aprovação
• *aprovar <nome ou ID>*: Aprovar professor
• *rejeitar <nome ou ID>*: Rejeitar professor
• *banir <jogador>*: Banir um jogador
• *desbanir <jogador>*: Desbanir um jogador
• *expulsar <jogador>*: Expulsar um jogador do sistema
• *pontos <jogador> | <operacao> | <valor> | [minigame_id]*: Ajustar pontuação`;
      await enviarMensagemWhatsApp(from, helpText);
      return;
    }

    if (textLower === "iniciar rodada" || textLower === "iniciar" || textLower === "começar") {
      try {
        const res = iniciarRodada("Apresentação via WhatsApp");
        emitirEventoRealtime("rodada_atualizada");
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `✅ Apresentação #${res.numero} iniciada com sucesso via WhatsApp!`);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao iniciar rodada: ${err.message}`);
      }
      return;
    }

    if (textLower === "encerrar rodada" || textLower === "encerrar" || textLower === "parar") {
      try {
        const res = encerrarRodadaAtiva();
        if (!res.ok) throw new Error(res.mensagem);
        emitirEventoRealtime("rodada_atualizada");
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `✅ Rodada encerrada com sucesso!`);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao encerrar: ${err.message}`);
      }
      return;
    }

    if (textLower === "limpar rodada" || textLower === "reset rodada" || textLower === "zerar rodada") {
      try {
        const res = zerarRankingRodadaAtiva();
        if (!res.ok) throw new Error(res.mensagem);
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `✅ Ranking temporário zerado com sucesso!`);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao zerar rodada: ${err.message}`);
      }
      return;
    }

    if (textLower === "status" || textLower === "servidor") {
      try {
        const info = getDbInfo();
        const rodada = getRodadaAtiva();
        const rodadaInfo = rodada
          ? `Apresentação #${rodada.numero} ativa: "${rodada.titulo}"`
          : "Nenhuma apresentação ativa no momento.";
        
        const pendentes = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente").length;
        
        const statusText = `📊 Status do Servidor Euclides Test:
• ${rodadaInfo}
• Jogadores ativos: ${info.contagens.jogadores}
• Partidas jogadas: ${info.contagens.historico_partidas}
• Caminho do banco: ${info.caminho}
• Solicitações de professores pendentes: *${pendentes}*`;
        await enviarMensagemWhatsApp(from, statusText);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao consultar status: ${err.message}`);
      }
      return;
    }

    if (textLower === "backup" || textLower === "exportar" || textLower === "salvar") {
      try {
        const info = getDbInfo();
        const statusText = `💾 Backup do SQLite operacional. Histórico de partidas íntegro.
Banco: ${info.caminho}
Para baixar o backup em JSON completo, acesse a área administrativa do site no navegador.`;
        await enviarMensagemWhatsApp(from, statusText);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro: ${err.message}`);
      }
      return;
    }

    if (textLower === "zerar tudo" || textLower === "reset total") {
      try {
        zerarBancoEvento();
        emitirEventoRealtime("ranking_atualizado");
        emitirEventoRealtime("rodada_atualizada");
        await enviarMensagemWhatsApp(from, `⚠️ ATENÇÃO: Todos os dados foram apagados via comando de WhatsApp!`);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao limpar tudo: ${err.message}`);
      }
      return;
    }

    if (textLower === "pendentes" || textLower === "professores" || textLower === "solicitacoes") {
      try {
        const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
        if (list.length === 0) {
          await enviarMensagemWhatsApp(from, "📭 Nenhuma solicitação de professor pendente no momento.");
        } else {
          let msg = "📝 *Solicitações de Professor Pendentes:*\n";
          list.forEach((sol, index) => {
            msg += `${index + 1}. Apelido: *${sol.apelido}* (ID: \`${sol.id}\`)\n`;
          });
          msg += "\nEnvie *aprovar <nome ou ID>* ou *rejeitar <nome ou ID>* para decidir.";
          await enviarMensagemWhatsApp(from, msg);
        }
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao listar pendentes: ${err.message}`);
      }
      return;
    }

    if (textLower.startsWith("aprovar ") || textLower.startsWith("aprovar")) {
      const target = body.substring(7).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Especifique o nome ou ID do professor. Ex: *aprovar João*");
        return;
      }
      try {
        let sol = solicitacoesProfessores.get(target);
        if (!sol) {
          const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
          const idx = parseInt(target, 10);
          if (!isNaN(idx) && idx > 0 && idx <= list.length) {
            sol = list[idx - 1];
          } else {
            sol = list.find((s) => s.apelido.toLowerCase() === target.toLowerCase());
          }
        }

        if (!sol) {
          await enviarMensagemWhatsApp(from, `❌ Nenhuma solicitação pendente encontrada para "${target}".`);
        } else {
          await decidirSolicitacaoProfessor(sol.id, true);
          await enviarMensagemWhatsApp(from, `✅ Professor *${sol.apelido}* aprovado com sucesso!`);
        }
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao aprovar: ${err.message}`);
      }
      return;
    }

    if (textLower.startsWith("rejeitar ") || textLower.startsWith("rejeitar")) {
      const target = body.substring(9).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Especifique o nome ou ID do professor. Ex: *rejeitar João*");
        return;
      }
      try {
        let sol = solicitacoesProfessores.get(target);
        if (!sol) {
          const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
          const idx = parseInt(target, 10);
          if (!isNaN(idx) && idx > 0 && idx <= list.length) {
            sol = list[idx - 1];
          } else {
            sol = list.find((s) => s.apelido.toLowerCase() === target.toLowerCase());
          }
        }

        if (!sol) {
          await enviarMensagemWhatsApp(from, `❌ Nenhuma solicitação pendente encontrada para "${target}".`);
        } else {
          await decidirSolicitacaoProfessor(sol.id, false);
          await enviarMensagemWhatsApp(from, `❌ Professor *${sol.apelido}* rejeitado.`);
        }
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `❌ Erro ao rejeitar: ${err.message}`);
      }
      return;
    }

    if (textLower.startsWith("banir ") || textLower.startsWith("banir")) {
      const target = body.substring(5).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Especifique o nome ou ID do jogador. Ex: *banir João*");
        return;
      }
      const res = await executarComandoAdministrativo(`banir: ${target}`);
      await enviarMensagemWhatsApp(from, res.ok ? `✅ ${res.mensagem}` : `❌ ${res.mensagem}`);
      return;
    }

    if (textLower.startsWith("desbanir ") || textLower.startsWith("desbanir")) {
      const target = body.substring(8).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Especifique o nome ou ID do jogador. Ex: *desbanir João*");
        return;
      }
      const res = await executarComandoAdministrativo(`desbanir: ${target}`);
      await enviarMensagemWhatsApp(from, res.ok ? `✅ ${res.mensagem}` : `❌ ${res.mensagem}`);
      return;
    }

    if (textLower.startsWith("expulsar ") || textLower.startsWith("expulsar")) {
      const target = body.substring(8).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Especifique o nome ou ID do jogador. Ex: *expulsar João*");
        return;
      }
      const res = await executarComandoAdministrativo(`expulsar: ${target}`);
      await enviarMensagemWhatsApp(from, res.ok ? `✅ ${res.mensagem}` : `❌ ${res.mensagem}`);
      return;
    }

    if (textLower.startsWith("pontos ") || textLower.startsWith("pontos")) {
      const target = body.substring(6).trim();
      if (!target) {
        await enviarMensagemWhatsApp(from, "❌ Use o formato: *pontos <jogador> | <operacao> | <valor> | [minigame]*");
        return;
      }
      const res = await executarComandoAdministrativo(`pontos: ${target}`);
      await enviarMensagemWhatsApp(from, res.ok ? `✅ ${res.mensagem}` : `❌ ${res.mensagem}`);
      return;
    }

    if (textLower.includes("ponto") || textLower.includes("pontos") || textLower.includes("pontuação")) {
      const matchAdd = textLower.match(/(?:dar|adicionar|soma[r]?)\s+(\d+)\s+ponto[s]?\s+(?:para|a[o]?)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)/i);
      const matchSub = textLower.match(/(?:tirar|remover|subtrair|retirar)\s+(\d+)\s+ponto[s]?\s+(?:de|do|da)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)/i);
      const matchDef = textLower.match(/(?:definir|setar)\s+ponto[s]?\s+(?:de|do|da)\s+([a-zA-Z0-9_\-\s\u00C0-\u00FF]+)\s+(?:para|em)\s+(\d+)/i);
      let cmd: string | null = null;
      if (matchAdd) {
        cmd = `pontos: ${matchAdd[2].trim()} | adicionar | ${matchAdd[1]} | admin-ajuste`;
      } else if (matchSub) {
        cmd = `pontos: ${matchSub[2].trim()} | subtrair | ${matchSub[1]} | admin-ajuste`;
      } else if (matchDef) {
        cmd = `pontos: ${matchDef[1].trim()} | definir | ${matchDef[2]} | admin-ajuste`;
      }
      if (cmd) {
        const res = await executarComandoAdministrativo(cmd);
        await enviarMensagemWhatsApp(from, res.ok ? `✅ ${res.mensagem}` : `❌ ${res.mensagem}`);
        return;
      }
    }

    await enviarMensagemWhatsApp(from, `Recebi sua mensagem: "${body}". Digite "ajuda" para ver os comandos de controle.`);
  }

  async function executarComandoWhatsAppLocal(cmd: string, from: string) {
    if (cmd === "iniciar rodada") {
      try {
        const res = iniciarRodada("Apresentação via IA WhatsApp");
        emitirEventoRealtime("rodada_atualizada");
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Rodada #${res.numero} iniciada com sucesso!`);
      } catch {}
    } else if (cmd === "encerrar rodada") {
      try {
        encerrarRodadaAtiva();
        emitirEventoRealtime("rodada_atualizada");
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Rodada encerrada com sucesso!`);
      } catch {}
    } else if (cmd === "limpar rodada") {
      try {
        zerarRankingRodadaAtiva();
        emitirEventoRealtime("ranking_atualizado");
        await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Ranking temporário limpo!`);
      } catch {}
    } else if (cmd === "status") {
      try {
        const info = getDbInfo();
        const rodada = getRodadaAtiva();
        const rodadaInfo = rodada ? `Apresentação #${rodada.numero} ativa` : "Nenhuma ativa";
        const pendentes = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente").length;
        await enviarMensagemWhatsApp(
          from,
          `🤖 [EuclidesAI] Status: ${rodadaInfo}. ${info.contagens.jogadores} jogadores. Solicitações pendentes: ${pendentes}.`
        );
      } catch {}
    } else if (cmd === "listar pendentes") {
      try {
        const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
        if (list.length === 0) {
          await enviarMensagemWhatsApp(from, "🤖 [EuclidesAI] Nenhuma solicitação de professor pendente.");
        } else {
          let msg = "🤖 [EuclidesAI] *Solicitações Pendentes:*\n";
          list.forEach((sol, index) => {
            msg += `${index + 1}. Apelido: *${sol.apelido}* (ID: \`${sol.id}\`)\n`;
          });
          await enviarMensagemWhatsApp(from, msg);
        }
      } catch {}
    } else if (cmd.startsWith("aprovar:")) {
      const target = cmd.substring(8).trim();
      try {
        let sol = solicitacoesProfessores.get(target);
        if (!sol) {
          const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
          const idx = parseInt(target, 10);
          if (!isNaN(idx) && idx > 0 && idx <= list.length) {
            sol = list[idx - 1];
          } else {
            sol = list.find((s) => s.apelido.toLowerCase() === target.toLowerCase());
          }
        }
        if (sol) {
          await decidirSolicitacaoProfessor(sol.id, true);
          await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Professor *${sol.apelido}* aprovado com sucesso!`);
        } else {
          await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Não encontrei solicitação pendente para "${target}".`);
        }
      } catch {}
    } else if (cmd.startsWith("rejeitar:")) {
      const target = cmd.substring(9).trim();
      try {
        let sol = solicitacoesProfessores.get(target);
        if (!sol) {
          const list = Array.from(solicitacoesProfessores.values()).filter((s) => s.status === "pendente");
          const idx = parseInt(target, 10);
          if (!isNaN(idx) && idx > 0 && idx <= list.length) {
            sol = list[idx - 1];
          } else {
            sol = list.find((s) => s.apelido.toLowerCase() === target.toLowerCase());
          }
        }
        if (sol) {
          await decidirSolicitacaoProfessor(sol.id, false);
          await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Professor *${sol.apelido}* rejeitado.`);
        } else {
          await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Não encontrei solicitação pendente para "${target}".`);
        }
      } catch {}
    } else {
      try {
        const res = await executarComandoAdministrativo(cmd);
        await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] ${res.mensagem}`);
      } catch (err: any) {
        await enviarMensagemWhatsApp(from, `🤖 [EuclidesAI] Erro: ${err.message}`);
      }
    }
  }

  app.get<{ Querystring: { "hub.mode"?: string; "hub.verify_token"?: string; "hub.challenge"?: string } }>(
    "/api/whatsapp/webhook",
    async (req, reply) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

      if (mode === "subscribe" && token === verifyToken) {
        return reply.status(200).send(challenge);
      }
      return reply.status(403).send({ erro: "Token de verificação inválido" });
    }
  );

  app.post("/api/whatsapp/webhook", async (req, reply) => {
    let from = "";
    let body = "";

    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form: any = req.body;
      from = String(form.From || "").replace("whatsapp:", "").trim();
      body = String(form.Body || "").trim();
    } else {
      const json: any = req.body;
      if (!json) {
        return reply.status(400).send({ erro: "Formato inválido" });
      }

      if (json.event === "messages.upsert" && json.data?.message) {
        from = String(json.data.key.remoteJid || "").split("@")[0];
        body = String(json.data.message.conversation || json.data.message.extendedTextMessage?.text || "").trim();
      }
      else if (json.phone && json.text?.message) {
        from = String(json.phone).trim();
        body = String(json.text.message).trim();
      }
      else if (json.from && json.body) {
        from = String(json.from).trim();
        body = String(json.body).trim();
      }
    }

    if (!from || !body) {
      return reply.status(400).send({ erro: "Não foi possível extrair número ou mensagem" });
    }

    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
    if (adminNumber) {
      if (!compararNumerosWhatsApp(from, adminNumber)) {
        console.log(`[WhatsApp Security] Ignorando mensagem de número não autorizado: ${from}`);
        return reply.status(403).send({ erro: "Número não autorizado" });
      }
    }

    await processarMensagemWhatsApp(from, body);
    return { ok: true };
  });
}