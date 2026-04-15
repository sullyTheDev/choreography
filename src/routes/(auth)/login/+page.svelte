<script lang="ts">
import { enhance } from '$app/forms';
import { onMount, onDestroy } from 'svelte';
import { fly, scale, fade } from 'svelte/transition';
import { elasticOut, cubicOut } from 'svelte/easing';
import Icon from '@iconify/svelte';
import type { ActionData } from './$types.js';

let { form }: { form: ActionData } = $props();
let role = $state<'admin' | 'member'>('admin');
const pinPattern = '[0-9]{4,6}';
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
	<title>Sign In — Chore·ography</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-50-950 relative overflow-hidden">
	<!-- Decorative background icons -->
	<div class="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
		<Icon icon="noto:star"         class="absolute top-8   left-8    h-10 w-10 opacity-45 float-a" />
		<Icon icon="noto:sparkles"     class="absolute top-16  right-12  h-8  w-8  opacity-45 float-b" />
		<Icon icon="noto:rainbow"      class="absolute bottom-24 left-6   h-12 w-12 opacity-50 float-c" />
		<Icon icon="noto:trophy"       class="absolute top-1/3 right-6   h-9  w-9  opacity-45 float-d" />
		<Icon icon="noto:coin"         class="absolute bottom-16 right-10 h-8  w-8  opacity-45 float-e" />
		<Icon icon="noto:broom"        class="absolute bottom-32 right-1/4 h-10 w-10 opacity-50 float-f" />
		<Icon icon="noto:star-struck"  class="absolute top-1/4 left-1/4  h-8  w-8  opacity-50 float-g" />
		<Icon icon="noto:wrapped-gift" class="absolute top-12  left-1/3  h-7  w-7  opacity-45 float-h" />
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
				<h1 class="text-2xl font-extrabold">Welcome back!</h1>
				<p class="text-sm text-surface-600-400 mt-0.5">
					{#if role === 'admin'}Ready to manage the chore squad?{:else}Time to earn some coins! <Icon icon="noto:coin" class="inline h-4 w-4" />{/if}
				</p>
			</div>

			<!-- Role toggle -->
			<div class="flex gap-2 p-1 bg-surface-200-800 rounded-container" role="group" aria-label="Login as">
				<button
					type="button"
					class="btn flex-1 gap-1.5 text-sm {role === 'admin' ? 'preset-filled-primary-500 shadow' : 'hover:preset-tonal'}"
					onclick={() => (role = 'admin')}
				>
					<Icon icon="noto:envelope" class="h-4 w-4" /> Email Login
				</button>
				<button
					type="button"
					class="btn flex-1 gap-1.5 text-sm {role === 'member' ? 'preset-filled-primary-500 shadow' : 'hover:preset-tonal'}"
					onclick={() => (role = 'member')}
				>
					<Icon icon="noto:input-numbers" class="h-4 w-4" /> Pin Login
				</button>
			</div>

			{#if form?.error}
				<div class="card preset-tonal-error p-3 flex items-start gap-2">
					<Icon icon="noto:warning" class="h-4 w-4 mt-0.5 shrink-0" />
					<p class="text-sm" role="alert">{form.error}</p>
				</div>
			{/if}

			<form
				method="POST"
				action="?/login"
				class="space-y-3"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<input type="hidden" name="role" value={role} />

				{#if role === 'admin'}
					<label class="label">
						<span class="flex items-center gap-1"><Icon icon="noto:envelope" class="h-3.5 w-3.5" /> Email</span>
						<input class="input" id="email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
					</label>
					<label class="label">
						<span class="flex items-center gap-1"><Icon icon="noto:locked" class="h-3.5 w-3.5" /> Password</span>
						<input class="input" id="password" name="password" type="password" required autocomplete="current-password" />
					</label>
				{:else}
					<label class="label">
						<span class="flex items-center gap-1"><Icon icon="noto:bust-in-silhouette" class="h-3.5 w-3.5" /> Your name</span>
						<input class="input" id="displayName" name="displayName" type="text" placeholder="Emma" required autocomplete="name" />
					</label>
					<label class="label">
						<span class="flex items-center gap-1"><Icon icon="noto:locked-with-key" class="h-3.5 w-3.5" /> Your PIN</span>
						<input class="input" id="pin" name="pin" type="password" placeholder="4–6 digit PIN" required autocomplete="current-password" inputmode="numeric" pattern={pinPattern} maxlength="6" />
					</label>
				{/if}

				<button type="submit" class="btn preset-filled-primary-500 w-full gap-2" disabled={submitting}>
					{#if submitting}
						<Icon icon="noto:hourglass-not-done" class="h-4 w-4" /> Signing in…
					{:else}
						<Icon icon="noto:rocket" class="h-4 w-4" /> Let's go!
					{/if}
				</button>
			</form>

			{#if role === 'admin'}
				<p class="text-center text-sm text-surface-600-400">
					New here? <a href="/signup" class="anchor font-semibold">Create a family account</a> <Icon icon="noto:sparkles" class="inline h-3.5 w-3.5" />
				</p>
			{/if}
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
		0%, 100% { transform: translate(0,    0)    rotate(12deg); }
		33%      { transform: translate(6px,  -8px) rotate(16deg); }
		66%      { transform: translate(-4px,  5px) rotate(8deg);  }
	}
	@keyframes drift-b {
		0%, 100% { transform: translate(0,    0)    rotate(-6deg); }
		40%      { transform: translate(-7px, -6px) rotate(-10deg); }
		70%      { transform: translate(5px,   4px) rotate(-3deg);  }
	}
	@keyframes drift-c {
		0%, 100% { transform: translate(0,   0); }
		50%      { transform: translate(8px, -10px) rotate(4deg); }
	}
	@keyframes drift-d {
		0%, 100% { transform: translate(0,    0)   rotate(6deg); }
		35%      { transform: translate(-6px,  7px) rotate(2deg); }
		70%      { transform: translate(4px,  -5px) rotate(10deg); }
	}
	@keyframes drift-e {
		0%, 100% { transform: translate(0,   0)    rotate(-12deg); }
		45%      { transform: translate(7px, -9px) rotate(-7deg);  }
	}
	@keyframes drift-f {
		0%, 100% { transform: translate(0,    0)   rotate(12deg); }
		30%      { transform: translate(-5px, -7px) rotate(18deg); }
		65%      { transform: translate(6px,   4px) rotate(8deg);  }
	}
	@keyframes drift-g {
		0%, 100% { transform: translate(0,   0); }
		40%      { transform: translate(-8px,  6px) rotate(-5deg); }
		75%      { transform: translate(5px,  -4px) rotate(4deg);  }
	}
	@keyframes drift-h {
		0%, 100% { transform: translate(0,    0)    rotate(6deg); }
		50%      { transform: translate(-6px, -8px) rotate(12deg); }
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