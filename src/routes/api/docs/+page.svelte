<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(async () => {
		// Dynamically load Swagger UI bundle
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js';
		script.onload = () => {
			// @ts-ignore
			window.SwaggerUIBundle({
				url: '/openapi.json',
				dom_id: '#swagger-ui',
				presets: [
					// @ts-ignore
					window.SwaggerUIBundle.presets.apis,
					// @ts-ignore
					window.SwaggerUIBundle.SwaggerUIStandalonePreset
				],
				layout: 'StandaloneLayout'
			});
		};
		document.head.appendChild(script);

		// Load CSS
		const css = document.createElement('link');
		css.rel = 'stylesheet';
		css.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css';
		document.head.appendChild(css);

		mounted = true;
	});
</script>

<svelte:head>
	<title>Choreography REST API Documentation</title>
</svelte:head>

<div id="swagger-ui"></div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #fafafa;
	}

	:global(#swagger-ui) {
		width: 100%;
		height: 100vh;
	}
</style>
