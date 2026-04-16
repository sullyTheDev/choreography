<script lang="ts">
	import CoinBadge from '$lib/components/CoinBadge.svelte';
	import PrizeSubNav from '$lib/components/PrizeSubNav.svelte';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="space-y-4">
	<div class="mt-6 flex items-center justify-between gap-3">
		<PrizeSubNav base="/member/prizes" activeMemberId={data.activeMemberId} />
		<div class="flex flex-col items-end gap-0.5">
			<span class="text-xs font-semibold text-surface-500 uppercase tracking-widest">Balance</span>
			<CoinBadge value={data.coinBalance} />
		</div>
	</div>
	{@render children()}
</div>
