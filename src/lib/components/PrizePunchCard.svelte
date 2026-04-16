<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';
	import { resolveIconifyName } from '$lib/icons';
	import { Tooltip } from '@skeletonlabs/skeleton-svelte';
	import confetti from 'canvas-confetti';

	interface Redemption {
		id: string;
		status: string;
		redeemedAt: string;
	}

	interface Props {
		prizeId: string;
		prizeTitle: string;
		prizeEmoji: string;
		redemptions: Redemption[];
		activeMemberId: string | null;
	}

	let { prizeId, prizeTitle, prizeEmoji, redemptions, activeMemberId }: Props = $props();

	// Bucket redemptions by status, preserving order (desc redeemedAt from server)
	const available = $derived(redemptions.filter((r) => r.status === 'available'));
	const pending   = $derived(redemptions.filter((r) => r.status === 'pending'));
	const fulfilled = $derived(redemptions.filter((r) => r.status === 'fulfilled'));

	// The oldest available redemption is what "Use Prize" acts on
	const firstAvailable = $derived(available.at(-1) ?? null);

	// Build punch slots for a single status bucket.
	// ≤ 3 → one slot per item; > 3 → one collapsed slot with a count
	function punchSlots(items: Redemption[]): { id: string; count: number }[] {
		if (items.length === 0) return [];
		if (items.length <= 3) return items.map((r) => ({ id: r.id, count: 1 }));
		return [{ id: items[0].id, count: items.length }];
	}

	const availableSlots  = $derived(punchSlots(available));
	const pendingSlots    = $derived(punchSlots(pending));
	const fulfilledSlots  = $derived(punchSlots(fulfilled));

	const hasAnySlots = $derived(
		availableSlots.length > 0 || pendingSlots.length > 0 || fulfilledSlots.length > 0
	);

	let submitting = $state(false);
	// Tracks which punch tooltip is open (by slot id). Supports tap-to-show on mobile.
	let openTooltip = $state<string | null>(null);

	function toggleTooltip(id: string) {
		openTooltip = openTooltip === id ? null : id;
	}

	function fireConfetti() {
		confetti({
			particleCount: 120,
			spread: 80,
			origin: { y: 0.6 },
			colors: ['#f97316', '#facc15', '#34d399', '#60a5fa', '#f472b6']
		});
	}
</script>

<div class="card border preset-outlined-primary-200-800 shadow-md p-4 h-full flex flex-col gap-4">
	<!-- Header row -->
	<div class="flex items-center gap-3 min-w-0">
		<div class="shrink-0">
			<span aria-hidden="true">
				<Icon icon={resolveIconifyName(prizeEmoji, 'noto:wrapped-gift')} class="h-12 w-12" />
			</span>
		</div>
		<strong class="text-xl font-semibold truncate">{prizeTitle}</strong>
	</div>

	<!-- Punch section -->
	<div class="flex-1 min-w-0 flex flex-col gap-3">

		<!-- Punch row -->
		{#if hasAnySlots}
			<div class="flex flex-wrap items-center gap-2" aria-label="Redemption status for {prizeTitle}">

				<!-- Available punches -->
				{#each availableSlots as slot (slot.id)}
                <Tooltip open={openTooltip === `a-${slot.id}`}>
                <Tooltip.Trigger>
					<div class="relative inline-flex punch-hover" role="button" tabindex="0" 
						onmouseenter={() => openTooltip = `a-${slot.id}`} onmouseleave={() => openTooltip = null}
						onclick={() => toggleTooltip(`a-${slot.id}`)} onkeydown={(e) => e.key === 'Enter' && toggleTooltip(`a-${slot.id}`)}
						 aria-label="Available{slot.count > 1 ? ` (x${slot.count})` : ''} — tap to show info">
						{#if slot.count > 1}
							<span class="badge-icon p-1 preset-filled-surface-600-400 absolute -right-1 -bottom-1 z-10 text-xs">
								x{slot.count}
							</span>
						{/if}
						<span
							class="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center"
							aria-hidden="true"
						>
							<Icon icon="noto:star" class="h-6 w-6 star-glow" aria-hidden="true" />
						</span>
					</div>
                    </Tooltip.Trigger>
                    {#if openTooltip === `a-${slot.id}`}
                    	<Tooltip.Positioner class="z-20!">
                    		<Tooltip.Content class="card p-2 preset-filled-surface-950-50">
                    			<span>{slot.count > 1 ? `${slot.count}` : ''} Available</span>
                    			<Tooltip.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]">
                    				<Tooltip.ArrowTip />
                    			</Tooltip.Arrow>
                    		</Tooltip.Content>
                    	</Tooltip.Positioner>
                    {/if}
                    </Tooltip>
				{/each}

				<!-- Pending punches -->
				{#each pendingSlots as slot (slot.id)}
					<Tooltip open={openTooltip === `p-${slot.id}`}>
						<Tooltip.Trigger>
							<div class="relative inline-flex punch-hover" role="button" tabindex="0" 
								onmouseenter={() => openTooltip = `p-${slot.id}`} onmouseleave={() => openTooltip = null}
								onclick={() => toggleTooltip(`p-${slot.id}`)} onkeydown={(e) => e.key === 'Enter' && toggleTooltip(`p-${slot.id}`)}
								 aria-label="Pending{slot.count > 1 ? ` (x${slot.count})` : ''} — tap to show info">
								{#if slot.count > 1}
									<span class="badge-icon p-1 preset-filled-surface-600-400 absolute -right-1 -bottom-1 z-10 text-xs">
										x{slot.count}
									</span>
								{/if}
								<span
									class="h-12 w-12 rounded-full bg-warning-500 flex items-center justify-center"
									aria-hidden="true"
								>
									<Icon icon="noto:hourglass-not-done" class="h-6 w-6 hourglass-rotate" aria-hidden="true" />
								</span>
							</div>
						</Tooltip.Trigger>
						{#if openTooltip === `p-${slot.id}`}
							<Tooltip.Positioner class="z-20!">
								<Tooltip.Content class="card p-2 preset-filled-surface-950-50">
									<span>{slot.count > 1 ? `${slot.count}` : ''} Pending</span>
									<Tooltip.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]">
										<Tooltip.ArrowTip />
									</Tooltip.Arrow>
								</Tooltip.Content>
							</Tooltip.Positioner>
						{/if}
					</Tooltip>
				{/each}

				<!-- Fulfilled punches -->
				{#each fulfilledSlots as slot (slot.id)}
					<Tooltip open={openTooltip === `f-${slot.id}`}>
						<Tooltip.Trigger>
							<div class="relative inline-flex" role="button" tabindex="0" 
								onmouseenter={() => openTooltip = `f-${slot.id}`} onmouseleave={() => openTooltip = null}
								onclick={() => toggleTooltip(`f-${slot.id}`)} onkeydown={(e) => e.key === 'Enter' && toggleTooltip(`f-${slot.id}`)}
								 aria-label="Fulfilled{slot.count > 1 ? ` (x${slot.count})` : ''} — tap to show info">
								{#if slot.count > 1}
									<span class="badge-icon p-1 preset-filled-surface-600-400 absolute -right-1 -bottom-1 z-10 text-xs">
										x{slot.count}
									</span>
								{/if}
								<span
									class="h-12 w-12 rounded-full bg-surface-300-700 flex items-center justify-center"
									aria-hidden="true"
								>
									<Icon icon="material-symbols:check-rounded" class="h-6 w-6" aria-hidden="true" />
								</span>
							</div>
						</Tooltip.Trigger>
						{#if openTooltip === `f-${slot.id}`}
							<Tooltip.Positioner class="z-20!">
								<Tooltip.Content class="card p-2 preset-filled-surface-950-50">
									<span>{slot.count > 1 ? `${slot.count}` : ''} Fulfilled</span>
									<Tooltip.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]">
										<Tooltip.ArrowTip />
									</Tooltip.Arrow>
								</Tooltip.Content>
							</Tooltip.Positioner>
						{/if}
					</Tooltip>
				{/each}

			</div>
		{/if}

	</div>

	<!-- Bottom action -->
	<div class="mt-auto">
		{#if firstAvailable}
			<form
				method="POST"
				action="?/use"
				use:enhance={() => {
					submitting = true;
					return async ({ update, result }) => {
						await update();
						submitting = false;
						if (result.type === 'success' || result.type === 'redirect') {
							fireConfetti();
						}
					};
				}}
			>
				<input type="hidden" name="redemptionId" value={firstAvailable.id} />
				{#if activeMemberId}
					<input type="hidden" name="memberId" value={activeMemberId} />
				{/if}
				<button
					type="submit"
					disabled={submitting}
					class="btn preset-filled-primary-500 w-full"
					aria-label="Redeem one {prizeTitle}"
				>
					<Icon icon="material-symbols:redeem" class="h-4 w-4" aria-hidden="true" />
					Redeem Prize
				</button>
			</form>
		{:else if hasAnySlots}
			<button
				type="button"
				disabled
				class="btn preset-tonal-error w-full"
				aria-label="No available {prizeTitle} redemptions"
			>
				<Icon icon="material-symbols:lock" class="h-4 w-4" aria-hidden="true" />
				No prizes available
			</button>
		{/if}
	</div>
</div>

<style>
	:global(.star-glow) {
		filter: drop-shadow(0 0 4px rgb(255 255 255 / 0.45)) drop-shadow(0 0 8px rgb(255 242 153 / 0.35));
	}

	:global(.punch-hover:hover .star-glow) {
		animation: star-glow 1.8s ease-in-out infinite;
	}

	:global(.hourglass-rotate) {
		transform-origin: center;
	}

	:global(.punch-hover:hover .hourglass-rotate) {
		animation: hourglass-rotate 2.2s linear infinite;
	}

	@keyframes star-glow {
		0%,
		100% {
			filter: drop-shadow(0 0 4px rgb(255 255 255 / 0.45)) drop-shadow(0 0 8px rgb(255 242 153 / 0.35));
		}
		50% {
			filter: drop-shadow(0 0 8px rgb(255 255 255 / 0.8)) drop-shadow(0 0 14px rgb(255 235 120 / 0.65));
		}
	}

	@keyframes hourglass-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.star-glow),
		:global(.hourglass-rotate) {
			animation: none;
		}
	}
</style>
