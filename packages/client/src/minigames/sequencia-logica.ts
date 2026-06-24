import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("sequencia-logica")!;

interface SeqRodada {
  sequencia: string;
  opcoes: string[];
  correta: number;
}

const RODADAS_DATA: SeqRodada[] = [
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
  
  { sequencia: "10, 20, 30, 40, ?", opcoes: ["45", "50", "60", "70"], correta: 1 },
  { sequencia: "1, 8, 27, 64, ?", opcoes: ["100", "121", "125", "150"], correta: 2 },
  { sequencia: "2, 3, 5, 7, 11, ?", opcoes: ["12", "13", "14", "15"], correta: 1 },
  { sequencia: "0, 3, 8, 15, 24, ?", opcoes: ["30", "33", "35", "36"], correta: 2 },
  { sequencia: "1, 2, 4, 8, 16, ?", opcoes: ["24", "30", "32", "64"], correta: 2 },
  { sequencia: "10, 9, 8, 7, ?", opcoes: ["5", "6", "7", "8"], correta: 1 },
  { sequencia: "1, 3, 9, 27, 81, ?", opcoes: ["162", "243", "300", "324"], correta: 1 },
  { sequencia: "3, 6, 12, 24, 48, ?", opcoes: ["60", "80", "96", "100"], correta: 2 },
  { sequencia: "5, 8, 11, 14, 17, ?", opcoes: ["19", "20", "21", "22"], correta: 1 },
  { sequencia: "20, 17, 14, 11, 8, ?", opcoes: ["4", "5", "6", "7"], correta: 1 },
  
  { sequencia: "1, 5, 25, 125, ?", opcoes: ["500", "625", "750", "1000"], correta: 1 },
  { sequencia: "2, 4, 8, 16, 32, ?", opcoes: ["48", "60", "64", "128"], correta: 2 },
  { sequencia: "9, 18, 27, 36, 45, ?", opcoes: ["50", "54", "60", "63"], correta: 1 },
  { sequencia: "8, 16, 24, 32, 40, ?", opcoes: ["44", "48", "50", "56"], correta: 1 },
  { sequencia: "1, 10, 100, 1000, ?", opcoes: ["2000", "5000", "10000", "100000"], correta: 2 },
  { sequencia: "121, 100, 81, 64, ?", opcoes: ["40", "45", "49", "50"], correta: 2 },
  { sequencia: "2, 5, 10, 17, 26, ?", opcoes: ["35", "37", "40", "42"], correta: 1 },
  { sequencia: "3, 4, 6, 9, 13, ?", opcoes: ["16", "17", "18", "19"], correta: 2 },
  { sequencia: "1, 2, 6, 24, 120, ?", opcoes: ["240", "600", "720", "1000"], correta: 2 },
  { sequencia: "80, 40, 20, 10, ?", opcoes: ["2", "4", "5", "6"], correta: 2 },
  
  { sequencia: "1, 6, 11, 16, 21, ?", opcoes: ["24", "25", "26", "30"], correta: 2 },
  { sequencia: "2, 9, 16, 23, 30, ?", opcoes: ["35", "36", "37", "38"], correta: 2 },
  { sequencia: "1, 2, 5, 14, 41, ?", opcoes: ["100", "120", "122", "125"], correta: 2 },
  { sequencia: "0, 2, 6, 12, 20, ?", opcoes: ["28", "30", "32", "36"], correta: 1 },
  { sequencia: "2, 12, 30, 56, ?", opcoes: ["80", "90", "110", "120"], correta: 1 },
  { sequencia: "4, 9, 14, 19, 24, ?", opcoes: ["27", "28", "29", "30"], correta: 2 },
  { sequencia: "30, 27, 24, 21, 18, ?", opcoes: ["12", "14", "15", "16"], correta: 2 },
  { sequencia: "1, 7, 49, 343, ?", opcoes: ["1000", "2000", "2401", "2500"], correta: 2 },
  { sequencia: "6, 12, 24, 48, ?", opcoes: ["72", "90", "96", "108"], correta: 2 },
  { sequencia: "0.5, 1, 2, 4, 8, ?", opcoes: ["10", "12", "16", "20"], correta: 2 },
  
  { sequencia: "13, 21, 34, 55, ?", opcoes: ["76", "89", "99", "110"], correta: 1 },
  { sequencia: "64, 32, 16, 8, ?", opcoes: ["2", "3", "4", "6"], correta: 2 },
  { sequencia: "2, 7, 12, 17, 22, ?", opcoes: ["25", "27", "29", "30"], correta: 1 },
  { sequencia: "1, 3, 7, 15, 31, ?", opcoes: ["45", "50", "63", "64"], correta: 2 },
  { sequencia: "5, 15, 45, 135, ?", opcoes: ["270", "300", "405", "500"], correta: 2 },
  { sequencia: "11, 22, 33, 44, ?", opcoes: ["50", "55", "60", "66"], correta: 1 },
  { sequencia: "12, 24, 36, 48, ?", opcoes: ["54", "60", "66", "72"], correta: 1 },
  { sequencia: "1, 2, 4, 7, 11, 16, ?", opcoes: ["20", "21", "22", "23"], correta: 2 },
  { sequencia: "3, 5, 9, 17, 33, ?", opcoes: ["50", "60", "65", "66"], correta: 2 },
  { sequencia: "10, 15, 25, 40, 65, ?", opcoes: ["90", "100", "105", "110"], correta: 2 },
  { sequencia: "2, 6, 12, 20, 30, ?", opcoes: ["36", "40", "42", "45"], correta: 2 },
  { sequencia: "3, 8, 15, 24, 35, ?", opcoes: ["40", "45", "48", "50"], correta: 2 }
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

  // Shuffle all 52 sequences at startup
  const jogoQuestoes = embaralhar(RODADAS_DATA);

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-sequence" id="mg-sequence" style="font-family: 'JetBrains Mono', monospace; font-size: 2.2rem; text-align: center; margin: 20px 0; color: #22d3ee; filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.4));"></p>
     <div class="options-grid" id="mg-opcoes"></div>`,
  );

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${rodada}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function mostrar() {
    if (finalizado || rodada >= jogoQuestoes.length) {
      void encerrar("Sequências concluídas!");
      return;
    }
    const r = jogoQuestoes[rodada]!;
    document.getElementById("mg-prompt")!.textContent =
      `Rodada ${rodada + 1} / ${jogoQuestoes.length}`;
    document.getElementById("mg-sequence")!.textContent = r.sequencia;
    const op = document.getElementById("mg-opcoes")!;
    op.innerHTML = "";
    ui.setFeedback("Qual o próximo termo?", "");
    ui.resetSpeedBar?.();
    atualizarScore();

    const indices = embaralhar(r.opcoes.map((_, i) => i));
    for (const i of indices) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost select-option-btn";
      btn.textContent = r.opcoes[i]!;
      btn.style.fontSize = "1.2rem";
      btn.style.padding = "12px";
      btn.addEventListener("click", () => responder(btn, i, r));
      op.appendChild(btn);
    }
  }

  function responder(selectedBtn: HTMLButtonElement, indexEscolhido: number, currentRodada: SeqRodada) {
    if (finalizado) return;

    const op = document.getElementById("mg-opcoes")!;
    const btns = op.querySelectorAll("button");

    btns.forEach((btn, idx) => {
      (btn as HTMLButtonElement).disabled = true;
      // We need to map which actual option text corresponds to the correct one
      const btnText = btn.textContent;
      const correctText = currentRodada.opcoes[currentRodada.correta];
      if (btnText === correctText) {
        btn.className = "btn primary";
      } else if (btn === selectedBtn) {
        btn.className = "btn danger";
      }
    });

    if (indexEscolhido === currentRodada.correta) {
      acertos++;
      ui.setFeedback(`Correto!`, "ok");
    } else {
      ui.setFeedback(`Incorreto!`, "erro");
    }

    rodada++;
    atualizarScore();

    // Auto-proceed after 1300ms
    setTimeout(mostrar, 1300);
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
      metadata: { acertos, total: jogoQuestoes.length, motivo },
      mensagem: `${motivo} · ${acertos}/${jogoQuestoes.length} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  atualizarScore();
  mostrar();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}