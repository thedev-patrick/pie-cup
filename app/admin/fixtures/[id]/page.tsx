'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
  position: string | null;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface LineupEntry {
  id: string;
  playerId: string;
  side: string;
  role: string;
  position: string | null;
  player: {
    id: string;
    fullName: string;
    jerseyNumber: number | null;
  };
}

interface MatchEvent {
  id: string;
  minute: number;
  type: string;
  side: string;
  playerId: string | null;
  playerName: string | null;
  assistName: string | null;
  playerOutName: string | null;
  description: string | null;
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
  tournamentId: string | null;
  status: string;
  scoreAtHalfTimeHome: number | null;
  scoreAtHalfTimeAway: number | null;
  scoreAt90Home: number | null;
  scoreAt90Away: number | null;
  extraTimePlayed: boolean;
  scoreAfterExtraTimeHome: number | null;
  scoreAfterExtraTimeAway: number | null;
  manOfTheMatch: string | null;
  summary: string | null;
  lineups: LineupEntry[];
  events: MatchEvent[];
}

interface Tournament {
  id: string;
  name: string;
  season: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<string, string> = {
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

function WhistleIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 6H8.5C6.01 6 4 8.01 4 10.5S6.01 15 8.5 15c1.64 0 3.08-.9 3.85-2.24L20 14v-3h-2V9h-2V7h-2.5L12 6zM8.5 13C7.12 13 6 11.88 6 10.5S7.12 8 8.5 8 11 9.12 11 10.5 9.88 13 8.5 13z" />
    </svg>
  );
}

function inputCls(extra = '') {
  return `w-full bg-[#1a1a1a] border border-[#222222] rounded-lg px-3 py-2 text-white placeholder-[#333333] text-sm focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors ${extra}`;
}

function labelCls() {
  return 'block text-sm text-[#888888] mb-1.5';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-[#222222] text-white'
          : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lineup sub-components (defined at module scope — not inside another component)
// ---------------------------------------------------------------------------

interface LineupPlayerState {
  checked: boolean;
  role: 'starter' | 'substitute';
  position: string;
}

interface PlayerRowProps {
  player: Player;
  defaultPosition: string;
  playerState: Record<string, LineupPlayerState>;
  onAdd: (playerId: string, role: 'starter' | 'substitute', defaultPosition: string) => void;
  onRemove: (playerId: string) => void;
  onUpdate: (playerId: string, field: 'role' | 'position', value: string) => void;
}

function PlayerRow({ player, defaultPosition, playerState, onAdd, onRemove, onUpdate }: PlayerRowProps) {
  const state = playerState[player.id];
  const checked = state?.checked ?? false;

  if (checked) {
    return (
      <div className="py-2 px-3 rounded-lg bg-slate-800 space-y-1.5">
        {/* Row 1: number + name + remove */}
        <div className="flex items-center gap-2">
          {player.jerseyNumber != null && (
            <span className="bg-slate-700 text-slate-300 text-xs font-bold rounded px-1.5 py-0.5 flex-shrink-0 min-w-[1.75rem] text-center">
              {player.jerseyNumber}
            </span>
          )}
          <span className="text-sm font-medium text-white flex-1 truncate min-w-0">
            {player.fullName}
          </span>
          <button
            type="button"
            onClick={() => onRemove(player.id)}
            aria-label={`Remove ${player.fullName}`}
            className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        {/* Row 2: position input + XI/Sub toggle */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={state?.position ?? ''}
            onChange={(e) => onUpdate(player.id, 'position', e.target.value)}
            placeholder="Position"
            className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
          />
          <div className="flex rounded overflow-hidden border border-slate-600 flex-shrink-0">
            <button
              type="button"
              onClick={() => onUpdate(player.id, 'role', 'starter')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${state?.role === 'starter' ? 'bg-[#00E676] text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              XI
            </button>
            <button
              type="button"
              onClick={() => onUpdate(player.id, 'role', 'substitute')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${state?.role === 'substitute' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              Sub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/40 group transition-colors">
      {player.jerseyNumber != null && (
        <span className="bg-slate-700/60 text-slate-400 text-xs font-bold rounded px-1.5 py-0.5 flex-shrink-0 min-w-[1.75rem] text-center">
          {player.jerseyNumber}
        </span>
      )}
      <span className="text-sm text-slate-400 flex-1 truncate min-w-0">
        {player.fullName}
      </span>
      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          type="button"
          onClick={() => onAdd(player.id, 'starter', defaultPosition)}
          className="px-2 py-1 text-xs font-medium rounded bg-[#00E676]/10 text-[#00E676] hover:bg-[#00E676]/20 transition-colors"
        >
          + XI
        </button>
        <button
          type="button"
          onClick={() => onAdd(player.id, 'substitute', defaultPosition)}
          className="px-2 py-1 text-xs font-medium rounded bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 transition-colors"
        >
          + Sub
        </button>
      </div>
    </div>
  );
}

interface TeamColumnProps {
  title: string;
  players: Player[];
  side: 'home' | 'away';
  playerState: Record<string, LineupPlayerState>;
  onAdd: (playerId: string, role: 'starter' | 'substitute', defaultPosition: string) => void;
  onRemove: (playerId: string) => void;
  onUpdate: (playerId: string, field: 'role' | 'position', value: string) => void;
}

function TeamColumn({ title, players, side, playerState, onAdd, onRemove, onUpdate }: TeamColumnProps) {
  const starters = players.filter((p) => playerState[p.id]?.checked && playerState[p.id]?.role === 'starter');
  const subs = players.filter((p) => playerState[p.id]?.checked && playerState[p.id]?.role === 'substitute');
  const squad = players.filter((p) => !playerState[p.id]?.checked);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${side === 'home' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#111111] text-[#888888]'}`}>
          {side}
        </span>
        <h3 className="text-white font-semibold truncate">{title}</h3>
      </div>
      {players.length === 0 ? (
        <p className="text-slate-600 text-sm py-4 text-center">No players found for this team.</p>
      ) : (
        <div className="space-y-1">
          {starters.length > 0 && (
            <>
              <p className={`text-xs uppercase tracking-wider px-3 mb-1 mt-2 ${starters.length > 11 ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                Starting XI ({starters.length}/11){starters.length > 11 ? ' — exceeds limit!' : ''}
              </p>
              {starters.map((p) => <PlayerRow key={p.id} player={p} defaultPosition={p.position ?? ''} playerState={playerState} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} />)}
            </>
          )}
          {subs.length > 0 && (
            <>
              <p className={`text-xs uppercase tracking-wider px-3 mb-1 mt-3 ${subs.length > 14 ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                Substitutes ({subs.length}/14){subs.length > 14 ? ' — exceeds limit!' : ''}
              </p>
              {subs.map((p) => <PlayerRow key={p.id} player={p} defaultPosition={p.position ?? ''} playerState={playerState} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} />)}
            </>
          )}
          {squad.length > 0 && (
            <>
              <p className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-1 mt-3">
                Squad
              </p>
              {squad.map((p) => <PlayerRow key={p.id} player={p} defaultPosition={p.position ?? ''} playerState={playerState} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Match Info
// ---------------------------------------------------------------------------

function MatchInfoTab({ fixture, onSaved }: { fixture: Fixture; onSaved: () => void }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [form, setForm] = useState({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    tournamentId: fixture.tournamentId ?? '',
    date: fixture.date ? fixture.date.slice(0, 10) : '',
    kickOffTime: fixture.kickOffTime ?? '',
    venue: fixture.venue ?? '',
    matchday: fixture.matchday ?? '',
    tournamentStage: fixture.tournamentStage ?? '',
    status: fixture.status ?? 'scheduled',
    scoreAtHalfTimeHome: fixture.scoreAtHalfTimeHome ?? 0,
    scoreAtHalfTimeAway: fixture.scoreAtHalfTimeAway ?? 0,
    scoreAt90Home: fixture.scoreAt90Home ?? 0,
    scoreAt90Away: fixture.scoreAt90Away ?? 0,
    extraTimePlayed: fixture.extraTimePlayed ?? false,
    scoreAfterExtraTimeHome: fixture.scoreAfterExtraTimeHome ?? 0,
    scoreAfterExtraTimeAway: fixture.scoreAfterExtraTimeAway ?? 0,
    manOfTheMatch: fixture.manOfTheMatch ?? '',
    summary: fixture.summary ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/tournaments').then((r) => r.json()).then(setTournaments).catch(() => {});
  }, []);

  // Sync recalculated scores back into the form whenever the fixture prop updates
  // (scores change server-side when events are recorded from the Events tab)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      scoreAtHalfTimeHome: fixture.scoreAtHalfTimeHome ?? 0,
      scoreAtHalfTimeAway: fixture.scoreAtHalfTimeAway ?? 0,
      scoreAt90Home: fixture.scoreAt90Home ?? 0,
      scoreAt90Away: fixture.scoreAt90Away ?? 0,
    }));
  }, [
    fixture.scoreAtHalfTimeHome,
    fixture.scoreAtHalfTimeAway,
    fixture.scoreAt90Home,
    fixture.scoreAt90Away,
  ]);

  function set(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/fixtures/${fixture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Server error ${res.status}`);
      }
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Tournament */}
      {tournaments.length > 0 && (
        <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tournament</h2>
          <select
            value={form.tournamentId}
            onChange={(e) => set('tournamentId', e.target.value)}
            title="Tournament"
            className={inputCls()}
          >
            <option value="">— None —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.season ? ` — ${t.season}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Teams */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Teams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls()}>Home Team</label>
            <input type="text" value={form.homeTeam} onChange={(e) => set('homeTeam', e.target.value)} className={inputCls()} placeholder="Home team" />
          </div>
          <div>
            <label className={labelCls()}>Away Team</label>
            <input type="text" value={form.awayTeam} onChange={(e) => set('awayTeam', e.target.value)} className={inputCls()} placeholder="Away team" />
          </div>
        </div>
      </div>

      {/* Date, Time, Venue */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls()}>Date</label>
            <input type="date" title="Date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls('[color-scheme:dark]')} />
          </div>
          <div>
            <label className={labelCls()}>Kick-off Time</label>
            <input type="time" title="Kick-off Time" value={form.kickOffTime} onChange={(e) => set('kickOffTime', e.target.value)} className={inputCls('[color-scheme:dark]')} />
          </div>
        </div>
        <div className="mb-4">
          <label className={labelCls()}>Venue</label>
          <input type="text" value={form.venue} onChange={(e) => set('venue', e.target.value)} className={inputCls()} placeholder="Venue" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls()}>Matchday</label>
            <input type="text" value={form.matchday} onChange={(e) => set('matchday', e.target.value)} className={inputCls()} placeholder="e.g. MD 12" />
          </div>
          <div>
            <label className={labelCls()}>Tournament Stage</label>
            <input type="text" value={form.tournamentStage} onChange={(e) => set('tournamentStage', e.target.value)} className={inputCls()} placeholder="e.g. Quarter Final" />
          </div>
        </div>
        <div>
          <label className={labelCls()}>Status</label>
          <select title="Status" value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls()}>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {/* Scores */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Scores</h2>

        {/* Half Time */}
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Half Time</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls()}>Home</label>
            <input type="number" title="Half time home score" min={0} value={form.scoreAtHalfTimeHome} onChange={(e) => set('scoreAtHalfTimeHome', Number(e.target.value))} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Away</label>
            <input type="number" title="Half time away score" min={0} value={form.scoreAtHalfTimeAway} onChange={(e) => set('scoreAtHalfTimeAway', Number(e.target.value))} className={inputCls()} />
          </div>
        </div>

        {/* 90 min */}
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">90 Minutes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls()}>Home</label>
            <input type="number" title="90 min home score" min={0} value={form.scoreAt90Home} onChange={(e) => set('scoreAt90Home', Number(e.target.value))} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Away</label>
            <input type="number" title="90 min away score" min={0} value={form.scoreAt90Away} onChange={(e) => set('scoreAt90Away', Number(e.target.value))} className={inputCls()} />
          </div>
        </div>

        {/* Extra Time */}
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={form.extraTimePlayed}
            onChange={(e) => set('extraTimePlayed', e.target.checked)}
            className="w-4 h-4 accent-green-500 rounded"
          />
          <span className="text-sm text-slate-300">Extra Time Played</span>
        </label>

        {form.extraTimePlayed && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">After Extra Time</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls()}>Home</label>
                <input type="number" title="Extra time home score" min={0} value={form.scoreAfterExtraTimeHome} onChange={(e) => set('scoreAfterExtraTimeHome', Number(e.target.value))} className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>Away</label>
                <input type="number" title="Extra time away score" min={0} value={form.scoreAfterExtraTimeAway} onChange={(e) => set('scoreAfterExtraTimeAway', Number(e.target.value))} className={inputCls()} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Man of the Match */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <label className={labelCls()}>Man of the Match</label>
        {fixture.lineups.length > 0 ? (
          <select
            value={form.manOfTheMatch}
            onChange={(e) => set('manOfTheMatch', e.target.value)}
            title="Man of the Match"
            className={inputCls()}
          >
            <option value="">— None —</option>
            {fixture.lineups.map((entry) => (
              <option key={entry.id} value={entry.player.fullName}>
                {entry.player.jerseyNumber != null ? `#${entry.player.jerseyNumber} ` : ''}{entry.player.fullName}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" value={form.manOfTheMatch} onChange={(e) => set('manOfTheMatch', e.target.value)} className={inputCls()} placeholder="Player name (set lineup first for dropdown)" />
        )}
      </div>

      {/* Match Summary */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <label className={labelCls()}>Match Summary</label>
        <p className="text-xs text-slate-600 mb-2">A general overview of the game. Included in the match report.</p>
        <textarea
          title="Match Summary"
          value={form.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="e.g. A tightly contested match that saw the home side dominate possession in the first half before the visitors equalised through a well-worked move…"
          rows={5}
          className="w-full bg-[#1a1a1a] border border-[#222222] rounded-lg px-3 py-2 text-white placeholder-[#333333] text-sm focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors resize-y"
        />
      </div>

      {/* Error / success */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {saved && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-3 text-sm text-green-400">Fixture saved successfully.</div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {saving ? 'Saving…' : (
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Save
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Lineup (per-side view, state lives in parent FixturePage)
// ---------------------------------------------------------------------------

interface LineupSideTabProps {
  side: 'home' | 'away';
  teamName: string;
  players: Player[];
  playerState: Record<string, LineupPlayerState>;
  onAdd: (playerId: string, role: 'starter' | 'substitute', defaultPosition: string) => void;
  onRemove: (playerId: string) => void;
  onUpdate: (playerId: string, field: 'role' | 'position', value: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  saved: boolean;
}

function LineupSideTab({
  side, teamName, players, playerState, onAdd, onRemove, onUpdate, onSave, saving, error, saved,
}: LineupSideTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-3 sm:p-6">
        <TeamColumn
          title={teamName}
          players={players}
          side={side}
          playerState={playerState}
          onAdd={onAdd}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {saved && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-3 text-sm text-green-400">Lineup saved successfully.</div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {saving ? 'Saving…' : (
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Save
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Events
// ---------------------------------------------------------------------------

const BLANK_EVENT = {
  minute: '',
  type: 'goal',
  side: 'home',
  playerName: '',
  assistName: '',
  playerOutName: '',
  description: '',
};

function EventsTab({ fixture, onRefresh }: { fixture: Fixture; onRefresh: () => void }) {
  const [form, setForm] = useState({ ...BLANK_EVENT });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = [...fixture.events].sort((a, b) => a.minute - b.minute);

  // Players in the lineup for the selected side
  const sideLineup = fixture.lineups
    .filter((l) => l.side === form.side)
    .map((l) => l.player);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        minute: Number(form.minute),
        type: form.type,
        side: form.side,
        playerName: form.playerName || null,
        assistName: form.type === 'goal' ? (form.assistName || null) : null,
        playerOutName: form.type === 'substitution' ? (form.playerOutName || null) : null,
        description: form.description || null,
      };
      const res = await fetch(`/api/fixtures/${fixture.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Server error ${res.status}`);
      }
      setForm({ ...BLANK_EVENT });
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Feed */}
      <div className="bg-[#111111] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Match Events ({sortedEvents.length})
        </h2>
        {sortedEvents.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-4">No events yet.</p>
        ) : (
          <div className="space-y-1">
            {sortedEvents.map((ev) => {
              if (ev.type === 'half_time' || ev.type === 'full_time') {
                const label = ev.type === 'half_time' ? 'Half Time' : 'Full Time';
                return (
                  <div key={ev.id} className="flex items-center gap-3 py-3 group">
                    <div className="flex-1 border-t border-[#2a2a2a]" />
                    <span className="flex items-center gap-1.5 text-xs text-[#555555] font-medium uppercase tracking-widest px-2 flex-shrink-0">
                      <WhistleIcon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                    <div className="flex-1 border-t border-[#2a2a2a]" />
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id)}
                      disabled={deletingId === ev.id}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0 disabled:opacity-30"
                      title={`Remove ${label.toLowerCase()} marker`}
                    >
                      {deletingId === ev.id ? '…' : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-800/60 transition-colors group"
                >
                  <span className="text-xs text-slate-500 font-mono w-8 text-right flex-shrink-0">
                    {ev.minute}&apos;
                  </span>
                  <span className="text-base flex-shrink-0">{EVENT_ICONS[ev.type] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">
                      {ev.playerName ?? <span className="text-slate-500 italic">Unknown player</span>}
                    </span>
                    {ev.assistName && (
                      <span className="text-xs text-slate-500 ml-1">(assist: {ev.assistName})</span>
                    )}
                    {ev.playerOutName && (
                      <span className="text-xs text-slate-500 ml-1">↔ {ev.playerOutName}</span>
                    )}
                    {ev.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${ev.side === 'home' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#111111] text-[#888888]'}`}>
                    {ev.side}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    disabled={deletingId === ev.id}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-xs flex-shrink-0 disabled:opacity-30"
                    title="Delete event"
                  >
                    {deletingId === ev.id ? '…' : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Form — only available for ongoing fixtures */}
      {fixture.status !== 'ongoing' ? (
        <div className="bg-[#111111] border border-slate-800 rounded-xl px-5 py-6 text-center">
          <p className="text-sm text-[#555555]">
            Events can only be recorded while a fixture is <span className="text-[#aaaaaa]">ongoing (live)</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#111111] border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Add Event</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls()}>Minute <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.minute}
                onChange={(e) => setField('minute', e.target.value)}
                required
                placeholder="e.g. 45"
                className={inputCls()}
              />
            </div>
            <div className={(form.type === 'half_time' || form.type === 'full_time') ? 'sm:col-span-2' : ''}>
              <label className={labelCls()}>Type <span className="text-red-500">*</span></label>
              <select title="Event type" value={form.type} onChange={(e) => setField('type', e.target.value)} className={inputCls()}>
                <option value="goal">Goal</option>
                <option value="yellow_card">Yellow Card</option>
                <option value="red_card">Red Card</option>
                <option value="foul">Foul</option>
                <option value="free_kick">Free Kick</option>
                <option value="corner">Corner</option>
                <option value="goal_kick">Goal Kick</option>
                <option value="offside">Offside</option>
                <option value="substitution">Substitution</option>
                <option value="own_goal">Own Goal</option>
                <option value="penalty">Penalty</option>
                <option value="half_time">Half Time</option>
                <option value="full_time">Full Time</option>
              </select>
            </div>
            {form.type !== 'half_time' && form.type !== 'full_time' && (
              <div>
                <label className={labelCls()}>Side <span className="text-red-500">*</span></label>
                <select
                  title="Side"
                  value={form.side}
                  onChange={(e) => {
                    setField('side', e.target.value);
                    setField('playerName', '');
                    setField('assistName', '');
                    setField('playerOutName', '');
                  }}
                  className={inputCls()}
                >
                  <option value="home">Home — {fixture.homeTeam}</option>
                  <option value="away">Away — {fixture.awayTeam}</option>
                </select>
              </div>
            )}
          </div>

          {/* Player, Assist, Sub fields — hidden for half_time */}
          {form.type !== 'half_time' && form.type !== 'full_time' && (
            <>
              <div>
                <label className={labelCls()}>Player</label>
                {sideLineup.length > 0 ? (
                  <select
                    title="Player"
                    value={form.playerName}
                    onChange={(e) => setField('playerName', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">— Select player —</option>
                    {sideLineup.map((p) => (
                      <option key={p.id} value={p.fullName}>
                        {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.playerName}
                    onChange={(e) => setField('playerName', e.target.value)}
                    placeholder="Player name (set lineup first for dropdown)"
                    className={inputCls()}
                  />
                )}
              </div>

              {form.type === 'goal' && (
                <div>
                  <label className={labelCls()}>Assist</label>
                  {sideLineup.length > 0 ? (
                    <select
                      value={form.assistName}
                      onChange={(e) => setField('assistName', e.target.value)}
                      title="Assist"
                      className={inputCls()}
                    >
                      <option value="">— None —</option>
                      {sideLineup.map((p) => (
                        <option key={p.id} value={p.fullName}>
                          {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.assistName}
                      onChange={(e) => setField('assistName', e.target.value)}
                      placeholder="Assisting player (optional)"
                      className={inputCls()}
                    />
                  )}
                </div>
              )}

              {form.type === 'substitution' && (
                <div>
                  <label className={labelCls()}>Player Off</label>
                  {sideLineup.length > 0 ? (
                    <select
                      value={form.playerOutName}
                      onChange={(e) => setField('playerOutName', e.target.value)}
                      title="Player Off"
                      className={inputCls()}
                    >
                      <option value="">— Select player —</option>
                      {sideLineup.map((p) => (
                        <option key={p.id} value={p.fullName}>
                          {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.playerOutName}
                      onChange={(e) => setField('playerOutName', e.target.value)}
                      placeholder="Player coming off"
                      className={inputCls()}
                    />
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className={labelCls()}>Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Optional note"
              className={inputCls()}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
            >
              {submitting ? 'Adding…' : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type Tab = 'info' | 'lineup_home' | 'lineup_away' | 'events';

export default function FixturePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Lineup state — shared between home and away tabs
  const [lineupPlayerState, setLineupPlayerState] = useState<Record<string, LineupPlayerState>>({});
  const [lineupSaving, setLineupSaving] = useState(false);
  const [lineupError, setLineupError] = useState<string | null>(null);
  const [lineupSaved, setLineupSaved] = useState(false);

  const fetchFixture = useCallback(async () => {
    try {
      const res = await fetch(`/api/fixtures/${id}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setFixture(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fixture');
    }
  }, [id]);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) return;
      const data = await res.json();
      setTeams(data);
    } catch {
      // teams failing is non-fatal
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchFixture(), fetchTeams()]);
      setLoading(false);
    }
    init();
  }, [fetchFixture, fetchTeams]);

  // Re-init lineup state whenever fixture reloads
  useEffect(() => {
    if (!fixture) return;
    const state: Record<string, LineupPlayerState> = {};
    for (const entry of fixture.lineups) {
      state[entry.playerId] = {
        checked: true,
        role: entry.role === 'substitute' ? 'substitute' : 'starter',
        position: entry.position ?? '',
      };
    }
    setLineupPlayerState(state);
  }, [fixture]);

  // Derived player lists for lineup tabs
  const homePlayers = teams.filter((t) => fixture && t.name === fixture.homeTeam).flatMap((t) => t.players);
  const awayPlayers = teams.filter((t) => fixture && t.name === fixture.awayTeam).flatMap((t) => t.players);

  function addLineupPlayer(playerId: string, role: 'starter' | 'substitute', defaultPosition: string) {
    setLineupPlayerState((prev) => ({
      ...prev,
      [playerId]: { checked: true, role, position: prev[playerId]?.position ?? defaultPosition },
    }));
  }

  function removeLineupPlayer(playerId: string) {
    setLineupPlayerState((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], checked: false },
    }));
  }

  function updateLineupPlayerField(playerId: string, field: 'role' | 'position', value: string) {
    setLineupPlayerState((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  }

  async function handleLineupSave() {
    if (!fixture) return;
    setLineupSaving(true);
    setLineupError(null);
    setLineupSaved(false);

    const homeStarters = homePlayers.filter((p) => lineupPlayerState[p.id]?.checked && lineupPlayerState[p.id]?.role === 'starter').length;
    const homeSubs = homePlayers.filter((p) => lineupPlayerState[p.id]?.checked && lineupPlayerState[p.id]?.role === 'substitute').length;
    const awayStarters = awayPlayers.filter((p) => lineupPlayerState[p.id]?.checked && lineupPlayerState[p.id]?.role === 'starter').length;
    const awaySubs = awayPlayers.filter((p) => lineupPlayerState[p.id]?.checked && lineupPlayerState[p.id]?.role === 'substitute').length;

    if (homeStarters > 11) { setLineupError(`Home team has ${homeStarters} starters — maximum is 11.`); setLineupSaving(false); return; }
    if (homeSubs > 14) { setLineupError(`Home team has ${homeSubs} substitutes — maximum is 14.`); setLineupSaving(false); return; }
    if (awayStarters > 11) { setLineupError(`Away team has ${awayStarters} starters — maximum is 11.`); setLineupSaving(false); return; }
    if (awaySubs > 14) { setLineupError(`Away team has ${awaySubs} substitutes — maximum is 14.`); setLineupSaving(false); return; }

    try {
      const payload = Object.entries(lineupPlayerState)
        .filter(([, s]) => s.checked)
        .map(([playerId, s]) => ({
          playerId,
          side: homePlayers.some((p) => p.id === playerId) ? 'home' : 'away',
          role: s.role,
          position: s.position,
        }));

      const res = await fetch(`/api/fixtures/${fixture.id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineups: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Server error ${res.status}`);
      }
      setLineupSaved(true);
      fetchFixture();
      setTimeout(() => setLineupSaved(false), 2500);
    } catch (err: unknown) {
      setLineupError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLineupSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading fixture…</div>
      </div>
    );
  }

  if (error || !fixture) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
        <p className="text-red-400 text-sm mb-4">{error ?? 'Fixture not found.'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin/fixtures')}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back to Fixtures
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-slate-500 text-sm mb-1">
            <button type="button" onClick={() => router.push('/admin/fixtures')} className="hover:text-slate-300 transition-colors">
              Admin / Fixtures
            </button>
            {' / '}
            <span className="text-slate-400">Manage</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {fixture.homeTeam}
            <span className="text-slate-500 font-normal mx-2">vs</span>
            {fixture.awayTeam}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
            {fixture.matchday && (
              <span className="text-xs text-slate-500">{fixture.matchday}</span>
            )}
            {fixture.tournamentStage && (
              <span className="text-xs text-slate-500">{fixture.tournamentStage}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              fixture.status === 'ongoing'
                ? 'bg-green-900 text-green-400'
                : fixture.status === 'complete'
                ? 'bg-slate-800 text-slate-400'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {fixture.status === 'ongoing' ? 'LIVE' : fixture.status === 'complete' ? 'FT' : 'SCHEDULED'}
            </span>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-3 sm:items-end items-center flex-shrink-0">
          {(fixture.scoreAt90Home != null || fixture.scoreAt90Away != null) && (
            <div className="bg-[#111111] border border-slate-800 rounded-xl px-4 sm:px-5 py-3 text-center">
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {fixture.scoreAt90Home ?? 0} – {fixture.scoreAt90Away ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                HT {fixture.scoreAtHalfTimeHome ?? 0} – {fixture.scoreAtHalfTimeAway ?? 0}
              </p>
            </div>
          )}
          {fixture.status === 'complete' && (
            <a
              href={`/api/fixtures/${fixture.id}/report`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#00E676] px-4 py-2 text-xs font-semibold text-black hover:bg-[#8cff91] transition-colors whitespace-nowrap"
            >
              Download Report
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-[#111111] border border-slate-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        <TabButton label="Match Info" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
        <TabButton label="Home Lineup" active={activeTab === 'lineup_home'} onClick={() => setActiveTab('lineup_home')} />
        <TabButton label="Away Lineup" active={activeTab === 'lineup_away'} onClick={() => setActiveTab('lineup_away')} />
        <TabButton label={`Events (${fixture.events.length})`} active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <MatchInfoTab fixture={fixture} onSaved={fetchFixture} />
      )}
      {activeTab === 'lineup_home' && (
        <LineupSideTab
          side="home"
          teamName={fixture.homeTeam}
          players={homePlayers}
          playerState={lineupPlayerState}
          onAdd={addLineupPlayer}
          onRemove={removeLineupPlayer}
          onUpdate={updateLineupPlayerField}
          onSave={handleLineupSave}
          saving={lineupSaving}
          error={lineupError}
          saved={lineupSaved}
        />
      )}
      {activeTab === 'lineup_away' && (
        <LineupSideTab
          side="away"
          teamName={fixture.awayTeam}
          players={awayPlayers}
          playerState={lineupPlayerState}
          onAdd={addLineupPlayer}
          onRemove={removeLineupPlayer}
          onUpdate={updateLineupPlayerField}
          onSave={handleLineupSave}
          saving={lineupSaving}
          error={lineupError}
          saved={lineupSaved}
        />
      )}
      {activeTab === 'events' && (
        <EventsTab fixture={fixture} onRefresh={fetchFixture} />
      )}
    </div>
  );
}
