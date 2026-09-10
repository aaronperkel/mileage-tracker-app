CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`start_tenths` integer NOT NULL,
	`end_tenths` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trips_date_idx` ON `trips` (`date`);