<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		id: string;
		title: string;
		description: string;
		coinCost: number;
		canAfford: boolean;
		shortfall: number;
		activeKidId: string | null;
		userRole: 'parent' | 'kid';
	}

	let { id, title, description, coinCost, canAfford, shortfall, activeKidId, userRole }: Props =
		$props();
</script>

<div class="prize-card" class:can-afford={canAfford} class:cannot-afford={!canAfford}>
	<div class="prize-body">
		<div class="prize-header">
			<strong class="prize-title">{title}</strong>
			<span class="prize-coins">🪙 {coinCost}</span>
		</div>
		{#if description}
			<p class="prize-desc">{description}</p>
		{/if}
		{#if !canAfford && userRole === 'kid'}
			<p class="shortfall-hint">Need {shortfall} more coins</p>
		{/if}
	</div>
	<div class="prize-action">
		{#if userRole === 'kid'}
			<form method="POST" action="?/redeem" use:enhance>
				<input type="hidden" name="prizeId" value={id} />
				{#if activeKidId}
					<input type="hidden" name="kidId" value={activeKidId} />
				{/if}
				<button
					type="submit"
					class="btn btn-redeem"
					class:btn-primary={canAfford}
					class:btn-disabled={!canAfford}
					disabled={!canAfford}
					aria-label="Redeem {title} for {coinCost} coins"
				>
					{canAfford ? 'Redeem' : 'Need more coins'}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.prize-card {
		background: white;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		transition: border-color 0.2s;
	}

	.prize-card.can-afford {
		border-color: var(--color-success, #22c55e);
	}

	.prize-card.cannot-afford {
		opacity: 0.7;
	}

	.prize-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.prize-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.prize-title {
		font-size: var(--text-base);
	}

	.prize-coins {
		font-size: var(--text-sm);
		background: var(--color-warning-light, #fff7ed);
		color: var(--color-warning-dark, #9a3412);
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.prize-desc {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.shortfall-hint {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin: 0;
		font-style: italic;
	}

	.btn-redeem {
		white-space: nowrap;
	}

	.btn-disabled {
		background: var(--color-border);
		color: var(--color-text-secondary);
		cursor: not-allowed;
		border: none;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius);
	}
</style>
