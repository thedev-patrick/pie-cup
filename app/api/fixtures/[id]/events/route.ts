import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GOAL_TYPES = ['goal', 'penalty'];

async function recalculateScore(fixtureId: string) {
  const events = await prisma.matchEvent.findMany({
    where: { fixtureId },
    select: { type: true, side: true },
  });

  let homeScore = 0;
  let awayScore = 0;

  for (const ev of events) {
    if (GOAL_TYPES.includes(ev.type)) {
      if (ev.side === 'home') homeScore++;
      else awayScore++;
    } else if (ev.type === 'own_goal') {
      // own goal credited to the opposing side
      if (ev.side === 'home') awayScore++;
      else homeScore++;
    }
  }

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: { scoreAt90Home: homeScore, scoreAt90Away: awayScore },
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      minute,
      type,
      side,
      playerId,
      playerName,
      assistName,
      playerOutName,
      description,
    } = body;

    if (minute === undefined || !type || !side) {
      return NextResponse.json(
        { error: 'minute, type, and side are required' },
        { status: 400 }
      );
    }

    const event = await prisma.matchEvent.create({
      data: {
        fixtureId: params.id,
        minute,
        type,
        side,
        playerId,
        playerName,
        assistName,
        playerOutName,
        description,
      },
      include: { player: true },
    });

    // Recalculate score whenever a scoring event is added
    if ([...GOAL_TYPES, 'own_goal'].includes(type)) {
      await recalculateScore(params.id);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
