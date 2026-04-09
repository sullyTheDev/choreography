<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign Up — Chore·ography</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card card">
		<h1 class="auth-title">🏠 Create your family</h1>
		<p class="auth-subtitle">Set up your family account to start managing chores.</p>

		{#if form?.error}
			<p class="error-msg" role="alert">{form.error}</p>
		{/if}

		<form method="POST" use:enhance>
			<div class="fields">
				<div class="field">
					<label for="familyName">Family name</label>
					<input
						id="familyName"
						name="familyName"
						type="text"
						placeholder="The Smiths"
						required
						autocomplete="off"
					/>
				</div>

				<div class="field">
					<label for="displayName">Your name</label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						placeholder="Mom or Dad"
						required
						autocomplete="name"
					/>
				</div>

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
					<label for="password">Password <span class="hint">(8+ characters)</span></label>
					<input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="new-password"
						minlength="8"
					/>
				</div>
			</div>

			<button type="submit" class="btn btn-primary btn-full">Create account →</button>
		</form>

		<p class="auth-footer">Already have an account? <a href="/login">Sign in</a></p>
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
		margin-bottom: var(--space-2);
	}

	.auth-subtitle {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-6);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	.hint {
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.btn-full { width: 100%; }

	.auth-footer {
		text-align: center;
		margin-top: var(--space-5);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
