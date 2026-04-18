import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
	plugins: [tailwindcss() as never, sveltekit() as never, basicSsl() as never],
	test: {
		include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
		globals: true,
		environment: 'node',
		testTimeout: 15000,
		globalSetup: ['tests/integration/global-setup.ts'],
		setupFiles: ['tests/integration/setup.ts'],
		exclude: ['tests/e2e/**']
	}
});
