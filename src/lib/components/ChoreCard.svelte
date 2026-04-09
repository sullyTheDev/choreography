<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		id: string;
		emoji: string;
		title: string;
		description: string;
		frequency: 'daily' | 'weekly';
		coinValue: number;
		assignedKidName: string | null;
		isCompleted: boolean;
		activeKidId: string | null;
	}

	let {
		id,
		emoji,
		title,
		description,
		frequency,
		coinValue,
		assignedKidName,
		isCompleted,
		activeKidId
	}: Props = $props();
</script>

<div class="chore-card" class:completed={isCompleted}>
	<div class="chore-main">
		<span class="chore-emoji" aria-hidden="true">{emoji}</span>
		<div class="chore-body">
			<div class="chore-title-row">
				<strong class="chore-title">{title}</strong>
				<div class="chore-badges">
					<span class="badge badge-frequency">{frequency}</span>
					<span class="badge badge-coins">🪙 {coinValue}</span>
					{#if assignedKidName}
						<span class="badge badge-assignee">→ {assignedKidName}</span>
					{/if}
				</div>
			</div>
			{#if description}
				<p class="chore-desc">{description}</p>
			{/if}
		</div>
		<div class="chore-action">
			{#if isCompleted}
				<div class="done-badge" aria-label="Completed">✓</div>
			{:else}
				<form method="POST" action="?/complete" use:enhance>
					<input type="hidden" name="choreId" value={id} />
					{#if activeKidId}
						<input type="hidden" name="kidId" value={activeKidId} />
					{/if}
					<button type="submit" class="complete-btn" aria-label="Mark {title} as complete">
						○
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.chore-card {
		background: white;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-3) var(--space-4);
		transition: border-color 0.2s, background 0.2s;
	}

	.chore-card.completed {
		background: var(--color-success-light, #f0fdf4);
		border-color: var(--color-success, #22c55e);
		opacity: 0.85;
	}

	.chore-main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.chore-emoji {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.chore-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.chore-title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chore-title {
		font-size: var(--text-base);
	}

	.chore-desc {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.chore-badges {
		display: flex;
		gap: var(--space-1);
		flex-wrap: wrap;
	}

	.badge {
		font-size: var(--text-xs);
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.badge-frequency {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.badge-coins {
		background: var(--color-warning-light, #fff7ed);
		color: var(--color-warning-dark, #9a3412);
	}

	.badge-assignee {
		background: var(--color-accent-light, #f0f9ff);
		color: var(--color-accent, #0369a1);
	}

	.chore-action {
		flex-shrink: 0;
	}

	.complete-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid var(--color-primary);
		background: transparent;
		color: var(--color-primary);
		font-size: 1.2rem;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.complete-btn:hover {
		background: var(--color-primary);
		color: white;
	}

	.done-badge {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--color-success, #22c55e);
		color: white;
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
