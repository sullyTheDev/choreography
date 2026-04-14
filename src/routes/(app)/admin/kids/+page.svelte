<script lang="ts">
import type { PageData, ActionData } from './$types.js';
import { enhance } from '$app/forms';

let { data, form }: { data: PageData; form: ActionData } = $props();

const AVATAR_OPTIONS = ['👦', '👧', '🧒', '👶', '🦸', '🧙', '🐱', '🐶', '🦊', '🐼'];

let showCreate = $state(false);
let editingKidId = $state<string | null>(null);
let submitting = $state(false);

function startEdit(kidId: string) {
editingKidId = kidId;
showCreate = false;
}

function cancelEdit() {
editingKidId = null;
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Manage Kids</h1>
<button
class="btn preset-filled"
onclick={() => { showCreate = !showCreate; editingKidId = null; }}
>
{showCreate ? 'Cancel' : '+ Add Kid'}
</button>
</div>

{#if form?.error}
<div class="card preset-tonal-error p-3 text-sm">{form.error}</div>
{/if}

{#if showCreate}
<div class="card preset-outlined-surface-200-800 p-4 space-y-3">
<h2 class="text-lg font-semibold">Add New Kid</h2>
<form
method="POST"
action="?/create"
class="space-y-3"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
await update();
submitting = false;
};
}}
>
<label class="label">
<span>Name</span>
<input id="displayName" name="displayName" type="text" class="input" placeholder="e.g. Emma" required />
</label>
<fieldset class="space-y-2">
<legend class="font-medium text-sm">Avatar</legend>
<div class="flex flex-wrap gap-2">
{#each AVATAR_OPTIONS as emoji}
<label class="cursor-pointer">
<input type="radio" name="avatarEmoji" value={emoji} class="sr-only peer" required />
<span class="block p-2 text-2xl rounded border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-50-950 hover:bg-surface-100-900 transition-colors">{emoji}</span>
</label>
{/each}
</div>
</fieldset>
<label class="label">
<span>PIN (4–6 digits)</span>
<input id="pin" name="pin" type="password" class="input" placeholder="e.g. 1234" minlength="4" maxlength="6" required />
</label>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled" disabled={submitting}>Create Kid</button>
<button type="button" class="btn hover:preset-tonal" onclick={() => (showCreate = false)}>Cancel</button>
</div>
</form>
</div>
{/if}

<div class="flex flex-col gap-3">
{#each data.kids as kid (kid.id)}
<div class="card preset-outlined-surface-200-800 p-4 space-y-3 {!kid.isActive ? 'opacity-60' : ''}">
<div class="flex items-center gap-3">
<span class="text-3xl">{kid.avatarEmoji}</span>
<div class="flex flex-col gap-1 flex-1">
<strong class="font-semibold">{kid.displayName}</strong>
<div class="flex items-center gap-2">
<span class="text-sm text-surface-600-400">🪙 {kid.coinBalance} coins</span>
{#if !kid.isActive}<span class="badge preset-tonal-warning text-xs">Inactive</span>{/if}
</div>
</div>
{#if kid.isActive}
<div class="flex gap-2 shrink-0">
<button class="btn btn-sm hover:preset-tonal" onclick={() => startEdit(kid.id)}>Edit</button>
<form method="POST" action="?/deactivate" use:enhance>
<input type="hidden" name="kidId" value={kid.id} />
<button
type="submit"
class="btn btn-sm preset-filled-error-500"
onclick={(e) => { if (!confirm(`Deactivate ${kid.displayName}?`)) e.preventDefault(); }}
>
Deactivate
</button>
</form>
</div>
{/if}
</div>

{#if editingKidId === kid.id}
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
<input type="hidden" name="kidId" value={kid.id} />
<label class="label">
<span>Name</span>
<input id="edit-name-{kid.id}" name="displayName" type="text" class="input" value={kid.displayName} required />
</label>
<fieldset class="space-y-2">
<legend class="font-medium text-sm">Avatar</legend>
<div class="flex flex-wrap gap-2">
{#each AVATAR_OPTIONS as emoji}
<label class="cursor-pointer">
<input type="radio" name="avatarEmoji" value={emoji} class="sr-only peer" checked={emoji === kid.avatarEmoji} />
<span class="block p-2 text-2xl rounded border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-50-950 hover:bg-surface-100-900 transition-colors">{emoji}</span>
</label>
{/each}
</div>
</fieldset>
<label class="label">
<span>New PIN (leave blank to keep current)</span>
<input id="edit-pin-{kid.id}" name="pin" type="password" class="input" placeholder="Optional new PIN" minlength="4" maxlength="6" />
</label>
<div class="flex gap-2">
<button type="submit" class="btn preset-filled" disabled={submitting}>Save Changes</button>
<button type="button" class="btn hover:preset-tonal" onclick={cancelEdit}>Cancel</button>
</div>
</form>
</div>
{/if}
</div>
{/each}

{#if data.kids.length === 0}
<p class="text-center text-surface-500 py-12">No kids yet. Add your first kid to get started!</p>
{/if}
</div>
</div>