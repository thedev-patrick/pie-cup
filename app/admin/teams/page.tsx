'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Player {
  id: string;
  fullName: string;
  jerseyNumber: number;
  position: string | null;
}

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  players: Player[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add team form state
  const [newName, setNewName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchTeams() {
    try {
      setError(null);
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to load teams');
      const data = await res.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Team name is required');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          shortName: newShortName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? 'Failed to create team');
        return;
      }
      setNewName('');
      setNewShortName('');
      await fetchTeams();
    } catch {
      setAddError('Network error');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(teamId: string) {
    if (!confirm('Delete this team and all its players?')) return;
    setDeletingId(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed to delete team');
        return;
      }
      await fetchTeams();
    } catch {
      alert('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Teams &amp; Players</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage tournament teams and their player rosters.
        </p>
      </div>

      {/* Add Team form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Add Team</h2>
        <form onSubmit={handleAddTeam} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1" htmlFor="teamName">
              Team Name <span className="text-red-400">*</span>
            </label>
            <input
              id="teamName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Red Dragons"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-xs text-slate-400 mb-1" htmlFor="shortName">
              Short Name
            </label>
            <input
              id="shortName"
              type="text"
              value={newShortName}
              onChange={(e) => setNewShortName(e.target.value)}
              placeholder="e.g. RDR"
              maxLength={10}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {adding ? 'Adding...' : (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Team
              </span>
            )}
          </button>
        </form>
        {addError && (
          <p className="mt-3 text-sm text-red-400">{addError}</p>
        )}
      </div>

      {/* Teams list */}
      {loading && (
        <div className="text-slate-400 text-sm py-12 text-center">Loading teams...</div>
      )}

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && teams.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
          <p className="text-slate-400 text-sm">No teams yet. Add one above.</p>
        </div>
      )}

      {!loading && !error && teams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3"
            >
              {/* Team info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-white font-semibold text-base leading-tight">{team.name}</h3>
                  {team.shortName && (
                    <span className="inline-block mt-1 text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {team.shortName}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold text-white">{team.players.length}</span>
                  <p className="text-xs text-slate-400">
                    {team.players.length === 1 ? 'player' : 'players'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <Link
                  href={`/admin/teams/${team.id}`}
                  className="flex-1 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  title="Manage players"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(team.id)}
                  disabled={deletingId === team.id}
                  className="text-sm bg-red-950 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                  title="Delete team"
                >
                  {deletingId === team.id ? 'Deleting...' : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
