import { existsSync, readFileSync, watch } from "fs";
import path from "path";
import { parse } from "yaml";
import type { GameConfig } from "../types";

// Helper to get env var without quotes
function getEnvTitle(): string {
  const raw = process.env.GAME_TITLE;
  const title = raw || "Trivia & Chill";
  // Remove surrounding quotes if present
  const cleaned = title.replace(/^["']|["']$/g, "");
  return cleaned;
}

// Minimal fallback only if YAML missing or invalid.
const FALLBACK: GameConfig = {
  title: getEnvTitle(),
  categories: [],
  emoji: {
    cost: 10,
    allowNegative: false,
    maxActive: 5,
    cooldownMs: 5000,
    displayDurationMs: 4000,
  },
  typewriter: {
    enabled: false,
    speedMsPerChar: 30,
    delayBeforeMediaMs: 300,
  },
};

function resolvePath(): string {
  const envPath = process.env.CONFIG_PATH;
  if (envPath && existsSync(envPath)) return envPath;
  const local = path.resolve("config/game.yml");
  if (existsSync(local)) return local;
  return envPath || local; // may be missing; caller handles
}

export function loadGameConfig(): GameConfig {
  const configPath = resolvePath();
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = parse(raw) as any;
      return {
        title: getEnvTitle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        categories: (parsed.categories as any) || FALLBACK.categories,
        emoji: {
          cost: parsed.emoji?.cost ?? FALLBACK.emoji?.cost,
          allowNegative: parsed.emoji?.allowNegative ?? FALLBACK.emoji?.allowNegative,
          maxActive: parsed.emoji?.maxActive ?? FALLBACK.emoji?.maxActive,
          cooldownMs: parsed.emoji?.cooldownMs ?? FALLBACK.emoji?.cooldownMs,
          displayDurationMs: parsed.emoji?.displayDurationMs ?? FALLBACK.emoji?.displayDurationMs,
        },
        typewriter: {
          enabled: parsed.typewriter?.enabled ?? FALLBACK.typewriter?.enabled,
          speedMsPerChar: parsed.typewriter?.speedMsPerChar ?? FALLBACK.typewriter?.speedMsPerChar,
          delayBeforeMediaMs:
            parsed.typewriter?.delayBeforeMediaMs ?? FALLBACK.typewriter?.delayBeforeMediaMs,
        },
      } as GameConfig;
    } catch (err) {
      console.error("Failed to parse game config YAML. Using fallback.", err);
      return FALLBACK;
    }
  } else {
    console.warn(`Game config not found at ${configPath}. Using fallback.`);
  }
  return FALLBACK;
}

export function watchGameConfig(onChange: (cfg: GameConfig) => void) {
  if (process.env.NODE_ENV === "production") return; // avoid watchers in prod
  const file = resolvePath();
  if (!existsSync(file)) return;
  try {
    watch(file, { persistent: false }, () => {
      const cfg = loadGameConfig();
      onChange(cfg);
      console.log("[config] Reloaded game.yml");
    });
  } catch (err) {
    console.error("Failed to watch config file", err);
  }
}
