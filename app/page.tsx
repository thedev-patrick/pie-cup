'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  season: string | null;
}

interface EventPreview {
  id: string;
  minute: number;
  type: string;
  side: string;
  playerName: string | null;
}

interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  kickOffTime: string;
  venue: string;
  matchday: string | null;
  tournamentStage: string | null;
  status: string;
  scoreAtHalfTimeHome: number | null;
  scoreAtHalfTimeAway: number | null;
  scoreAt90Home: number | null;
  scoreAt90Away: number | null;
  manOfTheMatch: string | null;
  tournamentId: string | null;
  tournament: { id: string; name: string; season: string | null } | null;
  events: EventPreview[];
}

interface StatRow {
  name: string;
  team: string;
  count: number;
}

interface Stats {
  topScorers: StatRow[];
  topAssists: StatRow[];
  yellowCards: StatRow[];
  redCards: StatRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getScore(f: Fixture) {
  if (f.scoreAt90Home != null && f.scoreAt90Away != null)
    return { home: f.scoreAt90Home, away: f.scoreAt90Away };
  if (f.scoreAtHalfTimeHome != null && f.scoreAtHalfTimeAway != null)
    return { home: f.scoreAtHalfTimeHome, away: f.scoreAtHalfTimeAway };
  return null;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

const EV_ICON: Record<string, string> = {
  goal: '⚽',
  penalty: '⚽',
  own_goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  foul: '⚠️',
  free_kick: '🎯',
  corner: '↪️',
  goal_kick: '🥅',
  offside: '🚫',
};

// ─── Helper components ────────────────────────────────────────────────────────

function TeamBadge({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-[#2e2e2e] bg-[#1a1a1a]">
      <span className="font-condensed font-bold text-sm text-[#3d6b3d] leading-none tracking-wide">
        {getInitials(name)}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="ea-section-title">{children}</h2>;
}

function LiveCard({ fixture }: { fixture: Fixture }) {
  const score = getScore(fixture);
  const latestMinute = fixture.events.length
    ? Math.max(...fixture.events.map((e) => e.minute))
    : null;
  const keyEvents = [...fixture.events]
    .filter((e) =>
      ['goal', 'penalty', 'own_goal', 'yellow_card', 'red_card', 'foul', 'free_kick', 'corner', 'goal_kick', 'offside'].includes(e.type),
    )
    .sort((a, b) => b.minute - a.minute)
    .slice(0, 4);

  return (
    <Link href={`/fixtures/${fixture.id}`} className="block">
      <div className="bg-[#111111] border border-[#00E676]/30 rounded-xl p-5 hover:border-[#00E676]/60 transition-colors">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E676]" />
            </span>
            <span className="font-condensed font-bold text-xs uppercase tracking-widest text-[#00E676]">
              LIVE
            </span>
            {latestMinute && (
              <span className="font-condensed font-bold text-xs text-[#00E676]">
                {latestMinute}&apos;
              </span>
            )}
          </div>
          {fixture.tournament && (
            <span className="ea-label truncate max-w-[140px]">
              {fixture.tournament.name}
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamBadge name={fixture.homeTeam} />
            <span className="font-condensed font-black text-sm uppercase tracking-wide text-white text-center leading-tight">
              {fixture.homeTeam}
            </span>
          </div>

          <div className="text-center flex-shrink-0 px-2">
            <div className="font-black text-5xl sm:text-6xl tabular-nums tracking-tight text-white leading-none">
              {score != null ? (
                <>
                  <span>{score.home}</span>
                  <span className="text-[#1f3d1f] mx-2">–</span>
                  <span>{score.away}</span>
                </>
              ) : (
                <span className="text-[#1f3d1f]">– –</span>
              )}
            </div>
            {fixture.scoreAtHalfTimeHome != null && (
              <p className="text-[#1f3d1f] text-xs mt-1 tabular-nums">
                HT {fixture.scoreAtHalfTimeHome} – {fixture.scoreAtHalfTimeAway}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamBadge name={fixture.awayTeam} />
            <span className="font-condensed font-black text-sm uppercase tracking-wide text-white text-center leading-tight">
              {fixture.awayTeam}
            </span>
          </div>
        </div>

        {/* Key events */}
        {keyEvents.length > 0 && (
          <ul className="space-y-1.5 border-t border-[#1a1a1a] pt-3 mt-2">
            {keyEvents.map((ev) => (
              <li key={ev.id} className="flex items-center gap-2 text-xs">
                <span className="text-[#1f3d1f] font-mono tabular-nums w-7 text-right flex-shrink-0">
                  {ev.minute}&apos;
                </span>
                <span className="flex-shrink-0">{EV_ICON[ev.type] ?? '•'}</span>
                <span
                  className={`flex-shrink-0 font-condensed font-bold uppercase tracking-wide text-[10px] ${
                    ev.side === 'home' ? 'text-[#00E676]' : 'text-[#3d6b3d]'
                  }`}
                >
                  {ev.side === 'home' ? fixture.homeTeam : fixture.awayTeam}
                </span>
                {ev.playerName && (
                  <span className="text-[#3d6b3d] truncate">{ev.playerName}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

function UpcomingCard({
  fixture,
  showTournament,
}: {
  fixture: Fixture;
  showTournament: boolean;
}) {
  return (
    <Link href={`/fixtures/${fixture.id}`} className="block">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2e2e2e] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="ea-label">{formatDate(fixture.date)}</span>
            <span className="text-[#1f3d1f] text-[10px]">·</span>
            <span className="ea-label">{fixture.kickOffTime}</span>
            {fixture.matchday && (
              <>
                <span className="text-[#1f3d1f] text-[10px]">·</span>
                <span className="ea-label">{fixture.matchday}</span>
              </>
            )}
            {fixture.tournamentStage && (
              <>
                <span className="text-[#1f3d1f] text-[10px]">·</span>
                <span className="ea-label">{fixture.tournamentStage}</span>
              </>
            )}
          </div>
          {showTournament && fixture.tournament && (
            <span className="ea-label ml-2 flex-shrink-0 max-w-[110px] truncate">
              {fixture.tournament.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-condensed font-bold text-sm uppercase tracking-wide text-white flex-1 leading-snug">
            {fixture.homeTeam}
          </span>
          <span className="ea-label px-2 flex-shrink-0">vs</span>
          <span className="font-condensed font-bold text-sm uppercase tracking-wide text-white flex-1 text-right leading-snug">
            {fixture.awayTeam}
          </span>
        </div>

        <p className="text-[#1f3d1f] text-xs mt-2 truncate">{fixture.venue}</p>
      </div>
    </Link>
  );
}

function ResultCard({
  fixture,
  showTournament,
}: {
  fixture: Fixture;
  showTournament: boolean;
}) {
  const score = getScore(fixture);

  return (
    <Link href={`/fixtures/${fixture.id}`} className="block">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2e2e2e] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-x-2">
            <span className="ea-label">{formatDate(fixture.date)}</span>
            {fixture.tournamentStage && (
              <>
                <span className="text-[#1f3d1f] text-[10px]">·</span>
                <span className="ea-label">{fixture.tournamentStage}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showTournament && fixture.tournament && (
              <span className="ea-label max-w-[100px] truncate">
                {fixture.tournament.name}
              </span>
            )}
            <span className="font-condensed font-bold text-[10px] uppercase tracking-widest text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 rounded-full px-2.5 py-0.5">
              FT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-condensed font-bold text-sm uppercase tracking-wide text-white flex-1 leading-snug">
            {fixture.homeTeam}
          </span>
          <span className="font-black text-xl tabular-nums text-white flex-shrink-0">
            {score ? `${score.home} – ${score.away}` : '– –'}
          </span>
          <span className="font-condensed font-bold text-sm uppercase tracking-wide text-white flex-1 text-right leading-snug">
            {fixture.awayTeam}
          </span>
        </div>

        {fixture.manOfTheMatch && (
          <p className="text-[#1f3d1f] text-xs mt-2">
            ⭐{' '}
            <span className="text-[#3d6b3d]">{fixture.manOfTheMatch}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

function StatTable({
  rows,
  icon,
  emptyText,
}: {
  rows: StatRow[];
  icon: string;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[#1f3d1f] text-sm text-center py-8">{emptyText}</p>
    );
  }
  return (
    <ol>
      {rows.map((row, i) => (
        <li
          key={`${row.name}||${row.team}`}
          className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0"
        >
          <span
            className={`font-condensed font-bold text-xs w-5 text-right flex-shrink-0 tabular-nums ${
              i === 0
                ? 'text-[#00E676]'
                : 'text-[#3d6b3d]'
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{row.name}</p>
            <p className="text-[#1f3d1f] text-xs truncate">{row.team}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-white font-bold text-sm tabular-nums">{row.count}</span>
            <span className="text-sm leading-none">{icon}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const FIXTURE_PAGE_SIZE = 6;
const STAT_PAGE_SIZE = 10;

function PageControls({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="font-condensed text-xs text-[#3d6b3d] uppercase tracking-wider">
        {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="font-condensed font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full border border-[#1a1a1a] text-[#3d6b3d] hover:text-white hover:border-[#2e2e2e] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="font-condensed font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full border border-[#1a1a1a] text-[#3d6b3d] hover:text-white hover:border-[#2e2e2e] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FixtureTab = 'upcoming' | 'results';
type StatTab = 'goals' | 'assists' | 'yellow' | 'red';

const STAT_TABS: {
  key: StatTab;
  label: string;
  icon: string;
  emptyText: string;
}[] = [
  { key: 'goals',   label: 'GOALS',   icon: '⚽', emptyText: 'No goals recorded yet.' },
  { key: 'assists', label: 'ASSISTS', icon: '🅰️', emptyText: 'No assists recorded yet.' },
  { key: 'yellow',  label: 'YELLOW',  icon: '🟨', emptyText: 'No yellow cards yet.' },
  { key: 'red',     label: 'RED',     icon: '🟥', emptyText: 'No red cards yet.' },
];

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTournament, setActiveTournament] = useState<string>('all');
  const [fixtureTab, setFixtureTab] = useState<FixtureTab>('upcoming');
  const [statTab, setStatTab] = useState<StatTab>('goals');
  const [loading, setLoading] = useState(true);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);
  const [statPage, setStatPage] = useState(1);

  const fetchData = useCallback(async (tid: string) => {
    const qs = tid !== 'all' ? `?tournamentId=${tid}` : '';
    const [fRes, sRes] = await Promise.all([
      fetch(`/api/fixtures${qs}`),
      fetch(`/api/stats${qs}`),
    ]);
    const [fData, sData] = await Promise.all([fRes.json(), sRes.json()]);
    setFixtures(Array.isArray(fData) ? fData : []);
    setStats(sData);
  }, []);

  // Load tournaments once
  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Load fixtures + stats when tournament changes; reset pages
  useEffect(() => {
    setLoading(true);
    setUpcomingPage(1);
    setResultsPage(1);
    setStatPage(1);
    fetchData(activeTournament).finally(() => setLoading(false));
  }, [activeTournament, fetchData]);

  // Auto-refresh every 30 s when a live match is active
  useEffect(() => {
    if (!fixtures.some((f) => f.status === 'ongoing')) return;
    const t = setInterval(() => fetchData(activeTournament), 30_000);
    return () => clearInterval(t);
  }, [fixtures, activeTournament, fetchData]);

  const live = fixtures.filter((f) => f.status === 'ongoing');
  const upcoming = fixtures
    .filter((f) => f.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const results = fixtures
    .filter((f) => f.status === 'complete')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const showTournament = activeTournament === 'all';

  const activeStatMeta = STAT_TABS.find((t) => t.key === statTab)!;
  const allStatRows =
    statTab === 'goals'
      ? stats?.topScorers ?? []
      : statTab === 'assists'
      ? stats?.topAssists ?? []
      : statTab === 'yellow'
      ? stats?.yellowCards ?? []
      : stats?.redCards ?? [];

  const upcomingTotalPages = Math.ceil(upcoming.length / FIXTURE_PAGE_SIZE);
  const resultsTotalPages = Math.ceil(results.length / FIXTURE_PAGE_SIZE);
  const statTotalPages = Math.ceil(allStatRows.length / STAT_PAGE_SIZE);

  const paginatedUpcoming = upcoming.slice((upcomingPage - 1) * FIXTURE_PAGE_SIZE, upcomingPage * FIXTURE_PAGE_SIZE);
  const paginatedResults = results.slice((resultsPage - 1) * FIXTURE_PAGE_SIZE, resultsPage * FIXTURE_PAGE_SIZE);
  const paginatedStats = allStatRows.slice((statPage - 1) * STAT_PAGE_SIZE, statPage * STAT_PAGE_SIZE);

  const activeStatRows = paginatedStats;

  return (
    <div className="min-h-screen bg-[#000000] text-white">

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-20 bg-[#000000]/95 backdrop-blur border-b border-[#1a1a1a] px-4 py-3.5">
        <div className="max-w-3xl mx-auto">
          <span className="font-condensed font-black text-xl tracking-wider uppercase">
            ⚽ CCI FOOTBALL
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-5 pb-16 space-y-8">

        {/* ── Tournament filter pills ── */}
        {tournaments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-hide">
            {([{ id: 'all', name: 'ALL', season: null } as Tournament, ...tournaments]).map(
              (t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTournament(t.id)}
                  className={`flex-shrink-0 font-condensed font-bold text-sm uppercase tracking-wider px-5 py-2 rounded-full border transition-colors ${
                    activeTournament === t.id
                      ? 'bg-[#00E676] text-black border-[#00E676]'
                      : 'text-[#3d6b3d] border-[#1a1a1a] hover:border-[#2e2e2e] hover:text-white'
                  }`}
                >
                  {t.name}
                  {t.season && (
                    <span className="ml-1.5 text-xs opacity-60">{t.season}</span>
                  )}
                </button>
              ),
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-[#1f3d1f] text-sm font-condensed font-bold uppercase tracking-widest">
              Loading…
            </div>
          </div>
        ) : (
          <>
            {/* ── Live Now ── */}
            {live.length > 0 && (
              <section>
                <div className="mb-4">
                  <SectionTitle>
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E676]" />
                      </span>
                      LIVE NOW
                    </span>
                  </SectionTitle>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {live.map((f) => (
                    <LiveCard key={f.id} fixture={f} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Fixtures / Results ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>FIXTURES</SectionTitle>
              </div>

              {/* Tab bar */}
              <div className="flex gap-2 mb-5">
                {(
                  [
                    { key: 'upcoming', label: 'UPCOMING', count: upcoming.length },
                    { key: 'results', label: 'RESULTS', count: results.length },
                  ] as { key: FixtureTab; label: string; count: number }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setFixtureTab(tab.key); setUpcomingPage(1); setResultsPage(1); }}
                    className={`font-condensed font-bold text-sm uppercase tracking-wider px-5 py-2 rounded-full border transition-colors ${
                      fixtureTab === tab.key
                        ? 'bg-[#00E676] text-black border-[#00E676]'
                        : 'text-[#3d6b3d] border-[#1a1a1a] hover:border-[#2e2e2e] hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-1.5 text-xs ${
                          fixtureTab === tab.key
                            ? 'text-white/70'
                            : 'text-[#1f3d1f]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Upcoming list */}
              {fixtureTab === 'upcoming' &&
                (upcoming.length === 0 ? (
                  <p className="text-[#1f3d1f] text-sm text-center py-12 font-condensed uppercase tracking-widest">
                    No upcoming fixtures.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {paginatedUpcoming.map((f) => (
                        <UpcomingCard key={f.id} fixture={f} showTournament={showTournament} />
                      ))}
                    </div>
                    <PageControls page={upcomingPage} totalPages={upcomingTotalPages} onPage={setUpcomingPage} />
                  </>
                ))}

              {/* Results list */}
              {fixtureTab === 'results' &&
                (results.length === 0 ? (
                  <p className="text-[#1f3d1f] text-sm text-center py-12 font-condensed uppercase tracking-widest">
                    No results yet.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {paginatedResults.map((f) => (
                        <ResultCard key={f.id} fixture={f} showTournament={showTournament} />
                      ))}
                    </div>
                    <PageControls page={resultsPage} totalPages={resultsTotalPages} onPage={setResultsPage} />
                  </>
                ))}
            </section>

            {/* ── Player Stats ── */}
            <section>
              <div className="mb-4">
                <SectionTitle>PLAYER STATS</SectionTitle>
              </div>

              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
                {/* Stat tab bar */}
                <div className="grid grid-cols-4 border-b border-[#1a1a1a]">
                  {STAT_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => { setStatTab(tab.key); setStatPage(1); }}
                      className={`py-3 font-condensed font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
                        statTab === tab.key
                          ? 'text-white border-[#00E676]'
                          : 'text-[#1f3d1f] border-transparent hover:text-[#3d6b3d]'
                      }`}
                    >
                      <span className="block text-base leading-none mb-1">
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <StatTable
                  rows={activeStatRows}
                  icon={activeStatMeta.icon}
                  emptyText={activeStatMeta.emptyText}
                />
                {statTotalPages > 1 && (
                  <div className="px-4 py-3 border-t border-[#1a1a1a]">
                    <PageControls page={statPage} totalPages={statTotalPages} onPage={setStatPage} />
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <footer className="border-t border-[#1a1a1a] py-6 text-center">
        <p className="ea-label">CCI Football · Powered by live updates</p>
      </footer>
    </div>
  );
}
