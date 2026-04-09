import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const families = sqliteTable('families', {
	id: text('id').primaryKey(), // ULID
	name: text('name').notNull(),
	leaderboardResetDay: integer('leaderboard_reset_day').notNull().default(1), // 1=Mon..7=Sun
	createdAt: text('created_at').notNull()
});

export const parents = sqliteTable(
	'parents',
	{
		id: text('id').primaryKey(),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		email: text('email').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		displayName: text('display_name').notNull(),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_parent_email').on(table.email)]
);

export const kids = sqliteTable(
	'kids',
	{
		id: text('id').primaryKey(),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		displayName: text('display_name').notNull(),
		avatarEmoji: text('avatar_emoji').notNull(),
		pin: text('pin').notNull(), // bcrypt-hashed 4–6 digit PIN
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_kid_family').on(table.familyId, table.isActive)]
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
		assignedKidId: text('assigned_kid_id').references(() => kids.id),
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
		kidId: text('kid_id')
			.notNull()
			.references(() => kids.id),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		coinsAwarded: integer('coins_awarded').notNull(),
		periodKey: text('period_key').notNull(), // 'YYYY-MM-DD' or 'YYYY-Www'
		completedAt: text('completed_at').notNull()
	},
	(table) => [
		uniqueIndex('uq_completion_period').on(table.choreId, table.kidId, table.periodKey),
		index('idx_completion_kid').on(table.kidId, table.completedAt),
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
		coinCost: integer('coin_cost').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_prize_family').on(table.familyId, table.isActive)]
);

export const prizeRedemptions = sqliteTable(
	'prize_redemptions',
	{
		id: text('id').primaryKey(),
		prizeId: text('prize_id')
			.notNull()
			.references(() => prizes.id),
		kidId: text('kid_id')
			.notNull()
			.references(() => kids.id),
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		coinCost: integer('coin_cost').notNull(),
		redeemedAt: text('redeemed_at').notNull()
	},
	(table) => [
		index('idx_redemption_kid').on(table.kidId, table.redeemedAt),
		index('idx_redemption_family').on(table.familyId, table.redeemedAt)
	]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(), // crypto.randomUUID()
		familyId: text('family_id')
			.notNull()
			.references(() => families.id),
		userId: text('user_id').notNull(), // Parent.id or Kid.id
		userRole: text('user_role', { enum: ['parent', 'kid'] }).notNull(),
		expiresAt: text('expires_at').notNull(),
		createdAt: text('created_at').notNull()
	},
	(table) => [index('idx_session_expires').on(table.expiresAt)]
);
