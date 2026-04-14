CREATE TABLE `prize_assignments` (
	`prize_id` text NOT NULL REFERENCES `prizes`(`id`),
	`member_id` text NOT NULL REFERENCES `members`(`id`),
	PRIMARY KEY(`prize_id`, `member_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_prize_assignment_member` ON `prize_assignments` (`member_id`);
