<script lang="ts">
	import type { PageData } from './$types.js';
	import PrizePunchCard from '$lib/components/PrizePunchCard.svelte';

	let { data }: { data: PageData } = $props();
</script>

{#if data.prizeGroups.length === 0}
	<p class="text-center text-surface-500 py-12">No prizes redeemed yet.</p>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		{#each data.prizeGroups as group (group.prizeId)}
			<PrizePunchCard
				prizeId={group.prizeId}
				prizeTitle={group.prizeTitle}
				prizeEmoji={group.prizeEmoji}
				redemptions={group.redemptions}
				activeMemberId={data.activeMemberId}
			/>
		{/each}
	</div>
{/if}
