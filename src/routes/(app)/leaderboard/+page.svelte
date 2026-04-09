<script lang="ts">
	import LeaderboardRow from '$lib/components/LeaderboardRow.svelte';

	let { data } = $props<{
		data: {
			period: { start: string; end: string; label: string };
			rankings: Array<{
				rank: number;
				kidId: string;
				displayName: string;
				avatarEmoji: string;
				coinsEarned: number;
			}>;
		};
	}>();
</script>

<section class="leaderboard">
	<header class="leaderboard-header">
		<h2>🏆 Leaderboard</h2>
		<p class="period-label">{data.period.label}</p>
	</header>

	{#if data.rankings.length === 0}
		<p class="empty-state">No kids yet — add some kids to get started!</p>
	{:else}
		<ol class="rankings-list" aria-label="Leaderboard rankings">
			{#each data.rankings as entry (entry.kidId)}
				<li>
					<LeaderboardRow
						rank={entry.rank}
						avatarEmoji={entry.avatarEmoji}
						displayName={entry.displayName}
						coinsEarned={entry.coinsEarned}
					/>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.leaderboard {
		padding: var(--space-4);
	}

	.leaderboard-header {
		margin-bottom: var(--space-4);
		text-align: center;
	}

	.leaderboard-header h2 {
		font-size: var(--font-size-2xl);
		font-weight: 700;
		margin-bottom: var(--space-1);
	}

	.period-label {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.rankings-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-8);
	}
</style>
