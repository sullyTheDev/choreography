<script lang="ts">
	import { onMount } from 'svelte';
	import swaggerBundleUrl from 'swagger-ui-dist/swagger-ui-bundle.js?url';
	import swaggerCssUrl from 'swagger-ui-dist/swagger-ui.css?url';

	let status = 'loading';
	let errorMessage = '';

	function loadScript(src: string) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = resolve;
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(script);
		});
	}

	function loadStylesheet(href: string) {
		return new Promise((resolve, reject) => {
			const css = document.createElement('link');
			css.rel = 'stylesheet';
			css.href = href;
			css.onload = resolve;
			css.onerror = () => reject(new Error(`Failed to load ${href}`));
			document.head.appendChild(css);
		});
	}

	onMount(async () => {
		try {
			await Promise.all([loadStylesheet(swaggerCssUrl), loadScript(swaggerBundleUrl)]);

			const SwaggerUIBundle = (
				window as Window & {
					SwaggerUIBundle?: {
						(config: {
							url: string;
							dom_id: string;
							presets: unknown[];
							layout: string;
							deepLinking: boolean;
							displayRequestDuration: boolean;
						}): void;
						presets: {
							apis: unknown;
						};
					};
				}
			).SwaggerUIBundle;
			if (!SwaggerUIBundle) {
				throw new Error('Swagger UI bundle did not initialize.');
			}

			SwaggerUIBundle({
				url: '/openapi.json',
				dom_id: '#swagger-ui',
				presets: [SwaggerUIBundle.presets.apis],
				layout: 'BaseLayout',
				deepLinking: true,
				displayRequestDuration: true
			});

			status = 'ready';
		} catch (error) {
			status = 'error';
			errorMessage = error instanceof Error ? error.message : 'Failed to load API documentation.';
		}
	});
</script>

<svelte:head>
	<title>Choreography REST API Documentation</title>
</svelte:head>

{#if status === 'loading'}
	<div class="state-shell">
		<p class="state-title">Loading API docs...</p>
		<p class="state-copy">Fetching Swagger UI and the OpenAPI spec.</p>
	</div>
{/if}

{#if status === 'error'}
	<div class="state-shell">
		<p class="state-title">API docs failed to load</p>
		<p class="state-copy">{errorMessage}</p>
	</div>
{/if}

<div class="docs-shell">
	<div id="swagger-ui"></div>
</div>

<style>
	:global(html) {
		background: #fafafa !important;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: #fafafa !important;
	}

	.docs-shell {
		min-height: 100vh;
		background: #fafafa;
	}

	:global(#swagger-ui) {
		width: 100%;
		min-height: 100vh;
		background: #fafafa;
	}

	.state-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem;
		text-align: center;
		background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
		color: #0f172a;
	}

	.state-title {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.state-copy {
		margin: 0;
		max-width: 36rem;
		font-size: 0.95rem;
		color: #475569;
	}
</style>
