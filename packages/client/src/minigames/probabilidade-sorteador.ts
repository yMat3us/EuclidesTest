import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("probabilidade-sorteador")!;
const PTS_ACERTO = 50;

interface Pergunta {
  enunciado: string;
  opcoes: string[];
  correta: number;
}

const PERGUNTAS: Pergunta[] = [
  {
    enunciado: "Ao lançar uma moeda honesta, qual a probabilidade de cara?",
    opcoes: ["25%", "50%", "75%", "100%"],
    correta: 1,
  },
  {
    enunciado: "Um dado comum (1 a 6). Qual P(número par)?",
    opcoes: ["1/6", "1/3", "1/2", "2/3"],
    correta: 2,
  },
  {
    enunciado: "Qual P(sair 3) em um dado justo?",
    opcoes: ["1/2", "1/3", "1/6", "1/4"],
    correta: 2,
  },
  {
    enunciado: "Sacamos uma bola de uma urna com 3 vermelhas e 7 azuis (sem reposição na contagem total). P(vermelha)?",
    opcoes: ["30%", "70%", "3/10", "7/10"],
    correta: 2,
  },
  {
    enunciado: "Dois dados. Qual a chance da soma ser 7?",
    opcoes: ["1/12", "1/9", "1/6", "1/4"],
    correta: 2,
  },
  {
    enunciado: "Probabilidade de sair coroa duas vezes seguidas (moeda justa)?",
    opcoes: ["1/8", "1/4", "1/2", "3/4"],
    correta: 1,
  },
  {
    enunciado: "Em um baralho de 52 cartas, P(ás de copas)?",
    opcoes: ["1/52", "1/26", "1/13", "4/52"],
    correta: 0,
  },
  {
    enunciado: "Evento impossível tem probabilidade:",
    opcoes: ["0", "1/2", "1", "2"],
    correta: 0,
  },
  {
    enunciado: "Evento certo tem probabilidade:",
    opcoes: ["0", "1/2", "1", "1000%"],
    correta: 2,
  },
  {
    enunciado: "Lançamos um dado. P(número maior que 4)?",
    opcoes: ["1/6", "1/3", "1/2", "2/3"],
    correta: 1,
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

export function iniciarProbabilidadeSorteador(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const container = document.getElementById("game-container")!;
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let acertos = 0;
  let indice = 0;
  let finalizado = false;
  let pararTimer = () => {};

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-question" id="mg-question"></p>
     <div class="mg-opcoes" id="mg-opcoes"></div>`,
  );

  function mostrar() {
    if (finalizado || indice >= PERGUNTAS.length) return;
    const p = PERGUNTAS[indice]!;
    document.getElementById("mg-prompt")!.textContent =
      `Pergunta ${indice + 1} / ${PERGUNTAS.length}`;
    document.getElementById("mg-question")!.textContent = p.enunciado;
    const op = document.getElementById("mg-opcoes")!;
    op.innerHTML = "";

    const ordem = embaralhar(p.opcoes.map((_, i) => i));
    for (const i of ordem) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost mg-opcao";
      btn.textContent = p.opcoes[i]!;
      btn.addEventListener("click", () => {
        if (i === p.correta) {
          acertos++;
          ui.setFeedback(`Correto! +${PTS_ACERTO} pts`, "ok");
        } else {
          ui.setFeedback(`Errado. Resposta: ${p.opcoes[p.correta]}`, "erro");
        }
        ui.setScore(
          `Acertos: ${acertos} · ${Math.min(META.pontuacaoMaxima, acertos * PTS_ACERTO)} pts`,
        );
        indice++;
        if (indice >= PERGUNTAS.length) void encerrar("Desafio concluído!");
        else setTimeout(mostrar, 700);
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
      metadata: { acertos, total: PERGUNTAS.length, motivo },
      mensagem: `${motivo} · ${acertos}/${PERGUNTAS.length} acertos`,
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