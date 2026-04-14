<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import PrizeCard from '$lib/components/PrizeCard.svelte';

let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Prize Shop</h1>
<span class="badge preset-tonal-primary" aria-label="Your coin balance">
🪙 <strong>{data.coinBalance}</strong> coins
</span>
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm" role="alert">{form.error}</div>
{/if}

{#if data.prizes.length === 0}
<p class="text-center text-surface-500 py-12">No prizes available yet. Check back soon!</p>
{:else}
<div class="flex flex-col gap-3" aria-label="Available prizes">
{#each data.prizes as prize (prize.id)}
<PrizeCard
id={prize.id}
title={prize.title}
description={prize.description}
coinCost={prize.coinCost}
canAfford={prize.canAfford}
shortfall={prize.shortfall}
activeKidId={null}
userRole="kid"
/>
{/each}
</div>
{/if}
</div>