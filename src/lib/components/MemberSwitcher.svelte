<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface Props {
		members: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
		activeMemberId: string | null;
	}

	let { members, activeMemberId }: Props = $props();

	function memberUrl(memberId: string): string {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('member', memberId);
		return `${page.url.pathname}?${params.toString()}`;
	}
</script>

{#if members.length > 1 && members.length <= 5}
   <nav class="flex flex-wrap gap-5" aria-label="Switch member">
	   {#each members as member (member.id)}
		   <a
			   href={memberUrl(member.id)}
			   class="member-avatar flex flex-col items-center gap-2 text-center no-underline"
			   aria-current={member.id === activeMemberId ? 'page' : undefined}
			   title={member.displayName}
		   >
			   <span
				   class="avatar-emoji {member.id === activeMemberId ? 'avatar-active' : ''}"
				   aria-hidden="true"
			   >{member.avatarEmoji}</span>
			   <span class="avatar-label text-base font-semibold text-surface-700-300">{member.displayName}</span>
		   </a>
	   {/each}
   </nav>
<style>
.member-avatar {
	gap: 0.5rem;
}
.avatar-emoji {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72px;
	height: 72px;
	font-size: 2.5rem;
	border-radius: 50%;
	background: var(--color-surface-100-900, #f1f5f9);
	border: 4px solid transparent;
	box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
	transition: border-color 0.2s, box-shadow 0.2s;
}
.avatar-emoji.avatar-active {
	border-color: var(--color-primary-500, #3b82f6);
	box-shadow: 0 0 0 4px var(--color-primary-300, #93c5fd), 0 2px 8px 0 rgba(0,0,0,0.08);
}
.avatar-label {
	margin-top: 0.25rem;
	font-size: 1rem;
	font-weight: 600;
	color: var(--color-surface-700-300, #334155);
}
</style>
{:else if members.length >= 6}
	<nav aria-label="Switch member">
		<select
			class="select"
			value={activeMemberId ? memberUrl(activeMemberId) : ''}
			onchange={(event) => goto((event.currentTarget as HTMLSelectElement).value)}
		>
			{#each members as member (member.id)}
				<option value={memberUrl(member.id)}>
					{member.avatarEmoji} {member.displayName}
				</option>
			{/each}
		</select>
	</nav>
{/if}