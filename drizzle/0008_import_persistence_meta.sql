ALTER TABLE `user_settings` ADD `turso_database_host` text;
--> statement-breakpoint
ALTER TABLE `user_settings` ADD `last_import_transaction_count` integer;
--> statement-breakpoint
ALTER TABLE `user_settings` ADD `last_import_completed_at` text;
