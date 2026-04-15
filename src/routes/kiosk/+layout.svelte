<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import MemberSwitcher from '$lib/components/MemberSwitcher.svelte';
	import NavTabs from '$lib/components/NavTabs.svelte';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
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
			<AppBar.Trail class="justify-end">
				<button
					type="button"
					class="btn preset-tonal-error gap-2 text-sm"
					onclick={() => goto('/member/chores')}
					title="Exit Kiosk Mode"
				>
					<Icon icon="material-symbols:close-fullscreen" class="h-5 w-5" />
					<span class="hidden sm:inline">Exit Kiosk</span>
				</button>
			</AppBar.Trail>
		</AppBar.Toolbar>
	</AppBar>

	<main class="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
		<div class="flex justify-center mb-6">
			<MemberSwitcher members={data.members} activeMemberId={data.activeMemberId} />
		</div>
		<NavTabs role={data.user.role} activeMemberId={data.activeMemberId} base="/kiosk" />
		{@render children()}
	</main>
</div>
