<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
	let role = $state<'parent' | 'kid'>('parent');
		const pinPattern = '[0-9]{4,6}';
</script>
<div class="auth-page">
	<div class="auth-card card">
		<h1 class="auth-title">👋 Welcome back</h1>

		<div class="role-switcher" role="group" aria-label="Login as">
			<button
				type="button"
				class="role-btn"
				class:active={role === 'parent'}
				onclick={() => (role = 'parent')}
			>
				👑 I'm a Parent
			</button>
			<button
				type="button"
				class="role-btn"
				class:active={role === 'kid'}
				onclick={() => (role = 'kid')}
			>
				🧒 I'm a Kid
			</button>
		</div>

		{#if form?.error}
			<p class="error-msg" role="alert">{form.error}</p>
		{/if}

		<form method="POST" action="?/login" use:enhance>
			<input type="hidden" name="role" value={role} />

			<div class="fields">
				{#if role === 'parent'}
					<div class="field">
						<label for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
							autocomplete="email"
						/>
					</div>

					<div class="field">
						<label for="password">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							autocomplete="current-password"
						/>
					</div>
				{:else}
					<div class="field">
						<label for="familyCode">Family code</label>
						<input
							id="familyCode"
							name="familyCode"
							type="text"
							placeholder="XXXXXXXX"
							required
							autocomplete="off"
							maxlength="8"
							style="text-transform: uppercase; letter-spacing: 0.15em"
						/>
						<span class="field-hint">Found in parent Settings page</span>
					</div>

					<div class="field">
						<label for="pin">Your PIN</label>
						<input
							id="pin"
							name="pin"
							type="password"
							placeholder="4–6 digit PIN"
							required
							autocomplete="current-password"
							inputmode="numeric"
							pattern={pinPattern}
							maxlength="6"
						/>
					</div>
				{/if}
			</div>

			<button type="submit" class="btn btn-primary btn-full">Sign in →</button>
		</form>

		{#if role === 'parent'}
			<p class="auth-footer">New here? <a href="/signup">Create a family account</a></p>
		{/if}
	</div>
</div>

<style>
	.auth-page {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6) var(--space-4);
		background: var(--color-bg);
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
	}

	.auth-title {
		font-size: var(--font-size-2xl);
		font-weight: 800;
		margin-bottom: var(--space-5);
	}

	.role-switcher {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	.role-btn {
		flex: 1;
		padding: var(--space-3);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		transition: all 0.15s;
	}

	.role-btn.active {
		background: var(--color-primary-light);
		border-color: var(--color-primary);
		color: var(--color-primary-dark);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	.field-hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}

	.btn-full { width: 100%; }

	.auth-footer {
		text-align: center;
		margin-top: var(--space-5);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
