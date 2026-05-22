import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import FixtureActionsMenu from './FixtureActionsMenu';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

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

function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 px-1">
      <span className="text-xs text-[#555555]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="text-xs text-[#888888] hover:text-white border border-[#2a2a2a] hover:border-[#444444] rounded-lg px-3 py-1.5 transition-colors"
          >
            ← Prev
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="text-xs text-[#888888] hover:text-white border border-[#2a2a2a] hover:border-[#444444] rounded-lg px-3 py-1.5 transition-colors"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const allFixtures = await prisma.fixture.findMany({
    orderBy: { date: 'asc' },
    include: {
      tournament: { select: { id: true, name: true, season: true } },
      _count: { select: { events: true, lineups: true } },
    },
  });

  // Group by tournament
  const grouped = new Map<
    string,
    { label: string; season: string | null; fixtures: typeof allFixtures }
  >();

  for (const fixture of allFixtures) {
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

  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return 0;
  });

  // Per-group page params: ?page_{key}=N
  function getPage(key: string): number {
    const raw = searchParams[`page_${key}`];
    const n = parseInt(Array.isArray(raw) ? raw[0] : raw ?? '1', 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  function buildHref(key: string, p: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k.startsWith('page_') && k !== `page_${key}`) {
        params.set(k, Array.isArray(v) ? v[0] : (v ?? '1'));
      }
    }
    if (p > 1) params.set(`page_${key}`, String(p));
    const qs = params.toString();
    return `/admin/fixtures${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
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

      {allFixtures.length === 0 ? (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#666666] text-sm">No fixtures yet. Create your first fixture to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([key, group]) => {
            const page = getPage(key);
            const totalPages = Math.ceil(group.fixtures.length / PAGE_SIZE);
            const paginated = group.fixtures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-white">{group.label}</h2>
                  {group.season && (
                    <span className="text-xs text-[#555555]">{group.season}</span>
                  )}
                  <span className="text-xs text-[#444444]">
                    {group.fixtures.length} fixture{group.fixtures.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden bg-[#111111] rounded-xl border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
                  {paginated.map((fixture) => (
                    <div key={fixture.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {fixture.homeTeam} <span className="text-[#666666] font-normal">vs</span> {fixture.awayTeam}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[#888888] text-xs">
                            {new Date(fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {fixture.matchday && (
                            <span className="text-[#555555] text-xs">{fixture.matchday}</span>
                          )}
                          <StatusBadge status={fixture.status} />
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <FixtureActionsMenu fixtureId={fixture.id} canDelete={fixture.status === 'scheduled'} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-[#111111] rounded-xl border border-[#1a1a1a] overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Matchday</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">Match</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Lineup</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Events</th>
                        <th className="text-left text-xs font-medium text-[#666666] uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {paginated.map((fixture) => (
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
                          <td className="px-4 py-3">
                            <FixtureActionsMenu fixtureId={fixture.id} canDelete={fixture.status === 'scheduled'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildHref(key, p)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
