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

	function isActive(href: string): boolean {
		const path = href.split('?')[0];
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}
</script>

<nav class="nav-tabs" aria-label="Main navigation">
	<div class="tabs-inner">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="tab"
				class:active={isActive(tab.href)}
				aria-current={isActive(tab.href) ? 'page' : undefined}
			>
				<span class="tab-emoji" aria-hidden="true">{tab.emoji}</span>
				<span class="tab-label">{tab.label}</span>
			</a>
		{/each}

		{#if role === 'parent'}
			<a
				href="/admin/chores"
				class="tab tab-admin"
				class:active={page.url.pathname.startsWith('/admin')}
				aria-current={page.url.pathname.startsWith('/admin') ? 'page' : undefined}
			>
				<span class="tab-emoji" aria-hidden="true">⚙️</span>
				<span class="tab-label">Manage</span>
			</a>
		{/if}
	</div>
</nav>

<style>
	.nav-tabs {
		background: var(--color-surface);
		border-bottom: 1.5px solid var(--color-border);
	}

	.tabs-inner {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		padding: 0 var(--space-4);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		text-decoration: none;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-bottom: 2.5px solid transparent;
		transition: color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}

	.tab:hover { color: var(--color-text); text-decoration: none; }

	.tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.tab-admin {
		margin-left: auto;
	}

	.tab-emoji { font-size: 1rem; }

	@media (max-width: 480px) {
		.tab { padding: var(--space-3) var(--space-2); gap: var(--space-1); }
		.tab-label { font-size: var(--font-size-xs); }
	}
</style>
