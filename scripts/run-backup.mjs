import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

const formatDate = () => new Date().toISOString().slice(0, 10);

const runCommand = async (cmd, args, options = {}) => {
  return execFileAsync(cmd, args, { ...options });
};

const ensureBackupDir = (dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const backupDatabase = async () => {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL env var.");
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  ensureBackupDir(backupDir);
  const fileName = `backup-${formatDate()}.sql`;
  const outputFile = path.join(backupDir, fileName);

  try {
    await runCommand("pg_dump", ["--no-owner", "--no-privileges", dbUrl, "-f", outputFile]);
    return { outputFile, method: "pg_dump" };
  } catch (error) {
    try {
      await runCommand("supabase", ["db", "dump", "--db-url", dbUrl, "--file", outputFile]);
      return { outputFile, method: "supabase" };
    } catch (fallbackError) {
      throw new Error("Backup failed. Ensure pg_dump or supabase CLI is installed.");
    }
  }
};

const gitCommitAndPush = async (filePath) => {
  try {
    await runCommand("git", ["add", filePath]);
    const { stdout } = await runCommand("git", ["status", "--porcelain"]);
    if (!stdout.trim()) {
      return { committed: false, pushed: false };
    }
    const message = `backup: ${formatDate()}`;
    await runCommand("git", ["commit", "-m", message]);
    await runCommand("git", ["push"]);
    return { committed: true, pushed: true };
  } catch (error) {
    return { committed: false, pushed: false, error: error.message };
  }
};

try {
  const { outputFile, method } = await backupDatabase();
  const gitResult = await gitCommitAndPush(outputFile);
  process.stdout.write(
    JSON.stringify({
      ok: true,
      outputFile,
      method,
      git: gitResult,
    })
  );
} catch (error) {
  process.stderr.write(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
}
