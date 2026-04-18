-- Repair auth table foreign keys and enforce nullable user.email safely.
--
-- Why this exists:
-- - Migration 0011 rebuilt `user` by renaming it, which can retarget foreign keys
--   in `session`/`account` to the backup table name on some SQLite/libsql paths.
-- - This migration performs a full, deterministic rebuild of auth tables and
--   restores all data while preserving better-auth schemas.

DROP TABLE IF EXISTS `_user_backup`;
--> statement-breakpoint
DROP TABLE IF EXISTS `_user_bk`;
--> statement-breakpoint

CREATE TABLE `_user_fix_backup` AS
SELECT `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`
FROM `user`;
--> statement-breakpoint

CREATE TABLE `_session_fix_backup` AS
SELECT `id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id`
FROM `session`;
--> statement-breakpoint

CREATE TABLE `_account_fix_backup` AS
SELECT
	`id`,
	`account_id`,
	`provider_id`,
	`user_id`,
	`access_token`,
	`refresh_token`,
	`id_token`,
	`access_token_expires_at`,
	`refresh_token_expires_at`,
	`scope`,
	`password`,
	`created_at`,
	`updated_at`
FROM `account`;
--> statement-breakpoint

DROP TABLE `session`;
--> statement-breakpoint
DROP TABLE `account`;
--> statement-breakpoint
DROP TABLE `user`;
--> statement-breakpoint

CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`email_verified` integer NOT NULL DEFAULT 0,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint

CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

INSERT OR IGNORE INTO `user` (`id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`)
SELECT `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`
FROM `_user_fix_backup`;
--> statement-breakpoint

INSERT OR IGNORE INTO `session` (`id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id`)
SELECT `id`, `expires_at`, `token`, `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id`
FROM `_session_fix_backup`;
--> statement-breakpoint

INSERT OR IGNORE INTO `account` (
	`id`,
	`account_id`,
	`provider_id`,
	`user_id`,
	`access_token`,
	`refresh_token`,
	`id_token`,
	`access_token_expires_at`,
	`refresh_token_expires_at`,
	`scope`,
	`password`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`account_id`,
	`provider_id`,
	`user_id`,
	`access_token`,
	`refresh_token`,
	`id_token`,
	`access_token_expires_at`,
	`refresh_token_expires_at`,
	`scope`,
	`password`,
	`created_at`,
	`updated_at`
FROM `_account_fix_backup`;
--> statement-breakpoint

DROP TABLE `_session_fix_backup`;
--> statement-breakpoint
DROP TABLE `_account_fix_backup`;
--> statement-breakpoint
DROP TABLE `_user_fix_backup`;
--> statement-breakpoint

CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`) WHERE `email` IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_account_provider` ON `account` (`provider_id`,`account_id`);
