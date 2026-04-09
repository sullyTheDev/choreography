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

const isTopThree = $derived(rank <= 3);
</script>

<article
	class="card bg-white border border-surface-200 shadow-md flex items-center gap-3 py-3 px-4 {isTopThree ? 'border-l-4 border-l-primary-500' : ''}"
aria-label="{displayName}: rank {rank}, {coinsEarned} coins this week"
>
<span class="text-xl w-10 text-center shrink-0" aria-hidden="true">{rankLabel}</span>
<span class="text-xl shrink-0" aria-hidden="true">{avatarEmoji}</span>
<span class="font-semibold flex-1">{displayName}</span>
<span class="flex items-center gap-1 font-bold text-primary-500">
<span aria-hidden="true">🪙</span>
<span class="text-lg">{coinsEarned}</span>
</span>
</article>