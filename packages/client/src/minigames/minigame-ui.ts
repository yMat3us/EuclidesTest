import type { MinigameMeta } from "@ddm/shared";
import { enviarPontuacao } from "../services/api.js";
import type { Jogador } from "../services/api.js";
import type { iniciarProtecaoDesafio } from "./protecao-desafio.js";

/** Tempo para ler o resultado antes de voltar à arena */
export const DELAY_VOLTAR_ARENA_MS = 5000;
export const DELAY_VOLTAR_ARENA_SEG = DELAY_VOLTAR_ARENA_MS / 1000;

export type ProtecaoDesafio = ReturnType<typeof iniciarProtecaoDesafio>;

export function agendarVoltaArena(
  onFim: () => void,
  aoAtualizarTexto?: (texto: string) => void,
): void {
  let restante = DELAY_VOLTAR_ARENA_SEG;
  const mostrar = () =>
    aoAtualizarTexto?.(`Voltando à arena em ${restante}s…`);

  mostrar();

  const tick = window.setInterval(() => {
    restante--;
    if (restante > 0) mostrar();
    else window.clearInterval(tick);
  }, 1000);

  window.setTimeout(() => {
    window.clearInterval(tick);
    onFim();
  }, DELAY_VOLTAR_ARENA_MS);
}

let lastActionTime = Date.now();
let multipliers: number[] = [];
let speedBarIntervalId: any = null;
let speedBarFrozen = false;

export interface MinigameUi {
  setTimer: (text: string) => void;
  setScore: (text: string) => void;
  setFeedback: (text: string, tipo?: "ok" | "erro" | "") => void;
  setStatus: (text: string) => void;
  cleanup?: () => void;
  resetSpeedBar?: () => void;
  body: HTMLElement;
  feedback: HTMLElement;
}

export function montarShell(
  container: HTMLElement,
  meta: MinigameMeta,
  corpoHtml: string,
): MinigameUi {
  if (speedBarIntervalId) {
    clearInterval(speedBarIntervalId);
    speedBarIntervalId = null;
  }

  lastActionTime = Date.now();
  multipliers = [];
  speedBarFrozen = false;

  container.innerHTML = `
    <div class="mg-shell glass-card">
      <div class="mg-top">
        <span class="mg-brand">Euclides Test · Arena</span>
        <div class="mg-timer-container">
          <svg class="mg-timer-svg" viewBox="0 0 36 36">
            <path class="mg-timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path id="mg-timer-ring" class="mg-timer-ring" stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span id="mg-timer-text" class="mg-timer-text">0s</span>
        </div>
      </div>
      <h2 class="mg-title">${meta.nome}</h2>
      
      <!-- Visual stadium scoreboard decoration -->
      <div class="mg-scoreboard-decor">
        <span class="decor-ball">⚽</span>
        <span class="decor-stadium">🏟️ ARENA EUCLIDES</span>
        <span class="decor-bonus" id="mg-speed-badge">⚡ VELOCIDADE: 1.3x</span>
      </div>
      <div class="mg-speed-bar-container">
        <div id="mg-speed-bar" class="mg-speed-bar"></div>
      </div>

      <p id="mg-score" class="mg-score"></p>
      <div id="mg-body" class="mg-body">${corpoHtml}</div>
      <p id="mg-feedback" class="mg-feedback"></p>
      <p id="mg-status" class="mg-status muted"></p>
    </div>
  `;

  const feedback = document.getElementById("mg-feedback")!;
  const speedBarEl = document.getElementById("mg-speed-bar")!;
  const speedBadgeEl = document.getElementById("mg-speed-badge")!;
  let currentMultiplier = 1.3;

  speedBarIntervalId = setInterval(() => {
    if (speedBarFrozen) return;
    const elapsed = Date.now() - lastActionTime;
    const pct = Math.max(0, 100 - (elapsed / 8000) * 100);
    if (speedBarEl) speedBarEl.style.width = `${pct}%`;
    
    if (pct > 75) {
      currentMultiplier = 1.3;
      if (speedBadgeEl) {
        speedBadgeEl.textContent = "⚡ SUPER RÁPIDO: 1.3x";
        speedBadgeEl.style.color = "var(--copa-amarelo)";
      }
      if (speedBarEl) speedBarEl.style.background = "linear-gradient(90deg, var(--copa-amarelo), #fbbf24)";
    } else if (pct > 50) {
      currentMultiplier = 1.15;
      if (speedBadgeEl) {
        speedBadgeEl.textContent = "🏃 RÁPIDO: 1.15x";
        speedBadgeEl.style.color = "var(--copa-azul)";
      }
      if (speedBarEl) speedBarEl.style.background = "linear-gradient(90deg, var(--copa-azul), #60a5fa)";
    } else if (pct > 25) {
      currentMultiplier = 1.0;
      if (speedBadgeEl) {
        speedBadgeEl.textContent = "⏱ NORMAL: 1.0x";
        speedBadgeEl.style.color = "#a1a1aa";
      }
      if (speedBarEl) speedBarEl.style.background = "linear-gradient(90deg, #a1a1aa, #d4d4d8)";
    } else {
      currentMultiplier = 0.7;
      if (speedBadgeEl) {
        speedBadgeEl.textContent = "🐢 LENTO: 0.7x";
        speedBadgeEl.style.color = "var(--danger)";
      }
      if (speedBarEl) speedBarEl.style.background = "linear-gradient(90deg, var(--danger), #ef4444)";
    }
  }, 100);

  // Listen for clicks on options to register the multiplier
  const shellEl = container.querySelector(".mg-shell")!;
  if (shellEl) {
    shellEl.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const isOptionBtn = target.closest(".options-grid button, .mg-opcoes button, .select-option-btn, .mg-memory-card");
      if (isOptionBtn && !(isOptionBtn as HTMLButtonElement).disabled) {
        multipliers.push(currentMultiplier);
        speedBarFrozen = true;
      }
    });
  }

  const cleanup = () => {
    if (speedBarIntervalId) {
      clearInterval(speedBarIntervalId);
      speedBarIntervalId = null;
    }
  };

  return {
    body: document.getElementById("mg-body")!,
    feedback,
    cleanup,
    resetSpeedBar: () => {
      lastActionTime = Date.now();
      speedBarFrozen = false;
    },
    setTimer: (text) => {
      const textEl = document.getElementById("mg-timer-text");
      if (textEl) textEl.textContent = text;
    },
    setScore: (text) => {
      document.getElementById("mg-score")!.textContent = text;
    },
    setFeedback: (text, tipo = "") => {
      feedback.textContent = text;
      feedback.className = `mg-feedback${tipo ? ` ${tipo}` : ""}`;
    },
    setStatus: (text) => {
      document.getElementById("mg-status")!.textContent = text;
    },
  };
}

export async function finalizarMinigame(opts: {
  jogador: Jogador;
  meta: MinigameMeta;
  partidaId: string;
  tokenSeguranca: string;
  inicio: number;
  protecao: ProtecaoDesafio;
  pontos: number;
  onFim: () => void;
  ui: MinigameUi;
  metadata?: Record<string, unknown>;
  mensagem?: string;
}): Promise<void> {
  const { jogador, meta, partidaId, tokenSeguranca, inicio, protecao, pontos, onFim, ui, metadata, mensagem } =
    opts;
  protecao.encerrar();
  
  if (speedBarIntervalId) {
    clearInterval(speedBarIntervalId);
    speedBarIntervalId = null;
  }

  const anulado = protecao.foiAnulado();
  const duracaoMs = Date.now() - inicio;

  // Apply response time bonus
  let avgMultiplier = 1.0;
  if (multipliers.length > 0) {
    avgMultiplier = multipliers.reduce((s, m) => s + m, 0) / multipliers.length;
  }
  const pontosComBonus = Math.round(pontos * avgMultiplier);
  const pontosFinais = anulado ? 0 : Math.min(meta.pontuacaoMaxima, Math.max(0, pontosComBonus));

  let txtMensagem = mensagem ?? `Fim! ${pontosFinais} pontos`;
  if (!anulado) {
    const pctDiff = Math.round((avgMultiplier - 1.0) * 100);
    if (pctDiff > 0) {
      txtMensagem += ` · Velocidade: +${pctDiff}% ⚡`;
    } else if (pctDiff < 0) {
      txtMensagem += ` · Lento: ${pctDiff}% 🐢`;
    }
  }

  if (anulado) {
    ui.setFeedback(
      "Desafio anulado: você saiu da página, recarregou ou abriu outra aba.",
      "erro",
    );
    try {
      await enviarPontuacao({
        jogadorId: jogador.id,
        minigameId: meta.id,
        partidaId,
        tokenSeguranca,
        pontos: 0,
        duracaoMs,
        anulado: true,
        metadata: {
          ...metadata,
          avgMultiplier,
        },
      });
    } catch {
      /* ignore */
    }
  } else {
    try {
      const res = await enviarPontuacao({
        jogadorId: jogador.id,
        minigameId: meta.id,
        partidaId,
        tokenSeguranca,
        pontos: pontosFinais,
        duracaoMs,
        metadata: {
          ...metadata,
          avgMultiplier,
          speedPercent: Math.round(avgMultiplier * 100),
        },
      });
      ui.setFeedback(
        txtMensagem,
        "ok",
      );
      ui.setStatus(
        `Global: ${res.totalGlobal} pts · Apresentação: ${res.totalRodada} pts`,
      );

      // Upgrade: Inject Ending Dashboard and Medals
      let medal = "🥉";
      let medalName = "Bronze";
      let medalClass = "medal-bronze";
      const pctScore = pontosFinais / meta.pontuacaoMaxima;
      if (pctScore >= 0.85) {
        medal = "🥇";
        medalName = "Ouro";
        medalClass = "medal-gold";
      } else if (pctScore >= 0.55) {
        medal = "🥈";
        medalName = "Prata";
        medalClass = "medal-silver";
      }

      ui.body.innerHTML = `
        <div class="mg-finish-screen">
          <div class="mg-finish-glow"></div>
          <div class="mg-medal-container ${medalClass}">
            <span class="mg-finish-medal">${medal}</span>
            <span class="mg-finish-medal-label">Medalha de ${medalName}</span>
          </div>
          
          <div class="mg-finish-score-box">
            <span class="score-title">PONTOS CONQUISTADOS</span>
            <strong class="score-value animate-score" id="finish-score-val">0 pts</strong>
          </div>

          <div class="mg-finish-stats-row">
            <div class="mg-finish-stat-card">
              <span>🏆 Total Global</span>
              <strong id="finish-total-global">${res.totalGlobal} pts</strong>
            </div>
            <div class="mg-finish-stat-card">
              <span>🏟️ Apresentação</span>
              <strong id="finish-total-rodada">${res.totalRodada} pts</strong>
            </div>
          </div>
        </div>
      `;

      // Animate score count up
      let curPoints = 0;
      const steps = 25;
      const duration = 800; 
      const stepTime = duration / steps;
      const increment = Math.max(1, Math.round(pontosFinais / steps));
      
      const countInterval = setInterval(() => {
        curPoints += increment;
        if (curPoints >= pontosFinais) {
          curPoints = pontosFinais;
          clearInterval(countInterval);
        }
        const scoreValEl = document.getElementById("finish-score-val");
        if (scoreValEl) scoreValEl.textContent = `${curPoints} pts`;
      }, stepTime);

    } catch (e) {
      ui.setFeedback(
        `Erro ao salvar: ${e instanceof Error ? e.message : "?"}`,
        "erro",
      );
    }
  }

  agendarVoltaArena(onFim, (t) => ui.setStatus(t));
}

export function iniciarTimerGlobal(
  segundos: number,
  ui: MinigameUi,
  onFim: () => void,
): () => void {
  let restante = segundos;
  const ring = document.getElementById("mg-timer-ring") as SVGPathElement | null;
  
  const atualizar = () => {
    ui.setTimer(`${restante}s`);
    if (ring) {
      const pct = Math.max(0, Math.min(100, (restante / segundos) * 100));
      ring.setAttribute("stroke-dasharray", `${pct}, 100`);
      
      ring.classList.remove("timer-warning", "timer-danger");
      if (pct <= 25) {
        ring.classList.add("timer-danger");
      } else if (pct <= 50) {
        ring.classList.add("timer-warning");
      }
    }
  };

  atualizar();

  const id = setInterval(() => {
    restante--;
    atualizar();
    if (restante <= 0) {
      clearInterval(id);
      onFim();
    }
  }, 1000);
  return () => clearInterval(id);
}