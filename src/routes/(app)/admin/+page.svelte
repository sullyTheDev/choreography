<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
</script>

<section class="space-y-4">
    <a
        href="/member/chores"
        class="inline-flex items-center gap-1 text-primary-600 hover:underline mb-2"
    >
        <Icon icon="material-symbols:arrow-back" class="w-4 h-4" />
        Back to Chores
    </a>
	<h2 class="text-2xl font-bold">Admin</h2>
	<p class="text-surface-600-400">Manage your family's choreography.</p>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
		<a
			href="/admin/chores"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:checklist" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Chores</strong>
				<span class="text-sm text-surface-600-400">Add, edit, and assign chores</span>
			</div>
		</a>

		<a
			href="/admin/prizes"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:redeem" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Prizes</strong>
				<span class="text-sm text-surface-600-400">Manage the prize shop</span>
			</div>
		</a>

		<a
			href="/admin/family"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:group" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Family</strong>
				<span class="text-sm text-surface-600-400">Manage members and roles</span>
			</div>
		</a>

		<a
			href="/admin/approvals"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:inbox" class="h-10 w-10 text-primary-500 shrink-0" />
			<div class="flex-1">
				<div class="flex items-center gap-2">
					<strong class="text-lg font-semibold">Approvals</strong>
					{#if data.pendingApprovalsCount > 0}
						<span
							class="badge preset-filled-warning-500 text-xs font-bold min-w-[1.5rem] text-center"
							aria-label="{data.pendingApprovalsCount} pending approval{data.pendingApprovalsCount === 1 ? '' : 's'}"
						>
							{data.pendingApprovalsCount}
						</span>
					{/if}
				</div>
				<span class="text-sm text-surface-600-400">Review pending prize requests</span>
			</div>
		</a>

		<a
			href="/admin/activity"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:history" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Activity</strong>
				<span class="text-sm text-surface-600-400">View recent completions and rewards</span>
			</div>
		</a>

		<a
			href="/admin/settings"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:settings" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Settings</strong>
				<span class="text-sm text-surface-600-400">Configure your family's preferences</span>
			</div>
		</a>

		<a
			href="/admin/notifications"
			class="card border preset-outlined-primary-200-800 shadow-md p-6 flex items-center gap-4 hover:preset-tonal-primary transition-colors no-underline"
		>
			<Icon icon="material-symbols:notifications" class="h-10 w-10 text-primary-500 shrink-0" />
			<div>
				<strong class="text-lg font-semibold block">Notifications</strong>
				<span class="text-sm text-surface-600-400">Configure webhooks for family events</span>
			</div>
		</a>
	</div>
</section>

