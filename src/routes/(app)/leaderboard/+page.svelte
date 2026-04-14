<script lang="ts">
import Icon from '@iconify/svelte';
import LeaderboardRow from '$lib/components/LeaderboardRow.svelte';

let { data } = $props<{
data: {
period: { start: string; end: string; label: string };
rankings: Array<{
rank: number;
memberId: string;
displayName: string;
avatarEmoji: string;
coinsEarned: number;
}>;
};
}>();
</script>

<section class="space-y-4">
<header class="text-center">
<h2 class="text-2xl font-bold flex items-center justify-center gap-2"><Icon icon="noto:trophy" class="h-7 w-7" /> Leaderboard</h2>
<p class="text-sm text-surface-500">{data.period.label}</p>
</header>

{#if data.rankings.length === 0}
<p class="text-center text-surface-500 py-12">No family members yet, add someone to get started.</p>
{:else}
<ol class="flex flex-col gap-2 list-none p-0 m-0" aria-label="Leaderboard rankings">
{#each data.rankings as entry (entry.memberId)}
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