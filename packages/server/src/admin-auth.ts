import type { FastifyRequest } from "fastify";

/** Senha padrão local; sobrescreva com DDM_ADMIN_TOKEN em produção */
const TOKEN_PADRAO = "26042008";

export function getAdminToken(): string {
  return process.env.DDM_ADMIN_TOKEN?.trim() || TOKEN_PADRAO;
}

export function isAdminRequest(req: FastifyRequest): boolean {
  const header = req.headers["x-admin-token"];
  return typeof header === "string" && header === getAdminToken();
}