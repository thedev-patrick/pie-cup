const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;
const dataPath = path.join(__dirname, 'data', 'fixtures.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function readFixtures() {
  const content = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(content);
}

function writeFixtures(fixtures) {
  fs.writeFileSync(dataPath, JSON.stringify(fixtures, null, 2), 'utf-8');
}

app.get('/api/fixtures', (req, res) => {
  const fixtures = readFixtures();
  res.json(fixtures);
});

app.get('/api/fixtures/:id', (req, res) => {
  const fixtures = readFixtures();
  const fixture = fixtures.find((item) => item.id === req.params.id);
  if (!fixture) {
    return res.status(404).json({ message: 'Fixture not found' });
  }
  res.json(fixture);
});

app.post('/api/fixtures', (req, res) => {
  const fixtures = readFixtures();
  const newFixture = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'scheduled',
    ...req.body,
  };
  fixtures.push(newFixture);
  writeFixtures(fixtures);
  res.status(201).json(newFixture);
});

app.put('/api/fixtures/:id', (req, res) => {
  const fixtures = readFixtures();
  const index = fixtures.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Fixture not found' });
  }
  fixtures[index] = {
    ...fixtures[index],
    ...req.body,
    id: fixtures[index].id,
    updatedAt: new Date().toISOString(),
  };
  writeFixtures(fixtures);
  res.json(fixtures[index]);
});

app.get('/api/summary', (req, res) => {
  const fixtures = readFixtures();
  const players = {};

  fixtures.forEach((fixture) => {
    fixture.stats?.players?.forEach((player) => {
      const key = `${player.team}||${player.name}`;
      if (!players[key]) {
        players[key] = {
          team: player.team,
          name: player.name,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        };
      }
      players[key].goals += player.goals || 0;
      players[key].assists += player.assists || 0;
      players[key].yellowCards += player.yellowCards || 0;
      players[key].redCards += player.redCards || 0;
    });
  });

  const summary = {
    topScorers: Object.values(players).sort((a, b) => b.goals - a.goals).slice(0, 10),
    topAssists: Object.values(players).sort((a, b) => b.assists - a.assists).slice(0, 10),
    mostYellowCards: Object.values(players).sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 10),
    mostRedCards: Object.values(players).sort((a, b) => b.redCards - a.redCards).slice(0, 10),
    fixtureCount: fixtures.length,
  };
  res.json(summary);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
