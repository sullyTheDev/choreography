<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	interface Props {
		base: string;
		activeMemberId: string | null;
	}

	let { base, activeMemberId }: Props = $props();

	// Only add member query param for kiosk routes; member routes use session.memberId
	const memberQs = $derived(base.startsWith('/kiosk') && activeMemberId ? `?member=${activeMemberId}` : '');

	const tabs = $derived([
		{ href: `${base}/shop${memberQs}`, label: 'Shop', icon: 'noto:shopping-cart' },
		{ href: `${base}/my-prizes${memberQs}`, label: 'My Prizes', icon: 'noto:backpack' }
	]);

	const currentPath = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		const path = href.split('?')[0];
		return currentPath === path || currentPath.startsWith(path + '/');
	}
</script>

<nav class="bg-surface-50-950" aria-label="Prize navigation">
	<div class="w-fit rounded-full flex items-center justify-center gap-1 p-1.5 bg-surface-100-900">
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
