<script lang="ts">
    import { enhance } from "$app/forms";
    import Icon from '@iconify/svelte';
    import confetti from "canvas-confetti";
    import { resolveIconifyName } from '$lib/icons';
    import CoinBadge from './CoinBadge.svelte';
    import FrequencyBadge from './FrequencyBadge.svelte';

    interface Props {
        id: string;
        emoji: string;
        title: string;
        description: string;
        frequency: "daily" | "weekly";
        coinValue: number;
        assignedKidName: string | null;
        isCompleted: boolean;
        activeMemberId: string | null;
    }

    let {
        id,
        emoji,
        title,
        description,
        frequency,
        coinValue,
        assignedKidName,
        isCompleted,
        activeMemberId,
    }: Props = $props();

    let submitting = $state(false);

    function fireConfetti() {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f97316', '#facc15', '#34d399', '#60a5fa', '#f472b6'],
        });
    }
</script>

<div
    class="card border  shadow-md p-4 {isCompleted
        ? 'preset-tonal-primary border-primary-200-800'
        : 'preset-outlined-primary-200-800'}"
>
    <div class="flex items-center gap-4">
        <div class="shrink-0 flex flex-col items-center gap-1">
            <span class="text-4xl" aria-hidden="true">
                <Icon icon={resolveIconifyName(emoji)} class="h-12 w-12" />
            </span>
            <CoinBadge value={coinValue} />
        </div>

        <div class="flex-1 flex flex-col gap-1 min-w-0">
            <div class="flex items-center flex-wrap gap-2">
                <strong class="text-xl font-semibold {isCompleted ? 'line-through' : ''}">{title}</strong>
                <div class="flex gap-1 flex-wrap">
                    <FrequencyBadge value={frequency} />
                </div>
            </div>
            {#if description}
                <p class="text-sm text-surface-700-300 m-0">{description}</p>
            {/if}
            <div>
                    {#if assignedKidName}
                        <span class="badge preset-tonal-surface text-xs py-1 px-1.5"
                            ><Icon icon="noto:bust-in-silhouette" class="h-4 w-4" /> {assignedKidName}</span
                        >
                    {/if}
            </div>
        </div>

        <div class="shrink-0">
            {#if isCompleted}
                <div
                    class="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg"
                    aria-label="Completed"
                >
                    <Icon icon="material-symbols:check" class="h-6 w-6 text-primary-contrast-500" />
                </div>
            {:else}
                <form
                    method="POST"
                    action="?/complete"
                    use:enhance={() => {
                        submitting = true;
                        return async ({ update, result }) => {
                            await update();
                            submitting = false;
                            if (result.type === 'success' || result.type === 'redirect') {
                                fireConfetti();
                            }
                        };
                    }}
                >
                    <input type="hidden" name="choreId" value={id} />
                    {#if activeMemberId}
                        <input type="hidden" name="memberId" value={activeMemberId} />
                    {/if}
                    <button
                        type="submit"
                        class="btn preset-outlined-primary-500 w-10 h-10 rounded-full p-0 chore-wiggle-btn"
                        aria-label="Mark {title} as complete"
                        disabled={submitting}
                    >
                        <Icon icon="material-symbols:check" class="h-6 w-6" />
                    </button>
                <style>
                .chore-wiggle-btn {
                    transition: transform 0.15s;
                }
                .chore-wiggle-btn:hover {
                    animation: wiggle 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes wiggle {
                    0% { transform: rotate(0deg); }
                    15% { transform: rotate(-15deg); }
                    30% { transform: rotate(10deg); }
                    45% { transform: rotate(-10deg); }
                    60% { transform: rotate(6deg); }
                    75% { transform: rotate(-4deg); }
                    100% { transform: rotate(0deg); }
                }
                </style>
                </form>
            {/if}
        </div>
    </div>
</div>
