import { Fixture, PlayerStat } from '@prisma/client';

export type FixtureWithStats = Fixture & { stats: PlayerStat[] };

export function parseScore(value?: string) {
  if (!value) return null;
  const parts = value.split('-').map((part) => parseInt(part.trim(), 10));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { home: parts[0], away: parts[1] };
}

export function buildFixturePayload(body: any) {
  const scoreAtHalfTime = parseScore(body.scoreAtHalfTime);
  const scoreAt90Minutes = parseScore(body.scoreAt90Minutes);

  return {
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    date: new Date(body.date),
    kickOffTime: body.kickOffTime,
    venue: body.venue,
    matchday: body.matchday || null,
    status: body.status || 'scheduled',
    scoreAtHalfTimeHome: scoreAtHalfTime?.home ?? null,
    scoreAtHalfTimeAway: scoreAtHalfTime?.away ?? null,
    scoreAt90Home: scoreAt90Minutes?.home ?? null,
    scoreAt90Away: scoreAt90Minutes?.away ?? null,
    extraTimePlayed: body.extraTimePlayed === 'YES' || body.extraTimePlayed === true,
    scoreAfterExtraTimeHome: parseInt(body.scoreAfterExtraTimeHome, 10) || null,
    scoreAfterExtraTimeAway: parseInt(body.scoreAfterExtraTimeAway, 10) || null,
    homeTeamDetails: body.homeTeamDetails || null,
    awayTeamDetails: body.awayTeamDetails || null,
    homeTeamSubstitutes: Array.isArray(body.homeTeamSubstitutes)
      ? body.homeTeamSubstitutes
      : String(body.homeTeamSubstitutes || '').split(',').map((item) => item.trim()).filter(Boolean),
    awayTeamSubstitutes: Array.isArray(body.awayTeamSubstitutes)
      ? body.awayTeamSubstitutes
      : String(body.awayTeamSubstitutes || '').split(',').map((item) => item.trim()).filter(Boolean),
    disciplineNotes: body.disciplineNotes || null,
    manOfTheMatch: body.manOfTheMatch || null,
    observations: body.observations || null,
    tournamentStage: body.tournamentStage || null,
    progressionNotes: body.progressionNotes || null,
    technicalCommittee: Array.isArray(body.technicalCommittee)
      ? body.technicalCommittee
      : String(body.technicalCommittee || '').split('\n').map((item) => item.trim()).filter(Boolean),
    upcomingFixtures: Array.isArray(body.upcomingFixtures)
      ? body.upcomingFixtures
      : String(body.upcomingFixtures || '').split('\n').map((item) => item.trim()).filter(Boolean),
    stats: Array.isArray(body.stats) ? body.stats : [],
  };
}
