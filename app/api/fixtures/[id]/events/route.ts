import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GOAL_TYPES = ['goal', 'penalty'];

async function recalculateScores(fixtureId: string) {
  const events = await prisma.matchEvent.findMany({
    where: { fixtureId },
    select: { type: true, side: true, minute: true },
  });

  // Find the half_time marker minute (if one exists)
  const halfTimeEvent = events.find((ev) => ev.type === 'half_time');
  const htMinute = halfTimeEvent?.minute ?? null;

  let homeScore = 0;
  let awayScore = 0;
  let htHome = 0;
  let htAway = 0;

  for (const ev of events) {
    const isGoal = GOAL_TYPES.includes(ev.type);
    const isOwnGoal = ev.type === 'own_goal';

    if (!isGoal && !isOwnGoal) continue;

    // Accumulate full-match score
    if (isGoal) {
      if (ev.side === 'home') homeScore++;
      else awayScore++;
    } else {
      // own_goal credited to the opposing side
      if (ev.side === 'home') awayScore++;
      else homeScore++;
    }

    // Accumulate half-time score only for goals at or before the HT whistle
    if (htMinute !== null && ev.minute <= htMinute) {
      if (isGoal) {
        if (ev.side === 'home') htHome++;
        else htAway++;
      } else {
        if (ev.side === 'home') htAway++;
        else htHome++;
      }
    }
  }

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      scoreAt90Home: homeScore,
      scoreAt90Away: awayScore,
      scoreAtHalfTimeHome: htMinute !== null ? htHome : null,
      scoreAtHalfTimeAway: htMinute !== null ? htAway : null,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const events = await prisma.matchEvent.findMany({
      where: { fixtureId: params.id },
      orderBy: { minute: 'asc' },
      include: { player: true },
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { minute, type, side, playerId, playerName, assistName, playerOutName, description } = body;

    if (minute === undefined || !type) {
      return NextResponse.json({ error: 'minute and type are required' }, { status: 400 });
    }

    // half_time is a match-wide event — side is not meaningful
    const isHalfTime = type === 'half_time';
    if (!isHalfTime && !side) {
      return NextResponse.json({ error: 'side is required for this event type' }, { status: 400 });
    }

    // Only one half_time event per fixture
    if (isHalfTime) {
      const existing = await prisma.matchEvent.findFirst({
        where: { fixtureId: params.id, type: 'half_time' },
      });
      if (existing) {
        return NextResponse.json({ error: 'A half time event already exists for this fixture' }, { status: 409 });
      }
    }

    const event = await prisma.matchEvent.create({
      data: {
        fixtureId: params.id,
        minute,
        type,
        side: isHalfTime ? 'none' : side,
        playerId: isHalfTime ? null : playerId,
        playerName: isHalfTime ? null : (playerName ?? null),
        assistName: isHalfTime ? null : (assistName ?? null),
        playerOutName: isHalfTime ? null : (playerOutName ?? null),
        description: description ?? null,
      },
      include: { player: true },
    });

    // Recalculate whenever a scoring event or the HT marker changes
    if ([...GOAL_TYPES, 'own_goal', 'half_time'].includes(type)) {
      await recalculateScores(params.id);
    }

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
