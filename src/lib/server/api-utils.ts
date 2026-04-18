import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	code?: string;
}

export function apiError(status: number, message: string, code?: string) {
	return json<ApiResponse<never>>(
		{
			success: false,
			error: message,
			code
		},
		{ status }
	);
}

export function apiOk<T>(data: T, status = 200) {
	return json<ApiResponse<T>>(
		{
			success: true,
			data
		},
		{ status }
	);
}

export function requireApiKey(event: RequestEvent) {
	const apiKey = event.locals.apiKey;
	if (!apiKey) {
		throw apiError(401, 'Missing or invalid API key', 'UNAUTHORIZED');
	}
	return apiKey;
}

export function validateRequestMethod(event: RequestEvent, allowed: string[]) {
	const method = event.request.method;
	if (!allowed.includes(method)) {
		throw apiError(405, `Method ${method} not allowed`, 'METHOD_NOT_ALLOWED');
	}
}

export async function parseJsonBody<T>(event: RequestEvent): Promise<T> {
	try {
		const text = await event.request.text();
		if (!text) {
			throw new Error('Empty body');
		}
		return JSON.parse(text) as T;
	} catch (err) {
		throw apiError(400, 'Invalid JSON body', 'INVALID_JSON');
	}
}
