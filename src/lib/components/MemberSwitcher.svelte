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
	<nav class="flex gap-1" aria-label="Switch member">
		{#each members as member (member.id)}
			<a
				href={memberUrl(member.id)}
				class="btn btn-lg rounded-full {member.id === activeMemberId ? 'preset-filled-primary-500' : 'preset-outlined-primary-500'}"
				aria-current={member.id === activeMemberId ? 'page' : undefined}
				title={member.displayName}
			>
				<span aria-hidden="true">{member.avatarEmoji}</span>
				<span>{member.displayName}</span>
			</a>
		{/each}
	</nav>
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