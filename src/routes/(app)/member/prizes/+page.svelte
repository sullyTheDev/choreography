<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import PrizeCard from '$lib/components/PrizeCard.svelte';
import Icon from '@iconify/svelte';
import CoinBadge from '$lib/components/CoinBadge.svelte';
let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Prize Shop</h1>
		<div class="flex flex-col items-end gap-0.5">
			<span class="text-xs font-semibold text-surface-500 uppercase tracking-widest">Balance</span>
			<CoinBadge value={data.coinBalance} />
		</div>
	</div>

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
