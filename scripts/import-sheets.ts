import './load-env';
import { readdir, readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { getDb, trips } from '../db';
import { formatMiles, formatOdometer } from '../lib/odometer';

/*
 * Backfill the log from submitted mileage workbooks.
 *
 *   npm run db:import -- ~/path/to/sheets
 *
 * Reads every .xlsx in that directory and upserts one row per logged day. The
 * workbooks are deliberately not kept in this repo — they are personal records
 * and *.xlsx is gitignored — so this takes a path rather than shipping the data
 * as a committed seed. Re-runnable: it keys on the date and updates in place.
 *
 * Runs locally only; nothing on Vercel invokes it.
 */

/* The template's log body, unchanged across every month submitted so far. */
const FIRST_ROW = 7;
const LAST_ROW = 40; // generous; the template ends at 31
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

/* ── A minimal zip reader, so this needs no dependency ──────────────────── */

function readZipEntry(buf: Buffer, wanted: string): Buffer {
  const EOCD = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i -= 1) {
    if (buf.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');

  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);

  for (let n = 0; n < count; n += 1) {
    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (name === wanted) {
      /* The local header repeats the name and extra fields at its own lengths. */
      const localNameLength = buf.readUInt16LE(localOffset + 26);
      const localExtraLength = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const data = buf.subarray(start, start + compressedSize);
      return method === 0 ? Buffer.from(data) : inflateRawSync(data);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`no ${wanted} inside the workbook`);
}

/* ── Just enough of the sheet XML ───────────────────────────────────────── */

type Cell = { type: string | null; value: string };

function cells(xml: string): Map<string, Cell> {
  const grid = new Map<string, Cell>();
  const pattern = /<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

  for (const match of xml.matchAll(pattern)) {
    const [, ref, attributes, body] = match;
    if (!body) continue;
    const value = /<v>([^<]*)<\/v>/.exec(body);
    if (!value) continue;
    grid.set(ref, { type: /\st="([^"]+)"/.exec(attributes)?.[1] ?? null, value: value[1] });
  }

  return grid;
}

function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
    [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join(''),
  );
}

/** Excel serial to ISO date. Serial 46266 is 2026-09-01. */
function toIsoDate(serial: string): string {
  return new Date(EXCEL_EPOCH_UTC + Math.round(Number(serial)) * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/*
 * A date cell Excel stored as text rather than a date.
 *
 * JUL.xlsx has one: '7/31:26', a colon typed for the second slash, which left
 * the cell as a string and the day without a serial. Its 6.3 miles still
 * counted in F33 because column F only subtracts C from E, so the workbook
 * totals correctly while carrying a day the date column cannot describe.
 * Any separator is accepted; a two-digit year is 2000s.
 */
function fromTextDate(text: string): string | null {
  const match = /^\s*(\d{1,2})\D(\d{1,2})\D(\d{2}|\d{4})\s*$/.exec(text);
  if (!match) return null;

  const [, m, d, y] = match;
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  const iso = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  /* Round-trips only for a real calendar date, so 13/40 cannot slip through. */
  return new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) === iso ? iso : null;
}

/**
 * A cell value to integer tenths, rounding rather than truncating.
 *
 * This is the one place that differs from parseTenths() in lib/odometer.ts,
 * which truncates because a second decimal from a person is a fat finger. Here
 * the extra digits are float drift in the workbook itself — 96534.399999999994
 * is a stored 96534.4, and truncating would file it as 96534.3. Rounding to the
 * nearest tenth recovers the intended value, and at six digits a double has
 * many orders of magnitude of headroom to do it exactly.
 */
function toTenths(raw: string): number {
  return Math.round(Number(raw) * 10);
}

type Row = { date: string; startTenths: number; endTenths: number | null };

function readWorkbook(buf: Buffer, label: string): Row[] {
  const grid = cells(readZipEntry(buf, 'xl/worksheets/sheet1.xml').toString('utf8'));
  let strings: string[] = [];
  try {
    strings = sharedStrings(readZipEntry(buf, 'xl/sharedStrings.xml').toString('utf8'));
  } catch {
    /* A workbook with no text cells at all has no sharedStrings part. */
  }

  const rows: Row[] = [];

  for (let r = FIRST_ROW; r <= LAST_ROW; r += 1) {
    const date = grid.get(`A${r}`);
    const start = grid.get(`C${r}`);
    /* A row is a logged day only once it has a date and a starting reading. */
    if (!date || !start || start.type === 's') continue;

    let iso: string | null;
    if (date.type === 's') {
      iso = fromTextDate(strings[Number(date.value)] ?? '');
      if (iso) {
        console.log(`    ${label} row ${r}: date "${strings[Number(date.value)]}" read as ${iso}`);
      } else {
        console.warn(
          `    ${label} row ${r}: SKIPPED — cannot read the date ` +
            `"${strings[Number(date.value)] ?? ''}" (readings ${start.value} -> ${grid.get(`E${r}`)?.value ?? 'none'})`,
        );
        continue;
      }
    } else {
      iso = toIsoDate(date.value);
    }

    const end = grid.get(`E${r}`);
    rows.push({
      date: iso,
      startTenths: toTenths(start.value),
      endTenths: end && end.type !== 's' ? toTenths(end.value) : null,
    });
  }

  return rows;
}

/*
 * Several trips on one date collapse into one row: earliest start, latest end.
 *
 * The sheets do log a date more than once — FEB has four trips on 19 February
 * and MAR two on the 5th — but this app stores one row per day, so they have to
 * come together. Odometer readings only ever rise, so the lowest start and
 * highest end bound the day.
 *
 * This deliberately reads high. Feb 19's four trips total 9.4 miles; bounding
 * the day gives 11.2, because the span includes the driving between trips that
 * the separate rows excluded. The submitted sheets remain the record of what
 * was actually claimed; these rows are history, and the divergence is reported
 * at the end of the run.
 */
function merge(byDate: Map<string, Row>, row: Row): void {
  const existing = byDate.get(row.date);
  if (!existing) {
    byDate.set(row.date, row);
    return;
  }

  existing.startTenths = Math.min(existing.startTenths, row.startTenths);
  existing.endTenths =
    existing.endTenths == null || row.endTenths == null
      ? (existing.endTenths ?? row.endTenths)
      : Math.max(existing.endTenths, row.endTenths);
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: npm run db:import -- <directory of .xlsx workbooks>');
    process.exit(1);
  }

  const files = (await readdir(dir)).filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$')).sort();
  if (files.length === 0) {
    console.error(`No .xlsx workbooks in ${dir}`);
    process.exit(1);
  }

  const byDate = new Map<string, Row>();
  /** What the workbooks themselves total, before any merging. */
  let sheetTenths = 0;
  let sheetRows = 0;
  for (const file of files) {
    const rows = readWorkbook(await readFile(path.join(dir, file)), file);
    const miles = rows.reduce((sum, r) => sum + (r.endTenths == null ? 0 : r.endTenths - r.startTenths), 0);
    sheetTenths += miles;
    sheetRows += rows.length;
    console.log(`  ${file.padEnd(10)} ${String(rows.length).padStart(2)} rows  ${formatMiles(miles).padStart(7)} mi`);
    for (const row of rows) merge(byDate, row);
  }

  const rows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const db = getDb();

  for (const row of rows) {
    await db
      .insert(trips)
      .values(row)
      .onConflictDoUpdate({
        target: trips.date,
        set: {
          startTenths: row.startTenths,
          endTenths: row.endTenths,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  const stored = await db.select().from(trips);
  const total = stored.reduce((sum, r) => sum + (r.endTenths == null ? 0 : r.endTenths - r.startTenths), 0);
  const open = stored.filter((r) => r.endTenths == null).length;

  console.log(
    `\nWorkbooks: ${sheetRows} rows, ${formatMiles(sheetTenths)} mi.` +
      `\nImported:  ${rows.length} days, ${formatMiles(rows.reduce((s, r) => s + (r.endTenths == null ? 0 : r.endTenths - r.startTenths), 0))} mi` +
      ` (${sheetRows - rows.length} same-day trips merged).`,
  );
  console.log(`\nThe log now holds ${stored.length} days, ${formatMiles(total)} mi${open ? `, ${open} still open` : ''}.`);
  if (stored.length > 0) {
    const latest = stored.reduce((a, b) => (a.date > b.date ? a : b));
    console.log(`Latest reading ${formatOdometer(latest.endTenths ?? latest.startTenths)} on ${latest.date}.`);
  }
}

main().catch((error: unknown) => {
  console.error('Import failed:', error);
  process.exit(1);
});
