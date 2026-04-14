<script lang="ts">
    import { enhance } from "$app/forms";
    import confetti from "canvas-confetti";

    interface Props {
        id: string;
        emoji: string;
        title: string;
        description: string;
        frequency: "daily" | "weekly";
        coinValue: number;
        assignedKidName: string | null;
        isCompleted: boolean;
        activeKidId: string | null;
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
        activeKidId,
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
        ? 'bg-primary-100-900 border-primary-200-800'
        : 'bg-white border-surface-200'}"
>
    <div class="flex items-center gap-3">
        <span class="text-4xl shrink-0" aria-hidden="true">{emoji}</span>

        <div class="flex-1 flex flex-col gap-1 min-w-0">
            <div class="flex items-center flex-wrap gap-2">
                <strong class="text-base font-semibold {isCompleted ? 'line-through' : ''}">{title}</strong>
                <div class="flex gap-1 flex-wrap">
                    <span class="badge preset-tonal-secondary text-xs py-1 px-1.5"
                        >{frequency}</span
                    >
                </div>
            </div>
            {#if description}
                <p class="text-sm text-surface-700-300 m-0">{description}</p>
            {/if}
            <div>
                                    <span class="badge preset-tonal-warning text-xs py-1 px-1.5"
                        >🪙 {coinValue}</span
                    >
                    {#if assignedKidName}
                        <span class="badge preset-tonal-surface text-xs py-1 px-1.5"
                            >→ {assignedKidName}</span
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
                    ✓
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
                    {#if activeKidId}
                        <input type="hidden" name="kidId" value={activeKidId} />
                    {/if}
                    <button
                        type="submit"
                        class="btn btn-sm preset-outlined-primary-500 w-10 h-10 rounded-full p-0"
                        aria-label="Mark {title} as complete"
                        disabled={submitting}
                    >
                        ○
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>
