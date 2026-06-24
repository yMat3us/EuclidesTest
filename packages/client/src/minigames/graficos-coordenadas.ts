import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("graficos-coordenadas")!;
const MIN = -5;
const MAX = 5;

interface Alvo {
  x: number;
  y: number;
  label: string;
}

const ALVOS_DATA: Alvo[] = [
  { x: 2, y: 3, label: "(2, 3)" },
  { x: -3, y: 1, label: "(-3, 1)" },
  { x: 4, y: -2, label: "(4, -2)" },
  { x: -2, y: -4, label: "(-2, -4)" },
  { x: 0, y: 5, label: "(0, 5)" },
  { x: -5, y: 0, label: "(-5, 0)" },
  { x: 3, y: -3, label: "(3, -3)" },
  { x: 1, y: 4, label: "(1, 4)" },
  { x: -4, y: 3, label: "(-4, 3)" },
  { x: 5, y: 2, label: "(5, 2)" },
  
  { x: -1, y: 2, label: "(-1, 2)" },
  { x: 2, y: -2, label: "(2, -2)" },
  { x: -2, y: 2, label: "(-2, 2)" },
  { x: 3, y: 1, label: "(3, 1)" },
  { x: -1, y: -1, label: "(-1, -1)" },
  { x: 4, y: 4, label: "(4, 4)" },
  { x: -4, y: -4, label: "(-4, -4)" },
  { x: 5, y: -5, label: "(5, -5)" },
  { x: -5, y: 5, label: "(-5, 5)" },
  { x: 0, y: -3, label: "(0, -3)" },
  
  { x: 2, y: 0, label: "(2, 0)" },
  { x: -3, y: -3, label: "(-3, -3)" },
  { x: 4, y: 1, label: "(4, 1)" },
  { x: -1, y: 4, label: "(-1, 4)" },
  { x: 1, y: -1, label: "(1, -1)" },
  { x: -2, y: 5, label: "(-2, 5)" },
  { x: 3, y: -5, label: "(3, -5)" },
  { x: -5, y: -2, label: "(-5, -2)" },
  { x: 2, y: 5, label: "(2, 5)" },
  { x: -4, y: 1, label: "(-4, 1)" },
  
  { x: 1, y: -4, label: "(1, -4)" },
  { x: 5, y: -1, label: "(5, -1)" },
  { x: -3, y: 4, label: "(-3, 4)" },
  { x: 4, y: -3, label: "(4, -3)" },
  { x: -1, y: -5, label: "(-1, -5)" },
  { x: 3, y: 3, label: "(3, 3)" },
  { x: -2, y: -2, label: "(-2, -2)" },
  { x: 1, y: 1, label: "(1, 1)" },
  { x: -1, y: 1, label: "(-1, 1)" },
  { x: 2, y: -4, label: "(2, -4)" },
  
  { x: -4, y: 2, label: "(-4, 2)" },
  { x: 3, y: 5, label: "(3, 5)" },
  { x: -3, y: -5, label: "(-3, -5)" },
  { x: 5, y: 3, label: "(5, 3)" },
  { x: -5, y: -3, label: "(-5, -3)" },
  { x: 0, y: 1, label: "(0, 1)" },
  { x: 0, y: -1, label: "(0, -1)" },
  { x: 1, y: 0, label: "(1, 0)" },
  { x: -1, y: 0, label: "(-1, 0)" },
  { x: 4, y: 5, label: "(4, 5)" },
  { x: -4, y: -5, label: "(-4, -5)" },
  { x: 5, y: 4, label: "(5, 4)" }
];

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarGraficosCoordenadas(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const container = document.getElementById("game-container")!;
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let acertos = 0;
  let rodada = 0;
  let finalizado = false;
  let pararTimer = () => {};
  let selX: number | null = null;
  let selY: number | null = null;
  let respondido = false;

  // Shuffle the entire list of 52 coordinates at startup
  const jogoQuestoes = embaralhar(ALVOS_DATA);

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-coord-target" id="mg-target" style="font-family: 'JetBrains Mono', monospace; font-size: 1.8rem; text-align: center; margin: 15px 0; color: #22d3ee; filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.4));"></p>
     <div class="mg-plane-wrap" style="display: flex; justify-content: center; margin: 15px 0;">
       <div class="mg-plane" id="mg-plane"></div>
     </div>
     <div style="display: flex; justify-content: center; margin-top: 10px;">
       <button type="button" class="btn primary" id="mg-confirm" disabled style="padding: 10px 24px; font-size: 1.1rem;">Confirmar ponto</button>
     </div>`,
  );

  const plane = document.getElementById("mg-plane")!;
  const btnConfirm = document.getElementById("mg-confirm") as HTMLButtonElement;

  function renderPlane() {
    plane.innerHTML = "";
    const alvo = jogoQuestoes[rodada]!;
    
    for (let y = MAX; y >= MIN; y--) {
      for (let x = MIN; x <= MAX; x++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "mg-plane-cell";
        
        if (x === 0 && y === 0) cell.classList.add("origin");
        if (x === 0) cell.classList.add("axis-y");
        if (y === 0) cell.classList.add("axis-x");
        
        // Coloring feedback
        if (respondido) {
          cell.disabled = true;
          if (x === alvo.x && y === alvo.y) {
            cell.style.backgroundColor = "var(--success)";
            cell.style.borderColor = "var(--success)";
            cell.style.color = "#fff";
            cell.style.boxShadow = "0 0 10px rgba(34, 197, 94, 0.6)";
          } else if (selX === x && selY === y && (selX !== alvo.x || selY !== alvo.y)) {
            cell.style.backgroundColor = "var(--danger)";
            cell.style.borderColor = "var(--danger)";
            cell.style.color = "#fff";
            cell.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.6)";
          }
        } else {
          if (selX === x && selY === y) {
            cell.classList.add("selected");
          }
          cell.addEventListener("click", () => {
            if (respondido) return;
            selX = x;
            selY = y;
            btnConfirm.disabled = false;
            renderPlane();
          });
        }
        
        cell.title = `(${x}, ${y})`;
        cell.textContent = x === 0 && y === 0 ? "O" : "";
        plane.appendChild(cell);
      }
    }
  }

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${rodada}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function mostrarRodada() {
    if (finalizado || rodada >= jogoQuestoes.length) {
      void encerrar("Coordenadas concluídas!");
      return;
    }
    const alvo = jogoQuestoes[rodada]!;
    selX = null;
    selY = null;
    respondido = false;
    btnConfirm.disabled = true;
    btnConfirm.style.opacity = "1";
    document.getElementById("mg-prompt")!.textContent =
      `Rodada ${rodada + 1} / ${jogoQuestoes.length}`;
    document.getElementById("mg-target")!.textContent =
      `Marque o ponto ${alvo.label} no plano`;
    ui.setFeedback("Clique na interseção correta e confirme", "");
    renderPlane();
    atualizarScore();
  }

  btnConfirm.addEventListener("click", () => {
    if (finalizado || selX === null || selY === null || respondido) return;
    const alvo = jogoQuestoes[rodada]!;
    respondido = true;
    btnConfirm.disabled = true;
    btnConfirm.style.opacity = "0.5";
    
    const acertou = selX === alvo.x && selY === alvo.y;
    if (acertou) {
      acertos++;
      ui.setFeedback(`Correto!`, "ok");
    } else {
      ui.setFeedback(`Errado. O ponto correto era ${alvo.label}`, "erro");
    }
    
    renderPlane();
    rodada++;
    atualizarScore();
    
    // Auto-proceed after 1300ms
    setTimeout(() => {
      mostrarRodada();
    }, 1300);
  });

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    btnConfirm.disabled = true;
    plane.innerHTML = "";
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
      metadata: { acertos, total: jogoQuestoes.length, motivo },
      mensagem: `${motivo} · ${acertos}/${jogoQuestoes.length} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  atualizarScore();
  mostrarRodada();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}