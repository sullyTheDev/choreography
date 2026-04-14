INSERT OR IGNORE INTO `prize_assignments` (`prize_id`, `member_id`)
SELECT p.`id`, fm.`member_id`
FROM `prizes` p
JOIN `family_members` fm ON p.`family_id` = fm.`family_id`
JOIN `members` m ON fm.`member_id` = m.`id`
WHERE p.`is_active` = 1 AND m.`is_active` = 1;
