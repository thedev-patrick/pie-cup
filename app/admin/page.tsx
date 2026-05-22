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

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
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
      take: 10,
      include: {
        tournament: { select: { id: true, name: true, season: true } },
      },
    }),
  ]);

  // Group by tournament
  const grouped = new Map<string, { label: string; season: string | null; fixtures: typeof recentFixtures }>();
  for (const fixture of recentFixtures) {
    const key = fixture.tournamentId ?? '__none__';
    if (!grouped.has(key)) {
      grouped.set(key, {
        label: fixture.tournament?.name ?? 'No Tournament',
        season: fixture.tournament?.season ?? null,
        fixtures: [],
      });
    }
    grouped.get(key)!.fixtures.push(fixture);
  }

  // Tournaments first, ungrouped last
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return 0;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Fixtures</div>
          <div className="text-3xl font-bold text-white mb-4">{totalFixtures}</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Scheduled</span>
              <span className="inline-block text-xs font-medium bg-[#1a1a1a] text-[#aaaaaa] rounded px-2 py-0.5">{scheduledCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Ongoing</span>
              <span className="inline-block text-xs font-medium bg-[#00E676]/10 text-[#00E676] rounded px-2 py-0.5">{ongoingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-xs">Complete</span>
              <span className="inline-block text-xs font-medium bg-[#222222] text-[#888888] rounded px-2 py-0.5">{completeCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Teams</div>
          <div className="text-3xl font-bold text-white">{totalTeams}</div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Players</div>
          <div className="text-3xl font-bold text-white">{totalPlayers}</div>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="text-[#888888] text-xs uppercase tracking-wider mb-3">Events Logged</div>
          <div className="text-3xl font-bold text-white">{totalEvents}</div>
        </div>
      </div>

      {/* Recent fixtures grouped by tournament */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Fixtures</h2>
          <Link
            href="/admin/fixtures"
            className="text-xs text-[#3d6b3d] hover:text-white transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentFixtures.length === 0 ? (
          <p className="text-[#666666] text-sm">No fixtures yet.</p>
        ) : (
          <div className="space-y-5">
            {sortedGroups.map(([key, group]) => (
              <div key={key}>
                {/* Tournament header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-white">{group.label}</span>
                  {group.season && (
                    <span className="text-xs text-[#555555]">{group.season}</span>
                  )}
                </div>

                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                  <ul className="divide-y divide-[#1a1a1a]">
                    {group.fixtures.map((fixture) => (
                      <li key={fixture.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusBadge status={fixture.status} />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {fixture.homeTeam} <span className="text-[#555555]">vs</span> {fixture.awayTeam}
                            </p>
                            <p className="text-[#555555] text-xs mt-0.5">
                              {new Date(fixture.date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {fixture.matchday && (
                                <span className="ml-2">{fixture.matchday}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/admin/fixtures/${fixture.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#1a1a1a] hover:bg-[#00E676]/10 text-[#888888] hover:text-[#00E676] border border-[#2a2a2a] hover:border-[#00E676]/30 rounded-lg px-3 py-1.5 transition-colors shrink-0"
                        >
                          <EditIcon />
                          Manage
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
