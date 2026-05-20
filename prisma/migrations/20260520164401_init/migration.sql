-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kickOffTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "matchday" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scoreAtHalfTimeHome" INTEGER,
    "scoreAtHalfTimeAway" INTEGER,
    "scoreAt90Home" INTEGER,
    "scoreAt90Away" INTEGER,
    "extraTimePlayed" BOOLEAN NOT NULL DEFAULT false,
    "scoreAfterExtraTimeHome" INTEGER,
    "scoreAfterExtraTimeAway" INTEGER,
    "homeTeamDetails" TEXT,
    "awayTeamDetails" TEXT,
    "homeTeamSubstitutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "awayTeamSubstitutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disciplineNotes" TEXT,
    "manOfTheMatch" TEXT,
    "observations" TEXT,
    "tournamentStage" TEXT,
    "progressionNotes" TEXT,
    "technicalCommittee" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "upcomingFixtures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerStat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
