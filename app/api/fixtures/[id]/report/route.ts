import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupOldReports, generateMatchReportPdf, getFixtureReportFilePath } from '@/lib/matchReport';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: params.id },
    include: {
      stats: true,
      events: { orderBy: { minute: 'asc' } },
      lineups: { include: { player: true } },
    },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  if (fixture.status !== 'complete') {
    return NextResponse.json({ error: 'Report is only available for completed fixtures' }, { status: 400 });
  }

  await cleanupOldReports();

  const reportPath = getFixtureReportFilePath(params.id);
  try {
    await fs.access(reportPath);
  } catch {
    await generateMatchReportPdf(fixture as any);
  }

  const file = await fs.readFile(reportPath);
  return new NextResponse(file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="match-report-${params.id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
