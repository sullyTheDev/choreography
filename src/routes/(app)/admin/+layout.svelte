<script lang="ts">
    import type { Snippet } from "svelte";
    import Icon from "@iconify/svelte";
    import { page } from "$app/state";

    let { children }: { children: Snippet } = $props();
    const isLanding = $derived(page.url.pathname === '/admin');
</script>

<main class="flex-1 max-w-screen-lg mx-auto w-full px-4 py-8">
    {#if !isLanding}
    <a
        href="/admin"
        class="inline-flex items-center gap-1 text-primary-600 hover:underline mb-2"
    >
        <Icon icon="material-symbols:arrow-back" class="w-4 h-4" />
        Back to Admin
    </a>
    {/if}
    {@render children()}
</main>

