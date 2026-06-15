import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("fracoes-visual")!;

const QUESTIONS = [
  {
    tipo: "pizza",
    html: `
      <svg viewBox="0 0 100 100" width="160" height="160">
        <path d="M50,50 L50,10 A40,40 0 0,1 90,50 Z" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <path d="M50,50 L90,50 A40,40 0 0,1 50,90 Z" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <path d="M50,50 L50,90 A40,40 0 0,1 10,50 Z" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <path d="M50,50 L10,50 A40,40 0 0,1 50,10 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-dasharray="3,3" stroke-width="2" />
      </svg>
    `,
    pergunta: "Qual fração representa a parte pintada da pizza?",
    opcoes: ["3/4", "1/4", "1/2", "2/3"],
    correta: "3/4"
  },
  {
    tipo: "barra",
    html: `
      <svg viewBox="0 0 200 60" width="200" height="60">
        <rect x="10" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="46" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="82" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="118" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="154" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "Qual fração representa a parte colorida da barra?",
    opcoes: ["3/5", "2/5", "4/5", "1/5"],
    correta: "3/5"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; gap: 10px; justify-content: center; font-size: 2.8rem; margin: 15px 0;">
        <span style="filter: drop-shadow(0 0 8px #22c55e); color: #22c55e;">⚽</span>
        <span style="filter: drop-shadow(0 0 8px #22c55e); color: #22c55e;">⚽</span>
        <span style="filter: drop-shadow(0 0 8px #22c55e); color: #22c55e;">⚽</span>
        <span style="filter: drop-shadow(0 0 8px #22c55e); color: #22c55e;">⚽</span>
        <span style="filter: drop-shadow(0 0 8px #22c55e); color: #22c55e;">⚽</span>
        <span style="opacity: 0.2;">⚽</span>
        <span style="opacity: 0.2;">⚽</span>
        <span style="opacity: 0.2;">⚽</span>
      </div>
    `,
    pergunta: "Quantas bolas de futebol estão destacadas do grupo no total de 8?",
    opcoes: ["5/8", "3/8", "1/2", "4/8"],
    correta: "5/8"
  },
  {
    tipo: "pizza",
    html: `
      <svg viewBox="0 0 100 100" width="160" height="160">
        <path d="M50,50 L50,10 A40,40 0 0,1 78.28,21.72 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L78.28,21.72 A40,40 0 0,1 90,50 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L90,50 A40,40 0 0,1 78.28,78.28 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L78.28,78.28 A40,40 0 0,1 50,90 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="1.5" />
        
        <path d="M50,50 L50,90 A40,40 0 0,1 21.72,78.28 Z" fill="#22c55e" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L21.72,78.28 A40,40 0 0,1 10,50 Z" fill="#22c55e" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L10,50 A40,40 0 0,1 21.72,21.72 Z" fill="#22c55e" stroke="#fff" stroke-width="1.5" />
        <path d="M50,50 L21.72,21.72 A40,40 0 0,1 50,10 Z" fill="#22c55e" stroke="#fff" stroke-width="1.5" />
      </svg>
    `,
    pergunta: "Qual fração do círculo está preenchida?",
    opcoes: ["4/8", "2/8", "6/8", "3/8"],
    correta: "4/8"
  },
  {
    tipo: "barra",
    html: `
      <svg viewBox="0 0 240 60" width="240" height="60">
        <rect x="10" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="46" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="82" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="118" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="154" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="190" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "Indique qual fração está colorida de verde:",
    opcoes: ["2/6", "3/6", "4/6", "1/6"],
    correta: "2/6"
  },
  {
    tipo: "grid",
    html: `
      <svg viewBox="0 0 100 100" width="160" height="160">
        <rect x="5" y="5" width="28" height="28" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="36" y="5" width="28" height="28" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="67" y="5" width="28" height="28" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="5" y="36" width="28" height="28" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="36" y="36" width="28" height="28" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="67" y="36" width="28" height="28" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="5" y="67" width="28" height="28" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="36" y="67" width="28" height="28" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="67" y="67" width="28" height="28" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "Qual fração do quadrado grid 3x3 está preenchida de verde?",
    opcoes: ["4/9", "3/9", "5/9", "2/3"],
    correta: "4/9"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; gap: 10px; justify-content: center; font-size: 2.8rem; margin: 15px 0;">
        <span style="filter: drop-shadow(0 0 8px #eab308); color: #eab308;">⭐</span>
        <span style="filter: drop-shadow(0 0 8px #eab308); color: #eab308;">⭐</span>
        <span style="filter: drop-shadow(0 0 8px #eab308); color: #eab308;">⭐</span>
        <span style="opacity: 0.2;">⭐</span>
        <span style="opacity: 0.2;">⭐</span>
      </div>
    `,
    pergunta: "Qual fração representa as estrelas brilhantes no grupo de 5?",
    opcoes: ["3/5", "2/5", "1/2", "3/4"],
    correta: "3/5"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; font-size: 2.2rem; margin: 15px 0; max-width: 250px; margin: auto;">
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="color: #ef4444;">🍎</span>
        <span style="opacity: 0.2;">🍎</span>
        <span style="opacity: 0.2;">🍎</span>
        <span style="opacity: 0.2;">🍎</span>
      </div>
    `,
    pergunta: "Qual fração do grupo de 10 maçãs está destacada em vermelho?",
    opcoes: ["7/10", "6/10", "8/10", "3/10"],
    correta: "7/10"
  },
  {
    tipo: "pizza",
    html: `
      <svg viewBox="0 0 100 100" width="160" height="160">
        <path d="M50,50 L50,10 A40,40 0 0,1 90,50 Z" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <path d="M50,50 L90,50 A40,40 0 0,1 50,90 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-dasharray="3,3" stroke-width="2" />
        <path d="M50,50 L50,90 A40,40 0 0,1 10,50 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-dasharray="3,3" stroke-width="2" />
        <path d="M50,50 L10,50 A40,40 0 0,1 50,10 Z" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-dasharray="3,3" stroke-width="2" />
      </svg>
    `,
    pergunta: "Qual fração de um círculo de 4 partes representa o setor verde?",
    opcoes: ["1/4", "3/4", "1/2", "1/3"],
    correta: "1/4"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; gap: 8px; justify-content: center; font-size: 2.5rem; margin: 15px 0;">
        <span style="color: #3b82f6;">📚</span>
        <span style="color: #3b82f6;">📚</span>
        <span style="color: #3b82f6;">📚</span>
        <span style="color: #3b82f6;">📚</span>
        <span style="color: #3b82f6;">📚</span>
        <span style="opacity: 0.2;">📚</span>
      </div>
    `,
    pergunta: "Qual fração de livros está destacada do total de 6 livros?",
    opcoes: ["5/6", "4/6", "1/6", "2/3"],
    correta: "5/6"
  },
  {
    tipo: "barra",
    html: `
      <svg viewBox="0 0 120 60" width="150" height="60">
        <rect x="10" y="10" width="32" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="42" y="10" width="32" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="74" y="10" width="32" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "A fração correspondente à barra pintada de verde no total de 3 partes é:",
    opcoes: ["1/3", "2/3", "1/2", "1/4"],
    correta: "1/3"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; font-size: 2.2rem; margin: 15px 0; max-width: 250px; margin: auto;">
        <span style="color: #eab308;">🏆</span>
        <span style="color: #eab308;">🏆</span>
        <span style="color: #eab308;">🏆</span>
        <span style="color: #eab308;">🏆</span>
        <span style="color: #eab308;">🏆</span>
        <span style="color: #eab308;">🏆</span>
        <span style="opacity: 0.2;">🏆</span>
        <span style="opacity: 0.2;">🏆</span>
        <span style="opacity: 0.2;">🏆</span>
      </div>
    `,
    pergunta: "Qual fração representa os troféus brilhantes do total de 9?",
    opcoes: ["6/9", "3/9", "2/3", "5/9"],
    correta: "6/9"
  },
  {
    tipo: "grid",
    html: `
      <svg viewBox="0 0 140 80" width="160" height="90">
        <rect x="5" y="5" width="30" height="30" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="38" y="5" width="30" height="30" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="71" y="5" width="30" height="30" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="104" y="5" width="30" height="30" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="5" y="38" width="30" height="30" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="38" y="38" width="30" height="30" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="71" y="38" width="30" height="30" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="104" y="38" width="30" height="30" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "Qual fração representa os retângulos verdes nesta grade de 2x4?",
    opcoes: ["3/8", "5/8", "4/8", "2/8"],
    correta: "3/8"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; gap: 10px; justify-content: center; font-size: 2.8rem; margin: 15px 0;">
        <span style="color: #ec4899;">✏️</span>
        <span style="color: #ec4899;">✏️</span>
        <span style="opacity: 0.2;">✏️</span>
      </div>
    `,
    pergunta: "Qual fração representa os lápis destacados do grupo de 3?",
    opcoes: ["2/3", "1/3", "1/2", "3/4"],
    correta: "2/3"
  },
  {
    tipo: "barra",
    html: `
      <svg viewBox="0 0 320 60" width="280" height="60">
        <rect x="10" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="46" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="82" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="118" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="154" y="10" width="36" height="40" fill="#22c55e" stroke="#fff" stroke-width="2" />
        <rect x="190" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="226" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
        <rect x="262" y="10" width="36" height="40" fill="rgba(255,255,255,0.08)" stroke="#fff" stroke-width="2" />
      </svg>
    `,
    pergunta: "Identifique a fração verde da barra dividida em 8 partes:",
    opcoes: ["5/8", "3/8", "4/8", "6/8"],
    correta: "5/8"
  },
  {
    tipo: "copos",
    html: `
      <div style="display: flex; gap: 8px; justify-content: center; font-size: 2.5rem; margin: 15px 0;">
        <span style="color: #eab308;">🚗</span>
        <span style="color: #eab308;">🚗</span>
        <span style="color: #eab308;">🚗</span>
        <span style="color: #eab308;">🚗</span>
        <span style="opacity: 0.2;">🚗</span>
        <span style="opacity: 0.2;">🚗</span>
        <span style="opacity: 0.2;">🚗</span>
      </div>
    `,
    pergunta: "Qual fração representa os carros destacados no grupo de 7?",
    opcoes: ["4/7", "3/7", "5/7", "1/2"],
    correta: "4/7"
  }
];

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

  const ui = montarShell(
    container,
    META,
    `<div class="visual-figure-container" id="fv-figure" style="margin-bottom:15px; display:flex; justify-content:center; align-items:center;"></div>
     <p class="mg-prompt" id="fv-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;"></p>
     <div class="options-grid" id="fv-options"></div>
     <div class="feedback-area hidden" id="fv-feedback" style="margin-top:15px;">
       <p id="fv-feedback-text"></p>
       <button type="button" id="btn-fv-next" class="btn primary btn-sm">Próxima</button>
     </div>`,
  );

  const elFigure = document.getElementById("fv-figure")!;
  const elPrompt = document.getElementById("fv-prompt")!;
  const elOptions = document.getElementById("fv-options")!;
  const elFeedback = document.getElementById("fv-feedback")!;
  const elFeedbackText = document.getElementById("fv-feedback-text")!;
  const btnNext = document.getElementById("btn-fv-next")!;

  function obterPontosAtuais() {
    return Math.round((acertos / QUESTIONS.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${QUESTIONS.length} · ${obterPontosAtuais()} pts`);
  }

  function renderQuestao() {
    if (indice >= QUESTIONS.length) {
      void encerrar("Todas as questões respondidas!");
      return;
    }

    const q = QUESTIONS[indice];
    elFigure.innerHTML = q.html;
    elPrompt.textContent = q.pergunta;
    elOptions.innerHTML = "";
    elFeedback.classList.add("hidden");
    atualizarScore();

    q.opcoes.forEach((opt) => {
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
    const q = QUESTIONS[indice];
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
  }

  btnNext.addEventListener("click", () => {
    renderQuestao();
  });

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
