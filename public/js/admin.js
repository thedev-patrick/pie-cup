const form = document.getElementById('fixture-form');
const fixtureList = document.getElementById('fixture-list');
const resetButton = document.getElementById('reset-button');

function inputValue(id) {
  return document.getElementById(id).value.trim();
}

function populateForm(fixture) {
  document.getElementById('fixture-id').value = fixture.id;
  document.getElementById('homeTeam').value = fixture.homeTeam || '';
  document.getElementById('awayTeam').value = fixture.awayTeam || '';
  document.getElementById('date').value = fixture.date || '';
  document.getElementById('kickOffTime').value = fixture.kickOffTime || '';
  document.getElementById('venue').value = fixture.venue || '';
  document.getElementById('matchday').value = fixture.matchday || '';
  document.getElementById('scoreAtHalfTime').value = fixture.scoreAtHalfTime ? `${fixture.scoreAtHalfTime.home}-${fixture.scoreAtHalfTime.away}` : '';
  document.getElementById('scoreAt90Minutes').value = fixture.scoreAt90Minutes ? `${fixture.scoreAt90Minutes.home}-${fixture.scoreAt90Minutes.away}` : '';
  document.getElementById('extraTimePlayed').value = fixture.extraTimePlayed || 'NO';
  document.getElementById('scoreAfterExtraTime').value = fixture.scoreAfterExtraTime || '';
  document.getElementById('homeTeamDetails').value = fixture.homeTeamDetails || '';
  document.getElementById('awayTeamDetails').value = fixture.awayTeamDetails || '';
  document.getElementById('homeTeamSubstitutes').value = (fixture.homeTeamSubstitutes || []).join(', ');
  document.getElementById('awayTeamSubstitutes').value = (fixture.awayTeamSubstitutes || []).join(', ');
  document.getElementById('disciplineNotes').value = fixture.discipline?.notes || '';
  document.getElementById('technicalCommittee').value = (fixture.technicalCommittee || []).join('\n');
  document.getElementById('upcomingFixtures').value = (fixture.upcomingFixtures || []).join('\n');
  document.getElementById('observations').value = fixture.observations || '';
  document.getElementById('manOfTheMatch').value = fixture.manOfTheMatch || '';
  document.getElementById('tournamentStage').value = fixture.tournamentStage || '';
  document.getElementById('progressionNotes').value = fixture.progressionNotes || '';
}

function clearForm() {
  form.reset();
  document.getElementById('fixture-id').value = '';
}

function formatScore(value) {
  if (!value) return null;
  const parts = value.split('-').map((part) => parseInt(part.trim(), 10));
  return parts.length === 2 && parts.every(Number.isFinite)
    ? { home: parts[0], away: parts[1] }
    : null;
}

function fixturePayload() {
  return {
    homeTeam: inputValue('homeTeam'),
    awayTeam: inputValue('awayTeam'),
    date: inputValue('date'),
    kickOffTime: inputValue('kickOffTime'),
    venue: inputValue('venue'),
    matchday: inputValue('matchday'),
    scoreAtHalfTime: formatScore(inputValue('scoreAtHalfTime')),
    scoreAt90Minutes: formatScore(inputValue('scoreAt90Minutes')),
    extraTimePlayed: inputValue('extraTimePlayed'),
    scoreAfterExtraTime: inputValue('scoreAfterExtraTime') || null,
    homeTeamDetails: inputValue('homeTeamDetails'),
    awayTeamDetails: inputValue('awayTeamDetails'),
    homeTeamSubstitutes: inputValue('homeTeamSubstitutes').split(',').map((item) => item.trim()).filter(Boolean),
    awayTeamSubstitutes: inputValue('awayTeamSubstitutes').split(',').map((item) => item.trim()).filter(Boolean),
    discipline: { notes: inputValue('disciplineNotes') },
    technicalCommittee: inputValue('technicalCommittee').split('\n').map((item) => item.trim()).filter(Boolean),
    upcomingFixtures: inputValue('upcomingFixtures').split('\n').map((item) => item.trim()).filter(Boolean),
    observations: inputValue('observations'),
    manOfTheMatch: inputValue('manOfTheMatch'),
    tournamentStage: inputValue('tournamentStage'),
    progressionNotes: inputValue('progressionNotes'),
    status: 'scheduled'
  };
}

async function fetchFixtures() {
  const res = await fetch('/api/fixtures');
  return res.json();
}

async function saveFixture(fixture) {
  const id = inputValue('fixture-id');
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/fixtures/${id}` : '/api/fixtures';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fixture),
  });
  return res.json();
}

async function loadFixtures() {
  const fixtures = await fetchFixtures();
  fixtureList.innerHTML = fixtures.length
    ? fixtures.map((fixture) => `
      <div class="fixture-card">
        <h3>${fixture.homeTeam} v ${fixture.awayTeam}</h3>
        <p>${fixture.date} • ${fixture.venue}</p>
        <button data-id="${fixture.id}" class="edit-button">Edit</button>
      </div>
    `).join('')
    : '<p>No fixtures created yet.</p>';

  document.querySelectorAll('.edit-button').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const id = event.currentTarget.dataset.id;
      const res = await fetch(`/api/fixtures/${id}`);
      const fixture = await res.json();
      populateForm(fixture);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = fixturePayload();
  const saved = await saveFixture(payload);
  clearForm();
  await loadFixtures();
  alert(`Fixture ${saved.homeTeam} v ${saved.awayTeam} saved.`);
});

resetButton.addEventListener('click', clearForm);

loadFixtures();
