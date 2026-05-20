import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { fixtures: true } } },
    });
    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, season } = body;
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const tournament = await prisma.tournament.create({
      data: { name, season: season || null },
    });
    return NextResponse.json(tournament, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A tournament with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
