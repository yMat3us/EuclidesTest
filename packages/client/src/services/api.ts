import type { MinigameMeta } from "@ddm/shared";

export interface Jogador {
  id: string;
  apelido: string;
  turma?: string;
}

export interface RankingEntry {
  id: string;
  apelido: string;
  turma: string | null;
  total: number;
  minigames_jogados: number;
}

export interface RodadaInfo {
  id: string;
  numero: number;
  titulo: string;
  inicio_em: string;
}

const BASE = "/api";

export async function registrarJogador(
  apelido: string,
  opts: { turma?: string; souProfessor?: boolean },
): Promise<any> {
  const res = await fetch(`${BASE}/jogadores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apelido,
      turma: opts.souProfessor ? undefined : opts.turma,
      souProfessor: opts.souProfessor ?? false,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const erro = data.erro;
    const msg =
      typeof erro === "string"
        ? erro
        : (erro?.formErrors?.[0]?.message ?? "Falha ao registrar");
    throw new Error(msg);
  }
  return data;
}

export async function listarMinigames(all = false): Promise<{
  minigames: MinigameMeta[];
  pontuacaoTotalPossivel: number;
}> {
  const res = await fetch(`${BASE}/minigames${all ? "?all=true" : ""}${all ? "&" : "?"}_=${Date.now()}`);
  return res.json();
}

export async function buscarRodadaAtual() {
  const res = await fetch(`${BASE}/rodada/atual?_=${Date.now()}`);
  return res.json() as Promise<{ ativa: boolean; rodada: RodadaInfo | null }>;
}

export async function buscarConfig() {
  const res = await fetch(`${BASE}/config?_=${Date.now()}`);
  return res.json() as Promise<{
    restricaoCadastroAtiva: boolean;
    turmas: string[];
  }>;
}

export async function iniciarPartida(
  jogadorId: string,
  minigameId: string,
): Promise<{ partidaId: string; tokenSeguranca: string }> {
  const res = await fetch(`${BASE}/partidas/iniciar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jogadorId, minigameId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao iniciar partida");
  return data;
}

export async function enviarPontuacao(payload: {
  jogadorId: string;
  minigameId: string;
  partidaId: string;
  tokenSeguranca: string;
  pontos: number;
  duracaoMs: number;
  metadata?: Record<string, unknown>;
  anulado?: boolean;
}) {
  const res = await fetch(`${BASE}/pontuacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao salvar pontuação");
  return data as {
    totalGlobal: number;
    totalRodada: number;
    contabilizadoRodada: boolean;
    pontos: number;
  };
}

export async function buscarRankingGlobal(limite = 20) {
  const res = await fetch(`${BASE}/ranking/global?limite=${limite}&_=${Date.now()}`);
  return res.json() as Promise<{
    ranking: RankingEntry[];
    atualizadoEm: string;
  }>;
}

export async function buscarRankingRodada(limite = 20) {
  const res = await fetch(`${BASE}/ranking/rodada?limite=${limite}&_=${Date.now()}`);
  return res.json() as Promise<{
    rodada: RodadaInfo | null;
    ranking: RankingEntry[];
    ativa: boolean;
    atualizadoEm: string;
  }>;
}

export interface RankingTurmaEntry {
  turma: string;
  total: number;
  total_jogadores: number;
}

export async function buscarRankingTurmas() {
  const res = await fetch(`${BASE}/ranking/turmas?_=${Date.now()}`);
  return res.json() as Promise<{
    ranking: RankingTurmaEntry[];
    atualizadoEm: string;
  }>;
}

/** @deprecated use buscarRankingGlobal */
export async function buscarRanking(limite = 20) {
  return buscarRankingGlobal(limite);
}

export async function buscarJogador(id: string) {
  const res = await fetch(`${BASE}/jogadores/${id}?_=${Date.now()}`);
  if (!res.ok) return null;
  return res.json() as Promise<{
    jogador: { id: string; apelido: string; turma: string | null };
    totalGlobal: number;
    totalRodada: number;
    rodadaAtiva: RodadaInfo | null;
    total: number;
    pontuacoes: { minigameId: string; pontos: number }[];
  }>;
}

function adminHeaders(token: string): HeadersInit {
  return { "x-admin-token": token };
}

export async function adminStatus(token?: string) {
  const res = await fetch(`${BASE}/admin/status?_=${Date.now()}`, {
    headers: token ? adminHeaders(token) : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Admin indisponível");
  return data;
}

export async function logoutJogador(jogadorId: string) {
  const res = await fetch(`${BASE}/jogadores/${jogadorId}/logout`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao sair");
  return data;
}

export async function adminStats(token: string) {
  const res = await fetch(`${BASE}/admin/stats?_=${Date.now()}`, {
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao carregar painel");
  return data;
}

export async function adminExportCompleto(token: string) {
  const res = await fetch(`${BASE}/admin/export`, {
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao exportar");
  return data;
}

export async function adminResetTotal(token: string) {
  const res = await fetch(`${BASE}/admin/reset`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data as { ok: boolean; mensagem: string };
}

export async function adminResetGlobal(token: string) {
  const res = await fetch(`${BASE}/admin/reset/global`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data as { ok: boolean; mensagem: string };
}

export async function adminResetRodada(token: string) {
  const res = await fetch(`${BASE}/admin/reset/rodada`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data as { ok: boolean; mensagem: string };
}

export async function adminIniciarRodada(token: string, titulo?: string, minigames?: string[]) {
  const res = await fetch(`${BASE}/admin/rodada/iniciar`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, minigames }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminCadastroListar(token: string) {
  const res = await fetch(`${BASE}/admin/cadastro?_=${Date.now()}`, { headers: adminHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminCadastroAdicionar(
  token: string,
  body: { nome: string; turma?: string | null; ehProfessor?: boolean },
) {
  const res = await fetch(`${BASE}/admin/cadastro`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminCadastroRemover(token: string, id: string) {
  const res = await fetch(`${BASE}/admin/cadastro/${id}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.erro ?? "Falha");
  }
}

export async function adminCadastroToggleAtivo(
  token: string,
  id: string,
  ativo: boolean,
) {
  const res = await fetch(`${BASE}/admin/cadastro/${id}`, {
    method: "PATCH",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ ativo }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.erro ?? "Falha");
  }
}

export async function adminRestricaoCadastro(token: string, ativa: boolean) {
  const res = await fetch(`${BASE}/admin/cadastro/restricao`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ ativa }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminEncerrarRodada(token: string) {
  const res = await fetch(`${BASE}/admin/rodada/encerrar`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data as { ok: boolean; mensagem: string };
}

export async function adminChatbotConversar(
  token: string,
  payload: { mensagem: string; adminName: string },
): Promise<{ resposta: string; comando: string | null }> {
  const res = await fetch(`${BASE}/admin/chatbot/conversar`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha na comunicação com o assistente");
  return data;
}

export async function adminJogadoresListar(token: string) {
  const res = await fetch(`${BASE}/admin/jogadores?_=${Date.now()}`, { headers: adminHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao listar jogadores");
  return data as {
    jogadores: {
      id: string;
      apelido: string;
      turma: string | null;
      ativo: number;
      banido: number;
      total_global: number;
      total_rodada: number;
    }[];
  };
}

export async function adminJogadorBanir(token: string, id: string, banido: boolean) {
  const res = await fetch(`${BASE}/admin/jogadores/${id}/banir`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ banido }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminJogadorExpulsar(token: string, id: string) {
  const res = await fetch(`${BASE}/admin/jogadores/${id}/expulsar`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha");
  return data;
}

export async function adminJogadorAjustarPontos(
  token: string,
  id: string,
  operacao: "adicionar" | "subtrair" | "definir",
  pontos: number,
  minigameId: string,
) {
  const res = await fetch(`${BASE}/admin/jogadores/${id}/pontos`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ operacao, pontos, minigameId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao ajustar pontos");
  return data;
}

export async function adminJogadorExcluir(token: string, id: string) {
  const res = await fetch(`${BASE}/admin/jogadores/${id}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao excluir jogador");
  return data;
}

export async function adminZerarContadores(token: string) {
  const res = await fetch(`${BASE}/admin/reset/contadores`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Falha ao resetar contadores");
  return data as { ok: boolean; mensagem: string };
}