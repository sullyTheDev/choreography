-- Make user.email nullable to support PIN-only members who have no email address.
-- SQLite requires a full table rebuild to change column nullability.

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- 1. Rename current table
ALTER TABLE `user` RENAME TO `_user_backup`;
--> statement-breakpoint

-- 2. Create new table with nullable email
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

-- 3. Copy all existing data
INSERT INTO `user` (`id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`)
SELECT `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`
FROM `_user_backup`;
--> statement-breakpoint

-- 4. Drop backup table (also drops its old unique index)
DROP TABLE `_user_backup`;
--> statement-breakpoint

PRAGMA foreign_keys = ON;
--> statement-breakpoint

-- 5. Partial unique index: allows multiple NULL emails, enforces uniqueness only when present
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`) WHERE `email` IS NOT NULL;
