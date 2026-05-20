import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { fullName, jerseyNumber, position } = body;

    const player = await prisma.player.update({
      where: { id: params.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(jerseyNumber !== undefined && { jerseyNumber }),
        ...(position !== undefined && { position }),
      },
    });
    return NextResponse.json(player);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Jersey number already taken' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.player.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
