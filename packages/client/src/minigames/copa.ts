import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("copa")!;

const QUESTIONS = [
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Artilharia Verde-Amarela 🇧🇷</strong>
        <p style="margin: 6px 0 0 0;">Um atacante fez uma média incrível de <strong>2 gols por jogo</strong> durante a Copa do Mundo.</p>
      </div>
    `,
    pergunta: "Quantos gols ele marcou no total em um torneio de 7 jogos?",
    opcoes: ["14 gols", "10 gols", "12 gols", "16 gols"],
    correta: "14 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Tabela de Pontuação 🏆</strong>
        <p style="margin: 6px 0 0 0;">Na fase de grupos, a seleção disputou 3 partidas: venceu <strong>2 jogos</strong>, empatou <strong>1 jogo</strong> e não perdeu nenhum.</p>
        <small class="muted" style="display: block; margin-top: 4px;">Regra: Vitória = 3 pontos · Empate = 1 ponto · Derrota = 0 pontos</small>
      </div>
    `,
    pergunta: "Quantos pontos no total a seleção marcou nessa fase?",
    opcoes: ["7 pontos", "6 pontos", "5 pontos", "8 pontos"],
    correta: "7 pontos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Geometria do Campo ⚽</strong>
        <p style="margin: 6px 0 0 0;">O estádio da final possui um gramado oficial de <strong>105 metros de comprimento</strong> por <strong>68 metros de largura</strong>.</p>
      </div>
    `,
    pergunta: "Qual é o perímetro total desse campo de futebol?",
    opcoes: ["346 metros", "173 metros", "300 metros", "7140 metros"],
    correta: "346 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Capacidade de Público 🏟️</strong>
        <p style="margin: 6px 0 0 0;">O estádio da final tem capacidade máxima para <strong>80.000 torcedores</strong>. Na decisão, <strong>3/4</strong> da capacidade total estava ocupada pela torcida brasileira.</p>
      </div>
    `,
    pergunta: "Quantos torcedores estavam na torcida brasileira?",
    opcoes: ["60.000", "40.000", "20.000", "50.000"],
    correta: "60.000"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Acréscimos no Segundo Tempo ⏱️</strong>
        <p style="margin: 6px 0 0 0;">O primeiro tempo teve 45 minutos regulamentares mais 3 minutos de acréscimo. O segundo tempo teve 45 minutos regulamentares mais 6 minutos de acréscimo.</p>
      </div>
    `,
    pergunta: "Qual foi o tempo total de jogo corrido (excluindo o intervalo)?",
    opcoes: ["99 minutos", "90 minutos", "96 minutos", "93 minutos"],
    correta: "99 minutos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Desempenho em Pênaltis 🧤</strong>
        <p style="margin: 6px 0 0 0;">Em uma decisão por pênaltis histórica, o goleiro titular defendeu <strong>2 de cada 5 cobranças</strong> feitas contra ele.</p>
      </div>
    `,
    pergunta: "Qual fração representa o aproveitamento de defesas do goleiro?",
    opcoes: ["2/5", "3/5", "1/2", "4/5"],
    correta: "2/5"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Cartões na Copa 🟨</strong>
        <p style="margin: 6px 0 0 0;">Uma seleção bastante agressiva levou <strong>12 cartões amarelos</strong> no total das 6 partidas disputadas.</p>
      </div>
    `,
    pergunta: "Qual foi a média de cartões amarelos por partida dessa seleção?",
    opcoes: ["2 cartões", "1.5 cartões", "3 cartões", "1 cartão"],
    correta: "2 cartões"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Área da Grande Área ⚽</strong>
        <p style="margin: 6px 0 0 0;">A grande área de um estádio moderno de futebol mede exatamente <strong>40 metros de largura</strong> por <strong>16 metros de comprimento</strong>.</p>
      </div>
    `,
    pergunta: "Qual é a área total dessa região retangular?",
    opcoes: ["640 m²", "112 m²", "400 m²", "800 m²"],
    correta: "640 m²"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Consumo de Água dos Atletas 💧</strong>
        <p style="margin: 6px 0 0 0;">Cada um dos 11 jogadores titulares de uma seleção bebe <strong>1.5 litros de água</strong> durante o intervalo do jogo.</p>
      </div>
    `,
    pergunta: "Quantos litros de água o time titular consome no total durante o intervalo?",
    opcoes: ["16.5 litros", "15.0 litros", "11.0 litros", "18.0 litros"],
    correta: "16.5 litros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Aproveitamento de Passes 📈</strong>
        <p style="margin: 6px 0 0 0;">Um meio-campista genial tentou <strong>50 passes</strong> e acertou <strong>45 deles</strong> durante a partida decisiva.</p>
      </div>
    `,
    pergunta: "Qual foi a porcentagem de passes certos desse jogador na partida?",
    opcoes: ["90%", "85%", "95%", "80%"],
    correta: "90%"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Gols Marcados 👕</strong>
        <p style="margin: 6px 0 0 0;">Nas oitavas o time fez 4 gols. Nas quartas fez 1. Na semifinal fez 2. Na final fez 3.</p>
      </div>
    `,
    pergunta: "Qual foi a média de gols por jogo dessa seleção na fase eliminatória de 4 jogos?",
    opcoes: ["2.5 gols", "2.0 gols", "3.0 gols", "1.5 gols"],
    correta: "2.5 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Grupos da Copa 🏆</strong>
        <p style="margin: 6px 0 0 0;">A Copa do Mundo conta com um total de <strong>32 seleções</strong> divididas igualmente em <strong>8 grupos</strong>.</p>
      </div>
    `,
    pergunta: "Quantas seleções há em cada grupo?",
    opcoes: ["4 seleções", "6 seleções", "8 seleções", "5 seleções"],
    correta: "4 seleções"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Substituições 🔄</strong>
        <p style="margin: 6px 0 0 0;">O treinador utilizou todas as <strong>5 substituições</strong> permitidas em cada uma das 7 partidas da sua equipe.</p>
      </div>
    `,
    pergunta: "Quantas substituições ele fez no total durante todo o torneio?",
    opcoes: ["35 substituições", "30 substituições", "25 substituições", "40 substituições"],
    correta: "35 substituições"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Preço dos Ingressos 🎫</strong>
        <p style="margin: 6px 0 0 0;">O ingresso da arquibancada custava <strong>R$ 200</strong>, mas sofreu um acréscimo de <strong>20%</strong> na grande final.</p>
      </div>
    `,
    pergunta: "Qual o novo valor do ingresso reajustado para a final?",
    opcoes: ["R$ 240", "R$ 220", "R$ 250", "R$ 260"],
    correta: "R$ 240"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Velocidade do Chute 🚀</strong>
        <p style="margin: 6px 0 0 0;">Um chute potente de falta faz a bola percorrer incríveis <strong>30 metros em apenas 1 segundo</strong>.</p>
      </div>
    `,
    pergunta: "Se mantivesse essa velocidade, quantos metros a bola percorreria em 3 segundos?",
    opcoes: ["90 metros", "60 metros", "120 metros", "80 metros"],
    correta: "90 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Viagem da Seleção ✈️</strong>
        <p style="margin: 6px 0 0 0;">O avião fretado que transportava a seleção voou a uma velocidade de <strong>800 km/h</strong> por <strong>3 horas</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a distância total percorrida pelo voo da seleção?",
    opcoes: ["2400 km", "1600 km", "2000 km", "2800 km"],
    correta: "2400 km"
  }
];

export function iniciarCopa(
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

  const ui = montarShell(
    container,
    META,
    `<div id="cp-scenario" style="width:100%;"></div>
     <p class="mg-prompt" id="cp-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;"></p>
     <div class="options-grid" id="cp-options"></div>
     <div class="feedback-area hidden" id="cp-feedback" style="margin-top:15px;">
       <p id="cp-feedback-text"></p>
       <button type="button" id="btn-cp-next" class="btn primary btn-sm">Próxima</button>
     </div>`,
  );

  const elScenario = document.getElementById("cp-scenario")!;
  const elPrompt = document.getElementById("cp-prompt")!;
  const elOptions = document.getElementById("cp-options")!;
  const elFeedback = document.getElementById("cp-feedback")!;
  const elFeedbackText = document.getElementById("cp-feedback-text")!;
  const btnNext = document.getElementById("btn-cp-next")!;

  function obterPontosAtuais() {
    return Math.round((acertos / QUESTIONS.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${QUESTIONS.length} · ${obterPontosAtuais()} pts`);
  }

  function renderQuestao() {
    if (indice >= QUESTIONS.length) {
      void encerrar("Todas as questões respondidas!");
      return;
    }

    const q = QUESTIONS[indice];
    elScenario.innerHTML = q.scenario;
    elPrompt.textContent = q.pergunta;
    elOptions.innerHTML = "";
    elFeedback.classList.add("hidden");
    atualizarScore();

    q.opcoes.forEach((opt) => {
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
    const q = QUESTIONS[indice];
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
      elFeedbackText.innerHTML = "<span style='color: var(--success); font-weight: bold;'>Golaço! ⚽🏆</span> Conta correta.";
    } else {
      elFeedbackText.innerHTML = `<span style='color: var(--danger); font-weight: bold;'>Impedimento! ❌</span> A resposta correta era <strong>${q.correta}</strong>.`;
    }

    indice++;
    atualizarScore();
    elFeedback.classList.remove("hidden");
  }

  btnNext.addEventListener("click", () => {
    renderQuestao();
  });

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
      metadata: { acertos, total: QUESTIONS.length, motivo },
      mensagem: `${motivo} · ${acertos}/${QUESTIONS.length} certas`,
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
