-- Phokela Guest House Database Initialization Script
-- This script creates all necessary tables for the hotel booking system

-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `users`;

-- Create Services Table
CREATE TABLE `services` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('accommodation', 'conference', 'catering', 'events') NOT NULL,
  `facilities` JSON DEFAULT NULL,
  `size` INT DEFAULT 0,
  `maxPerson` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL,
  `priceUnit` ENUM('per night', 'per day', 'per person', 'per event', 'per hour') DEFAULT 'per night',
  `images` JSON DEFAULT NULL,
  `availability` TINYINT(1) DEFAULT 1,
  `featured` TINYINT(1) DEFAULT 0,
  `minimumBooking` JSON DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `seo` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_availability` (`category`, `availability`),
  KEY `idx_price` (`price`),
  KEY `idx_featured_availability` (`featured`, `availability`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Rooms Table
CREATE TABLE `rooms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `type` ENUM('standard', 'deluxe', 'suite', 'family', 'executive') NOT NULL DEFAULT 'standard',
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 1,
  `size` DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Room size in square meters',
  `beds` INT NOT NULL DEFAULT 1,
  `amenities` JSON DEFAULT NULL COMMENT 'List of room amenities',
  `mainImage` VARCHAR(500) DEFAULT NULL COMMENT 'Main/cover image URL',
  `images` JSON DEFAULT NULL COMMENT 'Array of additional image URLs',
  `availability` TINYINT(1) DEFAULT 1,
  `featured` TINYINT(1) DEFAULT 0,
  `floor` INT DEFAULT NULL COMMENT 'Floor number',
  `roomNumber` VARCHAR(50) DEFAULT NULL COMMENT 'Unique room number',
  `status` ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
  `viewType` VARCHAR(100) DEFAULT NULL COMMENT 'e.g., Sea View, Garden View',
  `smokingAllowed` TINYINT(1) DEFAULT 0,
  `petFriendly` TINYINT(1) DEFAULT 0,
  `seo` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_room_number` (`roomNumber`),
  KEY `idx_type_availability` (`type`, `availability`),
  KEY `idx_price` (`price`),
  KEY `idx_capacity` (`capacity`),
  KEY `idx_featured_availability` (`featured`, `availability`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Bookings Table
CREATE TABLE `bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bookingReference` VARCHAR(255) NOT NULL,
  `serviceId` INT NOT NULL,
  `serviceSnapshot` JSON DEFAULT NULL,
  `primaryGuest` JSON NOT NULL,
  `additionalGuests` JSON DEFAULT NULL,
  `bookingDetails` JSON NOT NULL,
  `pricing` JSON NOT NULL,
  `specialRequests` JSON DEFAULT NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show') DEFAULT 'pending',
  `paymentStatus` ENUM('pending', 'deposit-paid', 'fully-paid', 'refunded') DEFAULT 'pending',
  `paymentDetails` JSON DEFAULT NULL,
  `communication` JSON DEFAULT NULL,
  `notes` JSON DEFAULT NULL,
  `source` ENUM('website', 'phone', 'email', 'walk-in', 'referral') DEFAULT 'website',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_booking_reference` (`bookingReference`),
  KEY `idx_service_id` (`serviceId`),
  KEY `idx_status_created` (`status`, `createdAt`),
  CONSTRAINT `fk_bookings_service` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Contacts Table
CREATE TABLE `contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'in-progress', 'resolved') DEFAULT 'new',
  `response` TEXT DEFAULT NULL,
  `respondedAt` DATETIME DEFAULT NULL,
  `respondedBy` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Users Table (for admin authentication)
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(200) DEFAULT NULL,
  `role` ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
  `active` TINYINT(1) DEFAULT 1,
  `lastLogin` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_role_active` (`role`, `active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO `users` (`username`, `email`, `password`, `fullName`, `role`, `active`)
VALUES ('admin', 'admin@phokela.com', '$2b$10$Tt3fVdp1Mt9KwpatzDcAOO/fzJT/mnHpNB4VHwytx1OgFHqWLMjsK', 'System Administrator', 'admin', 1);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_dates ON bookings((CAST(JSON_UNQUOTE(JSON_EXTRACT(bookingDetails, '$.checkIn')) AS DATE)));
CREATE INDEX idx_bookings_event_dates ON bookings((CAST(JSON_UNQUOTE(JSON_EXTRACT(bookingDetails, '$.eventDate')) AS DATE)));

-- Success message
SELECT 'Database tables created successfully!' AS message;
