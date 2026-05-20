import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const players = await prisma.player.findMany({
      where: { teamId: params.id },
      orderBy: { jerseyNumber: 'asc' },
    });
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { fullName, jerseyNumber, position } = body;

    if (!fullName || jerseyNumber === undefined) {
      return NextResponse.json(
        { error: 'fullName and jerseyNumber are required' },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        fullName,
        jerseyNumber,
        position,
        teamId: params.id,
      },
    });
    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Jersey number already taken' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
