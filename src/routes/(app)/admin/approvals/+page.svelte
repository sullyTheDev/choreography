<script lang="ts">
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
	import { Dialog, Pagination } from '@skeletonlabs/skeleton-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { PageData, ActionData } from './$types.js';
	import Icon from '@iconify/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type DismissTarget = { redemptionId: string; memberName: string; prizeName: string; prizeEmoji: string };
	let dismissTarget = $state<DismissTarget | null>(null);
	let dismissFormEl = $state<HTMLFormElement | null>(null);

	function buildUrl(params: { p?: number; sort?: string; dir?: string }) {
		const qs = new URLSearchParams();
		const p = params.p ?? data.page;
		const s = params.sort ?? data.sort;
		const d = params.dir ?? data.dir;
		if (p !== 1) qs.set('page', String(p));
		if (s !== 'requestedAt') qs.set('sort', s);
		if (d !== 'asc') qs.set('dir', d);
		const str = qs.toString();
		return str ? `?${str}` : '/admin/approvals';
	}

	function pageUrl(p: number) {
		return buildUrl({ p });
	}

	function sortUrl(col: string) {
		const same = col === data.sort;
		const newDir = same && data.dir === 'asc' ? 'desc' : 'asc';
		return buildUrl({ sort: col, dir: newDir, p: 1 });
	}

	function sortIcon(col: string) {
		if (col !== data.sort) return 'material-symbols:unfold-more';
		return data.dir === 'asc'
			? 'material-symbols:arrow-upward'
			: 'material-symbols:arrow-downward';
	}

	function formatRelativeTime(iso: string): string {
		const diffMs = Date.now() - new Date(iso).getTime();
		const diffMin = Math.floor(diffMs / 60_000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `${diffHr}h ago`;
		const diffDay = Math.floor(diffHr / 24);
		return `${diffDay}d ago`;
	}
</script>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Pending Approvals</h2>
		<span class="text-sm text-surface-600-400">{data.totalCount} pending</span>
	</div>

	{#if form && !form.success && form.conflict === 'already_processed'}
		<div
			class="card preset-outlined-warning-200-800 border p-4 text-sm text-warning-600-400"
			role="alert"
			aria-live="polite"
		>
			This request was already processed by another admin. The list has been refreshed.
		</div>
	{/if}

	{#if data.items.length === 0}
		<div class="card border preset-outlined-primary-200-800 p-12 text-center" aria-label="No pending approvals">
			<div class="text-4xl mb-4" aria-hidden="true">🎉</div>
			<p class="text-lg font-semibold">All caught up!</p>
			<p class="text-surface-600-400 text-sm mt-1">There are no pending prize requests to review.</p>
		</div>
	{:else}
		<!-- Sort controls -->
		<div class="flex flex-wrap gap-2 items-center text-sm">
			<span class="text-surface-600-400">Sort by:</span>
			{#each [['requestedAt', 'Date'], ['memberName', 'Member'], ['prizeName', 'Prize'], ['coinCost', 'Coins']] as [col, label]}
				<a
					href={sortUrl(col)}
					class="inline-flex items-center gap-1 btn btn-sm h-7 {col === data.sort ? 'preset-filled-primary-500' : 'preset-outlined-primary-200-800'}"
					aria-label="Sort by {label} {col === data.sort ? (data.dir === 'asc' ? 'ascending' : 'descending') : ''}"
				>
					{label}
					<Icon icon={sortIcon(col)} class="h-3.5 w-3.5" />
				</a>
			{/each}
		</div>

		<!-- Approvals table -->
		<div class="overflow-x-auto" role="region" aria-label="Pending approvals table">
			<table class="w-full text-sm" aria-label="Pending prize approval requests">
				<thead>
					<tr class="border-b border-surface-200-800 text-left">
						<th scope="col" class="py-2 pr-4 font-semibold">Prize</th>
						<th scope="col" class="py-2 pr-4 font-semibold">Member</th>
						<th scope="col" class="py-2 pr-4 font-semibold">Requested</th>
						<th scope="col" class="py-2 pr-4 font-semibold text-right">Cost</th>
						<th scope="col" class="py-2 text-right font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item (item.redemptionId)}
						<tr class="border-b border-surface-100-900 hover:bg-surface-50-950 transition-colors">
							<td class="py-3 pr-4">
								<Icon icon={item.prizeEmoji} class="h-6 w-6 inline mr-1" aria-hidden="true" />
								<span class="font-medium">{item.prizeName}</span>
							</td>
							<td class="py-3 pr-4 text-surface-600-400">{item.memberName}</td>
							<td class="py-3 pr-4 text-surface-500">
								<time datetime={item.requestedAt}>{formatRelativeTime(item.requestedAt)}</time>
							</td>
							<td class="py-3 pr-4 text-right">
								<span class="badge preset-tonal-warning font-semibold" aria-label="{item.coinCost} coins">
									<Icon icon="noto:coin" class="h-3.5 w-3.5 inline mr-0.5" aria-hidden="true" />{item.coinCost}
								</span>
							</td>
							<td class="py-3 text-right">
								<div class="flex justify-end gap-2">
									<!-- Fulfill form -->
									<form
										method="POST"
										action="?/fulfill"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												await invalidateAll();
											};
										}}
									>
										<input type="hidden" name="redemptionId" value={item.redemptionId} />
										<button
											type="submit"
											class="btn btn-sm preset-filled-success-500 h-7"
											aria-label="Fulfill prize request for {item.memberName}: {item.prizeName}"
										>
											Fulfill
										</button>
									</form>

									<!-- Dismiss button -->
									<button
										type="button"
										class="btn btn-sm preset-outlined-error-200-800 h-7"
										aria-label="Dismiss prize request for {item.memberName}: {item.prizeName}"
										onclick={() => {
											dismissTarget = {
												redemptionId: item.redemptionId,
												memberName: item.memberName,
												prizeName: item.prizeName,
												prizeEmoji: item.prizeEmoji
											};
										}}
									>
										Dismiss
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.totalCount > data.pageSize}
			<div class="flex justify-center items-center mt-4">
				<Pagination
					count={data.totalCount}
					pageSize={data.pageSize}
					page={data.page}
					type="link"
					getPageUrl={(details) => pageUrl(details.page)}
					onPageChange={(e) => goto(pageUrl(e.page))}
				>
					<Pagination.PrevTrigger>
						<ArrowLeftIcon class="size-4" />
					</Pagination.PrevTrigger>
					<Pagination.Context>
						{#snippet children(pagination)}
							{#each pagination().pages as pg, index (pg)}
								{#if pg.type === 'page'}
									<Pagination.Item {...pg}>{pg.value}</Pagination.Item>
								{:else}
									<Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>
								{/if}
							{/each}
						{/snippet}
					</Pagination.Context>
					<Pagination.NextTrigger>
						<ArrowRightIcon class="size-4" />
					</Pagination.NextTrigger>
				</Pagination>
			</div>
		{/if}
	{/if}
</section>

<!-- Hidden form for dismiss action — submitted programmatically from the dialog -->
<form
	bind:this={dismissFormEl}
	method="POST"
	action="?/dismiss"
	use:enhance={() => {
		return async ({ update }) => {
			dismissTarget = null;
			await update();
			await invalidateAll();
		};
	}}
>
	<input type="hidden" name="redemptionId" value={dismissTarget?.redemptionId ?? ''} />
</form>

<!-- Dismiss confirmation dialog -->
<Dialog
	open={!!dismissTarget}
	onOpenChange={(o) => { if (!o) dismissTarget = null; }}
>
	<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm" />
	<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<Dialog.Content class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-5 shadow-xl">
			<div class="flex flex-col gap-2">
				<Dialog.Title class="text-lg font-bold">Dismiss Request?</Dialog.Title>
				<Dialog.Description class="text-sm text-surface-600-400 space-y-1">
					<div>
						<p class="text-center">You're about to dismiss <strong>{dismissTarget?.memberName}'s</strong> request for</p>
						<p class="text-center my-4">
							<strong class="text-lg">
								<Icon icon={dismissTarget?.prizeEmoji ?? ''} class="h-8 w-8 inline" aria-hidden="true" /> {dismissTarget?.prizeName}
							</strong>
						</p>
					</div>
					<p class="text-error-400-600 text-center">Coins will <strong>not</strong> be refunded. This cannot be undone.</p>
				</Dialog.Description>
			</div>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					class="btn preset-outlined-surface-200-800"
					onclick={() => { dismissTarget = null; }}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn preset-filled-error-500"
					onclick={() => dismissFormEl?.requestSubmit()}
				>
					Dismiss
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Positioner>
</Dialog>
