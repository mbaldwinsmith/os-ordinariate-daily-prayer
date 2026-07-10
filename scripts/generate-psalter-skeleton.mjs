#!/usr/bin/env node
// Generates the 28-day (4 week x 7 day) psalter skeleton required by
// TASKS.md Phase 5. This is a BEST-EFFORT, UNVERIFIED reconstruction (no
// GitHub-reachable authoritative breviary index exists in this session's
// network sandbox - see SOURCES.md) rather than a transcription of the
// official assignment, so every generated file is marked "verified": false.
//
// Approach, since hand-recalling all 140 exact slot assignments with
// confidence isn't realistic:
//  - The real, well-established fact that the *whole* 150-psalm Psalter
//    (minus the three imprecatory psalms 58, 83, 109, which the 1971 reform
//    omits entirely) is prayed exactly once over four weeks is used to
//    drive a systematic sequential distribution across Office of Readings/
//    Lauds/Daytime Prayer/Vespers - not the official day-by-day pairing,
//    which needs verification (Phase 6).
//  - Psalm 119 (22 x 8-verse sections) is spread across Daytime Prayer.
//  - The OT/Lauds and NT/Vespers variable canticles use the real,
//    known set of scripture references the reformed Liturgy of the Hours
//    actually draws on, cycled across the weekdays - the exact week/day
//    pairing is what needs Phase 6 verification, not the reference list
//    itself.
//  - Compline uses a single fixed weekly (not four-weekly) rotation.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DATA_ROOT = fileURLToPath(new URL('../data/psalter', import.meta.url));

const psalm = (ref) => ({ type: 'psalm', ref: `Ps ${ref}` });
const canticle = (scriptureRef, name) => ({ type: 'canticle', scriptureRef, name });
const benedicite = () => ({ type: 'canticle', fixedId: 'benedicite' });

// All usable psalms (1-150 minus the three imprecatory psalms the reform
// omits entirely) minus 119, which is handled separately below.
const USABLE_PSALMS = Array.from({ length: 150 }, (_, i) => i + 1).filter(
  (n) => n !== 58 && n !== 83 && n !== 109 && n !== 119,
);

// The real set of Old Testament canticles the reformed Liturgy of the Hours
// draws on for weekday Lauds (Sunday uses Benedicite instead - see below).
const OT_CANTICLES = [
  ['Ex 15:1-13, 17-18', 'Canticle of Moses'],
  ['1 Sm 2:1-10', 'Canticle of Hannah'],
  ['Dt 32:1-12', 'Canticle of Moses (Deuteronomy)'],
  ['Is 45:15-25', 'Canticle of Isaiah'],
  ['1 Chr 29:10-13', 'Canticle of David'],
  ['Tb 13:1-8', 'Canticle of Tobit'],
  ['Jdt 16:2-3, 13-15', 'Canticle of Judith'],
];

// The real set of New Testament canticles the reformed Liturgy of the Hours
// draws on for Vespers.
const NT_CANTICLES = [
  ['Eph 1:3-10', 'Canticle of Ephesians'],
  ['Col 1:12-20', 'Canticle of Colossians'],
  ['Rv 4:11, 5:9-10, 5:12', 'Canticle of Revelation (the Lamb)'],
  ['Phil 2:6-11', 'Canticle of Philippians'],
  ['1 Tm 3:16', 'Canticle of Timothy'],
  ['1 Pt 2:21-24', 'Canticle of Peter'],
  ['Rv 11:17-18, 12:10-12', 'Canticle of Revelation (the Kingdom)'],
];

// Fixed weekly (NOT four-weekly) Compline rotation.
const COMPLINE_BY_DAY = {
  sunday: [psalm('91')],
  monday: [psalm('86')],
  tuesday: [psalm('143:1-11')],
  wednesday: [psalm('31:1-6')],
  thursday: [psalm('16')],
  friday: [psalm('88')],
  saturday: [psalm('4'), psalm('134')],
};

// Psalm 119's 22 eight-verse sections, spread across Daytime Prayer.
const PS119_SECTIONS = Array.from({ length: 22 }, (_, i) => {
  const start = i * 8 + 1;
  return psalm(`119:${start}-${start + 7}`);
});

// 10 variable psalm slots/day (OR 3 + Lauds 2 + Daytime 3 + Vespers 2) across
// 28 days is 280 slots total - far more than the 146 usable psalms, since
// real practice splits many psalms into portions reused across slots rather
// than using each psalm exactly once. A cycling cursor (not a
// once-through pool) reflects that without ever running out.
function makeCycler(items) {
  let cursor = 0;
  return () => items[cursor++ % items.length];
}

function buildWeek(weekNumber, nextPsalm, nextPs119Section) {
  const week = {};
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayName = DAYS[dayIndex];
    const take = (n) => Array.from({ length: n }, () => psalm(nextPsalm()));

    const lauds = {
      psalmody: [
        ...take(1),
        dayName === 'sunday'
          ? benedicite()
          : (() => {
              const [ref, name] = OT_CANTICLES[(weekNumber - 1 + dayIndex) % OT_CANTICLES.length];
              return canticle(ref, name);
            })(),
        ...take(1),
      ],
    };

    const vespers = {
      psalmody: [
        ...take(2),
        (() => {
          const [ref, name] = NT_CANTICLES[(weekNumber - 1 + dayIndex) % NT_CANTICLES.length];
          return canticle(ref, name);
        })(),
      ],
    };

    const officeOfReadings = { psalmody: take(3) };
    const daytimePrayer = { psalmody: [nextPs119Section(), ...take(2)] };

    week[dayName] = {
      verified: false,
      officeOfReadings,
      lauds,
      daytimePrayer,
      vespers,
      compline: { psalmody: COMPLINE_BY_DAY[dayName] },
    };
  }
  return week;
}

async function main() {
  const nextPsalm = makeCycler(USABLE_PSALMS);
  const nextPs119Section = makeCycler(PS119_SECTIONS);

  for (let weekNumber = 1; weekNumber <= 4; weekNumber++) {
    const week = buildWeek(weekNumber, nextPsalm, nextPs119Section);
    const weekDir = `${DATA_ROOT}/week${weekNumber}`;
    await mkdir(weekDir, { recursive: true });
    for (const [dayName, dayContent] of Object.entries(week)) {
      await writeFile(`${weekDir}/${dayName}.json`, JSON.stringify(dayContent, null, 2) + '\n');
    }
  }

  console.log('Wrote 28 psalter skeleton files across data/psalter/week{1,2,3,4}/.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
