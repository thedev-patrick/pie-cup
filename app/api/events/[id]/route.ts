import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SCORING_TYPES = ['goal', 'penalty', 'own_goal'];

async function recalculateScore(fixtureId: string) {
  const events = await prisma.matchEvent.findMany({
    where: { fixtureId },
    select: { type: true, side: true },
  });

  let homeScore = 0;
  let awayScore = 0;

  for (const ev of events) {
    if (ev.type === 'goal' || ev.type === 'penalty') {
      if (ev.side === 'home') homeScore++;
      else awayScore++;
    } else if (ev.type === 'own_goal') {
      if (ev.side === 'home') awayScore++;
      else homeScore++;
    }
  }

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: { scoreAt90Home: homeScore, scoreAt90Away: awayScore },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch before deleting so we know the fixtureId and type
    const event = await prisma.matchEvent.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.matchEvent.delete({ where: { id: params.id } });

    if (SCORING_TYPES.includes(event.type)) {
      await recalculateScore(event.fixtureId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
