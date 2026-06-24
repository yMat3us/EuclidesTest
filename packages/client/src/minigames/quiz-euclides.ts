import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { enviarPontuacao } from "../services/api.js";
import { agendarVoltaArena } from "./minigame-ui.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";

const META = getMinigame("quiz-euclides")!;
const TEMPO_POR_PERGUNTA = 10;
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
    opcoes: ["Perpendiculares", "Encontram-se do mesmo lado", "São paralelas", "São iguais"],
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
  {
    enunciado: "Quantos livros (capítulos) compõem a obra clássica 'Os Elementos'?",
    opcoes: ["10", "12", "13", "15"],
    correta: 2,
  },
  {
    enunciado: "Em qual famosa cidade da antiguidade Euclides fundou sua escola de matemática?",
    opcoes: ["Atenas", "Esparta", "Roma", "Alexandria"],
    correta: 3,
  },
  {
    enunciado: "Qual monarca governava o Egito na época em que Euclides ensinava na biblioteca?",
    opcoes: ["Ptolomeu I", "Júlio César", "Cleópatra", "Alexandre, o Grande"],
    correta: 0,
  },
  {
    enunciado: "De acordo com Euclides, o que é um ponto?",
    opcoes: ["Uma linha reta minúscula", "O que tem comprimento sem largura", "O que não tem partes", "O centro de um triângulo"],
    correta: 2,
  },
  {
    enunciado: "De acordo com as definições de Euclides, o que é uma linha?",
    opcoes: ["Comprimento sem largura", "O que possui apenas largura", "Uma sucessão de curvas", "O limite de um sólido"],
    correta: 0,
  },
  {
    enunciado: "As extremidades de uma linha reta de acordo com a geometria euclidiana são:",
    opcoes: ["Ângulos", "Pontos", "Segmentos", "Superfícies"],
    correta: 1,
  },
  {
    enunciado: "De acordo com as definições de Euclides, o que é uma superfície?",
    opcoes: ["O que tem apenas comprimento", "O que tem apenas largura", "O que tem apenas profundidade", "O que tem apenas comprimento e largura"],
    correta: 3,
  },
  {
    enunciado: "As extremidades de uma superfície plana de acordo com Euclides são:",
    opcoes: ["Pontos", "Linhas", "Planos", "Polígonos"],
    correta: 1,
  },
  {
    enunciado: "O que é um ângulo plano de acordo com Euclides?",
    opcoes: ["A inclinação mútua de duas linhas que se encontram", "O cruzamento de duas retas paralelas", "A área contida entre quatro pontos", "Uma circunferência perfeita"],
    correta: 0,
  },
  {
    enunciado: "Quando um ângulo é reto na definição clássica euclidiana?",
    opcoes: ["Quando mede exatamente 90 graus na régua", "Quando uma reta faz ângulos adjacentes iguais com outra", "Quando divide um círculo em 3 partes", "Quando faz parte de um hexágono"],
    correta: 1,
  },
  {
    enunciado: "Um ângulo obtuso é classificado por Euclides como:",
    opcoes: ["Um ângulo que mede 180 graus", "Maior que um ângulo reto", "Menor que um ângulo reto", "Aquele que forma um quadrado"],
    correta: 1,
  },
  {
    enunciado: "Um ângulo agudo é classificado por Euclides como:",
    opcoes: ["Menor que um ângulo reto", "Maior que um ângulo reto", "Igual a um ângulo reto", "Aquele formado em espiral"],
    correta: 0,
  },
  {
    enunciado: "Qual a definição dada por Euclides para o limite de uma figura?",
    opcoes: ["Uma reta infinita", "A extremidade de alguma coisa", "O centro geométrico", "O diâmetro"],
    correta: 1,
  },
  {
    enunciado: "O que é uma figura geométrica de acordo com Euclides?",
    opcoes: ["Uma coleção aleatória de retas", "O que está contido por um ou mais limites", "Apenas triângulos e quadrados", "Qualquer plano tridimensional"],
    correta: 1,
  },
  {
    enunciado: "Qual a definição euclidiana de um diâmetro de círculo?",
    opcoes: ["Reta que liga dois pontos passando pelo centro", "A metade do raio do círculo", "A circunferência total", "Qualquer reta paralela ao centro"],
    correta: 0,
  },
  {
    enunciado: "Figuras retilíneas são aquelas limitadas por:",
    opcoes: ["Curvas circulares", "Retas paralelas", "Linhas retas", "Pontos e superfícies"],
    correta: 2,
  },
  {
    enunciado: "Como Euclides define figuras quadrilaterais?",
    opcoes: ["Aquelas contidas por três linhas retas", "Aquelas contidas por quatro linhas retas", "Aquelas com quatro ângulos agudos", "Aquelas com duas diagonais circulares"],
    correta: 1,
  },
  {
    enunciado: "Um triângulo que possui todos os três lados iguais chama-se:",
    opcoes: ["Isósceles", "Escaleno", "Retângulo", "Equilátero"],
    correta: 3,
  },
  {
    enunciado: "Um triângulo que possui apenas dois de seus lados iguais chama-se:",
    opcoes: ["Isósceles", "Escaleno", "Equilátero", "Obtusângulo"],
    correta: 0,
  },
  {
    enunciado: "Um triângulo que possui três lados desiguais chama-se:",
    opcoes: ["Equilátero", "Isósceles", "Escaleno", "Acutângulo"],
    correta: 2,
  },
  {
    enunciado: "Qual o nome do triângulo que possui um ângulo reto?",
    opcoes: ["Acutângulo", "Obtusângulo", "Retângulo", "Isósceles"],
    correta: 2,
  },
  {
    enunciado: "Qual o nome do triângulo que possui um ângulo obtuso?",
    opcoes: ["Retângulo", "Acutângulo", "Obtusângulo", "Equilátero"],
    correta: 2,
  },
  {
    enunciado: "Qual o nome do triângulo que possui todos os três ângulos agudos?",
    opcoes: ["Acutângulo", "Obtusângulo", "Retângulo", "Escaleno"],
    correta: 0,
  },
  {
    enunciado: "Como é definido um quadrado na geometria euclidiana?",
    opcoes: ["Retilínio, com quatro lados iguais e ângulos retos", "Com lados opostos iguais e ângulos agudos", "Com lados desiguais e ângulos retos", "Com três lados e um círculo inscrito"],
    correta: 0,
  },
  {
    enunciado: "Como é definido um retângulo na geometria euclidiana?",
    opcoes: ["Equilátero com ângulos retos", "Com lados opostos iguais mas não equilátero, e ângulos retos", "Com lados desiguais e sem ângulos retos", "Com quatro lados paralelos curvos"],
    correta: 1,
  },
  {
    enunciado: "Como é definido um losango na geometria euclidiana?",
    opcoes: ["Com quatro lados iguais mas sem ângulos retos", "Com lados opostos iguais e ângulos retos", "Com três lados e ângulos obtusos", "Com todos os lados paralelos curvos"],
    correta: 0,
  },
  {
    enunciado: "Retas paralelas são aquelas que no mesmo plano:",
    opcoes: ["Se cruzam em ângulos retos", "Não se encontram em nenhuma das direções", "Se aproximam até colidir", "Formam um triângulo equilátero"],
    correta: 1,
  },
  {
    enunciado: "O que garante o Axioma 1 das Noções Comuns de Euclides?",
    opcoes: ["Coisas iguais a uma mesma coisa são iguais entre si", "O todo é menor que a parte", "Retas paralelas se cruzam", "A soma dos ângulos internos é zero"],
    correta: 0,
  },
  {
    enunciado: "O Axioma 2 afirma que se iguais são adicionados a iguais, os totais são:",
    opcoes: ["Diferentes", "Maiores", "Iguais", "Menores"],
    correta: 2,
  },
  {
    enunciado: "O Axioma 3 afirma que se iguais são subtraídos de iguais, os restos são:",
    opcoes: ["Menores", "Iguais", "Diferentes", "Maiores"],
    correta: 1,
  },
  {
    enunciado: "O Axioma 4 afirma que coisas que coincidem uma com a outra são:",
    opcoes: ["Diferentes", "Perpendiculares", "Paralelas", "Iguais entre si"],
    correta: 3,
  },
  {
    enunciado: "O famoso Axioma 5 das Noções Comuns garante que o todo é:",
    opcoes: ["Menor que a parte", "Maior do que a parte", "Igual à metade da parte", "Inexistente no plano"],
    correta: 1,
  },
  {
    enunciado: "A Proposição 1 do Livro I ensina a construir qual figura geométrica?",
    opcoes: ["Um quadrado", "Um triângulo equilátero", "Um círculo", "Uma reta paralela"],
    correta: 1,
  },
  {
    enunciado: "O Teorema de Pitágoras é qual proposição do Livro I dos Elementos?",
    opcoes: ["Proposição 1", "Proposição 20", "Proposição 47", "Proposição 48"],
    correta: 2,
  },
  {
    enunciado: "A proposição 48 do Livro I dos Elementos trata de qual teorema?",
    opcoes: ["Lei dos Senos", "Relação de Euler", "Volume da Esfera", "O recíproco do Teorema de Pitágoras"],
    correta: 3,
  },
  {
    enunciado: "Quem realizou a famosa tradução dos Elementos do árabe para o latim no século XII?",
    opcoes: ["Isaac Newton", "Adelardo de Bath", "René Descartes", "Albert Einstein"],
    correta: 1,
  },
  {
    enunciado: "Em qual ano foi impressa a primeira edição dos Elementos de Euclides em Veneza?",
    opcoes: ["1482", "1500", "1600", "1750"],
    correta: 0,
  },
  {
    enunciado: "Euclides também escreveu sobre a luz. Como se chama essa obra sobre óptica física?",
    opcoes: ["Elementos", "Óptica", "Catóptrica", "Fenômenos"],
    correta: 1,
  },
  {
    enunciado: "A frase 'Não há caminho real para a geometria' foi dita por Euclides para qual rei?",
    opcoes: ["Ptolomeu I", "Alexandre, o Grande", "Júlio César", "Leônidas I"],
    correta: 0,
  },
  {
    enunciado: "Em qual século antes de Cristo estima-se que Euclides viveu e produziu os Elementos?",
    opcoes: ["Século I a.C.", "Século III a.C.", "Século V a.C.", "Século VIII a.C."],
    correta: 1,
  },
  {
    enunciado: "Qual outro filósofo ou matemático grego teve trabalhos incluídos nos Elementos de Euclides?",
    opcoes: ["Pitágoras e Eudoxo", "Aristóteles e Sócrates", "Galileu Galilei", "Isaac Newton"],
    correta: 0,
  }
];

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarQuizEuclides(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  const perguntasJogo = embaralhar(PERGUNTAS);
  const TOTAL_PERGUNTAS = perguntasJogo.length;
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
    const p = perguntasJogo[indice]!;
    elProgress.textContent = `Pergunta ${indice + 1} / ${TOTAL_PERGUNTAS}`;
    elPergunta.textContent = p.enunciado;
    elFeedback.textContent = "";
    elScore.textContent = `Pontos parciais: ${pontosTotal}`;
    atualizarTimer();

    elOpcoes.innerHTML = "";
    const ordem = embaralhar(p.opcoes.map((_, i) => i));
    ordem.forEach((i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost quiz-opcao";
      btn.textContent = p.opcoes[i]!;
      btn.setAttribute("data-index", String(i));
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

    const p = perguntasJogo[indice]!;
    const acertou = escolha === p.correta;
    
    // Highlight option buttons
    const buttons = elOpcoes.querySelectorAll("button");
    buttons.forEach((btn) => {
      const optIdx = Number(btn.getAttribute("data-index"));
      btn.disabled = true;
      if (optIdx === p.correta) {
        btn.className = "btn quiz-opcao correct";
      } else if (optIdx === escolha) {
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