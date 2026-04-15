<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import KioskPinpad, { type UnlockTarget } from '$lib/components/KioskPinpad.svelte';
	import NavTabs from '$lib/components/NavTabs.svelte';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let unlockTarget = $state<UnlockTarget | null>(null);

	const INACTIVITY_MS = 0.5 * 60 * 1000; // 30 seconds

	let isIndexPage = $derived(
		page.url.pathname === '/kiosk' || page.url.pathname === '/kiosk/'
	);

	function handleUnlockSuccess(memberId: string | null) {
		unlockTarget = null;
		if (memberId === null) {
			// exit kiosk
			goto('/member/chores');
		} else {
			// member selected â€” go to chores for that member
			const targetPath = isIndexPage ? '/kiosk/chores' : page.url.pathname;
			goto(`${targetPath}?member=${memberId}`);
		}
	}

	// â”€â”€ Inactivity timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	let idleTimer: ReturnType<typeof setTimeout> | null = null;

	function resetTimer() {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => goto('/kiosk'), INACTIVITY_MS);
	}

	const IDLE_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;

	$effect(() => {
		// Only run the timer when a member is active on a sub-page
		if (isIndexPage || !data.activeMemberId) {
			if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
			return;
		}

		resetTimer();
		for (const ev of IDLE_EVENTS) window.addEventListener(ev, resetTimer, { passive: true });
		return () => {
			if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
			for (const ev of IDLE_EVENTS) window.removeEventListener(ev, resetTimer);
		};
	});
</script>

<div class="min-h-dvh flex flex-col">
	<AppBar class="sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800 shadow-sm">
		<AppBar.Toolbar class="grid-cols-[1fr_1fr]">
			<AppBar.Lead>
				<div class="flex flex-col leading-tight min-w-0">
					<span class="text-2xl font-extrabold text-primary-500 whitespace-nowrap">Chore·ography</span>
					<span class="text-base text-surface-500 whitespace-nowrap hidden sm:block">{data.family.name}</span>
				</div>
			</AppBar.Lead>
			<AppBar.Trail class="justify-end gap-2">
				<button
					type="button"
					class="btn preset-tonal-error gap-2 text-sm"
					onclick={() => { unlockTarget = { kind: 'exit' }; }}
					title="Exit Kiosk Mode"
				>
					<Icon icon="material-symbols:lock" class="h-5 w-5" />
					<span class="hidden sm:inline">Exit Kiosk</span>
				</button>
			</AppBar.Trail>
		</AppBar.Toolbar>
	</AppBar>

	<main class="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
		{#if !isIndexPage}
			<!-- PIN-gated member switcher (buttons, not links) -->
			{#if data.members.length > 1}
				<div class="flex justify-center mb-6">
					{#if data.members.length <= 5}
						<nav class="flex flex-wrap gap-5" aria-label="Switch member">
							{#each data.members as member (member.id)}
								<button
									type="button"
									class="flex flex-col items-center gap-2 text-center"
								onclick={() => {
									if (member.id === data.activeMemberId) {
										goto('/kiosk');
									} else {
										unlockTarget = { kind: 'member', id: member.id, displayName: member.displayName, avatarEmoji: member.avatarEmoji };
									}
								}}
								title={member.id === data.activeMemberId ? `${member.displayName} — tap to finish` : member.displayName}
							>
								<span class="switcher-avatar {member.id === data.activeMemberId ? 'switcher-avatar-active' : ''}" aria-hidden="true">{member.avatarEmoji}</span>
								<span class="text-base font-semibold text-surface-700-300 flex items-center gap-1">
									{member.displayName}
									{#if member.id === data.activeMemberId}
										<Icon icon="material-symbols:logout-rounded" class="h-4 w-4" />
									{/if}
								</span>
								</button>
							{/each}
						</nav>
					{:else}
						<select
							class="select"
							onchange={(e) => {
								const id = (e.currentTarget as HTMLSelectElement).value;
								const m = data.members.find((m) => m.id === id);
								if (m) unlockTarget = { kind: 'member', id: m.id, displayName: m.displayName, avatarEmoji: m.avatarEmoji };
							}}
						>
							{#each data.members as member (member.id)}
								<option value={member.id} selected={member.id === data.activeMemberId}>
									{member.avatarEmoji} {member.displayName}
								</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}
			<NavTabs role={data.user.role} activeMemberId={data.activeMemberId} base="/kiosk" />
		{/if}
		{@render children()}
	</main>
</div>

<KioskPinpad
	target={unlockTarget}
	onSuccess={handleUnlockSuccess}
	onClose={() => { unlockTarget = null; }}
/>

<style>
.switcher-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72px;
	height: 72px;
	font-size: 2.5rem;
	border-radius: 50%;
	background: var(--color-surface-100-900, #f1f5f9);
	border: 4px solid transparent;
	box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
	transition: border-color 0.2s, box-shadow 0.2s;
}
.switcher-avatar-active {
	border-color: var(--color-primary-500, #3b82f6);
	box-shadow: 0 0 0 4px var(--color-primary-300, #93c5fd), 0 2px 8px 0 rgba(0,0,0,0.08);
}
</style>
