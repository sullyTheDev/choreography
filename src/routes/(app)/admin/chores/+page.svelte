<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import { enhance } from '$app/forms';

let { data, form }: { data: PageData; form: ActionData } = $props();

const EMOJI_OPTIONS = ['🛏️', '🍽️', '🐕', '🧹', '📚', '🌿', '🚿', '🧺', '🗑️', '🪟', '🧴', '🍎'];

let showCreate = $state(false);
let editingChoreId = $state<string | null>(null);
let submitting = $state(false);

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
class="btn preset-filled"
onclick={() => { showCreate = !showCreate; editingChoreId = null; }}
>
{showCreate ? 'Cancel' : '+ Add Chore'}
</button>
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm">{form.error}</div>
{/if}

{#if showCreate}
<div class="card preset-outlined-surface-200-800 p-4 space-y-3">
<h2 class="text-lg font-semibold">Add New Chore</h2>
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
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-32">
<span>Title</span>
<input id="title" name="title" type="text" class="input" placeholder="e.g. Make your bed" required />
</label>
<label class="label">
<span>Emoji</span>
<select id="create-emoji" name="emoji" class="select" required>
{#each EMOJI_OPTIONS as e}
<option value={e}>{e}</option>
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
<label class="label flex-1 min-w-28">
<span>Assign to Kid</span>
<select id="assignedKidId" name="assignedKidId" class="select">
<option value="">All Kids</option>
{#each data.kids as kid}
<option value={kid.id}>{kid.displayName}</option>
{/each}
</select>
</label>
</div>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled" disabled={submitting}>Create Chore</button>
<button type="button" class="btn hover:preset-tonal" onclick={() => (showCreate = false)}>Cancel</button>
</div>
</form>
</div>
{/if}

<div class="flex flex-col gap-3">
{#each data.chores as chore (chore.id)}
<div class="card preset-outlined-surface-200-800 p-4 space-y-3">
<div class="flex items-start gap-3">
<span class="text-3xl shrink-0">{chore.emoji}</span>
<div class="flex-1 flex flex-col gap-1 min-w-0">
<strong class="font-semibold">{chore.title}</strong>
<div class="flex items-center gap-2 flex-wrap">
<span class="badge preset-tonal-primary text-xs">{chore.frequency}</span>
<span class="text-sm text-surface-600-400">🪙 {chore.coinValue}</span>
{#if chore.assignedKid}
<span class="text-sm text-secondary-600-400">→ {chore.assignedKid.displayName}</span>
{:else}
<span class="text-sm text-surface-500">All kids</span>
{/if}
</div>
{#if chore.description}
<p class="text-sm text-surface-600-400 m-0">{chore.description}</p>
{/if}
</div>
<div class="flex gap-2 shrink-0">
<button class="btn btn-sm hover:preset-tonal" onclick={() => startEdit(chore.id)}>Edit</button>
<form method="POST" action="?/delete" use:enhance>
<input type="hidden" name="choreId" value={chore.id} />
<button
type="submit"
class="btn btn-sm preset-filled-error-500"
onclick={(e) => { if (!confirm(`Delete "${chore.title}"?`)) e.preventDefault(); }}
>
Delete
</button>
</form>
</div>
</div>

{#if editingChoreId === chore.id}
<div class="border-t border-surface-200-800 pt-3 space-y-3">
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
<input type="hidden" name="choreId" value={chore.id} />
<div class="flex gap-3 flex-wrap">
<label class="label flex-1 min-w-32">
<span>Title</span>
<input id="edit-title-{chore.id}" name="title" type="text" class="input" value={chore.title} required />
</label>
<label class="label">
<span>Emoji</span>
<select id="edit-emoji-{chore.id}" name="emoji" class="select" required>
{#each EMOJI_OPTIONS as e}
<option value={e} selected={e === chore.emoji}>{e}</option>
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
<label class="label flex-1 min-w-28">
<span>Assign to Kid</span>
<select id="edit-kid-{chore.id}" name="assignedKidId" class="select">
<option value="" selected={chore.assignedKid === null}>All Kids</option>
{#each data.kids as kid}
<option value={kid.id} selected={chore.assignedKid?.id === kid.id}>{kid.displayName}</option>
{/each}
</select>
</label>
</div>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled" disabled={submitting}>Save Changes</button>
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