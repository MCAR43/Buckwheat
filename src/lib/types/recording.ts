// Character IDs from Melee (internal character IDs used by slippi-js)
export enum CharacterId {
	CAPTAIN_FALCON = 0,
	DONKEY_KONG = 1,
	FOX = 2,
	GAME_AND_WATCH = 3,
	KIRBY = 4,
	BOWSER = 5,
	LINK = 6,
	LUIGI = 7,
	MARIO = 8,
	MARTH = 9,
	MEWTWO = 10,
	NESS = 11,
	PEACH = 12,
	PIKACHU = 13,
	ICE_CLIMBERS = 14,
	JIGGLYPUFF = 15,
	SAMUS = 16,
	YOSHI = 17,
	ZELDA = 18,
	SHEIK = 19,
	FALCO = 20,
	YOUNG_LINK = 21,
	DR_MARIO = 22,
	ROY = 23,
	PICHU = 24,
	GANONDORF = 25,
}

// Stage IDs from Melee
export enum StageId {
	FOUNTAIN_OF_DREAMS = 2,
	POKEMON_STADIUM = 3,
	YOSHIS_STORY = 8,
	DREAM_LAND = 28,
	BATTLEFIELD = 31,
	FINAL_DESTINATION = 32,
}

// Player information from .slp file
export interface SlippiPlayer {
	characterId: CharacterId;
	characterColor: number;
	playerTag: string;
	port: number;
}

// Metadata extracted from .slp file
export interface SlippiMetadata {
	characters: CharacterId[];
	stage: StageId | number;
	players: SlippiPlayer[];
	gameDuration: number; // in frames
	startTime: string;
	isPAL: boolean;
}

// Backend recording session (from Rust)
export interface RecordingSession {
	id: string;
	start_time: string;
	end_time: string | null;
	slp_path: string;
	video_path: string | null;
	duration: number | null; // in seconds
}

// Frontend recording with parsed metadata
export interface RecordingWithMetadata extends RecordingSession {
	slippi_metadata?: SlippiMetadata;
	file_size?: number; // in bytes
	is_loading?: boolean;
	is_selected?: boolean;
}

