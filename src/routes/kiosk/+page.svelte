<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import KioskPinpad, { type UnlockTarget } from '$lib/components/KioskPinpad.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let unlockTarget = $state<UnlockTarget | null>(null);

	function handleSuccess(memberId: string | null) {
		unlockTarget = null;
		if (memberId) goto(`/kiosk/chores?member=${memberId}`);
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] gap-10 text-center">
	<div class="space-y-2">
		<p class="text-3xl font-extrabold">Who's doing chores today?</p>
		<p class="text-surface-500 flex items-center justify-center gap-1.5">
			<Icon icon="noto:backhand-index-pointing-down" class="h-5 w-5" />
			Tap your avatar to start!
		</p>
	</div>

	{#if data.members.length > 0}
		<nav class="flex flex-wrap gap-8 justify-center" aria-label="Select member">
			{#each data.members as member (member.id)}
				<button
					type="button"
					class="flex flex-col items-center gap-3 group"
					onclick={() => { unlockTarget = { kind: 'member', id: member.id, displayName: member.displayName, avatarEmoji: member.avatarEmoji }; }}
				>
					<span class="picker-avatar" aria-hidden="true">{member.avatarEmoji}</span>
					<span class="text-lg font-semibold">{member.displayName}</span>
				</button>
			{/each}
		</nav>
	{:else}
		<p class="text-surface-500">No members yet — add some in Family Members!</p>
	{/if}
</div>

<KioskPinpad
	target={unlockTarget}
	onSuccess={handleSuccess}
	onClose={() => { unlockTarget = null; }}
/>

<style>
.picker-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96px;
	height: 96px;
	font-size: 3.5rem;
	border-radius: 50%;
	background: var(--color-surface-100-900, #f1f5f9);
	border: 4px solid transparent;
	box-shadow: 0 4px 16px 0 rgba(0,0,0,0.06);
	transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.group:hover .picker-avatar {
	border-color: var(--color-primary-500, #3b82f6);
	box-shadow: 0 0 0 4px var(--color-primary-200, #bfdbfe), 0 4px 16px 0 rgba(0,0,0,0.10);
	transform: scale(1.05);
}
</style>
