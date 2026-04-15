<script lang="ts">
import { enhance } from '$app/forms';
import { AppBar, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
import MemberSwitcher from './MemberSwitcher.svelte';

interface Props {
appName: string;
familyName: string;
user: { id: string; displayName: string; role: 'admin' | 'member'; avatarEmoji: string };
members: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
activeMemberId: string | null;
coinBalance: number;
}

let { appName, familyName, user, members, activeMemberId, coinBalance }: Props = $props();
</script>

<AppBar class="sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800 shadow-sm">
	<AppBar.Toolbar class="grid-cols-[1fr_2fr_1fr]">
		<AppBar.Lead>
			<div class="flex flex-col leading-tight min-w-0">
				<a
					href='/member/chores'
					class="text-2xl font-extrabold text-primary-500 no-underline whitespace-nowrap"
				>
					{appName}
				</a>
				<span class="text-lg text-surface-500 whitespace-nowrap hidden sm:block">{familyName}</span>
			</div>
		</AppBar.Lead>
		<AppBar.Headline class="flex justify-center">
			<!-- MemberSwitcher moved to layout -->
		</AppBar.Headline>
		<AppBar.Trail class="justify-end">
			   <div class="flex items-center gap-3 flex-nowrap">
				   <Menu>
					   <Menu.Trigger>
						   <span class="avatar-emoji-header cursor-pointer" aria-hidden="true">{user.avatarEmoji}</span>
					   </Menu.Trigger>
					   <Portal>
						   <Menu.Positioner class="z-50!">
							   <Menu.Content class="min-w-40">
								   {#if user.role === 'admin'}
									   <Menu.Item value="manage">
									   <a href="/admin" class="flex items-center gap-2 w-full px-2 py-2 no-underline text-inherit">
											   <span>Manage</span>
										   </a>
									   </Menu.Item>
									   <Menu.Item value="kiosk">
										   <a href="/kiosk/chores" class="flex items-center gap-2 w-full px-2 py-2 no-underline text-inherit">
											   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
											   <span>Kiosk Mode</span>
										   </a>
									   </Menu.Item>
									   <Menu.Separator />
								   {/if}
								   <Menu.Item value="logout">
									   <form method="POST" action="/logout" use:enhance style="display:contents; width:100%">
										   <button type="submit" class="flex items-center gap-2 w-full px-2 py-2 text-left bg-transparent border-0 cursor-pointer">
											   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
												   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
												   <polyline points="16 17 21 12 16 7" />
												   <line x1="21" x2="9" y1="12" y2="12" />
											   </svg>
											   <span>Logout</span>
										   </button>
									   </form>
								   </Menu.Item>
							   </Menu.Content>
						   </Menu.Positioner>
					   </Portal>
				   </Menu>
			   </div>
		<style>
		.avatar-emoji-header {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 56px;
			height: 56px;
			font-size: 2rem;
			border-radius: 50%;
			background: var(--color-surface-100-900, #f1f5f9);
			border: 3px solid var(--color-primary-300, #93c5fd);
			box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
			margin-right: 0.25rem;
			cursor: pointer;
		}
		</style>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>