import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("fracoes-puzzle")!;

interface Rodada {
  alvo: string;
  valor: number;
  opcoes: { label: string; valor: number }[];
}

const RODADAS_DATA: Rodada[] = [
  { alvo: "1/2", valor: 0.5, opcoes: [{ label: "2/4", valor: 0.5 }, { label: "1/3", valor: 1/3 }, { label: "3/8", valor: 0.375 }, { label: "4/6", valor: 2/3 }] },
  { alvo: "1/3", valor: 1/3, opcoes: [{ label: "2/6", valor: 1/3 }, { label: "2/5", valor: 0.4 }, { label: "3/8", valor: 0.375 }, { label: "1/4", valor: 0.25 }] },
  { alvo: "1/4", valor: 0.25, opcoes: [{ label: "2/8", valor: 0.25 }, { label: "2/6", valor: 1/3 }, { label: "3/10", valor: 0.3 }, { label: "1/5", valor: 0.2 }] },
  { alvo: "1/5", valor: 0.2, opcoes: [{ label: "2/10", valor: 0.2 }, { label: "3/12", valor: 0.25 }, { label: "1/4", valor: 0.25 }, { label: "2/8", valor: 0.25 }] },
  { alvo: "1/6", valor: 1/6, opcoes: [{ label: "2/12", valor: 1/6 }, { label: "1/5", valor: 0.2 }, { label: "2/10", valor: 0.2 }, { label: "3/15", valor: 0.2 }] },
  { alvo: "2/3", valor: 2/3, opcoes: [{ label: "4/6", valor: 2/3 }, { label: "3/5", valor: 0.6 }, { label: "5/8", valor: 0.625 }, { label: "3/4", valor: 0.75 }] },
  { alvo: "2/5", valor: 0.4, opcoes: [{ label: "4/10", valor: 0.4 }, { label: "1/3", valor: 1/3 }, { label: "3/8", valor: 0.375 }, { label: "3/5", valor: 0.6 }] },
  { alvo: "3/4", valor: 0.75, opcoes: [{ label: "6/8", valor: 0.75 }, { label: "2/3", valor: 2/3 }, { label: "5/6", valor: 5/6 }, { label: "4/5", valor: 0.8 }] },
  { alvo: "3/5", valor: 0.6, opcoes: [{ label: "6/10", valor: 0.6 }, { label: "1/2", valor: 0.5 }, { label: "4/8", valor: 0.5 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "3/8", valor: 0.375, opcoes: [{ label: "6/16", valor: 0.375 }, { label: "1/4", valor: 0.25 }, { label: "2/5", valor: 0.4 }, { label: "1/2", valor: 0.5 }] },
  { alvo: "4/5", valor: 0.8, opcoes: [{ label: "8/10", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "5/6", valor: 5/6 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "5/6", valor: 5/6, opcoes: [{ label: "10/12", valor: 5/6 }, { label: "4/5", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "5/8", valor: 0.625, opcoes: [{ label: "10/16", valor: 0.625 }, { label: "1/2", valor: 0.5 }, { label: "3/5", valor: 0.6 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "7/8", valor: 0.875, opcoes: [{ label: "14/16", valor: 0.875 }, { label: "4/5", valor: 0.8 }, { label: "9/10", valor: 0.9 }, { label: "5/6", valor: 5/6 }] },
  { alvo: "2/6", valor: 1/3, opcoes: [{ label: "1/3", valor: 1/3 }, { label: "1/4", valor: 0.25 }, { label: "2/5", valor: 0.4 }, { label: "3/8", valor: 0.375 }] },
  { alvo: "2/8", valor: 0.25, opcoes: [{ label: "1/4", valor: 0.25 }, { label: "1/3", valor: 1/3 }, { label: "3/10", valor: 0.3 }, { label: "2/6", valor: 1/3 }] },
  { alvo: "2/10", valor: 0.2, opcoes: [{ label: "1/5", valor: 0.2 }, { label: "1/4", valor: 0.25 }, { label: "3/12", valor: 0.25 }, { label: "2/8", valor: 0.25 }] },
  { alvo: "3/6", valor: 0.5, opcoes: [{ label: "1/2", valor: 0.5 }, { label: "1/3", valor: 1/3 }, { label: "2/5", valor: 0.4 }, { label: "4/6", valor: 2/3 }] },
  { alvo: "4/8", valor: 0.5, opcoes: [{ label: "1/2", valor: 0.5 }, { label: "3/8", valor: 0.375 }, { label: "5/8", valor: 0.625 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "5/10", valor: 0.5, opcoes: [{ label: "1/2", valor: 0.5 }, { label: "3/5", valor: 0.6 }, { label: "2/5", valor: 0.4 }, { label: "4/10", valor: 0.4 }] },
  { alvo: "6/12", valor: 0.5, opcoes: [{ label: "1/2", valor: 0.5 }, { label: "2/3", valor: 2/3 }, { label: "3/4", valor: 0.75 }, { label: "1/3", valor: 1/3 }] },
  { alvo: "4/6", valor: 2/3, opcoes: [{ label: "2/3", valor: 2/3 }, { label: "1/2", valor: 0.5 }, { label: "3/5", valor: 0.6 }, { label: "3/4", valor: 0.75 }] },
  { alvo: "6/9", valor: 2/3, opcoes: [{ label: "2/3", valor: 2/3 }, { label: "3/5", valor: 0.6 }, { label: "1/2", valor: 0.5 }, { label: "5/8", valor: 0.625 }] },
  { alvo: "8/12", valor: 2/3, opcoes: [{ label: "2/3", valor: 2/3 }, { label: "3/4", valor: 0.75 }, { label: "5/6", valor: 5/6 }, { label: "4/5", valor: 0.8 }] },
  { alvo: "4/10", valor: 0.4, opcoes: [{ label: "2/5", valor: 0.4 }, { label: "1/3", valor: 1/3 }, { label: "1/2", valor: 0.5 }, { label: "3/5", valor: 0.6 }] },
  { alvo: "6/15", valor: 0.4, opcoes: [{ label: "2/5", valor: 0.4 }, { label: "1/3", valor: 1/3 }, { label: "3/8", valor: 0.375 }, { label: "4/8", valor: 0.5 }] },
  { alvo: "8/20", valor: 0.4, opcoes: [{ label: "2/5", valor: 0.4 }, { label: "3/10", valor: 0.3 }, { label: "1/2", valor: 0.5 }, { label: "5/8", valor: 0.625 }] },
  { alvo: "6/8", valor: 0.75, opcoes: [{ label: "3/4", valor: 0.75 }, { label: "2/3", valor: 2/3 }, { label: "5/8", valor: 0.625 }, { label: "4/5", valor: 0.8 }] },
  { alvo: "9/12", valor: 0.75, opcoes: [{ label: "3/4", valor: 0.75 }, { label: "4/5", valor: 0.8 }, { label: "2/3", valor: 2/3 }, { label: "5/6", valor: 5/6 }] },
  { alvo: "12/16", valor: 0.75, opcoes: [{ label: "3/4", valor: 0.75 }, { label: "5/8", valor: 0.625 }, { label: "7/8", valor: 0.875 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "6/10", valor: 0.6, opcoes: [{ label: "3/5", valor: 0.6 }, { label: "1/2", valor: 0.5 }, { label: "2/3", valor: 2/3 }, { label: "4/5", valor: 0.8 }] },
  { alvo: "9/15", valor: 0.6, opcoes: [{ label: "3/5", valor: 0.6 }, { label: "2/3", valor: 2/3 }, { label: "5/8", valor: 0.625 }, { label: "1/2", valor: 0.5 }] },
  { alvo: "12/20", valor: 0.6, opcoes: [{ label: "3/5", valor: 0.6 }, { label: "4/5", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "5/8", valor: 0.625 }] },
  { alvo: "6/16", valor: 0.375, opcoes: [{ label: "3/8", valor: 0.375 }, { label: "1/4", valor: 0.25 }, { label: "1/2", valor: 0.5 }, { label: "2/5", valor: 0.4 }] },
  { alvo: "9/24", valor: 0.375, opcoes: [{ label: "3/8", valor: 0.375 }, { label: "1/3", valor: 1/3 }, { label: "3/5", valor: 0.6 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "8/10", valor: 0.8, opcoes: [{ label: "4/5", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "5/6", valor: 5/6 }, { label: "1/2", valor: 0.5 }] },
  { alvo: "12/15", valor: 0.8, opcoes: [{ label: "4/5", valor: 0.8 }, { label: "2/3", valor: 2/3 }, { label: "3/5", valor: 0.6 }, { label: "5/6", valor: 5/6 }] },
  { alvo: "16/20", valor: 0.8, opcoes: [{ label: "4/5", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "7/8", valor: 0.875 }, { label: "5/6", valor: 5/6 }] },
  { alvo: "10/12", valor: 5/6, opcoes: [{ label: "5/6", valor: 5/6 }, { label: "4/5", valor: 0.8 }, { label: "3/4", valor: 0.75 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "15/18", valor: 5/6, opcoes: [{ label: "5/6", valor: 5/6 }, { label: "3/4", valor: 0.75 }, { label: "5/8", valor: 0.625 }, { label: "4/5", valor: 0.8 }] },
  { alvo: "10/16", valor: 0.625, opcoes: [{ label: "5/8", valor: 0.625 }, { label: "1/2", valor: 0.5 }, { label: "3/5", valor: 0.6 }, { label: "2/3", valor: 2/3 }] },
  { alvo: "15/24", valor: 0.625, opcoes: [{ label: "5/8", valor: 0.625 }, { label: "3/4", valor: 0.75 }, { label: "5/6", valor: 5/6 }, { label: "3/5", valor: 0.6 }] },
  { alvo: "14/16", valor: 0.875, opcoes: [{ label: "7/8", valor: 0.875 }, { label: "4/5", valor: 0.8 }, { label: "9/10", valor: 0.9 }, { label: "5/6", valor: 5/6 }] },
  { alvo: "21/24", valor: 0.875, opcoes: [{ label: "7/8", valor: 0.875 }, { label: "5/6", valor: 5/6 }, { label: "7/10", valor: 0.7 }, { label: "3/4", valor: 0.75 }] },
  { alvo: "2/12", valor: 1/6, opcoes: [{ label: "1/6", valor: 1/6 }, { label: "1/5", valor: 0.2 }, { label: "2/8", valor: 0.25 }, { label: "1/4", valor: 0.25 }] },
  { alvo: "3/18", valor: 1/6, opcoes: [{ label: "1/6", valor: 1/6 }, { label: "1/5", valor: 0.2 }, { label: "3/12", valor: 0.25 }, { label: "2/10", valor: 0.2 }] },
  { alvo: "3/9", valor: 1/3, opcoes: [{ label: "1/3", valor: 1/3 }, { label: "1/4", valor: 0.25 }, { label: "2/5", valor: 0.4 }, { label: "3/8", valor: 0.375 }] },
  { alvo: "4/12", valor: 1/3, opcoes: [{ label: "1/3", valor: 1/3 }, { label: "1/5", valor: 0.2 }, { label: "3/10", valor: 0.3 }, { label: "1/4", valor: 0.25 }] },
  { alvo: "3/12", valor: 0.25, opcoes: [{ label: "1/4", valor: 0.25 }, { label: "1/3", valor: 1/3 }, { label: "2/5", valor: 0.4 }, { label: "3/8", valor: 0.375 }] },
  { alvo: "4/16", valor: 0.25, opcoes: [{ label: "1/4", valor: 0.25 }, { label: "1/5", valor: 0.2 }, { label: "3/10", valor: 0.3 }, { label: "2/6", valor: 1/3 }] },
  { alvo: "3/15", valor: 0.2, opcoes: [{ label: "1/5", valor: 0.2 }, { label: "1/4", valor: 0.25 }, { label: "2/8", valor: 0.25 }, { label: "3/10", valor: 0.3 }] },
  { alvo: "4/20", valor: 0.2, opcoes: [{ label: "1/5", valor: 0.2 }, { label: "1/6", valor: 1/6 }, { label: "2/8", valor: 0.25 }, { label: "3/12", valor: 0.25 }] }
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

  // Shuffle the entire 52-question bank at start
  const jogoQuestoes = embaralhar(RODADAS_DATA);

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

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${rodada}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function mostrarRodada() {
    if (finalizado || rodada >= jogoQuestoes.length) {
      void encerrar("Todas as rodadas concluídas!");
      return;
    }
    const r = jogoQuestoes[rodada]!;
    elPrompt().textContent = `Rodada ${rodada + 1} / ${jogoQuestoes.length}`;
    elAlvo().innerHTML = `<span class="mg-fraction-target">${r.alvo}</span>`;
    elOpcoes().innerHTML = "";
    ui.setFeedback("Escolha uma fração equivalente:", "");
    ui.resetSpeedBar?.();
    atualizarScore();

    for (const op of embaralhar(r.opcoes)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost mg-opcao";
      btn.textContent = op.label;
      btn.style.fontSize = "1.2rem";
      btn.style.padding = "12px";
      btn.addEventListener("click", () => responder(btn, op.valor === r.valor, r));
      elOpcoes().appendChild(btn);
    }
  }

  function responder(selectedBtn: HTMLButtonElement, acertou: boolean, currentRodada: Rodada) {
    if (finalizado) return;

    // Disable all options and highlight correct/incorrect
    const btns = elOpcoes().querySelectorAll("button");
    btns.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
      const optVal = currentRodada.opcoes.find(o => o.label === btn.textContent)?.valor;
      if (optVal === currentRodada.valor) {
        btn.className = "btn primary mg-opcao";
      } else if (btn === selectedBtn) {
        btn.className = "btn danger mg-opcao";
      }
    });

    if (acertou) {
      acertos++;
      ui.setFeedback(`Correto!`, "ok");
    } else {
      ui.setFeedback(`Incorreto!`, "erro");
    }
    
    rodada++;
    atualizarScore();

    // Auto-proceed after 1300ms
    setTimeout(mostrarRodada, 1300);
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    elOpcoes().innerHTML = "";
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
      metadata: { acertos, rodadas: jogoQuestoes.length, motivo },
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