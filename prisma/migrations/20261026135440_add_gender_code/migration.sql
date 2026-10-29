/*
  Warnings:

  - You are about to alter the column `borrow_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `due_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `return_date` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - A unique constraint covering the columns `[code]` on the table `genders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `genders` ADD COLUMN `code` VARCHAR(5) NULL;

-- AlterTable
ALTER TABLE `loans` MODIFY `borrow_date` DATETIME NOT NULL,
    MODIFY `due_date` DATETIME NOT NULL,
    MODIFY `return_date` DATETIME NULL;

-- CreateIndex
CREATE UNIQUE INDEX `genders_code_key` ON `genders`(`code`);
