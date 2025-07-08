/*
  Warnings:

  - You are about to drop the column `gameId` on the `trades` table. All the data in the column will be lost.
  - You are about to drop the column `winAmount` on the `trades` table. All the data in the column will be lost.
  - Added the required column `number` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `color` on the `trades` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TradeColor" AS ENUM ('RED', 'VIOLET', 'GREEN');

-- AlterTable
ALTER TABLE "trades" DROP COLUMN "gameId",
DROP COLUMN "winAmount",
ADD COLUMN     "number" INTEGER NOT NULL,
DROP COLUMN "color",
ADD COLUMN     "color" "TradeColor" NOT NULL;
