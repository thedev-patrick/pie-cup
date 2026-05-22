import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import PDFDocument from 'pdfkit';

const REPORT_DIR = path.join(
  process.env.VERCEL ? '/tmp' : process.cwd(),
  'reports',
  'fixtures',
);
const REPORT_TTL_MS = 24 * 60 * 60 * 1000;
const PDFKIT_DATA_SOURCE = path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data');
const PDFKIT_DATA_TARGET = path.join(
  process.env.VERCEL ? '/tmp' : process.cwd(),
  'pdfkit-data',
);
const PDFKIT_STANDARD_FONT_FILES = [
  'Courier.afm', 'Courier-Bold.afm', 'Courier-Oblique.afm', 'Courier-BoldOblique.afm',
  'Helvetica.afm', 'Helvetica-Bold.afm', 'Helvetica-Oblique.afm', 'Helvetica-BoldOblique.afm',
  'Times-Roman.afm', 'Times-Bold.afm', 'Times-Italic.afm', 'Times-BoldItalic.afm',
  'Symbol.afm', 'ZapfDingbats.afm',
];

async function ensurePdfKitFontAssets() {
  if (!fs.existsSync(PDFKIT_DATA_SOURCE)) return;
  await fsPromises.mkdir(PDFKIT_DATA_TARGET, { recursive: true });
  await Promise.all(
    PDFKIT_STANDARD_FONT_FILES.map(async (fontFile) => {
      const src = path.join(PDFKIT_DATA_SOURCE, fontFile);
      const dst = path.join(PDFKIT_DATA_TARGET, fontFile);
      if (!fs.existsSync(dst)) await fsPromises.copyFile(src, dst);
    }),
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchLineup {
  id: string;
  side: string;
  role: string;
  position: string | null;
  player: { fullName: string; jerseyNumber: number | null };
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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
        if (now - stats.mtimeMs > REPORT_TTL_MS) await fsPromises.unlink(filePath);
      } catch { /* ignore */ }
    }),
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  goal: 'GOAL',
  penalty: 'PENALTY',
  own_goal: 'OWN GOAL',
  yellow_card: 'YELLOW',
  red_card: 'RED CARD',
  substitution: 'SUB',
  foul: 'FOUL',
  free_kick: 'FREE KICK',
  corner: 'CORNER',
  goal_kick: 'GOAL KICK',
  offside: 'OFFSIDE',
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  goal: '#1a5c1a',
  penalty: '#1a5c1a',
  own_goal: '#7a1a1a',
  yellow_card: '#7a6600',
  red_card: '#7a1a1a',
  substitution: '#1a3a7a',
  foul: '#555555',
  free_kick: '#555555',
  corner: '#555555',
  goal_kick: '#555555',
  offside: '#555555',
};

function buildEventDescription(event: MatchEvent): string {
  if (event.description) return event.description;
  const actor = event.playerName || 'Unknown';
  if (event.type === 'substitution') {
    const off = event.playerOutName ? ` for ${event.playerOutName}` : '';
    return `${actor}${off}`;
  }
  const assist = event.assistName ? ` (assist: ${event.assistName})` : '';
  return `${actor}${assist}`;
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

export async function generateMatchReportPdf(fixture: FixtureReport) {
  await ensureReportDirectory();
  await ensurePdfKitFontAssets();
  const reportPath = getFixtureReportFilePath(fixture.id);

  // A4: 595.28 × 841.89 pt
  const PW = 595.28;
  const PH = 841.89;
  const M = 40;                   // margin
  const CW = PW - M * 2;          // content width
  const LINE = 14;                 // standard line height

  const doc = new PDFDocument({ size: 'A4', margin: M, autoFirstPage: true });
  const stream = fs.createWriteStream(reportPath);
  doc.pipe(stream);

  let y = 0;

  // ── helpers ────────────────────────────────────────────────────────────────

  function ensureSpace(needed: number) {
    if (y + needed > PH - 60) {
      doc.addPage();
      y = M;
    }
  }

  function rule(color = '#e0e0e0') {
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(color).lineWidth(0.5).stroke();
  }

  function sectionTitle(title: string) {
    ensureSpace(30);
    y += 10;
    rule('#cccccc');
    y += 7;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#333333')
      .text(title, M, y, { characterSpacing: 1.2 });
    y += LINE + 4;
  }

  // ── HEADER BAND ───────────────────────────────────────────────────────────

  doc.rect(0, 0, PW, 72).fill('#0d0d0d');

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#00c45a')
    .text('CCI FOOTBALL', M, 16, { width: CW, align: 'center', characterSpacing: 3 });

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
    .text('MATCH REPORT', M, 30, { width: CW, align: 'center' });

  y = 88;

  // ── META ROW ──────────────────────────────────────────────────────────────

  const metaParts: string[] = [
    formatDate(new Date(fixture.date)),
    fixture.kickOffTime,
    fixture.venue,
  ];
  if (fixture.matchday) metaParts.push(fixture.matchday);
  if (fixture.tournamentStage) metaParts.push(fixture.tournamentStage);

  doc.font('Helvetica').fontSize(8).fillColor('#888888')
    .text(metaParts.join('   ·   '), M, y, { width: CW, align: 'center' });

  y += 20;

  // ── SCORE CARD ────────────────────────────────────────────────────────────

  const cardH = 88;
  const third = CW / 3;

  // Card background
  doc.roundedRect(M, y, CW, cardH, 6).fill('#f7f7f7');

  // Home team
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111')
    .text(fixture.homeTeam.toUpperCase(), M + 8, y + 14, {
      width: third - 16, align: 'center', ellipsis: true,
    });

  // Score
  const score = `${fixture.scoreAt90Home ?? 0}  –  ${fixture.scoreAt90Away ?? 0}`;
  doc.font('Helvetica-Bold').fontSize(32).fillColor('#111111')
    .text(score, M + third, y + 8, { width: third, align: 'center' });

  // HT score
  const htScore = `HT  ${fixture.scoreAtHalfTimeHome ?? 0} – ${fixture.scoreAtHalfTimeAway ?? 0}`;
  doc.font('Helvetica').fontSize(8).fillColor('#999999')
    .text(htScore, M + third, y + 52, { width: third, align: 'center' });

  if (fixture.extraTimePlayed) {
    const etScore = `AET  ${fixture.scoreAfterExtraTimeHome ?? 0} – ${fixture.scoreAfterExtraTimeAway ?? 0}`;
    doc.font('Helvetica').fontSize(7).fillColor('#aaaaaa')
      .text(etScore, M + third, y + 64, { width: third, align: 'center' });
  }

  // FT pill
  const pillX = M + third + third / 2 - 16;
  doc.roundedRect(pillX, y + 68, 32, 12, 3).fill('#333333');
  doc.font('Helvetica-Bold').fontSize(6).fillColor('#ffffff')
    .text('FULL TIME', pillX, y + 71, { width: 32, align: 'center', characterSpacing: 0.5 });

  // Away team
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111')
    .text(fixture.awayTeam.toUpperCase(), M + third * 2 + 8, y + 14, {
      width: third - 16, align: 'center', ellipsis: true,
    });

  y += cardH + 10;

  // Man of the match
  if (fixture.manOfTheMatch) {
    doc.font('Helvetica').fontSize(8).fillColor('#888888')
      .text('Man of the Match   ', M, y, { continued: true })
      .font('Helvetica-Bold').fillColor('#333333')
      .text(fixture.manOfTheMatch, { align: 'left' });
    y += 16;
  }

  // ── LINEUPS ───────────────────────────────────────────────────────────────

  sectionTitle('LINEUPS');

  const homeLineups = fixture.lineups.filter((l) => l.side === 'home');
  const awayLineups = fixture.lineups.filter((l) => l.side === 'away');
  const homeStarters = homeLineups.filter((l) => l.role === 'starter');
  const homeSubs = homeLineups.filter((l) => l.role !== 'starter');
  const awayStarters = awayLineups.filter((l) => l.role === 'starter');
  const awaySubs = awayLineups.filter((l) => l.role !== 'starter');

  const colW = (CW - 12) / 2;
  const col2X = M + colW + 12;

  // Column headers
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#222222')
    .text(fixture.homeTeam, M, y, { width: colW })
    .text(fixture.awayTeam, col2X, y, { width: colW });
  y += LINE;

  function renderLineupGroup(label: string, home: MatchLineup[], away: MatchLineup[]) {
    if (home.length === 0 && away.length === 0) return;
    ensureSpace(LINE * (Math.max(home.length, away.length) + 2));

    doc.font('Helvetica').fontSize(7).fillColor('#aaaaaa')
      .text(label, M, y)
      .text(label, col2X, y);
    y += 11;

    const max = Math.max(home.length, away.length);
    for (let i = 0; i < max; i++) {
      ensureSpace(LINE);
      const hp = home[i];
      const ap = away[i];
      const rowY = y;

      if (hp) {
        const num = hp.player.jerseyNumber != null ? `${hp.player.jerseyNumber}.  ` : '';
        const pos = hp.position ? `  ${hp.position}` : '';
        doc.font('Helvetica').fontSize(9).fillColor('#222222')
          .text(`${num}${hp.player.fullName}`, M, rowY, { width: colW - 4 });
        if (hp.position) {
          doc.font('Helvetica').fontSize(7).fillColor('#999999')
            .text(pos, M, rowY + 9, { width: colW - 4 });
        }
      }

      if (ap) {
        const num = ap.player.jerseyNumber != null ? `${ap.player.jerseyNumber}.  ` : '';
        const pos = ap.position ? `  ${ap.position}` : '';
        doc.font('Helvetica').fontSize(9).fillColor('#222222')
          .text(`${num}${ap.player.fullName}`, col2X, rowY, { width: colW - 4 });
        if (ap.position) {
          doc.font('Helvetica').fontSize(7).fillColor('#999999')
            .text(pos, col2X, rowY + 9, { width: colW - 4 });
        }
      }

      y += hp?.position || ap?.position ? 20 : LINE;
    }

    y += 4;
  }

  renderLineupGroup('STARTING XI', homeStarters, awayStarters);
  renderLineupGroup('SUBSTITUTES', homeSubs, awaySubs);

  if (fixture.lineups.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor('#aaaaaa').text('No lineup recorded.', M, y);
    y += LINE;
  }

  // ── MATCH EVENTS ──────────────────────────────────────────────────────────

  sectionTitle('MATCH EVENTS');

  if (fixture.events.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor('#aaaaaa').text('No events recorded.', M, y);
    y += LINE;
  } else {
    const sorted = [...fixture.events].sort((a, b) => a.minute - b.minute);

    // Column widths for event rows
    const minW = 28;   // minute
    const badgeW = 58; // event type badge
    const descW = CW - minW - badgeW - 60; // description
    const teamW = 60;  // team name (right-aligned)

    // Header row
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#aaaaaa')
      .text("MIN", M, y, { width: minW })
      .text("TYPE", M + minW, y, { width: badgeW })
      .text("DETAIL", M + minW + badgeW, y, { width: descW })
      .text("TEAM", M + minW + badgeW + descW, y, { width: teamW, align: 'right' });
    y += 12;
    rule('#e8e8e8');
    y += 6;

    for (const event of sorted) {
      ensureSpace(LINE + 4);

      // ── Half Time separator ────────────────────────────────────────────────
      if (event.type === 'half_time') {
        y += 2;
        // Shaded band
        doc.rect(M, y, CW, 18).fill('#f0f0f0');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#555555')
          .text(`HALF TIME   —   ${event.minute}'`, M, y + 5, { width: CW, align: 'center', characterSpacing: 1 });
        y += 24;
        continue;
      }

      const isHome = event.side === 'home';
      const label = EVENT_TYPE_LABEL[event.type] ?? event.type.toUpperCase();
      const color = EVENT_TYPE_COLOR[event.type] ?? '#555555';
      const desc = buildEventDescription(event);
      const teamName = isHome ? fixture.homeTeam : fixture.awayTeam;
      const rowY = y;

      // Minute
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333')
        .text(`${event.minute}'`, M, rowY, { width: minW });

      // Event type label
      doc.font('Helvetica-Bold').fontSize(7).fillColor(color)
        .text(label, M + minW, rowY + 1, { width: badgeW });

      // Description
      doc.font('Helvetica').fontSize(9).fillColor('#333333')
        .text(desc, M + minW + badgeW, rowY, { width: descW, ellipsis: true });

      // Team
      doc.font('Helvetica').fontSize(8).fillColor(isHome ? '#1a5c1a' : '#555555')
        .text(teamName, M + minW + badgeW + descW, rowY, { width: teamW, align: 'right', ellipsis: true });

      y += LINE + 2;
    }
  }

  // ── PLAYER STATISTICS ─────────────────────────────────────────────────────

  if (fixture.stats && fixture.stats.length > 0) {
    sectionTitle('PLAYER STATISTICS');

    const playerW = 190;
    const teamW2 = 100;
    const statW = 40;

    // Table header
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#aaaaaa')
      .text('PLAYER', M, y, { width: playerW })
      .text('TEAM', M + playerW, y, { width: teamW2 })
      .text('GOALS', M + playerW + teamW2, y, { width: statW, align: 'center' })
      .text('ASSISTS', M + playerW + teamW2 + statW, y, { width: statW, align: 'center' })
      .text('YC', M + playerW + teamW2 + statW * 2, y, { width: statW / 2, align: 'center' })
      .text('RC', M + playerW + teamW2 + statW * 2 + statW / 2, y, { width: statW / 2, align: 'center' });
    y += 12;
    rule('#e8e8e8');
    y += 6;

    for (const stat of fixture.stats) {
      ensureSpace(LINE + 2);
      const hasNoteworthy = stat.goals > 0 || stat.assists > 0 || stat.yellowCards > 0 || stat.redCards > 0;
      const nameColor = hasNoteworthy ? '#111111' : '#555555';

      doc.font(hasNoteworthy ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(nameColor)
        .text(stat.name, M, y, { width: playerW, ellipsis: true });
      doc.font('Helvetica').fontSize(9).fillColor('#777777')
        .text(stat.team, M + playerW, y, { width: teamW2, ellipsis: true });

      const v = (n: number, highlight: string) =>
        doc.font(n > 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .fillColor(n > 0 ? highlight : '#aaaaaa');

      v(stat.goals, '#1a5c1a')
        .text(String(stat.goals), M + playerW + teamW2, y, { width: statW, align: 'center' });
      v(stat.assists, '#1a3a7a')
        .text(String(stat.assists), M + playerW + teamW2 + statW, y, { width: statW, align: 'center' });
      v(stat.yellowCards, '#7a6600')
        .text(String(stat.yellowCards), M + playerW + teamW2 + statW * 2, y, { width: statW / 2, align: 'center' });
      v(stat.redCards, '#7a1a1a')
        .text(String(stat.redCards), M + playerW + teamW2 + statW * 2 + statW / 2, y, { width: statW / 2, align: 'center' });

      y += LINE + 2;
    }
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────

  const footerY = PH - 36;
  doc.moveTo(M, footerY).lineTo(M + CW, footerY).strokeColor('#dddddd').lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(7).fillColor('#bbbbbb')
    .text(`Generated ${formatDate(new Date())}`, M, footerY + 8, { width: CW / 2 })
    .text('CCI Football  ·  Match Report', M + CW / 2, footerY + 8, {
      width: CW / 2, align: 'right',
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return reportPath;
}
