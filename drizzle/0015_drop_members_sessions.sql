-- Migration: absorb domain columns from `members` into `user`, then drop
-- legacy `members` and `sessions` tables.
-- Also rebuilds all tables that had FK constraints pointing at `members`
-- so they instead point at `user` (FK enforcement is OFF during migration).
-- Prerequisites: migrations 0010-0014 have run.
ALTER TABLE `user` ADD COLUMN `avatar_emoji` TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `is_active` INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
UPDATE `user` SET `avatar_emoji` = (SELECT `avatar_emoji` FROM `members` WHERE `members`.`id` = `user`.`id`) WHERE EXISTS (SELECT 1 FROM `members` WHERE `members`.`id` = `user`.`id`);
--> statement-breakpoint
UPDATE `user` SET `is_active` = (SELECT `is_active` FROM `members` WHERE `members`.`id` = `user`.`id`) WHERE EXISTS (SELECT 1 FROM `members` WHERE `members`.`id` = `user`.`id`);
--> statement-breakpoint
DROP TABLE IF EXISTS `sessions`;
--> statement-breakpoint
-- Rebuild family_members: FK member_id -> user(id)
CREATE TABLE `_new_family_members` (
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `_new_family_members` SELECT `member_id`, `family_id`, `role`, `joined_at` FROM `family_members`;
--> statement-breakpoint
DROP TABLE `family_members`;
--> statement-breakpoint
ALTER TABLE `_new_family_members` RENAME TO `family_members`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_member_family` ON `family_members` (`member_id`, `family_id`);
--> statement-breakpoint
CREATE INDEX `idx_fm_family_role` ON `family_members` (`family_id`, `role`);
--> statement-breakpoint
-- Rebuild chore_completions: FK member_id -> user(id)
CREATE TABLE `_new_chore_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`chore_id` text NOT NULL,
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`coins_awarded` integer NOT NULL,
	`period_key` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`chore_id`) REFERENCES `chores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `_new_chore_completions` SELECT `id`, `chore_id`, `member_id`, `family_id`, `coins_awarded`, `period_key`, `completed_at` FROM `chore_completions`;
--> statement-breakpoint
DROP TABLE `chore_completions`;
--> statement-breakpoint
ALTER TABLE `_new_chore_completions` RENAME TO `chore_completions`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_completion_period` ON `chore_completions` (`chore_id`, `member_id`, `period_key`);
--> statement-breakpoint
CREATE INDEX `idx_completion_member` ON `chore_completions` (`member_id`, `completed_at`);
--> statement-breakpoint
CREATE INDEX `idx_completion_family` ON `chore_completions` (`family_id`, `completed_at`);
--> statement-breakpoint
-- Rebuild prize_redemptions: FK member_id -> user(id)
CREATE TABLE `_new_prize_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`prize_id` text NOT NULL,
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`coin_cost` integer NOT NULL,
	`redeemed_at` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	FOREIGN KEY (`prize_id`) REFERENCES `prizes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `_new_prize_redemptions` SELECT `id`, `prize_id`, `member_id`, `family_id`, `coin_cost`, `redeemed_at`, `status` FROM `prize_redemptions`;
--> statement-breakpoint
DROP TABLE `prize_redemptions`;
--> statement-breakpoint
ALTER TABLE `_new_prize_redemptions` RENAME TO `prize_redemptions`;
--> statement-breakpoint
CREATE INDEX `idx_redemption_member` ON `prize_redemptions` (`member_id`, `redeemed_at`);
--> statement-breakpoint
CREATE INDEX `idx_redemption_family` ON `prize_redemptions` (`family_id`, `redeemed_at`);
--> statement-breakpoint
-- Rebuild activity_events: FK actor/subject_member_id -> user(id)
CREATE TABLE `_new_activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`actor_member_id` text,
	`subject_member_id` text,
	`event_type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`delta_coins` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `_new_activity_events` SELECT `id`, `family_id`, `actor_member_id`, `subject_member_id`, `event_type`, `entity_type`, `entity_id`, `delta_coins`, `metadata`, `occurred_at`, `created_at` FROM `activity_events`;
--> statement-breakpoint
DROP TABLE `activity_events`;
--> statement-breakpoint
ALTER TABLE `_new_activity_events` RENAME TO `activity_events`;
--> statement-breakpoint
CREATE INDEX `idx_activity_family_time` ON `activity_events` (`family_id`, `occurred_at`);
--> statement-breakpoint
CREATE INDEX `idx_activity_subject_time` ON `activity_events` (`subject_member_id`, `occurred_at`);
--> statement-breakpoint
CREATE INDEX `idx_activity_type_time` ON `activity_events` (`event_type`, `occurred_at`);
--> statement-breakpoint
-- Rebuild prize_assignments: FK member_id -> user(id)
CREATE TABLE `_new_prize_assignments` (
	`prize_id` text NOT NULL REFERENCES `prizes`(`id`),
	`member_id` text NOT NULL REFERENCES `user`(`id`),
	PRIMARY KEY(`prize_id`, `member_id`)
);
--> statement-breakpoint
INSERT INTO `_new_prize_assignments` SELECT `prize_id`, `member_id` FROM `prize_assignments`;
--> statement-breakpoint
DROP TABLE `prize_assignments`;
--> statement-breakpoint
ALTER TABLE `_new_prize_assignments` RENAME TO `prize_assignments`;
--> statement-breakpoint
CREATE INDEX `idx_prize_assignment_member` ON `prize_assignments` (`member_id`);
--> statement-breakpoint
-- Rebuild chore_assignments: FK member_id -> user(id)
CREATE TABLE `_new_chore_assignments` (
	`chore_id` text NOT NULL REFERENCES `chores`(`id`),
	`member_id` text NOT NULL REFERENCES `user`(`id`),
	PRIMARY KEY(`chore_id`, `member_id`)
);
--> statement-breakpoint
INSERT INTO `_new_chore_assignments` SELECT `chore_id`, `member_id` FROM `chore_assignments`;
--> statement-breakpoint
DROP TABLE `chore_assignments`;
--> statement-breakpoint
ALTER TABLE `_new_chore_assignments` RENAME TO `chore_assignments`;
--> statement-breakpoint
CREATE INDEX `idx_chore_assignment_member` ON `chore_assignments` (`member_id`);
--> statement-breakpoint
DROP TABLE IF EXISTS `members`;
