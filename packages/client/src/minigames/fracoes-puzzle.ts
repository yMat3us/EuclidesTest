import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("fracoes-puzzle")!;
const RODADAS = 12;
const PTS_ACERTO = 34;

interface Rodada {
  alvo: string;
  valor: number;
  opcoes: { label: string; valor: number }[];
}

const RODADAS_DATA: Rodada[] = [
  {
    alvo: "1/2",
    valor: 0.5,
    opcoes: [
      { label: "2/4", valor: 0.5 },
      { label: "1/3", valor: 1 / 3 },
      { label: "3/8", valor: 0.375 },
      { label: "4/6", valor: 2 / 3 },
    ],
  },
  {
    alvo: "3/4",
    valor: 0.75,
    opcoes: [
      { label: "6/8", valor: 0.75 },
      { label: "2/5", valor: 0.4 },
      { label: "9/12", valor: 0.75 },
      { label: "1/2", valor: 0.5 },
    ],
  },
  {
    alvo: "2/3",
    valor: 2 / 3,
    opcoes: [
      { label: "4/6", valor: 2 / 3 },
      { label: "3/5", valor: 0.6 },
      { label: "8/12", valor: 2 / 3 },
      { label: "5/9", valor: 5 / 9 },
    ],
  },
  {
    alvo: "1/4",
    valor: 0.25,
    opcoes: [
      { label: "2/8", valor: 0.25 },
      { label: "3/6", valor: 0.5 },
      { label: "5/8", valor: 0.625 },
      { label: "3/12", valor: 0.25 },
    ],
  },
  {
    alvo: "5/10",
    valor: 0.5,
    opcoes: [
      { label: "1/2", valor: 0.5 },
      { label: "5/15", valor: 1 / 3 },
      { label: "3/4", valor: 0.75 },
      { label: "4/10", valor: 0.4 },
    ],
  },
  {
    alvo: "2/5",
    valor: 0.4,
    opcoes: [
      { label: "4/10", valor: 0.4 },
      { label: "1/5", valor: 0.2 },
      { label: "3/5", valor: 0.6 },
      { label: "6/10", valor: 0.6 },
    ],
  },
  {
    alvo: "3/5",
    valor: 0.6,
    opcoes: [
      { label: "6/10", valor: 0.6 },
      { label: "9/15", valor: 0.6 },
      { label: "2/5", valor: 0.4 },
      { label: "4/5", valor: 0.8 },
    ],
  },
  {
    alvo: "4/5",
    valor: 0.8,
    opcoes: [
      { label: "8/10", valor: 0.8 },
      { label: "12/15", valor: 0.8 },
      { label: "2/3", valor: 2 / 3 },
      { label: "6/8", valor: 0.75 },
    ],
  },
  {
    alvo: "1/3",
    valor: 1 / 3,
    opcoes: [
      { label: "2/6", valor: 1 / 3 },
      { label: "3/9", valor: 1 / 3 },
      { label: "2/4", valor: 0.5 },
      { label: "4/9", valor: 4 / 9 },
    ],
  },
  {
    alvo: "5/6",
    valor: 5 / 6,
    opcoes: [
      { label: "10/12", valor: 5 / 6 },
      { label: "15/18", valor: 5 / 6 },
      { label: "4/6", valor: 2 / 3 },
      { label: "3/4", valor: 0.75 },
    ],
  },
  {
    alvo: "7/8",
    valor: 0.875,
    opcoes: [
      { label: "14/16", valor: 0.875 },
      { label: "21/24", valor: 0.875 },
      { label: "6/8", valor: 0.75 },
      { label: "9/10", valor: 0.9 },
    ],
  },
  {
    alvo: "3/8",
    valor: 0.375,
    opcoes: [
      { label: "6/16", valor: 0.375 },
      { label: "9/24", valor: 0.375 },
      { label: "1/4", valor: 0.25 },
      { label: "5/8", valor: 0.625 },
    ],
  },
];

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarFracoesPuzzle(
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
     <div class="mg-alvo" id="mg-alvo"></div>
     <div class="mg-opcoes" id="mg-opcoes"></div>`,
  );

  const elPrompt = () => document.getElementById("mg-prompt")!;
  const elAlvo = () => document.getElementById("mg-alvo")!;
  const elOpcoes = () => document.getElementById("mg-opcoes")!;

  function mostrarRodada() {
    if (finalizado || rodada >= RODADAS) return;
    const r = RODADAS_DATA[rodada]!;
    elPrompt().textContent = `Rodada ${rodada + 1} / ${RODADAS}`;
    elAlvo().innerHTML = `<span class="mg-fraction-target">${r.alvo}</span>`;
    elOpcoes().innerHTML = "";
    ui.setFeedback("Escolha uma fração equivalente:", "");

    for (const op of embaralhar(r.opcoes)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost mg-opcao";
      btn.textContent = op.label;
      btn.addEventListener("click", () => responder(op.valor === r.valor));
      elOpcoes().appendChild(btn);
    }
  }

  function responder(acertou: boolean) {
    if (finalizado) return;
    if (acertou) {
      acertos++;
      ui.setFeedback(`Correto! +${PTS_ACERTO} pts`, "ok");
    } else {
      ui.setFeedback(`Errado. Equivalente: ${RODADAS_DATA[rodada]!.alvo}`, "erro");
    }
    ui.setScore(`Acertos: ${acertos} · Pontos: ${Math.min(META.pontuacaoMaxima, acertos * PTS_ACERTO)}`);
    rodada++;
    if (rodada >= RODADAS) void encerrar("Todas as rodadas concluídas!");
    else setTimeout(mostrarRodada, 700);
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    elOpcoes().innerHTML = "";
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
      metadata: { acertos, rodadas: RODADAS, motivo },
      mensagem: `${motivo} · ${acertos}/${RODADAS} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  ui.setScore("Acertos: 0 · Pontos: 0");
  mostrarRodada();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}