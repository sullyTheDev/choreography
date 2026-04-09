<script lang="ts">
import { enhance } from '$app/forms';

let { data, form } = $props<{
data: {
family: {
id: string;
name: string;
familyCode: string;
leaderboardResetDay: number;
};
};
form?: { success?: boolean; error?: string } | null;
}>();

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let submitting = $state(false);
</script>

<section class="space-y-4">
<h2 class="text-2xl font-bold">Family Settings</h2>

{#if form?.success}
<p class="text-sm text-success-600-400" role="status">Settings saved successfully.</p>
{/if}
{#if form?.error}
<p class="text-sm text-error-600-400" role="alert">{form.error}</p>
{/if}

<!-- Update family -->
<div class="card preset-outlined-surface-200-800 p-4 space-y-3">
<h3 class="text-lg font-semibold">Family Details</h3>
<form
method="POST"
action="?/updateFamily"
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
<span>Family Name</span>
<input
id="familyName"
name="familyName"
type="text"
class="input"
value={data.family.name}
required
/>
</label>
<label class="label">
<span>Leaderboard Reset Day</span>
<select id="leaderboardResetDay" name="leaderboardResetDay" class="select">
{#each DAY_NAMES as day, i (i)}
<option value={i + 1} selected={i + 1 === data.family.leaderboardResetDay}>
{day}
</option>
{/each}
</select>
</label>
<button type="submit" class="btn preset-filled" disabled={submitting}>Save Changes</button>
</form>
</div>

<!-- Family code info -->
<div class="card preset-outlined-surface-200-800 p-4 space-y-2">
<h3 class="text-lg font-semibold">Family Code</h3>
<p class="text-sm text-surface-600-400">
Kids use this code to log in: <strong class="font-mono text-lg tracking-widest">{data.family.familyCode}</strong>
</p>
</div>

<!-- Export data -->
<div class="card preset-outlined-surface-200-800 p-4 space-y-2">
<h3 class="text-lg font-semibold">Export Data</h3>
<p class="text-sm text-surface-600-400">Download a full JSON export of all family data.</p>
<form method="POST" action="?/exportData">
<button type="submit" class="btn hover:preset-tonal">Export Data</button>
</form>
</div>

<!-- Delete family -->
<div class="card preset-tonal-error p-4 space-y-3">
<h3 class="text-lg font-semibold">Danger Zone</h3>
<p class="text-sm">Permanently delete this family and all associated data. This action cannot be undone.</p>
<form
method="POST"
action="?/deleteFamily"
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
<span>Type <strong>DELETE</strong> to confirm</span>
<input id="confirm" name="confirm" type="text" class="input" placeholder="DELETE" required />
</label>
<button type="submit" class="btn preset-filled-error-500" disabled={submitting}>Delete Family</button>
</form>
</div>
</section>