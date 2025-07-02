/*
  Warnings:

  - You are about to drop the column `processedAt` on the `withdrawals` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `withdrawals` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `withdrawals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "processedAt",
DROP COLUMN "reason",
DROP COLUMN "rejectedAt";
