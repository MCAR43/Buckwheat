<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { navigation } from '$lib/stores/navigation.svelte';
	import { recordingsStore } from '$lib/stores/recordings.svelte';
	import type { GameEvent } from '$lib/types/recording';
	import VideoPlayer from './VideoPlayer.svelte';
	import Timeline from './Timeline.svelte';
	import StatsPanel from './StatsPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { handleTauriError } from '$lib/utils/errors';

	let { recordingId }: { recordingId: string } = $props();

	let playerRef: VideoPlayer;
	let events = $state<GameEvent[]>([]);
	let currentTime = $state(0);
	let duration = $state(0);
	let isLoadingEvents = $state(true);

	// Find the recording in the store
	const recording = $derived(recordingsStore.recordings.find((r) => r.id === recordingId));

	onMount(async () => {
		// Load events from the .slp file
		if (recording?.slp_path) {
			try {
				isLoadingEvents = true;
				const parsedEvents = await invoke<GameEvent[]>('parse_slp_events', {
					slpPath: recording.slp_path,
				});
				events = parsedEvents;
				console.log('📊 Loaded', events.length, 'events');
			} catch (e) {
				handleTauriError(e, 'Failed to parse replay events');
			} finally {
				isLoadingEvents = false;
			}
		}
	});

	function handleSeek(time: number) {
		playerRef?.seekTo(time);
	}

	function handleBack() {
		navigation.navigateBack();
	}
</script>

<!-- Replay viewer needs fixed height to prevent scrolling -->
<div class="fixed inset-0 left-auto right-0 flex flex-col gap-3 overflow-hidden bg-background p-4" style="width: calc(100vw - var(--sidebar-width, 16rem)); top: 64px;">
	<!-- Header -->
	<div class="flex flex-shrink-0 items-center gap-4">
		<Button variant="ghost" size="sm" onclick={handleBack}>
			<ArrowLeft class="size-4" />
			Back
		</Button>
		<h1 class="text-xl font-bold">
			{#if recording?.slippi_metadata}
				{recording.slippi_metadata.players[0]?.player_tag || 'Player 1'} vs {recording
					.slippi_metadata.players[1]?.player_tag || 'Player 2'}
			{:else}
				Replay Viewer
			{/if}
		</h1>
	</div>

	<!-- Main content -->
	<div class="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[1fr_350px]">
		<!-- Left side: Video and Timeline -->
		<div class="flex flex-col gap-3 overflow-hidden">
			<!-- Video Player - fills available space -->
			<div class="flex flex-1 items-center justify-center overflow-hidden bg-black rounded-lg">
				{#if recording?.video_path}
					<VideoPlayer
						bind:this={playerRef}
						videoPath={recording.video_path}
						oncurrenttimeupdate={(time) => (currentTime = time)}
						ondurationchange={(dur) => (duration = dur)}
					/>
				{:else}
					<div
						class="flex h-full items-center justify-center rounded-lg bg-muted text-muted-foreground"
					>
						No video available
					</div>
				{/if}
			</div>

			<!-- Timeline - fixed at bottom -->
			{#if duration > 0}
				<div class="flex-shrink-0">
					<Timeline {events} {duration} {currentTime} onseek={handleSeek} />
				</div>
			{:else if isLoadingEvents}
				<div class="flex-shrink-0 text-center text-sm text-muted-foreground">
					Loading timeline...
				</div>
			{/if}
		</div>

		<!-- Right side: Stats Panel -->
		<div class="overflow-y-auto">
			<StatsPanel metadata={recording?.slippi_metadata ?? null} />
		</div>
	</div>
</div>

