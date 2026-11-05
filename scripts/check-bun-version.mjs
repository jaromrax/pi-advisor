import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

if (!existsSync(resolve(projectRoot, "bun.lock"))) {
  process.exit(0);
}

const localPrefix = process.env.npm_config_local_prefix;

if (localPrefix && resolve(localPrefix) !== projectRoot) {
  process.exit(0);
}

// Consumer install (e.g. `pi install` runs `npm install --omit=dev`):
// dist/ is prebuilt, Bun is not needed, so warn instead of failing.
const omit = (process.env.npm_config_omit ?? "").split(/[,\s]+/u).filter(Boolean);
const only = (process.env.npm_config_only ?? "").toLowerCase();
if (
  omit.includes("dev") ||
  only === "prod" ||
  only === "production" ||
  process.env.npm_config_production === "true"
) {
  console.warn(
    "Skipping Bun version check for production install (dev dependencies omitted)."
  );
  process.exit(0);
}

const packageJson = JSON.parse(
  readFileSync(resolve(projectRoot, "package.json"), "utf-8")
);

const minimumVersion = /^bun@(?<version>\d+\.\d+\.\d+)$/u.exec(
  packageJson.packageManager ?? ""
)?.groups?.version;

const currentVersion = /^bun\/(?<version>[^\s]+)/u.exec(
  process.env.npm_config_user_agent ?? ""
)?.groups?.version;

const isAtLeast = (version, minimum) => {
  const current =
    /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[^\s]+))?$/u.exec(
      version
    )?.groups;

  const required =
    /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[^\s]+))?$/u.exec(
      minimum
    )?.groups;

  if (!current || !required) {
    return false;
  }

  const currentParts = [current.major, current.minor, current.patch].map(
    Number
  );

  const requiredParts = [required.major, required.minor, required.patch].map(
    Number
  );

  for (let index = 0; index < currentParts.length; index += 1) {
    const difference = currentParts[index] - requiredParts[index];

    if (difference !== 0) {
      return difference > 0;
    }
  }

  return !current.prerelease || Boolean(required.prerelease);
};

if (
  !minimumVersion ||
  !currentVersion ||
  !isAtLeast(currentVersion, minimumVersion)
) {
  console.error(
    `This repository requires Bun ${minimumVersion ?? "1.4.4"} or newer; found ${currentVersion ?? "a non-Bun package manager"}.`
  );
  process.exitCode = 1;
} else {
  console.log(
    `Bun ${currentVersion} meets the repository minimum ${minimumVersion}.`
  );
}
