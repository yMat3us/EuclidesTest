import { getMinigame } from "@ddm/shared";
import type { EnviarPontuacaoInput } from "@ddm/shared";

export interface ValidacaoPontuacao {
  ok: true;
  pontos: number;
}

export interface ErroPontuacao {
  ok: false;
  motivo: string;
}

export function validarPontuacao(
  input: EnviarPontuacaoInput,
): ValidacaoPontuacao | ErroPontuacao {
  const meta = getMinigame(input.minigameId);

  if (!meta) {
    return { ok: false, motivo: "Minigame desconhecido" };
  }

  if (!meta.implementado) {
    return { ok: false, motivo: "Minigame ainda não disponível" };
  }

  if (input.pontos > meta.pontuacaoMaxima) {
    return {
      ok: false,
      motivo: `Pontuação acima do máximo (${meta.pontuacaoMaxima})`,
    };
  }

  const duracaoMax = meta.duracaoSegundos * 1000 + 15_000;
  if (input.duracaoMs > duracaoMax) {
    return { ok: false, motivo: "Tempo de partida inválido" };
  }

  return { ok: true, pontos: input.pontos };
}