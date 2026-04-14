<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import { enhance } from '$app/forms';
import Icon from '@iconify/svelte';
import { PRIZE_ICON_OPTIONS, resolveIconifyName } from '$lib/icons';
import CoinBadge from '$lib/components/CoinBadge.svelte';

let { data, form }: { data: PageData; form: ActionData } = $props();

let showCreate = $state(false);
let editingPrizeId = $state<string | null>(null);
let submitting = $state(false);

function startEdit(prizeId: string) {
editingPrizeId = prizeId;
showCreate = false;
}
function cancelEdit() {
editingPrizeId = null;
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Manage Prizes</h1>
<button
class="btn preset-filled-primary-500"
onclick={() => { showCreate = !showCreate; editingPrizeId = null; }}
>
{showCreate ? 'Cancel' : '+ Add Prize'}
</button>
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm">{form.error}</div>
{/if}

{#if showCreate}
<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
<h2 class="text-lg font-semibold">Add New Prize</h2>
<form
method="POST"
action="?/create"
class="space-y-3"
use:enhance={({ formElement, formData, cancel }) => {
submitting = true;
return async ({ result, update }) => {
await update();
submitting = false;
if (result.type !== 'failure') showCreate = false;
};
}}
>
<label class="label">
<span>Title</span>
<input id="title" name="title" type="text" class="input" placeholder="e.g. Extra screen time" required />
</label>
<label class="label">
<span>Description</span>
<input id="description" name="description" type="text" class="input" placeholder="Optional details" />
</label>
<label class="label">
<span>Emoji</span>
<select id="create-emoji" name="emoji" class="select" required>
{#each PRIZE_ICON_OPTIONS as option}
<option value={option.icon} selected={option.icon === 'noto:wrapped-gift'}>{option.label}</option>
{/each}
</select>
</label>
<label class="label">
<span>Coin Cost</span>
<input id="coinCost" name="coinCost" type="number" class="input" min="1" placeholder="e.g. 50" required />
</label>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled-primary-500" disabled={submitting}>Create Prize</button>
<button type="button" class="btn hover:preset-tonal" onclick={() => (showCreate = false)}>Cancel</button>
</div>
</form>
</div>
{/if}

<div class="flex flex-col gap-3">
{#each data.prizes as prize (prize.id)}
<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
<div class="flex justify-between items-center gap-3">
<div class="shrink-0 flex flex-col items-center gap-1">
<span class="text-4xl"><Icon icon={resolveIconifyName(prize.emoji, 'noto:wrapped-gift')} class="h-10 w-10" /></span>
<CoinBadge value={prize.coinCost} />
</div>
<div class="flex flex-col gap-1 flex-1">
<strong class="text-xl font-semibold">{prize.title}</strong>
{#if prize.description}
<p class="text-sm text-surface-600-400 m-0">{prize.description}</p>
{/if}
</div>
<div class="flex items-center gap-2 shrink-0">
<button class="btn preset-tonal-primary" aria-label="Edit {prize.title}" onclick={() => startEdit(prize.id)}><Icon icon="material-symbols:edit" class="h-5 w-5" /></button>
<form method="POST" action="?/delete" use:enhance>
<input type="hidden" name="prizeId" value={prize.id} />
<button
type="submit"
class="btn preset-tonal-error"
aria-label="Delete {prize.title}"
onclick={(e) => { if (!confirm(`Delete "${prize.title}"?`)) e.preventDefault(); }}
><Icon icon="material-symbols:delete" class="h-5 w-5" /></button>
</form>
</div>
</div>

{#if editingPrizeId === prize.id}
<div class="border-t border-surface-200 pt-3 space-y-3">
<form
method="POST"
action="?/update"
class="space-y-3"
use:enhance={({ formElement, formData, cancel }) => {
submitting = true;
return async ({ result, update }) => {
await update();
submitting = false;
if (result.type !== 'failure') cancelEdit();
};
}}
>
<input type="hidden" name="prizeId" value={prize.id} />
<label class="label">
<span>Title</span>
<input id="edit-title-{prize.id}" name="title" type="text" class="input" value={prize.title} required />
</label>
<label class="label">
<span>Description</span>
<input id="edit-desc-{prize.id}" name="description" type="text" class="input" value={prize.description} />
</label>
<label class="label">
<span>Emoji</span>
<select id="edit-emoji-{prize.id}" name="emoji" class="select" required>
{#each PRIZE_ICON_OPTIONS as option}
<option value={option.icon} selected={option.icon === resolveIconifyName(prize.emoji, 'noto:wrapped-gift')}>{option.label}</option>
{/each}
</select>
</label>
<label class="label">
<span>Coin Cost</span>
<input id="edit-cost-{prize.id}" name="coinCost" type="number" class="input" min="1" value={prize.coinCost} required />
</label>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled-primary-500" disabled={submitting}>Save Changes</button>
<button type="button" class="btn hover:preset-tonal" onclick={cancelEdit}>Cancel</button>
</div>
</form>
</div>
{/if}
</div>
{/each}

{#if data.prizes.length === 0}
<p class="text-center text-surface-500 py-12">No prizes yet. Add prizes for kids to redeem with their coins!</p>
{/if}
</div>
</div>
