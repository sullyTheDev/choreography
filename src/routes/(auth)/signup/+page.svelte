<script lang="ts">
    import { enhance } from "$app/forms";
    import { onMount, onDestroy } from 'svelte';
    import { fly, scale, fade } from 'svelte/transition';
    import { elasticOut, cubicOut } from 'svelte/easing';
    import Icon from '@iconify/svelte';
    import { AVATAR_EMOJI_OPTIONS } from '$lib/icons';
    import type { ActionData } from "./$types.js";

    let { form }: { form: ActionData } = $props();
    let submitting = $state(false);

    const CHORE_ICONS = [
        'noto:broom',
        'noto:sponge',
        'noto:wastebasket',
        'noto:basket',
        'noto:fork-and-knife-with-plate',
        'noto:soap',
        'noto:bed',
        'noto:potted-plant',
    ];
    let choreIconIndex = $state(0);
    let checkmarkKey = $state(0);
    let coinKey = $state(0);
    let giftKey = $state(0);
    let trophyKey = $state(0);
    let choreInterval: ReturnType<typeof setInterval>;

    onMount(() => {
        choreInterval = setInterval(() => {
            choreIconIndex = (choreIconIndex + 1) % CHORE_ICONS.length;
            setTimeout(() => { checkmarkKey++; }, 700);
            setTimeout(() => { coinKey++; }, 1400);
            setTimeout(() => { giftKey++; }, 2100);
            setTimeout(() => { trophyKey++; }, 2800);
        }, 4000);
    });

    onDestroy(() => clearInterval(choreInterval));
</script>

<svelte:head>
    <title>Sign Up — Chore·ography</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-50-950 relative overflow-hidden">
    <!-- Decorative background icons -->
    <div class="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <Icon icon="noto:star"         class="absolute top-10  right-10  h-10 w-10 opacity-45 float-a" />
        <Icon icon="noto:sparkles"     class="absolute top-20  left-8    h-8  w-8  opacity-45 float-b" />
        <Icon icon="noto:party-popper" class="absolute bottom-20 left-8   h-10 w-10 opacity-45 float-c" />
        <Icon icon="noto:broom"        class="absolute top-1/3 right-5   h-9  w-9  opacity-50 float-d" />
        <Icon icon="noto:coin"         class="absolute top-1/4 left-6    h-8  w-8  opacity-45 float-e" />
        <Icon icon="noto:trophy"       class="absolute bottom-28 right-8  h-8  w-8  opacity-45 float-f" />
        <Icon icon="noto:wrapped-gift" class="absolute bottom-12 left-1/3 h-9  w-9  opacity-50 float-g" />
        <Icon icon="noto:rainbow"      class="absolute top-8   left-1/3  h-8  w-8  opacity-50 float-h" />
    </div>

    <div class="flex flex-col items-center w-full max-w-sm relative z-10">
    <!-- App branding -->
    <div class="text-center mb-4">
        <p class="text-3xl font-extrabold tracking-tight">Chore<span class="text-primary-500">·</span>ography</p>
        <p class="text-sm text-surface-500 mt-0.5">Family chores, perfectly orchestrated</p>
    </div>

    <div class="card preset-filled-surface-100-900 w-full shadow-xl">
        <!-- Card header banner -->
        <div class="flex justify-center gap-3 pt-6 pb-2 items-center">
            <div class="relative h-8 w-8 overflow-hidden">
                {#key choreIconIndex}
                    <div class="absolute inset-0 flex items-center justify-center"
                         in:fly={{ y: 32, duration: 400 }}
                         out:fly={{ y: -32, duration: 400 }}>
                        <Icon icon={CHORE_ICONS[choreIconIndex]} class="h-8 w-8" />
                    </div>
                {/key}
            </div>
            {#key checkmarkKey}
                <div class="h-8 w-8" in:scale={{ start: 0.2, duration: 700, easing: elasticOut }}>
                    <Icon icon="noto:check-mark-button" class="h-8 w-8" />
                </div>
            {/key}
            {#key coinKey}
                <div class="h-8 w-8 shimmer-anim">
                    <Icon icon="noto:coin" class="h-8 w-8" />
                </div>
            {/key}
            {#key giftKey}
                <div class="h-8 w-8" in:scale={{ start: 0.7, duration: 500, easing: elasticOut }}>
                    <Icon icon="noto:wrapped-gift" class="h-8 w-8" />
                </div>
            {/key}
            {#key trophyKey}
                <div class="h-8 w-8 wiggle-anim">
                    <Icon icon="noto:trophy" class="h-8 w-8" />
                </div>
            {/key}
        </div>

        <div class="px-6 pb-6 space-y-4">
            <div class="text-center">
                <h1 class="text-2xl font-extrabold">Set the stage for your family</h1>
                <p class="text-sm text-surface-600-400 mt-0.5">
                    Create chores, earn coins, and redeem awesome rewards <Icon icon="noto:star-struck" class="inline h-4 w-4" />
                </p>
            </div>

            {#if form?.error}
                <div class="card preset-tonal-error p-3 flex items-start gap-2">
                    <Icon icon="noto:warning" class="h-4 w-4 mt-0.5 shrink-0" />
                    <p class="text-sm" role="alert">{form.error}</p>
                </div>
            {/if}

            <form
                method="POST"
                class="space-y-3"
                use:enhance={() => {
                    submitting = true;
                    return async ({ update }) => {
                        await update();
                        submitting = false;
                    };
                }}
            >
                <label class="label">
                    <span class="flex items-center gap-1"><Icon icon="noto:house" class="h-3.5 w-3.5" /> Family name</span>
                    <input class="input" id="familyName" name="familyName" type="text" placeholder="The Smiths" required autocomplete="off" />
                </label>

                <label class="label">
                    <span class="flex items-center gap-1"><Icon icon="noto:adult" class="h-3.5 w-3.5" /> Your name</span>
                    <input class="input" id="displayName" name="displayName" type="text" placeholder="Mom or Dad" required autocomplete="name" />
                </label>

                <label class="label">
                    <span class="flex items-center gap-1"><Icon icon="noto:smiling-face" class="h-3.5 w-3.5" /> Your avatar <span class="text-xs text-surface-500 font-normal">(optional)</span></span>
                    <select class="select" id="avatarEmoji" name="avatarEmoji">
                        {#each AVATAR_EMOJI_OPTIONS as option}
                            <option value={option.value} selected={option.value === '👤'}>{option.label}</option>
                        {/each}
                    </select>
                </label>

                <label class="label">
                    <span class="flex items-center gap-1"><Icon icon="noto:envelope" class="h-3.5 w-3.5" /> Email</span>
                    <input class="input" id="email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
                </label>

                <label class="label">
                    <span class="flex items-center gap-1">
                        <Icon icon="noto:locked" class="h-3.5 w-3.5" /> Password
                        <span class="text-xs text-surface-500 font-normal">(8+ characters)</span>
                    </span>
                    <input class="input" id="password" name="password" type="password" required autocomplete="new-password" minlength="8" />
                </label>

                <button type="submit" class="btn preset-filled-primary-500 w-full gap-2" disabled={submitting}>
                    {#if submitting}
                        <Icon icon="noto:hourglass-not-done" class="h-4 w-4" /> Creating your family…
                    {:else}
                        <Icon icon="noto:party-popper" class="h-4 w-4" /> Create family account
                    {/if}
                </button>
            </form>

            <p class="text-center text-sm text-surface-600-400">
                Already have an account? <a href="/login" class="anchor font-semibold">Sign in</a> <Icon icon="noto:waving-hand" class="inline h-3.5 w-3.5" />
            </p>
        </div>
    </div>
    </div>
</div>

<style>
    /* Background float animations — :global so they pierce the Icon component */
    :global(.float-a) { animation: drift-a  9s ease-in-out infinite; }
    :global(.float-b) { animation: drift-b 11s ease-in-out infinite 1.5s; }
    :global(.float-c) { animation: drift-c 13s ease-in-out infinite 0.8s; }
    :global(.float-d) { animation: drift-d 10s ease-in-out infinite 2.2s; }
    :global(.float-e) { animation: drift-e 12s ease-in-out infinite 0.4s; }
    :global(.float-f) { animation: drift-f  8s ease-in-out infinite 3.1s; }
    :global(.float-g) { animation: drift-g 14s ease-in-out infinite 1.0s; }
    :global(.float-h) { animation: drift-h 10s ease-in-out infinite 2.7s; }

    @keyframes drift-a {
        0%, 100% { transform: translate(0,    0)    rotate(-12deg); }
        33%      { transform: translate(-6px, -8px) rotate(-16deg); }
        66%      { transform: translate(4px,   5px) rotate(-8deg);  }
    }
    @keyframes drift-b {
        0%, 100% { transform: translate(0,   0)    rotate(6deg); }
        40%      { transform: translate(7px, -6px) rotate(10deg); }
        70%      { transform: translate(-5px, 4px) rotate(3deg);  }
    }
    @keyframes drift-c {
        0%, 100% { transform: translate(0,    0)     rotate(12deg); }
        50%      { transform: translate(-8px, -10px) rotate(6deg);  }
    }
    @keyframes drift-d {
        0%, 100% { transform: translate(0,   0)    rotate(-6deg);  }
        35%      { transform: translate(6px,  7px) rotate(-2deg);  }
        70%      { transform: translate(-4px,-5px) rotate(-10deg); }
    }
    @keyframes drift-e {
        0%, 100% { transform: translate(0,    0)    rotate(12deg); }
        45%      { transform: translate(-7px, -9px) rotate(7deg);  }
    }
    @keyframes drift-f {
        0%, 100% { transform: translate(0,   0)    rotate(6deg);  }
        30%      { transform: translate(5px, -7px) rotate(12deg); }
        65%      { transform: translate(-6px, 4px) rotate(2deg);  }
    }
    @keyframes drift-g {
        0%, 100% { transform: translate(0,    0)    rotate(-12deg); }
        40%      { transform: translate(8px,   6px) rotate(-6deg);  }
        75%      { transform: translate(-5px, -4px) rotate(-16deg); }
    }
    @keyframes drift-h {
        0%, 100% { transform: translate(0,   0); }
        50%      { transform: translate(6px, -8px) rotate(5deg); }
    }

    /* Card banner animations */
    :global(.shimmer-anim) { animation: shimmer 0.8s ease-out; }
    :global(.wiggle-anim)  { animation: wiggle  0.6s ease-in-out; }
    @keyframes shimmer {
        0%   { filter: brightness(1)   saturate(1);   transform: scale(1);    }
        30%  { filter: brightness(1.7) saturate(2);   transform: scale(1.18); }
        60%  { filter: brightness(1.3) saturate(1.5); transform: scale(1.06); }
        100% { filter: brightness(1)   saturate(1);   transform: scale(1);    }
    }

    @keyframes wiggle {
        0%,  100% { transform: rotate(0deg);   }
        20%       { transform: rotate(-14deg); }
        40%       { transform: rotate(11deg);  }
        60%       { transform: rotate(-7deg);  }
        80%       { transform: rotate(4deg);   }
    }
</style>

