import { SlippiGame } from "@slippi/slippi-js";
import { readFile } from "@tauri-apps/plugin-fs";
import type { SlippiMetadata, SlippiPlayer } from "$lib/types/recording";
import { CharacterId, StageId } from "$lib/types/recording";

/**
 * Parse a .slp replay file and extract metadata
 * @param slpPath - Path to the .slp file
 * @returns Parsed Slippi metadata or null if parsing fails
 */
export async function parseSlippiFile(slpPath: string): Promise<SlippiMetadata | null> {
	try {
		// Read the .slp file using Tauri's filesystem API
		const fileBuffer = await readFile(slpPath);
		
		// Convert Uint8Array to ArrayBuffer for slippi-js
		const arrayBuffer = fileBuffer.buffer.slice(
			fileBuffer.byteOffset,
			fileBuffer.byteOffset + fileBuffer.byteLength
		);

		// Parse with slippi-js
		const game = new SlippiGame(arrayBuffer);
		const settings = game.getSettings();
		const metadata = game.getMetadata();

		if (!settings) {
			console.warn("No settings found in .slp file:", slpPath);
			return null;
		}

		// Extract player information
		const players: SlippiPlayer[] = settings.players
			.filter((p) => p !== null) // Filter out null players
			.map((player) => ({
				characterId: player.characterId as CharacterId,
				characterColor: player.characterColor || 0,
				playerTag: player.nametag || `Player ${player.playerIndex + 1}`,
				port: player.port,
			}));

		// Get all characters played
		const characters = players.map((p) => p.characterId);

		// Calculate game duration from metadata or frames
		const lastFrame = metadata?.lastFrame || 0;
		const gameDuration = lastFrame > 0 ? lastFrame : 0;

		return {
			characters,
			stage: settings.stageId as StageId,
			players,
			gameDuration,
			startTime: metadata?.startAt || new Date().toISOString(),
			isPAL: settings.isPAL || false,
		};
	} catch (error) {
		console.error("Error parsing .slp file:", slpPath, error);
		return null;
	}
}

/**
 * Cache for parsed .slp files to avoid re-parsing
 */
const slippiCache = new Map<string, SlippiMetadata | null>();

/**
 * Parse a .slp file with caching
 * @param slpPath - Path to the .slp file
 * @returns Cached or freshly parsed Slippi metadata
 */
export async function parseSlippiFileWithCache(
	slpPath: string
): Promise<SlippiMetadata | null> {
	if (slippiCache.has(slpPath)) {
		return slippiCache.get(slpPath) || null;
	}

	const metadata = await parseSlippiFile(slpPath);
	slippiCache.set(slpPath, metadata);
	return metadata;
}

/**
 * Clear the Slippi parsing cache
 */
export function clearSlippiCache() {
	slippiCache.clear();
}

/**
 * Remove a specific entry from the cache
 */
export function removeFromCache(slpPath: string) {
	slippiCache.delete(slpPath);
}

