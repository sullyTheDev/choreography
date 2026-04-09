<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import NavTabs from '$lib/components/NavTabs.svelte';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const activeKid = $derived(data.kids.find((k) => k.id === data.activeKidId));
	const coinBalance = $derived(activeKid?.coinBalance ?? 0);
</script>

<div class="app-shell">
	<Header
		appName="Chore·ography"
		familyName={data.family.name}
		user={data.user}
		kids={data.kids}
		activeKidId={data.activeKidId}
		{coinBalance}
	/>

	<NavTabs role={data.user.role} activeKidId={data.activeKidId} />

	<main class="page-content">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
	}
</style>
