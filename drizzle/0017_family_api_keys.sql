CREATE TABLE `family_api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`key_hash` text,
	`key_prefix` text,
	`key_last4` text,
	`created_by_member_id` text,
	`created_at` text NOT NULL,
	`rotated_at` text,
	`revoked_at` text,
	`last_used_at` text,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_family_api_key_family` ON `family_api_keys` (`family_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_family_api_key_hash` ON `family_api_keys` (`key_hash`);
--> statement-breakpoint
CREATE INDEX `idx_family_api_key_active` ON `family_api_keys` (`family_id`,`revoked_at`);