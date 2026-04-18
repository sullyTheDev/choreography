<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';
	import { Dialog, Portal, Toast, createToaster } from '@skeletonlabs/skeleton-svelte';
	import { AVATAR_EMOJI_OPTIONS } from '$lib/icons';
	import CoinBadge from '$lib/components/CoinBadge.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	type FamilyMember = PageData['members'][number];
	let editingId = $state<string | null>(null);
	let editingRole = $state<'admin' | 'member'>('member');
	let showCreate = $state(false);
	let createRole = $state<'admin' | 'member'>('member');
	let showWelcomeDialog = $state(false);
	let memberPendingDeactivate = $state<FamilyMember | null>(null);
	$effect(() => { showWelcomeDialog = data.newFamily ?? false; });
	let copied = $state(false);
	const toaster = createToaster();

	function hasAvatarOption(value: string): boolean {
		return AVATAR_EMOJI_OPTIONS.some((option) => option.value === value);
	}

	function copyCode() {
		navigator.clipboard.writeText(data.family.familyCode);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function openDeactivateDialog(member: FamilyMember) {
		memberPendingDeactivate = member;
	}

	function closeDeactivateDialog() {
		memberPendingDeactivate = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Family Members</h1>
		<button
			class="btn preset-filled-primary-500"
			onclick={() => { showCreate = !showCreate; editingId = null; }}
		>
			{showCreate ? 'Cancel' : '+ Add Member'}
		</button>
	</div>

	{#if showCreate}
	<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
		<h2 class="text-lg font-semibold">Add Member</h2>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type !== 'failure') showCreate = false;
			};
		}} class="space-y-3">
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
						<span>Password <span class="text-xs text-surface-500 font-normal">(8+ characters)</span></span>
						<input class="input" name="password" type="password" minlength="8" required />
					</label>
					<label class="label">
						<span>PIN <span class="text-xs text-surface-500 font-normal">(optional, 4-6 digits)</span></span>
						<input class="input" name="pin" type="password" inputmode="numeric" pattern="[0-9][0-9][0-9][0-9][0-9]?[0-9]?" maxlength="6" placeholder="e.g. 1234" />
						<p class="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
							<Icon icon="noto:television" class="h-3 w-3 shrink-0" />
							Used for quick unlock in <strong>Kiosk mode</strong>
						</p>
					</label>
				{:else}
					<label class="label">
						<span>PIN <span class="text-xs text-surface-500 font-normal">(4-6 digits)</span></span>
						<input class="input" name="pin" type="password" inputmode="numeric" pattern="[0-9][0-9][0-9][0-9][0-9]?[0-9]?" maxlength="6" required />
						<p class="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
							<Icon icon="noto:television" class="h-3 w-3 shrink-0" />
							Used for quick unlock in <strong>Kiosk mode</strong>
						</p>
					</label>
				{/if}
			</div>
			<button class="btn preset-filled-primary-500">Add Member</button>
			<button class="btn" type="button" onclick={() => (showCreate = false)}>Cancel</button>
		</form>
	</div>
	{/if}

	{#if data.members.length === 0}
		<p class="text-surface-500">No members found.</p>
	{:else}
		<div class="grid gap-3">
			{#each data.members as member (member.id)}
				<div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
					<div class="flex justify-between items-center gap-3">
						<div class="shrink-0 flex flex-col items-center gap-1">
							<span class="text-4xl">{member.avatarEmoji}</span>
							<CoinBadge value={member.coinBalance} />
						</div>
						<div class="flex-1">
							<div class="text-xl font-semibold">{member.displayName} <span class="text-sm text-surface-500">({member.role})</span></div>
							<div class="text-xs {member.isActive ? 'text-success-700-300' : 'text-warning-700-300'}">
								{member.isActive ? 'Active' : 'Inactive'}
							</div>
					</div>
						<div class="flex items-center gap-2">

						<button class="btn preset-tonal-primary" aria-label="Edit {member.displayName}" onclick={() => {
						if (editingId === member.id) {
							editingId = null;
						} else {
							editingId = member.id;
							editingRole = member.role as 'admin' | 'member';
						}
					}}><Icon icon="material-symbols:edit" class="h-5 w-5" /></button>
						{#if member.isActive}
							<button
								type="button"
								class="btn preset-tonal-error"
								aria-label="Deactivate {member.displayName}"
								onclick={() => openDeactivateDialog(member)}
							>
								<Icon icon="material-symbols:person-off" class="h-5 w-5" />
							</button>
						{:else}
						<form method="POST" action="?/reactivate" use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'failure' && result.data?.error) {
									toaster.error({
										title: 'Cannot reactivate',
										description: String(result.data.error)
									});
								} else if (result.type !== 'failure') {
									toaster.success({
										title: 'Member reactivated',
										description: `${member.displayName} was reactivated.`
									});
								}
							};
						}}>
							<input type="hidden" name="id" value={member.id} />
							<button
								class="btn preset-tonal-success"
								aria-label="Reactivate {member.displayName}"
							>
								<Icon icon="material-symbols:person-check" class="h-5 w-5" />
							</button>
						</form>
						{/if}
						</div>
					</div>
					{#if editingId === member.id}
						<form method="POST" action="?/update" use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'failure' && result.data?.error) {
									toaster.error({ title: 'Cannot save', description: String(result.data.error) });
								} else if (result.type !== 'failure') {
									editingId = null;
									toaster.success({ title: 'Member updated', description: 'Changes saved successfully.' });
								}
							};
					}} class="grid md:grid-cols-2 gap-3 border-t pt-3">
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
								<select class="select" name="role" bind:value={editingRole}>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
								</select>
							</label>
							{#if editingRole === 'admin'}
							<label class="label">
								<span>Email <span class="text-xs text-surface-500 font-normal">(admin only)</span></span>
								<input class="input" name="email" value={member.email ?? ''} />
							</label>
							<label class="label">
								<span>Password <span class="text-xs text-surface-500 font-normal">(admin only, leave blank to keep)</span></span>
								<input class="input" name="password" type="password" />
							</label>
							{/if}
							<label class="label">
								<span>PIN <span class="text-xs text-surface-500 font-normal">(4-6 digits, leave blank to keep)</span></span>
								<input class="input" name="pin" type="password" inputmode="numeric" pattern="[0-9][0-9][0-9][0-9][0-9]?[0-9]?" maxlength="6" />
								<p class="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
									<Icon icon="noto:television" class="h-3 w-3 shrink-0" />
									Used for quick unlock in <strong>Kiosk mode</strong>
								</p>
							</label>
							<div class="md:col-span-2 flex gap-2">
								<button class="btn preset-filled-primary-500">Save</button>
								<button class="btn" type="button" onclick={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Welcome dialog: shown once after signup to reveal the family code -->
<Dialog open={showWelcomeDialog} closeOnEscape={false} closeOnInteractOutside={false}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/70" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl">
				<div class="flex flex-col items-center text-center gap-3">
					<div class="flex items-end gap-1">
						<Icon icon="noto:man-curly-hair" class="h-10 w-10" />
						<Icon icon="noto:child" class="h-8 w-8" />
						<Icon icon="noto:woman-blond-hair" class="h-10 w-10" />
					</div>
					<Dialog.Title class="text-xl font-bold">Let's get the crew set up!</Dialog.Title>
					<Dialog.Description class="text-sm text-surface-600-400 space-y-2 text-left">
						<p>Next, add your kids as members using the <strong>+ Add Member</strong> button below. Give each kid a display name and a 4–6 digit PIN.</p>
						<p>When it's time to log in, they'll use your <strong>Family Code</strong> below, their <strong>display name</strong>, and their <strong>PIN</strong>.</p>
					</Dialog.Description>
				</div>

				<div class="flex items-center justify-center gap-3 bg-surface-200-800 rounded-container px-4 py-3">
					<span class="font-mono text-2xl font-bold tracking-widest">{data.family.familyCode}</span>
					<button
						type="button"
						class="btn btn-sm preset-tonal-primary"
						aria-label="Copy family code"
						onclick={copyCode}
					>
						{#if copied}
							<Icon icon="noto:check-mark-button" class="h-4 w-4" />
						{:else}
							<Icon icon="material-symbols:content-copy" class="h-4 w-4" />
						{/if}
					</button>
				</div>

				<p class="text-xs text-center text-surface-500-400">
					You can always find this code on the <strong>Settings</strong> page.
				</p>

				<button
					type="button"
					class="btn preset-filled-primary-500 w-full"
					onclick={() => (showWelcomeDialog = false)}
				>
					Got it!
				</button>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

<Dialog open={memberPendingDeactivate !== null} closeOnEscape={true}>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/70" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="card preset-filled-surface-100-900 w-full max-w-md p-6 space-y-4 shadow-xl">
				<Dialog.Title class="text-xl font-bold">Deactivate member?</Dialog.Title>
				<Dialog.Description class="text-sm text-surface-600-400 space-y-2">
					<p>
						You are about to deactivate
						<strong>{memberPendingDeactivate?.displayName ?? 'this member'}</strong>
						{#if memberPendingDeactivate?.email}
							(<span class="font-mono">{memberPendingDeactivate.email}</span>)
						{/if}.
					</p>
					<p>This user will lose access until an admin reactivates their account.</p>
				</Dialog.Description>
				{#if memberPendingDeactivate}
					<form
						method="POST"
						action="?/deactivate"
						class="flex justify-end gap-2"
						use:enhance={() => {
							const member = memberPendingDeactivate;
							return async ({ result, update }) => {
								await update();
								if (result.type === 'failure' && result.data?.error) {
									toaster.error({
										title: 'Cannot deactivate',
										description: String(result.data.error)
									});
								} else if (result.type !== 'failure') {
									toaster.success({
										title: 'Member deactivated',
										description: `${member?.displayName ?? 'Member'} was deactivated.`
									});
								}
								closeDeactivateDialog();
							};
						}}
					>
						<input type="hidden" name="id" value={memberPendingDeactivate.id} />
						<button type="button" class="btn" onclick={closeDeactivateDialog}>Cancel</button>
						<button type="submit" class="btn preset-filled-error-500">Deactivate</button>
					</form>
				{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast
			{toast}
			class="card shadow-lg p-4 flex gap-3 items-start {toast.type === 'error' ? 'preset-filled-error-500' : 'preset-filled-success-500'}"
		>
			<Toast.Message>
				<Toast.Title class="font-semibold">{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger class="btn btn-icon btn-sm ml-auto">✕</Toast.CloseTrigger>
		</Toast>
	{/snippet}
</Toast.Group>
