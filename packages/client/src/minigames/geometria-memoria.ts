import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("geometria-memoria")!;
const PTS_PAR = 44;

const PARES = [
  { id: "tri", label: "△ Triângulo" },
  { id: "quad", label: "□ Quadrado" },
  { id: "circ", label: "○ Círculo" },
  { id: "hex", label: "⬡ Hexágono" },
  { id: "ang90", label: "90° Ângulo reto" },
  { id: "ang60", label: "60° Agudo" },
];

interface Carta {
  uid: number;
  parId: string;
  label: string;
  virada: boolean;
  encontrada: boolean;
}

export function iniciarGeometriaMemoria(
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
  let paresEncontrados = 0;
  let primeira: Carta | null = null;
  let bloqueado = false;

  const cartas: Carta[] = [];
  let uid = 0;
  for (const p of PARES) {
    cartas.push({ uid: uid++, parId: p.id, label: p.label, virada: false, encontrada: false });
    cartas.push({ uid: uid++, parId: p.id, label: p.label, virada: false, encontrada: false });
  }
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j]!, cartas[i]!];
  }

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt">Encontre os 6 pares de figuras e ângulos</p>
     <div class="mg-memory-grid" id="mg-memory"></div>`,
  );

  const grid = document.getElementById("mg-memory")!;

  function atualizarScore() {
    const pts = paresEncontrados === PARES.length ? 350 : paresEncontrados * 58;
    ui.setScore(`Pares: ${paresEncontrados}/${PARES.length} · ${pts} pts`);
  }

  function renderGrid() {
    grid.innerHTML = "";
    cartas.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-memory-card";
      if (c.encontrada) btn.classList.add("matched");
      else if (c.virada) btn.classList.add("flipped");
      btn.textContent = c.virada || c.encontrada ? c.label : "?";
      btn.disabled = c.encontrada || bloqueado;
      btn.addEventListener("click", () => virar(c));
      grid.appendChild(btn);
    });
  }

  function virar(carta: Carta) {
    if (finalizado || bloqueado || carta.virada || carta.encontrada) return;
    carta.virada = true;
    renderGrid();

    if (!primeira) {
      primeira = carta;
      return;
    }

    bloqueado = true;
    if (primeira.parId === carta.parId) {
      primeira.encontrada = true;
      carta.encontrada = true;
      paresEncontrados++;
      ui.setFeedback(`Par encontrado! +${PTS_PAR} pts`, "ok");
      atualizarScore();
      primeira = null;
      bloqueado = false;
      renderGrid();
      if (paresEncontrados >= PARES.length) {
        void encerrar("Todos os pares encontrados!");
      }
    } else {
      ui.setFeedback("Não é par — tente de novo", "erro");
      setTimeout(() => {
        primeira!.virada = false;
        carta.virada = false;
        primeira = null;
        bloqueado = false;
        renderGrid();
      }, 650);
    }
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    grid.innerHTML = "";
    const pontosFinais = paresEncontrados === PARES.length ? 350 : paresEncontrados * 58;
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
      metadata: { paresEncontrados, total: PARES.length, motivo },
      mensagem: `${motivo} · ${paresEncontrados} pares`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  atualizarScore();
  renderGrid();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}