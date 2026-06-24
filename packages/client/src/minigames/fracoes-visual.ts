import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("fracoes-visual")!;

interface FractionConfig {
  tipo: "pizza" | "barra" | "grid" | "grupo";
  total?: number;
  pintadas: number;
  pergunta: string;
  opcoes: string[];
  correta: string;
  cols?: number;
  rows?: number;
  emoji?: string;
}

const CONFIGS: FractionConfig[] = [
  // Pizza configurations (14 questions)
  { tipo: "pizza", total: 2, pintadas: 1, pergunta: "Qual fração representa a parte pintada da pizza?", opcoes: ["1/2", "1/3", "1/4", "2/3"], correta: "1/2" },
  { tipo: "pizza", total: 3, pintadas: 1, pergunta: "Qual fração representa a fatia verde da pizza?", opcoes: ["1/3", "2/3", "1/2", "3/4"], correta: "1/3" },
  { tipo: "pizza", total: 3, pintadas: 2, pergunta: "Qual a fração correspondente à parte pintada?", opcoes: ["2/3", "1/3", "1/2", "2/4"], correta: "2/3" },
  { tipo: "pizza", total: 4, pintadas: 1, pergunta: "Que fração da pizza está colorida de verde?", opcoes: ["1/4", "2/4", "3/4", "1/2"], correta: "1/4" },
  { tipo: "pizza", total: 4, pintadas: 3, pergunta: "Indique a fração que representa a parte pintada da pizza:", opcoes: ["3/4", "1/4", "1/2", "2/3"], correta: "3/4" },
  { tipo: "pizza", total: 5, pintadas: 1, pergunta: "Qual fração do círculo está verde?", opcoes: ["1/5", "2/5", "1/4", "3/5"], correta: "1/5" },
  { tipo: "pizza", total: 5, pintadas: 2, pergunta: "Identifique a fração pintada no círculo:", opcoes: ["2/5", "3/5", "1/5", "1/2"], correta: "2/5" },
  { tipo: "pizza", total: 5, pintadas: 3, pergunta: "Qual fração representa a parte colorida?", opcoes: ["3/5", "2/5", "4/5", "3/4"], correta: "3/5" },
  { tipo: "pizza", total: 5, pintadas: 4, pergunta: "Qual a fração da pizza que está colorida?", opcoes: ["4/5", "3/5", "1/5", "1/2"], correta: "4/5" },
  { tipo: "pizza", total: 6, pintadas: 1, pergunta: "Qual fração representa a parte pintada?", opcoes: ["1/6", "5/6", "1/3", "1/2"], correta: "1/6" },
  { tipo: "pizza", total: 6, pintadas: 5, pergunta: "Que fração do círculo está verde?", opcoes: ["5/6", "1/6", "4/6", "2/3"], correta: "5/6" },
  { tipo: "pizza", total: 8, pintadas: 3, pergunta: "Indique a fração correspondente às partes coloridas:", opcoes: ["3/8", "5/8", "1/8", "1/2"], correta: "3/8" },
  { tipo: "pizza", total: 8, pintadas: 5, pergunta: "Qual a fração pintada deste círculo?", opcoes: ["5/8", "3/8", "7/8", "1/2"], correta: "5/8" },
  { tipo: "pizza", total: 8, pintadas: 7, pergunta: "Qual a fração correspondente à área verde?", opcoes: ["7/8", "5/8", "6/8", "3/4"], correta: "7/8" },
  
  // Barra configurations (15 questions)
  { tipo: "barra", total: 3, pintadas: 1, pergunta: "Qual fração representa a parte colorida da barra?", opcoes: ["1/3", "2/3", "1/2", "1/4"], correta: "1/3" },
  { tipo: "barra", total: 3, pintadas: 2, pergunta: "Qual a fração verde desta barra?", opcoes: ["2/3", "1/3", "1/2", "3/4"], correta: "2/3" },
  { tipo: "barra", total: 4, pintadas: 1, pergunta: "Qual fração está pintada de verde na barra?", opcoes: ["1/4", "2/4", "3/4", "1/3"], correta: "1/4" },
  { tipo: "barra", total: 4, pintadas: 3, pergunta: "Identifique a fração da barra que está colorida:", opcoes: ["3/4", "1/4", "1/2", "2/3"], correta: "3/4" },
  { tipo: "barra", total: 5, pintadas: 2, pergunta: "Que fração da barra está preenchida?", opcoes: ["2/5", "3/5", "1/5", "4/5"], correta: "2/5" },
  { tipo: "barra", total: 5, pintadas: 3, pergunta: "Qual fração representa a parte colorida?", opcoes: ["3/5", "2/5", "4/5", "1/2"], correta: "3/5" },
  { tipo: "barra", total: 5, pintadas: 4, pergunta: "Qual a fração verde da barra de 5 divisões?", opcoes: ["4/5", "3/5", "2/5", "1/5"], correta: "4/5" },
  { tipo: "barra", total: 6, pintadas: 1, pergunta: "Identifique a fração correspondente à barra pintada:", opcoes: ["1/6", "2/6", "3/6", "5/6"], correta: "1/6" },
  { tipo: "barra", total: 6, pintadas: 5, pergunta: "Que fração da barra está verde?", opcoes: ["5/6", "1/6", "4/6", "3/6"], correta: "5/6" },
  { tipo: "barra", total: 7, pintadas: 3, pergunta: "Qual fração representa a parte colorida?", opcoes: ["3/7", "4/7", "2/7", "5/7"], correta: "3/7" },
  { tipo: "barra", total: 7, pintadas: 4, pergunta: "Qual fração desta barra de 7 divisões está pintada?", opcoes: ["4/7", "3/7", "5/7", "2/7"], correta: "4/7" },
  { tipo: "barra", total: 8, pintadas: 3, pergunta: "Indique a fração verde da barra:", opcoes: ["3/8", "5/8", "4/8", "2/8"], correta: "3/8" },
  { tipo: "barra", total: 8, pintadas: 5, pergunta: "Qual a fração correspondente à parte pintada?", opcoes: ["5/8", "3/8", "7/8", "1/2"], correta: "5/8" },
  { tipo: "barra", total: 10, pintadas: 3, pergunta: "Qual fração da barra de 10 partes está verde?", opcoes: ["3/10", "7/10", "4/10", "5/10"], correta: "3/10" },
  { tipo: "barra", total: 10, pintadas: 7, pergunta: "Identifique a fração correspondente à parte colorida:", opcoes: ["7/10", "3/10", "8/10", "6/10"], correta: "7/10" },

  // Grid configurations (10 questions)
  { tipo: "grid", cols: 2, rows: 2, pintadas: 1, pergunta: "Qual fração da grade 2x2 está verde?", opcoes: ["1/4", "2/4", "3/4", "1/2"], correta: "1/4" },
  { tipo: "grid", cols: 2, rows: 2, pintadas: 3, pergunta: "Que fração do grid 2x2 está colorida?", opcoes: ["3/4", "1/4", "1/2", "2/3"], correta: "3/4" },
  { tipo: "grid", cols: 3, rows: 2, pintadas: 2, pergunta: "Qual fração da grade 3x2 está verde?", opcoes: ["2/6", "3/6", "4/6", "1/6"], correta: "2/6" },
  { tipo: "grid", cols: 3, rows: 2, pintadas: 5, pergunta: "Identifique a fração correspondente à grade 3x2 pintada:", opcoes: ["5/6", "4/6", "1/6", "3/6"], correta: "5/6" },
  { tipo: "grid", cols: 3, rows: 3, pintadas: 2, pergunta: "Que fração do grid 3x3 está verde?", opcoes: ["2/9", "3/9", "4/9", "1/3"], correta: "2/9" },
  { tipo: "grid", cols: 3, rows: 3, pintadas: 4, pergunta: "Qual fração do quadrado grid 3x3 está pintada?", opcoes: ["4/9", "3/9", "5/9", "6/9"], correta: "4/9" },
  { tipo: "grid", cols: 3, rows: 3, pintadas: 5, pergunta: "Indique a fração correspondente ao grid verde:", opcoes: ["5/9", "4/9", "6/9", "7/9"], correta: "5/9" },
  { tipo: "grid", cols: 3, rows: 3, pintadas: 7, pergunta: "Qual a fração pintada desta grade 3x3?", opcoes: ["7/9", "6/9", "8/9", "5/9"], correta: "7/9" },
  { tipo: "grid", cols: 4, rows: 3, pintadas: 5, pergunta: "Que fração da grade 4x3 está colorida?", opcoes: ["5/12", "7/12", "6/12", "4/12"], correta: "5/12" },
  { tipo: "grid", cols: 4, rows: 3, pintadas: 7, pergunta: "Qual fração da grade 4x3 representa a parte verde?", opcoes: ["7/12", "5/12", "8/12", "9/12"], correta: "7/12" },

  // Grupo configurations (14 questions)
  { tipo: "grupo", emoji: "⚽", total: 3, pintadas: 1, pergunta: "Qual fração representa as bolas destacadas do grupo?", opcoes: ["1/3", "2/3", "1/2", "1/4"], correta: "1/3" },
  { tipo: "grupo", emoji: "⚽", total: 3, pintadas: 2, pergunta: "Qual fração representa as bolas brilhantes do grupo?", opcoes: ["2/3", "1/3", "1/2", "3/4"], correta: "2/3" },
  { tipo: "grupo", emoji: "⭐", total: 4, pintadas: 1, pergunta: "Qual fração representa as estrelas acesas do grupo?", opcoes: ["1/4", "2/4", "3/4", "1/2"], correta: "1/4" },
  { tipo: "grupo", emoji: "⭐", total: 4, pintadas: 3, pergunta: "Qual fração das estrelas está brilhando?", opcoes: ["3/4", "1/4", "2/4", "2/3"], correta: "3/4" },
  { tipo: "grupo", emoji: "🍎", total: 5, pintadas: 2, pergunta: "Que fração das maçãs está vermelha e brilhante?", opcoes: ["2/5", "3/5", "1/5", "4/5"], correta: "2/5" },
  { tipo: "grupo", emoji: "🍎", total: 5, pintadas: 3, pergunta: "Qual a fração correspondente às maçãs destacadas?", opcoes: ["3/5", "2/5", "4/5", "1/5"], correta: "3/5" },
  { tipo: "grupo", emoji: "🏆", total: 6, pintadas: 5, pergunta: "Qual fração representa os troféus dourados no grupo?", opcoes: ["5/6", "4/6", "1/6", "2/6"], correta: "5/6" },
  { tipo: "grupo", emoji: "🚗", total: 7, pintadas: 4, pergunta: "Qual fração representa os carros destacados do total?", opcoes: ["4/7", "3/7", "5/7", "2/7"], correta: "4/7" },
  { tipo: "grupo", emoji: "📚", total: 8, pintadas: 3, pergunta: "Qual fração de livros está destacada do total?", opcoes: ["3/8", "5/8", "4/8", "2/8"], correta: "3/8" },
  { tipo: "grupo", emoji: "📚", total: 8, pintadas: 5, pergunta: "Qual a fração correspondente aos livros destacados?", opcoes: ["5/8", "3/8", "7/8", "4/8"], correta: "5/8" },
  { tipo: "grupo", emoji: "🦖", total: 9, pintadas: 4, pergunta: "Que fração de dinossauros está acesa no grupo?", opcoes: ["4/9", "5/9", "3/9", "6/9"], correta: "4/9" },
  { tipo: "grupo", emoji: "🦖", total: 9, pintadas: 5, pergunta: "Qual fração do grupo de dinossauros está destacada?", opcoes: ["5/9", "4/9", "6/9", "3/9"], correta: "5/9" },
  { tipo: "grupo", emoji: "🎈", total: 10, pintadas: 3, pergunta: "Qual a fração de balões destacados no grupo?", opcoes: ["3/10", "7/10", "4/10", "5/10"], correta: "3/10" },
  { tipo: "grupo", emoji: "🎈", total: 10, pintadas: 7, pergunta: "Qual fração dos balões está colorida?", opcoes: ["7/10", "3/10", "8/10", "6/10"], correta: "7/10" }
];

function gerarPizzaHTML(total: number, pintadas: number): string {
  let paths = "";
  for (let i = 0; i < total; i++) {
    const angle1 = (i * 360) / total;
    const angle2 = ((i + 1) * 360) / total;
    
    const rad1 = (angle1 * Math.PI) / 180 - Math.PI / 2;
    const rad2 = (angle2 * Math.PI) / 180 - Math.PI / 2;
    
    const x1 = 50 + 40 * Math.cos(rad1);
    const y1 = 50 + 40 * Math.sin(rad1);
    
    const x2 = 50 + 40 * Math.cos(rad2);
    const y2 = 50 + 40 * Math.sin(rad2);
    
    const fill = i < pintadas ? "#22c55e" : "rgba(255,255,255,0.08)";
    const dash = i < pintadas ? "" : 'stroke-dasharray="3,3"';
    paths += `<path d="M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A40,40 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}" stroke="#fff" stroke-width="1.8" ${dash} />`;
  }
  return `<svg viewBox="0 0 100 100" width="160" height="160">${paths}</svg>`;
}

function gerarBarraHTML(total: number, pintadas: number): string {
  const widthAvailable = 180;
  const w = widthAvailable / total;
  let rects = "";
  for (let i = 0; i < total; i++) {
    const x = 10 + i * w;
    const fill = i < pintadas ? "#22c55e" : "rgba(255,255,255,0.08)";
    rects += `<rect x="${x.toFixed(2)}" y="10" width="${(w - 2).toFixed(2)}" height="40" fill="${fill}" stroke="#fff" stroke-width="2" rx="3" />`;
  }
  return `<svg viewBox="0 0 200 60" width="200" height="60">${rects}</svg>`;
}

function gerarGridHTML(cols: number, rows: number, pintadas: number): string {
  const sq = 28;
  const gap = 5;
  const totalW = cols * sq + (cols - 1) * gap;
  const totalH = rows * sq + (rows - 1) * gap;
  
  const startX = (100 - totalW) / 2;
  const startY = (100 - totalH) / 2;
  
  let rects = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = startX + c * (sq + gap);
      const y = startY + r * (sq + gap);
      const fill = idx < pintadas ? "#22c55e" : "rgba(255,255,255,0.08)";
      rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${sq}" height="${sq}" fill="${fill}" stroke="#fff" stroke-width="1.8" rx="2" />`;
    }
  }
  return `<svg viewBox="0 0 100 100" width="160" height="160">${rects}</svg>`;
}

function gerarGrupoHTML(emoji: string, total: number, pintadas: number): string {
  let spans = "";
  const colorClass = emoji === "⚽" || emoji === "🏆" ? "color: #22c55e;" : emoji === "⭐" ? "color: #eab308;" : emoji === "🍎" ? "color: #ef4444;" : "color: #3b82f6;";
  const glow = emoji === "⚽" || emoji === "🏆" ? "filter: drop-shadow(0 0 8px #22c55e);" : emoji === "⭐" ? "filter: drop-shadow(0 0 8px #eab308);" : emoji === "🍎" ? "filter: drop-shadow(0 0 8px #ef4444);" : "filter: drop-shadow(0 0 8px #3b82f6);";
  
  for (let i = 0; i < total; i++) {
    if (i < pintadas) {
      spans += `<span style="${glow} ${colorClass}">${emoji}</span>`;
    } else {
      spans += `<span style="opacity: 0.25;">${emoji}</span>`;
    }
  }
  return `<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; font-size: 2.6rem; margin: 15px 0; max-width: 280px; margin: auto;">${spans}</div>`;
}

interface Questao {
  tipo: string;
  html: string;
  pergunta: string;
  opcoes: string[];
  correta: string;
}

// Convert configs to real questions
const QUESTIONS: Questao[] = CONFIGS.map((c) => {
  let html = "";
  if (c.tipo === "pizza") {
    html = gerarPizzaHTML(c.total || 4, c.pintadas);
  } else if (c.tipo === "barra") {
    html = gerarBarraHTML(c.total || 5, c.pintadas);
  } else if (c.tipo === "grid") {
    html = gerarGridHTML(c.cols || 3, c.rows || 3, c.pintadas);
  } else if (c.tipo === "grupo") {
    html = gerarGrupoHTML(c.emoji || "⚽", c.total || 5, c.pintadas);
  }
  return {
    tipo: c.tipo,
    html,
    pergunta: c.pergunta,
    opcoes: c.opcoes,
    correta: c.correta
  };
});

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarFracoesVisual(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const container = document.getElementById("game-container")!;
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let finalizado = false;
  let pararTimer = () => {};
  let indice = 0;
  let acertos = 0;
  // Shuffle questions at startup
  const jogoQuestoes = embaralhar(QUESTIONS);

  const ui = montarShell(
    container,
    META,
    `<div class="visual-figure-container" id="fv-figure" style="margin-bottom:15px; display:flex; justify-content:center; align-items:center;"></div>
     <p class="mg-prompt" id="fv-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;"></p>
     <div class="options-grid" id="fv-options"></div>
     <div class="feedback-area hidden" id="fv-feedback" style="margin-top:15px;">
       <p id="fv-feedback-text" style="margin: 0; text-align: center; font-size: 1.1rem;"></p>
     </div>`,
  );

  const elFigure = document.getElementById("fv-figure")!;
  const elPrompt = document.getElementById("fv-prompt")!;
  const elOptions = document.getElementById("fv-options")!;
  const elFeedback = document.getElementById("fv-feedback")!;
  const elFeedbackText = document.getElementById("fv-feedback-text")!;

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function renderQuestao() {
    if (indice >= jogoQuestoes.length) {
      void encerrar("Todas as questões respondidas!");
      return;
    }

    const q = jogoQuestoes[indice]!;
    elFigure.innerHTML = q.html;
    elPrompt.textContent = q.pergunta;
    elOptions.innerHTML = "";
    elFeedback.classList.add("hidden");
    atualizarScore();
    ui.resetSpeedBar?.();

    const opcoesEmbaralhadas = embaralhar(q.opcoes);
    opcoesEmbaralhadas.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost select-option-btn";
      btn.textContent = opt;
      btn.style.fontSize = "1.2rem";
      btn.style.padding = "12px";
      btn.addEventListener("click", () => verificarResposta(opt));
      elOptions.appendChild(btn);
    });
  }

  function verificarResposta(selected: string) {
    if (finalizado) return;
    const q = jogoQuestoes[indice]!;
    const optsButtons = elOptions.querySelectorAll("button");

    optsButtons.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
      if (btn.textContent === q.correta) {
        btn.className = "btn primary";
      } else if (btn.textContent === selected) {
        btn.className = "btn danger";
      }
    });

    const acertou = selected === q.correta;
    if (acertou) {
      acertos++;
      elFeedbackText.innerHTML = "<span style='color: var(--success); font-weight: bold;'>Certo! 🎨✨</span> Representação correta.";
    } else {
      elFeedbackText.innerHTML = `<span style='color: var(--danger); font-weight: bold;'>Incorreto! ❌</span> A resposta correta era <strong>${q.correta}</strong>.`;
    }

    indice++;
    atualizarScore();
    elFeedback.classList.remove("hidden");

    // Auto-proceed after 1300ms
    setTimeout(() => {
      renderQuestao();
    }, 1300);
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    
    const pontosFinais = obterPontosAtuais();
    await finalizarMinigame({
      jogador,
      meta: META,
      partidaId,
      tokenSeguranca,
      inicio,
      protecao,
      pontos: pontosFinais,
      onFim,
      ui,
      metadata: { acertos, total: QUESTIONS.length, motivo },
      mensagem: `${motivo} · ${acertos}/${QUESTIONS.length} certas`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );

  renderQuestao();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}
