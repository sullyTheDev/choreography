<script lang="ts">
	let { data, form } = $props<{
		data: {
			family: {
				id: string;
				name: string;
				familyCode: string;
				leaderboardResetDay: number;
			};
		};
		form?: { success?: boolean; error?: string } | null;
	}>();

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
</script>

<section class="settings">
	<h2>Family Settings</h2>

	{#if form?.success}
		<p class="success-msg" role="status">Settings saved successfully.</p>
	{/if}
	{#if form?.error}
		<p class="error-msg" role="alert">{form.error}</p>
	{/if}

	<!-- Update family -->
	<div class="card">
		<h3>Family Details</h3>
		<form method="POST" action="?/updateFamily">
			<div class="field">
				<label for="familyName">Family Name</label>
				<input
					id="familyName"
					name="familyName"
					type="text"
					value={data.family.name}
					required
				/>
			</div>
			<div class="field">
				<label for="leaderboardResetDay">Leaderboard Reset Day</label>
				<select id="leaderboardResetDay" name="leaderboardResetDay">
					{#each DAY_NAMES as day, i (i)}
						<option value={i + 1} selected={i + 1 === data.family.leaderboardResetDay}>
							{day}
						</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="btn btn-primary">Save Changes</button>
		</form>
	</div>

	<!-- Family code info -->
	<div class="card">
		<h3>Family Code</h3>
		<p>Kids use this code to log in: <strong class="family-code">{data.family.familyCode}</strong></p>
	</div>

	<!-- Export data -->
	<div class="card">
		<h3>Export Data</h3>
		<p>Download a full JSON export of all family data.</p>
		<form method="POST" action="?/exportData">
			<button type="submit" class="btn btn-secondary">Export Data</button>
		</form>
	</div>

	<!-- Delete family -->
	<div class="card danger-zone">
		<h3>Danger Zone</h3>
		<p>Permanently delete this family and all associated data. This action cannot be undone.</p>
		<form method="POST" action="?/deleteFamily">
			<div class="field">
				<label for="confirm">Type <strong>DELETE</strong> to confirm</label>
				<input id="confirm" name="confirm" type="text" placeholder="DELETE" required />
			</div>
			<button type="submit" class="btn btn-danger">Delete Family</button>
		</form>
	</div>
</section>

<style>
	.settings {
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	h2 {
		font-size: var(--font-size-2xl);
		font-weight: 700;
		margin-bottom: var(--space-2);
	}

	h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-3);
	}

	.card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.danger-zone {
		border: 2px solid var(--color-error, #dc2626);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	label {
		font-weight: 500;
	}

	input,
	select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		background: var(--color-bg);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		font-size: var(--font-size-base);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-secondary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.btn-danger {
		background: var(--color-error, #dc2626);
		color: white;
	}

	.family-code {
		font-family: monospace;
		font-size: var(--font-size-lg);
		letter-spacing: 0.1em;
	}

	.success-msg {
		color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 10%, transparent);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
	}

	.error-msg {
		color: var(--color-error, #dc2626);
		background: color-mix(in srgb, var(--color-error, #dc2626) 10%, transparent);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
	}
</style>
