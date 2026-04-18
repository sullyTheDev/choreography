import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { authAccount, familyMembers } from '$lib/server/db/schema.js';
import { verifyPin } from '$lib/server/auth.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const body = await request.json();
	const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
	// memberId is optional — if omitted we verify the admin's own PIN (exit kiosk)
	const targetId: string = typeof body?.memberId === 'string' && body.memberId.trim()
		? body.memberId.trim()
		: session.memberId;

	if (!pin) return json({ success: false, reason: 'no_input' });

	// Look up PIN from authAccount (pin-auth provider)
	const [row] = await db
		.select({ password: authAccount.password })
		.from(authAccount)
		.innerJoin(familyMembers, eq(familyMembers.memberId, authAccount.userId))
		.where(and(eq(authAccount.userId, targetId), eq(authAccount.providerId, 'pin-auth')))
		.limit(1);

	if (!row) return json({ success: false, reason: 'no_pin' });

	if (!row.password) return json({ success: false, reason: 'no_pin' });

	const valid = await verifyPin(pin, row.password);
	return json({ success: valid, reason: valid ? null : 'wrong_pin' });
};
