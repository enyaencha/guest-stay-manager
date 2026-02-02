import { defineConfig, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { spawn } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    ...(mode === "development"
      ? {
          middlewareMode: false,
        }
      : {}),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && {
      name: "backup-endpoint",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/backup", (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }
          const child = spawn("node", ["scripts/run-backup.mjs"], {
            cwd: process.cwd(),
            env: process.env,
          });
          let stdout = "";
          let stderr = "";
          child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
          });
          child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
          });
          child.on("close", (code) => {
            res.setHeader("Content-Type", "application/json");
            if (code === 0) {
              res.statusCode = 200;
              res.end(stdout || JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 500;
              res.end(stderr || JSON.stringify({ ok: false, error: "Backup failed" }));
            }
          });
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
