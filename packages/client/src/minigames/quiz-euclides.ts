import { getMinigame } from "@ddm/shared";
import { enviarPontuacao } from "../services/api.js";
import type { Jogador } from "../services/api.js";
import { agendarVoltaArena } from "./minigame-ui.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";

const META = getMinigame("quiz-euclides")!;
const TEMPO_POR_PERGUNTA = 10;
const TOTAL_PERGUNTAS = 10;
const PONTOS_MAX_POR_PERGUNTA = 50;

interface Pergunta {
  enunciado: string;
  opcoes: string[];
  correta: number;
}

const PERGUNTAS: Pergunta[] = [
  {
    enunciado: "Quantos postulados clássicos de Euclides existem nos Elementos?",
    opcoes: ["3", "5", "7", "10"],
    correta: 1,
  },
  {
    enunciado: "O 1º postulado afirma que por dois pontos distintos passa:",
    opcoes: ["Muitas retas", "Uma única reta", "Nenhuma reta", "Um círculo"],
    correta: 1,
  },
  {
    enunciado: "Qual axioma garante que iguais a uma mesma coisa são iguais entre si?",
    opcoes: ["Axioma 1", "Axioma 2", "Axioma 3", "Axioma 4"],
    correta: 0,
  },
  {
    enunciado: "O 5º postulado é famoso por tratar de:",
    opcoes: ["Triângulos", "Paralelas", "Ângulos retos", "Áreas"],
    correta: 1,
  },
  {
    enunciado: "Euclides viveu principalmente em qual período?",
    opcoes: ["Século III a.C.", "Século V d.C.", "Idade Média", "Renascimento"],
    correta: 0,
  },
  {
    enunciado: "A obra principal de Euclides chama-se:",
    opcoes: ["Arquitetura", "Elementos", "Princípios", "Geometria Plana"],
    correta: 1,
  },
  {
    enunciado: "O 3º postulado permite traçar um círculo com:",
    opcoes: ["Dois raios", "Centro e raio", "Três pontos", "Um diâmetro fixo"],
    correta: 1,
  },
  {
    enunciado: "Postulado: se duas retas cortam uma transversal e somam menos de 180° internamente, então:",
    opcoes: ["São perpendiculares", "Encontram-se do mesmo lado", "São paralelas", "São iguais"],
    correta: 1,
  },
  {
    enunciado: "A geometria euclidiana estuda figuras no plano usando:",
    opcoes: ["Coordenadas polares", "Régua e compasso", "Calculadora", "Vetores 3D"],
    correta: 1,
  },
  {
    enunciado: "Um triângulo equilátero tem, em geometria plana euclidiana, ângulos internos de:",
    opcoes: ["45°", "60°", "90°", "120°"],
    correta: 1,
  },
];

export function iniciarQuizEuclides(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let indice = 0;
  let pontosTotal = 0;
  let acertos = 0;
  let tempoRestante = TEMPO_POR_PERGUNTA;
  let respondido = false;
  let timerId: ReturnType<typeof setInterval> | null = null;

  const container = document.getElementById("game-container")!;
  container.innerHTML = `
    <div class="quiz-shell glass-card">
      <div class="quiz-top">
        <span class="quiz-brand">Euclides Test</span>
        <span id="quiz-progress" class="quiz-progress"></span>
      </div>
      <h2 class="quiz-title">${META.nome}</h2>
      <div class="quiz-timer-wrap">
        <div id="quiz-timer-bar" class="quiz-timer-bar"></div>
        <span id="quiz-timer-text" class="quiz-timer-text">${TEMPO_POR_PERGUNTA}s</span>
      </div>
      <p id="quiz-pergunta" class="quiz-pergunta"></p>
      <div id="quiz-opcoes" class="quiz-opcoes"></div>
      <p id="quiz-feedback" class="quiz-feedback"></p>
      <p id="quiz-score" class="quiz-score"></p>
    </div>
  `;

  const elPergunta = document.getElementById("quiz-pergunta")!;
  const elOpcoes = document.getElementById("quiz-opcoes")!;
  const elFeedback = document.getElementById("quiz-feedback")!;
  const elScore = document.getElementById("quiz-score")!;
  const elProgress = document.getElementById("quiz-progress")!;
  const elTimerText = document.getElementById("quiz-timer-text")!;
  const elTimerBar = document.getElementById("quiz-timer-bar")!;

  function atualizarTimer() {
    const pct = (tempoRestante / TEMPO_POR_PERGUNTA) * 100;
    elTimerBar.style.width = `${pct}%`;
    elTimerText.textContent = `${tempoRestante}s`;
  }

  function pontosPorTempo(segundosRestantes: number, acertou: boolean) {
    if (!acertou) return 0;
    return Math.round(PONTOS_MAX_POR_PERGUNTA * (segundosRestantes / TEMPO_POR_PERGUNTA));
  }

  async function finalizar(motivo: string) {
    if (timerId) clearInterval(timerId);
    protecao.encerrar();

    const anulado = protecao.foiAnulado();
    const duracaoMs = Date.now() - inicio;

    elOpcoes.innerHTML = "";
    if (anulado) {
      elFeedback.textContent =
        "Desafio anulado: você saiu da página, recarregou ou abriu outra aba.";
      elFeedback.className = "quiz-feedback erro";
      try {
        await enviarPontuacao({
          jogadorId: jogador.id,
          minigameId: META.id,
          partidaId,
          tokenSeguranca,
          pontos: 0,
          duracaoMs,
          anulado: true,
        });
      } catch {
        /* ignore */
      }
    } else {
      const pontosFinais = Math.min(META.pontuacaoMaxima, pontosTotal);
      try {
        const res = await enviarPontuacao({
          jogadorId: jogador.id,
          minigameId: META.id,
          partidaId,
          tokenSeguranca,
          pontos: pontosFinais,
          duracaoMs,
          metadata: { acertos, total: TOTAL_PERGUNTAS, motivo },
        });
        elFeedback.textContent = `${motivo} · ${acertos}/${TOTAL_PERGUNTAS} acertos · ${pontosFinais} pts`;
        elScore.textContent = `Global: ${res.totalGlobal} pts · Apresentação: ${res.totalRodada} pts`;
      } catch (e) {
        elFeedback.textContent = `Erro ao salvar: ${e instanceof Error ? e.message : "?"}`;
      }
    }

    agendarVoltaArena(onFim, (t) => {
      elScore.textContent = t;
    });
  }

  function proximaPergunta() {
    if (indice >= TOTAL_PERGUNTAS) {
      void finalizar("Quiz concluído!");
      return;
    }

    respondido = false;
    tempoRestante = TEMPO_POR_PERGUNTA;
    const p = PERGUNTAS[indice]!;
    elProgress.textContent = `Pergunta ${indice + 1} / ${TOTAL_PERGUNTAS}`;
    elPergunta.textContent = p.enunciado;
    elFeedback.textContent = "";
    elScore.textContent = `Pontos parciais: ${pontosTotal}`;
    atualizarTimer();

    elOpcoes.innerHTML = "";
    p.opcoes.forEach((texto, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost quiz-opcao";
      btn.textContent = texto;
      btn.addEventListener("click", () => responder(i));
      elOpcoes.appendChild(btn);
    });

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (respondido) return;
      tempoRestante--;
      atualizarTimer();
      if (tempoRestante <= 0) {
        respondido = true;
        elFeedback.textContent = "Tempo esgotado!";
        elFeedback.className = "quiz-feedback erro";
        indice++;
        setTimeout(proximaPergunta, 900);
      }
    }, 1000);
  }

  function responder(escolha: number) {
    if (respondido) return;
    respondido = true;
    if (timerId) clearInterval(timerId);

    const p = PERGUNTAS[indice]!;
    const acertou = escolha === p.correta;
    
    // Highlight option buttons
    const buttons = elOpcoes.querySelectorAll("button");
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === p.correta) {
        btn.className = "btn quiz-opcao correct";
      } else if (i === escolha) {
        btn.className = "btn quiz-opcao incorrect";
      } else {
        btn.className = "btn quiz-opcao muted-btn";
      }
    });

    const pts = pontosPorTempo(tempoRestante, acertou);
    if (acertou) {
      acertos++;
      pontosTotal += pts;
      let label = "Correto!";
      if (tempoRestante >= 8) label = "⚡ Super Rápido!";
      else if (tempoRestante >= 6) label = "🏃 Rápido!";
      elFeedback.textContent = `${label} +${pts} pts (${tempoRestante}s restantes)`;
      elFeedback.className = "quiz-feedback ok";
    } else {
      elFeedback.textContent = `Errado. Resposta: ${p.opcoes[p.correta]}`;
      elFeedback.className = "quiz-feedback erro";
    }

    indice++;
    setTimeout(proximaPergunta, 1300);
  }

  proximaPergunta();

  return {
    destroy: () => {
      if (timerId) clearInterval(timerId);
      protecao.encerrar();
    },
  };
}