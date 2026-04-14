<script lang="ts">
	import { page } from '$app/state';

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

	const currentPath = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		const path = href.split('?')[0];
		return currentPath === path || currentPath.startsWith(path + '/');
	}
</script>

<nav class="bg-surface-50-950 mt-8" aria-label="Main navigation">
	<div class=" max-w-fit rounded-full flex items-center justify-center gap-1 mx-auto p-1.5 bg-surface-100-900">
		{#each tabs as tab}
			<a
				href={tab.href}
				aria-current={isActive(tab.href) ? 'page' : undefined}
				class="flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm no-underline transition-colors
					{isActive(tab.href)
						? 'preset-filled-primary-500'
						: 'text-surface-600 hover:bg-surface-200'}"
			>
				<span aria-hidden="true">{tab.emoji}</span>
				{tab.label}
			</a>
		{/each}


	</div>
</nav>
