<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		kids: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
		activeKidId: string | null;
	}

	let { kids, activeKidId }: Props = $props();

	function kidUrl(kidId: string): string {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('kid', kidId);
		return `${page.url.pathname}?${params.toString()}`;
	}
</script>

{#if kids.length > 1}
	<nav class="kid-switcher" aria-label="Switch kid">
		{#each kids as kid (kid.id)}
			<a
				href={kidUrl(kid.id)}
				class="kid-tab"
				class:active={kid.id === activeKidId}
				aria-current={kid.id === activeKidId ? 'page' : undefined}
				title={kid.displayName}
			>
				<span class="avatar" aria-hidden="true">{kid.avatarEmoji}</span>
				<span class="name">{kid.displayName}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.kid-switcher {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.kid-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--color-text-secondary);
		font-size: var(--font-size-xs);
		transition: background 0.15s, color 0.15s;
		border: 1.5px solid transparent;
	}

	.kid-tab:hover {
		background: var(--color-surface-2);
		text-decoration: none;
	}

	.kid-tab.active {
		background: var(--color-primary-light);
		border-color: var(--color-primary);
		color: var(--color-primary-dark);
	}

	.avatar {
		font-size: 1.25rem;
		line-height: 1;
	}

	.name {
		font-weight: 500;
	}
</style>
