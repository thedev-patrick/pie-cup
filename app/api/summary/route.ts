import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const stats = await prisma.playerStat.findMany();

  const players = stats.reduce<Record<string, { name: string; team: string; goals: number; assists: number; yellowCards: number; redCards: number }>>((acc, stat) => {
    const key = `${stat.team}||${stat.name}`;
    if (!acc[key]) {
      acc[key] = { name: stat.name, team: stat.team, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
    }
    acc[key].goals += stat.goals;
    acc[key].assists += stat.assists;
    acc[key].yellowCards += stat.yellowCards;
    acc[key].redCards += stat.redCards;
    return acc;
  }, {});

  const sorted = Object.values(players);
  const summary = {
    topScorers: sorted.slice().sort((a, b) => b.goals - a.goals).slice(0, 10),
    topAssists: sorted.slice().sort((a, b) => b.assists - a.assists).slice(0, 10),
    mostYellowCards: sorted.slice().sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 10),
    mostRedCards: sorted.slice().sort((a, b) => b.redCards - a.redCards).slice(0, 10),
  };

  return NextResponse.json(summary);
}
