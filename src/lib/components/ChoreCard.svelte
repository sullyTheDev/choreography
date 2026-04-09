<script lang="ts">
import { enhance } from '$app/forms';

interface Props {
id: string;
emoji: string;
title: string;
description: string;
frequency: 'daily' | 'weekly';
coinValue: number;
assignedKidName: string | null;
isCompleted: boolean;
activeKidId: string | null;
}

let {
id,
emoji,
title,
description,
frequency,
coinValue,
assignedKidName,
isCompleted,
activeKidId
}: Props = $props();

let submitting = $state(false);
</script>

<div class="card bg-white border-1 border-surface-200 shadow-md p-4 {isCompleted ? 'opacity-70' : ''}">
<div class="flex items-center gap-3">
<span class="text-4xl shrink-0" aria-hidden="true">{emoji}</span>

<div class="flex-1 flex flex-col gap-1 min-w-0">
<div class="flex items-center flex-wrap gap-2">
<strong class="text-base font-semibold">{title}</strong>
<div class="flex gap-1 flex-wrap">
<span class="badge preset-tonal-primary text-xs">{frequency}</span>
<span class="badge preset-tonal-warning text-xs">🪙 {coinValue}</span>
{#if assignedKidName}
<span class="badge preset-tonal-secondary text-xs">→ {assignedKidName}</span>
{/if}
</div>
</div>
{#if description}
<p class="text-sm text-surface-600-400 m-0">{description}</p>
{/if}
</div>

<div class="shrink-0">
{#if isCompleted}
<div
class="w-10 h-10 rounded-full bg-success-500 text-white flex items-center justify-center text-lg"
aria-label="Completed"
>
✓
</div>
{:else}
<form
method="POST"
action="?/complete"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
await update();
submitting = false;
};
}}
>
<input type="hidden" name="choreId" value={id} />
{#if activeKidId}
<input type="hidden" name="kidId" value={activeKidId} />
{/if}
<button
type="submit"
class="btn btn-sm preset-outlined-primary-500 w-10 h-10 rounded-full p-0"
aria-label="Mark {title} as complete"
disabled={submitting}
>
○
</button>
</form>
{/if}
</div>
</div>
</div>