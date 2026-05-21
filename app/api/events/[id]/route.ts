import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GOAL_TYPES = ['goal', 'penalty'];

async function recalculateScores(fixtureId: string) {
  const events = await prisma.matchEvent.findMany({
    where: { fixtureId },
    select: { type: true, side: true, minute: true },
  });

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

    if (isGoal) {
      if (ev.side === 'home') homeScore++;
      else awayScore++;
    } else {
      if (ev.side === 'home') awayScore++;
      else homeScore++;
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.matchEvent.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.matchEvent.delete({ where: { id: params.id } });

    const affectsScore = [...GOAL_TYPES, 'own_goal', 'half_time'].includes(event.type);
    if (affectsScore) {
      await recalculateScores(event.fixtureId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
