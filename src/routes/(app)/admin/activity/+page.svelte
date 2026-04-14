<script lang="ts">
import Icon from '@iconify/svelte';
import type { PageData } from './$types.js';

let { data }: { data: PageData } = $props();

function formatDate(iso: string): string {
return new Date(iso).toLocaleString('en-US', {
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
});
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Activity Log</h1>
<span class="text-sm text-surface-500">{data.totalCount} events</span>
</div>

{#if data.events.length === 0}
<p class="text-center text-surface-500 py-12">No activity yet. Once members start completing chores and redeeming prizes, you'll see it here.</p>
{:else}
<div class="flex flex-col gap-2" aria-label="Activity log">
{#each data.events as event}
<div class="card bg-white border border-surface-200 shadow-md flex items-center gap-4 p-4 border-l-4 {event.type === 'chore_completion' ? 'border-l-success-500' : 'border-l-primary-500'}">
<div class="text-2xl shrink-0" aria-hidden="true">{event.memberAvatarEmoji}</div>
<div class="flex-1 flex flex-col gap-0.5">
<div class="text-sm">
<strong>{event.memberName}</strong>
{#if event.type === 'chore_completion'}
completed <em>"{event.title}"</em>
{:else}
redeemed <em>"{event.title}"</em>
{/if}
</div>
<div class="flex gap-2 items-center">
<span class="text-sm font-semibold {event.type === 'chore_completion' ? 'text-success-600-400' : 'text-primary-500'}">
{event.type === 'chore_completion' ? '+' : '−'}<Icon icon="noto:coin" class="h-4 w-4 inline" /> {event.coins}
</span>
<span class="text-xs text-surface-500">{formatDate(event.occurredAt)}</span>
</div>
</div>
<div class="text-xl shrink-0" aria-hidden="true">
{#if event.type === 'chore_completion'}
<Icon icon="noto:check-mark-button" class="h-5 w-5" />
{:else}
<Icon icon="noto:wrapped-gift" class="h-5 w-5" />
{/if}
</div>
</div>
{/each}
</div>

<div class="flex justify-center items-center gap-3">
{#if data.page > 1}
<a href="?page={data.page - 1}" class="btn hover:preset-tonal">← Previous</a>
{/if}
<span class="text-sm text-surface-500">Page {data.page}</span>
{#if data.page * 25 < data.totalCount}
<a href="?page={data.page + 1}" class="btn hover:preset-tonal">Next →</a>
{/if}
</div>
{/if}
</div>