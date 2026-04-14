<script lang="ts">
import Icon from '@iconify/svelte';
import CoinBadge from './CoinBadge.svelte';
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

const rankIcon = $derived(rank === 1 ? 'noto:1st-place-medal' : rank === 2 ? 'noto:2nd-place-medal' : rank === 3 ? 'noto:3rd-place-medal' : null);

const isTopThree = $derived(rank <= 3);
</script>

<article
	class="card border preset-outlined-primary-200-800 shadow-md p-4 flex items-center gap-4 {isTopThree ? 'border-l-4 border-l-primary-500' : ''}"
	aria-label="{displayName}: rank {rank}, {coinsEarned} coins this week"
>
	<span class="text-xl w-10 text-center shrink-0" aria-hidden="true">
		{#if rankIcon}
			<Icon icon={rankIcon} class="h-6 w-6 inline-block" />
		{:else}
			#{rank}
		{/if}
	</span>
	<div class="flex-1 flex flex-col gap-1 min-w-0">
		<div class="flex items-center gap-3 min-w-0">
			<span class="text-3xl shrink-0" aria-hidden="true">{avatarEmoji}</span>
			<span class="font-semibold truncate">{displayName}</span>
		</div>
	</div>
	<div class="shrink-0">
		<CoinBadge value={coinsEarned} />
	</div>
</article>