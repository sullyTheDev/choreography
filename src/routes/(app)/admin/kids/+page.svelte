<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const AVATAR_OPTIONS = ['👦', '👧', '🧒', '👶', '🦸', '🧙', '🐱', '🐶', '🦊', '🐼'];

	let showCreate = $state(false);
	let editingKidId = $state<string | null>(null);

	function startEdit(kidId: string) {
		editingKidId = kidId;
		showCreate = false;
	}

	function cancelEdit() {
		editingKidId = null;
	}
</script>

<div class="page-container">
	<div class="page-header">
		<h1>Manage Kids</h1>
		<button class="btn btn-primary" onclick={() => { showCreate = !showCreate; editingKidId = null; }}>
			{showCreate ? 'Cancel' : '+ Add Kid'}
		</button>
	</div>

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}

	{#if showCreate}
		<div class="card form-card">
			<h2>Add New Kid</h2>
			<form method="POST" action="?/create" use:enhance>
				<div class="form-group">
					<label for="displayName">Name</label>
					<input id="displayName" name="displayName" type="text" placeholder="e.g. Emma" required class="form-input" />
				</div>
				<fieldset class="form-group">
					<legend>Avatar</legend>
					<div class="emoji-picker">
						{#each AVATAR_OPTIONS as emoji}
							<label class="emoji-option">
								<input type="radio" name="avatarEmoji" value={emoji} required />
								<span class="emoji-btn">{emoji}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				<div class="form-group">
					<label for="pin">PIN (4–6 digits)</label>
					<input id="pin" name="pin" type="password" placeholder="e.g. 1234" minlength="4" maxlength="6" required class="form-input" />
				</div>
				<div class="form-actions">
					<button type="submit" class="btn btn-primary">Create Kid</button>
					<button type="button" class="btn btn-ghost" onclick={() => (showCreate = false)}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="kids-list">
		{#each data.kids as kid (kid.id)}
			<div class="card kid-card" class:inactive={!kid.isActive}>
				<div class="kid-info">
					<span class="kid-avatar">{kid.avatarEmoji}</span>
					<div class="kid-details">
						<strong>{kid.displayName}</strong>
						<span class="coin-balance">🪙 {kid.coinBalance} coins</span>
						{#if !kid.isActive}<span class="badge badge-inactive">Inactive</span>{/if}
					</div>
				</div>
				<div class="kid-actions">
					{#if kid.isActive}
						<button class="btn btn-sm btn-ghost" onclick={() => startEdit(kid.id)}>Edit</button>
						<form method="POST" action="?/deactivate" use:enhance>
							<input type="hidden" name="kidId" value={kid.id} />
							<button type="submit" class="btn btn-sm btn-danger" onclick={(e) => { if (!confirm(`Deactivate ${kid.displayName}?`)) e.preventDefault(); }}>
								Deactivate
							</button>
						</form>
					{/if}
				</div>

				{#if editingKidId === kid.id}
					<div class="edit-form">
						<form method="POST" action="?/update" use:enhance={({ formElement, formData, cancel }) => {
								return async ({ result, update }) => {
									await update();
									if (result.type !== 'failure') cancelEdit();
								};
							}}>
							<input type="hidden" name="kidId" value={kid.id} />
							<div class="form-group">
								<label for="edit-name-{kid.id}">Name</label>
								<input id="edit-name-{kid.id}" name="displayName" type="text" value={kid.displayName} required class="form-input" />
							</div>
								<fieldset class="form-group">
									<legend>Avatar</legend>
									<div class="emoji-picker">
										{#each AVATAR_OPTIONS as emoji}
											<label class="emoji-option">
												<input type="radio" name="avatarEmoji" value={emoji} checked={emoji === kid.avatarEmoji} />
												<span class="emoji-btn">{emoji}</span>
											</label>
										{/each}
									</div>
								</fieldset>
							<div class="form-group">
								<label for="edit-pin-{kid.id}">New PIN (leave blank to keep current)</label>
								<input id="edit-pin-{kid.id}" name="pin" type="password" placeholder="Optional new PIN" minlength="4" maxlength="6" class="form-input" />
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

		{#if data.kids.length === 0}
			<div class="empty-state">
				<p>No kids yet. Add your first kid to get started!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.page-container { max-width: 720px; margin: 0 auto; padding: var(--space-4); }
	.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
	.form-card { margin-bottom: var(--space-4); padding: var(--space-4); }
	.kids-list { display: flex; flex-direction: column; gap: var(--space-3); }
	.kid-card { padding: var(--space-3) var(--space-4); }
	.kid-card.inactive { opacity: 0.6; }
	.kid-info { display: flex; align-items: center; gap: var(--space-3); }
	.kid-avatar { font-size: 2rem; }
	.kid-details { display: flex; flex-direction: column; gap: var(--space-1); }
	.coin-balance { font-size: var(--text-sm); color: var(--color-text-secondary); }
	.kid-actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
	.badge-inactive { background: var(--color-warning); color: white; font-size: var(--text-xs); padding: 2px 6px; border-radius: 9999px; }
	.edit-form { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
	.emoji-picker { display: flex; flex-wrap: wrap; gap: var(--space-1); }
	.emoji-option input { display: none; }
	.emoji-btn { display: block; padding: var(--space-1); font-size: 1.5rem; border-radius: var(--radius); cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; }
	.emoji-option input:checked + .emoji-btn { border-color: var(--color-primary); background: var(--color-primary-light); }
	.form-actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
	.btn-sm { padding: 4px 10px; font-size: var(--text-sm); }
	.btn-danger { background: #dc2626; color: white; }
	.btn-danger:hover { background: #b91c1c; }
	.empty-state { text-align: center; padding: var(--space-6); color: var(--color-text-secondary); }

	.alert { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); }
	.alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
</style>
