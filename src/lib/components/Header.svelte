<script lang="ts">
import { enhance } from '$app/forms';
import { AppBar } from '@skeletonlabs/skeleton-svelte';
import KidSwitcher from './KidSwitcher.svelte';

interface Props {
appName: string;
familyName: string;
user: { id: string; displayName: string; role: 'parent' | 'kid'; avatarEmoji?: string };
kids: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
activeKidId: string | null;
coinBalance: number;
}

let { appName, familyName, user, kids, activeKidId, coinBalance }: Props = $props();
</script>

<AppBar class="sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800 shadow-sm">
	<AppBar.Toolbar class="grid-cols-[1fr_2fr_1fr]">
		<AppBar.Lead>
			<div class="flex flex-col leading-tight min-w-0">
				<a
					href={user.role === 'parent' ? '/admin/chores' : '/chores'}
					class="text-2xl font-extrabold text-primary-500 no-underline whitespace-nowrap"
				>
					{appName}
				</a>
				<span class="text-lg text-surface-500 whitespace-nowrap hidden sm:block">{familyName}</span>
			</div>
		</AppBar.Lead>
		<AppBar.Headline class="flex justify-center">
			{#if kids.length > 0}
				<KidSwitcher {kids} {activeKidId} />
			{/if}
		</AppBar.Headline>
		<AppBar.Trail class="justify-end">
			<div class="flex items-center gap-3 flex-nowrap">
				<span class="flex items-center gap-1 font-bold text-sm whitespace-nowrap" aria-label="{coinBalance} coins">
					🪙 <span>{coinBalance}</span>
				</span>
				{#if user.role === 'parent'}
					<a
						href="/admin/chores"
						class="btn btn-sm hover:preset-tonal no-underline"
					>⚙️ Manage</a>
				{/if}
				<form method="POST" action="/logout" use:enhance style="display:contents">
					<button type="submit" class="btn btn-sm hover:preset-tonal">Sign out</button>
				</form>
			</div>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>