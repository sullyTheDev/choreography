<script lang="ts">
	let {
		rank,
		avatarEmoji,
		displayName,
		coinsEarned
	} = $props<{
		rank: number;
		avatarEmoji: string;
		displayName: string;
		coinsEarned: number;
	}>();

	const rankLabel = $derived(
		rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
	);
</script>

<article
	class="leaderboard-row"
	class:top-three={rank <= 3}
	aria-label="{displayName}: rank {rank}, {coinsEarned} coins this week"
>
	<span class="rank" aria-hidden="true">{rankLabel}</span>
	<span class="avatar" aria-hidden="true">{avatarEmoji}</span>
	<span class="name">{displayName}</span>
	<span class="coins">
		<span class="coin-icon" aria-hidden="true">🪙</span>
		<span class="coin-value">{coinsEarned}</span>
	</span>
</article>

<style>
	.leaderboard-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 2px solid transparent;
	}

	.leaderboard-row.top-three {
		border-color: var(--color-primary);
	}

	.rank {
		font-size: var(--font-size-xl);
		width: 2.5rem;
		text-align: center;
		flex-shrink: 0;
	}

	.avatar {
		font-size: var(--font-size-xl);
	}

	.name {
		font-weight: 600;
		flex: 1;
	}

	.coins {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-weight: 700;
		color: var(--color-primary);
	}

	.coin-value {
		font-size: var(--font-size-lg);
	}
</style>
