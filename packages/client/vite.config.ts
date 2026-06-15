import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const CLIENT_PORT = Number(process.env.PORT);
const clientDir = path.dirname(fileURLToPath(import.meta.url));

function logAdminUrl(): Plugin {
  return {
    name: "euclides-admin-url",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const addr = server.httpServer?.address();
        const port =
          typeof addr === "object" && addr && "port" in addr
            ? addr.port
            : CLIENT_PORT;
        const url = `http://localhost:${port}/admin.html`;
        console.log("\n════════════════════════════════════════");
        console.log("  Euclides Test — painel do professor");
        console.log(`  ${url}`);
        console.log("  (link secreto — não aparece no site)");
        console.log("════════════════════════════════════════\n");
      });
    },
  };
}

export default defineConfig({
  appType: "mpa",
  resolve: {
    alias: {
      "@ddm/shared": path.resolve(clientDir, "../shared/src/index.ts"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
      },
    },
  },
  plugins: [logAdminUrl()],
  server: {
    host: process.env.HOST,
    port: CLIENT_PORT,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
    strictPort: true,
    watch: {
      usePolling: true,
    },
    cors: true,
  },
});