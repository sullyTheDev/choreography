<script lang="ts">
	import { page } from '$app/state';
	import { Navigation } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		role: 'parent' | 'kid';
		activeKidId: string | null;
	}

	let { role, activeKidId }: Props = $props();

	const kidQs = $derived(activeKidId ? `?kid=${activeKidId}` : '');

	const tabs = $derived([
		{ href: `/chores${kidQs}`, label: 'Chores', emoji: '✅' },
		{ href: `/prizes${kidQs}`, label: 'Prize Shop', emoji: '🎁' },
		{ href: `/leaderboard`, label: 'Leaderboard', emoji: '🏆' }
	]);

	function isActive(href: string): boolean {
		const path = href.split('?')[0];
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}
</script>

<Navigation
	layout="bar"
	class="border-b border-surface-200-800 bg-surface-50-950"
	aria-label="Main navigation"
>
	<Navigation.Menu class="flex max-w-screen-lg mx-auto px-4">
		{#each tabs as tab}
			<Navigation.TriggerAnchor
				href={tab.href}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class={isActive(tab.href) ? 'preset-filled-primary-500' : 'hover:preset-tonal'}
			>
				<span aria-hidden="true">{tab.emoji}</span>
				<Navigation.TriggerText>{tab.label}</Navigation.TriggerText>
			</Navigation.TriggerAnchor>
		{/each}

		{#if role === 'parent'}
			<Navigation.TriggerAnchor
				href="/admin/chores"
				aria-current={page.url.pathname.startsWith('/admin') ? 'page' : undefined}
				class="ml-auto {page.url.pathname.startsWith('/admin') ? 'preset-filled-primary-500' : 'hover:preset-tonal'}"
			>
				<span aria-hidden="true">⚙️</span>
				<Navigation.TriggerText>Manage</Navigation.TriggerText>
			</Navigation.TriggerAnchor>
		{/if}
	</Navigation.Menu>
</Navigation>
