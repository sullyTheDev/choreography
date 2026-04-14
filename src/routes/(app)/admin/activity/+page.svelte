<script lang="ts">
import Icon from '@iconify/svelte';
import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
import { Pagination } from '@skeletonlabs/skeleton-svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { PageData } from './$types.js';

const PAGE_SIZE = 5;

let { data }: { data: PageData } = $props();

const activeFilter = $derived(page.url.searchParams.get('filter') ?? 'all');
const activeMember = $derived(page.url.searchParams.get('member') ?? 'all');

function isActive(val: string) {
	return activeFilter === val;
}

function buildUrl(params: { filter?: string; member?: string; p?: number }) {
	const f = params.filter ?? activeFilter;
	const m = params.member ?? activeMember;
	const pg = params.p ?? 1;
	const qs = new URLSearchParams();
	if (f !== 'all') qs.set('filter', f);
	if (m !== 'all') qs.set('member', m);
	qs.set('page', String(pg));
	return `?${qs.toString()}`;
}

function filterUrl(f: string) {
	return buildUrl({ filter: f });
}

function memberUrl(m: string) {
	return buildUrl({ member: m });
}

function pageUrl(p: number) {
	return buildUrl({ p });
}

function formatDate(iso: string): string {
return new Date(iso).toLocaleString('en-US', {
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
});
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Activity Log</h1>
<span class="text-sm text-surface-500">{data.totalCount} events</span>
</div>

<!-- Filter tabs -->
<div class="flex flex-wrap gap-2 items-center">
	{#each [['all', 'All', 'material-symbols:list'], ['completions', 'Completions', 'noto:check-mark-button'], ['redemptions', 'Redemptions', 'noto:wrapped-gift']] as [val, label, icon]}
		<a
			href={filterUrl(val)}
			class="btn btn-sm h-8 {isActive(val) ? 'preset-filled-primary-500' : 'preset-outlined-primary-200-800'}"
		>
			<Icon icon={icon} class="h-4 w-4" />{label}
		</a>
	{/each}

	<select
		class="select select-sm h-8 w-auto"
		value={activeMember}
		onchange={(e) => goto(memberUrl(e.currentTarget.value))}
	>
		<option value="all">All members</option>
		{#each data.members as m}
			<option value={m.id}>{m.avatarEmoji} {m.displayName}</option>
		{/each}
	</select>
</div>

{#if data.events.length === 0}
<p class="text-center text-surface-500 py-12">No activity yet. Once members start completing chores and redeeming prizes, you'll see it here.</p>
{:else}
<div class="flex flex-col gap-2" aria-label="Activity log">
{#each data.events as event}
<div class="card border preset-outlined-primary-200-800 shadow-md flex items-center gap-4 p-4 border-l-4 {event.type === 'chore_completion' ? 'border-l-success-500' : 'border-l-primary-500'}">
<div class="text-2xl shrink-0" aria-hidden="true">{event.memberAvatarEmoji}</div>
<div class="flex-1 flex flex-col gap-0.5">
<div class="text-sm">
<strong>{event.memberName}</strong>
{#if event.type === 'chore_completion'}
completed <em>"{event.title}"</em>
{:else}
redeemed <em>"{event.title}"</em>
{/if}
</div>
<div class="flex gap-2 items-center">
<span class="text-sm font-semibold {event.type === 'chore_completion' ? 'text-success-600-400' : 'text-primary-500'}">
{event.type === 'chore_completion' ? '+' : '-'}<Icon icon="noto:coin" class="h-4 w-4 inline" /> {event.coins}
</span>
<span class="text-xs text-surface-500">{formatDate(event.occurredAt)}</span>
</div>
</div>
<div class="text-xl shrink-0" aria-hidden="true">
{#if event.type === 'chore_completion'}
<Icon icon="noto:check-mark-button" class="h-5 w-5" />
{:else}
<Icon icon="noto:wrapped-gift" class="h-5 w-5" />
{/if}
</div>
</div>
{/each}
</div>

<div class="flex justify-center items-center">
	<Pagination
		count={data.totalCount}
		pageSize={PAGE_SIZE}
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
</div>
