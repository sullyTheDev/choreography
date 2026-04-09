<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import PrizeCard from '$lib/components/PrizeCard.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page-container">
	<div class="shop-header">
		<h1>Prize Shop</h1>
		<div class="balance-badge" aria-label="Your coin balance">
			🪙 <strong>{data.coinBalance}</strong> coins
		</div>
	</div>

	{#if form?.error}
		<div class="alert alert-error" role="alert">{form.error}</div>
	{/if}

	{#if data.prizes.length === 0}
		<div class="empty-state">
			<p>No prizes available yet. Check back soon!</p>
		</div>
	{:else}
		<div class="prizes-grid" aria-label="Available prizes">
			{#each data.prizes as prize (prize.id)}
				<PrizeCard
					id={prize.id}
					title={prize.title}
					description={prize.description}
					coinCost={prize.coinCost}
					canAfford={prize.canAfford}
					shortfall={prize.shortfall}
					activeKidId={null}
					userRole="kid"
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 700px;
		margin: 0 auto;
		padding: var(--space-4);
	}

	.shop-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.balance-badge {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		padding: var(--space-2) var(--space-4);
		border-radius: 9999px;
		font-size: var(--text-base);
	}

	.prizes-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8);
		color: var(--color-text-secondary);
	}

	.alert {
		padding: var(--space-3);
		border-radius: var(--radius);
		margin-bottom: var(--space-3);
	}

	.alert-error {
		background: #fef2f2;
		border: 1px solid #fca5a5;
		color: #dc2626;
	}
</style>
