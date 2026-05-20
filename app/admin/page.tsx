import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'ongoing' || s === 'live') {
    return (
      <span className="inline-block text-xs font-medium bg-[#00E676]/10 text-[#00E676] rounded px-2 py-0.5">
        LIVE
      </span>
    );
  }
  if (s === 'complete' || s === 'ft') {
    return (
      <span className="inline-block text-xs font-medium bg-[#222222] text-[#888888] rounded px-2 py-0.5">
        FT
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-medium bg-[#1a1a1a] text-[#888888] rounded px-2 py-0.5">
      SCHEDULED
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [
    totalFixtures,
    scheduledCount,
    ongoingCount,
    completeCount,
    totalTeams,
    totalPlayers,
    totalEvents,
    recentFixtures,
  ] = await Promise.all([
    prisma.fixture.count(),
    prisma.fixture.count({ where: { status: 'scheduled' } }),
    prisma.fixture.count({ where: { status: 'ongoing' } }),
    prisma.fixture.count({ where: { status: 'complete' } }),
    prisma.team.count(),
    prisma.player.count(),
    prisma.matchEvent.count(),
    prisma.fixture.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {/* Fixtures card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Fixtures</div>
          <div className="text-3xl font-bold text-white mb-4">{totalFixtures}</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Scheduled</span>
              <span className="inline-block text-xs font-medium bg-[#1a1a1a] text-[#aaaaaa] rounded px-2 py-0.5">
                {scheduledCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Ongoing</span>
              <span className="inline-block text-xs font-medium bg-[#00E676]/10 text-[#00E676] rounded px-2 py-0.5">
                {ongoingCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Complete</span>
              <span className="inline-block text-xs font-medium bg-[#222222] text-[#888888] rounded px-2 py-0.5">
                {completeCount}
              </span>
            </div>
          </div>
        </div>

        {/* Teams card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Teams</div>
          <div className="text-3xl font-bold text-white">{totalTeams}</div>
        </div>

        {/* Players card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Players</div>
          <div className="text-3xl font-bold text-white">{totalPlayers}</div>
        </div>

        {/* Events card */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Events Logged</div>
          <div className="text-3xl font-bold text-white">{totalEvents}</div>
        </div>
      </div>

      {/* Recent fixtures */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Fixtures</h2>
        {recentFixtures.length === 0 ? (
          <p className="text-[#666666] text-sm">No fixtures yet.</p>
        ) : (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <ul className="divide-y divide-[#1a1a1a]">
              {recentFixtures.map((fixture) => (
                <li key={fixture.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={fixture.status} />
                    <span className="text-white text-sm font-medium truncate">
                      {fixture.homeTeam} <span className="text-[#666666]">vs</span> {fixture.awayTeam}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[#666666] text-xs hidden sm:inline">
                      {new Date(fixture.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <Link
                      href={`/admin/fixtures/${fixture.id}`}
                      className="text-xs text-[#888888] hover:text-white transition-colors"
                    >
                      Manage →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
