<script lang="ts">
import Icon from '@iconify/svelte';
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
	class="card bg-white border border-surface-200 shadow-md p-4 flex items-center justify-between gap-4 {isTopThree ? 'border-l-4 border-l-primary-500' : ''}"
aria-label="{displayName}: rank {rank}, {coinsEarned} coins this week"
>
<span class="text-xl w-10 text-center shrink-0" aria-hidden="true">
{#if rankIcon}
<Icon icon={rankIcon} class="h-6 w-6 inline-block" />
{:else}
#{rank}
{/if}
</span>
<div class="flex items-center gap-3 flex-1 min-w-0">
<span class="text-xl shrink-0" aria-hidden="true">{avatarEmoji}</span>
<span class="font-semibold truncate">{displayName}</span>
</div>
<span class="flex items-center gap-1 font-bold text-primary-500 shrink-0">
<Icon icon="noto:coin" class="h-5 w-5" aria-hidden="true" />
<span class="text-lg">{coinsEarned}</span>
</span>
</article>