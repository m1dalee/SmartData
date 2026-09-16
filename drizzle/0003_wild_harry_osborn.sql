CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monthly_savings_target` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
