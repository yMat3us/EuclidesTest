import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dbPath, initializeMongoAndSync } from "./db/index.js";
import { registerRoutes } from "./routes.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = process.env.HOST || "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

// Limitador de taxa em memória (Rate Limiter)
const IPS_LIMITE = new Map<string, { count: number; resetAt: number }>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 150; // Limite de 150 requisições por minuto por IP

app.addHook("onRequest", async (request, reply) => {
  const ip = request.ip;
  const agora = Date.now();
  let rate = IPS_LIMITE.get(ip);
  if (!rate || agora > rate.resetAt) {
    rate = { count: 0, resetAt: agora + LIMIT_WINDOW_MS };
  }
  rate.count++;
  IPS_LIMITE.set(ip, rate);
  if (rate.count > MAX_REQUESTS_PER_MINUTE) {
    return reply.status(429).send({ erro: "Muitas requisições. Tente novamente em breve." });
  }
});

// Cabeçalhos de Segurança Global (Helmet-like)
app.addHook("onSend", async (request, reply, payload) => {
  void reply.header("X-Content-Type-Options", "nosniff");
  void reply.header("X-Frame-Options", "DENY");
  void reply.header("X-XSS-Protection", "1; mode=block");
  void reply.header("Referrer-Policy", "no-referrer");
  void reply.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
  return payload;
});

await registerRoutes(app);

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, "..", "..", "..");
const clientDistPath = join(projectRoot, "packages", "client", "dist");

if (existsSync(clientDistPath)) {
  await app.register(fastifyStatic, {
    root: clientDistPath,
    prefix: "/",
  });
  app.log.info(`Servindo arquivos estáticos do frontend em: ${clientDistPath}`);
}

const clientUrl = process.env.DDM_CLIENT_URL ?? "http://localhost:5173";

try {
  await initializeMongoAndSync();
  await app.listen({ port, host });
  console.log(`API: http://127.0.0.1:${port}`);
  console.log(`Banco: ${dbPath}`);
  console.log("\n════════════════════════════════════════");
  console.log("  Euclides Test — painel do professor");
  console.log(`  ${clientUrl}/admin.html`);
  console.log("  (link secreto — não aparece no site)");
  console.log("════════════════════════════════════════\n");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}