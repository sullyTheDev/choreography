
<script lang="ts">
import { enhance } from '$app/forms';
import Icon from '@iconify/svelte';
import CoinBadge from './CoinBadge.svelte';
import { resolveIconifyName } from '$lib/icons';
import confetti from 'canvas-confetti';

interface Props {
id: string;
emoji: string;
title: string;
description: string;
coinCost: number;
canAfford: boolean;
shortfall: number;
activeMemberId: string | null;
memberRole: 'admin' | 'member';
}

let { id, emoji, title, description, coinCost, canAfford, shortfall, activeMemberId, memberRole }: Props =
$props();


let submitting = $state(false);

function fireConfetti() {
	confetti({
		particleCount: 120,
		spread: 80,
		origin: { y: 0.6 },
		colors: ['#f97316', '#facc15', '#34d399', '#60a5fa', '#f472b6'],
	});
}
</script>

<div class="card border preset-outlined-primary-200-800 shadow-md p-4 h-full flex flex-col gap-4">
	<!-- Header row: emoji + coin badge + title/description -->
	<div class="flex items-start gap-4">
		<div class="shrink-0 flex flex-col items-center gap-1">
			<span aria-hidden="true"><Icon icon={resolveIconifyName(emoji, 'noto:wrapped-gift')} class="h-12 w-12" /></span>
			<CoinBadge value={coinCost} />
		</div>
		<div class="flex flex-col gap-1 min-w-0">
			<strong class="text-xl font-semibold">{title}</strong>
			{#if description}
				<p class="text-sm font-semibold text-surface-700-300 m-0">{description}</p>
			{/if}
		</div>
	</div>

	<!-- Bottom action -->
	<form
		class="mt-auto"
		method="POST"
		action="?/redeem"
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
		<input type="hidden" name="prizeId" value={id} />
		{#if activeMemberId}
			<input type="hidden" name="memberId" value={activeMemberId} />
		{/if}
		<button
			type="submit"
			class="btn w-full {canAfford ? 'preset-filled-success-500' : 'preset-tonal-error'} chore-wiggle-btn"
			disabled={!canAfford || submitting}
			aria-label="Purchase {title} for {coinCost} coins"
		>
			{#if canAfford}
				<Icon icon="noto:coin" class="h-4 w-4" /> Purchase
			{:else}
				<Icon icon="material-symbols:lock" class="h-4 w-4" /> Need {shortfall} more coins
			{/if}
		</button>
	</form>
</div>

<style>
.chore-wiggle-btn {
	transition: transform 0.15s;
}
.chore-wiggle-btn:hover:enabled {
	animation: wiggle 0.4s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes wiggle {
	0% { transform: rotate(0deg); }
	15% { transform: rotate(-7deg); }
	30% { transform: rotate(5deg); }
	45% { transform: rotate(-5deg); }
	60% { transform: rotate(3deg); }
	75% { transform: rotate(-2deg); }
	100% { transform: rotate(0deg); }
}
</style>