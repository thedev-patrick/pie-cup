'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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

interface EditState {
  playerId: string;
  fullName: string;
  jerseyNumber: string;
  position: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Add player form
  const [addFullName, setAddFullName] = useState('');
  const [addJersey, setAddJersey] = useState('');
  const [addPosition, setAddPosition] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Edit player state — one row open at a time
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load team');
      }
      const data: Team = await res.json();
      // Sort players by jersey number client-side
      data.players.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
      setTeam(data);
    } catch (err: any) {
      setFetchError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const jersey = parseInt(addJersey, 10);
    if (!addFullName.trim()) {
      setAddError('Full name is required');
      return;
    }
    if (isNaN(jersey)) {
      setAddError('Jersey number must be a valid number');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addFullName.trim(),
          jerseyNumber: jersey,
          position: addPosition.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? 'Failed to add player');
        return;
      }
      setAddFullName('');
      setAddJersey('');
      setAddPosition('');
      await fetchTeam();
    } catch {
      setAddError('Network error');
    } finally {
      setAdding(false);
    }
  }

  function openEdit(player: Player) {
    setEditError(null);
    setEditState({
      playerId: player.id,
      fullName: player.fullName,
      jerseyNumber: String(player.jerseyNumber),
      position: player.position ?? '',
    });
  }

  function cancelEdit() {
    setEditState(null);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editState) return;
    const jersey = parseInt(editState.jerseyNumber, 10);
    if (!editState.fullName.trim()) {
      setEditError('Full name is required');
      return;
    }
    if (isNaN(jersey)) {
      setEditError('Jersey number must be a valid number');
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/players/${editState.playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editState.fullName.trim(),
          jerseyNumber: jersey,
          position: editState.position.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? 'Failed to update player');
        return;
      }
      setEditState(null);
      await fetchTeam();
    } catch {
      setEditError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlayer(playerId: string) {
    if (!confirm('Remove this player from the roster?')) return;
    setDeletingId(playerId);
    try {
      const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed to delete player');
        return;
      }
      if (editState?.playerId === playerId) setEditState(null);
      await fetchTeam();
    } catch {
      alert('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-slate-400 text-sm py-20 text-center">Loading team...</div>
    );
  }

  if (fetchError || !team) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/teams" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Teams
        </Link>
        <div className="mt-6 bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
          {fetchError ?? 'Team not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/admin/teams"
        className="inline-block text-slate-400 hover:text-white text-sm transition-colors mb-6"
      >
        ← Teams
      </Link>

      {/* Team heading */}
      <div className="mb-8 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{team.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {team.shortName && (
              <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs mr-2">
                {team.shortName}
              </span>
            )}
            {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
          </p>
        </div>
      </div>

      {/* Add Player form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Add Player</h2>
        <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="addFullName">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="addFullName"
              type="text"
              value={addFullName}
              onChange={(e) => setAddFullName(e.target.value)}
              placeholder="e.g. João Silva"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <div className="w-full sm:w-24">
            <label className="block text-xs text-slate-400 mb-1" htmlFor="addJersey">
              Jersey # <span className="text-red-400">*</span>
            </label>
            <input
              id="addJersey"
              type="number"
              min={1}
              max={99}
              value={addJersey}
              onChange={(e) => setAddJersey(e.target.value)}
              placeholder="10"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="addPosition">
              Position
            </label>
            <input
              id="addPosition"
              type="text"
              value={addPosition}
              onChange={(e) => setAddPosition(e.target.value)}
              placeholder="e.g. Midfielder"
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
                Add
              </span>
            )}
          </button>
        </form>
        {addError && (
          <p className="mt-3 text-sm text-red-400">{addError}</p>
        )}
      </div>

      {/* Players table */}
      {team.players.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
          <p className="text-slate-400 text-sm">No players yet. Add one above.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3 w-16">
                  #
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-3 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">
                  Position
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {team.players.map((player) => (
                <>
                  {/* Main row */}
                  <tr
                    key={player.id}
                    className={`group transition-colors ${editState?.playerId === player.id ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-mono font-semibold text-xs">
                        {player.jerseyNumber}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white font-medium">{player.fullName}</td>
                    <td className="px-3 py-3 text-slate-400 hidden sm:table-cell">
                      {player.position ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {editState?.playerId === player.id ? (
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => openEdit(player)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                            title="Edit player"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          disabled={deletingId === player.id}
                          className="text-xs bg-red-950 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                          title="Delete player"
                        >
                          {deletingId === player.id ? '...' : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editState?.playerId === player.id && (
                    <tr key={`${player.id}-edit`} className="bg-slate-800/60">
                      <td colSpan={4} className="px-5 py-4">
                        <form onSubmit={handleSaveEdit}>
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_auto] gap-3 items-end">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={editState.fullName}
                                onChange={(e) =>
                                  setEditState((s) => s && { ...s, fullName: e.target.value })
                                }
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              />
                            </div>
                            <div className="w-full sm:w-24">
                              <label className="block text-xs text-slate-400 mb-1">Jersey #</label>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={editState.jerseyNumber}
                                onChange={(e) =>
                                  setEditState((s) => s && { ...s, jerseyNumber: e.target.value })
                                }
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Position</label>
                              <input
                                type="text"
                                value={editState.position}
                                onChange={(e) =>
                                  setEditState((s) => s && { ...s, position: e.target.value })
                                }
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="shrink-0 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                              {saving ? 'Saving...' : (
                                <span className="flex items-center gap-1.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                  </svg>
                                  Save
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                          {editError && (
                            <p className="mt-2 text-sm text-red-400">{editError}</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
