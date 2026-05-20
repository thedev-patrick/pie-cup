import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, season } = body;
    const tournament = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(season !== undefined && { season: season || null }),
      },
    });
    return NextResponse.json(tournament);
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Name already taken' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tournament.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
