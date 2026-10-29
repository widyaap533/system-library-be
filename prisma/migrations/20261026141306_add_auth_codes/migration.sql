/*
  Warnings:

  - You are about to alter the column `borrow_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `due_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `return_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - A unique constraint covering the columns `[code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `loans` MODIFY `borrow_date` DATETIME NOT NULL,
    MODIFY `due_date` DATETIME NOT NULL,
    MODIFY `return_date` DATETIME NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `code` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `refresh_token` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `roles_code_key` ON `roles`(`code`);
