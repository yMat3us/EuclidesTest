import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("graficos-coordenadas")!;
const PTS_ACERTO = 50;
const MIN = -5;
const MAX = 5;

interface Alvo {
  x: number;
  y: number;
  label: string;
}

const ALVOS: Alvo[] = [
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
];

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

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-coord-target" id="mg-target"></p>
     <div class="mg-plane-wrap">
       <div class="mg-plane" id="mg-plane"></div>
     </div>
     <button type="button" class="btn primary btn-sm" id="mg-confirm" disabled>Confirmar ponto</button>`,
  );

  const plane = document.getElementById("mg-plane")!;
  const btnConfirm = document.getElementById("mg-confirm") as HTMLButtonElement;

  function renderPlane() {
    plane.innerHTML = "";
    for (let y = MAX; y >= MIN; y--) {
      for (let x = MIN; x <= MAX; x++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "mg-plane-cell";
        if (x === 0 && y === 0) cell.classList.add("origin");
        if (x === 0) cell.classList.add("axis-y");
        if (y === 0) cell.classList.add("axis-x");
        if (selX === x && selY === y) cell.classList.add("selected");
        cell.title = `(${x}, ${y})`;
        cell.textContent = x === 0 && y === 0 ? "O" : "";
        cell.addEventListener("click", () => {
          selX = x;
          selY = y;
          btnConfirm.disabled = false;
          renderPlane();
        });
        plane.appendChild(cell);
      }
    }
  }

  function mostrarRodada() {
    if (finalizado || rodada >= ALVOS.length) return;
    const alvo = ALVOS[rodada]!;
    selX = null;
    selY = null;
    btnConfirm.disabled = true;
    document.getElementById("mg-prompt")!.textContent =
      `Rodada ${rodada + 1} / ${ALVOS.length}`;
    document.getElementById("mg-target")!.textContent =
      `Marque o ponto ${alvo.label} no plano`;
    ui.setFeedback("Clique na interseção correta e confirme", "");
    renderPlane();
  }

  btnConfirm.addEventListener("click", () => {
    if (finalizado || selX === null || selY === null) return;
    const alvo = ALVOS[rodada]!;
    const acertou = selX === alvo.x && selY === alvo.y;
    if (acertou) {
      acertos++;
      ui.setFeedback(`Correto! +${PTS_ACERTO} pts`, "ok");
    } else {
      ui.setFeedback(`Errado. O ponto era ${alvo.label}`, "erro");
    }
    ui.setScore(
      `Acertos: ${acertos} · ${Math.min(META.pontuacaoMaxima, acertos * PTS_ACERTO)} pts`,
    );
    rodada++;
    if (rodada >= ALVOS.length) void encerrar("Coordenadas concluídas!");
    else setTimeout(mostrarRodada, 750);
  });

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    btnConfirm.disabled = true;
    plane.innerHTML = "";
    await finalizarMinigame({
      jogador,
      meta: META,
      partidaId,
      tokenSeguranca,
      inicio,
      protecao,
      pontos: acertos * PTS_ACERTO,
      onFim,
      ui,
      metadata: { acertos, total: ALVOS.length, motivo },
      mensagem: `${motivo} · ${acertos}/${ALVOS.length} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  ui.setScore("Acertos: 0");
  mostrarRodada();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}