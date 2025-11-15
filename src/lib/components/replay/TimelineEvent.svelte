<script lang="ts">
	import type { GameEvent, GameEventType } from '$lib/types/recording';

	let {
		event,
		duration,
		onclick,
	}: {
		event: GameEvent;
		duration: number;
		onclick?: (timestamp: number) => void;
	} = $props();

	// Calculate position as percentage
	const position = $derived((event.timestamp / duration) * 100);

	// Get icon/color based on event type
	const eventColor = $derived(
		event.type === ('death' as GameEventType) ? 'bg-red-500' : 'bg-blue-500'
	);

	function handleClick() {
		onclick?.(event.timestamp);
	}
</script>

<button
	class="absolute top-1/2 h-3 w-3 -translate-y-1/2 cursor-pointer rounded-full transition-transform hover:scale-125 {eventColor}"
	style="left: {position}%"
	onclick={handleClick}
	title="{event.type} at {event.timestamp.toFixed(1)}s"
>
	<span class="sr-only">{event.type} at {event.timestamp.toFixed(1)}s</span>
</button>

