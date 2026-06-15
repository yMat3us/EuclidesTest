export const TURMAS_OPCOES = [
  "1 ADM A",
  "1 ADM B",
  "1 REDES A",
  "1 REDES B",
  "2 ADM A",
  "2 ADM B",
  "2 REDES A",
  "2 REDES B",
  "3 ADM A",
  "3 ADM B",
  "3 REDES A",
  "3 REDES B",
] as const;

export type TurmaOpcao = (typeof TURMAS_OPCOES)[number];