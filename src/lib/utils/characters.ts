import { CharacterId, StageId } from "$lib/types/recording";

// Character names for display
export const CHARACTER_NAMES: Record<CharacterId, string> = {
	[CharacterId.CAPTAIN_FALCON]: "Captain Falcon",
	[CharacterId.DONKEY_KONG]: "Donkey Kong",
	[CharacterId.FOX]: "Fox",
	[CharacterId.GAME_AND_WATCH]: "Mr. Game & Watch",
	[CharacterId.KIRBY]: "Kirby",
	[CharacterId.BOWSER]: "Bowser",
	[CharacterId.LINK]: "Link",
	[CharacterId.LUIGI]: "Luigi",
	[CharacterId.MARIO]: "Mario",
	[CharacterId.MARTH]: "Marth",
	[CharacterId.MEWTWO]: "Mewtwo",
	[CharacterId.NESS]: "Ness",
	[CharacterId.PEACH]: "Peach",
	[CharacterId.PIKACHU]: "Pikachu",
	[CharacterId.ICE_CLIMBERS]: "Ice Climbers",
	[CharacterId.JIGGLYPUFF]: "Jigglypuff",
	[CharacterId.SAMUS]: "Samus",
	[CharacterId.YOSHI]: "Yoshi",
	[CharacterId.ZELDA]: "Zelda",
	[CharacterId.SHEIK]: "Sheik",
	[CharacterId.FALCO]: "Falco",
	[CharacterId.YOUNG_LINK]: "Young Link",
	[CharacterId.DR_MARIO]: "Dr. Mario",
	[CharacterId.ROY]: "Roy",
	[CharacterId.PICHU]: "Pichu",
	[CharacterId.GANONDORF]: "Ganondorf",
};

// SSBWiki image URLs for character portraits
export const CHARACTER_IMAGES: Record<CharacterId, string> = {
	[CharacterId.CAPTAIN_FALCON]: "https://www.ssbwiki.com/images/7/79/Captain_Falcon_Palette_%28SSBM%29.png",
	[CharacterId.DONKEY_KONG]: "https://www.ssbwiki.com/images/5/5c/Donkey_Kong_Palette_%28SSBM%29.png",
	[CharacterId.FOX]: "https://www.ssbwiki.com/images/b/b6/Fox_Palette_%28SSBM%29.png",
	[CharacterId.GAME_AND_WATCH]: "https://www.ssbwiki.com/images/4/46/Mr._Game_%26_Watch_Palette_%28SSBM%29.png",
	[CharacterId.KIRBY]: "https://www.ssbwiki.com/images/0/00/Kirby_Palette_%28SSBM%29.png",
	[CharacterId.BOWSER]: "https://www.ssbwiki.com/images/c/c5/Bowser_Palette_%28SSBM%29.png",
	[CharacterId.LINK]: "https://www.ssbwiki.com/images/7/7d/Link_Palette_%28SSBM%29.png",
	[CharacterId.LUIGI]: "https://www.ssbwiki.com/images/5/5f/Luigi_Palette_%28SSBM%29.png",
	[CharacterId.MARIO]: "https://www.ssbwiki.com/images/d/d6/Mario_Palette_%28SSBM%29.png",
	[CharacterId.MARTH]: "https://www.ssbwiki.com/images/b/b6/Marth_Palette_%28SSBM%29.png",
	[CharacterId.MEWTWO]: "https://www.ssbwiki.com/images/0/0a/Mewtwo_Palette_%28SSBM%29.png",
	[CharacterId.NESS]: "https://www.ssbwiki.com/images/6/67/Ness_Palette_%28SSBM%29.png",
	[CharacterId.PEACH]: "https://www.ssbwiki.com/images/c/cd/Peach_Palette_%28SSBM%29.png",
	[CharacterId.PIKACHU]: "https://www.ssbwiki.com/images/4/4d/Pikachu_Palette_%28SSBM%29.png",
	[CharacterId.ICE_CLIMBERS]: "https://www.ssbwiki.com/images/9/9f/Ice_Climbers_Palette_%28SSBM%29.png",
	[CharacterId.JIGGLYPUFF]: "https://www.ssbwiki.com/images/1/13/Jigglypuff_Palette_%28SSBM%29.png",
	[CharacterId.SAMUS]: "https://www.ssbwiki.com/images/a/a9/Samus_Palette_%28SSBM%29.png",
	[CharacterId.YOSHI]: "https://www.ssbwiki.com/images/7/79/Yoshi_Palette_%28SSBM%29.png",
	[CharacterId.ZELDA]: "https://www.ssbwiki.com/images/d/d0/Zelda_Palette_%28SSBM%29.png",
	[CharacterId.SHEIK]: "https://www.ssbwiki.com/images/2/2d/Sheik_Palette_%28SSBM%29.png",
	[CharacterId.FALCO]: "https://www.ssbwiki.com/images/d/d4/Falco_Palette_%28SSBM%29.png",
	[CharacterId.YOUNG_LINK]: "https://www.ssbwiki.com/images/6/6d/Young_Link_Palette_%28SSBM%29.png",
	[CharacterId.DR_MARIO]: "https://www.ssbwiki.com/images/c/cc/Dr._Mario_Palette_%28SSBM%29.png",
	[CharacterId.ROY]: "https://www.ssbwiki.com/images/9/95/Roy_Palette_%28SSBM%29.png",
	[CharacterId.PICHU]: "https://www.ssbwiki.com/images/5/58/Pichu_Palette_%28SSBM%29.png",
	[CharacterId.GANONDORF]: "https://www.ssbwiki.com/images/d/d7/Ganondorf_Palette_%28SSBM%29.png",
};

// Stage names for display
export const STAGE_NAMES: Record<number, string> = {
	[StageId.FOUNTAIN_OF_DREAMS]: "Fountain of Dreams",
	[StageId.POKEMON_STADIUM]: "Pokémon Stadium",
	[StageId.YOSHIS_STORY]: "Yoshi's Story",
	[StageId.DREAM_LAND]: "Dream Land",
	[StageId.BATTLEFIELD]: "Battlefield",
	[StageId.FINAL_DESTINATION]: "Final Destination",
};

// Get character name by ID with fallback
export function getCharacterName(characterId: CharacterId | number): string {
	return CHARACTER_NAMES[characterId as CharacterId] || `Unknown Character (${characterId})`;
}

// Get character image URL by ID
export function getCharacterImage(characterId: CharacterId | number): string {
	return CHARACTER_IMAGES[characterId as CharacterId] || "";
}

// Get stage name by ID with fallback
export function getStageName(stageId: StageId | number): string {
	return STAGE_NAMES[stageId] || `Unknown Stage (${stageId})`;
}

// Format game duration from frames to readable time
export function formatGameDuration(frames: number): string {
	const seconds = Math.floor(frames / 60); // Melee runs at 60 FPS
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Format file size to human readable
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(timestamp: string): string {
	const now = new Date();
	const then = new Date(timestamp);
	const diffMs = now.getTime() - then.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) return "just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	
	// Return formatted date for older items
	return then.toLocaleDateString();
}

