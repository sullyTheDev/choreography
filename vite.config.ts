import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss() as never, sveltekit() as never],
	test: {
		include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
		globals: true,
		environment: 'node',
		setupFiles: ['tests/integration/setup.ts'],
		exclude: ['tests/e2e/**']
	}
});
