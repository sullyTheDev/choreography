<script lang="ts">
    import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	interface Props {
		role: 'admin' | 'member';
		activeMemberId: string | null;
		base?: string;
	}

	let { role, activeMemberId, base = '/member' }: Props = $props();

	const memberQs = $derived(activeMemberId ? `?member=${activeMemberId}` : '');

	const tabs = $derived([
		{ href: `${base}/chores${memberQs}`, label: 'Chores', icon: 'noto:check-mark-button' },
		{ href: `${base}/prizes${memberQs}`, label: 'Prize Shop', icon: 'noto:wrapped-gift' },
		{ href: `${base}/leaderboard${memberQs}`, label: 'Leaderboard', icon: 'noto:trophy' }
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
				<Icon icon={tab.icon} class="h-5 w-5" aria-hidden="true" />
				{tab.label}
			</a>
		{/each}


	</div>
</nav>
