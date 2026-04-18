<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import { enhance } from '$app/forms';
import Icon from '@iconify/svelte';
import { CHORE_ICON_OPTIONS, resolveIconifyName } from '$lib/icons';
import CoinBadge from '$lib/components/CoinBadge.svelte';
import FrequencyBadge from '$lib/components/FrequencyBadge.svelte';

let { data, form }: { data: PageData; form: ActionData } = $props();

let showCreate = $state(false);
let editingChoreId = $state<string | null>(null);
let submitting = $state(false);
let createMemberError = $state('');
let editMemberError = $state('');

function startEdit(choreId: string) {
editingChoreId = choreId;
showCreate = false;
}

function cancelEdit() {
editingChoreId = null;
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Manage Chores</h1>
<button
class="btn preset-filled-primary-500"
onclick={() => { showCreate = !showCreate; editingChoreId = null; }}
>
{showCreate ? 'Cancel' : '+ Add Chore'}
</button>
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm">{form.error}</div>
{/if}

{#if showCreate}
<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
<h2 class="text-lg font-semibold">Add New Chore</h2>
<form
method="POST"
action="?/create"
class="space-y-3"
use:enhance={({ formElement, cancel }) => {
const checked = formElement.querySelectorAll('input[name="memberIds"]:checked');
if (checked.length === 0) {
createMemberError = 'Please assign this chore to at least one member';
cancel();
return;
}
createMemberError = '';
submitting = true;
return async ({ result, update }) => {
await update();
submitting = false;
if (result.type !== 'failure') showCreate = false;
};
}}
>
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-32">
<span>Title</span>
<input id="title" name="title" type="text" class="input" placeholder="e.g. Make your bed" required />
</label>
<label class="label">
<span>Emoji</span>
<select id="create-emoji" name="emoji" class="select" required>
{#each CHORE_ICON_OPTIONS as option}
<option value={option.icon}>{option.label}</option>
{/each}
</select>
</label>
</div>
<label class="label">
<span>Description</span>
<input id="description" name="description" type="text" class="input" placeholder="Optional description" />
</label>
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-28">
<span>Frequency</span>
<select id="frequency" name="frequency" class="select" required>
<option value="daily">Daily</option>
<option value="weekly">Weekly</option>
</select>
</label>
<label class="label flex-1 min-w-28">
<span>Coin Value</span>
<input id="coinValue" name="coinValue" type="number" class="input" min="1" placeholder="e.g. 10" required />
</label>
</div>
<fieldset class="space-y-1">
<legend class="text-sm font-medium">Assigned to</legend>
{#if createMemberError}<p class="text-sm text-error-500">{createMemberError}</p>{/if}
<div class="flex flex-wrap gap-3 pt-1">
{#each data.members as m}
<label class="flex items-center gap-1.5 cursor-pointer">
<input type="checkbox" name="memberIds" value={m.id} checked class="checkbox" />
<span class="text-sm">{m.avatarEmoji} {m.displayName}</span>
</label>
{/each}
</div>
</fieldset>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled-primary-500" disabled={submitting}>Create Chore</button>
<button type="button" class="btn hover:preset-tonal" onclick={() => (showCreate = false)}>Cancel</button>
</div>
</form>
</div>
{/if}

<div class="flex flex-col gap-3">
{#each data.chores as chore (chore.id)}
<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
<div class="flex justify-between items-center gap-4">
<div class="shrink-0 flex flex-col items-center gap-1">
<span class="text-4xl"><Icon icon={resolveIconifyName(chore.emoji)} class="h-12 w-12" /></span>
<CoinBadge value={chore.coinValue} />
</div>
<div class="flex-1 flex flex-col gap-1 min-w-0">
<strong class="text-xl font-semibold">{chore.title}</strong>
<div class="flex items-center gap-2 flex-wrap">
<FrequencyBadge value={chore.frequency} />
{#if chore.assignedMemberIds.length > 0}
<span class="text-sm text-secondary-600-400">{chore.assignedMemberIds.length} assigned</span>
{:else}
<span class="text-sm text-surface-500">Unassigned</span>
{/if}
</div>
{#if chore.description}
<p class="text-sm text-surface-600-400 m-0">{chore.description}</p>
{/if}
</div>
<div class="flex items-center gap-2 shrink-0">
<button class="btn preset-tonal-primary" aria-label="Edit {chore.title}" onclick={() => startEdit(chore.id)}><Icon icon="material-symbols:edit" class="h-5 w-5" /></button>
<form method="POST" action="?/delete" use:enhance>
<input type="hidden" name="choreId" value={chore.id} />
<button
type="submit"
class="btn preset-tonal-error"
aria-label="Delete {chore.title}"
onclick={(e) => { if (!confirm(`Delete "${chore.title}"?`)) e.preventDefault(); }}
><Icon icon="material-symbols:delete" class="h-5 w-5" /></button>
</form>
</div>
</div>

{#if editingChoreId === chore.id}
<div class="border-t border-surface-200 pt-3 space-y-3">
<form
method="POST"
action="?/update"
class="space-y-3"
use:enhance={({ formElement, cancel }) => {
const checked = formElement.querySelectorAll('input[name="memberIds"]:checked');
if (checked.length === 0) {
editMemberError = 'Please assign this chore to at least one member';
cancel();
return;
}
editMemberError = '';
submitting = true;
return async ({ result, update }) => {
await update();
submitting = false;
if (result.type !== 'failure') cancelEdit();
};
}}
>
<input type="hidden" name="choreId" value={chore.id} />
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-32">
<span>Title</span>
<input id="edit-title-{chore.id}" name="title" type="text" class="input" value={chore.title} required />
</label>
<label class="label">
<span>Emoji</span>
<select id="edit-emoji-{chore.id}" name="emoji" class="select" required>
{#each CHORE_ICON_OPTIONS as option}
<option value={option.icon} selected={option.icon === resolveIconifyName(chore.emoji)}>{option.label}</option>
{/each}
</select>
</label>
</div>
<label class="label">
<span>Description</span>
<input id="edit-desc-{chore.id}" name="description" type="text" class="input" value={chore.description} />
</label>
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-28">
<span>Frequency</span>
<select id="edit-freq-{chore.id}" name="frequency" class="select" required>
<option value="daily" selected={chore.frequency === 'daily'}>Daily</option>
<option value="weekly" selected={chore.frequency === 'weekly'}>Weekly</option>
</select>
</label>
<label class="label flex-1 min-w-28">
<span>Coin Value</span>
<input id="edit-coins-{chore.id}" name="coinValue" type="number" class="input" min="1" value={chore.coinValue} required />
</label>
</div>
<fieldset class="space-y-1">
<legend class="text-sm font-medium">Assigned to</legend>
{#if editMemberError}<p class="text-sm text-error-500">{editMemberError}</p>{/if}
<div class="flex flex-wrap gap-3 pt-1">
{#each data.members as m}
<label class="flex items-center gap-1.5 cursor-pointer">
<input type="checkbox" name="memberIds" value={m.id} checked={chore.assignedMemberIds.includes(m.id)} class="checkbox" />
<span class="text-sm">{m.avatarEmoji} {m.displayName}</span>
</label>
{/each}
</div>
</fieldset>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled-primary-500" disabled={submitting}>Save Changes</button>
<button type="button" class="btn hover:preset-tonal" onclick={cancelEdit}>Cancel</button>
</div>
</form>
</div>
{/if}
</div>
{/each}

{#if data.chores.length === 0}
<p class="text-center text-surface-500 py-12">No chores yet. Add your first chore to get started!</p>
{/if}
</div>
</div>
