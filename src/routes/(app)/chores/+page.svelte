<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import ChoreCard from '$lib/components/ChoreCard.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page-container">
	<div class="greeting-section">
		<h1 class="greeting">{data.greeting}</h1>
		{#if data.remainingCount > 0}
			<p class="remaining">
				{data.remainingCount} chore{data.remainingCount === 1 ? '' : 's'} left today
			</p>
		{:else if data.chores.length > 0}
			<p class="all-done">🎉 All done! Great work!</p>
		{/if}
	</div>

	{#if form?.error}
		<div class="alert alert-error" role="alert">{form.error}</div>
	{/if}

	{#if data.chores.length === 0}
		<div class="empty-state">
			<p>No chores assigned yet. Ask a parent to set some up!</p>
		</div>
	{:else}
		<div class="chores-grid" aria-label="Chore list">
			{#each data.chores as chore (chore.id)}
				<ChoreCard
					id={chore.id}
					emoji={chore.emoji}
					title={chore.title}
					description={chore.description}
					frequency={chore.frequency}
					coinValue={chore.coinValue}
					assignedKidName={chore.assignedKidName}
					isCompleted={chore.isCompleted}
					activeKidId={data.activeKidId}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 700px;
		margin: 0 auto;
		padding: var(--space-4);
	}

	.greeting-section {
		margin-bottom: var(--space-4);
	}

	.greeting {
		font-size: var(--text-2xl, 1.75rem);
		font-weight: 700;
		margin: 0 0 var(--space-1);
	}

	.remaining {
		color: var(--color-text-secondary);
		margin: 0;
	}

	.all-done {
		color: var(--color-success, #16a34a);
		font-weight: 600;
		margin: 0;
	}

	.chores-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8);
		color: var(--color-text-secondary);
	}

	.alert {
		padding: var(--space-3);
		border-radius: var(--radius);
		margin-bottom: var(--space-3);
	}

	.alert-error {
		background: #fef2f2;
		border: 1px solid #fca5a5;
		color: #dc2626;
	}
</style>
