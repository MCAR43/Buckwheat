<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { recording } from "$lib/stores/recording.svelte";
	import { handleTauriError, showSuccess } from "$lib/utils/errors";
	import { invoke } from "@tauri-apps/api/core";
	import { Play, Square, Settings } from "@lucide/svelte";
	import RecordingStats from "$lib/components/recordings/RecordingStats.svelte";
	import RecordingsTable from "$lib/components/recordings/RecordingsTable.svelte";
	import BatchActions from "$lib/components/recordings/BatchActions.svelte";
	import { captureWindowPreview } from "$lib/commands.svelte";

	let isStarting = $state(false);
	let isStopping = $state(false);
	let isPreviewLoading = $state(false);
	let previewImage = $state<string | null>(null);
	let previewError = $state<string | null>(null);

	async function startRecording() {
		isStarting = true;

		try {
			// Get recording directory (handles defaults and creates directory if needed)
			const recordingDir = await invoke<string>("get_recording_directory");
			
			// Generate filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `recording-${timestamp}.mp4`;
			const outputPath = `${recordingDir}/${filename}`;
			
			await invoke("start_recording", { outputPath });
			recording.start();
			showSuccess("Recording started");
		} catch (e) {
			handleTauriError(e, "Failed to start recording");
		} finally {
			isStarting = false;
		}
	}

	async function stopRecording() {
		isStopping = true;

		try {
			await invoke<string>("stop_recording");
			recording.stop();
			showSuccess("Recording stopped");
		} catch (e) {
			handleTauriError(e, "Failed to stop recording");
		} finally {
			isStopping = false;
		}
	}

	async function refreshPreview(manual = false) {
		if (!recording.gameWindowDetected) {
			previewImage = null;
			previewError = "No game window detected";
			return;
		}
		if (isPreviewLoading) return;

		isPreviewLoading = true;
		previewError = null;

		try {
			const data = await captureWindowPreview();
			previewImage = data;
			if (!data) {
				previewError = "Preview unavailable. Make sure the window is visible.";
			}
		} catch (error) {
			console.error("Failed to capture preview", error);
			previewError = "Failed to capture preview";
		} finally {
			isPreviewLoading = false;
		}
	}

	let lastWindowDetected = recording.gameWindowDetected;
	$effect(() => {
		if (recording.gameWindowDetected && !lastWindowDetected) {
			void refreshPreview();
		}
		if (!recording.gameWindowDetected) {
			previewImage = null;
			previewError = null;
		}
		lastWindowDetected = recording.gameWindowDetected;
	});
</script>

<div class="flex h-full flex-col gap-6 p-6">
	<!-- Stats Dashboard -->
	<RecordingStats />

	<!-- Quick Actions Card -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>
						Control your screen recording
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex gap-3">
				<Button
					onclick={startRecording}
					disabled={recording.isRecording || isStarting}
					size="lg"
					class="flex-1"
				>
					<Play class="size-4" />
					{isStarting ? "Starting..." : "Start Recording"}
				</Button>
				
				<Button
					onclick={stopRecording}
					disabled={!recording.isRecording || isStopping}
					variant="destructive"
					size="lg"
					class="flex-1"
				>
					<Square class="size-4" />
					{isStopping ? "Stopping..." : "Stop Recording"}
				</Button>

				<Button
					variant="outline"
					size="lg"
					onclick={() => console.log("Open settings")}
					title="Settings"
				>
					<Settings class="size-4" />
				</Button>
			</div>

			{#if recording.isRecording}
				<div class="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center gap-2">
						<div class="size-2 animate-pulse rounded-full bg-red-500"></div>
						<span class="font-semibold text-red-500">Recording in progress...</span>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Your recording will be automatically paired with replay files
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Window Preview -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between">
			<div>
				<CardTitle>Game Window Preview</CardTitle>
				<CardDescription>Verify that we're targeting the correct window</CardDescription>
			</div>
			<Button variant="ghost" size="sm" onclick={() => refreshPreview(true)} disabled={isPreviewLoading || !recording.gameWindowDetected}>
				{isPreviewLoading ? "Refreshing..." : "Refresh"}
			</Button>
		</CardHeader>
		<CardContent>
			{#if !recording.gameWindowDetected}
				<p class="text-sm text-muted-foreground">No game window detected yet.</p>
			{:else if isPreviewLoading}
				<p class="text-sm text-muted-foreground">Capturing preview...</p>
			{:else if previewImage}
				<div class="flex items-center justify-center">
					<img
						src={`data:image/png;base64,${previewImage}`}
						alt="Game window preview"
						class="max-h-48 w-full rounded-md border object-contain bg-muted"
					/>
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">{previewError ?? "Preview unavailable"}</p>
			{/if}
		</CardContent>
	</Card>

	<!-- Recordings Table -->
	<RecordingsTable />

	<!-- Batch Actions Toolbar (floats at bottom when items selected) -->
	<BatchActions />
</div>

