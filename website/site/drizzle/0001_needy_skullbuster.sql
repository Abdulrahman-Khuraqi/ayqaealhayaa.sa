CREATE TABLE `catalog_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('product','service') NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(120) NOT NULL,
	`description` text,
	`priceHalalas` int,
	`priceLabel` varchar(80),
	`imageUrl` text,
	`imageKey` varchar(320),
	`featured` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `store_content` (
	`key` varchar(120) NOT NULL,
	`value` text NOT NULL,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_content_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `store_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(64) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(32),
	`summary` text NOT NULL,
	`notes` text,
	`status` enum('new','contacted','quoted','in_progress','completed','cancelled') NOT NULL DEFAULT 'new',
	`amountHalalas` int,
	`invoiceId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_orders_reference_unique` UNIQUE(`reference`)
);
