<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props<{
		data: { webhookUrl: string };
		form?: {
			saved?: boolean;
			testSuccess?: boolean;
			error?: string;
			testError?: string;
		} | null;
	}>();

	let saving = $state(false);
	let testing = $state(false);
	let sampleOpen = $state(false);
	let webhookInput = $state('');
	let webhookDirty = $state(false);

	$effect(() => {
		// Prepopulate from server data until the user starts editing.
		if (!webhookDirty) {
			webhookInput = data.webhookUrl;
		}
	});

	const samplePayload = JSON.stringify(
		{
			event: 'chore_completed',
			timestamp: '2026-04-18T12:00:00.000Z',
			family: { id: '01HXYZ123FAMILY', name: 'The Smith Family' },
			actor: { id: '01HXYZ456MEMBER', name: 'Alex' },
			subject: null,
			chore: { id: '01HXYZ789CHORE', title: 'Wash the dishes', coinValue: 10 },
			prize: null,
			coinsAwarded: 10,
			coinsSpent: null,
			redemptionId: null
		},
		null,
		2
	);
</script>

<section class="space-y-6">
	<h2 class="text-2xl font-bold">Notifications</h2>

	<!-- Webhook Configuration -->
	<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-4">
		<div>
			<h3 class="text-lg font-semibold">Webhook</h3>
			<p class="text-sm text-surface-600-400 mt-1">
				Configure a URL to receive an HTTP POST request whenever a key event happens in your family
				— chore completions, prize purchases, prize redemptions, prize approvals, and prize dismissals.
			</p>
		</div>

		{#if form?.saved}
			<p class="text-sm text-success-600-400" role="status">Webhook URL saved.</p>
		{/if}
		{#if form?.error}
			<p class="text-sm text-error-600-400" role="alert">{form.error}</p>
		{/if}

		<form
			method="POST"
			action="?/saveWebhook"
			class="space-y-3"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
		>
			<label class="label">
				<span class="label-text text-sm font-medium">Webhook URL</span>
				<input
					type="url"
					name="webhookUrl"
					bind:value={webhookInput}
					oninput={() => {
						webhookDirty = true;
					}}
					placeholder="https://example.com/webhook"
					class="input"
					autocomplete="off"
				/>
			</label>
			<div class="flex gap-2">
				<button type="submit" class="btn preset-filled-primary-500" disabled={saving || !webhookInput.trim()}>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		</form>

		<hr class="border-surface-200-800" />

		<div class="space-y-2">
			<h4 class="text-sm font-semibold">Test Webhook</h4>
			<p class="text-sm text-surface-600-400">
				Send a test payload to your configured URL to verify it's working.
			</p>

			{#if !webhookInput.trim()}
				<p class="text-xs text-surface-500-400">Enter and save a webhook URL to enable testing.</p>
			{/if}

			{#if form?.testSuccess}
				<p class="text-sm text-success-600-400" role="status">
					Test webhook delivered successfully.
				</p>
			{/if}
			{#if form?.testError}
				<p class="text-sm text-error-600-400" role="alert">{form.testError}</p>
			{/if}

			<form
				method="POST"
				action="?/testWebhook"
				use:enhance={() => {
					testing = true;
					return async ({ update }) => {
						await update();
						testing = false;
					};
				}}
			>
				<button type="submit" class="btn preset-outlined-primary-500" disabled={testing || !webhookInput.trim()}>
					{testing ? 'Sending…' : 'Send Test Webhook'}
				</button>
			</form>
		</div>
	</div>

	<!-- Sample Payload -->
	<div class="card border preset-outlined-surface-200-800 shadow-sm overflow-hidden">
		<button
			type="button"
			class="w-full flex items-center justify-between p-4 text-left hover:preset-tonal-surface transition-colors"
			onclick={() => { sampleOpen = !sampleOpen; }}
			aria-expanded={sampleOpen}
		>
			<span class="font-semibold">Sample Payload</span>
			<svg
				class="w-4 h-4 transition-transform {sampleOpen ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if sampleOpen}
			<div class="border-t border-surface-200-800 p-4 space-y-2">
				<p class="text-sm text-surface-600-400">
					Every webhook POST includes a JSON body like the one below. The
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">event</code>
					field will be one of
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">chore_completed</code>,
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">prize_purchased</code>,
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">prize_redeemed</code>, or
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">prize_fulfilled</code>, or
					<code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">prize_dismissed</code>.
					Fields not relevant to the event will be <code class="font-mono text-xs bg-surface-100-900 px-1 py-0.5 rounded">null</code>.
				</p>
				<pre
					class="pre min-h-64 text-sm leading-relaxed"
				><code>{samplePayload}</code></pre>
			</div>
		{/if}
	</div>
</section>
