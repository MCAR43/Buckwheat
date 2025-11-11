/**
 * Recording state store
 * Tracks whether a match is currently being recorded and game window status
 */
class RecordingStore {
	isRecording = $state(false);
	gameWindowDetected = $state(false);
	gameActive = $state(false); // Will be set based on .slp file detection later

	// Derived status for the indicator
	status = $derived.by(() => {
		if (this.isRecording) return "recording";
		if (this.gameActive) return "ready";
		if (this.gameWindowDetected) return "waiting";
		return "no-window";
	});

	start() {
		this.isRecording = true;
	}

	stop() {
		this.isRecording = false;
	}

	setGameWindow(detected: boolean) {
		this.gameWindowDetected = detected;
	}

	setGameActive(active: boolean) {
		this.gameActive = active;
	}
}

export const recording = new RecordingStore();


