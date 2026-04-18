import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families } from '$lib/server/db/schema.js';
import { logger } from '$lib/server/logger.js';
import { sendWebhook } from '$lib/server/webhook.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const [family] = await db
		.select({ webhookUrl: families.webhookUrl })
		.from(families)
		.where(eq(families.id, session.familyId))
		.limit(1);

	if (!family) error(404, 'Family not found');

	return { webhookUrl: family.webhookUrl ?? '' };
};

export const actions: Actions = {
	saveWebhook: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const fd = await request.formData();
		const raw = String(fd.get('webhookUrl') ?? '').trim();

		if (!raw) {
			return fail(400, { error: 'Webhook URL is required' });
		}

		let parsed: URL;
		try {
			parsed = new URL(raw);
		} catch {
			return fail(400, { error: 'Invalid webhook URL' });
		}
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			return fail(400, { error: 'Webhook URL must use http or https' });
		}
		if (raw.length > 2048) {
			return fail(400, { error: 'Webhook URL is too long (max 2048 characters)' });
		}

		await db
			.update(families)
			.set({ webhookUrl: raw })
			.where(eq(families.id, session.familyId));

		logger.info({ familyId: session.familyId, set: !!raw }, 'Webhook URL updated');
		return { saved: true };
	},

	testWebhook: async ({ locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const [family] = await db
			.select({ name: families.name, webhookUrl: families.webhookUrl })
			.from(families)
			.where(eq(families.id, session.familyId))
			.limit(1);

		if (!family?.webhookUrl) {
			return fail(400, { testError: 'No webhook URL configured' });
		}

		const result = await sendWebhook(family.webhookUrl, {
			event: 'test',
			timestamp: new Date().toISOString(),
			family: { id: session.familyId, name: family.name },
			actor: { id: session.memberId, name: session.displayName },
			subject: null,
			chore: null,
			prize: null,
			coinsAwarded: null,
			coinsSpent: null,
			redemptionId: null
		});

		if (result.ok) {
			logger.info({ familyId: session.familyId }, 'Test webhook sent successfully');
			return { testSuccess: true };
		}

		const errorMsg = result.error ?? `HTTP ${result.status}`;
		logger.warn({ familyId: session.familyId, result }, 'Test webhook failed');
		return fail(502, { testError: `Webhook delivery failed: ${errorMsg}` });
	}
};
