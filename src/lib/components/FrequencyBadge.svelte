<script lang="ts">
	interface Props {
		value: 'daily' | 'weekly';
	}
	let { value }: Props = $props();
	const label = value === 'daily' ? 'Daily' : 'Weekly';
	const preset = value === 'daily' ? 'preset-tonal-secondary border border-secondary-200-800' : 'preset-tonal-primary border border-primary-200-800';
</script>

<span class="badge {preset} text-xs py-1 px-1.5">{label}</span>
