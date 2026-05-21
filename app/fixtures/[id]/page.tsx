import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function eventIcon(type: string) {
  switch (type) {
    case 'goal': return '⚽';
    case 'penalty': return '⚽';
    case 'own_goal': return '⚽';
    case 'yellow_card': return '🟨';
    case 'red_card': return '🟥';
    case 'substitution': return '🔄';
    case 'foul': return '⚠️';
    case 'free_kick': return '🎯';
    case 'corner': return '↪️';
    case 'goal_kick': return '🥅';
    case 'offside': return '🚫';
    default: return '•';
  }
}

function WhistleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 inline-block" aria-hidden="true">
      <path d="M12 6H8.5C6.01 6 4 8.01 4 10.5S6.01 15 8.5 15c1.64 0 3.08-.9 3.85-2.24L20 14v-3h-2V9h-2V7h-2.5L12 6zM8.5 13C7.12 13 6 11.88 6 10.5S7.12 8 8.5 8 11 9.12 11 10.5 9.88 13 8.5 13z" />
    </svg>
  );
}

function getPositionBadgeClasses(position?: string | null) {
  const normalized = position?.trim().toLowerCase() ?? '';
  if (normalized.includes('def')) {
    return 'bg-sky-500/15 border border-sky-500/30 text-sky-200';
  }
  if (normalized.includes('mid')) {
    return 'bg-amber-500/15 border border-amber-500/30 text-amber-200';
  }
  if (normalized.includes('forw') || normalized.includes('strik') || normalized.includes('att')) {
    return 'bg-rose-500/15 border border-rose-500/30 text-rose-200';
  }
  return 'bg-slate-800 border border-slate-700 text-slate-400';
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamBadgeLarge({ name }: { name: string }) {
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#2e2e2e] bg-[#1a1a1a]">
      <span className="font-condensed font-bold text-base text-[#3d6b3d] leading-none tracking-wide">
        {getInitials(name)}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs uppercase tracking-widest text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 rounded-full px-3 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E676]" />
        </span>
        LIVE
      </span>
    );
  }
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center font-condensed font-bold text-xs uppercase tracking-widest text-white bg-[#1a1a1a] border border-[#2e2e2e] rounded-full px-3 py-1">
        FT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center font-condensed font-bold text-xs uppercase tracking-widest text-[#888888] bg-[#111111] border border-[#222222] rounded-full px-3 py-1">
      SCHEDULED
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FixturePage({
  params,
}: {
  params: { id: string };
}) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: params.id },
    include: {
      events: { orderBy: { minute: 'asc' } },
      lineups: {
        include: {
          player: { include: { team: true } },
        },
      },
      stats: true,
    },
  });

  if (!fixture) notFound();

  // ── Score display ─────────────────────────────────────────────────────────
  const hasFullTime =
    fixture.scoreAt90Home != null && fixture.scoreAt90Away != null;
  const hasHalfTime =
    fixture.scoreAtHalfTimeHome != null && fixture.scoreAtHalfTimeAway != null;

  const displayHomeScore = hasFullTime
    ? fixture.scoreAt90Home!
    : hasHalfTime
    ? fixture.scoreAtHalfTimeHome!
    : 0;
  const displayAwayScore = hasFullTime
    ? fixture.scoreAt90Away!
    : hasHalfTime
    ? fixture.scoreAtHalfTimeAway!
    : 0;

  const hasET =
    fixture.extraTimePlayed &&
    fixture.scoreAfterExtraTimeHome != null &&
    fixture.scoreAfterExtraTimeAway != null;

  // ── Lineups ───────────────────────────────────────────────────────────────
  const homeStarters = fixture.lineups.filter(
    (l) => l.side === 'home' && l.role === 'starter',
  );
  const homeSubs = fixture.lineups.filter(
    (l) => l.side === 'home' && l.role === 'substitute',
  );
  const awayStarters = fixture.lineups.filter(
    (l) => l.side === 'away' && l.role === 'starter',
  );
  const awaySubs = fixture.lineups.filter(
    (l) => l.side === 'away' && l.role === 'substitute',
  );

  const hasLineups = fixture.lineups.length > 0;
  const hasEvents = fixture.events.length > 0;

  // ── Match stats ───────────────────────────────────────────────────────────
  const matchScorers = fixture.stats.filter(
    (s) => s.goals > 0 || s.assists > 0,
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-20 bg-[#000000]/95 backdrop-blur border-b border-[#1a1a1a] px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-condensed font-black text-xl tracking-wider uppercase">
            ⚽ CCI FOOTBALL
          </span>
          <Link
            href="/"
            className="font-condensed font-bold text-sm uppercase tracking-widest text-[#3d6b3d] hover:text-white transition-colors"
          >
            ← BACK
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* ── Match Header ── */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sm:p-8 relative">
          {/* Status badge */}
          <div className="absolute top-5 right-5">
            <StatusBadge status={fixture.status} />
          </div>

          {/* Tournament / matchday meta */}
          {(fixture.tournamentStage || fixture.matchday) && (
            <div className="mb-5 flex flex-wrap gap-2">
              {fixture.tournamentStage && (
                <span className="ea-label bg-[#1a1a1a] rounded-full px-3 py-1">
                  {fixture.tournamentStage}
                </span>
              )}
              {fixture.matchday && (
                <span className="ea-label bg-[#1a1a1a] rounded-full px-3 py-1">
                  {fixture.matchday}
                </span>
              )}
            </div>
          )}

          {/* Teams + score */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadgeLarge name={fixture.homeTeam} />
              <span className="font-condensed font-black text-lg sm:text-2xl uppercase tracking-wide text-white text-center leading-tight">
                {fixture.homeTeam}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
              <div className="font-black text-5xl sm:text-6xl tabular-nums tracking-tight text-white leading-none flex items-center gap-3">
                <span>{displayHomeScore}</span>
                <span className="text-[#1f3d1f]">–</span>
                <span>{displayAwayScore}</span>
              </div>
              {hasET && (
                <span className="font-condensed font-bold text-xs uppercase tracking-widest text-[#00E676] mt-1">
                  AET {fixture.scoreAfterExtraTimeHome} –{' '}
                  {fixture.scoreAfterExtraTimeAway}
                </span>
              )}
              {hasHalfTime && (
                <span className="ea-label mt-0.5">
                  HT {fixture.scoreAtHalfTimeHome} – {fixture.scoreAtHalfTimeAway}
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamBadgeLarge name={fixture.awayTeam} />
              <span className="font-condensed font-black text-lg sm:text-2xl uppercase tracking-wide text-white text-center leading-tight">
                {fixture.awayTeam}
              </span>
            </div>
          </div>

          {/* Match details row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#1a1a1a] pt-5">
            <span className="ea-label">{formatDate(fixture.date)}</span>
            <span className="text-[#1f3d1f] text-[10px]">·</span>
            <span className="ea-label">{fixture.kickOffTime}</span>
            <span className="text-[#1f3d1f] text-[10px]">·</span>
            <span className="ea-label">{fixture.venue}</span>
            {fixture.manOfTheMatch && (
              <>
                <span className="text-[#1f3d1f] text-[10px]">·</span>
                <span className="ea-label">
                  ⭐ MOTM:{' '}
                  <span className="text-white font-bold">{fixture.manOfTheMatch}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Lineups ── */}
        {hasLineups && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="ea-section-title mb-5">LINEUPS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Home */}
              <div>
                <p className="font-condensed font-black text-sm uppercase tracking-wider text-white mb-4">
                  {fixture.homeTeam}
                </p>
                {homeStarters.length > 0 && (
                  <>
                    <p className="ea-label mb-2">Starting XI</p>
                    <ul className="space-y-1.5 mb-4">
                      {homeStarters.map((l) => (
                        <li key={l.id} className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#1a1a1a] border border-[#2e2e2e] text-[#3d6b3d] text-[10px] font-bold font-condensed shrink-0">
                            {l.player.jerseyNumber}
                          </span>
                          <span className="text-white font-medium">{l.player.fullName}</span>
                          {(l.position ?? l.player.position) && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getPositionBadgeClasses(l.position ?? l.player.position)}`}>
                              {l.position ?? l.player.position}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {homeSubs.length > 0 && (
                  <>
                    <p className="ea-label mb-2">Substitutes</p>
                    <ul className="space-y-1.5">
                      {homeSubs.map((l) => (
                        <li key={l.id} className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#111111] border border-[#1a1a1a] text-[#1f3d1f] text-[10px] font-bold font-condensed shrink-0">
                            {l.player.jerseyNumber}
                          </span>
                          <span className="text-[#3d6b3d]">{l.player.fullName}</span>
                          {(l.position ?? l.player.position) && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getPositionBadgeClasses(l.position ?? l.player.position)}`}>
                              {l.position ?? l.player.position}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Away */}
              <div>
                <p className="font-condensed font-black text-sm uppercase tracking-wider text-white mb-4">
                  {fixture.awayTeam}
                </p>
                {awayStarters.length > 0 && (
                  <>
                    <p className="ea-label mb-2">Starting XI</p>
                    <ul className="space-y-1.5 mb-4">
                      {awayStarters.map((l) => (
                        <li key={l.id} className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#1a1a1a] border border-[#2e2e2e] text-[#3d6b3d] text-[10px] font-bold font-condensed shrink-0">
                            {l.player.jerseyNumber}
                          </span>
                          <span className="text-white font-medium">{l.player.fullName}</span>
                          {(l.position ?? l.player.position) && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getPositionBadgeClasses(l.position ?? l.player.position)}`}>
                              {l.position ?? l.player.position}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {awaySubs.length > 0 && (
                  <>
                    <p className="ea-label mb-2">Substitutes</p>
                    <ul className="space-y-1.5">
                      {awaySubs.map((l) => (
                        <li key={l.id} className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#111111] border border-[#1a1a1a] text-[#1f3d1f] text-[10px] font-bold font-condensed shrink-0">
                            {l.player.jerseyNumber}
                          </span>
                          <span className="text-[#3d6b3d]">{l.player.fullName}</span>
                          {(l.position ?? l.player.position) && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getPositionBadgeClasses(l.position ?? l.player.position)}`}>
                              {l.position ?? l.player.position}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Match Events ── */}
        {hasEvents && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="ea-section-title mb-5">MATCH EVENTS</h2>
            <ol className="space-y-0">
              {fixture.events.map((event) => {
                if (event.type === 'half_time' || event.type === 'full_time') {
                  const label = event.type === 'half_time' ? 'Half Time' : 'Full Time';
                  return (
                    <li key={event.id} className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
                      <div className="flex-1 border-t border-[#1a1a1a]" />
                      <span className="flex items-center gap-1.5 text-[#3d6b3d] font-condensed font-bold text-xs uppercase tracking-widest flex-shrink-0">
                        <WhistleIcon />
                        {label}
                      </span>
                      <div className="flex-1 border-t border-[#1a1a1a]" />
                    </li>
                  );
                }

                return (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 text-sm py-3 border-b border-[#1a1a1a] last:border-0"
                  >
                    {/* Minute badge */}
                    <span className="bg-[#1a1a1a] border border-[#2e2e2e] rounded text-xs px-2 py-0.5 text-[#3d6b3d] font-mono tabular-nums shrink-0 mt-0.5">
                      {event.minute}&apos;
                    </span>

                    {/* Icon */}
                    <span className="text-base shrink-0 mt-[-1px]">
                      {eventIcon(event.type)}
                    </span>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      {event.type === 'substitution' ? (
                        <span>
                          <span className="text-[#00E676]">↑</span>{' '}
                          <span className="text-white font-semibold">
                            {event.playerName ?? '—'}
                          </span>
                          {event.playerOutName && (
                            <>
                              {' '}
                              <span className="text-[#3d6b3d]">↓</span>{' '}
                              <span className="text-[#3d6b3d]">{event.playerOutName}</span>
                            </>
                          )}
                        </span>
                      ) : event.type === 'own_goal' ? (
                        <span>
                          <span className="text-white font-semibold">
                            {event.playerName ?? '—'}
                          </span>{' '}
                          <span className="ea-label">(OG)</span>
                        </span>
                      ) : event.type === 'goal' || event.type === 'penalty' ? (
                        <span>
                          <span className="text-white font-semibold">
                            {event.playerName ?? '—'}
                          </span>
                          {event.assistName && (
                            <span className="text-[#3d6b3d] text-xs ml-1.5">
                              (assist: {event.assistName})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-white font-semibold">
                          {event.playerName ?? event.description ?? '—'}
                        </span>
                      )}

                      {/* Team side pill */}
                      <span
                        className={`ml-2 font-condensed font-bold text-[10px] uppercase tracking-widest ${
                          event.side === 'home' ? 'text-[#00E676]' : 'text-[#3d6b3d]'
                        }`}
                      >
                        {event.side === 'home' ? fixture.homeTeam : fixture.awayTeam}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* ── Match Stats ── */}
        {matchScorers.length > 0 && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="ea-section-title mb-5">MATCH STATS</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left pb-2 ea-label font-bold">Player</th>
                  <th className="text-left pb-2 ea-label font-bold">Team</th>
                  <th className="text-center pb-2 ea-label font-bold">G</th>
                  <th className="text-center pb-2 ea-label font-bold">A</th>
                  {matchScorers.some((s) => s.yellowCards > 0) && (
                    <th className="text-center pb-2 ea-label font-bold">🟨</th>
                  )}
                  {matchScorers.some((s) => s.redCards > 0) && (
                    <th className="text-center pb-2 ea-label font-bold">🟥</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {matchScorers
                  .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
                  .map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#1a1a1a]/50 last:border-0"
                    >
                      <td className="py-2.5 text-white font-semibold">{s.name}</td>
                      <td className="py-2.5 text-[#3d6b3d]">{s.team}</td>
                      <td className="py-2.5 text-center text-white font-bold">
                        {s.goals > 0 ? s.goals : <span className="text-[#1f3d1f]">–</span>}
                      </td>
                      <td className="py-2.5 text-center text-[#3d6b3d]">
                        {s.assists > 0 ? s.assists : <span className="text-[#1f3d1f]">–</span>}
                      </td>
                      {matchScorers.some((x) => x.yellowCards > 0) && (
                        <td className="py-2.5 text-center text-[#3d6b3d]">
                          {s.yellowCards > 0 ? s.yellowCards : <span className="text-[#1f3d1f]">–</span>}
                        </td>
                      )}
                      {matchScorers.some((x) => x.redCards > 0) && (
                        <td className="py-2.5 text-center text-[#3d6b3d]">
                          {s.redCards > 0 ? s.redCards : <span className="text-[#1f3d1f]">–</span>}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <footer className="border-t border-[#1a1a1a] py-8" />
    </div>
  );
}
