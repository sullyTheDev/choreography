<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import NavTabs from '$lib/components/NavTabs.svelte';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const activeMember = $derived(data.members.find((m) => m.id === data.activeMemberId));
	const coinBalance = $derived(activeMember?.coinBalance ?? 0);
</script>

<div class="min-h-dvh flex flex-col">
	<Header
		appName="Chore·ography"
		familyName={data.family.name}
		user={data.user}
		members={data.members}
		activeMemberId={data.activeMemberId}
		{coinBalance}
	/>

	<NavTabs role={data.user.role} activeMemberId={data.activeMemberId} />

	<main class="flex-1 max-w-screen-lg mx-auto w-full px-4 py-8">
		{@render children()}
	</main>
</div>
