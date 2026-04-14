<script lang="ts">
	import { enhance } from '$app/forms';
	import { AVATAR_EMOJI_OPTIONS } from '$lib/icons';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let editingId = $state<string | null>(null);
	let createRole = $state<'admin' | 'member'>('member');

	function hasAvatarOption(value: string): boolean {
		return AVATAR_EMOJI_OPTIONS.some((option) => option.value === value);
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Family Members</h1>
	<div class="card p-4 space-y-3">
		<h2 class="text-lg font-semibold">Add Member</h2>
		<form method="POST" action="?/create" use:enhance class="space-y-3">
			<div class="grid md:grid-cols-2 gap-3">
				<label class="label">
					<span>Display name</span>
					<input class="input" name="displayName" required />
				</label>
				<label class="label">
					<span>Avatar</span>
					<select class="select" name="avatarEmoji" required>
						{#each AVATAR_EMOJI_OPTIONS as option}
							<option value={option.value} selected={option.value === '👤'}>{option.label}</option>
						{/each}
					</select>
				</label>
				<label class="label">
					<span>Role</span>
					<select class="select" name="role" bind:value={createRole}>
						<option value="admin">Admin</option>
						<option value="member">Member</option>
					</select>
				</label>
				{#if createRole === 'admin'}
					<label class="label">
						<span>Email</span>
						<input class="input" name="email" type="email" required />
					</label>
					<label class="label">
						<span>Password</span>
						<input class="input" name="password" type="password" minlength="8" required />
					</label>
				{:else}
					<label class="label">
						<span>PIN (4-6 digits)</span>
						<input class="input" name="pin" pattern="[0-9][0-9][0-9][0-9]([0-9][0-9])?" required />
					</label>
				{/if}
			</div>
			<button class="btn preset-filled">Add Member</button>
		</form>
	</div>

	{#if data.members.length === 0}
		<p class="text-surface-500">No members found.</p>
	{:else}
		<div class="grid gap-3">
			{#each data.members as member (member.id)}
				<div class="card bg-white border border-surface-200 shadow-md p-4 space-y-3 {member.isActive ? '' : 'opacity-70'}">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
						<span>{member.avatarEmoji}</span>
						<div>
							<div class="font-semibold">{member.displayName} <span class="text-sm text-surface-500">({member.role})</span></div>
							<div class="text-sm text-surface-500">{member.coinBalance} coins</div>
						</div>
					</div>
						<div class="flex items-center gap-2">
							<div class="badge">{member.isActive ? 'Active' : 'Inactive'}</div>
							<button class="btn btn-sm" onclick={() => (editingId = editingId === member.id ? null : member.id)}>Edit</button>
							<form method="POST" action="?/deactivate" use:enhance>
								<input type="hidden" name="id" value={member.id} />
								<button class="btn btn-sm preset-filled-error-500" disabled={!member.isActive}>Deactivate</button>
							</form>
						</div>
					</div>
					{#if editingId === member.id}
						<form method="POST" action="?/update" use:enhance class="grid md:grid-cols-2 gap-3 border-t pt-3">
							<input type="hidden" name="id" value={member.id} />
							<label class="label">
								<span>Display name</span>
								<input class="input" name="displayName" value={member.displayName} required />
							</label>
							<label class="label">
								<span>Avatar</span>
								<select class="select" name="avatarEmoji" required>
									{#if !hasAvatarOption(member.avatarEmoji)}
										<option value={member.avatarEmoji} selected>{member.avatarEmoji} Current</option>
									{/if}
									{#each AVATAR_EMOJI_OPTIONS as option}
										<option value={option.value} selected={option.value === member.avatarEmoji}>{option.label}</option>
									{/each}
								</select>
							</label>
							<label class="label">
								<span>Role</span>
								<select class="select" name="role" value={member.role}>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
								</select>
							</label>
							<label class="label">
								<span>Email (for admin)</span>
								<input class="input" name="email" value={member.email ?? ''} />
							</label>
							<label class="label">
								<span>Password (optional)</span>
								<input class="input" name="password" type="password" />
							</label>
							<label class="label">
								<span>PIN (for member)</span>
								<input class="input" name="pin" />
							</label>
							<div class="md:col-span-2 flex gap-2">
								<button class="btn preset-filled">Save</button>
								<button class="btn" type="button" onclick={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
