import pino from 'pino';
import { createRequire } from 'module';

const _require = createRequire(
	import.meta.url.startsWith('file:') ? import.meta.url : new URL('../../', import.meta.url).href
);

const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
const isDev = !isTest && process.env.NODE_ENV !== 'production';

function getPrettyTarget(): string | undefined {
	if (!isDev) return undefined;
	try {
		return _require.resolve('pino-pretty');
	} catch {
		return undefined;
	}
}

const prettyTarget = getPrettyTarget();

export const logger = pino({
	level: isTest ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
	transport: prettyTarget ? { target: prettyTarget, options: { colorize: true } } : undefined
});
