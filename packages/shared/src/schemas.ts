import { z } from "zod";
import { TURMAS_OPCOES } from "./turmas.js";

export const registrarJogadorSchema = z
  .object({
    apelido: z
      .string()
      .trim()
      .min(2, "Nome muito curto")
      .max(48, "Nome muito longo")
      .regex(/^[\p{L}\p{N}_\- ]+$/u, "Use apenas letras, números, espaços, _ e -"),
    turma: z.enum(TURMAS_OPCOES).optional(),
    souProfessor: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.souProfessor && !data.turma) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione sua turma ou marque Sou professor",
        path: ["turma"],
      });
    }
    if (data.souProfessor && data.turma) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Professores não devem selecionar turma",
        path: ["turma"],
      });
    }
  });

export const enviarPontuacaoSchema = z.object({
  jogadorId: z.string().uuid(),
  minigameId: z.string().min(1),
  partidaId: z.string().uuid(),
  tokenSeguranca: z.string().min(1),
  pontos: z.number().int().min(0),
  duracaoMs: z.number().int().min(1000).max(600_000),
  metadata: z.record(z.unknown()).optional(),
  anulado: z.boolean().optional(),
});

export const cadastroPessoaSchema = z.object({
  nome: z.string().trim().min(2).max(48),
  turma: z.enum(TURMAS_OPCOES).optional().nullable(),
  ehProfessor: z.boolean().optional().default(false),
});

export type RegistrarJogadorInput = z.infer<typeof registrarJogadorSchema>;
export type EnviarPontuacaoInput = z.infer<typeof enviarPontuacaoSchema>;