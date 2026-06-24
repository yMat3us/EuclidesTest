import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("probabilidade-sorteador")!;

interface Pergunta {
  enunciado: string;
  opcoes: string[];
  correta: number;
}

const PERGUNTAS_DATA: Pergunta[] = [
  { enunciado: "Ao lançar uma moeda honesta, qual é a probabilidade de sair cara?", opcoes: ["25%", "50%", "75%", "100%"], correta: 1 },
  { enunciado: "Ao lançar um dado comum de 6 lados, qual é a probabilidade de sair um número par?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 2 },
  { enunciado: "Ao lançar um dado comum de 6 lados, qual é a probabilidade de sair o número 3?", opcoes: ["1/2", "1/3", "1/6", "1/4"], correta: 2 },
  { enunciado: "Em uma urna com 3 bolas vermelhas e 7 azuis, qual é a probabilidade de retirar uma bola vermelha?", opcoes: ["30%", "70%", "3/10", "7/10"], correta: 2 },
  { enunciado: "Ao lançar dois dados comuns de 6 lados, qual é a probabilidade de a soma dos dois valores ser igual a 7?", opcoes: ["1/12", "1/9", "1/6", "1/4"], correta: 2 },
  { enunciado: "Se lançarmos uma moeda justa duas vezes seguidas, qual é a probabilidade de sair coroa em ambos os lançamentos?", opcoes: ["1/8", "1/4", "1/2", "3/4"], correta: 1 },
  { enunciado: "Ao retirar uma carta ao acaso de um baralho tradicional de 52 cartas, qual é a probabilidade de ser o Ás de Copas?", opcoes: ["1/52", "1/26", "1/13", "4/52"], correta: 0 },
  { enunciado: "Qual é a probabilidade matemática de acontecer um evento impossível?", opcoes: ["0", "1/2", "1", "2"], correta: 0 },
  { enunciado: "Qual é a probabilidade matemática de acontecer um evento que é considerado certo?", opcoes: ["0", "1/2", "1", "100%"], correta: 2 },
  { enunciado: "Ao rolar um dado comum de 6 lados, qual é a probabilidade de sair um número maior que 4?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 1 },
  
  { enunciado: "Em uma urna com 5 bolas pretas e 5 brancas, qual é a probabilidade de retirar uma branca?", opcoes: ["20%", "40%", "50%", "100%"], correta: 2 },
  { enunciado: "Ao lançar dois dados comuns de 6 lados, qual é a probabilidade de obter dois números iguais?", opcoes: ["1/6", "1/12", "1/36", "5/36"], correta: 0 },
  { enunciado: "Um saquinho contém 4 balas de morango e 6 de uva. Se você pegar uma bala ao acaso, qual é a probabilidade de ser de uva?", opcoes: ["40%", "50%", "60%", "75%"], correta: 2 },
  { enunciado: "Ao rolar um dado de 6 lados, qual é a probabilidade de o número sorteado ser um número primo?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 2 },
  { enunciado: "Ao rolar um dado de 6 lados, qual é a probabilidade de o número sorteado ser um número ímpar?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 2 },
  { enunciado: "Qual é a probabilidade de retirar um rei ao acaso de um baralho tradicional de 52 cartas?", opcoes: ["1/52", "1/26", "1/13", "4/13"], correta: 2 },
  { enunciado: "Em um sorteio com números de 1 a 20, qual é a probabilidade de sair um número menor que 6?", opcoes: ["1/4", "1/5", "1/2", "3/10"], correta: 0 },
  { enunciado: "Em uma urna com 2 bolas vermelhas, 3 verdes e 5 azuis, qual é a probabilidade de retirar uma bola verde?", opcoes: ["20%", "30%", "50%", "15%"], correta: 1 },
  { enunciado: "Ao rolar um dado comum de 6 lados, qual é a probabilidade de NÃO sair o número 6?", opcoes: ["1/6", "5/6", "1/2", "2/3"], correta: 1 },
  { enunciado: "Se lançarmos uma moeda justa 3 vezes, qual é a probabilidade de obter cara em todos os 3 lançamentos?", opcoes: ["1/4", "1/6", "1/8", "1/2"], correta: 2 },
  
  { enunciado: "Um dado de 12 lados (numerado de 1 a 12) é lançado. Qual é a probabilidade de sair um número par?", opcoes: ["1/3", "1/2", "5/12", "7/12"], correta: 1 },
  { enunciado: "Em uma sala com 15 meninos e 15 meninas, um aluno é sorteado ao acaso. Qual é a probabilidade de ser uma menina?", opcoes: ["30%", "45%", "50%", "60%"], correta: 2 },
  { enunciado: "Ao lançar um dado de 8 lados (numerado de 1 a 8), qual é a probabilidade de obter o número 7?", opcoes: ["1/8", "1/6", "1/4", "2/8"], correta: 0 },
  { enunciado: "Ao retirar uma carta de um baralho de 52 cartas, qual é a probabilidade de ela ser do naipe de Ouros?", opcoes: ["1/4", "1/2", "13/52", "1/13"], correta: 0 },
  { enunciado: "Em um lote com 90 peças perfeitas e 10 defeituosas, qual é a probabilidade de sortear uma peça defeituosa?", opcoes: ["10%", "20%", "5%", "1%"], correta: 0 },
  { enunciado: "Se um casal tem dois filhos, qual é a probabilidade de ambos serem meninos?", opcoes: ["25%", "50%", "75%", "33%"], correta: 0 },
  { enunciado: "Em um sorteio com fichas numeradas de 1 a 10, qual é a probabilidade de sair um número múltiplo de 3?", opcoes: ["20%", "30%", "40%", "50%"], correta: 1 },
  { enunciado: "Ao lançar dois dados comuns de 6 lados, qual é a probabilidade de a soma dos dois ser igual a 2?", opcoes: ["1/12", "1/36", "1/18", "2/36"], correta: 1 },
  { enunciado: "Ao rolar um dado comum de 6 lados, qual é a probabilidade de o número ser menor que 3?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 1 },
  { enunciado: "Se a probabilidade de chover hoje é de 70%, qual é a probabilidade de NÃO chover?", opcoes: ["30%", "50%", "70%", "100%"], correta: 0 },
  
  { enunciado: "Em uma gaveta há 4 meias azuis e 4 vermelhas. Se pegarmos uma no escuro, qual é a probabilidade de ela ser vermelha?", opcoes: ["25%", "50%", "75%", "100%"], correta: 1 },
  { enunciado: "Em um baralho tradicional de 52 cartas (sendo metade vermelhas e metade pretas), qual é a probabilidade de retirar uma carta preta?", opcoes: ["25%", "50%", "75%", "13/52"], correta: 1 },
  { enunciado: "Ao rolar um dado comum de 6 lados, qual é a probabilidade de obter um número maior ou igual a 5?", opcoes: ["1/6", "1/3", "1/2", "2/3"], correta: 1 },
  { enunciado: "Em uma escola, 60% dos alunos praticam esportes. Se escolhermos um aluno ao acaso, qual é a probabilidade de ele NÃO praticar esportes?", opcoes: ["30%", "40%", "50%", "60%"], correta: 1 },
  { enunciado: "Em uma urna com 8 bolas pretas (e nenhuma outra cor), qual é a probabilidade de retirar uma bola vermelha?", opcoes: ["0%", "12.5%", "100%", "50%"], correta: 0 },
  { enunciado: "Em uma urna com 8 bolas pretas (e nenhuma outra cor), qual é a probabilidade de retirar uma bola preta?", opcoes: ["0%", "12.5%", "100%", "50%"], correta: 2 },
  { enunciado: "Se você lançar duas moedas comuns ao mesmo tempo, qual é a probabilidade de obter duas caras?", opcoes: ["25%", "50%", "75%", "12.5%"], correta: 0 },
  { enunciado: "Em uma urna com 12 bolas numeradas de 1 a 12, qual é a probabilidade de retirar um número divisível por 4?", opcoes: ["1/4", "1/6", "1/3", "1/12"], correta: 0 },
  { enunciado: "Ao retirar uma carta de um baralho de 52 cartas, qual é a probabilidade de tirar uma figura (Valete, Dama ou Rei)?", opcoes: ["3/52", "12/52", "1/13", "4/13"], correta: 1 },
  { enunciado: "Ao rolar um dado comum de 6 lados, qual é a probabilidade de o número sorteado não ser 1 e nem 6?", opcoes: ["1/3", "2/3", "1/2", "5/6"], correta: 1 },
  
  { enunciado: "Se a chance de chover amanhã é de 15%, qual é a probabilidade de NÃO chover?", opcoes: ["50%", "75%", "85%", "95%"], correta: 2 },
  { enunciado: "Ao rolar dois dados comuns de 6 lados, qual é a probabilidade de a soma dos dois ser igual a 12?", opcoes: ["1/36", "1/12", "1/6", "1/18"], correta: 0 },
  { enunciado: "Em um saquinho temos 2 chocolates ao leite e 8 amargos. Se pegarmos um doce ao acaso, qual é a probabilidade de ele ser ao leite?", opcoes: ["10%", "20%", "40%", "80%"], correta: 1 },
  { enunciado: "Se jogarmos 4 moedas comuns ao mesmo tempo, qual é a probabilidade de obter cara em todas as 4?", opcoes: ["1/4", "1/8", "1/16", "1/32"], correta: 2 },
  { enunciado: "Ao lançar um dado de 20 lados (numerado de 1 a 20), qual é a probabilidade de obter o número 20?", opcoes: ["1%", "5%", "10%", "20%"], correta: 1 },
  { enunciado: "Em uma urna com 6 bolas vermelhas e 4 verdes, qual é a probabilidade de tirar uma vermelha primeiro e, sem reposição, tirar uma verde depois?", opcoes: ["24%", "26.7%", "30%", "20%"], correta: 1 },
  { enunciado: "Ao escolhermos aleatoriamente uma letra da palavra 'MATEMATICA', qual é a probabilidade de ser a letra 'A'?", opcoes: ["10%", "20%", "30%", "40%"], correta: 2 },
  { enunciado: "Ao escolhermos aleatoriamente uma letra da palavra 'MATEMATICA', qual é a probabilidade de ser a letra 'M'?", opcoes: ["10%", "20%", "30%", "15%"], correta: 1 },
  { enunciado: "Em um grupo de 100 pessoas, 40 falam inglês, 30 espanhol e nenhuma fala ambos. Ao sortear um indivíduo, qual é a probabilidade de ele falar inglês ou espanhol?", opcoes: ["40%", "30%", "70%", "10%"], correta: 2 },
  { enunciado: "Uma senha numérica possui 4 dígitos (de 0 a 9 cada). Qual é a probabilidade de alguém adivinhar a senha correta na primeira tentativa?", opcoes: ["1/100", "1/1000", "1/10000", "1/10"], correta: 2 },
  { enunciado: "Ao rolar um dado de 8 lados (numerado de 1 a 8), qual é a probabilidade de sair um número maior que 5?", opcoes: ["1/8", "3/8", "1/2", "5/8"], correta: 1 },
  { enunciado: "Se escolhermos um número inteiro de 1 a 10 ao acaso, qual é a probabilidade de ele ser um número par?", opcoes: ["20%", "30%", "50%", "60%"], correta: 2 }
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

  // Shuffle the questions at start
  const jogoQuestoes = embaralhar(PERGUNTAS_DATA);

  const ui = montarShell(
    container,
    META,
    `<p class="mg-prompt" id="mg-prompt"></p>
     <p class="mg-question" id="mg-question" style="font-size: 1.3rem; font-weight: 600; text-align: center; margin: 20px 0; color: #f4f4f8;"></p>
     <div class="options-grid" id="mg-opcoes"></div>`,
  );

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function mostrar() {
    if (finalizado || indice >= jogoQuestoes.length) {
      void encerrar("Desafio concluído!");
      return;
    }
    const p = jogoQuestoes[indice]!;
    document.getElementById("mg-prompt")!.textContent =
      `Pergunta ${indice + 1} / ${jogoQuestoes.length}`;
    document.getElementById("mg-question")!.textContent = p.enunciado;
    const op = document.getElementById("mg-opcoes")!;
    op.innerHTML = "";
    ui.resetSpeedBar?.();
    atualizarScore();

    const ordem = embaralhar(p.opcoes.map((_, i) => i));
    for (const i of ordem) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost select-option-btn";
      btn.textContent = p.opcoes[i]!;
      btn.style.fontSize = "1.2rem";
      btn.style.padding = "12px";
      btn.addEventListener("click", () => responder(btn, i, p));
      op.appendChild(btn);
    }
  }

  function responder(selectedBtn: HTMLButtonElement, indexEscolhido: number, currentPergunta: Pergunta) {
    if (finalizado) return;

    const op = document.getElementById("mg-opcoes")!;
    const btns = op.querySelectorAll("button");

    btns.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
      // We map options by matching text
      const btnText = btn.textContent;
      const correctText = currentPergunta.opcoes[currentPergunta.correta];
      if (btnText === correctText) {
        btn.className = "btn primary";
      } else if (btn === selectedBtn) {
        btn.className = "btn danger";
      }
    });

    if (indexEscolhido === currentPergunta.correta) {
      acertos++;
      ui.setFeedback(`Correto!`, "ok");
    } else {
      ui.setFeedback(`Errado.`, "erro");
    }

    indice++;
    atualizarScore();

    // Auto-proceed after 1300ms
    setTimeout(mostrar, 1300);
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
      mensagem: `${motivo} · ${acertos}/${jogoQuestoes.length} acertos`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );
  atualizarScore();
  mostrar();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}