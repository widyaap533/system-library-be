/*
  Warnings:

  - You are about to drop the column `opac` on the `book_copies` table. All the data in the column will be lost.
  - You are about to drop the column `acquisition_date` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `loan_access` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `physical_format` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `resource_type` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `status_id` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `eksemplar_id` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `status_id` on the `loans` table. All the data in the column will be lost.
  - You are about to alter the column `borrow_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `due_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `return_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the `statuses` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[barcode]` on the table `book_copies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bibid]` on the table `books` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `access_type_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acquisition_date` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barcode` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `copy_status_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `physical_format_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource_type_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_id` to the `book_copies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bibid` to the `books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `book_copy_id` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loan_status_id` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `books` DROP FOREIGN KEY `books_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `books` DROP FOREIGN KEY `books_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `books` DROP FOREIGN KEY `books_subject_id_fkey`;

-- DropForeignKey
ALTER TABLE `loans` DROP FOREIGN KEY `loans_eksemplar_id_fkey`;

-- DropForeignKey
ALTER TABLE `loans` DROP FOREIGN KEY `loans_status_id_fkey`;

-- AlterTable
ALTER TABLE `book_copies` DROP COLUMN `opac`,
    ADD COLUMN `access_type_id` CHAR(36) NOT NULL,
    ADD COLUMN `acquisition_date` DATE NOT NULL,
    ADD COLUMN `barcode` VARCHAR(30) NOT NULL,
    ADD COLUMN `category_id` CHAR(36) NOT NULL,
    ADD COLUMN `copy_status_id` CHAR(36) NOT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `opac_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `physical_format_id` CHAR(36) NOT NULL,
    ADD COLUMN `resource_type_id` CHAR(36) NOT NULL,
    ADD COLUMN `room_id` CHAR(36) NOT NULL,
    MODIFY `id_number` VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE `books` DROP COLUMN `acquisition_date`,
    DROP COLUMN `category_id`,
    DROP COLUMN `loan_access`,
    DROP COLUMN `location`,
    DROP COLUMN `physical_format`,
    DROP COLUMN `resource_type`,
    DROP COLUMN `status_id`,
    DROP COLUMN `subject_id`,
    ADD COLUMN `bibid` VARCHAR(30) NOT NULL,
    ADD COLUMN `call_number` VARCHAR(100) NULL,
    ADD COLUMN `publication_place` VARCHAR(255) NULL,
    ADD COLUMN `publication_year` INTEGER NULL,
    MODIFY `title` VARCHAR(500) NOT NULL,
    MODIFY `publisher` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `categories` ADD COLUMN `default_access_type_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `loans` DROP COLUMN `eksemplar_id`,
    DROP COLUMN `status_id`,
    ADD COLUMN `book_copy_id` CHAR(36) NOT NULL,
    ADD COLUMN `loan_status_id` CHAR(36) NOT NULL,
    MODIFY `borrow_date` DATETIME NOT NULL,
    MODIFY `due_date` DATETIME NOT NULL,
    MODIFY `return_date` DATETIME NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `role_id` CHAR(36) NOT NULL,
    MODIFY `member_id` VARCHAR(20) NOT NULL,
    MODIFY `date_of_birth` DATE NOT NULL;

-- DropTable
DROP TABLE `statuses`;

-- CreateTable
CREATE TABLE `authors` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    INDEX `authors_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_authors` (
    `book_id` CHAR(36) NOT NULL,
    `author_id` CHAR(36) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'Pengarang',
    `position` INTEGER NOT NULL DEFAULT 1,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    INDEX `book_authors_author_id_idx`(`author_id`),
    PRIMARY KEY (`book_id`, `author_id`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_subjects` (
    `book_id` CHAR(36) NOT NULL,
    `subject_id` CHAR(36) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    INDEX `book_subjects_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`book_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `digital_contents` (
    `id` CHAR(36) NOT NULL,
    `book_id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mime` VARCHAR(100) NULL,
    `size` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    INDEX `digital_contents_book_id_idx`(`book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_types` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_borrowable` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_formats` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_types` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `copy_statuses` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `libraries` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `library_id` CHAR(36) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    INDEX `rooms_library_id_idx`(`library_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_statuses` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `book_copies_barcode_key` ON `book_copies`(`barcode`);

-- CreateIndex
CREATE INDEX `book_copies_copy_status_id_idx` ON `book_copies`(`copy_status_id`);

-- CreateIndex
CREATE INDEX `book_copies_room_id_idx` ON `book_copies`(`room_id`);

-- CreateIndex
CREATE UNIQUE INDEX `books_bibid_key` ON `books`(`bibid`);

-- CreateIndex
CREATE INDEX `books_title_idx` ON `books`(`title`);

-- CreateIndex
CREATE INDEX `books_call_number_idx` ON `books`(`call_number`);

-- CreateIndex
CREATE INDEX `loans_book_copy_id_idx` ON `loans`(`book_copy_id`);

-- CreateIndex
CREATE INDEX `loans_loan_status_id_idx` ON `loans`(`loan_status_id`);

-- CreateIndex
CREATE INDEX `users_role_id_idx` ON `users`(`role_id`);

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_subjects` ADD CONSTRAINT `book_subjects_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_subjects` ADD CONSTRAINT `book_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `digital_contents` ADD CONSTRAINT `digital_contents_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_physical_format_id_fkey` FOREIGN KEY (`physical_format_id`) REFERENCES `physical_formats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_resource_type_id_fkey` FOREIGN KEY (`resource_type_id`) REFERENCES `resource_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_access_type_id_fkey` FOREIGN KEY (`access_type_id`) REFERENCES `access_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_copy_status_id_fkey` FOREIGN KEY (`copy_status_id`) REFERENCES `copy_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_default_access_type_id_fkey` FOREIGN KEY (`default_access_type_id`) REFERENCES `access_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_library_id_fkey` FOREIGN KEY (`library_id`) REFERENCES `libraries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_loan_status_id_fkey` FOREIGN KEY (`loan_status_id`) REFERENCES `loan_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_book_copy_id_fkey` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `book_copies` RENAME INDEX `book_copies_book_id_fkey` TO `book_copies_book_id_idx`;

-- RenameIndex
ALTER TABLE `loans` RENAME INDEX `loans_user_id_fkey` TO `loans_user_id_idx`;
