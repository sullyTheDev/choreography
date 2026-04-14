<script lang="ts">
import { enhance } from '$app/forms';
import Icon from '@iconify/svelte';
import { resolveIconifyName } from '$lib/icons';

interface Props {
id: string;
emoji: string;
title: string;
description: string;
coinCost: number;
canAfford: boolean;
shortfall: number;
activeMemberId: string | null;
memberRole: 'admin' | 'member';
}

let { id, emoji, title, description, coinCost, canAfford, shortfall, activeMemberId, memberRole }: Props =
$props();

let submitting = $state(false);
</script>

<div class="card bg-white border border-surface-200 shadow-md p-4 flex justify-between items-center gap-4 {!canAfford ? 'opacity-70' : ''}">
<span class="text-3xl shrink-0"><Icon icon={resolveIconifyName(emoji, 'noto:wrapped-gift')} class="h-8 w-8" /></span>
<div class="flex-1 flex flex-col gap-1 min-w-0">
<div class="flex items-center gap-2 flex-wrap">
<strong class="text-base font-semibold">{title}</strong>
<span class="badge preset-tonal-warning text-xs"><Icon icon="noto:coin" class="h-4 w-4" /> {coinCost}</span>
</div>
{#if description}
<p class="text-sm text-surface-600-400 m-0">{description}</p>
{/if}
{#if !canAfford}
<p class="text-sm text-surface-500 italic m-0">Need {shortfall} more coins</p>
{/if}
</div>

<div class="shrink-0">
{#if memberRole === 'member' || memberRole === 'admin'}
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
{#if activeMemberId}
<input type="hidden" name="memberId" value={activeMemberId} />
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