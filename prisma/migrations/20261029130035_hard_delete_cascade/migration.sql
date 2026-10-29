/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `authors` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `book_authors` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `book_copies` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `book_subjects` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `digital_contents` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `loans` table. All the data in the column will be lost.
  - You are about to alter the column `borrow_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `due_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `return_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `is_deleted` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `book_authors` DROP FOREIGN KEY `book_authors_author_id_fkey`;

-- DropForeignKey
ALTER TABLE `book_authors` DROP FOREIGN KEY `book_authors_book_id_fkey`;

-- DropForeignKey
ALTER TABLE `book_copies` DROP FOREIGN KEY `book_copies_book_id_fkey`;

-- DropForeignKey
ALTER TABLE `book_subjects` DROP FOREIGN KEY `book_subjects_book_id_fkey`;

-- DropForeignKey
ALTER TABLE `book_subjects` DROP FOREIGN KEY `book_subjects_subject_id_fkey`;

-- DropForeignKey
ALTER TABLE `digital_contents` DROP FOREIGN KEY `digital_contents_book_id_fkey`;

-- DropForeignKey
ALTER TABLE `loans` DROP FOREIGN KEY `loans_book_copy_id_fkey`;

-- DropForeignKey
ALTER TABLE `loans` DROP FOREIGN KEY `loans_user_id_fkey`;

-- AlterTable
ALTER TABLE `authors` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `book_authors` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `book_copies` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `book_subjects` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `books` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `digital_contents` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `loans` DROP COLUMN `is_deleted`,
    MODIFY `borrow_date` DATETIME NOT NULL,
    MODIFY `due_date` DATETIME NOT NULL,
    MODIFY `return_date` DATETIME NULL;

-- AlterTable
ALTER TABLE `subjects` DROP COLUMN `is_deleted`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `is_deleted`;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_subjects` ADD CONSTRAINT `book_subjects_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_subjects` ADD CONSTRAINT `book_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `digital_contents` ADD CONSTRAINT `digital_contents_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_copies` ADD CONSTRAINT `book_copies_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_book_copy_id_fkey` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
