import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';

// ── Better Auth tables ─────────────────────────────────────────────────────
// These tables are managed by the better-auth engine.
// SQL table names follow better-auth conventions: user / session / account / verification.
// They are intentionally distinct from the legacy `sessions` table.

export const authUser = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email'),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	avatarEmoji: text('avatar_emoji').notNull().default('👤'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const authSession = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => authUser.id, { onDelete: 'cascade' })
});

export const authAccount = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => authUser.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
},
(table) => [
	uniqueIndex('uq_account_provider').on(table.providerId, table.accountId)
]);

export const authVerification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// ── End Better Auth tables ─────────────────────────────────────────────────

export const families = sqliteTable('families', {
	id: text('id').primaryKey(), // ULID
	name: text('name').notNull(),
	leaderboardResetDay: integer('leaderboard_reset_day').notNull().default(1), // 1=Mon..7=Sun
	createdAt: text('created_at').notNull()
});

export const familyMembers = sqliteTable(
	'family_members',
	{
		memberId: text('member_id')
			.notNull()
			.references(() => authUser.id),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		role: text('role', { enum: ['admin', 'member'] }).notNull(),
		joinedAt: text('joined_at').notNull()
	},
	(table) => [
		uniqueIndex('uq_member_family').on(table.memberId, table.familyId),
		index('idx_fm_family_role').on(table.familyId, table.role)
	]
);

export const chores = sqliteTable(
	'chores',
	{
		id: text('id').primaryKey(),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		emoji: text('emoji').notNull(),
		frequency: text('frequency', { enum: ['daily', 'weekly'] }).notNull(),
		coinValue: integer('coin_value').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_chore_family').on(table.familyId, table.isActive)]
);

export const choreCompletions = sqliteTable(
	'chore_completions',
	{
		id: text('id').primaryKey(),
		choreId: text('chore_id')
			.notNull()
			.references(() => chores.id),
		memberId: text('member_id')
			.notNull()
			.references(() => authUser.id),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		coinsAwarded: integer('coins_awarded').notNull(),
		periodKey: text('period_key').notNull(), // 'YYYY-MM-DD' or 'YYYY-Www'
		completedAt: text('completed_at').notNull()
	},
	(table) => [
		uniqueIndex('uq_completion_period').on(table.choreId, table.memberId, table.periodKey),
		index('idx_completion_member').on(table.memberId, table.completedAt),
		index('idx_completion_family').on(table.familyId, table.completedAt)
	]
);

export const prizes = sqliteTable(
	'prizes',
	{
		id: text('id').primaryKey(),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		emoji: text('emoji').notNull().default('noto:wrapped-gift'),
		coinCost: integer('coin_cost').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_prize_family').on(table.familyId, table.isActive)]
);

export const choreAssignments = sqliteTable(
	'chore_assignments',
	{
		choreId: text('chore_id')
			.notNull()
			.references(() => chores.id),
		memberId: text('member_id')
			.notNull()
			.references(() => authUser.id)
	},
	(table) => [
		primaryKey({ columns: [table.choreId, table.memberId] }),
		index('idx_chore_assignment_member').on(table.memberId)
	]
);

export const prizeAssignments = sqliteTable(
	'prize_assignments',
	{
		prizeId: text('prize_id')
			.notNull()
			.references(() => prizes.id),
		memberId: text('member_id')
			.notNull()
			.references(() => authUser.id)
	},
	(table) => [
		primaryKey({ columns: [table.prizeId, table.memberId] }),
		index('idx_prize_assignment_member').on(table.memberId)
	]
);

export const prizeRedemptions = sqliteTable(
	'prize_redemptions',
	{
		id: text('id').primaryKey(),
		prizeId: text('prize_id')
			.notNull()
			.references(() => prizes.id),
		memberId: text('member_id')
			.notNull()
			.references(() => authUser.id),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		coinCost: integer('coin_cost').notNull(),
		status: text('status').notNull().default('available'),
		redeemedAt: text('redeemed_at').notNull()
	},
	(table) => [
		index('idx_redemption_member').on(table.memberId, table.redeemedAt),
		index('idx_redemption_family').on(table.familyId, table.redeemedAt)
	]
);

export const activityEvents = sqliteTable(
	'activity_events',
	{
		id: text('id').primaryKey(),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		actorMemberId: text('actor_member_id').references(() => authUser.id),
		subjectMemberId: text('subject_member_id').references(() => authUser.id),
		eventType: text('event_type').notNull(),
		entityType: text('entity_type'),
		entityId: text('entity_id'),
		deltaCoins: integer('delta_coins').notNull().default(0),
		metadata: text('metadata').notNull().default('{}'),
		occurredAt: text('occurred_at').notNull(),
		createdAt: text('created_at').notNull()
	},
	(table) => [
		index('idx_activity_family_time').on(table.familyId, table.occurredAt),
		index('idx_activity_subject_time').on(table.subjectMemberId, table.occurredAt),
		index('idx_activity_type_time').on(table.eventType, table.occurredAt)
	]
);


