<script lang="ts">
import Header from '$lib/components/Header.svelte';
import NavTabs from '$lib/components/NavTabs.svelte';
import MemberSwitcher from '$lib/components/MemberSwitcher.svelte';
import type { LayoutData } from '../$types.js';
import type { Snippet } from 'svelte';

let { data, children }: { data: LayoutData; children: Snippet } = $props();

const activeMember = $derived(data.members.find((m) => m.id === data.activeMemberId));
const coinBalance = $derived(activeMember?.coinBalance ?? 0);
</script>

<div class="flex flex-col">

    {#if data.members.length > 0 && false}
        <div class="flex justify-center mt-4 mb-2">
            <MemberSwitcher members={data.members} activeMemberId={data.activeMemberId} />
        </div>
    {/if}

    <NavTabs role={data.user.role} activeMemberId={data.activeMemberId} />

    <div>
        {@render children()}
    </div>
</div>
