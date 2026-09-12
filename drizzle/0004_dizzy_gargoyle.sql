PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monthly_salary_net` real DEFAULT 1830 NOT NULL,
	`meal_voucher_amount` real DEFAULT 160 NOT NULL,
	`monthly_savings_target` real DEFAULT 1500 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user_settings`("id", "monthly_salary_net", "meal_voucher_amount", "monthly_savings_target", "updated_at") SELECT "id", 1830, 160, CASE WHEN "monthly_savings_target" = 0 THEN 1500 ELSE "monthly_savings_target" END, "updated_at" FROM `user_settings`;--> statement-breakpoint
DROP TABLE `user_settings`;--> statement-breakpoint
ALTER TABLE `__new_user_settings` RENAME TO `user_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
