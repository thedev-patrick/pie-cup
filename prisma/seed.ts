/**
 * Seed script — generates realistic test data for the CCI Football admin.
 *
 * Usage:
 *   npx tsx prisma/seed.ts          # add data on top of existing data
 *   npx tsx prisma/seed.ts --reset  # wipe everything first, then seed
 */

import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  console.error('❌  Seed script is disabled in production. Exiting.');
  process.exit(1);
}

const prisma = new PrismaClient();
const RESET = process.argv.includes('--reset');

// ─── Player name pools ────────────────────────────────────────────────────────

const GK_NAMES = ['David Mensah', 'Kofi Asante', 'Emmanuel Osei'];
const DEF_NAMES = [
  'Samuel Boateng', 'Isaac Darko', 'Richard Quaye', 'Michael Addo',
  'Joseph Ampah', 'Francis Koomson', 'Daniel Ansah', 'Patrick Owusu',
  'Benjamin Tetteh', 'George Acheampong',
];
const MID_NAMES = [
  'Kwame Acheampong', 'Eric Ofori', 'Solomon Asare', 'Nana Agyei',
  'Augustine Mensah', 'Charles Boateng', 'Peter Larbi', 'Yaw Darko',
  'Frederick Quaye', 'Lawrence Owusu',
];
const FWD_NAMES = [
  'Abena Sarpong', 'Kweku Frimpong', 'Ato Mensah', 'Fiifi Asare',
  'Kojo Amponsah', 'Adjoa Tetteh',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Build a 20-player squad (11 starters + 5 subs + 4 extras) ───────────────

interface SquadPlayer {
  fullName: string;
  jerseyNumber: number;
  position: string;
  role: 'starter' | 'substitute';
}

function buildSquad(): SquadPlayer[] {
  const squad: SquadPlayer[] = [];
  const usedNumbers = new Set<number>();

  function nextNumber(): number {
    let n: number;
    do { n = Math.floor(Math.random() * 30) + 1; } while (usedNumbers.has(n));
    usedNumbers.add(n);
    return n;
  }

  // 1 GK starter
  squad.push({ fullName: pick(GK_NAMES), jerseyNumber: 1, position: 'GK', role: 'starter' });
  usedNumbers.add(1);

  // 4 DEF starters
  const defs = shuffle(DEF_NAMES).slice(0, 6);
  for (let i = 0; i < 4; i++) {
    squad.push({ fullName: defs[i], jerseyNumber: nextNumber(), position: pick(['CB', 'LB', 'RB']), role: 'starter' });
  }

  // 4 MID starters
  const mids = shuffle(MID_NAMES).slice(0, 6);
  for (let i = 0; i < 4; i++) {
    squad.push({ fullName: mids[i], jerseyNumber: nextNumber(), position: pick(['CM', 'DM', 'AM']), role: 'starter' });
  }

  // 2 FWD starters
  const fwds = shuffle(FWD_NAMES).slice(0, 4);
  for (let i = 0; i < 2; i++) {
    squad.push({ fullName: fwds[i], jerseyNumber: nextNumber(), position: pick(['ST', 'LW', 'RW']), role: 'starter' });
  }

  // 1 substitute GK
  squad.push({ fullName: pick(GK_NAMES), jerseyNumber: nextNumber(), position: 'GK', role: 'substitute' });

  // 4 outfield substitutes
  for (let i = 4; i < 6; i++) {
    squad.push({ fullName: defs[i], jerseyNumber: nextNumber(), position: pick(['CB', 'LB']), role: 'substitute' });
  }
  for (let i = 4; i < 6; i++) {
    squad.push({ fullName: mids[i], jerseyNumber: nextNumber(), position: pick(['CM', 'AM']), role: 'substitute' });
  }

  // 4 extra squad members (not in lineups)
  for (let i = 2; i < 4; i++) {
    squad.push({ fullName: fwds[i], jerseyNumber: nextNumber(), position: 'ST', role: 'substitute' });
    squad.push({ fullName: pick(DEF_NAMES), jerseyNumber: nextNumber(), position: 'CB', role: 'substitute' });
  }

  return squad;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (RESET) {
    console.log('⚠️  Resetting database…');
    await prisma.matchEvent.deleteMany();
    await prisma.playerStat.deleteMany();
    await prisma.matchLineup.deleteMany();
    await prisma.fixture.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    console.log('✓  Database cleared\n');
  }

  // ── Teams ──────────────────────────────────────────────────────────────────

  console.log('Creating teams…');
  const teamDefs = [
    { name: 'Accra Lions FC',      shortName: 'ALF' },
    { name: 'Cape Coast United',   shortName: 'CCU' },
    { name: 'Kumasi Warriors',     shortName: 'KWR' },
    { name: 'Tamale Thunder',      shortName: 'TTH' },
    { name: 'Takoradi Rangers',    shortName: 'TRG' },
    { name: 'Sunyani Eagles',      shortName: 'SEG' },
  ];

  const teams = await Promise.all(
    teamDefs.map((t) =>
      prisma.team.upsert({
        where: { name: t.name },
        update: {},
        create: { name: t.name, shortName: t.shortName },
      }),
    ),
  );
  console.log(`✓  ${teams.length} teams created\n`);

  // ── Players ────────────────────────────────────────────────────────────────

  console.log('Creating players…');
  let totalPlayers = 0;
  for (const team of teams) {
    const squad = buildSquad();
    for (const p of squad) {
      await prisma.player.upsert({
        where: { teamId_jerseyNumber: { teamId: team.id, jerseyNumber: p.jerseyNumber } },
        update: {},
        create: {
          fullName: p.fullName,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          teamId: team.id,
        },
      });
      totalPlayers++;
    }
  }
  console.log(`✓  ${totalPlayers} players created\n`);

  // Reload teams with players
  const teamsWithPlayers = await prisma.team.findMany({ include: { players: true } });
  const teamMap = Object.fromEntries(teamsWithPlayers.map((t) => [t.name, t]));

  // ── Tournaments ────────────────────────────────────────────────────────────

  console.log('Creating tournaments…');
  const [leagueTournament, cupTournament] = await Promise.all([
    prisma.tournament.upsert({
      where: { name: 'CCI Premier League' },
      update: {},
      create: { name: 'CCI Premier League', season: '2024/25' },
    }),
    prisma.tournament.upsert({
      where: { name: 'CCI Cup' },
      update: {},
      create: { name: 'CCI Cup', season: '2025' },
    }),
  ]);
  console.log('✓  2 tournaments created\n');

  // ── Helper: attach lineup + events to a completed fixture ─────────────────

  async function attachLineupAndEvents(
    fixtureId: string,
    homeTeamName: string,
    awayTeamName: string,
    htHome: number,
    htAway: number,
    ftHome: number,
    ftAway: number,
  ) {
    const home = teamMap[homeTeamName];
    const away = teamMap[awayTeamName];

    if (!home || !away) return;

    // -- Lineups --------------------------------------------------------------
    const getSquad = (team: typeof home) => {
      const ps = team.players;
      const gk = ps.find((p) => p.position === 'GK')!;
      const outfield = ps.filter((p) => p.position !== 'GK');
      const starters = [gk, ...outfield.slice(0, 10)];
      const subs = outfield.slice(10, 15);
      return { starters, subs };
    };

    const homeSquad = getSquad(home);
    const awaySquad = getSquad(away);

    const lineupData = [
      ...homeSquad.starters.map((p) => ({ fixtureId, playerId: p.id, side: 'home', role: 'starter', position: p.position })),
      ...homeSquad.subs.map((p) => ({ fixtureId, playerId: p.id, side: 'home', role: 'substitute', position: p.position })),
      ...awaySquad.starters.map((p) => ({ fixtureId, playerId: p.id, side: 'away', role: 'starter', position: p.position })),
      ...awaySquad.subs.map((p) => ({ fixtureId, playerId: p.id, side: 'away', role: 'substitute', position: p.position })),
    ];

    await prisma.matchLineup.createMany({ data: lineupData, skipDuplicates: true });

    // -- Events ---------------------------------------------------------------
    const events: Array<{
      fixtureId: string; minute: number; type: string; side: string;
      playerName?: string; assistName?: string; playerOutName?: string;
    }> = [];

    // Half-time marker
    events.push({ fixtureId, minute: 45, type: 'half_time', side: 'none' });

    // Goals — distribute between HT and FT buckets
    function addGoals(side: string, players: typeof homeSquad.starters, ht: number, ft: number) {
      let minute = 5;
      for (let i = 0; i < ht; i++) {
        minute += Math.floor(Math.random() * 8) + 3;
        const scorer = pick(players.filter((p) => p.position !== 'GK'));
        const assister = pick(players.filter((p) => p.id !== scorer.id && p.position !== 'GK'));
        events.push({
          fixtureId, minute: Math.min(minute, 44), type: 'goal', side,
          playerName: scorer.fullName, assistName: assister.fullName,
        });
      }
      minute = 47;
      for (let i = 0; i < (ft - ht); i++) {
        minute += Math.floor(Math.random() * 8) + 4;
        const scorer = pick(players.filter((p) => p.position !== 'GK'));
        const assister = pick(players.filter((p) => p.id !== scorer.id && p.position !== 'GK'));
        events.push({
          fixtureId, minute: Math.min(minute, 90), type: 'goal', side,
          playerName: scorer.fullName, assistName: assister.fullName,
        });
      }
    }

    addGoals('home', homeSquad.starters, htHome, ftHome);
    addGoals('away', awaySquad.starters, htAway, ftAway);

    // One yellow card per side
    const homeBooking = pick(homeSquad.starters.filter((p) => p.position !== 'GK'));
    events.push({ fixtureId, minute: Math.floor(Math.random() * 40) + 10, type: 'yellow_card', side: 'home', playerName: homeBooking.fullName });
    const awayBooking = pick(awaySquad.starters.filter((p) => p.position !== 'GK'));
    events.push({ fixtureId, minute: Math.floor(Math.random() * 40) + 10, type: 'yellow_card', side: 'away', playerName: awayBooking.fullName });

    // One substitution per side
    const homeSub = homeSquad.subs[0];
    const homeOff = homeSquad.starters[homeSquad.starters.length - 1];
    events.push({ fixtureId, minute: Math.floor(Math.random() * 25) + 55, type: 'substitution', side: 'home', playerName: homeSub.fullName, playerOutName: homeOff.fullName });
    const awaySub = awaySquad.subs[0];
    const awayOff = awaySquad.starters[awaySquad.starters.length - 1];
    events.push({ fixtureId, minute: Math.floor(Math.random() * 25) + 55, type: 'substitution', side: 'away', playerName: awaySub.fullName, playerOutName: awayOff.fullName });

    await prisma.matchEvent.createMany({ data: events, skipDuplicates: true });

    // -- Scores ---------------------------------------------------------------
    await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        scoreAtHalfTimeHome: htHome,
        scoreAtHalfTimeAway: htAway,
        scoreAt90Home: ftHome,
        scoreAt90Away: ftAway,
      },
    });

    // -- Player stats ---------------------------------------------------------
    const allGoalEvents = events.filter((e) => e.type === 'goal');
    const statsMap: Record<string, { name: string; team: string; goals: number; assists: number; yellowCards: number; redCards: number }> = {};

    const getOrCreate = (name: string, teamName: string) => {
      if (!statsMap[name]) statsMap[name] = { name, team: teamName, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      return statsMap[name];
    };

    for (const ev of allGoalEvents) {
      const teamName = ev.side === 'home' ? homeTeamName : awayTeamName;
      if (ev.playerName) getOrCreate(ev.playerName, teamName).goals++;
      if (ev.assistName) getOrCreate(ev.assistName, teamName).assists++;
    }
    for (const ev of events.filter((e) => e.type === 'yellow_card')) {
      const teamName = ev.side === 'home' ? homeTeamName : awayTeamName;
      if (ev.playerName) getOrCreate(ev.playerName, teamName).yellowCards++;
    }

    const statsData = Object.values(statsMap).map((s) => ({ fixtureId, ...s }));
    if (statsData.length > 0) {
      await prisma.playerStat.createMany({ data: statsData, skipDuplicates: true });
    }
  }

  // ── Fixtures ───────────────────────────────────────────────────────────────

  console.log('Creating fixtures…');

  // Past (complete) league fixtures
  const completedFixtures: Array<{
    homeTeam: string; awayTeam: string; date: Date; matchday: string;
    htHome: number; htAway: number; ftHome: number; ftAway: number;
    motm: string;
  }> = [
    {
      homeTeam: 'Accra Lions FC', awayTeam: 'Cape Coast United',
      date: new Date('2025-01-11'), matchday: 'Matchday 1',
      htHome: 1, htAway: 0, ftHome: 2, ftAway: 1,
      motm: 'Kwame Acheampong',
    },
    {
      homeTeam: 'Kumasi Warriors', awayTeam: 'Tamale Thunder',
      date: new Date('2025-01-11'), matchday: 'Matchday 1',
      htHome: 0, htAway: 0, ftHome: 1, ftAway: 0,
      motm: 'Eric Ofori',
    },
    {
      homeTeam: 'Takoradi Rangers', awayTeam: 'Sunyani Eagles',
      date: new Date('2025-01-11'), matchday: 'Matchday 1',
      htHome: 2, htAway: 1, ftHome: 3, ftAway: 2,
      motm: 'Abena Sarpong',
    },
    {
      homeTeam: 'Cape Coast United', awayTeam: 'Kumasi Warriors',
      date: new Date('2025-01-18'), matchday: 'Matchday 2',
      htHome: 0, htAway: 1, ftHome: 0, ftAway: 2,
      motm: 'Solomon Asare',
    },
    {
      homeTeam: 'Tamale Thunder', awayTeam: 'Accra Lions FC',
      date: new Date('2025-01-18'), matchday: 'Matchday 2',
      htHome: 1, htAway: 1, ftHome: 2, ftAway: 3,
      motm: 'Fiifi Asare',
    },
    {
      homeTeam: 'Sunyani Eagles', awayTeam: 'Takoradi Rangers',
      date: new Date('2025-01-18'), matchday: 'Matchday 2',
      htHome: 0, htAway: 0, ftHome: 0, ftAway: 0,
      motm: 'David Mensah',
    },
  ];

  for (const f of completedFixtures) {
    const created = await prisma.fixture.create({
      data: {
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        date: f.date,
        kickOffTime: '15:00',
        venue: `${f.homeTeam.split(' ')[0]} Stadium`,
        matchday: f.matchday,
        status: 'complete',
        tournamentStage: 'Group Stage',
        manOfTheMatch: f.motm,
        tournamentId: leagueTournament.id,
      },
    });
    await attachLineupAndEvents(created.id, f.homeTeam, f.awayTeam, f.htHome, f.htAway, f.ftHome, f.ftAway);
    process.stdout.write('.');
  }

  // Cup quarter-final (complete)
  const cupQF = await prisma.fixture.create({
    data: {
      homeTeam: 'Accra Lions FC',
      awayTeam: 'Kumasi Warriors',
      date: new Date('2025-02-08'),
      kickOffTime: '16:00',
      venue: 'Accra Sports Stadium',
      matchday: 'Quarter Final',
      status: 'complete',
      tournamentStage: 'Quarter Final',
      manOfTheMatch: 'Kweku Frimpong',
      extraTimePlayed: true,
      scoreAfterExtraTimeHome: 4,
      scoreAfterExtraTimeAway: 3,
      tournamentId: cupTournament.id,
    },
  });
  await attachLineupAndEvents(cupQF.id, 'Accra Lions FC', 'Kumasi Warriors', 1, 0, 2, 2);
  process.stdout.write('.');

  // Ongoing fixture (live right now)
  const ongoingFixture = await prisma.fixture.create({
    data: {
      homeTeam: 'Cape Coast United',
      awayTeam: 'Takoradi Rangers',
      date: new Date(),
      kickOffTime: '15:00',
      venue: 'Cape Coast Stadium',
      matchday: 'Matchday 3',
      status: 'ongoing',
      tournamentStage: 'Group Stage',
      tournamentId: leagueTournament.id,
      scoreAt90Home: 1,
      scoreAt90Away: 0,
    },
  });

  // Attach lineup to ongoing fixture (no events pre-seeded — record them live)
  const ccu = teamMap['Cape Coast United'];
  const trg = teamMap['Takoradi Rangers'];
  if (ccu && trg) {
    const ccuStarters = ccu.players.slice(0, 11);
    const ccuSubs = ccu.players.slice(11, 16);
    const trgStarters = trg.players.slice(0, 11);
    const trgSubs = trg.players.slice(11, 16);
    await prisma.matchLineup.createMany({
      data: [
        ...ccuStarters.map((p) => ({ fixtureId: ongoingFixture.id, playerId: p.id, side: 'home', role: 'starter', position: p.position })),
        ...ccuSubs.map((p) => ({ fixtureId: ongoingFixture.id, playerId: p.id, side: 'home', role: 'substitute', position: p.position })),
        ...trgStarters.map((p) => ({ fixtureId: ongoingFixture.id, playerId: p.id, side: 'away', role: 'starter', position: p.position })),
        ...trgSubs.map((p) => ({ fixtureId: ongoingFixture.id, playerId: p.id, side: 'away', role: 'substitute', position: p.position })),
      ],
      skipDuplicates: true,
    });
  }
  process.stdout.write('.');

  // Scheduled future fixtures
  const scheduledFixtures = [
    { home: 'Kumasi Warriors',   away: 'Sunyani Eagles',     date: new Date('2025-06-01'), md: 'Matchday 3' },
    { home: 'Tamale Thunder',    away: 'Takoradi Rangers',   date: new Date('2025-06-01'), md: 'Matchday 3' },
    { home: 'Accra Lions FC',    away: 'Cape Coast United',  date: new Date('2025-06-07'), md: 'Matchday 4' },
    { home: 'Sunyani Eagles',    away: 'Tamale Thunder',     date: new Date('2025-06-07'), md: 'Matchday 4' },
    { home: 'Takoradi Rangers',  away: 'Accra Lions FC',     date: new Date('2025-06-14'), md: 'Matchday 5' },
    // Cup semi-final
    { home: 'Accra Lions FC',    away: 'Sunyani Eagles',     date: new Date('2025-06-21'), md: 'Semi Final', stage: 'Semi Final', cup: true },
  ];

  for (const f of scheduledFixtures) {
    await prisma.fixture.create({
      data: {
        homeTeam: f.home,
        awayTeam: f.away,
        date: f.date,
        kickOffTime: '15:00',
        venue: `${f.home.split(' ')[0]} Stadium`,
        matchday: f.md,
        status: 'scheduled',
        tournamentStage: f.stage ?? 'Group Stage',
        tournamentId: f.cup ? cupTournament.id : leagueTournament.id,
      },
    });
    process.stdout.write('.');
  }

  console.log('\n');
  console.log('─────────────────────────────────────────');
  console.log('✓  Seed complete!');
  console.log('');
  console.log(`   Teams          ${teams.length}`);
  console.log(`   Players        ${totalPlayers}`);
  console.log(`   Tournaments    2  (League + Cup)`);
  console.log(`   Fixtures       ${completedFixtures.length + 1 + 1 + scheduledFixtures.length}`);
  console.log(`                  ${completedFixtures.length + 1} complete (with lineups + events)`);
  console.log('                  1  ongoing  (lineup set, ready for live events)');
  console.log(`                  ${scheduledFixtures.length} scheduled`);
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
