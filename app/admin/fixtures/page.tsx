import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteFixtureButton from './DeleteFixtureButton';

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
      <span className="inline-block text-xs font-medium bg-[#1a1a1a] text-[#888888] rounded px-2 py-0.5">
        FT
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-medium bg-[#1a1a1a] text-[#aaaaaa] rounded px-2 py-0.5">
      SCHEDULED
    </span>
  );
}

export default async function FixturesPage() {
  const fixtures = await prisma.fixture.findMany({
    orderBy: { date: 'asc' },
    include: {
      tournament: { select: { id: true, name: true, season: true } },
      _count: {
        select: {
          events: true,
          lineups: true,
        },
      },
    },
  });

  // Group fixtures by tournament
  const grouped = new Map<
    string,
    { label: string; season: string | null; fixtures: typeof fixtures }
  >();

  for (const fixture of fixtures) {
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

  // Put "No Tournament" at the end
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Fixtures</h1>
        <Link
          href="/admin/fixtures/new"
          className="bg-[#00E676] hover:bg-[#00cc66] text-black font-bold text-sm rounded-lg px-4 py-2 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Fixture
          </span>
        </Link>
      </div>

      {fixtures.length === 0 ? (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#666666] text-sm">No fixtures yet. Create your first fixture to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([key, group]) => (
            <div key={key}>
              {/* Tournament header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-white">
                  {group.label}
                </h2>
                {group.season && (
                  <span className="text-xs text-[#555555]">{group.season}</span>
                )}
                <span className="text-xs text-[#444444]">
                  {group.fixtures.length} fixture{group.fixtures.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="bg-[#111111] rounded-xl border border-[#1a1a1a] overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                        Matchday
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">
                        Match
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                        Lineup
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                        Events
                      </th>
                      <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {group.fixtures.map((fixture) => (
                      <tr key={fixture.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                        <td className="px-4 py-3 text-[#888888] hidden sm:table-cell">
                          {fixture.matchday ?? <span className="text-[#444444]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {fixture.homeTeam} <span className="text-[#666666] font-normal">vs</span> {fixture.awayTeam}
                        </td>
                        <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
                          {new Date(fixture.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {fixture.kickOffTime && (
                            <span className="text-[#444444] ml-1 hidden sm:inline">{fixture.kickOffTime}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={fixture.status} />
                        </td>
                        <td className="px-4 py-3 text-[#888888] hidden md:table-cell">
                          {fixture._count.lineups}
                        </td>
                        <td className="px-4 py-3 text-[#888888] hidden md:table-cell">
                          {fixture._count.events}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/admin/fixtures/${fixture.id}`}
                            className="text-[#888888] hover:text-white transition-colors p-1"
                            title="Manage fixture"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                            </svg>
                          </Link>
                          {fixture.status === 'scheduled' && (
                            <DeleteFixtureButton fixtureId={fixture.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
