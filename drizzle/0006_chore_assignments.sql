CREATE TABLE `chore_assignments` (
	`chore_id` text NOT NULL REFERENCES `chores`(`id`),
	`member_id` text NOT NULL REFERENCES `members`(`id`),
	PRIMARY KEY(`chore_id`, `member_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_chore_assignment_member` ON `chore_assignments` (`member_id`);
--> statement-breakpoint
INSERT INTO `chore_assignments` (`chore_id`, `member_id`)
SELECT `id`, `assigned_member_id` FROM `chores` WHERE `assigned_member_id` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `chore_assignments` (`chore_id`, `member_id`)
SELECT c.`id`, fm.`member_id`
FROM `chores` c
JOIN `family_members` fm ON fm.`family_id` = c.`family_id`
WHERE c.`assigned_member_id` IS NULL;
--> statement-breakpoint
CREATE TABLE `chores_new` (
	`id` text PRIMARY KEY,
	`family_id` text NOT NULL REFERENCES `families`(`id`),
	`title` text NOT NULL,
	`description` text NOT NULL DEFAULT '',
	`emoji` text NOT NULL,
	`frequency` text NOT NULL,
	`coin_value` integer NOT NULL,
	`is_active` integer NOT NULL DEFAULT true,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `chores_new` SELECT `id`, `family_id`, `title`, `description`, `emoji`, `frequency`, `coin_value`, `is_active`, `created_at` FROM `chores`;
--> statement-breakpoint
DROP TABLE `chores`;
--> statement-breakpoint
ALTER TABLE `chores_new` RENAME TO `chores`;
--> statement-breakpoint
CREATE INDEX `idx_chore_family` ON `chores` (`family_id`, `is_active`);
