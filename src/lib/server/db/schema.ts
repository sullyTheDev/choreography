import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';

export const families = sqliteTable('families', {
	id: text('id').primaryKey(), // ULID
	name: text('name').notNull(),
	leaderboardResetDay: integer('leaderboard_reset_day').notNull().default(1), // 1=Mon..7=Sun
	createdAt: text('created_at').notNull()
});

export const members = sqliteTable(
	'members',
	{
		id: text('id').primaryKey(),
		displayName: text('display_name').notNull(),
		avatarEmoji: text('avatar_emoji').notNull().default('👤'),
		email: text('email').unique(),
		passwordHash: text('password_hash'),
		pin: text('pin'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_member_display_name').on(table.displayName), index('idx_member_email').on(table.email)]
);

export const familyMembers = sqliteTable(
	'family_members',
	{
		memberId: text('member_id')
			.notNull()
			.references(() => members.id),
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
			.references(() => members.id),
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
			.references(() => members.id)
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
			.references(() => members.id)
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
			.references(() => members.id),
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
		actorMemberId: text('actor_member_id').references(() => members.id),
		subjectMemberId: text('subject_member_id').references(() => members.id),
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

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(), // crypto.randomUUID()
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		memberId: text('member_id')
			.notNull()
			.references(() => members.id),
		memberRole: text('member_role', { enum: ['admin', 'member'] }).notNull(),
		expiresAt: text('expires_at').notNull(),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_session_expires').on(table.expiresAt)]
);
