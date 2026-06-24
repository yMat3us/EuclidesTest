import Phaser from "phaser";
import { getMinigame } from "@ddm/shared";
import { enviarPontuacao } from "../services/api.js";
import type { Jogador } from "../services/api.js";
import { agendarVoltaArena } from "./minigame-ui.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";

const META = getMinigame("operacoes-rapidas")!;
/** 2 minutos — mantido explícito para não depender de build desatualizado de @ddm/shared */
const DURACAO_SEGUNDOS = 120;
const MIN_OPERACOES = 35;

interface Problema {
  texto: string;
  resposta: number;
}

function gerarProblema(): Problema {
  const tipo = Phaser.Math.Between(0, 9);

  if (tipo === 0) {
    const a = Phaser.Math.Between(45, 199);
    const b = Phaser.Math.Between(45, 199);
    return { texto: `${a} + ${b} = ?`, resposta: a + b };
  }
  if (tipo === 1) {
    let a = Phaser.Math.Between(80, 249);
    let b = Phaser.Math.Between(17, 89);
    if (a < b) [a, b] = [b, a];
    return { texto: `${a} − ${b} = ?`, resposta: a - b };
  }
  if (tipo === 2) {
    const a = Phaser.Math.Between(11, 24);
    const b = Phaser.Math.Between(11, 24);
    return { texto: `${a} × ${b} = ?`, resposta: a * b };
  }
  if (tipo === 3) {
    const b = Phaser.Math.Between(4, 16);
    const resposta = Phaser.Math.Between(6, 22);
    const a = b * resposta;
    return { texto: `${a} ÷ ${b} = ?`, resposta };
  }
  if (tipo === 4) {
    const a = Phaser.Math.Between(5, 14);
    const b = Phaser.Math.Between(5, 14);
    const c = Phaser.Math.Between(8, 35);
    return { texto: `${a} × ${b} + ${c} = ?`, resposta: a * b + c };
  }
  if (tipo === 5) {
    const a = Phaser.Math.Between(25, 90);
    const b = Phaser.Math.Between(6, 18);
    const c = Phaser.Math.Between(4, 12);
    return { texto: `${a} + ${b} × ${c} = ?`, resposta: a + b * c };
  }
  if (tipo === 6) {
    const a = Phaser.Math.Between(8, 22);
    const b = Phaser.Math.Between(8, 22);
    const c = Phaser.Math.Between(5, 18);
    return { texto: `(${a} + ${b}) × ${c} = ?`, resposta: (a + b) * c };
  }
  if (tipo === 7) {
    const a = Phaser.Math.Between(40, 120);
    const b = Phaser.Math.Between(6, 15);
    const c = Phaser.Math.Between(3, 9);
    const prod = b * c;
    return { texto: `${a} − ${prod} = ?`, resposta: a - prod };
  }
  if (tipo === 8) {
    const n = Phaser.Math.Between(6, 15);
    return { texto: `${n}² = ?`, resposta: n * n };
  }
  const a = Phaser.Math.Between(12, 28);
  const b = Phaser.Math.Between(4, 11);
  const c = Phaser.Math.Between(10, 40);
  return { texto: `${a} × ${b} − ${c} = ?`, resposta: a * b - c };
}

function criarFilaProblemas(quantidade: number): Problema[] {
  const lista: Problema[] = [];
  for (let i = 0; i < quantidade; i++) lista.push(gerarProblema());
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Phaser.Math.Between(0, i);
    [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  }
  return lista;
}

export function iniciarOperacoesRapidas(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): Phaser.Game {
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let acertos = 0;
  let erros = 0;
  let tentativas = 0;
  let tempoRestante = DURACAO_SEGUNDOS;
  const fila = criarFilaProblemas(MIN_OPERACOES + 8);
  let indiceFila = 0;
  let problema = fila[indiceFila]!;
  let inputValor = "";
  let finalizado = false;
  let tempoInicioEquacao = Date.now();
  let acertosComBonus = 0;

  // Criar input oculto para suportar teclado virtual em dispositivos móveis
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "text";
  hiddenInput.inputMode = "numeric";
  hiddenInput.pattern = "[0-9\\-]*";
  hiddenInput.id = "hidden-game-input";
  hiddenInput.style.position = "absolute";
  hiddenInput.style.opacity = "0";
  hiddenInput.style.pointerEvents = "none";
  hiddenInput.style.zIndex = "-100";
  hiddenInput.style.left = "-9999px";
  hiddenInput.style.top = "-9999px";
  hiddenInput.style.fontSize = "16px"; // Evita zoom automático no iOS Safari
  document.getElementById("game-container")?.appendChild(hiddenInput);

  const originalOnFim = onFim;
  onFim = () => {
    try { hiddenInput.remove(); } catch (e) {}
    originalOnFim();
  };

  function proximoProblema(): Problema {
    indiceFila++;
    if (indiceFila >= fila.length) {
      fila.push(gerarProblema());
    }
    return fila[indiceFila]!;
  }

  class Cena extends Phaser.Scene {
    textoConta!: Phaser.GameObjects.Text;
    textoInput!: Phaser.GameObjects.Text;
    textoTimer!: Phaser.GameObjects.Text;
    textoScore!: Phaser.GameObjects.Text;
    textoOps!: Phaser.GameObjects.Text;

    create() {
      const { width, height } = this.scale;

      this.add
        .text(width / 2, 28, "Euclides Test", {
          fontFamily: "Syne, sans-serif",
          fontSize: "14px",
          color: "#818cf8",
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, 52, META.nome, {
          fontFamily: "Syne, sans-serif",
          fontSize: "26px",
          color: "#22d3ee",
        })
        .setOrigin(0.5);

      this.textoTimer = this.add
        .text(width / 2, 95, "", {
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "22px",
          color: "#fbbf24",
        })
        .setOrigin(0.5);

      this.textoScore = this.add
        .text(width / 2, 128, "", {
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "16px",
          color: "#9898b0",
        })
        .setOrigin(0.5);

      this.textoOps = this.add
        .text(width / 2, 152, "", {
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: "#5c5c78",
        })
        .setOrigin(0.5);

      this.textoConta = this.add
        .text(width / 2, height / 2 - 30, "", {
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "44px",
          color: "#f4f4f8",
        })
        .setOrigin(0.5);

      this.textoInput = this.add
        .text(width / 2, height / 2 + 44, "", {
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "38px",
          color: "#34d399",
        })
        .setOrigin(0.5);

      this.add
        .text(
          width / 2,
          height - 56,
          `Toque na tela para abrir o teclado · ENTER confirma`,
          {
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#5c5c78",
          },
        )
        .setOrigin(0.5);

      // Focar no input oculto ao clicar/tocar na tela
      this.input.on("pointerdown", () => {
        hiddenInput.focus();
      });

      // Tentar focar inicialmente
      setTimeout(() => {
        hiddenInput.focus();
      }, 300);

      // Escutar entrada no input oculto
      hiddenInput.addEventListener("input", () => {
        if (finalizado || tempoRestante <= 0) return;
        let val = hiddenInput.value.replace(/[^0-9\-]/g, "");
        
        // Apenas permite um sinal de menos no início
        if (val.indexOf("-") > 0) {
          val = val.charAt(0) + val.slice(1).replace(/-/g, "");
        }
        
        if (val.length > 10) val = val.slice(0, 10);
        hiddenInput.value = val;
        inputValor = val;
        this.atualizarUI();
      });

      hiddenInput.addEventListener("keydown", (event) => {
        if (finalizado || tempoRestante <= 0) return;

        if (event.key === "Enter") {
          event.preventDefault();
          const valor = parseInt(inputValor, 10);
          if (!Number.isNaN(valor)) {
            tentativas++;
            if (valor === problema.resposta) {
              acertos++;
              const tempoGasto = (Date.now() - tempoInicioEquacao) / 1000;
              let mult = 1.0;
              if (tempoGasto <= 1.5) mult = 1.3;
              else if (tempoGasto <= 3.0) mult = 1.15;
              else if (tempoGasto > 6.0) mult = 0.7;
              acertosComBonus += mult;
            } else {
              erros++;
            }
            tempoInicioEquacao = Date.now();
          }
          inputValor = "";
          hiddenInput.value = "";
          problema = proximoProblema();
          this.atualizarUI();
        }
      });

      this.atualizarUI();

      this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          if (finalizado) return;
          tempoRestante--;
          this.atualizarUI();
          if (tempoRestante <= 0) void this.finalizar();
        },
      });
    }

    atualizarUI() {
      this.textoTimer.setText(`⏱ ${tempoRestante}s`);
      this.textoScore.setText(`✓ ${acertos}  ✗ ${erros}`);
      this.textoOps.setText(
        `Conta ${tentativas + 1} · ${fila.length}+ operações no desafio`,
      );
      this.textoConta.setText(problema.texto);
      this.textoInput.setText(inputValor ? inputValor : "_");
    }

    async finalizar() {
      if (finalizado) return;
      finalizado = true;
      try { hiddenInput.remove(); } catch (e) {}
      protecao.encerrar();

      const duracaoMs = Date.now() - inicio;
      const anulado = protecao.foiAnulado();

      this.add
        .rectangle(
          this.scale.width / 2,
          this.scale.height / 2,
          this.scale.width,
          this.scale.height,
          0x000000,
          0.8,
        )
        .setInteractive();

      const msg = this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          anulado ? "Desafio anulado!" : `Fim!\n${acertos} acertos\nSalvando...`,
          {
            fontFamily: "Syne, sans-serif",
            fontSize: "24px",
            color: "#f4f4f8",
            align: "center",
          },
        )
        .setOrigin(0.5);

      try {
        if (anulado) {
          await enviarPontuacao({
            jogadorId: jogador.id,
            minigameId: META.id,
            partidaId,
            tokenSeguranca,
            pontos: 0,
            duracaoMs,
            anulado: true,
            metadata: { acertos, erros, tentativas },
          });
          msg.setText("Desafio anulado.\nSaiu da página ou trocou de aba.");
        } else {
          const pontosBase = acertos * 14 + Math.max(0, 90 - erros * 5);
          const avgMult = acertos > 0 ? acertosComBonus / acertos : 1.0;
          const pontosComBonus = Math.round(pontosBase * avgMult);
          const pontos = Math.min(
            META.pontuacaoMaxima,
            Math.max(0, pontosComBonus),
          );
          const res = await enviarPontuacao({
            jogadorId: jogador.id,
            minigameId: META.id,
            partidaId,
            tokenSeguranca,
            pontos,
            duracaoMs,
            metadata: {
              acertos,
              erros,
              tentativas,
              totalOps: acertos + erros,
              avgMultiplier: avgMult,
            },
          });
          const pctDiff = Math.round((avgMult - 1.0) * 100);
          let txtSpeed = "";
          if (pctDiff > 0) txtSpeed = ` · Velocidade: +${pctDiff}% ⚡`;
          else if (pctDiff < 0) txtSpeed = ` · Lento: ${pctDiff}% 🐢`;

          const extra = res.contabilizadoRodada
            ? `\nGlobal: ${res.totalGlobal} · Apresentação: ${res.totalRodada}`
            : `\nGlobal: ${res.totalGlobal}`;
          msg.setText(
            `Fim!\n${acertos} acertos · ${pontos} pts${txtSpeed}${extra}`,
          );
        }
        const textoBase = msg.text;
        agendarVoltaArena(() => {
          onFim();
          this.game.destroy(true);
        }, (t) => {
          msg.setText(`${textoBase}\n\n${t}`);
        });
      } catch (e) {
        msg.setText(`Erro: ${e instanceof Error ? e.message : "?"}`);
        agendarVoltaArena(() => {
          onFim();
          this.game.destroy(true);
        });
      }
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: "game-container",
    backgroundColor: "#030306",
    scene: Cena,
  });
}