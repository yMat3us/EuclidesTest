import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("geometria-memoria")!;
const PTS_PAR = 58; // 6 * 58 ≈ 350 pts

const POOL_PARES = [
  { id: "tri", label: "△ Triângulo" },
  { id: "quad", label: "□ Quadrado" },
  { id: "circ", label: "○ Círculo" },
  { id: "hex", label: "⬡ Hexágono" },
  { id: "ang90", label: "90° Ângulo reto" },
  { id: "ang60", label: "60° Agudo" },
  
  { id: "ang180", label: "180° Raso" },
  { id: "ang120", label: "120° Obtuso" },
  { id: "tri-eq", label: "△ Equilátero" },
  { id: "tri-is", label: "△ Isósceles" },
  { id: "tri-es", label: "△ Escaleno" },
  { id: "retan", label: "▭ Retângulo" },
  { id: "losan", label: "♢ Losango" },
  { id: "trap", label: "⏢ Trapézio" },
  { id: "pent", label: "⬠ Pentágono" },
  { id: "octa", label: "⯃ Octógono" },
  { id: "raio", label: "r Raio do Círculo" },
  { id: "diam", label: "d Diâmetro (2r)" },
  { id: "perim", label: "P Perímetro" },
  { id: "area-q", label: "A = L² (Área Q)" },
  
  { id: "area-t", label: "A = b·h/2 (Área T)" },
  { id: "diag", label: "Diagonal" },
  { id: "ang-comp", label: "α+β=90° Comp" },
  { id: "ang-supl", label: "α+β=180° Supl" },
  { id: "biset", label: "Bissetriz" },
  { id: "vert", label: "Vértice" },
  { id: "aresta", label: "Aresta" },
  { id: "face", label: "Face" },
  { id: "cubo", label: "🧊 Cubo" },
  { id: "esfera", label: "⚽ Esfera" },
  
  { id: "cil", label: "🧪 Cilindro" },
  { id: "cone", label: "🍦 Cone" },
  { id: "piram", label: "▲ Pirâmide" },
  { id: "prisma", label: "Prisma" },
  { id: "pitag", label: "a² = b² + c²" },
  { id: "hipot", label: "Hipotenusa" },
  { id: "cateto", label: "Cateto" },
  { id: "pi", label: "π ≈ 3,1415" },
  { id: "graus360", label: "360° Círculo" },
  { id: "semir", label: "Semirreta" },
  
  { id: "paral", label: "|| Paralelas" },
  { id: "perp", label: "⊥ Perpendiculares" },
  { id: "concor", label: "X Concorrentes" },
  { id: "tang", label: "Tangente" },
  { id: "secan", label: "Secante" },
  { id: "pol-reg", label: "Polígono Regular" },
  { id: "pol-irreg", label: "Polígono Irregular" },
  { id: "baric", label: "Baricentro" },
  { id: "circun", label: "C = 2·π·r" },
  { id: "ortoc", label: "Ortocentro" },
  { id: "incent", label: "Incentro" },
  { id: "diagonal-q", label: "d = L·√2" }
];

interface Carta {
  uid: number;
  parId: string;
  label: string;
  virada: boolean;
  encontrada: boolean;
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
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

  // Choose 6 random pairs from the 52 pool
  const jogoPares = embaralhar(POOL_PARES).slice(0, 6);

  const cartas: Carta[] = [];
  let uid = 0;
  for (const p of jogoPares) {
    cartas.push({ uid: uid++, parId: p.id, label: p.label, virada: false, encontrada: false });
    cartas.push({ uid: uid++, parId: p.id, label: p.label, virada: false, encontrada: false });
  }
  
  // Shuffle the 12 cards
  const cartasEmbaralhadas = embaralhar(cartas);

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt">Encontre os 6 pares de figuras e ângulos</p>
     <div class="mg-memory-grid" id="mg-memory"></div>`,
  );

  const grid = document.getElementById("mg-memory")!;

  function atualizarScore() {
    const pts = paresEncontrados === jogoPares.length ? 350 : paresEncontrados * PTS_PAR;
    ui.setScore(`Pares: ${paresEncontrados}/${jogoPares.length} · ${pts} pts`);
  }

  function renderGrid() {
    grid.innerHTML = "";
    cartasEmbaralhadas.forEach((c) => {
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
      ui.setFeedback(`Par encontrado!`, "ok");
      atualizarScore();
      primeira = null;
      bloqueado = false;
      renderGrid();
      if (paresEncontrados >= jogoPares.length) {
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
    const pontosFinais = paresEncontrados === jogoPares.length ? 350 : paresEncontrados * PTS_PAR;
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
      metadata: { paresEncontrados, total: jogoPares.length, motivo },
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