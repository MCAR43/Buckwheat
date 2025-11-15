<script lang="ts">
	import type { GameEvent } from '$lib/types/recording';
	import TimelineEvent from './TimelineEvent.svelte';

	let {
		events = [],
		duration,
		currentTime = 0,
		onseek,
	}: {
		events: GameEvent[];
		duration: number;
		currentTime?: number;
		onseek?: (time: number) => void;
	} = $props();

	// Calculate progress percentage
	const progress = $derived((currentTime / duration) * 100);

	// Handle timeline click to seek
	function handleTimelineClick(e: MouseEvent) {
		const timeline = e.currentTarget as HTMLDivElement;
		const rect = timeline.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const percentage = clickX / rect.width;
		const seekTime = percentage * duration;
		onseek?.(seekTime);
	}
</script>

<div class="w-full space-y-2">
	<div class="text-xs text-muted-foreground">
		{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor(
			duration / 60
		)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
	</div>

	<!-- Timeline bar -->
	<div
		class="relative h-8 w-full cursor-pointer rounded-md bg-muted"
		onclick={handleTimelineClick}
		role="progressbar"
		aria-valuenow={currentTime}
		aria-valuemin={0}
		aria-valuemax={duration}
	>
		<!-- Progress indicator -->
		<div class="absolute inset-0 rounded-md bg-primary/20" style="width: {progress}%"></div>

		<!-- Current time indicator -->
		<div
			class="absolute top-0 h-full w-0.5 bg-primary"
			style="left: {progress}%"
		></div>

		<!-- Event markers -->
		{#each events as event (event.frame)}
			<TimelineEvent {event} {duration} onclick={onseek} />
		{/each}
	</div>

	<!-- Legend -->
	<div class="flex items-center gap-4 text-xs text-muted-foreground">
		<div class="flex items-center gap-1.5">
			<div class="h-2 w-2 rounded-full bg-red-500"></div>
			<span>Death</span>
		</div>
	</div>
</div>

