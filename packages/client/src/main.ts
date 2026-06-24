import { initCredits } from "./credits.js";
import { initHub } from "./hub.js";
import { iniciarFracoesPuzzle } from "./minigames/fracoes-puzzle.js";
import { iniciarGeometriaMemoria } from "./minigames/geometria-memoria.js";
import { iniciarGraficosCoordenadas } from "./minigames/graficos-coordenadas.js";
import { iniciarOperacoesRapidas } from "./minigames/operacoes-rapidas.js";
import { iniciarProbabilidadeSorteador } from "./minigames/probabilidade-sorteador.js";
import { iniciarQuizEuclides } from "./minigames/quiz-euclides.js";
import { iniciarSequenciaLogica } from "./minigames/sequencia-logica.js";
import { iniciarFracoesVisual } from "./minigames/fracoes-visual.js";
import { iniciarLogica } from "./minigames/logica.js";
import { iniciarCopa } from "./minigames/copa.js";
import { iniciarFormulasMatematicas } from "./minigames/formulas-matematicas.js";
import type { Jogador } from "./services/api.js";
import { buscarRodadaAtual, iniciarPartida } from "./services/api.js";
import {
  initMathParticles,
  initTypingAnimation,
  initFeedbackWatcher,
  initThemeToggle,
  initParallax,
  initScrollAnimation,
  initEasterEgg
} from "./effects.js";

type IniciarJogo = (
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
) => unknown;

const MINIGAMES: Record<string, IniciarJogo> = {
  "operacoes-rapidas": iniciarOperacoesRapidas as unknown as IniciarJogo,
  "quiz-euclides": iniciarQuizEuclides as unknown as IniciarJogo,
  "fracoes-puzzle": iniciarFracoesPuzzle as unknown as IniciarJogo,
  "geometria-memoria": iniciarGeometriaMemoria as unknown as IniciarJogo,
  "sequencia-logica": iniciarSequenciaLogica as unknown as IniciarJogo,
  "graficos-coordenadas": iniciarGraficosCoordenadas as unknown as IniciarJogo,
  "probabilidade-sorteador": iniciarProbabilidadeSorteador as unknown as IniciarJogo,
  "fracoes-visual": iniciarFracoesVisual as unknown as IniciarJogo,
  "logica": iniciarLogica as unknown as IniciarJogo,
  "copa": iniciarCopa as unknown as IniciarJogo,
  "formulas-matematicas": iniciarFormulasMatematicas as unknown as IniciarJogo,
};

/**
 * Função de inicialização principal (Bootstrap) da aplicação.
 * Inicializa efeitos visuais (partículas, tema, animações), registra o Service Worker
 * do PWA, oculta a tela de carregamento e inicializa o Hub principal do jogo.
 */
async function bootstrap() {
  // Register Service Worker for PWA mobile installability
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("Service Worker registrado com sucesso:", reg))
        .catch(err => console.error("Erro ao registrar Service Worker:", err));
    });
  }

  initThemeToggle();
  initParallax();
  initScrollAnimation();
  initEasterEgg();
  initCredits();
  initMathParticles();
  initTypingAnimation();
  initFeedbackWatcher();

  // Hide loader smoothly
  const dismissLoader = () => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("fade-out");
      setTimeout(() => {
        try { loader.remove(); } catch(e){}
      }, 600);
    }
  };

  if (document.readyState === "complete") {
    dismissLoader();
  } else {
    window.addEventListener("load", dismissLoader);
  }
  // Safety fallback to ensure UI is never stuck on loading screen
  setTimeout(dismissLoader, 1500);

  const hubApi = await initHub(async (minigameId) => {
    const jogador = hubApi.getJogador();
    if (!jogador) return;

    const { ativa } = await buscarRodadaAtual();
    if (!ativa) {
      alert(
        "A apresentação ainda não foi iniciada. Aguarde o professor liberar os desafios.",
      );
      return;
    }

    const iniciar = MINIGAMES[minigameId];
    if (!iniciar) {
      alert("Minigame não encontrado.");
      return;
    }

    try {
      const { partidaId, tokenSeguranca } = await iniciarPartida(jogador.id, minigameId);

      document.getElementById("view-hub")!.classList.add("hidden");
      const container = document.getElementById("game-container")!;
      container.classList.remove("hidden");
      container.innerHTML = "";

      iniciar(jogador, partidaId, tokenSeguranca, () => hubApi.voltarDoJogo());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao iniciar desafio.");
    }
  });
}

bootstrap();