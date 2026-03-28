CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `angles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `angles_id` PRIMARY KEY(`id`),
	CONSTRAINT `angles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `backlog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legacyCode` varchar(30),
	`proposedCode` varchar(30),
	`topic` text,
	`oldStatus` varchar(50),
	`newStatus` varchar(50),
	`laneCode` varchar(10),
	`pillarCode` varchar(10),
	`seriesCode` varchar(20),
	`source` varchar(200),
	`difficulty` int,
	`approvalNeed` varchar(50),
	`whyKeep` text,
	`suggestedWeek` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backlog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(20) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`noteType` varchar(30) DEFAULT 'note',
	`completed` boolean DEFAULT false,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_ideas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ideaCode` varchar(30),
	`topic` text,
	`angle` varchar(200),
	`format` varchar(100),
	`laneCode` varchar(10),
	`pillarCode` varchar(10),
	`seriesCode` varchar(20),
	`angleCode` varchar(20),
	`difficulty` int,
	`priority` varchar(20),
	`status` varchar(30) DEFAULT 'Idea',
	`notes` text,
	`source` varchar(200),
	`approvalNeed` varchar(50),
	`easeScore` int,
	`impactScore` int,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_ideas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copy_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` varchar(50),
	`captionTemplate` text,
	`hashtagTemplate` text,
	`ctaTemplate` text,
	`structure` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `copy_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lanes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lanes_id` PRIMARY KEY(`id`),
	CONSTRAINT `lanes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int,
	`postCode` varchar(30),
	`datePosted` varchar(20),
	`weekLabel` varchar(30),
	`topic` varchar(500),
	`format` varchar(100),
	`link` text,
	`reach` int DEFAULT 0,
	`views` int DEFAULT 0,
	`reactions` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`saves` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`inboxDm` int DEFAULT 0,
	`leads` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `optional_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postCode` varchar(30),
	`weekLabel` varchar(30),
	`topic` text,
	`format` varchar(100),
	`laneCode` varchar(10),
	`pillarCode` varchar(10),
	`seriesCode` varchar(20),
	`angleCode` varchar(20),
	`priority` varchar(20),
	`status` varchar(30) DEFAULT 'Optional',
	`notes` text,
	`approvalNeed` varchar(50),
	`difficulty` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `optional_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pillars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pillars_id` PRIMARY KEY(`id`),
	CONSTRAINT `pillars_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postCode` varchar(30) NOT NULL,
	`weekLabel` varchar(30),
	`weekStart` varchar(20),
	`weekEnd` varchar(20),
	`date` varchar(20),
	`day` varchar(10),
	`monthLabel` varchar(30),
	`slotType` varchar(20) DEFAULT 'Main',
	`countsTowardQuota` boolean DEFAULT true,
	`funnelStage` varchar(50),
	`laneCode` varchar(10),
	`pillarCode` varchar(10),
	`seriesCode` varchar(20),
	`seriesName` varchar(200),
	`angleCode` varchar(20),
	`angleName` varchar(200),
	`legacyCode` varchar(30),
	`topic` text,
	`objective` text,
	`format` varchar(100),
	`sourceBank` varchar(200),
	`sourceFile` varchar(500),
	`sourceRef` text,
	`approvalLevel` varchar(50),
	`difficultyScore` int,
	`productionWeight` int,
	`captionComplexity` int,
	`visualComplexity` int,
	`priority` varchar(20) DEFAULT 'Core',
	`status` varchar(30) DEFAULT 'Planned',
	`postingTime` varchar(20),
	`notes` text,
	`publishedLink` text,
	`metricKey` varchar(50),
	`caption` text,
	`hashtags` text,
	`cta` text,
	`copyTemplate` varchar(50),
	`archived` boolean DEFAULT false,
	`archivedMonth` varchar(10),
	`imageUrl` text,
	`reviewStatus` varchar(30) DEFAULT 'draft',
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_postCode_unique` UNIQUE(`postCode`)
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`laneId` int NOT NULL,
	`pillarId` int NOT NULL,
	`purpose` text,
	`typicalFormat` varchar(100),
	`defaultApproval` varchar(100),
	`defaultSourceType` varchar(100),
	`defaultDifficulty` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `series_id` PRIMARY KEY(`id`),
	CONSTRAINT `series_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`completed` boolean DEFAULT false,
	`priority` varchar(20) DEFAULT 'medium',
	`dueDate` varchar(20),
	`calendarNoteId` int,
	`postId` int,
	`category` varchar(50),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoCode` varchar(30),
	`title` varchar(500),
	`topic` text,
	`format` varchar(100),
	`laneCode` varchar(10),
	`pillarCode` varchar(10),
	`seriesCode` varchar(20),
	`angleCode` varchar(20),
	`readinessStatus` varchar(50),
	`productionStage` varchar(50),
	`scriptUrl` text,
	`rawFootageUrl` text,
	`editedUrl` text,
	`thumbnailUrl` text,
	`publishedUrl` text,
	`duration` int,
	`notes` text,
	`priority` varchar(20),
	`status` varchar(30) DEFAULT 'Planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whiteboards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`data` text,
	`thumbnail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whiteboards_id` PRIMARY KEY(`id`)
);
