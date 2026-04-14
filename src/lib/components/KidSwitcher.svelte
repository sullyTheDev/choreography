<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		kids: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
		activeKidId: string | null;
	}

	let { kids, activeKidId }: Props = $props();

	function kidUrl(kidId: string): string {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('kid', kidId);
		return `${page.url.pathname}?${params.toString()}`;
	}
</script>

{#if kids.length > 1}
	<nav class="flex gap-1" aria-label="Switch kid">
		{#each kids as kid (kid.id)}
			<a
				href={kidUrl(kid.id)}
				class="btn btn-lg rounded-full {kid.id === activeKidId ? 'preset-filled-primary-500' : 'preset-outlined-primary-500'}"
				aria-current={kid.id === activeKidId ? 'page' : undefined}
				title={kid.displayName}
			>
				<span aria-hidden="true">{kid.avatarEmoji}</span>
				<span>{kid.displayName}</span>
			</a>
		{/each}
	</nav>
{/if}
