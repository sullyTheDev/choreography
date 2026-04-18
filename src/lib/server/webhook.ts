import { logger } from '$lib/server/logger.js';

export type WebhookEventType =
	| 'chore_completed'
	| 'prize_purchased'
	| 'prize_redeemed'
	| 'prize_fulfilled'
	| 'prize_dismissed'
	| 'test';

export interface WebhookPayload {
	/** The event that occurred. */
	event: WebhookEventType;
	/** ISO 8601 timestamp of when the event occurred. */
	timestamp: string;
	/** The family this event belongs to. */
	family: { id: string; name: string };
	/** The user who performed the action. */
	actor: { id: string; name: string };
	/** The user the action was performed on behalf of, if different from actor (e.g. admin acting for a member). */
	subject: { id: string; name: string } | null;
	/** Chore details, present for chore events. */
	chore: { id: string; title: string; coinValue: number } | null;
	/** Prize details, present for prize events. */
	prize: { id: string; title: string; coinCost: number } | null;
	/** Coins earned by the actor/subject. Positive integer or null. */
	coinsAwarded: number | null;
	/** Coins spent by the actor/subject. Positive integer or null. */
	coinsSpent: number | null;
	/** Prize redemption ID, present for prize events. */
	redemptionId: string | null;
}

/**
 * Sends a webhook POST and returns the result. Used when the caller needs to know
 * whether the delivery succeeded (e.g. the test-webhook UI action).
 */
export async function sendWebhook(
	url: string,
	payload: WebhookPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(5000)
		});
		return { ok: res.ok, status: res.status };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
	}
}

/**
 * Fire-and-forget webhook dispatch. Never throws — errors are logged as warnings.
 * Call this after a successful DB transaction to notify a configured endpoint.
 */
export function dispatchWebhook(url: string, payload: WebhookPayload): void {
	void sendWebhook(url, payload).then((result) => {
		if (result.ok) {
			logger.info(
				{ url, event: payload.event, familyId: payload.family.id },
				'Webhook dispatched'
			);
		} else {
			logger.warn(
				{ url, event: payload.event, familyId: payload.family.id, ...result },
				'Webhook dispatch failed or returned non-2xx'
			);
		}
	});
}
