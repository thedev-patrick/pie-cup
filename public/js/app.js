async function fetchFixtures() {
  const res = await fetch('/api/fixtures');
  return res.json();
}

async function fetchSummary() {
  const res = await fetch('/api/summary');
  return res.json();
}

function parseScore(scoreText) {
  if (!scoreText) return null;
  const [home, away] = scoreText.split('-').map((value) => parseInt(value.trim(), 10));
  return Number.isFinite(home) && Number.isFinite(away) ? { home, away } : null;
}

function createCard(title, content) {
  return `<div class="card"><h3>${title}</h3>${content}</div>`;
}

function renderFixtures(fixtures) {
  const upcoming = fixtures.filter((f) => f.status !== 'complete');
  const complete = fixtures.filter((f) => f.status === 'complete').slice(-5).reverse();
  const ongoing = fixtures.find((f) => f.status === 'ongoing') || upcoming[0] || null;

  const upcomingList = document.getElementById('upcoming-list');
  upcomingList.innerHTML = upcoming.length
    ? upcoming.map((fixture) => createCard(
        `${fixture.homeTeam} v ${fixture.awayTeam}`,
        `<p><strong>Date:</strong> ${fixture.date}</p><p><strong>Kick Off:</strong> ${fixture.kickOffTime}</p><p><strong>Venue:</strong> ${fixture.venue}</p>`
      )).join('')
    : '<p>No upcoming fixtures.</p>';

  const resultsList = document.getElementById('past-results');
  resultsList.innerHTML = complete.length
    ? complete.map((fixture) => createCard(
        `${fixture.homeTeam} ${fixture.scoreAt90Minutes?.home || 0} - ${fixture.scoreAt90Minutes?.away || 0} ${fixture.awayTeam}`,
        `<p><strong>Date:</strong> ${fixture.date}</p><p><strong>Venue:</strong> ${fixture.venue}</p><p><strong>Man of the Match:</strong> ${fixture.manOfTheMatch || 'TBD'}</p>`
      )).join('')
    : '<p>No completed results yet.</p>';

  const ongoingMatch = document.getElementById('ongoing-match');
  ongoingMatch.innerHTML = ongoing
    ? `<h3>${ongoing.homeTeam} v ${ongoing.awayTeam}</h3>
       <p><strong>Date:</strong> ${ongoing.date}</p>
       <p><strong>Status:</strong> ${ongoing.status}</p>
       <p><strong>Half-time:</strong> ${ongoing.scoreAtHalfTime?.home || 0} - ${ongoing.scoreAtHalfTime?.away || 0}</p>
       <p><strong>90 min:</strong> ${ongoing.scoreAt90Minutes?.home || 0} - ${ongoing.scoreAt90Minutes?.away || 0}</p>
       <p><strong>Man of the Match:</strong> ${ongoing.manOfTheMatch || 'TBD'}</p>`
    : '<p>No ongoing or recent match available.</p>';

  const progression = document.getElementById('progression');
  progression.innerHTML = fixtures.length
    ? fixtures.map((fixture) => `<div class="progression-card"><strong>${fixture.homeTeam} v ${fixture.awayTeam}</strong><p>${fixture.tournamentStage || 'Stage TBD'}</p><p>${fixture.progressionNotes || ''}</p></div>`).join('')
    : '<p>No progression data available.</p>';
}

function renderSummary(summary) {
  const renderList = (items, selector, valueKey) => {
    const container = document.getElementById(selector);
    container.innerHTML = items.length
      ? items.map((item) => `<li>${item.name} (${item.team}) — ${item[valueKey]}</li>`).join('')
      : '<li>No data yet.</li>';
  };

  renderList(summary.topScorers, 'top-scorers', 'goals');
  renderList(summary.topAssists, 'top-assists', 'assists');
  renderList(summary.mostYellowCards, 'top-yellow', 'yellowCards');
}

async function init() {
  const fixtures = await fetchFixtures();
  renderFixtures(fixtures);
  const summary = await fetchSummary();
  renderSummary(summary);
}

init();
