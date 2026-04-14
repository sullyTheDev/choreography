CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_emoji` text DEFAULT '👤' NOT NULL,
	`email` text,
	`password_hash` text,
	`pin` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_display_name_unique` ON `members` (`display_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_member_display_name` ON `members` (`display_name`);--> statement-breakpoint
CREATE INDEX `idx_member_email` ON `members` (`email`);--> statement-breakpoint

CREATE TABLE `family_members` (
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_member_family` ON `family_members` (`member_id`,`family_id`);--> statement-breakpoint
CREATE INDEX `idx_fm_family_role` ON `family_members` (`family_id`,`role`);--> statement-breakpoint

INSERT INTO `members` (`id`, `display_name`, `avatar_emoji`, `email`, `password_hash`, `pin`, `is_active`, `created_at`)
SELECT `id`, `display_name`, '👤', `email`, `password_hash`, NULL, 1, `created_at`
FROM `parents`;--> statement-breakpoint

INSERT INTO `family_members` (`member_id`, `family_id`, `role`, `joined_at`)
SELECT `id`, `family_id`, 'admin', `created_at`
FROM `parents`;--> statement-breakpoint

INSERT INTO `members` (`id`, `display_name`, `avatar_emoji`, `email`, `password_hash`, `pin`, `is_active`, `created_at`)
SELECT `id`, `display_name`, `avatar_emoji`, NULL, NULL, `pin`, `is_active`, `created_at`
FROM `kids`;--> statement-breakpoint

INSERT INTO `family_members` (`member_id`, `family_id`, `role`, `joined_at`)
SELECT `id`, `family_id`, 'member', `created_at`
FROM `kids`;--> statement-breakpoint

ALTER TABLE `chore_completions` RENAME COLUMN "kid_id" TO "member_id";--> statement-breakpoint
ALTER TABLE `chores` RENAME COLUMN "assigned_kid_id" TO "assigned_member_id";--> statement-breakpoint
ALTER TABLE `prize_redemptions` RENAME COLUMN "kid_id" TO "member_id";--> statement-breakpoint
ALTER TABLE `sessions` RENAME COLUMN "user_id" TO "member_id";--> statement-breakpoint
ALTER TABLE `sessions` RENAME COLUMN "user_role" TO "member_role";--> statement-breakpoint
UPDATE `sessions`
SET `member_role` = CASE
	WHEN `member_role` = 'parent' THEN 'admin'
	WHEN `member_role` = 'kid' THEN 'member'
	ELSE `member_role`
END;--> statement-breakpoint

DROP INDEX `idx_completion_kid`;--> statement-breakpoint
DROP INDEX `uq_completion_period`;--> statement-breakpoint
CREATE INDEX `idx_completion_member` ON `chore_completions` (`member_id`,`completed_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_completion_period` ON `chore_completions` (`chore_id`,`member_id`,`period_key`);--> statement-breakpoint
ALTER TABLE `chore_completions` ALTER COLUMN "member_id" TO "member_id" text NOT NULL REFERENCES members(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chores` ALTER COLUMN "assigned_member_id" TO "assigned_member_id" text REFERENCES members(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP INDEX `idx_redemption_kid`;--> statement-breakpoint
CREATE INDEX `idx_redemption_member` ON `prize_redemptions` (`member_id`,`redeemed_at`);--> statement-breakpoint
ALTER TABLE `prize_redemptions` ALTER COLUMN "member_id" TO "member_id" text NOT NULL REFERENCES members(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ALTER COLUMN "member_id" TO "member_id" text NOT NULL REFERENCES members(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint

DROP TABLE `kids`;--> statement-breakpoint
DROP TABLE `parents`;