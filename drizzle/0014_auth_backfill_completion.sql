-- Complete auth backfill steps idempotently.
--
-- Why this exists:
-- - Migration 0012 was authored without statement breakpoints, which can result
--   in only the first statement being executed by the migrator.
-- - This migration safely re-runs all intended backfill inserts.

-- A1. Ensure users exist for members with email
INSERT OR IGNORE INTO `user` (
	`id`,
	`name`,
	`email`,
	`email_verified`,
	`image`,
	`created_at`,
	`updated_at`
)
SELECT
	m.`id`,
	m.`display_name`,
	lower(trim(m.`email`)),
	1,
	NULL,
	CAST(strftime('%s', m.`created_at`) AS INTEGER),
	CAST(strftime('%s', 'now') AS INTEGER)
FROM `members` m
WHERE m.`email` IS NOT NULL
	AND trim(m.`email`) != '';
--> statement-breakpoint

-- A2. Ensure credential accounts exist for members with password hashes
INSERT OR IGNORE INTO `account` (
	`id`,
	`account_id`,
	`provider_id`,
	`user_id`,
	`password`,
	`created_at`,
	`updated_at`
)
SELECT
	'cred_' || m.`id`,
	lower(trim(m.`email`)),
	'credential',
	m.`id`,
	m.`password_hash`,
	CAST(strftime('%s', m.`created_at`) AS INTEGER),
	CAST(strftime('%s', 'now') AS INTEGER)
FROM `members` m
WHERE m.`email` IS NOT NULL
	AND trim(m.`email`) != ''
	AND m.`password_hash` IS NOT NULL;
--> statement-breakpoint

-- B1. Ensure users exist for PIN-only members
INSERT OR IGNORE INTO `user` (
	`id`,
	`name`,
	`email`,
	`email_verified`,
	`image`,
	`created_at`,
	`updated_at`
)
SELECT
	m.`id`,
	m.`display_name`,
	NULL,
	0,
	NULL,
	CAST(strftime('%s', m.`created_at`) AS INTEGER),
	CAST(strftime('%s', 'now') AS INTEGER)
FROM `members` m
WHERE (m.`email` IS NULL OR trim(m.`email`) = '')
	AND NOT EXISTS (SELECT 1 FROM `user` u WHERE u.`id` = m.`id`);
