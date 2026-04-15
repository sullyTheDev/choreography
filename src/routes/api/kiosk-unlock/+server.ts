import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { members, familyMembers } from '$lib/server/db/schema.js';
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

	// Ensure the target member belongs to the same family
	const [row] = await db
		.select({ pin: members.pin })
		.from(members)
		.innerJoin(familyMembers, eq(familyMembers.memberId, members.id))
		.where(eq(members.id, targetId))
		.limit(1);

	if (!row) error(404, 'Member not found');

	if (!row.pin) return json({ success: false, reason: 'no_pin' });

	const valid = await verifyPin(pin, row.pin);
	return json({ success: valid, reason: valid ? null : 'wrong_pin' });
};
