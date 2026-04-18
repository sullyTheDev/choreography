-- Backfill Better Auth `user` and `account` tables from existing members.
-- Part A: members with email => user row + credential account row
-- Part B: members without email (PIN-only) => user row only

-- A1. Seed `user` from members with an email
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

-- A2. Seed `account` (credential provider) for members with a password
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

-- B1. Seed `user` for PIN-only members (no email)
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
