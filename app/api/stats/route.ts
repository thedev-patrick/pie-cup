import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface StatRow { name: string; team: string; count: number }

function sorted(map: Map<string, StatRow>): StatRow[] {
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 20);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  const events = await prisma.matchEvent.findMany({
    where: tournamentId ? { fixture: { tournamentId } } : undefined,
    select: {
      type: true,
      side: true,
      playerName: true,
      assistName: true,
      fixture: { select: { homeTeam: true, awayTeam: true } },
    },
  });

  const goals = new Map<string, StatRow>();
  const assists = new Map<string, StatRow>();
  const yellows = new Map<string, StatRow>();
  const reds = new Map<string, StatRow>();

  for (const ev of events) {
    const scoringTeam = ev.side === 'home' ? ev.fixture.homeTeam : ev.fixture.awayTeam;

    if (ev.type === 'goal' || ev.type === 'penalty') {
      if (ev.playerName) {
        const k = `${ev.playerName}||${scoringTeam}`;
        const r = goals.get(k) ?? { name: ev.playerName, team: scoringTeam, count: 0 };
        goals.set(k, { ...r, count: r.count + 1 });
      }
      if (ev.assistName) {
        const k = `${ev.assistName}||${scoringTeam}`;
        const r = assists.get(k) ?? { name: ev.assistName, team: scoringTeam, count: 0 };
        assists.set(k, { ...r, count: r.count + 1 });
      }
    }

    if (ev.type === 'yellow_card' && ev.playerName) {
      const k = `${ev.playerName}||${scoringTeam}`;
      const r = yellows.get(k) ?? { name: ev.playerName, team: scoringTeam, count: 0 };
      yellows.set(k, { ...r, count: r.count + 1 });
    }

    if (ev.type === 'red_card' && ev.playerName) {
      const k = `${ev.playerName}||${scoringTeam}`;
      const r = reds.get(k) ?? { name: ev.playerName, team: scoringTeam, count: 0 };
      reds.set(k, { ...r, count: r.count + 1 });
    }
  }

  return NextResponse.json({
    topScorers: sorted(goals),
    topAssists: sorted(assists),
    yellowCards: sorted(yellows),
    redCards: sorted(reds),
  });
}
