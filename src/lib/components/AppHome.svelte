<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { recording } from "$lib/stores/recording.svelte";
	import { invoke } from "@tauri-apps/api/core";
	import { Play, Square } from "@lucide/svelte";

	let isStarting = $state(false);
	let isStopping = $state(false);
	let error = $state<string | null>(null);
	let lastRecordingPath = $state<string | null>(null);

	async function startRecording() {
		error = null;
		isStarting = true;

		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputPath = `/tmp/recording-${timestamp}.mp4`;
			
			await invoke("start_recording", { outputPath });
			recording.start();
			lastRecordingPath = outputPath;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			console.error("Failed to start recording:", e);
		} finally {
			isStarting = false;
		}
	}

	async function stopRecording() {
		error = null;
		isStopping = true;

		try {
			const path = await invoke<string>("stop_recording");
			recording.stop();
			lastRecordingPath = path;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			console.error("Failed to stop recording:", e);
		} finally {
			isStopping = false;
		}
	}
</script>

<div class="flex h-full items-center justify-center">
	<Card class="w-full max-w-2xl">
		<CardHeader>
			<CardTitle>Screen Recording</CardTitle>
			<CardDescription>
				Test the screen recording functionality
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-3">
				<Button
					onclick={startRecording}
					disabled={recording.isRecording || isStarting}
					class="flex-1"
				>
					<Play class="size-4" />
					{isStarting ? "Starting..." : "Start Recording"}
				</Button>
				
				<Button
					onclick={stopRecording}
					disabled={!recording.isRecording || isStopping}
					variant="destructive"
					class="flex-1"
				>
					<Square class="size-4" />
					{isStopping ? "Stopping..." : "Stop Recording"}
				</Button>
			</div>

			{#if recording.isRecording}
				<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center gap-2">
						<div class="size-2 animate-pulse rounded-full bg-red-500"></div>
						<span class="font-semibold text-red-500">Recording in progress...</span>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Check the sidebar for the live indicator
					</p>
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg border border-destructive bg-destructive/10 p-4">
					<p class="text-sm font-medium text-destructive">Error: {error}</p>
				</div>
			{/if}

			{#if lastRecordingPath && !recording.isRecording}
				<div class="rounded-lg border bg-muted p-4">
					<p class="text-sm font-medium">Last recording saved:</p>
					<p class="mt-1 break-all text-xs text-muted-foreground">{lastRecordingPath}</p>
				</div>
			{/if}

			<div class="rounded-lg border bg-muted/50 p-4">
				<p class="text-sm text-muted-foreground">
					<strong>Dev Mode:</strong> Currently using mock recorder (no actual screen capture).
					To enable real recording, build with <code class="rounded bg-muted px-1 py-0.5 text-xs">--features real-recording</code>
				</p>
			</div>
		</CardContent>
	</Card>
</div>

