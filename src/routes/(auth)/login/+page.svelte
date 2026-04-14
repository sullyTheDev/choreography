<script lang="ts">
import { enhance } from '$app/forms';
import Icon from '@iconify/svelte';
import type { ActionData } from './$types.js';

let { form }: { form: ActionData } = $props();
let role = $state<'admin' | 'member'>('admin');
const pinPattern = '[0-9]{4,6}';
let submitting = $state(false);
</script>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-50-950">
<div class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl">
<h1 class="text-2xl font-extrabold flex items-center gap-2"><Icon icon="noto:waving-hand" class="h-7 w-7" /> Welcome back</h1>

<div class="flex gap-2" role="group" aria-label="Login as">
<button
type="button"
class="btn flex-1 {role === 'admin' ? 'preset-filled-primary-500' : 'hover:preset-tonal'}"
onclick={() => (role = 'admin')}
>
Admin
</button>
<button
type="button"
class="btn flex-1 {role === 'member' ? 'preset-filled-primary-500' : 'hover:preset-tonal'}"
onclick={() => (role = 'member')}
>
Member
</button>
</div>

{#if form?.error}
<p class="text-sm text-error-600-400" role="alert">{form.error}</p>
{/if}

<form
method="POST"
action="?/login"
class="space-y-4"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
await update();
submitting = false;
};
}}
>
<input type="hidden" name="role" value={role} />

{#if role === 'admin'}
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
<span>Password</span>
<input
class="input"
id="password"
name="password"
type="password"
required
autocomplete="current-password"
/>
</label>
{:else}
<label class="label">
<span>Your name</span>
<input
class="input"
id="displayName"
name="displayName"
type="text"
placeholder="Emma"
required
autocomplete="name"
/>
</label>

<label class="label">
<span>Your PIN</span>
<input
class="input"
id="pin"
name="pin"
type="password"
placeholder="4-6 digit PIN"
required
autocomplete="current-password"
inputmode="numeric"
pattern={pinPattern}
maxlength="6"
/>
</label>
{/if}

<button type="submit" class="btn preset-filled w-full" disabled={submitting}>
{submitting ? 'Signing in...' : 'Sign in'}
</button>
</form>

{#if role === 'admin'}
<p class="text-center text-sm text-surface-600-400">
New here? <a href="/signup" class="anchor">Create a family account</a>
</p>
{/if}
</div>
</div>