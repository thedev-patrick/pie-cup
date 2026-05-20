'use client';

import { useEffect, useState, type FormEvent } from 'react';

type FixtureForm = {
  id?: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  kickOffTime: string;
  venue: string;
  matchday: string;
  status: string;
  scoreAtHalfTime: string;
  scoreAt90Minutes: string;
  extraTimePlayed: string;
  scoreAfterExtraTimeHome: string;
  scoreAfterExtraTimeAway: string;
  homeTeamDetails: string;
  awayTeamDetails: string;
  homeTeamSubstitutes: string;
  awayTeamSubstitutes: string;
  disciplineNotes: string;
  technicalCommittee: string;
  upcomingFixtures: string;
  observations: string;
  manOfTheMatch: string;
  tournamentStage: string;
  progressionNotes: string;
  statsJson: string;
};

type FixtureSummary = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  status: string;
};

const initialForm: FixtureForm = {
  homeTeam: '',
  awayTeam: '',
  date: '',
  kickOffTime: '',
  venue: '',
  matchday: '',
  status: 'scheduled',
  scoreAtHalfTime: '',
  scoreAt90Minutes: '',
  extraTimePlayed: 'NO',
  scoreAfterExtraTimeHome: '',
  scoreAfterExtraTimeAway: '',
  homeTeamDetails: '',
  awayTeamDetails: '',
  homeTeamSubstitutes: '',
  awayTeamSubstitutes: '',
  disciplineNotes: '',
  technicalCommittee: '',
  upcomingFixtures: '',
  observations: '',
  manOfTheMatch: '',
  tournamentStage: '',
  progressionNotes: '',
  statsJson: '[{"name":"Player Name","team":"Home Team","goals":0,"assists":0,"yellowCards":0,"redCards":0}]',
};

function parseJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminDashboard() {
  const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
  const [form, setForm] = useState<FixtureForm>(initialForm);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFixtures();
  }, []);

  async function loadFixtures() {
    const response = await fetch('/api/fixtures');
    const data = await response.json();
    setFixtures(data);
  }

  function updateField(field: keyof FixtureForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      date: form.date,
      kickOffTime: form.kickOffTime,
      venue: form.venue,
      matchday: form.matchday,
      status: form.status,
      scoreAtHalfTime: form.scoreAtHalfTime,
      scoreAt90Minutes: form.scoreAt90Minutes,
      extraTimePlayed: form.extraTimePlayed,
      scoreAfterExtraTimeHome: form.scoreAfterExtraTimeHome,
      scoreAfterExtraTimeAway: form.scoreAfterExtraTimeAway,
      homeTeamDetails: form.homeTeamDetails,
      awayTeamDetails: form.awayTeamDetails,
      homeTeamSubstitutes: form.homeTeamSubstitutes.split(',').map((item) => item.trim()).filter(Boolean),
      awayTeamSubstitutes: form.awayTeamSubstitutes.split(',').map((item) => item.trim()).filter(Boolean),
      disciplineNotes: form.disciplineNotes,
      technicalCommittee: form.technicalCommittee.split('\n').map((item) => item.trim()).filter(Boolean),
      upcomingFixtures: form.upcomingFixtures.split('\n').map((item) => item.trim()).filter(Boolean),
      observations: form.observations,
      manOfTheMatch: form.manOfTheMatch,
      tournamentStage: form.tournamentStage,
      progressionNotes: form.progressionNotes,
      stats: parseJson(form.statsJson),
    };

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/fixtures/${form.id}` : '/api/fixtures';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setMessage('Fixture saved successfully.');
      setForm(initialForm);
      loadFixtures();
    } else {
      const error = await response.json();
      setMessage(`Unable to save fixture: ${error.message || 'unknown error'}`);
    }
  }

  function editFixture(fixture: FixtureSummary) {
    fetch(`/api/fixtures/${fixture.id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          id: data.id,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          date: data.date.slice(0, 10),
          kickOffTime: data.kickOffTime,
          venue: data.venue,
          matchday: data.matchday || '',
          status: data.status,
          scoreAtHalfTime: `${data.scoreAtHalfTimeHome ?? ''}-${data.scoreAtHalfTimeAway ?? ''}`,
          scoreAt90Minutes: `${data.scoreAt90Home ?? ''}-${data.scoreAt90Away ?? ''}`,
          extraTimePlayed: data.extraTimePlayed ? 'YES' : 'NO',
          scoreAfterExtraTimeHome: data.scoreAfterExtraTimeHome?.toString() || '',
          scoreAfterExtraTimeAway: data.scoreAfterExtraTimeAway?.toString() || '',
          homeTeamDetails: data.homeTeamDetails || '',
          awayTeamDetails: data.awayTeamDetails || '',
          homeTeamSubstitutes: data.homeTeamSubstitutes.join(', '),
          awayTeamSubstitutes: data.awayTeamSubstitutes.join(', '),
          disciplineNotes: data.disciplineNotes || '',
          technicalCommittee: data.technicalCommittee.join('\n'),
          upcomingFixtures: data.upcomingFixtures.join('\n'),
          observations: data.observations || '',
          manOfTheMatch: data.manOfTheMatch || '',
          tournamentStage: data.tournamentStage || '',
          progressionNotes: data.progressionNotes || '',
          statsJson: JSON.stringify(data.stats || [], null, 2),
        });
      });
  }

  function resetForm() {
    setForm(initialForm);
    setMessage('');
  }

  return (
    <div>
      <div className="form-header">
        <button className="button-primary" type="submit" form="fixture-form">Save Fixture</button>
        <button className="button-secondary" type="button" onClick={resetForm}>Reset</button>
      </div>
      {message && <p>{message}</p>}
      <form id="fixture-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Home Team
            <input value={form.homeTeam} onChange={(event) => updateField('homeTeam', event.target.value)} required />
          </label>
          <label>
            Away Team
            <input value={form.awayTeam} onChange={(event) => updateField('awayTeam', event.target.value)} required />
          </label>
          <label>
            Date
            <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} required />
          </label>
          <label>
            Kick Off Time
            <input type="time" value={form.kickOffTime} onChange={(event) => updateField('kickOffTime', event.target.value)} required />
          </label>
          <label>
            Venue
            <input value={form.venue} onChange={(event) => updateField('venue', event.target.value)} required />
          </label>
          <label>
            Matchday
            <input value={form.matchday} onChange={(event) => updateField('matchday', event.target.value)} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label>
            Half-time score
            <input value={form.scoreAtHalfTime} onChange={(event) => updateField('scoreAtHalfTime', event.target.value)} placeholder="1-0" />
          </label>
          <label>
            90-minute score
            <input value={form.scoreAt90Minutes} onChange={(event) => updateField('scoreAt90Minutes', event.target.value)} placeholder="2-1" />
          </label>
          <label>
            Extra time played
            <select value={form.extraTimePlayed} onChange={(event) => updateField('extraTimePlayed', event.target.value)}>
              <option value="NO">NO</option>
              <option value="YES">YES</option>
            </select>
          </label>
          <label>
            Extra time score (home)
            <input value={form.scoreAfterExtraTimeHome} onChange={(event) => updateField('scoreAfterExtraTimeHome', event.target.value)} placeholder="1" />
          </label>
          <label>
            Extra time score (away)
            <input value={form.scoreAfterExtraTimeAway} onChange={(event) => updateField('scoreAfterExtraTimeAway', event.target.value)} placeholder="1" />
          </label>
        </div>

        <label>
          Home team details
          <textarea value={form.homeTeamDetails} onChange={(event) => updateField('homeTeamDetails', event.target.value)} />
        </label>
        <label>
          Away team details
          <textarea value={form.awayTeamDetails} onChange={(event) => updateField('awayTeamDetails', event.target.value)} />
        </label>
        <label>
          Home substitutes (comma separated)
          <input value={form.homeTeamSubstitutes} onChange={(event) => updateField('homeTeamSubstitutes', event.target.value)} />
        </label>
        <label>
          Away substitutes (comma separated)
          <input value={form.awayTeamSubstitutes} onChange={(event) => updateField('awayTeamSubstitutes', event.target.value)} />
        </label>
        <label>
          Discipline notes
          <textarea value={form.disciplineNotes} onChange={(event) => updateField('disciplineNotes', event.target.value)} />
        </label>
        <label>
          Technical Committee Members (one per line)
          <textarea value={form.technicalCommittee} onChange={(event) => updateField('technicalCommittee', event.target.value)} />
        </label>
        <label>
          Upcoming fixtures (one per line)
          <textarea value={form.upcomingFixtures} onChange={(event) => updateField('upcomingFixtures', event.target.value)} />
        </label>
        <label>
          Observations
          <textarea value={form.observations} onChange={(event) => updateField('observations', event.target.value)} />
        </label>
        <label>
          Man of the Match
          <input value={form.manOfTheMatch} onChange={(event) => updateField('manOfTheMatch', event.target.value)} />
        </label>
        <label>
          Tournament stage
          <input value={form.tournamentStage} onChange={(event) => updateField('tournamentStage', event.target.value)} />
        </label>
        <label>
          Progression notes
          <textarea value={form.progressionNotes} onChange={(event) => updateField('progressionNotes', event.target.value)} />
        </label>
        <label>
          Player stats JSON
          <textarea value={form.statsJson} onChange={(event) => updateField('statsJson', event.target.value)} />
        </label>
      </form>

      <section className="section-card">
        <h2>Existing Fixtures</h2>
        <div className="fixture-grid">
          {fixtures.length > 0 ? (
            fixtures.map((fixture) => (
              <div key={fixture.id} className="card-item">
                <h3>{fixture.homeTeam} v {fixture.awayTeam}</h3>
                <p>{fixture.date} • {fixture.venue}</p>
                <p>Status: {fixture.status}</p>
                <button className="button-secondary" type="button" onClick={() => editFixture(fixture)}>Edit</button>
              </div>
            ))
          ) : (
            <p>No fixtures created yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
