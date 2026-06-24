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
  salvarAvatarJogador,
} from "./services/api.js";
import { carregarJogador, limparJogador, salvarJogador } from "./services/session.js";

export type IniciarMinigame = (id: string) => void;

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
    if (jogador.avatar) {
      initialEl.innerHTML = `<img src="${jogador.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      initialEl.textContent = jogador.apelido.charAt(0).toUpperCase();
    }
  }

  async function refreshArena() {
    const currentJogador = jogador;
    if (!currentJogador) return;
    try {
      const [{ minigames, pontuacaoTotalPossivel }, perfil, rodadaStatus] =
        await Promise.all([
          listarMinigames(),
          buscarJogador(currentJogador.id),
          buscarRodadaAtual(),
        ]);

      if (perfil?.jogador) {
        jogador = {
          ...currentJogador,
          ...perfil.jogador,
        };
        salvarJogador(jogador);
        renderPlayerBadge();
      }

      const activeJogador = jogador || currentJogador;

      const global = perfil?.totalGlobal ?? perfil?.total ?? 0;
      const rodada = perfil?.totalRodada ?? 0;

      // Update Dashboard elements
      const gols = perfil?.pontuacoes?.filter((p: any) => p.pontos > 0).length || 0;
      const partidas = perfil?.pontuacoes?.length || 0;
      const aproveitamento = pontuacaoTotalPossivel > 0 
        ? Math.round((global / pontuacaoTotalPossivel) * 100) 
        : 0;
      const progressoPct = Math.round((partidas / 10) * 100); // 10 total minigames in system

      document.getElementById("dash-username")!.textContent = activeJogador.apelido;
      document.getElementById("dash-class")!.textContent = activeJogador.turma ? activeJogador.turma : "Professor";
      
      const dashAvatarEl = document.getElementById("dash-avatar");
      if (dashAvatarEl) {
        dashAvatarEl.textContent = activeJogador.apelido.charAt(0).toUpperCase();
      }

      const dashAvatarImg = document.getElementById("dash-avatar-img") as HTMLImageElement | null;
      if (dashAvatarImg) {
        dashAvatarImg.src = activeJogador.avatar || "/avatar_einstein.jpg";
      }

      // XP & Level calculations
      const xp = activeJogador.xp ?? 0;
      const nivel = obterNivelPorXp(xp);
      const xpMin = obterXpNecessarioParaNivel(nivel);
      const xpMax = obterXpNecessarioParaNivel(nivel + 1);
      const currentXpInLevel = xp - xpMin;
      const xpRequiredForNextLevel = xpMax - xpMin;
      const xpPct = xpRequiredForNextLevel > 0 
        ? Math.min(100, Math.max(0, Math.round((currentXpInLevel / xpRequiredForNextLevel) * 100)))
        : 0;

      const dashLevelEl = document.getElementById("dash-level");
      if (dashLevelEl) dashLevelEl.textContent = `Nível ${nivel}`;

      const dashXpEl = document.getElementById("dash-xp");
      if (dashXpEl) dashXpEl.textContent = `${xp} / ${xpMax} XP`;

      const dashXpBarEl = document.getElementById("dash-xp-bar");
      if (dashXpBarEl) dashXpBarEl.style.width = `${xpPct}%`;

      // Render Achievements list
      const conquistasListEl = document.getElementById("dash-conquistas-list");
      if (conquistasListEl) {
        conquistasListEl.innerHTML = "";
        const conquistasJogador = activeJogador.conquistas || [];
        if (conquistasJogador.length === 0) {
          conquistasListEl.innerHTML = `<span class="muted text-xs">Nenhuma conquista desbloqueada.</span>`;
        } else {
          CONQUISTAS_DEFINICAO.forEach((c) => {
            if (conquistasJogador.includes(c.id)) {
              let badgeStyle = "";
              if (c.categoria === "Iniciante") badgeStyle = "background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff;";
              else if (c.categoria === "Intermediário") badgeStyle = "background: linear-gradient(135deg, #10b981, #047857); color: #fff;";
              else if (c.categoria === "Avançado") badgeStyle = "background: linear-gradient(135deg, #f59e0b, #b45309); color: #fff;";
              else if (c.categoria === "Elite") badgeStyle = "background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff;";
              else badgeStyle = "background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); border: 1px solid #c084fc;";

              const badge = document.createElement("span");
              badge.className = "pill badge-achievement animate-pop";
              badge.style.cssText = `padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; white-space: nowrap; ${badgeStyle}`;
              badge.textContent = `🏆 ${c.nome}`;
              badge.title = `${c.categoria} (Nível ${c.nivel})`;
              conquistasListEl.appendChild(badge);
            }
          });
        }
      }

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

  // Avatar Modal Handlers
  const btnChangeAvatar = document.getElementById("btn-change-avatar");
  const modalSelecionarAvatar = document.getElementById("modal-selecionar-avatar");
  const btnCancelarAvatar = document.getElementById("btn-cancelar-avatar");
  const avatarOptions = document.querySelectorAll(".avatar-option");

  if (btnChangeAvatar && modalSelecionarAvatar) {
    btnChangeAvatar.addEventListener("click", () => {
      const currentAvatar = jogador?.avatar || "/avatar_einstein.jpg";
      avatarOptions.forEach((opt) => {
        const img = opt.querySelector("img");
        const path = (opt as HTMLElement).dataset.avatar;
        if (img && path) {
          if (path === currentAvatar) {
            img.style.borderColor = "var(--copa-verde)";
            img.style.boxShadow = "0 0 10px rgba(0, 255, 128, 0.5)";
          } else {
            img.style.borderColor = "transparent";
            img.style.boxShadow = "none";
          }
        }
      });
      modalSelecionarAvatar.classList.remove("hidden");
    });
  }

  if (btnCancelarAvatar && modalSelecionarAvatar) {
    btnCancelarAvatar.addEventListener("click", () => {
      modalSelecionarAvatar.classList.add("hidden");
    });
  }

  avatarOptions.forEach((opt) => {
    opt.addEventListener("click", async () => {
      if (!jogador) return;
      const avatarPath = (opt as HTMLElement).dataset.avatar || null;
      try {
        await salvarAvatarJogador(jogador.id, avatarPath);
        jogador.avatar = avatarPath;
        salvarJogador(jogador);
        renderPlayerBadge();
        
        const dashAvatarImg = document.getElementById("dash-avatar-img") as HTMLImageElement | null;
        if (dashAvatarImg) {
          dashAvatarImg.src = avatarPath || "/avatar_einstein.jpg";
        }
        
        if (modalSelecionarAvatar) {
          modalSelecionarAvatar.classList.add("hidden");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar avatar");
      }
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
  ranking: { apelido: string; turma: string | null; total: number; avatar?: string | null }[],
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
    const avatarImg = p2.avatar
      ? `<img src="${p2.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #ccc; margin-bottom: 4px;" />`
      : `<span style="font-size: 1.5rem; margin-bottom: 4px; display: inline-block;">👤</span>`;
    podium3d.innerHTML += `
      <div class="podium-col col-2">
        <div class="podium-player">
          ${avatarImg}
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
    const avatarImg = p1.avatar
      ? `<img src="${p1.avatar}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; margin-bottom: 4px; box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);" />`
      : `<span style="font-size: 1.8rem; margin-bottom: 4px; display: inline-block;">👤</span>`;
    podium3d.innerHTML += `
      <div class="podium-col col-1">
        <div class="podium-crown">👑</div>
        <div class="podium-player">
          ${avatarImg}
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
    const avatarImg = p3.avatar
      ? `<img src="${p3.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #cd7f32; margin-bottom: 4px;" />`
      : `<span style="font-size: 1.5rem; margin-bottom: 4px; display: inline-block;">👤</span>`;
    podium3d.innerHTML += `
      <div class="podium-col col-3">
        <div class="podium-player">
          ${avatarImg}
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
    const avatarImg = r.avatar
      ? `<img src="${r.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" />`
      : `<span style="font-size: 1.2rem;">👤</span>`;

    li.innerHTML = `
      <span class="pos-badge">#${i + 4}</span>
      <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
        ${avatarImg}
        <div class="rank-info" style="flex: 1;">
          <span class="rank-name">${r.apelido}</span>
          <span class="rank-subtext">${r.turma ? r.turma : "Professor"}</span>
          <div class="rank-progress-track">
            <div class="rank-progress-fill" style="width: ${pct}%"></div>
          </div>
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