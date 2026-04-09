<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editingPrizeId = $state<string | null>(null);

	function startEdit(prizeId: string) {
		editingPrizeId = prizeId;
		showCreate = false;
	}
	function cancelEdit() {
		editingPrizeId = null;
	}
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Manage Prizes</h1>
		<button class="btn btn-primary" onclick={() => { showCreate = !showCreate; editingPrizeId = null; }}>
			{showCreate ? 'Cancel' : '+ Add Prize'}
		</button>
	</div>

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}

	{#if showCreate}
		<div class="card form-card">
			<h2>Add New Prize</h2>
			<form method="POST" action="?/create" use:enhance={({ formElement, formData, cancel }) => {
				return async ({ result, update }) => {
					await update();
					if (result.type !== 'failure') showCreate = false;
				};
			}}>
				<div class="form-group">
					<label for="title">Title</label>
					<input id="title" name="title" type="text" placeholder="e.g. Extra screen time" required class="form-input" />
				</div>
				<div class="form-group">
					<label for="description">Description</label>
					<input id="description" name="description" type="text" placeholder="Optional details" class="form-input" />
				</div>
				<div class="form-group">
					<label for="coinCost">Coin Cost</label>
					<input id="coinCost" name="coinCost" type="number" min="1" placeholder="e.g. 50" required class="form-input" />
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary">Create Prize</button>
					<button type="button" class="btn btn-ghost" onclick={() => (showCreate = false)}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="prizes-list">
		{#each data.prizes as prize (prize.id)}
			<div class="card prize-card">
				<div class="prize-header">
					<div class="prize-info">
						<strong>{prize.title}</strong>
						<span class="coin-cost">🪙 {prize.coinCost} coins</span>
						{#if prize.description}
							<p class="prize-desc">{prize.description}</p>
						{/if}
					</div>
					<div class="prize-actions">
						<button class="btn btn-sm btn-ghost" onclick={() => startEdit(prize.id)}>Edit</button>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="prizeId" value={prize.id} />
							<button type="submit" class="btn btn-sm btn-danger" onclick={(e) => { if (!confirm(`Delete "${prize.title}"?`)) e.preventDefault(); }}>
								Delete
							</button>
						</form>
					</div>
				</div>

				{#if editingPrizeId === prize.id}
					<div class="edit-form">
						<form method="POST" action="?/update" use:enhance={({ formElement, formData, cancel }) => {
							return async ({ result, update }) => {
								await update();
								if (result.type !== 'failure') cancelEdit();
							};
						}}>
							<input type="hidden" name="prizeId" value={prize.id} />
							<div class="form-group">
								<label for="edit-title-{prize.id}">Title</label>
								<input id="edit-title-{prize.id}" name="title" type="text" value={prize.title} required class="form-input" />
							</div>
							<div class="form-group">
								<label for="edit-desc-{prize.id}">Description</label>
								<input id="edit-desc-{prize.id}" name="description" type="text" value={prize.description} class="form-input" />
							</div>
							<div class="form-group">
								<label for="edit-cost-{prize.id}">Coin Cost</label>
								<input id="edit-cost-{prize.id}" name="coinCost" type="number" min="1" value={prize.coinCost} required class="form-input" />
							</div>
							<div class="form-actions">
								<button type="submit" class="btn btn-primary">Save Changes</button>
								<button type="button" class="btn btn-ghost" onclick={cancelEdit}>Cancel</button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		{/each}

		{#if data.prizes.length === 0}
			<div class="empty-state">
				<p>No prizes yet. Add prizes for kids to redeem with their coins!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page-container { max-width: 720px; margin: 0 auto; padding: var(--space-4); }
	.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
	.form-card { margin-bottom: var(--space-4); padding: var(--space-4); }
	.prizes-list { display: flex; flex-direction: column; gap: var(--space-3); }
	.prize-card { padding: var(--space-3) var(--space-4); }
	.prize-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); }
	.prize-info { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
	.coin-cost { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.prize-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; }
	.prize-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }
	.edit-form { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
	.form-actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
	.btn-sm { padding: 4px 10px; font-size: var(--text-sm); }
	.btn-danger { background: #dc2626; color: white; }
	.btn-danger:hover { background: #b91c1c; }
	.empty-state { text-align: center; padding: var(--space-6); color: var(--color-text-secondary); }
	.alert { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); }
	.alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
</style>
