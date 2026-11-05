import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Skip hook setup on consumer installs (husky is a devDependency).
const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

const omit = (process.env.npm_config_omit ?? "")
  .split(/[,\s]+/u)
  .filter(Boolean);

const only = (process.env.npm_config_only ?? "").toLowerCase();

if (
  omit.includes("dev") ||
  only === "prod" ||
  only === "production" ||
  process.env.npm_config_production === "true"
) {
  process.exit(0);
}

const binary = process.platform === "win32" ? "husky.cmd" : "husky";

if (!existsSync(resolve(projectRoot, "node_modules/.bin", binary))) {
  process.exit(0);
}

const result = spawnSync(binary, [], {
  cwd: projectRoot,
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 0);
