import {
  adminCadastroAdicionar,
  adminCadastroListar,
  adminCadastroRemover,
  adminCadastroToggleAtivo,
  adminChatbotConversar,
  adminEncerrarRodada,
  adminExportCompleto,
  adminIniciarRodada,
  adminResetGlobal,
  adminResetRodada,
  adminResetTotal,
  adminRestricaoCadastro,
  adminStats,
  adminStatus,
  buscarConfig,
  adminJogadoresListar,
  adminJogadorBanir,
  adminJogadorExpulsar,
  adminJogadorAjustarPontos,
  listarMinigames,
  adminJogadorExcluir,
  adminZerarContadores,
} from "./services/api.js";
import {
  carregarTokenAdmin,
  limparTokenAdmin,
  salvarTokenAdmin,
} from "./services/admin-session.js";

export async function initAdminPage() {
  const panel = document.getElementById("admin-panel")!;
  const loginForm = document.getElementById("admin-login-form") as HTMLFormElement;
  const dashboard = document.getElementById("admin-dashboard")!;
  const msgEl = document.getElementById("admin-msg")!;
  const loadingEl = document.getElementById("admin-loading")!;

  let todosMinigames: any[] = [];
  let ultimoRodadaId: string | null | undefined = undefined;

  function renderMinigamesChecklist(minigames: any[]) {
    const container = document.getElementById("admin-minigames-checks");
    if (!container) return;
    container.innerHTML = "";
    minigames.forEach((m) => {
      const label = document.createElement("label");
      label.className = "field-check";
      label.innerHTML = `
        <input type="checkbox" id="chk-minigame-${m.id}" value="${m.id}" checked />
        <span>${m.nome}</span>
      `;
      container.appendChild(label);
    });
  }

  function atualizarChecklistMinigames(rodadaAtiva: any) {
    if (!todosMinigames.length) return;
    if (!rodadaAtiva) {
      todosMinigames.forEach((m) => {
        const cb = document.getElementById(`chk-minigame-${m.id}`) as HTMLInputElement;
        if (cb) {
          cb.checked = true;
          cb.disabled = false;
        }
      });
      return;
    }
    
    let permitidos: string[] = [];
    if (rodadaAtiva.minigames_permitidos) {
      try {
        permitidos = JSON.parse(rodadaAtiva.minigames_permitidos);
      } catch {}
    } else {
      permitidos = todosMinigames.map((m) => m.id);
    }
    
    todosMinigames.forEach((m) => {
      const cb = document.getElementById(`chk-minigame-${m.id}`) as HTMLInputElement;
      if (cb) {
        cb.checked = permitidos.includes(m.id);
      }
    });
  }

  try {
    const minigamesRes = await listarMinigames(true);
    todosMinigames = minigamesRes.minigames;
    renderMinigamesChecklist(todosMinigames);
  } catch (err) {
    console.error("Erro ao carregar minigames no checklist", err);
  }

  // EventSource para atualizações em tempo real do painel
  const es = new EventSource("/api/realtime/eventos");
  es.addEventListener("message", (event) => {
    const token = carregarTokenAdmin();
    if (!token) return;
    try {
      const data = JSON.parse(event.data);
      if (
        data.tipo === "ranking_atualizado" ||
        data.tipo === "rodada_atualizada" ||
        data.tipo === "cadastro_atualizado" ||
        data.tipo === "solicitacao_professor" ||
        data.tipo === "solicitacao_decidida"
      ) {
        void refreshDashboard(token);
      }
    } catch {
      /* ignore */
    }
  });

  function showDashboard() {
    loginForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function showLogin() {
    loginForm.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const adminName = String(fd.get("adminName") || "").trim();
    const token = String(fd.get("token") || "").trim();
    if (!adminName) {
      msgEl.textContent = "Selecione seu nome de administrador.";
      msgEl.className = "admin-msg erro";
      return;
    }
    try {
      const status = await adminStatus(token);
      if (!status.autenticado) {
        msgEl.textContent = "Senha incorreta.";
        msgEl.className = "admin-msg erro";
        return;
      }
      salvarTokenAdmin(token);
      sessionStorage.setItem("admin_name", adminName);
      showDashboard();
      initChatbot(adminName);
      await refreshDashboard(token);
    } catch (err) {
      msgEl.textContent = err instanceof Error ? err.message : "Servidor offline";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-admin-logout")!.addEventListener("click", () => {
    limparTokenAdmin();
    sessionStorage.removeItem("admin_name");
    const chatbot = document.getElementById("admin-chatbot");
    if (chatbot) chatbot.classList.add("hidden");
    loginForm.reset();
    showLogin();
  });

  document.getElementById("btn-admin-refresh")!.addEventListener("click", () => {
    const t = carregarTokenAdmin();
    if (t) void refreshDashboard(t);
  });

  document.getElementById("btn-rodada-iniciar")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t) return;
    
    const checkboxes = document.querySelectorAll(
      '#admin-minigames-checks input[type="checkbox"]:checked'
    ) as NodeListOf<HTMLInputElement>;
    const minigamesPermitidos = Array.from(checkboxes).map((cb) => cb.value);
    
    if (minigamesPermitidos.length === 0) {
      alert("Selecione pelo menos um minigame para iniciar a apresentação.");
      return;
    }

    const titulo = prompt("Nome da apresentação (opcional):", "Sessão 20 PCs");
    if (titulo === null) return;
    
    try {
      const res = await adminIniciarRodada(t, titulo || undefined, minigamesPermitidos);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-rodada-encerrar")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t || !confirm("Encerrar apresentação e zerar ranking temporário?")) return;
    try {
      const res = await adminEncerrarRodada(t);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-reset-rodada")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t || !confirm("Zerar pontos da apresentação ativa (mantém rodada aberta)?")) return;
    try {
      const res = await adminResetRodada(t);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-reset-global")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t || !confirm("Zerar ranking GLOBAL? Jogadores permanecem.")) return;
    try {
      const res = await adminResetGlobal(t);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-admin-reset")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t || !confirm("Apagar TUDO (global + temporário + jogadores)?")) return;
    try {
      const res = await adminResetTotal(t);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  document.getElementById("btn-admin-clear-stats")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t || !confirm("Zerar Contadores de Partidas, Rodadas e Eventos? Todos os jogadores ativos serão deslogados.")) return;
    try {
      const res = await adminZerarContadores(t);
      msgEl.textContent = res.mensagem;
      msgEl.className = "admin-msg ok";
      await refreshDashboard(t);
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  const chkRestricao = document.getElementById(
    "chk-restricao-cadastro",
  ) as HTMLInputElement;
  const restricaoToggle = document.getElementById("restricao-toggle")!;
  const formCadastro = document.getElementById("form-cadastro-add") as HTMLFormElement;
  const selectCadastroTurma = document.getElementById(
    "cadastro-select-turma",
  ) as HTMLSelectElement;
  const chkCadastroProfessor = document.getElementById(
    "cadastro-chk-professor",
  ) as HTMLInputElement;
  const fieldCadastroTurma = document.getElementById("field-cadastro-turma")!;
  const cadastroProfessorToggle = document.getElementById("cadastro-professor-toggle")!;
  const cadastroListEl = document.getElementById("admin-cadastro-list")!;

  function syncRestricaoToggle() {
    restricaoToggle.classList.toggle("is-active", chkRestricao.checked);
  }

  try {
    const configPublica = await buscarConfig();
    for (const t of configPublica.turmas) {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      selectCadastroTurma.appendChild(opt);
    }
  } catch {
    /* turmas opcionais se API offline */
  }

  function syncCadastroProfessor() {
    const prof = chkCadastroProfessor.checked;
    selectCadastroTurma.disabled = prof;
    fieldCadastroTurma.classList.toggle("is-disabled", prof);
    cadastroProfessorToggle.classList.toggle("is-active", prof);
    if (prof) selectCadastroTurma.value = "";
  }
  chkCadastroProfessor.addEventListener("change", syncCadastroProfessor);
  syncCadastroProfessor();

  chkRestricao.addEventListener("change", async () => {
    syncRestricaoToggle();
    const t = carregarTokenAdmin();
    if (!t) return;
    try {
      await adminRestricaoCadastro(t, chkRestricao.checked);
      msgEl.textContent = chkRestricao.checked
        ? "Restrição de nomes ativada."
        : "Qualquer apelido pode entrar.";
      msgEl.className = "admin-msg ok";
    } catch (e) {
      chkRestricao.checked = !chkRestricao.checked;
      syncRestricaoToggle();
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = carregarTokenAdmin();
    if (!t) return;
    const fd = new FormData(formCadastro);
    const nome = String(fd.get("nome")).trim();
    const ehProfessor = chkCadastroProfessor.checked;
    const turma = ehProfessor ? null : String(fd.get("turma") || "") || null;
    if (!ehProfessor && !turma) {
      msgEl.textContent = "Selecione a turma ou marque É professor.";
      msgEl.className = "admin-msg erro";
      return;
    }
    try {
      await adminCadastroAdicionar(t, { nome, turma, ehProfessor });
      formCadastro.reset();
      syncCadastroProfessor();
      msgEl.textContent = `${nome} cadastrado(a).`;
      msgEl.className = "admin-msg ok";
      await refreshCadastro(t);
    } catch (err) {
      msgEl.textContent = err instanceof Error ? err.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  async function refreshCadastro(token: string) {
    const { restricaoAtiva, pessoas } = await adminCadastroListar(token);
    chkRestricao.checked = restricaoAtiva;
    syncRestricaoToggle();
    cadastroListEl.innerHTML = "";
    if (!pessoas.length) {
      cadastroListEl.innerHTML =
        '<li class="ranking-empty"><span>Nenhum nome cadastrado.</span></li>';
      return;
    }
    for (const p of pessoas as {
      id: string;
      nome: string;
      turma: string | null;
      eh_professor: number;
      ativo: number;
    }[]) {
      const li = document.createElement("li");
      li.className = "cadastro-item";
      const tipo = p.eh_professor ? "Professor" : (p.turma ?? "—");
      const inativo = !p.ativo;
      li.innerHTML = `
        <span class="cadastro-nome${inativo ? " muted" : ""}">${p.nome}</span>
        <span class="cadastro-meta muted">${tipo}${inativo ? " · inativo" : ""}</span>
      `;
      const actions = document.createElement("span");
      actions.className = "cadastro-actions";

      const btnAtivo = document.createElement("button");
      btnAtivo.type = "button";
      btnAtivo.className = "btn ghost btn-sm";
      btnAtivo.textContent = p.ativo ? "Desativar" : "Ativar";
      btnAtivo.addEventListener("click", async () => {
        await adminCadastroToggleAtivo(token, p.id, !p.ativo);
        await refreshCadastro(token);
      });

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn danger btn-sm";
      btnRemover.textContent = "Remover";
      btnRemover.addEventListener("click", async () => {
        if (!confirm(`Remover ${p.nome} do cadastro?`)) return;
        await adminCadastroRemover(token, p.id);
        await refreshCadastro(token);
      });

      actions.append(btnAtivo, btnRemover);
      li.appendChild(actions);
      cadastroListEl.appendChild(li);
    }
  }

  document.getElementById("btn-admin-export")!.addEventListener("click", async () => {
    const t = carregarTokenAdmin();
    if (!t) return;
    try {
      const data = await adminExportCompleto(t);
      baixarArquivo(
        `euclides-test-${Date.now()}.json`,
        JSON.stringify(data, null, 2),
        "application/json",
      );
      msgEl.textContent = "Backup baixado.";
      msgEl.className = "admin-msg ok";
    } catch (e) {
      msgEl.textContent = e instanceof Error ? e.message : "Erro";
      msgEl.className = "admin-msg erro";
    }
  });

  let cacheJogadores: any[] = [];

  async function refreshJogadores(token: string) {
    const listEl = document.getElementById("admin-jogadores-list")!;
    try {
      const data = await adminJogadoresListar(token);
      cacheJogadores = data.jogadores || [];
      renderJogadoresFiltrados(token);
    } catch (err) {
      listEl.innerHTML = `<li class="ranking-empty"><span>Erro ao carregar jogadores: ${err instanceof Error ? err.message : "Erro"}</span></li>`;
    }
  }

  function renderJogadoresFiltrados(token: string) {
    const listEl = document.getElementById("admin-jogadores-list")!;
    const buscaInput = document.getElementById("admin-busca-jogador") as HTMLInputElement;
    const filtro = buscaInput ? buscaInput.value.toLowerCase().trim() : "";
    
    listEl.innerHTML = "";
    const filtrados = cacheJogadores.filter(j => j.apelido.toLowerCase().includes(filtro));
    
    if (filtrados.length === 0) {
      listEl.innerHTML = '<li class="ranking-empty"><span>Nenhum jogador encontrado.</span></li>';
      return;
    }
    
    for (const p of filtrados) {
      const li = document.createElement("li");
      li.className = "cadastro-item";
      
      const statusText = p.banido ? "BANIDO" : (p.ativo ? "Online" : "Offline");
      const statusClass = p.banido ? "danger" : (p.ativo ? "ok" : "muted");
      
      li.innerHTML = `
        <div class="jogador-info" style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong class="cadastro-nome" style="font-size: 1.05rem; color: #fff;">${p.apelido}</strong>
            <span class="pill pill-${statusClass}" style="font-size: 0.7rem; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: 500;">${statusText}</span>
          </div>
          <span class="cadastro-meta muted" style="font-size: 0.85rem;">
            Turma: ${p.turma ?? "—"} | Global: <strong>${p.total_global}</strong> pts | Apres. Atual: <strong>${p.total_rodada}</strong> pts
          </span>
        </div>
      `;
      
      const actions = document.createElement("span");
      actions.className = "cadastro-actions";
      actions.style.display = "flex";
      actions.style.gap = "8px";
      
      // Botão Ajustar Pontos
      const btnAjustar = document.createElement("button");
      btnAjustar.type = "button";
      btnAjustar.className = "btn primary btn-sm";
      btnAjustar.textContent = "Pontos";
      btnAjustar.addEventListener("click", () => {
        abrirModalAjustarPontos(p.id, p.apelido);
      });
      actions.appendChild(btnAjustar);
      
      // Botão Expulsar (only if active and not banned)
      if (p.ativo && !p.banido) {
        const btnExpulsar = document.createElement("button");
        btnExpulsar.type = "button";
        btnExpulsar.className = "btn ghost btn-sm";
        btnExpulsar.textContent = "Expulsar";
        btnExpulsar.addEventListener("click", async () => {
          if (confirm(`Expulsar jogador "${p.apelido}"? Ele será deslogado.`)) {
            try {
              await adminJogadorExpulsar(token, p.id);
              await refreshDashboard(token);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Erro");
            }
          }
        });
        actions.appendChild(btnExpulsar);
      }
      
      // Botão Banir/Desbanir
      const btnBanir = document.createElement("button");
      btnBanir.type = "button";
      btnBanir.className = p.banido ? "btn primary btn-sm" : "btn danger btn-sm";
      btnBanir.textContent = p.banido ? "Desbanir" : "Banir";
      btnBanir.addEventListener("click", async () => {
        const actionWord = p.banido ? "Desbanir" : "Banir";
        if (confirm(`${actionWord} o jogador "${p.apelido}"?`)) {
          try {
            await adminJogadorBanir(token, p.id, !p.banido);
            await refreshDashboard(token);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Erro");
          }
        }
      });
      actions.appendChild(btnBanir);

      // Botão Excluir Jogador
      const btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "btn danger btn-sm";
      btnExcluir.textContent = "Excluir";
      btnExcluir.style.marginLeft = "4px";
      btnExcluir.addEventListener("click", async () => {
        if (confirm(`Excluir COMPLETAMENTE o jogador "${p.apelido}" e todo o seu histórico do banco de dados? Esta ação não pode ser desfeita.`)) {
          try {
            await adminJogadorExcluir(token, p.id);
            await refreshDashboard(token);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao excluir jogador");
          }
        }
      });
      actions.appendChild(btnExcluir);
      
      li.appendChild(actions);
      listEl.appendChild(li);
    }
  }

  function abrirModalAjustarPontos(id: string, apelido: string) {
    const modal = document.getElementById("modal-ajustar-pontos")!;
    const nomeEl = document.getElementById("modal-pontos-jogador-nome")!;
    const idInput = document.getElementById("modal-pontos-jogador-id") as HTMLInputElement;
    
    nomeEl.textContent = apelido;
    idInput.value = id;
    
    modal.classList.remove("hidden");
  }

  function fecharModalAjustarPontos() {
    const modal = document.getElementById("modal-ajustar-pontos")!;
    modal.classList.add("hidden");
    const form = document.getElementById("form-ajustar-pontos") as HTMLFormElement;
    form.reset();
  }

  const formAjustar = document.getElementById("form-ajustar-pontos") as HTMLFormElement;
  formAjustar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = carregarTokenAdmin();
    if (!token) return;
    
    const id = (document.getElementById("modal-pontos-jogador-id") as HTMLInputElement).value;
    const operacao = (document.getElementById("modal-pontos-operacao") as HTMLSelectElement).value as "adicionar" | "subtrair" | "definir";
    const minigameId = (document.getElementById("modal-pontos-minigame") as HTMLSelectElement).value;
    const pontos = parseInt((document.getElementById("modal-pontos-valor") as HTMLInputElement).value, 10);
    
    try {
      await adminJogadorAjustarPontos(token, id, operacao, pontos, minigameId);
      fecharModalAjustarPontos();
      await refreshDashboard(token);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao ajustar pontos");
    }
  });

  const btnCancelarPontos = document.getElementById("btn-modal-pontos-cancelar")!;
  btnCancelarPontos.addEventListener("click", fecharModalAjustarPontos);

  const buscaInput = document.getElementById("admin-busca-jogador") as HTMLInputElement;
  buscaInput.addEventListener("input", () => {
    const token = carregarTokenAdmin();
    if (token) renderJogadoresFiltrados(token);
  });

  const btnLimparBusca = document.getElementById("btn-admin-limpar-busca")!;
  btnLimparBusca.addEventListener("click", () => {
    buscaInput.value = "";
    const token = carregarTokenAdmin();
    if (token) renderJogadoresFiltrados(token);
  });

  async function refreshDashboard(token: string) {
    loadingEl.classList.remove("hidden");
    panel.classList.add("loading");

    try {
      const stats = await adminStats(token);

      const rodadaId = stats.rodadaAtiva ? stats.rodadaAtiva.id : null;
      if (rodadaId !== ultimoRodadaId) {
        ultimoRodadaId = rodadaId;
        atualizarChecklistMinigames(stats.rodadaAtiva);
      }

      document.getElementById("admin-rodada-status")!.innerHTML = stats.rodadaAtiva
        ? `<span class="pill pill-live">Apresentação #${stats.rodadaAtiva.numero} ativa</span>
           <strong>${stats.rodadaAtiva.titulo}</strong>`
        : `<span class="pill">Nenhuma apresentação ativa</span>
           <span class="muted">Inicie antes dos 20 PCs</span>`;

      const ativos = stats.jogadoresAtivos !== undefined ? stats.jogadoresAtivos : 0;
      document.getElementById("admin-stats")!.innerHTML = `
        <div class="stat-card"><span class="stat-n">${ativos} <span style="font-size: 1.1rem; opacity: 0.75; font-weight: normal;">/ ${stats.jogadores}</span></span><span class="stat-l">Jogadores (On / Total)</span></div>
        <div class="stat-card"><span class="stat-n">${stats.rodadas ?? 0}</span><span class="stat-l">Apresentações</span></div>
        <div class="stat-card"><span class="stat-n">${stats.partidas}</span><span class="stat-l">Partidas</span></div>
        <div class="stat-card"><span class="stat-n">${stats.eventos}</span><span class="stat-l">Eventos</span></div>
      `;

      renderRankingList(
        document.getElementById("admin-ranking-global")!,
        stats.rankingGlobal ?? [],
      );
      renderRankingList(
        document.getElementById("admin-ranking-rodada")!,
        stats.rankingRodada ?? [],
        "Sem pontos na apresentação atual",
      );
      renderRankingTurmasList(
        document.getElementById("admin-ranking-turmas")!,
        stats.rankingTurmas ?? [],
        "Sem turmas registradas",
      );

      document.getElementById("admin-db-path")!.textContent = stats.banco;
      await refreshCadastro(token);
      await refreshSolicitacoes(token);
      await refreshJogadores(token);
      msgEl.textContent = `Atualizado: ${new Date(stats.atualizadoEm).toLocaleString("pt-BR")}`;
      msgEl.className = "admin-msg muted";
    } catch (err) {
      msgEl.textContent = err instanceof Error ? err.message : "Erro";
      msgEl.className = "admin-msg erro";
    } finally {
      loadingEl.classList.add("hidden");
      panel.classList.remove("loading");
    }
  }

  async function refreshSolicitacoes(token: string) {
    const blockEl = document.getElementById("admin-solicitacoes-block")!;
    const listEl = document.getElementById("admin-solicitacoes-list")!;
    
    try {
      const res = await fetch("/api/admin/professores/pendentes", {
        headers: { "x-admin-token": token }
      });
      if (!res.ok) return;
      const data = await res.json();
      
      if (!data.solicitacoes || !data.solicitacoes.length) {
        blockEl.classList.add("hidden");
        listEl.innerHTML = "";
        return;
      }
      
      blockEl.classList.remove("hidden");
      listEl.innerHTML = "";
      
      data.solicitacoes.forEach((sol: { id: string; apelido: string }) => {
        const li = document.createElement("li");
        li.className = "cadastro-item";
        li.innerHTML = `
          <span class="cadastro-nome">${sol.apelido}</span>
          <span class="cadastro-meta muted">Solicitando acesso como Professor</span>
        `;
        
        const actions = document.createElement("span");
        actions.className = "cadastro-actions";
        
        const btnAprovar = document.createElement("button");
        btnAprovar.type = "button";
        btnAprovar.className = "btn primary btn-sm";
        btnAprovar.textContent = "Aprovar";
        btnAprovar.addEventListener("click", async () => {
          await decidirSolicitacao(token, sol.id, true);
        });
        
        const btnRejeitar = document.createElement("button");
        btnRejeitar.type = "button";
        btnRejeitar.className = "btn danger btn-sm";
        btnRejeitar.textContent = "Rejeitar";
        btnRejeitar.addEventListener("click", async () => {
          await decidirSolicitacao(token, sol.id, false);
        });
        
        actions.append(btnAprovar, btnRejeitar);
        li.appendChild(actions);
        listEl.appendChild(li);
      });
    } catch (err) {
      /* ignore list error */
    }
  }

  async function decidirSolicitacao(token: string, id: string, aprovar: boolean) {
    try {
      const res = await fetch(`/api/admin/professores/${id}/decidir`, {
        method: "POST",
        headers: {
          "x-admin-token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ aprovar })
      });
      if (!res.ok) {
        alert("Falha ao registrar decisão.");
        return;
      }
      await refreshSolicitacoes(token);
    } catch (err) {
      alert("Erro de conexão.");
    }
  }

  function renderRankingTurmasList(
    el: HTMLElement,
    ranking: { turma: string; total: number; total_jogadores: number }[],
    vazio = "Vazio",
  ) {
    el.innerHTML = "";
    if (!ranking || !ranking.length) {
      el.innerHTML = `<li class="ranking-empty"><span>${vazio}</span></li>`;
      return;
    }
    ranking.forEach((r, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="pos">${i + 1}º</span>
        <span>${r.turma} <small class="muted">(${r.total_jogadores} alunos)</small></span>
        <span class="total">${r.total}</span>
      `;
      el.appendChild(li);
    });
  }

  function initChatbot(adminName: string) {
    const chatbot = document.getElementById("admin-chatbot")!;
    const messagesEl = document.getElementById("chatbot-messages")!;
    const chatForm = document.getElementById("chatbot-input-form") as HTMLFormElement;
    const chatInput = document.getElementById("chatbot-input") as HTMLInputElement;
    const chatHeader = document.getElementById("chatbot-header")!;
    const chatToggleBtn = document.getElementById("btn-chatbot-toggle")!;
    const chatTitleEl = document.getElementById("chatbot-assistant-name")!;

    chatbot.classList.remove("hidden");
    chatTitleEl.textContent = `EuclidesAI · ${adminName}`;
    messagesEl.innerHTML = "";

    let greeting = `Olá, ${adminName}! Como posso ajudar hoje?`;
    if (adminName === "Plinyl") {
      greeting = "Salve Plinyl! 🚀 Código compilado e status verde. Quer que eu gerencie alguma rodada ou verifique as rotas da API? (Digite 'ajuda' para ver os comandos)";
    } else if (adminName === "Alisson") {
      greeting = "Olá Alisson! 🎙️ A plateia está animada. Está pronto para abrir a arena e iniciar uma nova rodada de apresentação?";
    } else if (adminName === "Rikelmy") {
      greeting = "Fala Rikelmy! 📐 Minigames calibrados e seguros contra trapaças. Deseja iniciar ou reiniciar os desafios?";
    } else if (adminName === "Lucas") {
      greeting = "Oi Lucas! 📝 Lista de alunos cadastrados pronta. Se precisar liberar novos apelidos ou gerenciar as turmas na arena, estou aqui.";
    } else if (adminName === "Marcelo") {
      greeting = "Saudações Marcelo! 💾 Backup do SQLite operacional. Histórico de partidas íntegro. Deseja exportar dados ou verificar logs?";
    }

    addMessage("assistant", greeting);

    function toggleMinimize() {
      chatbot.classList.toggle("minimized");
      const isMinimized = chatbot.classList.contains("minimized");
      chatToggleBtn.innerHTML = isMinimized
        ? `<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M4 11h16v2H4zm0-4h16v2H4zm0 8h16v2H4z" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M19 13H5v-2h14v2z" fill="currentColor"/></svg>`;
    }

    chatHeader.onclick = (e) => {
      if ((e.target as HTMLElement).closest("#btn-chatbot-toggle")) return;
      toggleMinimize();
    };

    chatToggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggleMinimize();
    };

    chatbot.querySelectorAll(".chat-shortcut").forEach((btn) => {
      (btn as HTMLButtonElement).onclick = () => {
        const cmd = (btn as HTMLElement).dataset.cmd || "";
        if (cmd) {
          chatInput.value = cmd;
          chatForm.dispatchEvent(new Event("submit"));
        }
      };
    });

    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;

      addMessage("user", query);
      chatInput.value = "";

      await processCommand(query);
    };

    function addMessage(sender: "user" | "assistant" | "system", text: string) {
      const msg = document.createElement("div");
      msg.className = `chat-msg ${sender}`;
      msg.innerHTML = `<p>${text}</p>`;
      messagesEl.appendChild(msg);
      const chatBody = document.getElementById("chatbot-body")!;
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function executeCommand(cmd: string, token: string) {
      if (cmd === "iniciar rodada") {
        addMessage("system", "Iniciando apresentação...");
        const checkboxes = document.querySelectorAll(
          '#admin-minigames-checks input[type="checkbox"]:checked'
        ) as NodeListOf<HTMLInputElement>;
        const minigamesPermitidos = Array.from(checkboxes).map((cb) => cb.value);
        try {
          const res = await adminIniciarRodada(
            token,
            `Apresentação via Chatbot (${adminName})`,
            minigamesPermitidos.length > 0 ? minigamesPermitidos : undefined
          );
          addMessage("assistant", `Comando executado: ${res.mensagem}`);
          void refreshDashboard(token);
        } catch (err) {
          addMessage("assistant", `Erro ao iniciar apresentação: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else if (cmd === "encerrar rodada") {
        addMessage("system", "Encerrando apresentação ativa...");
        try {
          const res = await adminEncerrarRodada(token);
          addMessage("assistant", `Comando executado: ${res.mensagem}`);
          void refreshDashboard(token);
        } catch (err) {
          addMessage("assistant", `Erro ao encerrar apresentação: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else if (cmd === "limpar rodada") {
        addMessage("system", "Limpando ranking temporário...");
        try {
          const res = await adminResetRodada(token);
          addMessage("assistant", `Comando executado: ${res.mensagem}`);
          void refreshDashboard(token);
        } catch (err) {
          addMessage("assistant", `Erro ao limpar ranking: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else if (cmd === "status") {
        addMessage("system", "Consultando status...");
        try {
          const stats = await adminStats(token);
          const rodadaInfo = stats.rodadaAtiva
            ? `Apresentação #${stats.rodadaAtiva.numero} ativa: "${stats.rodadaAtiva.titulo}"`
            : "Nenhuma apresentação ativa no momento.";
          addMessage(
            "assistant",
            `Painel do Servidor:
            • ${rodadaInfo}
            • Jogadores ativos: ${stats.jogadores}
            • Partidas registradas: ${stats.partidas}
            • Banco de dados: ${stats.banco}`
          );
        } catch (err) {
          addMessage("assistant", `Erro ao consultar: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else if (cmd === "exportar") {
        addMessage("system", "Exportando banco de dados...");
        try {
          const data = await adminExportCompleto(token);
          baixarArquivo(
            `euclides-test-chatbot-${Date.now()}.json`,
            JSON.stringify(data, null, 2),
            "application/json",
          );
          addMessage("assistant", "Backup baixado com sucesso!");
        } catch (err) {
          addMessage("assistant", `Erro ao exportar: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else if (cmd === "zerar tudo") {
        addMessage("system", "Limpando todo o banco de dados...");
        try {
          const res = await adminResetTotal(token);
          addMessage("assistant", `Banco limpo com sucesso: ${res.mensagem}`);
          void refreshDashboard(token);
        } catch (err) {
          addMessage("assistant", `Erro ao limpar tudo: ${err instanceof Error ? err.message : "Erro"}`);
        }
      } else {
        // Comandos genéricos processados no servidor, como banir/desbanir/expulsar/pontos
        void refreshDashboard(token);
      }
    }

    async function processCommand(rawText: string) {
      const token = carregarTokenAdmin();
      if (!token) {
        addMessage("system", "Erro: Administrador não autenticado.");
        return;
      }

      const textLower = rawText.toLowerCase().trim();
      if (textLower === "comandos" || textLower === "ajuda" || textLower === "help") {
        addMessage(
          "assistant",
          `Aqui estão os comandos de atalho:
          • <strong>iniciar rodada</strong>: Inicia uma apresentação
          • <strong>encerrar rodada</strong>: Encerra a rodada atual
          • <strong>limpar rodada</strong>: Zera o ranking temporário
          • <strong>status</strong>: Mostra informações do servidor
          • <strong>exportar</strong>: Baixa o backup completo em JSON
          • <strong>zerar tudo</strong>: Apaga todo o banco de dados (CUIDADO!)`
        );
        return;
      }

      addMessage("system", "Chamando assistente AI...");
      try {
        const result = await adminChatbotConversar(token, { mensagem: rawText, adminName });
        // Remover a mensagem de status da IA
        const systemMessages = messagesEl.querySelectorAll(".chat-msg.system");
        systemMessages.forEach((msg) => {
          if (msg.textContent?.includes("Chamando assistente AI...")) {
            msg.remove();
          }
        });
        
        addMessage("assistant", result.resposta);
        
        if (result.comando) {
          await executeCommand(result.comando, token);
        }
      } catch (err) {
        // Remover mensagem de status
        const systemMessages = messagesEl.querySelectorAll(".chat-msg.system");
        systemMessages.forEach((msg) => {
          if (msg.textContent?.includes("Chamando assistente AI...")) {
            msg.remove();
          }
        });
        addMessage("assistant", `Não consegui processar a mensagem: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      }
    }
  }

  const saved = carregarTokenAdmin();
  const savedName = sessionStorage.getItem("admin_name");
  if (saved) {
    showDashboard();
    if (savedName) {
      initChatbot(savedName);
    } else {
      initChatbot("Professor");
    }
    void refreshDashboard(saved);
  }
}

function renderRankingList(
  el: HTMLElement,
  ranking: { apelido: string; turma: string | null; total: number }[],
  vazio = "Vazio",
) {
  el.innerHTML = "";
  if (!ranking.length) {
    el.innerHTML = `<li class="ranking-empty"><span>${vazio}</span></li>`;
    return;
  }
  ranking.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="pos">${i + 1}º</span>
      <span>${r.apelido}</span>
      <span class="total">${r.total}</span>
    `;
    el.appendChild(li);
  });
}

function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}