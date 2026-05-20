import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupOldReports, generateMatchReportPdf } from '@/lib/matchReport';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: params.id },
    include: {
      stats: true,
      events: { orderBy: { minute: 'asc' }, include: { player: true } },
      lineups: { include: { player: { include: { team: true } } } },
    },
  });

  if (!fixture) {
    return NextResponse.json({ message: 'Fixture not found' }, { status: 404 });
  }

  return NextResponse.json(fixture);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.fixture.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: 'Fixture not found' }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.fixture.update({
      where: { id: params.id },
      data: {
        homeTeam: body.homeTeam ?? existing.homeTeam,
        awayTeam: body.awayTeam ?? existing.awayTeam,
        date: body.date ? new Date(body.date) : existing.date,
        kickOffTime: body.kickOffTime ?? existing.kickOffTime,
        venue: body.venue ?? existing.venue,
        matchday: body.matchday !== undefined ? (body.matchday || null) : existing.matchday,
        status: body.status ?? existing.status,
        tournamentStage: body.tournamentStage !== undefined ? (body.tournamentStage || null) : existing.tournamentStage,
        scoreAtHalfTimeHome: body.scoreAtHalfTimeHome !== undefined ? (body.scoreAtHalfTimeHome === '' ? null : Number(body.scoreAtHalfTimeHome)) : existing.scoreAtHalfTimeHome,
        scoreAtHalfTimeAway: body.scoreAtHalfTimeAway !== undefined ? (body.scoreAtHalfTimeAway === '' ? null : Number(body.scoreAtHalfTimeAway)) : existing.scoreAtHalfTimeAway,
        scoreAt90Home: body.scoreAt90Home !== undefined ? (body.scoreAt90Home === '' ? null : Number(body.scoreAt90Home)) : existing.scoreAt90Home,
        scoreAt90Away: body.scoreAt90Away !== undefined ? (body.scoreAt90Away === '' ? null : Number(body.scoreAt90Away)) : existing.scoreAt90Away,
        extraTimePlayed: body.extraTimePlayed !== undefined ? Boolean(body.extraTimePlayed) : existing.extraTimePlayed,
        scoreAfterExtraTimeHome: body.scoreAfterExtraTimeHome !== undefined ? (body.scoreAfterExtraTimeHome === '' ? null : Number(body.scoreAfterExtraTimeHome)) : existing.scoreAfterExtraTimeHome,
        scoreAfterExtraTimeAway: body.scoreAfterExtraTimeAway !== undefined ? (body.scoreAfterExtraTimeAway === '' ? null : Number(body.scoreAfterExtraTimeAway)) : existing.scoreAfterExtraTimeAway,
        manOfTheMatch: body.manOfTheMatch !== undefined ? (body.manOfTheMatch || null) : existing.manOfTheMatch,
        tournamentId: body.tournamentId !== undefined ? (body.tournamentId || null) : existing.tournamentId,
      },
      include: {
        stats: true,
        events: { orderBy: { minute: 'asc' } },
        lineups: { include: { player: { include: { team: true } } } },
      },
    });

    if (updated.status === 'complete') {
      await cleanupOldReports();
      await generateMatchReportPdf(updated as any);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update fixture' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.fixture.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
