import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("logica")!;

const QUESTIONS = [
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">⚽ + ⚽ = 10</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">⚽ + 🏆 = 9</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🏆 + 👕 = 7</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">⚽ + 🏆 × 👕 = ?</div>
    `,
    opcoes: ["17", "27", "14", "19"],
    correta: "17"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍎 + 🍎 = 12</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍎 + 🍌 = 9</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍌 + 🥑 = 5</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🍎 × 🍌 - 🥑 = ?</div>
    `,
    opcoes: ["16", "10", "15", "12"],
    correta: "16"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🥇 + 🥇 = 8</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🥇 + ⚽ = 7</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">⚽ × 🏆 = 12</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🏆 + 🥇 × ⚽ = ?</div>
    `,
    opcoes: ["16", "24", "12", "20"],
    correta: "16"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍔 + 🍔 = 8</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍔 + 🍟 = 7</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍟 + 🥤 = 5</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🍔 × 🍟 + 🥤 = ?</div>
    `,
    opcoes: ["14", "20", "12", "15"],
    correta: "14"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🚗 + 🚗 = 10</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🚗 + 🚲 = 7</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🚲 × 🛴 = 8</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🚗 + 🚲 × 🛴 = ?</div>
    `,
    opcoes: ["13", "28", "11", "15"],
    correta: "13"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍕 + 🍕 = 12</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍕 + 🍩 = 10</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍩 + 🍦 = 7</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🍕 × 🍩 - 🍦 = ?</div>
    `,
    opcoes: ["21", "25", "18", "23"],
    correta: "21"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🎈 + 🎈 = 16</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🎈 - 🎁 = 5</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🎁 + 🧸 = 7</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🎈 + 🎁 × 🧸 = ?</div>
    `,
    opcoes: ["20", "44", "15", "22"],
    correta: "20"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🐱 + 🐱 = 6</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🐱 × 🐶 = 15</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🐶 - 🐹 = 3</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🐱 + 🐶 × 🐹 = ?</div>
    `,
    opcoes: ["13", "16", "11", "18"],
    correta: "13"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🚀 + 🚀 = 20</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🚀 + 🛸 = 15</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🛸 + 👾 = 8</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🚀 × 👾 - 🛸 = ?</div>
    `,
    opcoes: ["25", "45", "20", "30"],
    correta: "25"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🦁 + 🦁 = 14</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🦁 + 🐯 = 11</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🐯 × 🦊 = 12</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🦁 + 🐯 × 🦊 = ?</div>
    `,
    opcoes: ["19", "33", "14", "21"],
    correta: "19"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">☀️ + ☀️ = 18</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">☀️ + ☁️ = 14</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">☁️ - ❄️ = 2</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">☀️ × ❄️ + ☁️ = ?</div>
    `,
    opcoes: ["32", "42", "27", "35"],
    correta: "32"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">⚽ + ⚽ = 12</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">⚽ + 🏀 = 14</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🏀 - 🏈 = 3</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">⚽ × 🏈 + 🏀 = ?</div>
    `,
    opcoes: ["38", "68", "32", "40"],
    correta: "38"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🧁 + 🧁 = 10</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🧁 + 🍫 = 12</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🍫 - 🍬 = 5</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🧁 × 🍬 + 🍫 = ?</div>
    `,
    opcoes: ["17", "24", "15", "19"],
    correta: "17"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🌵 + 🌵 = 8</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🌵 × 🌸 = 20</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🌸 + 🍁 = 11</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🌵 × 🍁 - 🌸 = ?</div>
    `,
    opcoes: ["19", "25", "15", "21"],
    correta: "19"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🔑 + 🔑 = 14</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🔑 + 🔒 = 12</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">🔒 × 🔔 = 20</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">🔑 + 🔒 × 🔔 = ?</div>
    `,
    opcoes: ["27", "48", "23", "25"],
    correta: "27"
  },
  {
    equations: `
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">💎 + 💎 = 16</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">💎 + 👑 = 14</div>
      <div class="logic-eq-row" style="margin-bottom: 8px; font-size: 1.4rem;">👑 - 🕶️ = 1</div>
      <div class="logic-eq-row" style="font-weight: bold; color: var(--gold); font-size: 1.6rem; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">💎 × 🕶️ - 👑 = ?</div>
    `,
    opcoes: ["34", "46", "32", "38"],
    correta: "34"
  }
];

export function iniciarLogica(
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
    `<div class="logic-equations-container" id="lg-eqs" style="margin-bottom: 15px;"></div>
     <p class="mg-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;">Resolva a última linha respeitando as regras matemáticas:</p>
     <div class="options-grid" id="lg-options"></div>
     <div class="feedback-area hidden" id="lg-feedback" style="margin-top:15px;">
       <p id="lg-feedback-text"></p>
       <button type="button" id="btn-lg-next" class="btn primary btn-sm">Próxima</button>
     </div>`,
  );

  const elEqs = document.getElementById("lg-eqs")!;
  const elOptions = document.getElementById("lg-options")!;
  const elFeedback = document.getElementById("lg-feedback")!;
  const elFeedbackText = document.getElementById("lg-feedback-text")!;
  const btnNext = document.getElementById("btn-lg-next")!;

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
    elEqs.innerHTML = q.equations;
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
      elFeedbackText.innerHTML = "<span style='color: var(--success); font-weight: bold;'>Certo! 🧠 Excelente!</span> Equação resolvida respeitando a ordem de operações.";
    } else {
      elFeedbackText.innerHTML = `<span style='color: var(--danger); font-weight: bold;'>Errado! ❌</span> Lembre-se de multiplicar antes de somar. A resposta era <strong>${q.correta}</strong>.`;
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
