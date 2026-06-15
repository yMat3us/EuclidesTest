import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("sequencia-logica")!;
const PTS_ACERTO = 45;

interface SeqRodada {
  sequencia: string;
  opcoes: string[];
  correta: number;
}

const RODADAS: SeqRodada[] = [
  { sequencia: "2, 4, 6, 8, ?", opcoes: ["9", "10", "12", "14"], correta: 1 },
  { sequencia: "1, 1, 2, 3, 5, ?", opcoes: ["6", "7", "8", "9"], correta: 2 },
  { sequencia: "3, 9, 27, ?", opcoes: ["54", "72", "81", "90"], correta: 2 },
  { sequencia: "5, 10, 15, 20, ?", opcoes: ["22", "24", "25", "30"], correta: 2 },
  { sequencia: "1, 4, 9, 16, ?", opcoes: ["20", "24", "25", "36"], correta: 2 },
  { sequencia: "100, 50, 25, ?", opcoes: ["10", "12.5", "15", "20"], correta: 1 },
  { sequencia: "2, 6, 18, 54, ?", opcoes: ["108", "148", "162", "216"], correta: 2 },
  { sequencia: "7, 14, 21, 28, ?", opcoes: ["32", "35", "36", "42"], correta: 1 },
  { sequencia: "1, 3, 6, 10, 15, ?", opcoes: ["18", "20", "21", "25"], correta: 2 },
  { sequencia: "4, 8, 16, 32, ?", opcoes: ["48", "56", "64", "72"], correta: 2 },
];

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarSequenciaLogica(
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

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-sequence" id="mg-sequence"></p>
     <div class="mg-opcoes" id="mg-opcoes"></div>`,
  );

  function mostrar() {
    if (finalizado || rodada >= RODADAS.length) return;
    const r = RODADAS[rodada]!;
    document.getElementById("mg-prompt")!.textContent =
      `Rodada ${rodada + 1} / ${RODADAS.length}`;
    document.getElementById("mg-sequence")!.textContent = r.sequencia;
    const op = document.getElementById("mg-opcoes")!;
    op.innerHTML = "";
    ui.setFeedback("Qual o próximo termo?", "");

    const indices = embaralhar(r.opcoes.map((_, i) => i));
    for (const i of indices) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost mg-opcao";
      btn.textContent = r.opcoes[i]!;
      btn.addEventListener("click", () => {
        if (i === r.correta) {
          acertos++;
          ui.setFeedback(`Correto! +${PTS_ACERTO} pts`, "ok");
        } else {
          ui.setFeedback(`Errado. Resposta: ${r.opcoes[r.correta]}`, "erro");
        }
        ui.setScore(
          `Acertos: ${acertos} · ${Math.min(META.pontuacaoMaxima, acertos * PTS_ACERTO)} pts`,
        );
        rodada++;
        if (rodada >= RODADAS.length) void encerrar("Sequências concluídas!");
        else setTimeout(mostrar, 650);
      });
      op.appendChild(btn);
    }
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
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
      metadata: { acertos, total: RODADAS.length, motivo },
      mensagem: `${motivo} · ${acertos}/${RODADAS.length} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  ui.setScore("Acertos: 0");
  mostrar();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}