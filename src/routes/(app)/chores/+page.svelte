<script lang="ts">
import Icon from '@iconify/svelte';
import type { PageData, ActionData } from './$types.js';
import ChoreCard from '$lib/components/ChoreCard.svelte';

let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-4">
<div>
<h1 class="text-3xl font-extrabold">{data.greeting}</h1>
{#if data.remainingCount > 0}
<p class="text-surface-600-400">
{data.remainingCount} chore{data.remainingCount === 1 ? '' : 's'} left today
</p>
{:else if data.chores.length > 0}
<p class="font-semibold text-success-600-400 flex items-center gap-2"><Icon icon="noto:partying-face" class="h-5 w-5" /> All done! Great work!</p>
{/if}
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm" role="alert">{form.error}</div>
{/if}

{#if data.chores.length === 0}
<p class="text-center text-surface-500 py-12">No chores assigned yet. Ask a parent to set some up!</p>
{:else}
<div class="flex flex-col gap-3" aria-label="Chore list">
{#each data.chores as chore (chore.id)}
<ChoreCard
id={chore.id}
emoji={chore.emoji}
title={chore.title}
description={chore.description}
frequency={chore.frequency}
coinValue={chore.coinValue}
assignedKidName={chore.assignedKidName}
isCompleted={chore.isCompleted}
activeMemberId={data.activeMemberId}
/>
{/each}
</div>
{/if}
</div>