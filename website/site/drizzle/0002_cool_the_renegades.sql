CREATE TABLE `payment_gateway_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(80) NOT NULL,
	`encryptedPayload` text NOT NULL,
	`liveEnabled` boolean NOT NULL DEFAULT false,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_gateway_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_gateway_settings_provider_unique` UNIQUE(`provider`)
);
