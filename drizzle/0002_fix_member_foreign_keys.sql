PRAGMA foreign_keys=OFF;
--> statement-breakpoint
ALTER TABLE `chores` RENAME TO `__old_chores`;
--> statement-breakpoint
CREATE TABLE `chores` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`emoji` text NOT NULL,
	`frequency` text NOT NULL,
	`coin_value` integer NOT NULL,
	`assigned_member_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `chores` (`id`, `family_id`, `title`, `description`, `emoji`, `frequency`, `coin_value`, `assigned_member_id`, `is_active`, `created_at`)
SELECT `id`, `family_id`, `title`, `description`, `emoji`, `frequency`, `coin_value`, `assigned_member_id`, `is_active`, `created_at`
FROM `__old_chores`;
--> statement-breakpoint
DROP TABLE `__old_chores`;
--> statement-breakpoint
CREATE INDEX `idx_chore_family` ON `chores` (`family_id`,`is_active`);
--> statement-breakpoint
ALTER TABLE `chore_completions` RENAME TO `__old_chore_completions`;
--> statement-breakpoint
CREATE TABLE `chore_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`chore_id` text NOT NULL,
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`coins_awarded` integer NOT NULL,
	`period_key` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`chore_id`) REFERENCES `chores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `chore_completions` (`id`, `chore_id`, `member_id`, `family_id`, `coins_awarded`, `period_key`, `completed_at`)
SELECT `id`, `chore_id`, `member_id`, `family_id`, `coins_awarded`, `period_key`, `completed_at`
FROM `__old_chore_completions`;
--> statement-breakpoint
DROP TABLE `__old_chore_completions`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_completion_period` ON `chore_completions` (`chore_id`,`member_id`,`period_key`);
--> statement-breakpoint
CREATE INDEX `idx_completion_member` ON `chore_completions` (`member_id`,`completed_at`);
--> statement-breakpoint
CREATE INDEX `idx_completion_family` ON `chore_completions` (`family_id`,`completed_at`);
--> statement-breakpoint
ALTER TABLE `prize_redemptions` RENAME TO `__old_prize_redemptions`;
--> statement-breakpoint
CREATE TABLE `prize_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`prize_id` text NOT NULL,
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`coin_cost` integer NOT NULL,
	`redeemed_at` text NOT NULL,
	FOREIGN KEY (`prize_id`) REFERENCES `prizes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `prize_redemptions` (`id`, `prize_id`, `member_id`, `family_id`, `coin_cost`, `redeemed_at`)
SELECT `id`, `prize_id`, `member_id`, `family_id`, `coin_cost`, `redeemed_at`
FROM `__old_prize_redemptions`;
--> statement-breakpoint
DROP TABLE `__old_prize_redemptions`;
--> statement-breakpoint
CREATE INDEX `idx_redemption_member` ON `prize_redemptions` (`member_id`,`redeemed_at`);
--> statement-breakpoint
CREATE INDEX `idx_redemption_family` ON `prize_redemptions` (`family_id`,`redeemed_at`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
