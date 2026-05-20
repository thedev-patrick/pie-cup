/*
  Warnings:

  - You are about to drop the column `awayTeamDetails` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `awayTeamSubstitutes` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `disciplineNotes` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeamDetails` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeamSubstitutes` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `progressionNotes` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `technicalCommittee` on the `Fixture` table. All the data in the column will be lost.
  - You are about to drop the column `upcomingFixtures` on the `Fixture` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Fixture" DROP COLUMN "awayTeamDetails",
DROP COLUMN "awayTeamSubstitutes",
DROP COLUMN "disciplineNotes",
DROP COLUMN "homeTeamDetails",
DROP COLUMN "homeTeamSubstitutes",
DROP COLUMN "observations",
DROP COLUMN "progressionNotes",
DROP COLUMN "technicalCommittee",
DROP COLUMN "upcomingFixtures";

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" TEXT,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineup" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "playerId" TEXT,
    "playerName" TEXT,
    "assistName" TEXT,
    "playerOutName" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_teamId_jerseyNumber_key" ON "Player"("teamId", "jerseyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineup_fixtureId_playerId_key" ON "MatchLineup"("fixtureId", "playerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
