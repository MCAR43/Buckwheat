import { invoke } from "@tauri-apps/api/core";
import type { RecordingSession, RecordingWithMetadata } from "$lib/types/recording";
import { CharacterId, StageId } from "$lib/types/recording";

class RecordingsStore {
	recordings = $state<RecordingWithMetadata[]>([]);
	selectedIds = $state<Set<string>>(new Set());
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		// Initialize with mock data
		this.recordings = this.getMockRecordings();
	}

	// Get mock recordings for development
	getMockRecordings(): RecordingWithMetadata[] {
		const now = new Date();
		
		return [
			{
				id: "rec-001",
				start_time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
				end_time: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
				slp_path: "C:/Users/Player/Documents/Slippi/2025-11-11_15-30-00.slp",
				video_path: "C:/Users/Player/Videos/Peppi/recording-2025-11-11-15-30-00.mp4",
				duration: 300, // 5 minutes
				file_size: 125000000, // 125 MB
				slippi_metadata: {
					characters: [CharacterId.FOX, CharacterId.FALCO],
					stage: StageId.BATTLEFIELD,
					players: [
						{
							characterId: CharacterId.FOX,
							characterColor: 0,
							playerTag: "MANG0",
							port: 1,
						},
						{
							characterId: CharacterId.FALCO,
							characterColor: 1,
							playerTag: "PPMD",
							port: 2,
						},
					],
					gameDuration: 18000, // 5 minutes in frames
					startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
					isPAL: false,
				},
			},
			{
				id: "rec-002",
				start_time: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
				end_time: new Date(now.getTime() - 5 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
				slp_path: "C:/Users/Player/Documents/Slippi/2025-11-11_12-15-00.slp",
				video_path: "C:/Users/Player/Videos/Peppi/recording-2025-11-11-12-15-00.mp4",
				duration: 180, // 3 minutes
				file_size: 85000000, // 85 MB
				slippi_metadata: {
					characters: [CharacterId.MARTH, CharacterId.FOX],
					stage: StageId.FINAL_DESTINATION,
					players: [
						{
							characterId: CharacterId.MARTH,
							characterColor: 0,
							playerTag: "Zain",
							port: 1,
						},
						{
							characterId: CharacterId.FOX,
							characterColor: 0,
							playerTag: "iBDW",
							port: 2,
						},
					],
					gameDuration: 10800,
					startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
					isPAL: false,
				},
			},
			{
				id: "rec-003",
				start_time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
				end_time: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
				slp_path: "C:/Users/Player/Documents/Slippi/2025-11-10_16-45-00.slp",
				video_path: "C:/Users/Player/Videos/Peppi/recording-2025-11-10-16-45-00.mp4",
				duration: 240, // 4 minutes
				file_size: 98000000, // 98 MB
				slippi_metadata: {
					characters: [CharacterId.JIGGLYPUFF, CharacterId.MARTH],
					stage: StageId.YOSHIS_STORY,
					players: [
						{
							characterId: CharacterId.JIGGLYPUFF,
							characterColor: 0,
							playerTag: "Hbox",
							port: 1,
						},
						{
							characterId: CharacterId.MARTH,
							characterColor: 2,
							playerTag: "Zain",
							port: 2,
						},
					],
					gameDuration: 14400,
					startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
					isPAL: false,
				},
			},
			{
				id: "rec-004",
				start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
				end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
				slp_path: "C:/Users/Player/Documents/Slippi/2025-11-09_19-30-00.slp",
				video_path: "C:/Users/Player/Videos/Peppi/recording-2025-11-09-19-30-00.mp4",
				duration: 360, // 6 minutes
				file_size: 142000000, // 142 MB
				slippi_metadata: {
					characters: [CharacterId.FALCO, CharacterId.SHEIK],
					stage: StageId.POKEMON_STADIUM,
					players: [
						{
							characterId: CharacterId.FALCO,
							characterColor: 3,
							playerTag: "PPMD",
							port: 1,
						},
						{
							characterId: CharacterId.SHEIK,
							characterColor: 1,
							playerTag: "M2K",
							port: 2,
						},
					],
					gameDuration: 21600,
					startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
					isPAL: false,
				},
			},
			{
				id: "rec-005",
				start_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				end_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 1000).toISOString(),
				slp_path: "C:/Users/Player/Documents/Slippi/2025-11-08_14-20-00.slp",
				video_path: "C:/Users/Player/Videos/Peppi/recording-2025-11-08-14-20-00.mp4",
				duration: 150, // 2.5 minutes
				file_size: 62000000, // 62 MB
				slippi_metadata: {
					characters: [CharacterId.CAPTAIN_FALCON, CharacterId.GANONDORF],
					stage: StageId.DREAM_LAND,
					players: [
						{
							characterId: CharacterId.CAPTAIN_FALCON,
							characterColor: 0,
							playerTag: "S2J",
							port: 1,
						},
						{
							characterId: CharacterId.GANONDORF,
							characterColor: 0,
							playerTag: "n0ne",
							port: 2,
						},
					],
					gameDuration: 9000,
					startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
					isPAL: false,
				},
			},
		];
	}

	// Fetch recordings from backend
	async refresh() {
		this.isLoading = true;
		this.error = null;

		try {
			const sessions = await invoke<RecordingSession[]>("get_recordings");
			this.recordings = sessions.map((session) => ({
				...session,
				is_selected: this.selectedIds.has(session.id),
			}));
		} catch (e) {
			this.error = e instanceof Error ? e.message : "Failed to fetch recordings";
			console.error("Failed to fetch recordings:", e);
			// Fall back to mock data on error
			this.recordings = this.getMockRecordings();
		} finally {
			this.isLoading = false;
		}
	}

	// Toggle selection for a recording
	toggleSelection(id: string) {
		if (this.selectedIds.has(id)) {
			this.selectedIds.delete(id);
		} else {
			this.selectedIds.add(id);
		}
		this.selectedIds = new Set(this.selectedIds); // Trigger reactivity
	}

	// Select all recordings
	selectAll() {
		this.selectedIds = new Set(this.recordings.map((r) => r.id));
	}

	// Clear all selections
	clearSelection() {
		this.selectedIds.clear();
		this.selectedIds = new Set(this.selectedIds); // Trigger reactivity
	}

	// Get count of selected recordings
	get selectedCount() {
		return this.selectedIds.size;
	}

	// Check if all recordings are selected
	get allSelected() {
		return this.recordings.length > 0 && this.selectedIds.size === this.recordings.length;
	}

	// Check if some (but not all) are selected
	get someSelected() {
		return this.selectedIds.size > 0 && this.selectedIds.size < this.recordings.length;
	}

	// Delete selected recordings
	async deleteSelected() {
		// TODO: Implement actual deletion via Tauri command
		const idsToDelete = Array.from(this.selectedIds);
		console.log("Deleting recordings:", idsToDelete);
		
		// Remove from local state
		this.recordings = this.recordings.filter((r) => !this.selectedIds.has(r.id));
		this.clearSelection();
	}

	// Get total storage used by all recordings
	get totalStorage() {
		return this.recordings.reduce((total, rec) => total + (rec.file_size || 0), 0);
	}

	// Get most played character
	get mostPlayedCharacter() {
		const characterCounts = new Map<number, number>();
		
		this.recordings.forEach((rec) => {
			if (rec.slippi_metadata) {
				rec.slippi_metadata.characters.forEach((charId) => {
					characterCounts.set(charId, (characterCounts.get(charId) || 0) + 1);
				});
			}
		});

		let maxCount = 0;
		let mostPlayed = -1;
		
		characterCounts.forEach((count, charId) => {
			if (count > maxCount) {
				maxCount = count;
				mostPlayed = charId;
			}
		});

		return mostPlayed;
	}
}

// Export singleton instance
export const recordingsStore = new RecordingsStore();

