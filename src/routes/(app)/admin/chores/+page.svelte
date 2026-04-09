<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const EMOJI_OPTIONS = ['🛏️', '🍽️', '🐕', '🧹', '📚', '🌿', '🚿', '🧺', '🗑️', '🪟', '🧴', '🍎'];

	let showCreate = $state(false);
	let editingChoreId = $state<string | null>(null);

	function startEdit(choreId: string) {
		editingChoreId = choreId;
		showCreate = false;
	}

	function cancelEdit() {
		editingChoreId = null;
	}
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Manage Chores</h1>
		<button class="btn btn-primary" onclick={() => { showCreate = !showCreate; editingChoreId = null; }}>
			{showCreate ? 'Cancel' : '+ Add Chore'}
		</button>
	</div>

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}

	{#if showCreate}
		<div class="card form-card">
			<h2>Add New Chore</h2>
			<form method="POST" action="?/create" use:enhance={({ formElement, formData, cancel }) => {
				return async ({ result, update }) => {
					await update();
					if (result.type !== 'failure') showCreate = false;
				};
			}}>
				<div class="form-row">
					<div class="form-group flex-1">
						<label for="title">Title</label>
						<input id="title" name="title" type="text" placeholder="e.g. Make your bed" required class="form-input" />
					</div>
					<div class="form-group">
						<label for="create-emoji">Emoji</label>
						<select id="create-emoji" name="emoji" required class="form-input">
							{#each EMOJI_OPTIONS as e}
								<option value={e}>{e}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="form-group">
					<label for="description">Description</label>
					<input id="description" name="description" type="text" placeholder="Optional description" class="form-input" />
				</div>
				<div class="form-row">
					<div class="form-group flex-1">
						<label for="frequency">Frequency</label>
						<select id="frequency" name="frequency" required class="form-input">
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
						</select>
					</div>
					<div class="form-group flex-1">
						<label for="coinValue">Coin Value</label>
						<input id="coinValue" name="coinValue" type="number" min="1" placeholder="e.g. 10" required class="form-input" />
					</div>
					<div class="form-group flex-1">
						<label for="assignedKidId">Assign to Kid</label>
						<select id="assignedKidId" name="assignedKidId" class="form-input">
							<option value="">All Kids</option>
							{#each data.kids as kid}
								<option value={kid.id}>{kid.displayName}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary">Create Chore</button>
					<button type="button" class="btn btn-ghost" onclick={() => (showCreate = false)}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="chores-list">
		{#each data.chores as chore (chore.id)}
			<div class="card chore-card">
				<div class="chore-header">
					<span class="chore-emoji">{chore.emoji}</span>
					<div class="chore-info">
						<strong>{chore.title}</strong>
						<div class="chore-meta">
							<span class="badge badge-frequency">{chore.frequency}</span>
							<span class="coin-value">🪙 {chore.coinValue}</span>
							{#if chore.assignedKid}
								<span class="assignee">→ {chore.assignedKid.displayName}</span>
							{:else}
								<span class="assignee-all">All kids</span>
							{/if}
						</div>
						{#if chore.description}
							<p class="chore-desc">{chore.description}</p>
						{/if}
					</div>
					<div class="chore-actions">
						<button class="btn btn-sm btn-ghost" onclick={() => startEdit(chore.id)}>Edit</button>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="choreId" value={chore.id} />
							<button type="submit" class="btn btn-sm btn-danger" onclick={(e) => { if (!confirm(`Delete "${chore.title}"?`)) e.preventDefault(); }}>
								Delete
							</button>
						</form>
					</div>
				</div>

				{#if editingChoreId === chore.id}
					<div class="edit-form">
						<form method="POST" action="?/update" use:enhance={({ formElement, formData, cancel }) => {
							return async ({ result, update }) => {
								await update();
								if (result.type !== 'failure') cancelEdit();
							};
						}}>
							<input type="hidden" name="choreId" value={chore.id} />
							<div class="form-row">
								<div class="form-group flex-1">
									<label for="edit-title-{chore.id}">Title</label>
									<input id="edit-title-{chore.id}" name="title" type="text" value={chore.title} required class="form-input" />
								</div>
								<div class="form-group">
									<label for="edit-emoji-{chore.id}">Emoji</label>
									<select id="edit-emoji-{chore.id}" name="emoji" required class="form-input">
										{#each EMOJI_OPTIONS as e}
											<option value={e} selected={e === chore.emoji}>{e}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="form-group">
								<label for="edit-desc-{chore.id}">Description</label>
								<input id="edit-desc-{chore.id}" name="description" type="text" value={chore.description} class="form-input" />
							</div>
							<div class="form-row">
								<div class="form-group flex-1">
									<label for="edit-freq-{chore.id}">Frequency</label>
									<select id="edit-freq-{chore.id}" name="frequency" required class="form-input">
										<option value="daily" selected={chore.frequency === 'daily'}>Daily</option>
										<option value="weekly" selected={chore.frequency === 'weekly'}>Weekly</option>
									</select>
								</div>
								<div class="form-group flex-1">
									<label for="edit-coins-{chore.id}">Coin Value</label>
									<input id="edit-coins-{chore.id}" name="coinValue" type="number" min="1" value={chore.coinValue} required class="form-input" />
								</div>
								<div class="form-group flex-1">
									<label for="edit-kid-{chore.id}">Assign to Kid</label>
									<select id="edit-kid-{chore.id}" name="assignedKidId" class="form-input">
										<option value="" selected={chore.assignedKid === null}>All Kids</option>
										{#each data.kids as kid}
											<option value={kid.id} selected={chore.assignedKid?.id === kid.id}>{kid.displayName}</option>
										{/each}
									</select>
								</div>
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

		{#if data.chores.length === 0}
			<div class="empty-state">
				<p>No chores yet. Add your first chore to get started!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page-container { max-width: 800px; margin: 0 auto; padding: var(--space-4); }
	.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
	.form-card { margin-bottom: var(--space-4); padding: var(--space-4); }
	.chores-list { display: flex; flex-direction: column; gap: var(--space-3); }
	.chore-card { padding: var(--space-3) var(--space-4); }
	.chore-header { display: flex; align-items: flex-start; gap: var(--space-3); }
	.chore-emoji { font-size: 2rem; flex-shrink: 0; }
	.chore-info { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
	.chore-meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
	.chore-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; }
	.chore-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }
	.badge-frequency { background: var(--color-primary-light); color: var(--color-primary-dark); font-size: var(--text-xs); padding: 2px 8px; border-radius: 9999px; }
	.coin-value { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.assignee { font-size: var(--text-sm); color: var(--color-accent); }
	.assignee-all { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.edit-form { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
	.form-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
	.flex-1 { flex: 1; min-width: 120px; }
	.form-actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
	.btn-sm { padding: 4px 10px; font-size: var(--text-sm); }
	.btn-danger { background: #dc2626; color: white; }
	.btn-danger:hover { background: #b91c1c; }
	.empty-state { text-align: center; padding: var(--space-6); color: var(--color-text-secondary); }
	.alert { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); }
	.alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
</style>
