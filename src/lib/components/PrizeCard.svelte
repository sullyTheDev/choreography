<script lang="ts">
import { enhance } from '$app/forms';

interface Props {
id: string;
title: string;
description: string;
coinCost: number;
canAfford: boolean;
shortfall: number;
activeKidId: string | null;
userRole: 'parent' | 'kid';
}

let { id, title, description, coinCost, canAfford, shortfall, activeKidId, userRole }: Props =
$props();

let submitting = $state(false);
</script>

<div class="card bg-white border border-surface-200 shadow-md p-4 flex justify-between items-center gap-4 {!canAfford ? 'opacity-70' : ''}">
<div class="flex-1 flex flex-col gap-1 min-w-0">
<div class="flex items-center gap-2 flex-wrap">
<strong class="text-base font-semibold">{title}</strong>
<span class="badge preset-tonal-warning text-xs">🪙 {coinCost}</span>
</div>
{#if description}
<p class="text-sm text-surface-600-400 m-0">{description}</p>
{/if}
{#if !canAfford && userRole === 'kid'}
<p class="text-sm text-surface-500 italic m-0">Need {shortfall} more coins</p>
{/if}
</div>

<div class="shrink-0">
{#if userRole === 'kid'}
<form
method="POST"
action="?/redeem"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
await update();
submitting = false;
};
}}
>
<input type="hidden" name="prizeId" value={id} />
{#if activeKidId}
<input type="hidden" name="kidId" value={activeKidId} />
{/if}
<button
type="submit"
class="btn whitespace-nowrap {canAfford ? 'preset-filled-primary-500' : 'preset-tonal'}"
disabled={!canAfford || submitting}
aria-label="Redeem {title} for {coinCost} coins"
>
{canAfford ? 'Redeem' : 'Need more coins'}
</button>
</form>
{/if}
</div>
</div>