/*
  Warnings:

  - You are about to alter the column `borrow_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `due_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `return_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - A unique constraint covering the columns `[code]` on the table `copy_statuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `loan_statuses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `copy_statuses` ADD COLUMN `code` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `loan_statuses` ADD COLUMN `code` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `loans` MODIFY `borrow_date` DATETIME NOT NULL,
    MODIFY `due_date` DATETIME NOT NULL,
    MODIFY `return_date` DATETIME NULL;

-- CreateIndex
CREATE UNIQUE INDEX `copy_statuses_code_key` ON `copy_statuses`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `loan_statuses_code_key` ON `loan_statuses`(`code`);
