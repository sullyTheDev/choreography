<script lang="ts">
	import KidSwitcher from './KidSwitcher.svelte';

	interface Props {
		appName: string;
		familyName: string;
		user: { id: string; displayName: string; role: 'parent' | 'kid'; avatarEmoji?: string };
		kids: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
		activeKidId: string | null;
		coinBalance: number;
	}

	let { appName, familyName, user, kids, activeKidId, coinBalance }: Props = $props();
</script>

<header class="app-header">
	<div class="header-inner">
		<div class="header-brand">
			<a href={user.role === 'parent' ? '/admin/chores' : '/chores'} class="brand-link">
				{appName}
			</a>
			<span class="family-name">{familyName}</span>
		</div>

		<div class="header-right">
			{#if kids.length > 0}
				<KidSwitcher {kids} {activeKidId} />
			{/if}

			<div class="coin-badge" aria-label="{coinBalance} coins">
				🪙 <span>{coinBalance}</span>
			</div>

			<span class="role-badge" class:role-parent={user.role === 'parent'}>
				{user.role === 'parent' ? '👑 Parent' : user.avatarEmoji ?? '👤'}
			</span>

			<form method="POST" action="/logout" style="display:contents">
				<button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
			</form>
		</div>
	</div>
</header>

<style>
	.app-header {
		background: var(--color-surface);
		border-bottom: 1.5px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-inner {
		max-width: 720px;
		margin: 0 auto;
		padding: var(--space-3) var(--space-4);
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.header-brand {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		min-width: 0;
	}

	.brand-link {
		font-size: var(--font-size-lg);
		font-weight: 800;
		color: var(--color-primary);
		text-decoration: none;
		white-space: nowrap;
	}

	.family-name {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-left: auto;
		flex-wrap: nowrap;
	}

	.coin-badge {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-weight: 700;
		font-size: var(--font-size-sm);
		color: var(--color-coin);
		white-space: nowrap;
	}

	.role-badge {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.role-parent {
		color: var(--color-primary);
	}

	@media (max-width: 600px) {
		.family-name { display: none; }
		.role-badge { display: none; }
	}
</style>
