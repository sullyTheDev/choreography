<script lang="ts">
import Icon from '@iconify/svelte';
import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
import { Pagination } from '@skeletonlabs/skeleton-svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { PageData } from './$types.js';

const PAGE_SIZE = 5;

let { data }: { data: PageData } = $props();

const activeFilter = $derived((() => {
	const filter = page.url.searchParams.get('filter') ?? 'all';
	return filter === 'redemptions' ? 'prizes' : filter;
})());
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

function eventVerb(eventType: string): string {
	if (eventType === 'chore_completed') return 'completed';
	if (eventType === 'prize_purchased') return 'purchased';
	if (eventType === 'prize_redeemed') return 'redeemed';
	if (eventType === 'prize_fulfilled') return 'fulfilled';
	return 'updated';
}

function eventIcon(eventType: string): string {
	if (eventType === 'chore_completed') return 'noto:check-mark-button';
	if (eventType === 'prize_purchased') return 'noto:shopping-cart';
	if (eventType === 'prize_redeemed') return 'noto:hourglass-not-done';
	if (eventType === 'prize_fulfilled') return 'noto:wrapped-gift';
	return 'material-symbols:history';
}

function eventAccentClass(eventType: string): string {
	if (eventType === 'chore_completed') return 'border-l-success-500 text-success-600-400';
	if (eventType === 'prize_purchased') return 'border-l-warning-500 text-warning-600-400';
	if (eventType === 'prize_redeemed') return 'border-l-primary-500 text-primary-500';
	if (eventType === 'prize_fulfilled') return 'border-l-tertiary-500 text-tertiary-600-400';
	return 'border-l-surface-500 text-surface-600-400';
}

function eventBorderClass(eventType: string): string {
	return eventAccentClass(eventType).split(' ')[0] ?? 'border-l-surface-500';
}

function eventTextClass(eventType: string): string {
	return eventAccentClass(eventType).split(' ')[1] ?? 'text-surface-600-400';
}
</script>

<div class="space-y-4">
<div class="flex justify-between items-center">
<h1 class="text-2xl font-bold">Activity Log</h1>
<span class="text-sm text-surface-500">{data.totalCount} events</span>
</div>

<!-- Filter tabs -->
<div class="flex flex-wrap gap-2 items-center">
	{#each [['all', 'All', 'material-symbols:list'], ['completions', 'Completions', 'noto:check-mark-button'], ['prizes', 'Prize Events', 'noto:wrapped-gift']] as [val, label, icon]}
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
<p class="text-center text-surface-500 py-12">No activity yet. Once members start completing chores and using prizes, you'll see it here.</p>
{:else}
<div class="flex flex-col gap-2" aria-label="Activity log">
{#each data.events as event}
<div class="card border preset-outlined-primary-200-800 shadow-md flex items-center gap-4 p-4 border-l-4 {eventBorderClass(event.eventType)}">
<div class="text-2xl shrink-0" aria-hidden="true">{event.memberAvatarEmoji}</div>
<div class="flex-1 flex flex-col gap-0.5">
<div class="text-sm">
<strong>{event.memberName}</strong>
{eventVerb(event.eventType)} <em>"{event.title}"</em>
</div>
<div class="flex gap-2 items-center">
<span class="text-sm font-semibold {eventTextClass(event.eventType)}">
{event.deltaCoins > 0 ? '+' : event.deltaCoins < 0 ? '-' : ''}<Icon icon="noto:coin" class="h-4 w-4 inline" /> {Math.abs(event.deltaCoins)}
</span>
<span class="text-xs text-surface-500">{formatDate(event.occurredAt)}</span>
</div>
</div>
<div class="text-xl shrink-0" aria-hidden="true">
<Icon icon={eventIcon(event.eventType)} class="h-5 w-5" />
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
