import type { Jogador } from "./api.js";

const KEY = "ddm_jogador";

export function salvarJogador(j: Jogador) {
  localStorage.setItem(KEY, JSON.stringify(j));
}

export function carregarJogador(): Jogador | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Jogador;
  } catch {
    return null;
  }
}

export function limparJogador() {
  localStorage.removeItem(KEY);
}