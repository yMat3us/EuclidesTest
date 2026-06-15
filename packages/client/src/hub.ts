import type { MinigameMeta } from "@ddm/shared";
import { showView } from "./navigation.js";
import {
  buscarConfig,
  buscarJogador,
  buscarRankingGlobal,
  buscarRankingRodada,
  buscarRankingTurmas,
  buscarRodadaAtual,
  listarMinigames,
  logoutJogador,
  registrarJogador,
} from "./services/api.js";
import { carregarJogador, limparJogador, salvarJogador } from "./services/session.js";

export type IniciarMinigame = (id: string) => void;

export async function initHub(onPlay: IniciarMinigame) {
  const playerBadge = document.getElementById("player-badge")!;
  const playerName = document.getElementById("player-name")!;
  const loginForm = document.getElementById("login-form") as HTMLFormElement;

  let jogador = carregarJogador();

  function renderPlayerBadge() {
    const initialEl = document.getElementById("player-initial")!;
    if (!jogador) {
      playerBadge.classList.add("hidden");
      return;
    }
    playerBadge.classList.remove("hidden");
    playerName.textContent = jogador.apelido.split(" ")[0];
    initialEl.textContent = jogador.apelido.charAt(0).toUpperCase();
  }

  async function refreshArena() {
    if (!jogador) return;
    try {
      const [{ minigames, pontuacaoTotalPossivel }, perfil, rodadaStatus] =
        await Promise.all([
          listarMinigames(),
          buscarJogador(jogador.id),
          buscarRodadaAtual(),
        ]);

      const global = perfil?.totalGlobal ?? perfil?.total ?? 0;
      const rodada = perfil?.totalRodada ?? 0;

      // Update Dashboard elements
      const gols = perfil?.pontuacoes?.filter((p: any) => p.pontos > 0).length || 0;
      const partidas = perfil?.pontuacoes?.length || 0;
      const aproveitamento = pontuacaoTotalPossivel > 0 
        ? Math.round((global / pontuacaoTotalPossivel) * 100) 
        : 0;
      const progressoPct = Math.round((partidas / 10) * 100); // 10 total minigames in system

      document.getElementById("dash-username")!.textContent = jogador.apelido;
      document.getElementById("dash-class")!.textContent = jogador.turma ? jogador.turma : "Professor";
      document.getElementById("dash-avatar")!.textContent = jogador.apelido.charAt(0).toUpperCase();

      document.getElementById("stat-gols")!.textContent = String(gols);
      document.getElementById("stat-partidas")!.textContent = `${partidas}/10`;
      document.getElementById("stat-pontos")!.textContent = `${global} pts`;
      document.getElementById("stat-aproveitamento")!.textContent = `${aproveitamento}%`;

      document.getElementById("progress-percent")!.textContent = `${progressoPct}%`;
      document.getElementById("progress-bar-fill")!.style.width = `${progressoPct}%`;

      const widgetBox = document.getElementById("rodada-widget")!;
      const widgetDot = document.getElementById("widget-dot")!;
      const widgetTitle = document.getElementById("widget-title")!;
      const widgetDesc = document.getElementById("widget-desc")!;

      if (rodadaStatus.ativa && rodadaStatus.rodada) {
        widgetBox.className = "rodada-widget-box active";
        widgetDot.className = "widget-dot active";
        widgetTitle.textContent = `Apresentação #${rodadaStatus.rodada.numero} Ativa`;
        widgetDesc.textContent = `${rodadaStatus.rodada.titulo} · Seus pontos: ${rodada} pts`;
      } else {
        widgetBox.className = "rodada-widget-box inactive";
        widgetDot.className = "widget-dot inactive";
        widgetTitle.textContent = "Aguardando Apresentação";
        widgetDesc.textContent = "O professor iniciará uma rodada em breve.";
      }

      const podeJogar = rodadaStatus.ativa;
      const bloqueio = document.getElementById("arena-bloqueio")!;
      const grid = document.getElementById("minigame-grid")!;
      if (podeJogar) {
        bloqueio.classList.add("hidden");
        grid.classList.remove("hidden");
      } else {
        bloqueio.classList.remove("hidden");
        grid.classList.add("hidden");
      }
      renderGrid(minigames, onPlay, podeJogar);
    } catch (err) {
      console.error("Erro ao atualizar arena em tempo real:", err);
    }
  }

  function showArena() {
    showView("arena");
    renderPlayerBadge();
    refreshArena();
  }

  function showLogin() {
    jogador = null;
    limparJogador();
    loginForm.reset();
    showView("login");
    renderPlayerBadge();
  }

  const selectTurma = document.getElementById("select-turma") as HTMLSelectElement;
  const chkProfessor = document.getElementById("chk-professor") as HTMLInputElement;
  const fieldTurma = document.getElementById("field-turma")!;
  const professorToggle = document.getElementById("professor-toggle")!;

  const config = await buscarConfig();
  for (const t of config.turmas) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    selectTurma.appendChild(opt);
  }

  if (config.restricaoCadastroAtiva) {
    const aviso = document.getElementById("login-aviso")!;
    aviso.textContent = "Apenas nomes cadastrados pelo professor podem entrar.";
    aviso.classList.remove("hidden");
  }

  function syncProfessorTurma() {
    const prof = chkProfessor.checked;
    selectTurma.disabled = prof;
    selectTurma.required = !prof;
    fieldTurma.classList.toggle("is-disabled", prof);
    professorToggle.classList.toggle("is-active", prof);
    if (prof) selectTurma.value = "";
  }

  chkProfessor.addEventListener("change", syncProfessorTurma);
  syncProfessorTurma();

  // Real-time EventSource listener
  const es = new EventSource("/api/realtime/eventos");
  es.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.tipo === "rodada_atualizada" || data.tipo === "ranking_atualizado") {
        void refreshArena();
      }
      if (data.tipo === "ranking_atualizado") {
        const rankingEl = document.getElementById("ranking-panel");
        if (rankingEl && !rankingEl.classList.contains("hidden")) {
          void renderRanking(rankingTab);
        }
      }
      if (data.tipo === "jogador_desconectado" && (data.dados?.jogadorId === jogador?.id || data.dados?.jogadorId === "all")) {
        alert("Você foi desconectado, banido ou resetado da arena pelo administrador.");
        showLogin();
        return;
      }
      if (data.tipo === "cadastro_atualizado") {
        buscarConfig().then((config) => {
          const aviso = document.getElementById("login-aviso")!;
          if (config.restricaoCadastroAtiva) {
            aviso.textContent = "Apenas nomes cadastrados pelo professor podem entrar.";
            aviso.classList.remove("hidden");
          } else {
            aviso.classList.add("hidden");
          }
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  });

  if (jogador) {
    showArena();
  } else {
    showView("login");
  }

  let pollingInterval: any = null;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const apelido = String(fd.get("apelido")).trim();
    const souProfessor = chkProfessor.checked;
    const turma = souProfessor ? undefined : String(fd.get("turma") || "");
    if (!souProfessor && !turma) {
      alert("Selecione sua turma ou marque Sou professor.");
      return;
    }

    const submitBtn = loginForm.querySelector("button[type='submit']") as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
    }

    try {
      const data = await registrarJogador(apelido, { turma, souProfessor });
      
      if (data.status === "aguardando_aprovacao") {
        const overlayModal = document.getElementById("login-aprovacao-modal")!;
        const overlayApelido = document.getElementById("aprovacao-apelido")!;
        
        overlayApelido.textContent = apelido;
        overlayModal.classList.remove("hidden");
        
        pollingInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/jogadores/solicitacao/${data.solicitacaoId}/status`);
            if (!checkRes.ok) return;
            const checkData = await checkRes.json();
            
            if (checkData.status === "aprovado" && checkData.loginData) {
              clearInterval(pollingInterval);
              overlayModal.classList.add("hidden");
              jogador = checkData.loginData.jogador;
              salvarJogador(jogador!);
              showArena();
              if (submitBtn) {
                submitBtn.classList.remove("loading");
                submitBtn.disabled = false;
              }
            } else if (checkData.status === "rejeitado") {
              clearInterval(pollingInterval);
              overlayModal.classList.add("hidden");
              alert("Acesso rejeitado pelo administrador do site.");
              if (submitBtn) {
                submitBtn.classList.remove("loading");
                submitBtn.disabled = false;
              }
            }
          } catch (err) {
            /* ignore polling error */
          }
        }, 1500);

        return;
      }

      jogador = data.jogador;
      salvarJogador(jogador!);
      showArena();
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      }
    } catch (err) {
      const card = document.querySelector(".login-card");
      if (card) {
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 400);
      }
      alert(err instanceof Error ? err.message : "Erro ao entrar");
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      }
    }
  });

  document.getElementById("btn-cancelar-aprovacao")!.addEventListener("click", () => {
    if (pollingInterval) clearInterval(pollingInterval);
    document.getElementById("login-aprovacao-modal")!.classList.add("hidden");
    const submitBtn = loginForm.querySelector("button[type='submit']") as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });

  document.getElementById("btn-logout")!.addEventListener("click", async () => {
    if (!jogador) return;
    if (!confirm("Sair da sua conta neste dispositivo?")) return;

    try {
      await logoutJogador(jogador.id);
    } catch {
      /* limpa local mesmo se API falhar */
    }
    showLogin();
  });

  let rankingTab: "global" | "rodada" | "turma" = "global";

  document.querySelectorAll(".ranking-tab").forEach((btn) => {
    btn.addEventListener("click", async () => {
      rankingTab = (btn as HTMLElement).dataset.tab as "global" | "rodada" | "turma";
      document.querySelectorAll(".ranking-tab").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", String(active));
      });
      await renderRanking(rankingTab);
    });
  });

  document.getElementById("btn-ranking")!.addEventListener("click", async () => {
    showView("ranking");
    rankingTab = "global";
    document.querySelectorAll(".ranking-tab").forEach((b) => {
      const isGlobal = (b as HTMLElement).dataset.tab === "global";
      b.classList.toggle("active", isGlobal);
      b.setAttribute("aria-selected", String(isGlobal));
    });
    await renderRanking("global");
  });

  document.getElementById("btn-back-hub")!.addEventListener("click", () => {
    showArena();
  });

  // Wire up top navbar buttons
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetView = (btn as HTMLElement).dataset.view;
      if (targetView === "login") {
        if (jogador) {
          showView("arena");
        } else {
          showView("login");
        }
      } else {
        showView(targetView as any);
      }
    });
  });

  // Wire up Home Go Arena Button
  document.querySelectorAll(".btn-go-arena").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (jogador) {
        showView("arena");
      } else {
        showView("login");
      }
    });
  });

  // Wire up Brand click (Go Home)
  document.getElementById("brand-home")!.addEventListener("click", (e) => {
    e.preventDefault();
    showView("home");
  });

  // Wire up Back to Arena Buttons
  document.querySelectorAll(".btn-back-to-arena").forEach((btn) => {
    btn.addEventListener("click", () => {
      showView("arena");
    });
  });





  // Iniciar sempre na Página Inicial (Home)
  showView("home");

  return {
    async voltarDoJogo() {
      document.getElementById("view-hub")!.classList.remove("hidden");
      document.getElementById("game-container")!.classList.add("hidden");
      showArena();
    },
    getJogador: () => jogador,
  };
}

const TEMA_ICON: Record<string, string> = {
  aritmetica: "⚡",
  fracoes: "🧩",
  geometria: "△",
  algebra: "∞",
  funcoes: "📈",
  probabilidade: "🎲",
};

const GAME_ICONS: Record<string, string> = {
  "fracoes-visual": "🍕",
  "logica": "🧠",
  "copa": "⚽",
};

function renderGrid(
  minigames: MinigameMeta[],
  onPlay: IniciarMinigame,
  podeJogar: boolean,
) {
  const grid = document.getElementById("minigame-grid")!;
  grid.innerHTML = "";

  minigames.forEach((m, index) => {
    const card = document.createElement("article");
    const locked = !m.implementado || !podeJogar;
    card.className = `card${locked ? " locked" : ""}`;
    card.style.animationDelay = `${index * 0.06}s`;
    const icon = GAME_ICONS[m.id] ?? TEMA_ICON[m.tema] ?? "∑";
    card.innerHTML = `
      <span class="card-icon" aria-hidden="true">${icon}</span>
      <span class="tag">${m.tema} · ${m.dificuldade}</span>
      <h3>${m.nome}</h3>
      <p class="card-desc">${m.descricao}</p>
      <span class="pts">até ${m.pontuacaoMaxima} pts · ${m.duracaoSegundos}s</span>
    `;
    const btn = document.createElement("button");
    btn.className = `btn ${!locked ? "primary btn-glow" : "ghost"}`;
    if (!m.implementado) btn.textContent = `Em breve · Fase ${m.fase}`;
    else if (!podeJogar) btn.textContent = "Aguardando apresentação";
    else btn.textContent = "Entrar no desafio";
    btn.disabled = locked;
    btn.addEventListener("click", () => onPlay(m.id));
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

async function renderRanking(tipo: "global" | "rodada" | "turma") {
  const list = document.getElementById("ranking-list")!;
  const subtitle = document.getElementById("ranking-subtitle")!;
  list.innerHTML = "";

  if (tipo === "global") {
    const { ranking, atualizadoEm } = await buscarRankingGlobal(15);
    subtitle.textContent =
      "Acumulado de todo o Dia da Matemática — não zera entre apresentações.";
    preencherLista(list, ranking);
    document.getElementById("ranking-updated")!.textContent =
      `Global · ${new Date(atualizadoEm).toLocaleString("pt-BR")}`;
    return;
  }

  if (tipo === "turma") {
    const { ranking, atualizadoEm } = await buscarRankingTurmas();
    subtitle.textContent =
      "Pontuação acumulada por turma (soma de todos os alunos).";
    preencherListaTurmas(list, ranking);
    document.getElementById("ranking-updated")!.textContent =
      `Turmas · ${new Date(atualizadoEm).toLocaleString("pt-BR")}`;
    return;
  }

  const { ranking, rodada, ativa, atualizadoEm } = await buscarRankingRodada(15);
  if (!rodada) {
    subtitle.textContent = "Nenhuma apresentação ativa. O professor inicia pelo painel admin.";
    const podium3d = document.getElementById("podium-3d")!;
    podium3d.innerHTML = "";
    podium3d.classList.add("hidden");
    list.innerHTML =
      '<li class="ranking-empty"><span>Ranking temporário indisponível.</span></li>';
    document.getElementById("ranking-updated")!.textContent = "";
    return;
  }

  subtitle.textContent = ativa
    ? `${rodada.titulo} — pontos dos 20 PCs desta rodada (zera ao encerrar).`
    : `${rodada.titulo} — rodada encerrada.`;
  preencherLista(list, ranking, "Ninguém pontuou nesta apresentação ainda.");
  document.getElementById("ranking-updated")!.textContent =
    `Apresentação #${rodada.numero} · ${new Date(atualizadoEm).toLocaleString("pt-BR")}`;
}

function preencherListaTurmas(
  list: HTMLElement,
  ranking: { turma: string; total: number; total_jogadores: number }[],
) {
  const podium3d = document.getElementById("podium-3d")!;
  podium3d.innerHTML = "";
  list.innerHTML = "";

  if (ranking.length === 0) {
    podium3d.classList.add("hidden");
    list.innerHTML = `<li class="ranking-empty"><span>Nenhum ponto registrado por turmas ainda.</span></li>`;
    return;
  }

  podium3d.classList.remove("hidden");

  const p1 = ranking[0];
  const p2 = ranking[1];
  const p3 = ranking[2];

  // Renderiza 2º Lugar (Esquerda)
  if (p2) {
    podium3d.innerHTML += `
      <div class="podium-col col-2">
        <div class="podium-player">
          <span class="podium-name">${p2.turma}</span>
          <span class="podium-turma">${p2.total_jogadores} alunos</span>
          <span class="podium-score">${p2.total} pts</span>
        </div>
        <div class="podium-block block-silver">
          <span class="podium-number">2º</span>
        </div>
      </div>
    `;
  } else {
    podium3d.innerHTML += `<div class="podium-col col-2 empty"></div>`;
  }

  // Renderiza 1º Lugar (Centro)
  if (p1) {
    podium3d.innerHTML += `
      <div class="podium-col col-1">
        <div class="podium-crown">👑</div>
        <div class="podium-player">
          <span class="podium-name">${p1.turma}</span>
          <span class="podium-turma">${p1.total_jogadores} alunos</span>
          <span class="podium-score">${p1.total} pts</span>
        </div>
        <div class="podium-block block-gold">
          <span class="podium-number">1º</span>
        </div>
      </div>
    `;
  }

  // Renderiza 3º Lugar (Direita)
  if (p3) {
    podium3d.innerHTML += `
      <div class="podium-col col-3">
        <div class="podium-player">
          <span class="podium-name">${p3.turma}</span>
          <span class="podium-turma">${p3.total_jogadores} alunos</span>
          <span class="podium-score">${p3.total} pts</span>
        </div>
        <div class="podium-block block-bronze">
          <span class="podium-number">3º</span>
        </div>
      </div>
    `;
  } else {
    podium3d.innerHTML += `<div class="podium-col col-3 empty"></div>`;
  }

  // Renderiza o restante da lista (4º lugar em diante)
  const restantes = ranking.slice(3);
  restantes.forEach((r, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${i * 0.05}s`;
    const hash = r.turma ? r.turma.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) : i;
    const trend = hash % 3 === 0 ? "up" : hash % 3 === 1 ? "down" : "same";
    const trendIcon = trend === "up" ? "🔼" : trend === "down" ? "🔽" : "▬";
    const trendClass = `trend-${trend}`;
    const maxPoints = ranking[0]?.total || 1;
    const pct = Math.min(100, Math.max(5, Math.round((r.total / maxPoints) * 100)));

    li.innerHTML = `
      <span class="pos-badge">#${i + 4}</span>
      <div class="rank-info">
        <span class="rank-name">${r.turma}</span>
        <span class="rank-subtext">${r.total_jogadores} alunos ativos</span>
        <div class="rank-progress-track">
          <div class="rank-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="rank-trend-box ${trendClass}" title="Tendência de posição">
        <span class="trend-icon">${trendIcon}</span>
      </div>
      <span class="total">${r.total} <span class="pts-label">pts</span></span>
    `;
    list.appendChild(li);
  });
}

function preencherLista(
  list: HTMLElement,
  ranking: { apelido: string; turma: string | null; total: number }[],
  vazio = "Nenhum jogador no pódio ainda. Seja o primeiro!",
) {
  const podium3d = document.getElementById("podium-3d")!;
  podium3d.innerHTML = "";
  list.innerHTML = "";

  if (ranking.length === 0) {
    podium3d.classList.add("hidden");
    list.innerHTML = `<li class="ranking-empty"><span>${vazio}</span></li>`;
    return;
  }

  podium3d.classList.remove("hidden");

  const p1 = ranking[0];
  const p2 = ranking[1];
  const p3 = ranking[2];

  // Renderiza 2º Lugar (Esquerda)
  if (p2) {
    const nomeCurto = p2.apelido.split(" ")[0];
    podium3d.innerHTML += `
      <div class="podium-col col-2">
        <div class="podium-player">
          <span class="podium-name">${nomeCurto}</span>
          <span class="podium-turma">${p2.turma ? p2.turma : "Professor"}</span>
          <span class="podium-score">${p2.total} pts</span>
        </div>
        <div class="podium-block block-silver">
          <span class="podium-number">2º</span>
        </div>
      </div>
    `;
  } else {
    podium3d.innerHTML += `<div class="podium-col col-2 empty"></div>`;
  }

  // Renderiza 1º Lugar (Centro)
  if (p1) {
    const nomeCurto = p1.apelido.split(" ")[0];
    podium3d.innerHTML += `
      <div class="podium-col col-1">
        <div class="podium-crown">👑</div>
        <div class="podium-player">
          <span class="podium-name">${nomeCurto}</span>
          <span class="podium-turma">${p1.turma ? p1.turma : "Professor"}</span>
          <span class="podium-score">${p1.total} pts</span>
        </div>
        <div class="podium-block block-gold">
          <span class="podium-number">1º</span>
        </div>
      </div>
    `;
  }

  // Renderiza 3º Lugar (Direita)
  if (p3) {
    const nomeCurto = p3.apelido.split(" ")[0];
    podium3d.innerHTML += `
      <div class="podium-col col-3">
        <div class="podium-player">
          <span class="podium-name">${nomeCurto}</span>
          <span class="podium-turma">${p3.turma ? p3.turma : "Professor"}</span>
          <span class="podium-score">${p3.total} pts</span>
        </div>
        <div class="podium-block block-bronze">
          <span class="podium-number">3º</span>
        </div>
      </div>
    `;
  } else {
    podium3d.innerHTML += `<div class="podium-col col-3 empty"></div>`;
  }

  // Renderiza o restante da lista (4º lugar em diante)
  const restantes = ranking.slice(3);
  restantes.forEach((r, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${i * 0.05}s`;
    const hash = r.apelido ? r.apelido.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) : i;
    const trend = hash % 3 === 0 ? "up" : hash % 3 === 1 ? "down" : "same";
    const trendIcon = trend === "up" ? "🔼" : trend === "down" ? "🔽" : "▬";
    const trendClass = `trend-${trend}`;
    const maxPoints = ranking[0]?.total || 1;
    const pct = Math.min(100, Math.max(5, Math.round((r.total / maxPoints) * 100)));

    li.innerHTML = `
      <span class="pos-badge">#${i + 4}</span>
      <div class="rank-info">
        <span class="rank-name">${r.apelido}</span>
        <span class="rank-subtext">${r.turma ? r.turma : "Professor"}</span>
        <div class="rank-progress-track">
          <div class="rank-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="rank-trend-box ${trendClass}" title="Tendência de posição">
        <span class="trend-icon">${trendIcon}</span>
      </div>
      <span class="total">${r.total} <span class="pts-label">pts</span></span>
    `;
    list.appendChild(li);
  });
}