CREATE TABLE `activity_events` (
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
	FOREIGN KEY (`actor_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activity_family_time` ON `activity_events` (`family_id`,`occurred_at`);
--> statement-breakpoint
CREATE INDEX `idx_activity_subject_time` ON `activity_events` (`subject_member_id`,`occurred_at`);
--> statement-breakpoint
CREATE INDEX `idx_activity_type_time` ON `activity_events` (`event_type`,`occurred_at`);
--> statement-breakpoint
INSERT OR IGNORE INTO `activity_events` (
	`id`,
	`family_id`,
	`actor_member_id`,
	`subject_member_id`,
	`event_type`,
	`entity_type`,
	`entity_id`,
	`delta_coins`,
	`metadata`,
	`occurred_at`,
	`created_at`
)
SELECT
	'bf_chore_' || cc.`id`,
	cc.`family_id`,
	cc.`member_id`,
	cc.`member_id`,
	'chore_completed',
	'chore',
	cc.`chore_id`,
	cc.`coins_awarded`,
	'{"source":"backfill_v1","importedFrom":"chore_completions"}',
	cc.`completed_at`,
	cc.`completed_at`
FROM `chore_completions` cc;
--> statement-breakpoint
INSERT OR IGNORE INTO `activity_events` (
	`id`,
	`family_id`,
	`actor_member_id`,
	`subject_member_id`,
	`event_type`,
	`entity_type`,
	`entity_id`,
	`delta_coins`,
	`metadata`,
	`occurred_at`,
	`created_at`
)
SELECT
	'bf_prize_purchase_' || pr.`id`,
	pr.`family_id`,
	pr.`member_id`,
	pr.`member_id`,
	'prize_purchased',
	'prize_redemption',
	pr.`id`,
	-pr.`coin_cost`,
	'{"source":"backfill_v1","importedFrom":"prize_redemptions","prizeId":"' || pr.`prize_id` || '","status":"' || pr.`status` || '"}',
	pr.`redeemed_at`,
	pr.`redeemed_at`
FROM `prize_redemptions` pr;