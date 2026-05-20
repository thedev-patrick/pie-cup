'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const selectCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors';
const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors';
const labelCls = 'block text-sm text-slate-400 mb-1.5';

export default function NewFixturePage() {
  const router = useRouter();

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; season: string | null }[]>([]);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeams).catch(() => {});
    fetch('/api/tournaments').then((r) => r.json()).then(setTournaments).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    homeTeam: '',
    awayTeam: '',
    tournamentId: '',
    date: '',
    kickOffTime: '',
    venue: '',
    matchday: '',
    tournamentStage: '',
    status: 'scheduled',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tournamentId: form.tournamentId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Server error ${res.status}`);
      }
      const created = await res.json();
      router.push(`/admin/fixtures/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">Admin / Fixtures</p>
        <h1 className="text-2xl font-bold text-white">New Fixture</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">

        {/* Tournament */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tournament</h2>
          <div>
            <label className={labelCls}>
              Tournament <span className="text-red-500">*</span>
            </label>
            {tournaments.length === 0 ? (
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-400">
                No tournaments yet.{' '}
                <button
                  type="button"
                  onClick={() => router.push('/admin/tournaments')}
                  className="underline hover:text-amber-300"
                >
                  Create one first
                </button>
              </div>
            ) : (
              <select
                name="tournamentId"
                value={form.tournamentId}
                onChange={handleChange}
                required
                title="Tournament"
                className={selectCls}
              >
                <option value="">Select tournament…</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.season ? ` — ${t.season}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Teams */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Home Team <span className="text-red-500">*</span>
              </label>
              <select
                name="homeTeam"
                value={form.homeTeam}
                onChange={handleChange}
                required
                title="Home Team"
                className={selectCls}
              >
                <option value="">Select home team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Away Team <span className="text-red-500">*</span>
              </label>
              <select
                name="awayTeam"
                value={form.awayTeam}
                onChange={handleChange}
                required
                title="Away Team"
                className={selectCls}
              >
                <option value="">Select away team…</option>
                {teams.filter((t) => t.name !== form.homeTeam).map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className={`${inputCls} [color-scheme:dark]`}
              />
            </div>
            <div>
              <label className={labelCls}>
                Kick-off Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="kickOffTime"
                value={form.kickOffTime}
                onChange={handleChange}
                required
                title="Kick-off Time"
                className={`${inputCls} [color-scheme:dark]`}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>
                Venue <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                required
                placeholder="e.g. Emirates Stadium"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Matchday</label>
                <input
                  type="text"
                  name="matchday"
                  value={form.matchday}
                  onChange={handleChange}
                  placeholder="e.g. MD 12"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tournament Stage</label>
                <input
                  type="text"
                  name="tournamentStage"
                  value={form.tournamentStage}
                  onChange={handleChange}
                  placeholder="e.g. Quarter Final"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={labelCls}>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            title="Status"
            className={selectCls}
          >
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/fixtures')}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Fixture'}
          </button>
        </div>
      </form>
    </div>
  );
}
