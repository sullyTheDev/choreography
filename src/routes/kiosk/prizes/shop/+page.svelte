<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import PrizeCard from '$lib/components/PrizeCard.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-4">
	{#if form?.error}
		<div class="card preset-tonal-error p-3 text-sm" role="alert">{form.error}</div>
	{/if}

	{#if data.prizes.length === 0}
		<p class="text-center text-surface-500 py-12">No prizes available yet. Check back soon!</p>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3" aria-label="Available prizes">
			{#each data.prizes as prize (prize.id)}
				<PrizeCard
					id={prize.id}
					emoji={prize.emoji}
					title={prize.title}
					description={prize.description}
					coinCost={prize.coinCost}
					canAfford={prize.canAfford}
					shortfall={prize.shortfall}
					activeMemberId={data.activeMemberId}
					memberRole={data.memberRole}
				/>
			{/each}
		</div>
	{/if}
</div>
