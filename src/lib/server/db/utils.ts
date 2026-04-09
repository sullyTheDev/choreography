import { ulid } from 'ulid';

export { ulid };

/**
 * Compute a period key for duplicate-completion prevention.
 * Daily:  'YYYY-MM-DD'
 * Weekly: 'YYYY-Www'  (ISO 8601 week)
 */
export function getPeriodKey(frequency: 'daily' | 'weekly', date: Date = new Date()): string {
	if (frequency === 'daily') {
		return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
	}
	return getISOWeekKey(date);
}

function getISOWeekKey(date: Date): string {
	// Copy the date to avoid mutation
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	// ISO week: week starts on Monday. getUTCDay() returns 0=Sun..6=Sat
	const dayOfWeek = d.getUTCDay() || 7; // treat Sunday (0) as 7
	// Shift to nearest Thursday (ISO week is the week containing Thursday)
	d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Compute the start and end of the current weekly leaderboard period.
 * resetDay: 1=Monday..7=Sunday (matches data-model leaderboardResetDay)
 */
export function getWeeklyPeriod(
	date: Date = new Date(),
	resetDay = 1
): { start: Date; end: Date; label: string } {
	const jsDay = date.getDay(); // 0=Sun..6=Sat
	const adjustedDay = jsDay === 0 ? 7 : jsDay; // convert to 1=Mon..7=Sun
	const daysSinceReset = ((adjustedDay - resetDay) + 7) % 7;

	const start = new Date(date);
	start.setDate(date.getDate() - daysSinceReset);
	start.setHours(0, 0, 0, 0);

	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);

	const label = `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
	return { start, end, label };
}

function formatMonthDay(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Derive a short family code from the family ULID (last 8 chars). */
export function familyCode(familyId: string): string {
	return familyId.slice(-8);
}

export function now(): string {
	return new Date().toISOString();
}
