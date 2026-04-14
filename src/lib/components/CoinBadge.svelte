<style>
.coin-shimmer {
    position: relative;
    overflow: hidden;
}
.coin-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 60%;
    height: 100%;
    background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
    animation: coin-shimmer-move 3.2s infinite;
    pointer-events: none;
}
@keyframes coin-shimmer-move {
    0% { left: -60%; }
    100% { left: 120%; }
}
</style>
<script lang="ts">
import Icon from '@iconify/svelte';

export let value: number;
export let className: string = '';
</script>

<span class={`badge preset-tonal-warning border border-warning-500 text-xs py-1 px-1.5 coin-shimmer ${className}`.trim()} aria-label="{value} coins">
    <Icon icon="noto:coin" class="h-4 w-4" aria-hidden="true" /> {value}
</span>
