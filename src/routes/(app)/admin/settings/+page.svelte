<script lang="ts">
    import Icon from "@iconify/svelte";
    import { Dialog, Portal, Toast, createToaster } from "@skeletonlabs/skeleton-svelte";
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";

    let { data, form } = $props<{
        data: {
            family: {
                id: string;
                name: string;
                familyCode: string;
                leaderboardResetDay: number;
            };
        };
        form?: { success?: boolean; error?: string; deleted?: boolean } | null;
    }>();

    const DAY_NAMES = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];
    let submitting = $state(false);
    let deleteConfirm = $state('');
    let showDeletedDialog = $state(false);
    const toaster = createToaster();
</script>

<section class="space-y-4">
    <h2 class="text-2xl font-bold">Family Settings</h2>

    {#if form?.success}
        <p class="text-sm text-success-600-400" role="status">
            Settings saved successfully.
        </p>
    {/if}
    {#if form?.error}
        <p class="text-sm text-error-600-400" role="alert">{form.error}</p>
    {/if}

    <!-- Update family -->
    <div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-3">
        <h3 class="text-lg font-semibold">Family Details</h3>
        <form
            method="POST"
            action="?/updateFamily"
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
                <span>Family Name</span>
                <input
                    id="familyName"
                    name="familyName"
                    type="text"
                    class="input"
                    value={data.family.name}
                    required
                />
            </label>
            <label class="label">
                <span>Leaderboard Reset Day</span>
                <select
                    id="leaderboardResetDay"
                    name="leaderboardResetDay"
                    class="select"
                >
                    {#each DAY_NAMES as day, i (i)}
                        <option
                            value={i + 1}
                            selected={i + 1 === data.family.leaderboardResetDay}
                        >
                            {day}
                        </option>
                    {/each}
                </select>
            </label>
            <button
                type="submit"
                class="btn preset-filled-primary-500"
                disabled={submitting}>Save Changes</button
            >
        </form>
    </div>

    <!-- Family code info -->
    <div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-2">
        <h3 class="text-lg font-semibold">Family Code</h3>
        <p class="text-sm text-surface-600-400">
            Kids use this code to log in:
            <span class="inline-flex items-center gap-2">
                <strong class="font-mono text-lg tracking-widest"
                    >{data.family.familyCode}</strong
                >
                <button
                    type="button"
                    class="btn btn-xs btn-ghost px-2 py-1"
                    title="Copy family code"
                    aria-label="Copy family code"
                    onclick={() => {
                        navigator.clipboard.writeText(data.family.familyCode);
                        toaster.success({
                            title: "Copied!",
                            description: "Family code copied to clipboard.",
                            type: "success",
                        });
                    }}
                >
                    <Icon
                        icon="material-symbols:content-copy"
                        class="w-4 h-4"
                    />
                </button>
            </span>
        </p>
    </div>

    <!-- Export data -->
    <div class="card border preset-outlined-primary-200-800 shadow-md p-4 space-y-2">
        <h3 class="text-lg font-semibold">Export Data</h3>
        <p class="text-sm text-surface-600-400">
            Download a full JSON export of all family data.
        </p>
        <form method="POST" action="?/exportData">
            <button type="submit" class="btn preset-filled-primary-500"
                >Export Data</button
            >
        </form>
    </div>

    <!-- Delete family -->
    <div class="card preset-tonal-error p-4 space-y-3 shadow-md">
        <h3 class="text-lg font-semibold">Danger Zone</h3>
        <p class="text-sm">
            Permanently delete this family and all associated data. This action
            cannot be undone.
        </p>
        <form
            method="POST"
            action="?/deleteFamily"
            class="space-y-3"
            use:enhance={() => {
                submitting = true;
                return async ({ result, update }) => {
                    if (result.type === 'success' && (result.data as Record<string, unknown>)?.deleted) {
                        submitting = false;
                        showDeletedDialog = true;
                        return; // skip update() — page load would redirect since session is gone
                    }
                    await update({ reset: false });
                    submitting = false;
                };
            }}
        >
            <label class="label">
                <span>Type <strong>DELETE</strong> to confirm</span>
                <input
                    id="confirm"
                    name="confirm"
                    type="text"
                    class="input"
                    placeholder="DELETE"
                    bind:value={deleteConfirm}
                    required
                />
            </label>
            <button
                type="submit"
                class="btn preset-filled-error-500"
                disabled={submitting || deleteConfirm !== 'DELETE'}>Delete Family</button
            >
        </form>
    </div>
</section>

<!-- Family deleted confirmation dialog -->
<Dialog
    open={showDeletedDialog}
    closeOnEscape={false}
    closeOnInteractOutside={false}
>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/70" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
            <Dialog.Content class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl">
                <div class="flex flex-col items-center text-center gap-3">
                    <Icon icon="noto:disappointed-face" class="h-12 w-12" />
                    <Dialog.Title class="text-xl font-bold">So long, farewell…</Dialog.Title>
                    <Dialog.Description class="text-sm text-surface-600-400 space-y-2">
                        <p>We're sad to see your family go. All data has been permanently deleted from the database and cannot be recovered.</p>
                        <p>You can rejoin by signing up at any time. We hope to see you again someday!</p>
                    </Dialog.Description>
                </div>
                <button
                    type="button"
                    class="btn preset-filled-primary-500 w-full"
                    onclick={() => goto('/login')}
                >
                    Go to Login
                </button>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>

<Toast.Group {toaster}>
    {#snippet children(toast)}
        <Toast
            {toast}
            class="card preset-filled shadow-lg p-4 flex gap-3 items-start"
        >
            <Toast.Message>
                <Toast.Title class="font-semibold">{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
            </Toast.Message>
            <Toast.CloseTrigger class="btn btn-icon btn-sm ml-auto"
                >�</Toast.CloseTrigger
            >
        </Toast>
    {/snippet}
</Toast.Group>

