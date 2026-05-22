import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lineup = await prisma.matchLineup.findMany({
      where: { fixtureId: params.id },
      include: {
        player: {
          include: { team: true },
        },
      },
    });
    return NextResponse.json(lineup);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lineup' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { lineups } = body;

    if (!Array.isArray(lineups)) {
      return NextResponse.json({ error: 'lineups must be an array' }, { status: 400 });
    }

    // Validate per-side limits
    const sideCounts: Record<string, { starters: number; subs: number }> = {};
    for (const entry of lineups) {
      if (!sideCounts[entry.side]) sideCounts[entry.side] = { starters: 0, subs: 0 };
      if (entry.role === 'starter') sideCounts[entry.side].starters++;
      else sideCounts[entry.side].subs++;
    }
    for (const [side, counts] of Object.entries(sideCounts)) {
      if (counts.starters > 11) {
        return NextResponse.json(
          { error: `The ${side} team cannot have more than 11 starters (currently ${counts.starters})` },
          { status: 400 },
        );
      }
      if (counts.subs > 14) {
        return NextResponse.json(
          { error: `The ${side} team cannot have more than 14 substitutes (currently ${counts.subs})` },
          { status: 400 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.matchLineup.deleteMany({ where: { fixtureId: params.id } });

      const created = await tx.matchLineup.createMany({
        data: lineups.map(({ playerId, side, role, position }) => ({
          fixtureId: params.id,
          playerId,
          side,
          role,
          position,
        })),
      });

      return created;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set lineup' }, { status: 500 });
  }
}
