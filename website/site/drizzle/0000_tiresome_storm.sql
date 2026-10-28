CREATE TABLE `integration_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`keyPrefix` varchar(24) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`lastUsedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_api_keys_keyPrefix_unique` UNIQUE(`keyPrefix`),
	CONSTRAINT `integration_api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(48) NOT NULL,
	`reference` varchar(64) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`description` text NOT NULL,
	`amountHalalas` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'SAR',
	`status` enum('draft','pending','paid','expired','cancelled','failed') NOT NULL DEFAULT 'draft',
	`providerName` varchar(80),
	`providerInvoiceId` varchar(160),
	`providerPaymentUrl` text,
	`expiresAt` timestamp,
	`paidAt` timestamp,
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `invoices_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`source` varchar(80) NOT NULL,
	`signatureVerified` boolean NOT NULL DEFAULT false,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
