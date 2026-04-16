
<script lang="ts">
import Icon from '@iconify/svelte';
import LeaderboardRow from '$lib/components/LeaderboardRow.svelte';
import CoinBadge from '$lib/components/CoinBadge.svelte';
let { data } = $props<{ data: { period: { start: string; end: string; label: string }; rankings: Array<{ rank: number; memberId: string; displayName: string; avatarEmoji: string; coinsEarned: number; }>; }; }>();

const top3 = $derived(data.rankings.slice(0, Math.min(3, data.rankings.length)));
const rest = $derived(data.rankings.slice(Math.min(3, data.rankings.length)));
</script>

<section class="space-y-4 mt-6">
	<header class="pb-3">
		<h2 class="text-3xl font-extrabold flex items-center gap-2"><Icon icon="noto:trophy" class="h-8 w-8" /> Leaderboard</h2>
		<p class="text-sm text-surface-500 mt-2">{data.period.label}</p>
	</header>

	{#if data.rankings.length === 0}
		<p class="text-center text-surface-500 py-12">No family members yet, add someone to get started.</p>
	{:else}
		<!-- Podium -->
		<div class="card preset-filled-surface-50-950 p-0 rounded-none border-b">
		<div class="flex items-end justify-center gap-1" aria-label="Top 3 rankings">

			<!-- 2nd place (left) -->
			{#if top3[1]}
				{@const entry = top3[1]}
				<div class="flex flex-col items-center gap-0.5 flex-1 podium-enter" style="--pedestal-delay: 0.1s;" aria-label="{entry.displayName}: 2nd place, {entry.coinsEarned} coins">
					<span class="text-2xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="text-xs font-semibold text-center leading-tight">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-20 mt-1 rounded-t-lg preset-tonal-primary border border-primary-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:2nd-place-medal" class="h-7 w-7" />
					</div>
				</div>
			{/if}

			<!-- 1st place (center, tallest) -->
			{#if top3[0]}
				{@const entry = top3[0]}
				<div class="flex flex-col items-center gap-0.5 flex-1 podium-enter" style="--pedestal-delay: 0s;" aria-label="{entry.displayName}: 1st place, {entry.coinsEarned} coins">
					<span class="animate-bob inline-block"><Icon icon="noto:crown" class="h-7 w-7" /></span>
					<span class="text-3xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="font-semibold text-center leading-tight text-sm">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-32 mt-1 rounded-t-lg preset-tonal-warning border border-warning-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:1st-place-medal" class="h-9 w-9" />
					</div>
				</div>
			{/if}

			<!-- 3rd place (right) -->
			{#if top3[2]}
				{@const entry = top3[2]}
				<div class="flex flex-col items-center gap-0.5 flex-1 podium-enter" style="--pedestal-delay: 0.2s;" aria-label="{entry.displayName}: 3rd place, {entry.coinsEarned} coins">
					<span class="text-2xl" aria-hidden="true">{entry.avatarEmoji}</span>
					<span class="text-xs font-semibold text-center leading-tight">{entry.displayName}</span>
					<CoinBadge value={entry.coinsEarned} />
					<div class="w-full h-14 mt-1 rounded-t-lg preset-tonal-secondary border border-secondary-200 border-b-0 flex items-center justify-center">
						<Icon icon="noto:3rd-place-medal" class="h-6 w-6" />
					</div>
				</div>
			{/if}
		</div>
		</div>

		<!-- 4th place and below -->
		{#if rest.length > 0}
			<ol class="flex flex-col gap-1 list-none p-0 m-0" aria-label="Remaining rankings">
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

	@keyframes pedestal-rise {
		0% {
			opacity: 0;
			transform: translateY(30px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.podium-enter {
		animation: pedestal-rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
		animation-delay: var(--pedestal-delay, 0s);
	}
</style>
