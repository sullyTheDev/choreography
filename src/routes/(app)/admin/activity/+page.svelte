<script lang="ts">
	import type { PageData } from './$types.js';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Activity Log</h1>
		<span class="event-count">{data.totalCount} events</span>
	</div>

	{#if data.events.length === 0}
		<div class="empty-state">
			<p>No activity yet. Once kids start completing chores and redeeming prizes, you'll see it here.</p>
		</div>
	{:else}
		<div class="events-list" aria-label="Activity log">
			{#each data.events as event}
				<div class="event-row" class:completion={event.type === 'chore_completion'} class:redemption={event.type === 'prize_redemption'}>
					<div class="event-icon" aria-hidden="true">
						{event.kidAvatarEmoji}
					</div>
					<div class="event-body">
						<div class="event-title">
							<strong>{event.kidName}</strong>
							{#if event.type === 'chore_completion'}
								completed <span class="event-item">"{event.title}"</span>
							{:else}
								redeemed <span class="event-item">"{event.title}"</span>
							{/if}
						</div>
						<div class="event-meta">
							<span class="event-coins">
								{event.type === 'chore_completion' ? '+' : '−'}🪙 {event.coins}
							</span>
							<span class="event-time">{formatDate(event.occurredAt)}</span>
						</div>
					</div>
					<div class="event-type-badge">
						{event.type === 'chore_completion' ? '✓' : '🎁'}
					</div>
				</div>
			{/each}
		</div>

		<div class="pagination">
			{#if data.page > 1}
				<a href="?page={data.page - 1}" class="btn btn-ghost">← Previous</a>
			{/if}
			<span class="page-info">Page {data.page}</span>
			{#if data.page * 25 < data.totalCount}
				<a href="?page={data.page + 1}" class="btn btn-ghost">Next →</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page-container { max-width: 720px; margin: 0 auto; padding: var(--space-4); }
	.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
	.event-count { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.events-list { display: flex; flex-direction: column; gap: var(--space-2); }
	.event-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: white;
		border-radius: var(--radius);
		border-left: 4px solid var(--color-border);
	}
	.event-row.completion { border-left-color: var(--color-success, #22c55e); }
	.event-row.redemption { border-left-color: var(--color-primary); }
	.event-icon { font-size: 1.5rem; flex-shrink: 0; }
	.event-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
	.event-title { font-size: var(--text-sm); }
	.event-item { font-style: italic; }
	.event-meta { display: flex; gap: var(--space-2); align-items: center; }
	.event-coins { font-size: var(--text-sm); font-weight: 600; }
	.completion .event-coins { color: var(--color-success, #16a34a); }
	.redemption .event-coins { color: var(--color-primary); }
	.event-time { font-size: var(--text-xs); color: var(--color-text-secondary); }
	.event-type-badge { font-size: 1.2rem; flex-shrink: 0; }
	.pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-3); margin-top: var(--space-4); }
	.page-info { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.empty-state { text-align: center; padding: var(--space-8); color: var(--color-text-secondary); }
</style>
