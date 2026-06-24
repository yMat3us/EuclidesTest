import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("formulas-matematicas")!;

const QUESTIONS = [
  {
    formula: "x = (-b ± √(b² - 4ac)) / 2a",
    pergunta: "A qual assunto pertence a Fórmula de Bhaskara?",
    opcoes: ["Equação do 2º Grau", "Geometria Espacial", "Matemática Financeira", "Trigonometria"],
    correta: "Equação do 2º Grau"
  },
  {
    formula: "a² = b² + c²",
    pergunta: "A qual assunto pertence o Teorema de Pitágoras?",
    opcoes: ["Trigonometria / Geometria", "Probabilidade", "Álgebra / Logaritmos", "Cálculo Limites"],
    correta: "Trigonometria / Geometria"
  },
  {
    formula: "A = π · r²",
    pergunta: "A qual assunto pertence a fórmula da área mostrada?",
    opcoes: ["Geometria Plana", "Matemática Financeira", "Estatística", "Álgebra Linear"],
    correta: "Geometria Plana"
  },
  {
    formula: "V - A + F = 2",
    pergunta: "A qual assunto pertence a Relação de Euler?",
    opcoes: ["Geometria Espacial / Topologia", "Trigonometria", "Matemática Financeira", "Aritmética Básica"],
    correta: "Geometria Espacial / Topologia"
  },
  {
    formula: "J = C · i · t",
    pergunta: "A qual assunto pertence a fórmula dos Juros Simples?",
    opcoes: ["Matemática Financeira", "Álgebra de Funções", "Probabilidade", "Geometria Analítica"],
    correta: "Matemática Financeira"
  },
  {
    formula: "P(A) = n(E) / n(S)",
    pergunta: "A qual assunto pertence a definição clássica de Probabilidade?",
    opcoes: ["Probabilidade", "Equação do 2º Grau", "Geometria Espacial", "Trigonometria"],
    correta: "Probabilidade"
  },
  {
    formula: "V = (4/3) · π · r³",
    pergunta: "A qual assunto pertence a fórmula do Volume da Esfera?",
    opcoes: ["Geometria Espacial", "Geometria Plana", "Matemática Financeira", "Álgebra Linear"],
    correta: "Geometria Espacial"
  },
  {
    formula: "M = C · (1 + i)ᵗ",
    pergunta: "A qual assunto pertence a fórmula de Juros Compostos?",
    opcoes: ["Matemática Financeira", "Análise Combinatória", "Estatística", "Geometria Analítica"],
    correta: "Matemática Financeira"
  },
  {
    formula: "Sₙ = ((a₁ + aₙ) · n) / 2",
    pergunta: "A qual assunto pertence a fórmula da Soma dos Termos?",
    opcoes: ["Progressão Aritmética", "Progressão Geométrica", "Análise Combinatória", "Logaritmos"],
    correta: "Progressão Aritmética"
  },
  {
    formula: "aₙ = a₁ · qⁿ⁻¹",
    pergunta: "A qual assunto pertence a fórmula do Termo Geral?",
    opcoes: ["Progressão Geométrica", "Progressão Aritmética", "Matemática Financeira", "Funções afins"],
    correta: "Progressão Geométrica"
  },
  {
    formula: "f(x) = ax + b",
    pergunta: "A qual assunto pertence a estrutura clássica mostrada?",
    opcoes: ["Funções (1º Grau)", "Funções (2º Grau)", "Função Exponencial", "Progressão Geométrica"],
    correta: "Funções (1º Grau)"
  },
  {
    formula: "f(x) = aˣ",
    pergunta: "A qual assunto pertence a função ilustrada?",
    opcoes: ["Função Exponencial", "Funções (1º Grau)", "Logaritmos", "Trigonometria"],
    correta: "Função Exponencial"
  },
  {
    formula: "log_a(b) = x ⇔ aˣ = b",
    pergunta: "A qual assunto pertence a definição mostrada?",
    opcoes: ["Logaritmos", "Função Exponencial", "Matemática Financeira", "Análise Combinatória"],
    correta: "Logaritmos"
  },
  {
    formula: "Xᵥ = -b / (2a)",
    pergunta: "A qual assunto pertence a fórmula da Coordenada do Vértice?",
    opcoes: ["Equação do 2º Grau / Funções", "Trigonometria", "Geometria Plana", "Estatística"],
    correta: "Equação do 2º Grau / Funções"
  },
  {
    formula: "A = (b · h) / 2",
    pergunta: "A qual assunto pertence a fórmula de área mostrada?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Geometria Analítica", "Matemática Financeira"],
    correta: "Geometria Plana"
  },
  {
    formula: "A = ((B + b) · h) / 2",
    pergunta: "A qual assunto pertence a fórmula da área do Trapézio?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Geometria Analítica", "Matemática Financeira"],
    correta: "Geometria Plana"
  },
  {
    formula: "d = √((x₂ - x₁)² + (y₂ - y₁)²)",
    pergunta: "A qual assunto pertence a fórmula da distância mostrada?",
    opcoes: ["Geometria Analítica", "Geometria Plana", "Geometria Espacial", "Funções"],
    correta: "Geometria Analítica"
  },
  {
    formula: "Ax + By + C = 0",
    pergunta: "A qual assunto pertence a equação da reta mostrada?",
    opcoes: ["Geometria Analítica", "Geometria Plana", "Logaritmos", "Trigonometria"],
    correta: "Geometria Analítica"
  },
  {
    formula: "(x - x₀)² + (y - y₀)² = R²",
    pergunta: "A qual assunto pertence a equação mostrada?",
    opcoes: ["Geometria Analítica", "Geometria Plana", "Geometria Espacial", "Estatística"],
    correta: "Geometria Analítica"
  },
  {
    formula: "sen(θ) = Cateto Oposto / Hipotenusa",
    pergunta: "A qual assunto pertence a definição trigonométrica?",
    opcoes: ["Trigonometria", "Geometria Plana", "Função Exponencial", "Estatística"],
    correta: "Trigonometria"
  },
  {
    formula: "a / sen(A) = b / sen(B) = c / sen(C)",
    pergunta: "A qual assunto pertence a relação mostrada?",
    opcoes: ["Trigonometria (Lei dos Senos)", "Trigonometria (Lei dos Cossenos)", "Geometria Plana", "Estatística"],
    correta: "Trigonometria (Lei dos Senos)"
  },
  {
    formula: "a² = b² + c² - 2bc · cos(A)",
    pergunta: "A qual assunto pertence a fórmula mostrada?",
    opcoes: ["Trigonometria (Lei dos Cossenos)", "Trigonometria (Lei dos Senos)", "Geometria Plana", "Geometria Analítica"],
    correta: "Trigonometria (Lei dos Cossenos)"
  },
  {
    formula: "A(n, k) = n! / (n - k)!",
    pergunta: "A qual assunto pertence a fórmula do Arranjo Simples?",
    opcoes: ["Análise Combinatória", "Matemática Financeira", "Probabilidade", "Logaritmos"],
    correta: "Análise Combinatória"
  },
  {
    formula: "C(n, k) = n! / (k! · (n - k)!)",
    pergunta: "A qual assunto pertence a fórmula da Combinação Simples?",
    opcoes: ["Análise Combinatória", "Matemática Financeira", "Probabilidade", "Funções"],
    correta: "Análise Combinatória"
  },
  {
    formula: "P(n) = n!",
    pergunta: "A qual assunto pertence a fórmula da Permutação Simples?",
    opcoes: ["Análise Combinatória", "Probabilidade", "Progressão Aritmética", "Progressão Geométrica"],
    correta: "Análise Combinatória"
  },
  {
    formula: "A = (D · d) / 2",
    pergunta: "A qual assunto pertence a fórmula de área exibida?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Geometria Analítica", "Matemática Financeira"],
    correta: "Geometria Plana"
  },
  {
    formula: "V = π · r² · h",
    pergunta: "A qual assunto pertence a fórmula do volume mostrada?",
    opcoes: ["Geometria Espacial", "Geometria Plana", "Geometria Analítica", "Matemática Financeira"],
    correta: "Geometria Espacial"
  },
  {
    formula: "V = (π · r² · h) / 3",
    pergunta: "A qual assunto pertence a fórmula de volume exibida?",
    opcoes: ["Geometria Espacial", "Geometria Plana", "Geometria Analítica", "Logaritmos"],
    correta: "Geometria Espacial"
  },
  {
    formula: "M = (x₁ + x₂ + ... + xₙ) / n",
    pergunta: "A qual assunto pertence a fórmula exibida?",
    opcoes: ["Estatística (Média Aritmética)", "Estatística (Desvio Padrão)", "Probabilidade", "Aritmética Básica"],
    correta: "Estatística (Média Aritmética)"
  },
  {
    formula: "σ = √(∑(x_i - μ)² / N)",
    pergunta: "A qual assunto pertence a fórmula da estatística exibida?",
    opcoes: ["Estatística (Desvio Padrão)", "Estatística (Média Aritmética)", "Probabilidade", "Progressão Aritmética"],
    correta: "Estatística (Desvio Padrão)"
  },
  {
    formula: "S_i = (n - 2) · 180°",
    pergunta: "A qual assunto pertence a fórmula da soma dos ângulos internos?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Trigonometria", "Progressão Geométrica"],
    correta: "Geometria Plana"
  },
  {
    formula: "a / b = c / d",
    pergunta: "A qual assunto pertence a proporção ilustrada?",
    opcoes: ["Geometria Plana (Teorema de Tales)", "Matemática Financeira", "Trigonometria", "Probabilidade"],
    correta: "Geometria Plana (Teorema de Tales)"
  },
  {
    formula: "S² = ∑(x_i - M)² / (n - 1)",
    pergunta: "A qual assunto pertence a fórmula estatística ilustrada?",
    opcoes: ["Estatística (Variância)", "Estatística (Desvio Padrão)", "Probabilidade", "Matemática Financeira"],
    correta: "Estatística (Variância)"
  },
  {
    formula: "sen²(x) + cos²(x) = 1",
    pergunta: "A qual assunto pertence a Relação Fundamental?",
    opcoes: ["Trigonometria", "Geometria Plana", "Funções", "Logaritmos"],
    correta: "Trigonometria"
  },
  {
    formula: "A = l²",
    pergunta: "A qual assunto pertence a fórmula da área do Quadrado?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Trigonometria", "Matemática Financeira"],
    correta: "Geometria Plana"
  },
  {
    formula: "A = b · h",
    pergunta: "A qual assunto pertence a fórmula da área do Retângulo?",
    opcoes: ["Geometria Plana", "Geometria Espacial", "Geometria Analítica", "Matemática Financeira"],
    correta: "Geometria Plana"
  },
  {
    formula: "V = a³",
    pergunta: "A qual assunto pertence a fórmula do Volume do Cubo?",
    opcoes: ["Geometria Espacial", "Geometria Plana", "Trigonometria", "Funções"],
    correta: "Geometria Espacial"
  },
  {
    formula: "V = a · b · c",
    pergunta: "A qual assunto pertence a fórmula do Volume do Paralelepípedo?",
    opcoes: ["Geometria Espacial", "Geometria Plana", "Geometria Analítica", "Progressões"],
    correta: "Geometria Espacial"
  },
  {
    formula: "h² = co² + ca²",
    pergunta: "A qual assunto pertence a relação de lados do triângulo retângulo?",
    opcoes: ["Trigonometria", "Geometria Analítica", "Análise Combinatória", "Estatística"],
    correta: "Trigonometria"
  },
  {
    formula: "Mₚ = (x₁w₁ + x₂w₂ + ... + xₙwₙ) / (w₁ + w₂ + ... + wₙ)",
    pergunta: "A qual assunto pertence a fórmula estatística ilustrada?",
    opcoes: ["Estatística (Média Ponderada)", "Estatística (Variância)", "Probabilidade", "Matemática Financeira"],
    correta: "Estatística (Média Ponderada)"
  },
  {
    formula: "aₙ = a₁ + (n - 1) · r",
    pergunta: "A qual assunto pertence a fórmula do Termo Geral da PA?",
    opcoes: ["Progressão Aritmética", "Progressão Geométrica", "Análise Combinatória", "Logaritmos"],
    correta: "Progressão Aritmética"
  },
  {
    formula: "Sₙ = a₁ · (qⁿ - 1) / (q - 1)",
    pergunta: "A qual assunto pertence a fórmula da soma da PG finita?",
    opcoes: ["Progressão Geométrica", "Progressão Aritmética", "Análise Combinatória", "Matemática Financeira"],
    correta: "Progressão Geométrica"
  },
  {
    formula: "S = a₁ / (1 - q)",
    pergunta: "A qual assunto pertence a fórmula da soma da PG infinita?",
    opcoes: ["Progressão Geométrica", "Progressão Aritmética", "Logaritmos", "Funções"],
    correta: "Progressão Geométrica"
  },
  {
    formula: "y = mx + n",
    pergunta: "A qual assunto pertence a Equação Reduzida da Reta?",
    opcoes: ["Geometria Analítica", "Geometria Plana", "Trigonometria", "Matemática Financeira"],
    correta: "Geometria Analítica"
  },
  {
    formula: "m = (y₂ - y₁) / (x₂ - x₁)",
    pergunta: "A qual assunto pertence a fórmula do Coeficiente Angular?",
    opcoes: ["Geometria Analítica", "Geometria Plana", "Trigonometria", "Estatística"],
    correta: "Geometria Analítica"
  },
  {
    formula: "cos(θ) = Cateto Adjacente / Hipotenusa",
    pergunta: "A qual assunto pertence a razão cosseno exibida?",
    opcoes: ["Trigonometria", "Geometria Plana", "Geometria Analítica", "Funções"],
    correta: "Trigonometria"
  },
  {
    formula: "tg(θ) = Cateto Oposto / Cateto Adjacente",
    pergunta: "A qual assunto pertence a razão tangente exibida?",
    opcoes: ["Trigonometria", "Geometria Plana", "Logaritmos", "Funções"],
    correta: "Trigonometria"
  },
  {
    formula: "P(Aᶜ) = 1 - P(A)",
    pergunta: "A qual assunto pertence a fórmula complementar exibida?",
    opcoes: ["Probabilidade", "Análise Combinatória", "Estatística", "Logaritmos"],
    correta: "Probabilidade"
  },
  {
    formula: "log_a(b · c) = log_a(b) + log_a(c)",
    pergunta: "A qual assunto pertence a propriedade do produto de logaritmos?",
    opcoes: ["Logaritmos", "Função Exponencial", "Matemática Financeira", "Progressão Geométrica"],
    correta: "Logaritmos"
  },
  {
    formula: "log_a(b / c) = log_a(b) - log_a(c)",
    pergunta: "A qual assunto pertence a propriedade do quociente de logaritmos?",
    opcoes: ["Logaritmos", "Função Exponencial", "Matemática Financeira", "Progressão Aritmética"],
    correta: "Logaritmos"
  },
  {
    formula: "log_a(bᵏ) = k · log_a(b)",
    pergunta: "A qual assunto pertence a propriedade da potência de logaritmos?",
    opcoes: ["Logaritmos", "Função Exponencial", "Análise Combinatória", "Progressão Geométrica"],
    correta: "Logaritmos"
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

export function iniciarFormulasMatematicas(
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

  // Shuffle questions (using all of them, no slicing to 10!)
  const jogoQuestoes = embaralhar(QUESTIONS);

  const ui = montarShell(
    container,
    META,
    `<div class="visual-formula-box" id="fm-formula-text-box" style="margin-bottom:20px; display:flex; justify-content:center; align-items:center; background: rgba(11, 11, 20, 0.9); border: 2px solid var(--copa-verde); border-radius: 12px; padding: 25px; box-shadow: 0 8px 32px 0 rgba(0,255,128,0.15); min-height: 100px;">
       <span id="fm-formula-text" style="font-family: 'Outfit', monospace; font-size: 1.6rem; color: #fff; font-weight: bold; text-align: center; text-shadow: 0 0 10px rgba(0, 255, 128, 0.4); word-break: break-all;"></span>
     </div>
     <p class="mg-prompt" id="fm-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;"></p>
     <div class="options-grid" id="fm-options"></div>
     <div class="feedback-area hidden" id="fm-feedback" style="margin-top:15px;">
       <p id="fm-feedback-text" style="margin: 0; text-align: center; font-size: 1.1rem;"></p>
     </div>`,
  );

  const elFormulaText = document.getElementById("fm-formula-text")!;
  const elPrompt = document.getElementById("fm-prompt")!;
  const elOptions = document.getElementById("fm-options")!;
  const elFeedback = document.getElementById("fm-feedback")!;
  const elFeedbackText = document.getElementById("fm-feedback-text")!;

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function renderQuestao() {
    if (indice >= jogoQuestoes.length) {
      void encerrar("Todas as questões respondidas!");
      return;
    }

    const q = jogoQuestoes[indice]!;
    elFormulaText.textContent = q.formula;
    elPrompt.textContent = q.pergunta;
    elOptions.innerHTML = "";
    elFeedback.classList.add("hidden");
    atualizarScore();
    ui.resetSpeedBar?.();

    const opcoesEmbaralhadas = embaralhar(q.opcoes);
    opcoesEmbaralhadas.forEach((opt) => {
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
    if (finalizado) return;
    const q = jogoQuestoes[indice]!;
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
      elFeedbackText.innerHTML = "<span style='color: var(--success); font-weight: bold;'>Excelente! 🧠📐</span> Resposta correta.";
    } else {
      elFeedbackText.innerHTML = `<span style='color: var(--danger); font-weight: bold;'>Incorreto! ❌</span> A resposta correta era <strong>${q.correta}</strong>.`;
    }

    indice++;
    atualizarScore();
    elFeedback.classList.remove("hidden");

    // Auto-proceed after 1200ms
    setTimeout(() => {
      renderQuestao();
    }, 1200);
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
      mensagem: `${motivo} · ${acertos}/${jogoQuestoes.length} certas`,
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
