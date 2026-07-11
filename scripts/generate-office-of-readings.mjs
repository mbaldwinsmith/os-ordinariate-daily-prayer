#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-office-of-readings.json`, 'utf8'));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SEASONS = { ordinaryTime: 34, advent: 4, lent: 5, easter: 7 };
function fallbackReading(assignment) {
  const ref = assignment.refs[0];
  return { ref: ref.match(/^(.+? \d+)/)?.[1] ?? ref };
}

for (const year of ['I', 'II']) {
  for (const [season, weekCount] of Object.entries(SEASONS)) {
    for (let week = 1; week <= weekCount; week++) {
      const dir = `${ROOT}/data/office-of-readings/year${year}/${season}/week${week}`;
      await mkdir(dir, { recursive: true });
      for (const day of DAYS) {
        const assignment = canonical.entries[`${season}:week${week}:${day}`];
        const existing = JSON.parse(await readFile(`${dir}/${day}.json`, 'utf8'));
        const renderable = assignment && assignment.renderable !== false;
        const content = renderable ? {
          verified: true,
          scriptureReading: assignment.refs.length === 1 ? { ref: assignment.refs[0] } : { refs: assignment.refs },
          patristicReading: null,
        } : assignment ? { verified: false, scriptureReading: fallbackReading(assignment), patristicReading: null } : { ...existing, verified: false };
        await writeFile(`${dir}/${day}.json`, `${JSON.stringify(content, null, 2)}\n`);
      }
    }
  }
}

console.log('Generated both calendar-year directories from the printed one-year Office of Readings cycle; uncovered slots remain unverified.');
