<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

	export type UnlockTarget =
		| { kind: 'exit' }
		| { kind: 'member'; id: string; displayName: string; avatarEmoji: string };

	interface Props {
		/** null = dialog closed */
		target: UnlockTarget | null;
		/** memberId for member unlock; null for exit-kiosk success */
		onSuccess: (memberId: string | null) => void;
		onClose: () => void;
	}

	let { target, onSuccess, onClose }: Props = $props();

	const MAX_PIN = 6;
	let pinEntry = $state('');
	let pinError = $state<string | null>(null);
	let noPinConfigured = $state(false);
	let checking = $state(false);

	$effect(() => {
		if (target) {
			pinEntry = '';
			pinError = null;
			noPinConfigured = false;
		}
	});

	function pinPress(digit: string) {
		if (pinEntry.length < MAX_PIN && !checking) {
			pinEntry += digit;
			pinError = null;
		}
	}

	function pinBackspace() {
		if (!checking) {
			pinEntry = pinEntry.slice(0, -1);
			pinError = null;
		}
	}

	async function submitPin() {
		if (!target || pinEntry.length < 4 || checking) return;
		checking = true;
		pinError = null;
		try {
			const body: Record<string, string> = { pin: pinEntry };
			if (target.kind === 'member') body.memberId = target.id;
			const res = await fetch('/api/kiosk-unlock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const json = await res.json();
			if (json.success) {
				onSuccess(target.kind === 'member' ? target.id : null);
			} else if (json.reason === 'no_pin') {
				noPinConfigured = true;
			} else {
				pinError = 'Incorrect PIN. Try again.';
				pinEntry = '';
			}
		} catch {
			pinError = 'Something went wrong. Please try again.';
		} finally {
			checking = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!target || noPinConfigured) return;
		if (e.key >= '0' && e.key <= '9') pinPress(e.key);
		else if (e.key === 'Backspace') pinBackspace();
		else if (e.key === 'Enter') submitPin();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<Dialog.Content class="card preset-filled-surface-100-900 w-full max-w-xs p-6 space-y-5 shadow-2xl">

				<!-- Header -->
				{#if target?.kind === 'exit'}
					<div class="flex flex-col items-center gap-1 text-center">
						<div class="bg-error-500/10 rounded-full p-3 mb-1">
							<Icon icon="material-symbols:lock" class="h-7 w-7 text-error-500" />
						</div>
						<Dialog.Title class="text-lg font-bold">Exit Kiosk Mode</Dialog.Title>
						<Dialog.Description class="text-sm text-surface-500">Enter your admin PIN to exit</Dialog.Description>
					</div>
				{:else if target?.kind === 'member'}
					<div class="flex flex-col items-center gap-1 text-center">
						<span class="text-5xl mb-1">{target.avatarEmoji}</span>
						<Dialog.Title class="text-lg font-bold">{target.displayName}</Dialog.Title>
						<Dialog.Description class="text-sm text-surface-500">Enter your PIN to continue</Dialog.Description>
					</div>
				{/if}

				{#if noPinConfigured}
					{#if target?.kind === 'exit'}
						<div class="card preset-tonal-warning p-3 text-sm text-center space-y-3">
							<p>No PIN is configured for your admin account.</p>
							<p class="text-xs text-surface-500">Set one in <strong>Family Members</strong> to secure kiosk exit.</p>
							<button class="btn preset-filled-warning-500 w-full" onclick={() => onSuccess(null)}>
								Exit anyway
							</button>
						</div>
						<button class="btn preset-tonal w-full" onclick={onClose}>Cancel</button>
					{:else}
						<div class="card preset-tonal-warning p-3 text-sm text-center space-y-2">
							<p>No PIN set for this account.</p>
							<p class="text-xs text-surface-500">Ask an admin to add a PIN in <strong>Family Members</strong>.</p>
						</div>
						<button class="btn preset-tonal w-full" onclick={onClose}>Go back</button>
					{/if}
				{:else}
					<!-- PIN dot display -->
					<div class="flex justify-center gap-3" aria-label="PIN entry" role="status">
						{#each { length: MAX_PIN } as _, i}
							<span class="h-3 w-3 rounded-full transition-colors {i < pinEntry.length ? 'bg-primary-500' : 'bg-surface-300-700'}"></span>
						{/each}
					</div>

					{#if pinError}
						<p class="text-sm text-error-500 text-center -mt-2" role="alert">{pinError}</p>
					{/if}

					<!-- Numpad -->
					<div class="grid grid-cols-3 gap-2">
						{#each ['1','2','3','4','5','6','7','8','9'] as digit}
							<button
								type="button"
								class="btn preset-tonal text-xl font-semibold py-3"
								onclick={() => pinPress(digit)}
								disabled={checking}
							>{digit}</button>
						{/each}
						<button
							type="button"
							class="btn preset-tonal py-3"
							onclick={pinBackspace}
							disabled={checking || pinEntry.length === 0}
							aria-label="Backspace"
						>
							<Icon icon="material-symbols:backspace-outline" class="h-5 w-5" />
						</button>
						<button
							type="button"
							class="btn preset-tonal text-xl font-semibold py-3"
							onclick={() => pinPress('0')}
							disabled={checking}
						>0</button>
						<button
							type="button"
							class="btn preset-filled-primary-500 py-3"
							onclick={submitPin}
							disabled={checking || pinEntry.length < 4}
							aria-label="Confirm PIN"
						>
							{#if checking}
								<Icon icon="noto:hourglass-not-done" class="h-5 w-5" />
							{:else}
								<Icon icon="material-symbols:check" class="h-5 w-5" />
							{/if}
						</button>
					</div>

					<button class="btn preset-tonal w-full" onclick={onClose} disabled={checking}>Cancel</button>
				{/if}

			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
