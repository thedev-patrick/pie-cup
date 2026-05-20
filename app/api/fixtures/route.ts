import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  const fixtures = await prisma.fixture.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    orderBy: { date: 'asc' },
    include: {
      tournament: { select: { id: true, name: true, season: true } },
      events: {
        orderBy: { minute: 'asc' },
        select: { id: true, minute: true, type: true, side: true, playerName: true, assistName: true },
      },
    },
  });
  return NextResponse.json(fixtures);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fixture = await prisma.fixture.create({
      data: {
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        date: new Date(body.date),
        kickOffTime: body.kickOffTime,
        venue: body.venue,
        matchday: body.matchday || null,
        status: body.status || 'scheduled',
        tournamentStage: body.tournamentStage || null,
        tournamentId: body.tournamentId || null,
      },
    });
    return NextResponse.json(fixture, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create fixture' }, { status: 500 });
  }
}
