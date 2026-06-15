export type MinigameDifficulty = "facil" | "medio" | "dificil";

export interface MinigameMeta {
  id: string;
  nome: string;
  descricao: string;
  tema: string;
  pontuacaoMaxima: number;
  duracaoSegundos: number;
  dificuldade: MinigameDifficulty;
  /** Fase do roadmap em que o minigame entra */
  fase: number;
  implementado: boolean;
}

/** Catálogo oficial — pontuação máxima por minigame (servidor valida) */
export const MINIGAMES: MinigameMeta[] = [
  {
    id: "operacoes-rapidas",
    nome: "Operações Rápidas",
    descricao: "Resolva o máximo de contas em 2 minutos.",
    tema: "aritmetica",
    pontuacaoMaxima: 500,
    duracaoSegundos: 120,
    dificuldade: "medio",
    fase: 1,
    implementado: true,
  },
  {
    id: "quiz-euclides",
    nome: "Quiz de Euclides",
    descricao: "10 perguntas sobre axiomas e postulados — 10s cada. Mais rápido, mais pontos.",
    tema: "geometria",
    pontuacaoMaxima: 500,
    duracaoSegundos: 120,
    dificuldade: "medio",
    fase: 1,
    implementado: true,
  },
  {
    id: "fracoes-puzzle",
    nome: "Quebra-Cabeça de Frações",
    descricao: "Combine peças para formar frações equivalentes.",
    tema: "fracoes",
    pontuacaoMaxima: 400,
    duracaoSegundos: 90,
    dificuldade: "medio",
    fase: 2,
    implementado: true,
  },
  {
    id: "geometria-memoria",
    nome: "Memória Geométrica",
    descricao: "Encontre pares de figuras e ângulos.",
    tema: "geometria",
    pontuacaoMaxima: 350,
    duracaoSegundos: 75,
    dificuldade: "facil",
    fase: 2,
    implementado: true,
  },
  {
    id: "sequencia-logica",
    nome: "Sequência Lógica",
    descricao: "Complete padrões numéricos e geométricos.",
    tema: "algebra",
    pontuacaoMaxima: 450,
    duracaoSegundos: 80,
    dificuldade: "medio",
    fase: 3,
    implementado: true,
  },
  {
    id: "graficos-coordenadas",
    nome: "Gráficos & Coordenadas",
    descricao: "Leia gráficos e marque pontos no plano cartesiano.",
    tema: "funcoes",
    pontuacaoMaxima: 500,
    duracaoSegundos: 90,
    dificuldade: "dificil",
    fase: 3,
    implementado: true,
  },
  {
    id: "probabilidade-sorteador",
    nome: "Probabilidade na Prática",
    descricao: "Preveja resultados em experimentos aleatórios.",
    tema: "probabilidade",
    pontuacaoMaxima: 400,
    duracaoSegundos: 70,
    dificuldade: "medio",
    fase: 4,
    implementado: true,
  },
  {
    id: "fracoes-visual",
    nome: "Frações com Figuras",
    descricao: "Interprete frações usando imagens, pizzas, barras e conjuntos.",
    tema: "fracoes",
    pontuacaoMaxima: 400,
    duracaoSegundos: 90,
    dificuldade: "facil",
    fase: 1,
    implementado: true,
  },
  {
    id: "logica",
    nome: "Raciocínio Lógico",
    descricao: "Decifre equações de símbolos e deduções lógicas de futebol.",
    tema: "algebra",
    pontuacaoMaxima: 500,
    duracaoSegundos: 90,
    dificuldade: "medio",
    fase: 1,
    implementado: true,
  },
  {
    id: "copa",
    nome: "Matemática na Copa",
    descricao: "Problemas de futebol sobre médias de gols, pontos e dimensões.",
    tema: "probabilidade",
    pontuacaoMaxima: 500,
    duracaoSegundos: 90,
    dificuldade: "medio",
    fase: 1,
    implementado: true,
  },
];

export function getMinigame(id: string): MinigameMeta | undefined {
  return MINIGAMES.find((m) => m.id === id);
}

export function pontuacaoTotalPossivel(): number {
  return MINIGAMES.reduce((s, m) => s + m.pontuacaoMaxima, 0);
}