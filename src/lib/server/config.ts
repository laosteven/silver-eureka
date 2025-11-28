import { parse } from 'yaml';
import { readFileSync, existsSync, watch } from 'fs';
import path from 'path';
import type { GameConfig } from '$lib/types';

// Helper to get env var without quotes
function getEnvTitle(): string {
	const raw = process.env.GAME_TITLE;
	const title = raw || 'Trivia & Chill';
	// Remove surrounding quotes if present
	const cleaned = title.replace(/^["']|["']$/g, '');
	return cleaned;
}

// Minimal fallback only if YAML missing or invalid.
const FALLBACK: GameConfig = { title: getEnvTitle(), countdown: 30, categories: [] };

function resolvePath(): string {
	const envPath = process.env.CONFIG_PATH;
	if (envPath && existsSync(envPath)) return envPath;
	const local = path.resolve('config/game.yaml');
	if (existsSync(local)) return local;
	return envPath || local; // may be missing; caller handles
}

export function loadGameConfig(): GameConfig {
	const configPath = resolvePath();
	if (existsSync(configPath)) {
		try {
			const raw = readFileSync(configPath, 'utf-8');
			const parsed = parse(raw) as Partial<GameConfig>;
			return {
				title: getEnvTitle(),
				countdown: parsed.countdown ?? FALLBACK.countdown,
				categories: parsed.categories || FALLBACK.categories
			};
		} catch (err) {
			console.error('Failed to parse game config YAML. Using fallback.', err);
			return FALLBACK;
		}
	} else {
		console.warn(`Game config not found at ${configPath}. Using fallback.`);
	}
	return FALLBACK;
}

export function watchGameConfig(onChange: (cfg: GameConfig) => void) {
	if (process.env.NODE_ENV === 'production') return; // avoid watchers in prod
	const file = resolvePath();
	if (!existsSync(file)) return;
	try {
		watch(file, { persistent: false }, () => {
			const cfg = loadGameConfig();
			onChange(cfg);
			console.log('[config] Reloaded game.yaml');
		});
	} catch (err) {
		console.error('Failed to watch config file', err);
	}
}
