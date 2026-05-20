import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import PDFDocument from 'pdfkit';

const REPORT_DIR = path.join(process.cwd(), 'reports', 'fixtures');
const REPORT_TTL_MS = 24 * 60 * 60 * 1000;

interface MatchLineup {
  id: string;
  side: string;
  role: string;
  position: string | null;
  player: {
    fullName: string;
    jerseyNumber: number | null;
  };
}

interface MatchEvent {
  minute: number;
  type: string;
  side: string;
  playerId: string | null;
  playerName: string | null;
  assistName: string | null;
  playerOutName: string | null;
  description: string | null;
}

interface FixtureReport {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: Date;
  kickOffTime: string;
  venue: string;
  matchday: string | null;
  tournamentStage: string | null;
  status: string;
  scoreAtHalfTimeHome: number | null;
  scoreAtHalfTimeAway: number | null;
  scoreAt90Home: number | null;
  scoreAt90Away: number | null;
  extraTimePlayed: boolean;
  scoreAfterExtraTimeHome: number | null;
  scoreAfterExtraTimeAway: number | null;
  manOfTheMatch: string | null;
  tournamentId: string | null;
  stats?: Array<{
    name: string;
    team: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  }>;
  lineups: MatchLineup[];
  events: MatchEvent[];
}

export function getFixtureReportFilePath(fixtureId: string) {
  return path.join(REPORT_DIR, `match-report-${fixtureId}.pdf`);
}

export async function ensureReportDirectory() {
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });
}

export async function cleanupOldReports() {
  await ensureReportDirectory();

  const entries = await fsPromises.readdir(REPORT_DIR);
  const now = Date.now();

  await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(REPORT_DIR, entry);
      try {
        const stats = await fsPromises.stat(filePath);
        if (now - stats.mtimeMs > REPORT_TTL_MS) {
          await fsPromises.unlink(filePath);
        }
      } catch {
        // ignore issues deleting stale files
      }
    }),
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getEventLabel(event: MatchEvent) {
  if (event.description) {
    return event.description;
  }

  let actor = event.playerName || 'Unknown player';
  const assist = event.assistName ? `, assist: ${event.assistName}` : '';
  if (event.type === 'substitution') {
    const outName = event.playerOutName ? ` for ${event.playerOutName}` : '';
    return `Substitution: ${actor}${outName}${assist}`;
  }

  const mappedType = {
    goal: 'Goal',
    penalty: 'Penalty',
    own_goal: 'Own goal',
    yellow_card: 'Yellow card',
    red_card: 'Red card',
    substitution: 'Substitution',
    foul: 'Foul',
    free_kick: 'Free kick',
    corner: 'Corner',
    goal_kick: 'Goal kick',
  }[event.type] ?? event.type;

  return `${mappedType}: ${actor}${assist}`;
}

export async function generateMatchReportPdf(fixture: FixtureReport) {
  await ensureReportDirectory();
  const reportPath = getFixtureReportFilePath(fixture.id);

  const doc = new PDFDocument({ size: 'A4', margin: 48, autoFirstPage: true });
  const stream = fs.createWriteStream(reportPath);
  doc.pipe(stream);

  doc.fontSize(18).text('Match Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#999999').text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).fillColor('#ffffff').text(`${fixture.homeTeam} vs ${fixture.awayTeam}`);
  doc
    .fontSize(10)
    .fillColor('#cccccc')
    .text(`Date: ${formatDate(new Date(fixture.date))}`)
    .text(`Kick-off: ${fixture.kickOffTime}`)
    .text(`Venue: ${fixture.venue}`)
    .text(`Status: ${fixture.status}`)
    .text(`Matchday: ${fixture.matchday ?? 'N/A'}`)
    .text(`Stage: ${fixture.tournamentStage ?? 'N/A'}`)
    .moveDown();

  doc.fontSize(12).fillColor('#ffffff').text('Score Summary', { underline: true });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor('#cccccc');
  const scoreSummary = `${fixture.homeTeam} ${fixture.scoreAt90Home ?? 0} – ${fixture.scoreAt90Away ?? 0} ${fixture.awayTeam}`;
  doc.text(scoreSummary);
  doc.text(`Half time: ${fixture.scoreAtHalfTimeHome ?? 0} – ${fixture.scoreAtHalfTimeAway ?? 0}`);
  if (fixture.extraTimePlayed) {
    doc.text(`After extra time: ${fixture.scoreAfterExtraTimeHome ?? 0} – ${fixture.scoreAfterExtraTimeAway ?? 0}`);
  }
  if (fixture.manOfTheMatch) {
    doc.text(`Man of the match: ${fixture.manOfTheMatch}`);
  }

  const makeSection = (title: string, content: () => void) => {
    doc.moveDown();
    doc.fontSize(12).fillColor('#ffffff').text(title, { underline: true });
    doc.moveDown(0.3);
    content();
  };

  makeSection('Lineups', () => {
    const homeLineups = fixture.lineups.filter((item) => item.side === 'home');
    const awayLineups = fixture.lineups.filter((item) => item.side === 'away');

    const renderLineup = (sideName: string, lineups: MatchLineup[]) => {
      doc.fontSize(11).fillColor('#cccccc').text(`${sideName}:`, { continued: false });
      lineups.forEach((entry) => {
        const jersey = entry.player.jerseyNumber != null ? `#${entry.player.jerseyNumber}` : '';
        const position = entry.position ? ` (${entry.position})` : '';
        const role = entry.role === 'substitute' ? 'sub' : 'start';
        doc.text(`• ${entry.player.fullName} ${jersey}${position} [${role}]`);
      });
      doc.moveDown(0.2);
    };

    renderLineup(fixture.homeTeam, homeLineups);
    renderLineup(fixture.awayTeam, awayLineups);
  });

  makeSection('Match Events', () => {
    if (fixture.events.length === 0) {
      doc.fontSize(11).fillColor('#cccccc').text('No events recorded.');
      return;
    }

    fixture.events.forEach((event) => {
      const sideLabel = event.side === 'home' ? 'Home' : 'Away';
      const description = getEventLabel(event);
      doc.fontSize(11).fillColor('#cccccc').text(`• ${event.minute}' [${sideLabel}] ${description}`);
    });
  });

  if (fixture.stats && fixture.stats.length > 0) {
    const stats = fixture.stats;
    makeSection('Statistics', () => {
      stats.forEach((stat) => {
        doc.text(`• ${stat.team} – ${stat.name}: ${stat.goals} goals, ${stat.assists} assists, ${stat.yellowCards} yellow cards, ${stat.redCards} red cards`);
      });
    });
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return reportPath;
}
