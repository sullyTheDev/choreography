<script lang="ts">
import { enhance } from '$app/forms';
import type { ActionData } from './$types.js';

let { form }: { form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Sign Up — Chore·ography</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-50-950">
<div class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl">
<h1 class="text-2xl font-extrabold">🏠 Create your family</h1>
<p class="text-sm text-surface-600-400">Set up your family account to start managing chores.</p>

{#if form?.error}
<p class="text-sm text-error-600-400" role="alert">{form.error}</p>
{/if}

<form
method="POST"
class="space-y-4"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
await update();
submitting = false;
};
}}
>
<label class="label">
<span>Family name</span>
<input
class="input"
id="familyName"
name="familyName"
type="text"
placeholder="The Smiths"
required
autocomplete="off"
/>
</label>

<label class="label">
<span>Your name</span>
<input
class="input"
id="displayName"
name="displayName"
type="text"
placeholder="Mom or Dad"
required
autocomplete="name"
/>
</label>

<label class="label">
<span>Email</span>
<input
class="input"
id="email"
name="email"
type="email"
placeholder="you@example.com"
required
autocomplete="email"
/>
</label>

<label class="label">
<span>Password <span class="text-xs text-surface-500 font-normal">(8+ characters)</span></span>
<input
class="input"
id="password"
name="password"
type="password"
required
autocomplete="new-password"
minlength="8"
/>
</label>

<button type="submit" class="btn preset-filled w-full" disabled={submitting}>
{submitting ? 'Creating…' : 'Create account →'}
</button>
</form>

<p class="text-center text-sm text-surface-600-400">
Already have an account? <a href="/login" class="anchor">Sign in</a>
</p>
</div>
</div>