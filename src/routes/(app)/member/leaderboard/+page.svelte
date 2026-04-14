
<script lang="ts">
import Icon from '@iconify/svelte';
import LeaderboardRow from '$lib/components/LeaderboardRow.svelte';
import CoinBadge from '$lib/components/CoinBadge.svelte';
let { data } = $props<{ data: { period: { start: string; end: string; label: string }; rankings: Array<{ rank: number; memberId: string; displayName: string; avatarEmoji: string; coinsEarned: number; }>; }; }>();

const top3 = $derived(data.rankings.slice(0, Math.min(3, data.rankings.length)));
const rest = $derived(data.rankings.slice(Math.min(3, data.rankings.length)));
</script>

<section class="space-y-6">
	<header class="text-center">
		<h2 class="text-2xl font-bold flex items-center justify-center gap-2"><Icon icon="noto:trophy" class="h-7 w-7" /> Leaderboard</h2>
		<p class="text-sm text-surface-500">{data.period.label}</p>
	</header>

	{#if data.rankings.length === 0}
		<p class="text-center text-surface-500 py-12">No family members yet, add someone to get started.</p>
	{:else}
		<!-- Podium -->
		<div class="card preset-filled-surface-50-950 p-0 rounded-none border-b">
		<div class="flex items-end justify-center gap-2" aria-label="Top 3 rankings">

			<!-- 2nd place (left) -->
			{#if top3[1]}
				{@const entry = top3[1]}
				<div class="flex flex-col items-center gap-1 flex-1" aria-label="{entry.displayName}: 2nd place, {entry.coinsEarned} coins">
					<span class="text-4xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="text-sm font-semibold text-center leading-tight">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-20 mt-2 rounded-t-lg preset-tonal-primary border border-primary-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:2nd-place-medal" class="h-8 w-8" />
					</div>
				</div>
			{/if}

			<!-- 1st place (center, tallest) -->
			{#if top3[0]}
				{@const entry = top3[0]}
				<div class="flex flex-col items-center gap-1 flex-1" aria-label="{entry.displayName}: 1st place, {entry.coinsEarned} coins">
					<span class="animate-bob inline-block"><Icon icon="noto:crown" class="h-8 w-8" /></span>
					<span class="text-5xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="font-bold text-center leading-tight">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-32 mt-2 rounded-t-lg preset-tonal-warning border border-warning-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:1st-place-medal" class="h-10 w-10" />
					</div>
				</div>
			{/if}

			<!-- 3rd place (right) -->
			{#if top3[2]}
				{@const entry = top3[2]}
				<div class="flex flex-col items-center gap-1 flex-1" aria-label="{entry.displayName}: 3rd place, {entry.coinsEarned} coins">
					<span class="text-4xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="text-sm font-semibold text-center leading-tight">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-14 mt-2 rounded-t-lg preset-tonal-secondary border border-secondary-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:3rd-place-medal" class="h-6 w-6" />
					</div>
				</div>
			{/if}
		</div>
		</div>

		<!-- 4th place and below -->
		{#if rest.length > 0}
			<ol class="flex flex-col gap-2 list-none p-0 m-0" aria-label="Remaining rankings">
				{#each rest as entry (entry.memberId)}
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
	{/if}
</section>

<style>
	@keyframes bob {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}
	.animate-bob {
		animation: bob 1.8s ease-in-out infinite;
	}
</style>
