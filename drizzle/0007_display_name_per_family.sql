-- Remove the global unique constraint on members.display_name
-- SQLite requires a table rebuild to remove a column's unique constraint.
PRAGMA foreign_keys = OFF;
--> statement-breakpoint
CREATE TABLE `members_new` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_emoji` text NOT NULL DEFAULT '👤',
	`email` text,
	`password_hash` text,
	`pin` text,
	`is_active` integer NOT NULL DEFAULT true,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `members_new` SELECT `id`, `display_name`, `avatar_emoji`, `email`, `password_hash`, `pin`, `is_active`, `created_at` FROM `members`;
--> statement-breakpoint
DROP TABLE `members`;
--> statement-breakpoint
ALTER TABLE `members_new` RENAME TO `members`;
--> statement-breakpoint
CREATE INDEX `idx_member_display_name` ON `members` (`display_name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_email` ON `members` (`email`);
--> statement-breakpoint
PRAGMA foreign_keys = ON;
