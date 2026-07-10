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
const shortReading = (ref) => ({ ref, verified: false });

// Factual reference assignments transcribed from the page-referenced four-week
// psalter in rosangmin-code/divine-office (Lauds/Vespers), DivineOffice.org's
// published Midday Prayer pages (Daytime), and the same repository's Compline
// ordinarium. Only references are used; displayed prose comes from our DRC data.
// See SOURCES.md for provenance and the reason these remain verified:false.
const SHORT_READINGS = [
  {
    sunday: ['Rv 7:9-12', 'Gal 6:7-8', '2 Cor 1:3-7'],
    monday: ['2 Thes 3:10-13', 'Jas 1:19-20, 26', 'Col 1:9-13'],
    tuesday: ['Rom 13:11-14', 'Prv 3:13-15', '1 Jn 3:1-3'],
    wednesday: ['Tb 4:15-16, 18-19', '1 Pt 1:15-16', 'Jas 1:19-25'],
    thursday: ['Is 66:1-2', 'Am 5:8-9', '1 Pt 1:6-9'],
    friday: ['Eph 4:29-32', '2 Cor 13:4', 'Rom 15:1-6'],
    saturday: ['2 Pt 1:10-11', 'Jer 17:9-10', '2 Cor 1:3-7'],
  },
  {
    sunday: ['Ez 36:25-28', 'Rom 8:26', '2 Thes 2:13-14'],
    monday: ['Jer 15:15-16', 'Jer 32:40', '1 Thes 2:11-14'],
    tuesday: ['1 Thes 5:2-6', '1 Cor 12:12-13', 'Rom 3:21-26'],
    wednesday: ['Rom 8:35-39', 'Is 55:8-9', '1 Pt 5:5-11'],
    thursday: ['Rom 14:12-13, 17-19', 'Gal 5:16-17', '1 Pt 1:18-23'],
    friday: ['Eph 2:13-16', 'Bar 4:28-29', '1 Cor 2:6-10'],
    saturday: ['Rom 12:13-21', '1 Kgs 2:2-3', '2 Thes 2:13-14'],
  },
  {
    sunday: ['Ez 37:12-14', 'Rom 8:22-23', '1 Pt 1:3-7'],
    monday: ['Jas 2:12-17', 'Rom 6:22', 'Jas 4:11-12'],
    tuesday: ['1 Jn 4:12-15', 'Dt 15:7-8', 'Rom 12:9-12'],
    wednesday: ['Jb 1:21, 2:10', '1 Cor 13:8-9, 13', 'Eph 3:17-21'],
    thursday: ['1 Pt 4:8-11', 'Dt 4:7', '1 Pt 3:8-12'],
    friday: ['2 Cor 12:7-10', 'Rom 3:21-22', 'Jas 1:2-8'],
    saturday: ['Phil 2:2-4, 14-16', 'Gal 5:26, 6:2', '1 Pt 1:3-7'],
  },
  {
    sunday: ['2 Tm 2:8, 11-13', 'Dt 10:12', 'Heb 12:22-24'],
    monday: ['Jdt 8:25-27', 'Wis 15:1, 3', '1 Thes 3:12-13'],
    tuesday: ['Is 55:1-3', 'Dt 30:11, 14', 'Col 3:15-17'],
    wednesday: ['Dt 4:39-40', 'Col 3:17', '1 Jn 2:3-6'],
    thursday: ['Rom 8:18-21', 'Wis 1:1-2', 'Col 1:21-23'],
    friday: ['Gal 2:16, 19-20', '1 Jn 3:16', 'Rom 8:1-2, 10-11'],
    saturday: ['2 Pt 3:13-15', 'Rom 15:5-7', 'Heb 12:22-24'],
  },
];

const COMPLINE_SHORT_READINGS = {
  sunday: 'Rv 22:4-5', monday: '1 Thes 5:9-10', tuesday: '1 Pt 5:8-9',
  wednesday: 'Eph 4:26-27', thursday: '1 Thes 5:23', friday: 'Jer 14:9',
  saturday: 'Dt 6:4-7',
};

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
    const [laudsReading, daytimeReading, vespersReading] = SHORT_READINGS[weekNumber - 1][dayName];
    const take = (n) => Array.from({ length: n }, () => psalm(nextPsalm()));

    const lauds = {
      shortReading: shortReading(laudsReading),
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
      shortReading: shortReading(vespersReading),
      psalmody: [
        ...take(2),
        (() => {
          const [ref, name] = NT_CANTICLES[(weekNumber - 1 + dayIndex) % NT_CANTICLES.length];
          return canticle(ref, name);
        })(),
      ],
    };

    const officeOfReadings = { psalmody: take(3) };
    const daytimePrayer = {
      psalmody: [nextPs119Section(), ...take(2)],
      shortReading: shortReading(daytimeReading),
    };

    week[dayName] = {
      verified: false,
      officeOfReadings,
      lauds,
      daytimePrayer,
      vespers,
      compline: {
        psalmody: COMPLINE_BY_DAY[dayName],
        shortReading: shortReading(COMPLINE_SHORT_READINGS[dayName]),
      },
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
